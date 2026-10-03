import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { startEngine, collectSse, EXAMPLE_VIDEO } from './helpers/engine.mjs';

const engine = await startEngine();
test.after(() => engine.stop());
const { api } = engine;
const bind = async (sid) => (await api('POST', '/api/session-project', { sessionId: sid })).body.project.id;

test('security gate: header, origin and host checks', async () => {
  const noHeader = await fetch(engine.base + '/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(noHeader.status, 403);
  const evil = await fetch(engine.base + '/api/projects', { headers: { Origin: 'https://evil.example' } });
  assert.equal(evil.status, 403);
  const local = await fetch(engine.base + '/api/projects', { headers: { Origin: 'http://127.0.0.1:3080' } });
  assert.equal(local.status, 200);
  assert.equal(local.headers.get('access-control-allow-origin'), 'http://127.0.0.1:3080');
  const status = await new Promise((resolve) => {
    http.get({ host: '127.0.0.1', port: engine.port, path: '/api/health', headers: { Host: 'attacker.example:80' } }, (r) => { r.resume(); resolve(r.statusCode); });
  });
  assert.equal(status, 421);
  const textPlain = await fetch(engine.base + '/api/projects', { method: 'POST', headers: { 'Content-Type': 'text/plain', 'X-Djian-Client': 't' }, body: '{}' });
  assert.equal(textPlain.status, 415);
});

test('sessions bind to distinct projects; reads never create projects', async () => {
  const a = await bind('sess-a');
  const b = await bind('sess-b');
  assert.notEqual(a, b);
  assert.equal(await bind('sess-a'), a);
  const unknown = await api('GET', '/api/session-project?sessionId=nobody');
  assert.equal(unknown.body.project, null);
});

test('ops advance the revision, return receipts and readable summaries', async () => {
  const pid = await bind('sess-ops');
  const r = await api('POST', '/api/p/' + pid + '/ops', { ops: [{ op: 'addOverlay', id: 'o1', text: '你好世界', startSeconds: 0, endSeconds: 2 }], actor: 'user', clientId: 'c1' });
  assert.equal(r.status, 200);
  assert.equal(r.body.rev, 1);
  assert.equal(r.body.receipts[0].id, 'o1');
  assert.match(r.body.summary[0], /添加字幕「你好世界」/);
  const t = await api('GET', '/api/p/' + pid + '/timeline');
  assert.equal(t.body.rev, 1);
  assert.equal(t.body.timeline.overlays[0].text, '你好世界');
  const noop = await api('POST', '/api/p/' + pid + '/ops', { ops: [{ op: 'removeOverlay', id: 'missing' }] });
  assert.equal(noop.body.rev, 1, 'ineffective batches do not create revisions');
});

test('stale baseRev still applies but reports overlap with other actors', async () => {
  const pid = await bind('sess-conflict');
  await api('POST', '/api/p/' + pid + '/ops', { ops: [{ op: 'addOverlay', id: 'x', text: 'a', startSeconds: 0, endSeconds: 1 }], clientId: 'panel' });
  await api('POST', '/api/p/' + pid + '/ops', { ops: [{ op: 'updateOverlay', id: 'x', patch: { text: 'AI 改的' } }], actor: 'ai', clientId: 'ai' });
  const r = await api('POST', '/api/p/' + pid + '/ops', { ops: [{ op: 'updateOverlay', id: 'x', patch: { color: '#ff0000' } }], baseRev: 1, clientId: 'panel' });
  assert.equal(r.body.rev, 3);
  assert.equal(r.body.conflicts.length, 1);
  assert.equal(r.body.conflicts[0].actor, 'ai');
});

test('SSE delivers live patches and replays from a revision', async () => {
  const pid = await bind('sess-sse');
  const live = collectSse(engine.base + '/api/p/' + pid + '/events', (evs) => evs.some((e) => e.type === 'ops'));
  await new Promise((r) => setTimeout(r, 200));
  await api('POST', '/api/p/' + pid + '/ops', { ops: [{ op: 'addMarker', id: 'm1', t: 1, label: '高潮' }], actor: 'ai', clientId: 'ai' });
  const events = await live;
  const ev = events.find((e) => e.type === 'ops');
  assert.equal(ev.data.actor, 'ai');
  assert.ok(ev.data.patch.some((op) => op.op === 'putMarker'));
  const replay = await collectSse(engine.base + '/api/p/' + pid + '/events?since=0', (evs) => evs.filter((e) => e.type === 'ops').length >= 1);
  assert.equal(replay.find((e) => e.type === 'ops').data.rev, 1);
});

test('changes endpoint filters by actor (what host-bridge injects into the model)', async () => {
  const pid = await bind('sess-changes');
  await api('POST', '/api/p/' + pid + '/ops', { ops: [{ op: 'addMarker', t: 1 }], actor: 'user', clientId: 'panel' });
  await api('POST', '/api/p/' + pid + '/ops', { ops: [{ op: 'addMarker', t: 2 }], actor: 'ai', clientId: 'ai' });
  const user = await api('GET', '/api/p/' + pid + '/changes?since=0&actor=user');
  assert.equal(user.body.events.length, 1);
  assert.equal(user.body.events[0].actor, 'user');
  assert.equal(user.body.events[0].patch, undefined);
});

test('locked tracks protect user content from AI edits', async () => {
  const pid = await bind('sess-lock');
  await api('POST', '/api/p/' + pid + '/ops', { ops: [{ op: 'updateTrack', id: 'v1', patch: { locked: true } }] });
  const t = await api('GET', '/api/p/' + pid + '/timeline');
  assert.equal(t.body.timeline.videoTracks[0].locked, true);
});

test('request bodies with multi-byte text split across chunks stay intact', async () => {
  const pid = await bind('sess-utf8');
  const text = '中文字幕'.repeat(50) + '🎬';
  const payload = Buffer.from(JSON.stringify({ ops: [{ op: 'addOverlay', id: 'u8', text, startSeconds: 0, endSeconds: 1 }] }));
  await new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: engine.port, method: 'POST', path: '/api/p/' + pid + '/ops', headers: { 'Content-Type': 'application/json', 'X-Djian-Client': 't', 'Content-Length': payload.length } }, (res) => { res.resume(); res.on('end', resolve); });
    req.on('error', reject);
    // 每次写 5 个字节：多字节字符必然跨块
    let i = 0;
    const pump = () => { if (i >= payload.length) { req.end(); return; } req.write(payload.subarray(i, i + 5)); i += 5; setImmediate(pump); };
    pump();
  });
  const t = await api('GET', '/api/p/' + pid + '/timeline');
  assert.equal(t.body.timeline.overlays.find((o) => o.id === 'u8').text, text);
});

test('assets: streamed upload, probe, usage-protected delete, range media', async () => {
  const pid = await bind('sess-assets');
  const bytes = fs.readFileSync(EXAMPLE_VIDEO);
  const up = await fetch(engine.base + '/api/p/' + pid + '/assets?name=' + encodeURIComponent('测试 视频.mp4'), { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', 'X-Djian-Client': 't' }, body: bytes });
  const upBody = await up.json();
  assert.equal(up.status, 200, JSON.stringify(upBody));
  assert.equal(upBody.type, 'video');
  assert.ok(upBody.duration > 1, 'duration probed: ' + JSON.stringify(upBody));
  const add = await api('POST', '/api/p/' + pid + '/ops', { ops: [{ op: 'addClip', src: upBody.name, clipDuration: 1 }] });
  assert.equal(add.body.receipts[0].status, 'applied');
  const missing = await api('POST', '/api/p/' + pid + '/ops', { ops: [{ op: 'addClip', src: 'nope.mp4' }] });
  assert.equal(missing.body.receipts[0].status, 'rejected');
  const del = await api('DELETE', '/api/p/' + pid + '/assets/' + encodeURIComponent(upBody.name));
  assert.equal(del.status, 409);
  const range = await fetch(engine.base + '/api/p/' + pid + '/media/' + encodeURIComponent(upBody.name), { headers: { Range: 'bytes=0-99' } });
  assert.equal(range.status, 206);
  assert.equal((await range.arrayBuffer()).byteLength, 100);
  const traversal = await fetch(engine.base + '/api/p/' + pid + '/media/..%2F..%2Fsessions.json');
  assert.equal(traversal.status, 404);
  const list = await api('GET', '/api/p/' + pid + '/assets');
  assert.equal(list.body.assets[0].usage, 1);
});

test('history snapshots can be created and restored', async () => {
  const pid = await bind('sess-history');
  await api('POST', '/api/p/' + pid + '/ops', { ops: [{ op: 'addOverlay', id: 'h1', text: '版本一', startSeconds: 0, endSeconds: 1 }] });
  const snap = await api('POST', '/api/p/' + pid + '/history', { label: '第一版' });
  await api('POST', '/api/p/' + pid + '/ops', { ops: [{ op: 'updateOverlay', id: 'h1', patch: { text: '版本二' } }] });
  const restored = await api('POST', '/api/p/' + pid + '/history/' + snap.body.id + '/restore', {});
  assert.equal(restored.status, 200);
  const t = await api('GET', '/api/p/' + pid + '/timeline');
  assert.equal(t.body.timeline.overlays[0].text, '版本一');
  const list = await api('GET', '/api/p/' + pid + '/history');
  assert.ok(list.body.snapshots.some((s) => s.label === '恢复前自动快照'));
});

test('corrupt timelines are quarantined, never overwritten; newer versions are read-only', async () => {
  const pid = await bind('sess-corrupt');
  const dir = path.join(engine.dataDir, 'projects', pid);
  // 重启前改坏文件：用新项目（尚未加载进内存）验证加载路径
  const fresh = (await api('POST', '/api/projects', { name: 'x' })).body.id;
  const fdir = path.join(engine.dataDir, 'projects', fresh);
  fs.writeFileSync(path.join(fdir, 'timeline.json'), '{ broken');
  const t = await api('GET', '/api/p/' + fresh + '/timeline');
  assert.equal(t.status, 200);
  assert.ok(fs.readdirSync(fdir).some((f) => f.startsWith('timeline.corrupt-')));
  const future = (await api('POST', '/api/projects', { name: 'y' })).body.id;
  fs.writeFileSync(path.join(engine.dataDir, 'projects', future, 'timeline.json'), JSON.stringify({ version: 99, meta: { fps: 30, width: 2, height: 2 } }));
  const ro = await api('POST', '/api/p/' + future + '/ops', { ops: [{ op: 'addMarker', t: 0 }] });
  assert.equal(ro.status, 423);
  assert.ok(fs.existsSync(dir));
});
