// 本地联调：用真实 dsh web 宿主 + 整合包补丁 + 假模型跑起 D剪，供浏览器手动/自动化检查面板。
// 用法：node tests/integration/dsh-serve.mjs <@deepseek-ai/dsh 安装目录> [web 端口，默认 7788]
// 假模型：用户消息含「演示」时调用 djian_apply_ops 加一条字幕（演示 AI 与人同时编辑），其余回复“好的”。不调用任何收费模型。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { startEngine, EXAMPLE_VIDEO } from '../helpers/engine.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cliDir = path.resolve(process.argv[2] ?? '');
const webPort = Number(process.argv[3] ?? 7788);
if (!fs.existsSync(path.join(cliDir, 'lib/profile-boot.js'))) { console.error('请传入 @deepseek-ai/dsh 包目录'); process.exit(1); }

let seq = 0;
const fakeLlm = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    let json = {};
    try { json = JSON.parse(body); } catch {}
    const msgs = json.messages ?? [];
    const last = msgs[msgs.length - 1];
    // 本轮用户消息（宿主会在其后追加 <editor-activity> 等快照消息，所以看最后一条助手消息之后的全部用户消息）
    const lastAssistant = msgs.map((m) => m.role).lastIndexOf('assistant');
    const userText = msgs.slice(lastAssistant + 1).filter((m) => m.role === 'user').map((m) => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content ?? ''))).join(' ');
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    const chunk = (delta, finish) => 'data: ' + JSON.stringify({ id: 'x' + seq, object: 'chat.completion.chunk', created: 1, model: 'glm-5.3-flash', choices: [{ index: 0, delta, finish_reason: finish }], ...(finish ? { usage: { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 } } : {}) }) + '\n\n';
    const wantsTool = Array.isArray(json.tools) && json.tools.length && userText.includes('演示') && last?.role !== 'tool';
    if (wantsTool) {
      const args = JSON.stringify({ ops: [{ op: 'addOverlay', text: 'AI 加的字幕 ' + (++seq), startSeconds: 1, endSeconds: 3, kind: 'subtitle' }], label: 'AI 演示：加字幕' });
      res.write(chunk({ role: 'assistant', content: null, tool_calls: [{ index: 0, id: 'call_' + Date.now(), type: 'function', function: { name: 'djian_apply_ops', arguments: args } }] }, null));
      res.write(chunk({}, 'tool_calls'));
    } else {
      res.write(chunk({ role: 'assistant', content: last?.role === 'tool' ? '已加好字幕，你可以在时间线上继续调整。' : '好的' }, null));
      res.write(chunk({}, 'stop'));
    }
    res.end('data: [DONE]\n\n');
  });
});
await new Promise((r) => fakeLlm.listen(0, '127.0.0.1', r));
const llmPort = fakeLlm.address().port;

const engine = await startEngine();
process.env.DSHL_SERVICE_PORTS = JSON.stringify({ 'djian-engine': engine.port });
const home = fs.mkdtempSync(path.join(os.tmpdir(), 'djian-dsh-serve-'));
const profile = path.join(home, 'profiles', 'djian');
fs.mkdirSync(profile, { recursive: true });
fs.writeFileSync(path.join(profile, 'package.json'), JSON.stringify({ name: 'dsh-profile-djian', private: true, dependencies: {}, dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app'] } } }, null, 2));
fs.copyFileSync(path.join(ROOT, 'packages/pack/src/overrides/cordis.patch.yml'), path.join(profile, 'cordis.patch.yml'));
const testPatch = path.join(home, 'test.patch.yml');
fs.writeFileSync(testPatch, fs.readFileSync(path.join(ROOT, 'packages/pack/src/overrides/cordis.patch.yml'), 'utf8').split('\n- id: agent-default-model')[0].replace('https://open.bigmodel.cn/api/coding/paas/v4', 'http://127.0.0.1:' + llmPort + '/v1').split('# ---- 模型路由')[1].replace(/^[^\n]*\n/, ''));
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
fs.cpSync(path.join(ROOT, 'packages/pack/src/home/skills'), path.join(profile, '.dsh', 'skills'), { recursive: true });
// 预置一个示例素材，方便直接拖上时间线
process.chdir(profile);
process.env.DSH_HOME = home;
process.env.DJIAN_LLM_KEY = 'local-test-key';
const { runProfile } = await import(pathToFileURL(path.join(cliDir, 'lib/profile-boot.js')).href);
const environment = { get: (n) => (process.env[n] === undefined ? undefined : { value: process.env[n] }), getFrom: (n) => (process.env[n] === undefined ? undefined : { value: process.env[n] }) };
const app = await runProfile({ profile: 'djian', patchFiles: [testPatch], args: ['--no-open', '--port', String(webPort)], environment });
console.log('[serve] 引擎 ' + engine.base + '（数据目录 ' + engine.dataDir + '）');
console.log('[serve] 示例素材：' + EXAMPLE_VIDEO);
console.log('[serve] DSH web 已启动，端口 ' + webPort + '；Ctrl+C 退出');
const stop = async () => {
  try { await app.ctx.fiber.dispose(); } catch {}
  await engine.stop();
  fakeLlm.close();
  fs.rmSync(home, { recursive: true, force: true });
  process.exit(0);
};
process.on('SIGINT', () => void stop());
process.on('SIGTERM', () => void stop());
