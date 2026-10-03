import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'djian-sessions-test-'));
const data = path.join(root, '.djian');
const listener = net.createServer();
await new Promise((resolve) => listener.listen(0, '127.0.0.1', resolve));
const port = listener.address().port;
await new Promise((resolve) => listener.close(resolve));
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, [fileURLToPath(new URL('../../packages/webui/server/index.mjs', import.meta.url))], {
  cwd: root, env: { ...process.env, PORT: String(port), DJIAN_WORK: root, DJIAN_DATA_DIR: data }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
});
const exited = new Promise((resolve) => child.once('exit', resolve));
let logs = '';
for (const stream of [child.stdout, child.stderr]) stream.on('data', (chunk) => { logs = (logs + chunk).slice(-8000); });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const json = async (url, body) => {
  const response = await fetch(base + url, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
  assert.ok(response.ok, `${response.status}: ${await response.clone().text()}`); return response.json();
};
const timeline = (text) => ({ meta: { fps: 30, width: 320, height: 180 }, videoTracks: [{ id: 'v1', clips: [] }], audioTracks: [], overlays: [{ text, startSeconds: 0, endSeconds: 1 }] });
try {
  let ready = false;
  for (let i = 0; i < 100 && child.exitCode === null; i++) {
    try { ready = (await fetch(base + '/api/health')).ok; } catch {}
    if (ready) break; await wait(100);
  }
  assert.ok(ready, logs);
  const a = (await json('/api/session-project', { sessionId: 'session-a' })).project.id;
  const b = (await json('/api/session-project', { sessionId: 'session-b' })).project.id;
  assert.notEqual(a, b);
  await json('/api/internal/timeline?session=session-b');
  await json('/api/internal/timeline', { sessionId: 'session-a', timeline: timeline('A') });
  await json('/api/internal/timeline', { sessionId: 'session-b', timeline: timeline('B') });
  assert.equal((await json('/api/projects')).current, b, 'background save must not switch current project');
  const baseTimeline = JSON.stringify(await json('/api/internal/timeline?session=session-a&peek=1'));
  const concurrent = await Promise.all(['A-first', 'A-second'].map((text) => fetch(base + '/api/internal/timeline', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: 'session-a', timeline: timeline(text), baseTimeline }),
  })));
  assert.deepEqual(concurrent.map(r => r.status).sort(), [200, 409], 'stale writes must not overwrite the winning revision');
  const winner = await json('/api/internal/timeline?session=session-a&peek=1');
  await json('/api/internal/timeline', { sessionId: 'session-a', timeline: winner, baseTimeline });
  const unknownBase = await fetch(base + '/api/internal/timeline', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: 'session-a', timeline: timeline('unknown'), baseTimeline: null }),
  });
  assert.equal(unknownBase.status, 409, 'legacy recovered drafts require explicit conflict resolution');
  assert.deepEqual(await json('/api/internal/timeline?session=session-a&peek=1'), winner);
  await json('/api/internal/timeline', { sessionId: 'session-a', timeline: timeline('A'), baseTimeline: JSON.stringify(winner) });

  for (const [session, content] of [['session-a', 'asset-A'], ['session-b', 'asset-B']]) {
    const response = await fetch(base + `/api/assets?session=${session}&name=same.png`, { method: 'POST', body: content });
    assert.equal(response.status, 200);
    assert.equal(await (await fetch(base + `/project-assets/same.png?session=${session}`)).text(), content);
    for (const route of ['/project-assets/same.png', '/same.png']) {
      const partial = await fetch(base + `${route}?session=${session}`, { headers: { Range: 'bytes=4-6', Origin: 'http://localhost:5190' } });
      assert.equal(partial.status, 206);
      assert.equal(partial.headers.get('content-range'), 'bytes 4-6/7');
      assert.equal(await partial.text(), content.slice(4, 7));
      const head = await fetch(base + `${route}?session=${session}`, { method: 'HEAD' });
      assert.equal(head.status, 200); assert.equal(head.headers.get('content-length'), '7');
    }
  }
  await json('/api/internal/timeline?session=session-a');
  // Deliberately switch projects between upload headers and the remaining body.
  let upload;
  const uploaded = new Promise((resolve, reject) => {
    upload = http.request(base + '/api/assets?name=slow.png', { method: 'POST', headers: { 'Content-Length': 9 } }, (res) => {
      let text = ''; res.on('data', (chunk) => { text += chunk; }); res.on('end', () => resolve({ code: res.statusCode, text }));
    });
    upload.on('error', reject); upload.write('slow');
  });
  await wait(150);
  await json('/api/internal/timeline?session=session-b'); upload.end('-file');
  assert.equal((await uploaded).code, 200);
  assert.ok((await json('/api/assets?session=session-a')).assets.some((asset) => asset.name === 'slow.png'));
  assert.ok(!(await json('/api/assets?session=session-b')).assets.some((asset) => asset.name === 'slow.png'));
  for (const [id, label] of [[a, 'A'], [b, 'B']]) {
    const dir = path.join(data, 'projects', id, 'history'); fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'vfixture.json'), JSON.stringify({ id: 'vfixture', label, at: new Date().toISOString(), timeline: timeline('restored-' + label) }));
  }
  assert.equal((await json('/api/history?session=session-a')).snapshots[0].label, 'A');
  await json('/api/history/vfixture?session=session-a', {});
  assert.equal((await json('/api/internal/timeline?session=session-a&peek=1')).overlays[0].text, 'restored-A');
  assert.equal((await json('/api/internal/timeline?session=session-b&peek=1')).overlays[0].text, 'B');
  assert.equal((await json('/api/projects')).current, b);
  const removed = await fetch(base + '/api/assets/same.png?session=session-a', { method: 'DELETE' }); assert.equal(removed.status, 200);
  assert.equal(await (await fetch(base + '/project-assets/same.png?session=session-b')).text(), 'asset-B');
  const preflight = await fetch(base + '/api/assets/same.png', { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'DELETE' } });
  assert.ok(preflight.headers.get('access-control-allow-methods').includes('DELETE'));
  assert.ok(preflight.headers.get('access-control-allow-methods').includes('HEAD'));
  assert.ok(preflight.headers.get('access-control-allow-headers').includes('Range'));
  // Force an atomic rename failure without touching any real project or permissions.
  const file = path.resolve(data, 'projects', a, 'timeline.json'), backup = file + '.backup';
  assert.ok(file.startsWith(path.resolve(root) + path.sep)); assert.ok(backup.startsWith(path.resolve(root) + path.sep));
  fs.renameSync(file, backup); fs.mkdirSync(file);
  try {
    const failed = await fetch(base + '/api/internal/timeline', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'session-a', timeline: timeline('must-not-save') }) });
    assert.equal(failed.status, 500); assert.match((await failed.json()).error, /保存失败/);
  } finally { fs.rmdirSync(file); fs.renameSync(backup, file); }
  assert.equal((await json('/api/internal/timeline?session=session-a&peek=1')).overlays[0].text, 'restored-A');
  const invalid = await fetch(base + '/api/internal/timeline', { method: 'POST', body: '{invalid' }); assert.equal(invalid.status, 400);
  assert.equal((await json('/api/health')).ok, true);
  console.log('PASS real HTTP: concurrent save conflicts, session assets/history, delayed uploads, background saves, CORS deletion, disk failure and malformed-request recovery');
} catch (error) { console.error(logs); throw error; }
finally {
  child.kill(); await exited;
  assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
  fs.rmSync(root, { recursive: true, force: true });
}
