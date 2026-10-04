// 真实宿主集成测试：独立 DSH_HOME + djian profile + 整合包补丁，启动真实 dsh（不调用收费模型）。
// 用法：node tests/integration/dsh-host.mjs <@deepseek-ai/dsh 安装目录（需同目录装好 dsh-base/dsh-web-app）>
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL, fileURLToPath } from 'node:url';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { startEngine } from '../helpers/engine.mjs';

// 假模型：兼容 OpenAI chat/completions 流式接口，记录每次请求体（不调用任何收费模型）
const requests = [];
const fakeLlm = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    try { requests.push(JSON.parse(body)); } catch { requests.push({ raw: body }); }
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    const chunk = (delta, finish) => 'data: ' + JSON.stringify({ id: 'x', object: 'chat.completion.chunk', created: 1, model: 'glm-5.3-flash', choices: [{ index: 0, delta, finish_reason: finish }], ...(finish ? { usage: { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 } } : {}) }) + '\n\n';
    res.write(chunk({ role: 'assistant', content: '好的' }, null));
    res.write(chunk({}, 'stop'));
    res.end('data: [DONE]\n\n');
  });
});
await new Promise((r) => fakeLlm.listen(0, '127.0.0.1', r));
const llmPort = fakeLlm.address().port;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cliDir = path.resolve(process.argv[2] ?? '');
assert(fs.existsSync(path.join(cliDir, 'lib/profile-boot.js')), '请传入 @deepseek-ai/dsh 包目录');

const engine = await startEngine();
process.env.DSHL_SERVICE_PORTS = JSON.stringify({ 'djian-engine': engine.port });
const home = fs.mkdtempSync(path.join(os.tmpdir(), 'djian-dsh-host-'));
const profile = path.join(home, 'profiles', 'djian');
fs.mkdirSync(profile, { recursive: true });
fs.writeFileSync(path.join(profile, 'package.json'), JSON.stringify({ name: 'dsh-profile-djian', private: true, dependencies: {}, dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app'] } } }, null, 2));
fs.copyFileSync(path.join(ROOT, 'packages/pack/src/overrides/cordis.patch.yml'), path.join(profile, 'cordis.patch.yml'));
// 测试叠加补丁：把模型地址指向本地假模型（整行重述 config）
const testPatch = path.join(home, 'test.patch.yml');
fs.writeFileSync(testPatch, fs.readFileSync(path.join(ROOT, 'packages/pack/src/overrides/cordis.patch.yml'), 'utf8').split('\n- id: agent-default-model')[0].replace('https://open.bigmodel.cn/api/coding/paas/v4', 'http://127.0.0.1:' + llmPort + '/v1').split('# ---- 模型路由')[1].replace(/^[^\n]*\n/, ''));
// 模拟 DSHL 的 vendor 直挂：把本地包按 files 字段铺进 profile node_modules
for (const [dir, name] of [['host-bridge', '@djian/host-bridge'], ['client-timeline', '@djian/client-ui-timeline'], ['client-library', '@djian/client-ui-library']]) {
  const src = path.join(ROOT, 'packages', dir);
  const dest = path.join(profile, 'node_modules', ...name.split('/'));
  fs.mkdirSync(dest, { recursive: true });
  const pkg = JSON.parse(fs.readFileSync(path.join(src, 'package.json'), 'utf8'));
  fs.copyFileSync(path.join(src, 'package.json'), path.join(dest, 'package.json'));
  for (const entry of pkg.files ?? []) {
    const base = entry.replace(/\/\*\*.*$/, '');
    if (fs.existsSync(path.join(src, base))) fs.cpSync(path.join(src, base), path.join(dest, base), { recursive: true });
  }
}

// DSHL 把 home/skills 摘到 profile/.dsh/skills（工程级技能）
fs.cpSync(path.join(ROOT, 'packages/pack/src/home/skills'), path.join(profile, '.dsh', 'skills'), { recursive: true });
const previous = process.cwd();
process.chdir(profile);
process.env.DSH_HOME = home;
process.env.DJIAN_LLM_KEY = 'local-test-key';
const { runProfile } = await import(pathToFileURL(path.join(cliDir, 'lib/profile-boot.js')).href);
const environment = { get: (n) => (process.env[n] === undefined ? undefined : { value: process.env[n] }), getFrom: (n) => (process.env[n] === undefined ? undefined : { value: process.env[n] }) };
const saved = console.log;
const logs = [];
console.log = (...a) => logs.push(a.join(' '));
let app;
let failed = false;
try {
  app = await runProfile({ profile: 'djian', patchFiles: [testPatch], args: ['--no-open', '--port', '0'], environment });
  const tools = app.ctx.get('tools');
  assert(tools, 'tools 服务不可用');
  const names = tools.schemas().map((s) => s.name);
  for (const t of ['djian_timeline', 'djian_apply_ops', 'djian_frame', 'djian_changes']) assert(names.includes(t), '缺少工具 ' + t + '；已注册：' + names.join(','));
  saved('PASS host-bridge 已加载，djian 工具注册通过宿主校验：' + names.filter((n) => n.startsWith('djian_')).join(', '));
  const presets = app.ctx.get('agentPresets');
  if (presets?.compositionInventory) {
    const inv = await presets.compositionInventory();
    const ids = inv.map((p) => p.id ?? p.presetId ?? p.name);
    saved('INFO 预设：' + JSON.stringify(ids));
    assert(ids.includes('djian'), '缺少 djian 预设');
  }
  const exec = { agent: { session: { id: 'host-test' }, options: {} }, signal: new AbortController().signal };
  const r = await tools.get('djian_apply_ops').execute({ ops: [{ op: 'addOverlay', text: '真实宿主', startSeconds: 0, endSeconds: 1 }] }, exec);
  assert.match(r.message, /真实宿主/);
  saved('PASS 宿主内执行 djian_apply_ops：' + r.message.split('\n')[0]);

  // ---- 真实 agent 回合：人格来自 djian 预设；用户在面板的修改进入模型请求 ----
  const sc = app.ctx.get('sessionController');
  assert(sc, 'sessionController 不可用');
  const created = await sc.create({ cwd: profile });
  const sessionId = created.sessionId ?? created.value?.sessionId;
  assert(sessionId, '创建会话失败：' + JSON.stringify(created));
  const waitIdle = () => new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      const a = app.ctx.get('agents')?.get(sessionId);
      if ((a && a.status === 'idle' && Date.now() - started > 500) || Date.now() - started > 30000) resolve();
      else setTimeout(tick, 100);
    };
    setTimeout(tick, 200);
  });
  const prompt = async (text) => { await sc.prompt({ requestId: randomUUID(), sessionId, mode: 'queue', content: [{ type: 'text', text }] }, new AbortController().signal); await waitIdle(); };
  await prompt('你好');
  assert(requests.length >= 1, '假模型没有收到请求');
  // 会话标题等辅助请求也走同一模型：挑出带工具列表的主回合请求
  const mainRequests = () => requests.filter((r) => Array.isArray(r.tools) && r.tools.length);
  assert(mainRequests().length >= 1, '没有收到主回合请求');
  const first = JSON.stringify(mainRequests()[0]);
  assert(first.includes('你是 D剪 的 AI 视频剪辑助手'), '系统提示词不是 D剪 人格：' + first.slice(0, 400));
  assert(first.includes('djian_apply_ops'), '请求里没有 djian 工具');
  assert(first.includes('djian-edit'), '模型看不到 djian-edit 技能');
  saved('PASS 模型请求使用 D剪 人格，带有 djian_* 工具与 djian-edit 技能');
  const pid = (await engine.api('GET', '/api/session-project?sessionId=' + encodeURIComponent(sessionId))).body.project?.id;
  assert(pid, '会话没有绑定项目');
  await engine.api('POST', '/api/p/' + pid + '/ops', { ops: [{ op: 'addOverlay', text: '面板手动加的', startSeconds: 0, endSeconds: 2 }], actor: 'user', clientId: 'panel', label: '手动加字幕' });
  await engine.api('POST', '/api/p/' + pid + '/presence', { clientId: 'panel', actor: 'user', playhead: 1.5, mode: 'subs', selection: [{ kind: 'overlay', id: 'x', label: '面板手动加的', track: 'subs', start: 0, end: 2 }] });
  const before = mainRequests().length;
  await prompt('把这条字幕放大一点');
  const second = JSON.stringify(mainRequests().slice(before));
  assert(second.includes('editor-activity'), '第二回合请求里没有编辑事件');
  assert(second.includes('手动加字幕'), '编辑事件缺少用户修改摘要');
  assert(second.includes('播放头 0:01.50'), '编辑事件缺少播放头');
  saved('PASS 用户在面板的修改与当前选中已作为 <editor-activity> 进入模型请求');
} catch (e) {
  failed = true;
  saved('FAIL ' + (e?.stack ?? e));
  saved(logs.filter((l) => /djian|error|warn|fail/i.test(l)).slice(-30).join('\n'));
} finally {
  if (app) await app.ctx.fiber.dispose();
  console.log = saved;
  process.chdir(previous);
  await engine.stop();
  fakeLlm.close();
  fs.rmSync(home, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
