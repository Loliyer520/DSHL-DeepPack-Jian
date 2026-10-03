import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import readline from 'node:readline';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'djian-mcp-workflow-'));
const listener = net.createServer();
await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
const port = listener.address().port;
await new Promise(resolve => listener.close(resolve));
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, [fileURLToPath(new URL('../../packages/webui/server/index.mjs', import.meta.url))], {
  cwd: root, env: { ...process.env, PORT: String(port), DJIAN_WORK: root, DJIAN_DATA_DIR: path.join(root, '.djian') },
  windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
});
const serverExit = new Promise(resolve => server.once('exit', resolve));
let logs = '', mcp;
server.stdout.on('data', data => { logs = (logs + data).slice(-8000); });
server.stderr.on('data', data => { logs = (logs + data).slice(-8000); });
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
try {
  let ready = false;
  for (let n = 0; n < 100; n++) { try { ready = (await fetch(base + '/api/health')).ok; } catch {} if (ready) break; await wait(100); }
  assert.ok(ready, logs);
  await fetch(base + '/api/session-project', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'initial-panel' }) });
  mcp = spawn(process.execPath, [fileURLToPath(new URL('../../packages/agent/mcp-server.mjs', import.meta.url))], {
    cwd: root, env: { ...process.env, DJIAN_WEBUI_URL: base }, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'],
  });
  const pending = new Map(); let sequence = 0;
  const lines = readline.createInterface({ input: mcp.stdout });
  lines.on('line', line => {
    const response = JSON.parse(line), item = pending.get(response.id);
    if (!item) return;
    clearTimeout(item.timer); pending.delete(response.id);
    response.error ? item.reject(new Error(response.error.message)) : item.resolve(response.result);
  });
  const call = (method, params) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('MCP test timed out')); }, 320_000);
    pending.set(id, { resolve, reject, timer });
    mcp.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
  const tool = async (name, args = {}) => {
    const result = await call('tools/call', { name, arguments: args });
    assert.ok(!result.isError, JSON.stringify(result));
    return JSON.parse(result.content.find(c => c.type === 'text').text);
  };
  assert.ok((await call('tools/list')).tools.some(t => t.name === 'import_asset'));
  const initialCount = (await tool('asset_list')).assets.length;
  // Source stays outside the engine-managed project directory, as in a generated-file workflow.
  const source = path.join(root, '本地生成 空格.gif');
  const bytes = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  fs.writeFileSync(source, bytes);
  const first = await tool('import_asset', { path: source });
  assert.equal(first.type, 'image');
  assert.equal(first.size, bytes.length);
  assert.ok(path.isAbsolute(first.assetsDir));
  assert.deepEqual(fs.readFileSync(path.join(first.assetsDir, first.name)), bytes);
  const duplicate = await tool('import_asset', { path: source });
  assert.notEqual(duplicate.name, first.name);
  const encoded = await tool('import_asset', { base64: bytes.toString('base64'), name: 'encoded.gif' });
  assert.equal(encoded.name, 'encoded.gif');
  const assets = await tool('asset_list');
  assert.equal(assets.projectId, first.projectId);
  assert.equal(assets.assets.length, initialCount + 3);
  const state = await tool('get_timeline');
  assert.equal(state.assetsDir, first.assetsDir);
  assert.equal(state.canvas.width, 1280);
  const result = await tool('apply_timeline_ops', { ops: [
    { op: 'addClip', src: first.name, type: 'image', clipDuration: 3 },
    ...['蓝色', '金色', '绿色', '白色'].map((text, i) => ({ op: 'addOverlay', text, startSeconds: 0, endSeconds: 3, color: ['#8FD8FF', '#FFD86B', '#28DC50', '#FFFFFF'][i] })),
  ] });
  assert.equal(result.receipts.length, 5);
  assert.ok(result.receipts[0].id);
  assert.deepEqual(result.receipts.slice(1).map(r => r.overlayIndex), [0, 1, 2, 3]);
  assert.ok(result.receipts.every(r => r.status === 'applied'));
  const ignored = await tool('apply_timeline_ops', { ops: [{ op: 'updateClip', id: result.receipts[0].id, patch: { volume: .5 } }, { op: 'removeClip', id: 'missing' }] });
  assert.deepEqual(ignored.receipts.map(r => r.status), ['applied', 'ignored']);
  const invalid = await call('tools/call', { name: 'import_asset', arguments: { path: path.join(root, 'missing.mp4') } });
  assert.equal(invalid.isError, true);
  // Explicit project targeting must survive a different panel becoming current.
  const other = await (await fetch(base + '/api/session-project', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'other-panel' }) })).json();
  await fetch(base + '/api/internal/timeline?session=other-panel');
  assert.notEqual(other.project.id, first.projectId);
  await fetch(`${base}/api/assets?projectId=${first.projectId}&name=pinned.gif`, { method: 'POST', body: bytes });
  const pinned = await (await fetch(`${base}/api/assets?projectId=${first.projectId}`)).json();
  assert.ok(pinned.assets.some(a => a.name === 'pinned.gif'));
  const otherAssets = await (await fetch(base + '/api/assets?session=other-panel')).json();
  assert.equal(otherAssets.assets.some(a => a.name === 'pinned.gif'), false);
  // Optional real renderer gate: two concurrent requests share the same pending frame.
  if (process.argv.includes('--render')) {
    const request = () => fetch(`${base}/api/internal/frame?projectId=${first.projectId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seconds: 1 }),
    }).then(async response => { assert.ok(response.ok, await response.clone().text()); return response.json(); });
    const [a, b] = await Promise.all([request(), request()]);
    assert.equal(a.pngBase64, b.pngBase64);
    assert.deepEqual(a.activeTextLayers.map(l => l.text), ['蓝色', '金色', '绿色', '白色']);
    assert.ok('bottomThirdColoredPercent' in a.stats);
    assert.ok(a.pngBase64.length > 100);
  }
  console.log('PASS real MCP: local/base64 import, name collision, asset directory/canvas, batch receipts, project pinning' + (process.argv.includes('--render') ? ', cold shared frame + colored text metadata' : ''));
} catch (error) { console.error(logs); throw error; }
finally {
  if (mcp) { const exit = new Promise(resolve => mcp.once('exit', resolve)); mcp.kill(); await exit; }
  server.kill(); await serverExit;
  assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
  fs.rmSync(root, { recursive: true, force: true });
}
