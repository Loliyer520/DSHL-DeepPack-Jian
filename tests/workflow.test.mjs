import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { startEngine } from './helpers/engine.mjs';
import { EngineClient } from '../packages/host-bridge/lib/engine-client.js';
import { WORKFLOW_TOOLS } from '../packages/host-bridge/lib/workflow.js';

const engine = await startEngine();
process.env.DSHL_SERVICE_PORTS = JSON.stringify({ 'djian-engine': engine.port });
const client = new EngineClient({ clientId: 'workflow-test' });
const project = await client.projectFor('workflow-test');
const ctx = { projectId: project.id, projectName: project.name, clientId: 'workflow-test', observe() {} };
const [style, handoff, checkpoint] = WORKFLOW_TOOLS;
test.after(() => engine.stop());

test('style card is sanitized, compact and persisted outside the timeline', async () => {
  const empty = await style.execute(client, ctx, { action: 'show' });
  assert.equal(empty.value.style, null);
  const saved = await style.execute(client, ctx, {
    action: 'set', designStyle: 'flat-vector', brief: '深色科技产品演示', background: '#0B0D12', text: '#F5F5F5', accent: '#58C4DD',
    fontFamily: 'sans', titleSize: 72, bodySize: 32, margin: 0.08, maxColors: 3, maxAnimations: 2,
    rules: ['一页一个重点', '不擅自加装饰'],
  });
  assert.equal(saved.value.style.margin, 0.08);
  assert.match(saved.value.text, /<djian-style>/);
  assert.match(saved.value.text, /标题 72px/);
  assert.match(saved.value.text, /flat-vector/);
  const onDisk = JSON.parse(fs.readFileSync(path.join(engine.dataDir, 'projects', project.id, 'project.json'), 'utf8'));
  assert.equal(onDisk.style.accent, '#58C4DD');
  const timeline = await client.get('/api/p/' + project.id + '/timeline');
  assert.equal(timeline.rev, 0, 'style changes do not create timeline edits');
});

test('checkpoints save and restore approved versions', async () => {
  await client.post('/api/p/' + project.id + '/ops', { ops: [{ op: 'addOverlay', id: 'approved', text: '确认版', startSeconds: 0, endSeconds: 2 }], actor: 'ai' });
  const saved = await checkpoint.execute(client, ctx, { action: 'save', label: '第3页确认版' });
  assert.ok(saved.value.id);
  await client.post('/api/p/' + project.id + '/ops', { ops: [{ op: 'updateOverlay', id: 'approved', patch: { text: '漂移版' } }], actor: 'ai' });
  const restored = await checkpoint.execute(client, ctx, { action: 'restore', id: saved.value.id });
  assert.ok(restored.value.rev >= 3);
  const current = await client.get('/api/p/' + project.id + '/timeline');
  assert.equal(current.timeline.overlays[0].text, '确认版');
  const list = await checkpoint.execute(client, ctx, { action: 'list' });
  assert.match(list.text, /第3页确认版/);
  assert.match(list.text, /恢复前自动快照/);
});

test('handoff carries scope, style, current state and checkpoints without chat history', async () => {
  const result = await handoff.execute(client, ctx, { task: '只修正第3页标题换行', scope: '只改第3页，不动其他页面' });
  assert.match(result.text, /只修正第3页标题换行/);
  assert.match(result.text, /只改第3页，不动其他页面/);
  assert.match(result.text, /<djian-style>/);
  assert.match(result.text, /确认版/);
  assert.match(result.text, /最近检查点/);
  assert.match(result.text, /不为了“更丰富”/);
  assert.equal(result.value.rev, 3);
});
