import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { startEngine } from './helpers/engine.mjs';

const engine = await startEngine();
test.after(() => engine.stop());

test('health exposes the local data dir for the host bridge', async () => {
  const r = await engine.api('GET', '/api/health');
  assert.equal(r.status, 200);
  assert.equal(path.isAbsolute(r.body.dataDir), true);
});

test('image settings round-trip without ever returning the raw key', async () => {
  const initial = await engine.api('GET', '/api/settings/image');
  assert.equal(initial.status, 200);
  assert.equal(initial.body.configured, false);
  assert.equal(initial.body.baseUrl, 'https://api.openai.com/v1');
  assert.equal(initial.body.model, 'gpt-image-1');
  assert.equal(initial.body.timeoutMs, 300000);

  const saved = await engine.api('PUT', '/api/settings/image', { apiKey: 'sk-panel-secret-1234', baseUrl: 'https://relay.example.com/v1/', model: 'relay-image', timeoutMs: 120000 });
  assert.equal(saved.status, 200);
  assert.equal(saved.body.configured, true);
  assert.equal(saved.body.apiKeyHint, '••••1234');
  assert.equal(saved.body.baseUrl, 'https://relay.example.com/v1');
  assert.equal(saved.body.model, 'relay-image');
  assert.equal(saved.body.timeoutMs, 120000);
  assert.ok(!JSON.stringify(saved.body).includes('sk-panel-secret-1234'), '响应里不能出现完整密钥');

  const file = JSON.parse(fs.readFileSync(path.join(engine.dataDir, 'settings.json'), 'utf8'));
  assert.equal(file.image.apiKey, 'sk-panel-secret-1234', '密钥只落盘到本机数据目录');

  // 不带 apiKey 的更新保留原密钥；空字符串清除
  const kept = await engine.api('PUT', '/api/settings/image', { model: 'next-model' });
  assert.equal(kept.body.configured, true);
  assert.equal(kept.body.model, 'next-model');
  assert.equal(JSON.parse(fs.readFileSync(path.join(engine.dataDir, 'settings.json'), 'utf8')).image.apiKey, 'sk-panel-secret-1234');
  const cleared = await engine.api('PUT', '/api/settings/image', { apiKey: '' });
  assert.equal(cleared.body.configured, false);
  assert.equal(cleared.body.apiKeyHint, null);
  assert.equal(JSON.parse(fs.readFileSync(path.join(engine.dataDir, 'settings.json'), 'utf8')).image.apiKey, undefined);
});

test('image settings validation rejects bad input and requires the client header', async () => {
  const badUrl = await engine.api('PUT', '/api/settings/image', { baseUrl: 'ftp://nope.example' });
  assert.equal(badUrl.status, 400);
  const notUrl = await engine.api('PUT', '/api/settings/image', { baseUrl: 'not a url' });
  assert.equal(notUrl.status, 400);
  const badTimeout = await engine.api('PUT', '/api/settings/image', { timeoutMs: 'soon' });
  assert.equal(badTimeout.status, 400);
  const noHeader = await fetch(engine.base + '/api/settings/image', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(noHeader.status, 403);
  // 超时被钳制在 1–600 秒
  const clamped = await engine.api('PUT', '/api/settings/image', { timeoutMs: 999999999 });
  assert.equal(clamped.body.timeoutMs, 600000);
});
