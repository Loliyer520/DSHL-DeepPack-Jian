import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { serveMedia } from '../packages/webui/server/media.mjs';

async function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'djian-media-test-'));
  fs.writeFileSync(path.join(dir, 'media.mp4'), '0123456789abcdef');
  fs.writeFileSync(path.join(dir, 'empty.mp4'), '');
  const tasks = new Set();
  const errors = [];
  const server = http.createServer((req, res) => {
    res._aco = 'http://localhost:5190';
    const task = serveMedia(req, res, path.join(dir, path.basename(req.url)), 'video/mp4')
      .catch(error => { errors.push(error); res.destroy(); }).finally(() => tasks.delete(task));
    tasks.add(task);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await Promise.all(tasks);
    assert.equal(path.dirname(dir), os.tmpdir());
    fs.rmSync(dir, { recursive: true, force: true });
    assert.deepEqual(errors, []);
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const get = (headers = {}, method = 'GET', file = 'media.mp4') => fetch(`${base}/${file}`, { headers, method });
  return { dir, base, get, tasks };
}

test('media requests return exact seek ranges, full fallbacks, HEAD and CORS headers', async t => {
  const { get } = await fixture(t);
  for (const [range, expected, span] of [
    ['bytes=0-0', '0', '0-0'],
    ['bytes=4-8', '45678', '4-8'],
    ['bytes=12-', 'cdef', '12-15'],
    ['bytes=-4', 'cdef', '12-15'],
    ['bytes=14-999999999999999999999999', 'ef', '14-15'],
    ['bytes=-999999999999999999999999', '0123456789abcdef', '0-15'],
  ]) {
    const response = await get({ Range: range });
    assert.equal(response.status, 206, range);
    assert.equal(response.headers.get('content-range'), `bytes ${span}/16`);
    assert.equal(Number(response.headers.get('content-length')), expected.length);
    assert.equal(response.headers.get('accept-ranges'), 'bytes');
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5190');
    assert.match(response.headers.get('access-control-expose-headers'), /Content-Range/);
    assert.equal(await response.text(), expected);
  }
  for (const range of ['bytes=16-', 'bytes=999999999999999999999999-', 'bytes=-0']) {
    const response = await get({ Range: range });
    assert.equal(response.status, 416, range);
    assert.equal(response.headers.get('content-range'), 'bytes */16');
    assert.equal(await response.text(), '');
  }
  for (const headers of [{}, { Range: 'items=0-1' }, { Range: 'bytes=5-2' }, { Range: 'bytes=0-1,8-9' }, { Range: 'bytes=a-b' }, { Range: 'bytes=2-3', 'If-Range': '"old-file"' }]) {
    const response = await get(headers);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-range'), null);
    assert.equal(await response.text(), '0123456789abcdef');
  }
  const head = await get({ Range: 'bytes=4-8' }, 'HEAD');
  assert.equal(head.status, 200); assert.equal(head.headers.get('content-length'), '16');
  assert.equal(await head.text(), '');
  const empty = await get({}, 'GET', 'empty.mp4');
  assert.equal(empty.status, 200); assert.equal(await empty.text(), '');
  const emptyRange = await get({ Range: 'bytes=0-' }, 'GET', 'empty.mp4');
  assert.equal(emptyRange.status, 416); assert.equal(emptyRange.headers.get('content-range'), 'bytes */0');
  assert.equal((await get({}, 'GET', 'missing.mp4')).status, 404);
});

test('canceling a media transfer releases its reader and the server continues seeking', async t => {
  const { dir, base, get, tasks } = await fixture(t);
  fs.writeFileSync(path.join(dir, 'large.mp4'), Buffer.alloc(16 * 1024 * 1024, 42));
  await new Promise((resolve, reject) => {
    const request = http.get(`${base}/large.mp4`, res => {
      res.once('data', () => { res.destroy(); resolve(); });
      res.once('error', reject);
    });
    request.once('error', reject);
  });
  for (let i = 0; tasks.size && i < 100; i++) await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(tasks.size, 0, 'canceled reads must settle and close their file handle');
  const next = await get({ Range: 'bytes=8-11' });
  assert.equal(next.status, 206); assert.equal(await next.text(), '89ab');
});
