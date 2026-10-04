import test from 'node:test';
import assert from 'node:assert/strict';
import { startEngine } from './helpers/engine.mjs';

const engine = await startEngine();
process.env.DSHL_SERVICE_PORTS = JSON.stringify({ 'djian-engine': engine.port });
const { apply, inject } = await import('../packages/host-bridge/index.js');
test.after(() => engine.stop());

// 模拟 cordis 上下文：只实现插件用到的 effect/on/get 与 tools.register
const tools = new Map();
const listeners = new Map();
const ctx = {
  tools: { register: (def) => { tools.set(def.name, def); return () => tools.delete(def.name); } },
  effect: (fn) => fn(),
  on: (event, fn) => { listeners.set(event, fn); return () => {}; },
  get: () => undefined,
};
apply(ctx, {});
const agent = (id) => ({ session: { id, seq: 0, eventAt: () => undefined }, options: {} });
const exec = (id) => ({ agent: agent(id), signal: new AbortController().signal });
const preStep = (id, step) => listeners.get('agent/pre-step')({ agent: agent(id), step, turn: 1, messages: [], signal: new AbortController().signal }, async () => ({ kind: 'enter', messages: [] }));

test('declares only the tools service and registers every djian tool', () => {
  assert.deepEqual(inject, ['tools']);
  for (const name of ['djian_timeline', 'djian_apply_ops', 'djian_changes', 'djian_frame', 'djian_assets', 'djian_import_asset', 'djian_search_media', 'djian_download_media', 'djian_export']) {
    assert.ok(tools.has(name), name);
    assert.equal(tools.get(name).parameters.type, 'object');
  }
});

test('tools act on the project bound to the calling session', async () => {
  const a = await tools.get('djian_apply_ops').execute({ ops: [{ op: 'addOverlay', text: '会话A', startSeconds: 0, endSeconds: 1 }], label: '加字幕' }, exec('hb-a'));
  const b = await tools.get('djian_apply_ops').execute({ ops: [{ op: 'addOverlay', text: '会话B', startSeconds: 0, endSeconds: 1 }] }, exec('hb-b'));
  assert.match(a.message, /添加字幕「会话A」/);
  const outlineA = await tools.get('djian_timeline').execute({}, exec('hb-a'));
  const outlineB = await tools.get('djian_timeline').execute({}, exec('hb-b'));
  assert.match(outlineA.message, /会话A/);
  assert.doesNotMatch(outlineA.message, /会话B/);
  assert.match(outlineB.message, /会话B/);
  assert.equal(tools.get('djian_apply_ops').output.render({}, a)[0].text, a.message);
});

test('user edits are injected once, flagged when they touch AI work, then go quiet', async () => {
  const sid = 'hb-activity';
  const add = await tools.get('djian_apply_ops').execute({ ops: [{ op: 'addOverlay', id: 'ai1', text: 'AI 写的', startSeconds: 0, endSeconds: 2 }] }, exec(sid));
  assert.match(add.message, /rev/);
  // 首次接触：只建立基线，不倾倒历史
  assert.equal((await preStep(sid, 1)).messages.length, 0);
  const project = (await engine.api('GET', '/api/session-project?sessionId=' + sid)).body.project.id;
  await engine.api('POST', '/api/p/' + project + '/ops', { ops: [{ op: 'updateOverlay', id: 'ai1', patch: { text: '用户改的' } }], actor: 'user', clientId: 'panel', label: '改字幕' });
  const d = await preStep(sid, 2);
  assert.equal(d.messages.length, 1);
  const msg = d.messages[0];
  assert.equal(msg.role, 'user');
  assert.equal(msg.source.kind, 'djian-activity');
  assert.match(msg.content[0].text, /<editor-activity rev="\d+"/);
  assert.match(msg.content[0].text, /用户「改字幕」：修改字幕「AI 写的」：文字 「AI 写的」→「用户改的」/);
  assert.match(msg.content[0].text, /改动了你之前修改过的对象/);
  assert.ok(Object.isFrozen(msg));
  assert.equal((await preStep(sid, 3)).messages.length, 0, 'nothing new → nothing injected');
});

test('selection and playhead ride along at the start of a turn', async () => {
  const sid = 'hb-presence';
  await tools.get('djian_timeline').execute({}, exec(sid));
  await preStep(sid, 1);
  const project = (await engine.api('GET', '/api/session-project?sessionId=' + sid)).body.project.id;
  await engine.api('POST', '/api/p/' + project + '/presence', { clientId: 'panel', actor: 'user', playhead: 5.4, mode: 'main', selection: [{ kind: 'clip', id: 'c3', label: 'a.mp4', track: 'main', start: 3, end: 5.4 }] });
  const d = await preStep(sid, 1);
  assert.match(d.messages[0].content[0].text, /播放头 0:05\.40；选中 c3「a\.mp4」（主轨 0:03\.00–0:05\.40）/);
  assert.equal((await preStep(sid, 1)).messages.length, 0, 'unchanged presence is not repeated');
});
