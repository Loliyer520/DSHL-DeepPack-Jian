import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import readline from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startEngine } from './helpers/engine.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const engine = await startEngine();
const mcp = spawn(process.execPath, [path.join(ROOT, 'packages/agent/mcp-server.mjs')], { env: { ...process.env, DSHL_SERVICE_PORTS: JSON.stringify({ 'djian-engine': engine.port }) }, stdio: ['pipe', 'pipe', 'inherit'] });
test.after(async () => { mcp.kill(); await engine.stop(); });
const pending = new Map();
readline.createInterface({ input: mcp.stdout }).on('line', (line) => { const m = JSON.parse(line); pending.get(m.id)?.(m); pending.delete(m.id); });
let seq = 0;
const rpc = (method, params) => new Promise((resolve) => { const id = ++seq; pending.set(id, resolve); mcp.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n'); });

test('MCP adapter shares the djian tools and requires an explicit project', async () => {
  const init = await rpc('initialize', { protocolVersion: '2025-03-26' });
  assert.equal(init.result.serverInfo.name, 'djian');
  const list = await rpc('tools/list', {});
  const names = list.result.tools.map((t) => t.name);
  assert.ok(names.includes('djian_projects') && names.includes('djian_apply_ops'));
  assert.deepEqual(list.result.tools.find((t) => t.name === 'djian_apply_ops').inputSchema.required, ['projectId', 'ops']);
  const missing = await rpc('tools/call', { name: 'djian_timeline', arguments: {} });
  assert.equal(missing.result.isError, true);
  const created = await rpc('tools/call', { name: 'djian_projects', arguments: { create: { name: 'MCP 项目', width: 1080, height: 1920 } } });
  const projectId = created.result.structuredContent.id;
  const applied = await rpc('tools/call', { name: 'djian_apply_ops', arguments: { projectId, ops: [{ op: 'addOverlay', text: '来自 MCP', startSeconds: 0, endSeconds: 1 }] } });
  assert.match(applied.result.content[0].text, /添加字幕「来自 MCP」/);
  const outline = await rpc('tools/call', { name: 'djian_timeline', arguments: { projectId } });
  assert.match(outline.result.content[0].text, /画布 1080×1920/);
  const changes = await engine.api('GET', '/api/p/' + projectId + '/changes?since=0');
  assert.equal(changes.body.events[0].actor, 'ai');
});
