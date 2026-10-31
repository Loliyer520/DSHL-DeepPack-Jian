import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { startEngine } from './helpers/engine.mjs';
import { EngineClient } from '../packages/host-bridge/lib/engine-client.js';
import { IMAGE_TOOL, sniffImage } from '../packages/host-bridge/lib/image.js';

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAAAAAA6mKC9AAAAD0lEQVR4nGNoQAMMI1sAAAUMgAFaSOXNAAAAAElFTkSuQmCC';
const engine = await startEngine();
const requests = [];
const upstream = http.createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  requests.push({ method: req.method, url: req.url, headers: req.headers, body });
  if (req.url === '/result.png') {
    res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': Buffer.from(PNG, 'base64').length });
    res.end(Buffer.from(PNG, 'base64'));
    return;
  }
  if (req.url === '/v1/images/generations' && req.method === 'POST') {
    const json = JSON.parse(body.toString('utf8'));
    if (json.model === 'bad-model') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'unknown image model' } }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: [{ b64_json: PNG, revised_prompt: ' revised by relay ' }] }));
    return;
  }
  if (req.url === '/v1/images/edits' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const base = 'http://127.0.0.1:' + upstream.address().port;
    res.end(JSON.stringify({ data: [{ url: base + '/result.png' }] }));
    return;
  }
  res.writeHead(404).end();
});
await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve));

const previous = {};
for (const key of ['DSHL_SERVICE_PORTS', 'DJIAN_IMAGE_API_KEY', 'DJIAN_IMAGE_BASE_URL', 'DJIAN_IMAGE_MODEL']) previous[key] = process.env[key];
process.env.DSHL_SERVICE_PORTS = JSON.stringify({ 'djian-engine': engine.port });
process.env.DJIAN_IMAGE_API_KEY = 'image-test-secret';
process.env.DJIAN_IMAGE_BASE_URL = 'http://127.0.0.1:' + upstream.address().port + '/v1';
process.env.DJIAN_IMAGE_MODEL = 'relay-image';

const client = new EngineClient({ clientId: 'image-test' });
const project = await client.projectFor('image-tool-test');
const ctx = { projectId: project.id };

test.after(async () => {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  await new Promise((resolve) => upstream.close(resolve));
  await engine.stop();
});

test('image format sniffing rejects non-image payloads', () => {
  assert.deepEqual(sniffImage(Buffer.from(PNG, 'base64')), { ext: '.png', mediaType: 'image/png' });
  assert.throws(() => sniffImage(Buffer.from('<html>not an image</html>')), /没有返回支持/);
});

test('generate calls OpenAI-compatible generations and imports the result', async () => {
  const result = await IMAGE_TOOL.execute(client, ctx, {
    action: 'generate', prompt: '一张蓝色产品海报', name: 'poster', size: '1536x1024', quality: 'high', outputFormat: 'png',
  });
  assert.equal(result.value.name, 'poster.png');
  assert.equal(result.value.assets[0].width, 16);
  assert.equal(result.value.assets[0].height, 16);
  assert.equal(result.image.mediaType, 'image/png');
  assert.match(result.text, /原素材未被覆盖/);
  assert.deepEqual(result.value.revisedPrompts, ['revised by relay']);
  const call = requests.find((r) => r.url === '/v1/images/generations');
  assert.equal(call.headers.authorization, 'Bearer image-test-secret');
  const body = JSON.parse(call.body.toString('utf8'));
  assert.deepEqual(body, { model: 'relay-image', prompt: '一张蓝色产品海报', n: 1, size: '1536x1024', quality: 'high', output_format: 'png' });
});

test('edit sends the project image as multipart and downloads URL results', async () => {
  const result = await IMAGE_TOOL.execute(client, ctx, { action: 'edit', prompt: '保留构图，改成红色', image: 'poster.png', name: 'poster-edit' });
  assert.equal(result.value.name, 'poster-edit.png');
  const call = requests.find((r) => r.url === '/v1/images/edits');
  assert.match(call.headers['content-type'], /^multipart\/form-data; boundary=/);
  assert.doesNotMatch(call.headers['content-type'], /application\/json/);
  const body = call.body.toString('latin1');
  assert.match(body, /name="model"\r\n\r\nrelay-image/);
  assert.match(body, /name="image"; filename="poster.png"/);
  assert.match(call.body.toString('utf8'), /name="prompt"\r\n\r\n保留构图，改成红色/);
  const assets = await client.get('/api/p/' + project.id + '/assets');
  assert.deepEqual(assets.assets.map((a) => a.name).sort(), ['poster-edit.png', 'poster.png']);
});

test('edit supports multiple references and never overwrites the source', async () => {
  const result = await IMAGE_TOOL.execute(client, ctx, { action: 'edit', prompt: '融合两张图', images: ['poster.png', 'poster-edit.png'], name: 'poster-edit' });
  assert.equal(result.value.name, 'poster-edit-1.png');
  const calls = requests.filter((r) => r.url === '/v1/images/edits');
  const body = calls.at(-1).body.toString('latin1');
  assert.equal((body.match(/name="image\[\]"/g) ?? []).length, 2);
});

test('upstream errors are useful without leaking the key', async () => {
  await assert.rejects(
    IMAGE_TOOL.execute(client, ctx, { action: 'generate', prompt: 'test', model: 'bad-model' }),
    (error) => {
      assert.match(error.message, /HTTP 400.*unknown image model/);
      assert.doesNotMatch(error.message, /image-test-secret/);
      return true;
    },
  );
});

test('panel-saved settings win over an empty environment', async () => {
  const file = path.join(engine.dataDir, 'settings.json');
  try {
    fs.writeFileSync(file, JSON.stringify({
      image: { apiKey: 'panel-image-secret', baseUrl: 'http://127.0.0.1:' + upstream.address().port + '/v1', model: 'panel-model' },
    }));
    const result = await IMAGE_TOOL.execute(client, ctx, { action: 'generate', prompt: '面板配置优先' }, {});
    assert.equal(result.value.model, 'panel-model');
    const call = requests.findLast((r) => r.url === '/v1/images/generations');
    assert.equal(call.headers.authorization, 'Bearer panel-image-secret');
    assert.equal(JSON.parse(call.body.toString('utf8')).model, 'panel-model');
  } finally {
    fs.rmSync(file, { force: true });
  }
});
