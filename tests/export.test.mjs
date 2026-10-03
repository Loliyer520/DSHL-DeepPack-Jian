import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import { parseTimeline } from '../packages/engine/dist/schema.js';

const source = fs.readFileSync(new URL('../packages/webui/server/index.mjs', import.meta.url), 'utf8');
const routes = source.slice(source.indexOf('  if (url.pathname === "/api/export"'), source.indexOf('  if (url.pathname === "/api/chat"'));
const timeline = { meta: { fps: 30, width: 1280, height: 720 }, videoTracks: [{ id: 'v1', clips: [{ id: 'c1', type: 'video', src: 'a.mp4', inPoint: 0, clipDuration: 2 }] }], audioTracks: [] };
const flush = () => new Promise((resolve) => setImmediate(resolve));
function fixture() {
  const renders = [], bodies = [];
  const context = vm.createContext({
    URL, path, randomUUID, parseTimeline, structuredClone, DJIAN: '/scratch',
    fs: { mkdirSync() {}, statSync: () => ({ size: 1024 }), existsSync: () => true, createReadStream: (file) => ({ pipe: (res) => { res.file = file; } }) },
    currentProjectId: () => 'wrong-global-project',
    ensureSessionProject: (id, opts) => { assert.equal(opts.switchCurrent, false); return 'project-' + id; },
    assetsPath: (id) => '/assets/' + id,
    json: (res, code, data) => Object.assign(res, { code, data: structuredClone(data) }),
    readBody: (req) => req.wait ? new Promise((resolve) => bodies.push(() => resolve(JSON.stringify(req.body)))) : Promise.resolve(JSON.stringify(req.body)),
    renderVideo: (opts) => new Promise((resolve, reject) => renders.push({ opts, resolve, reject })),
  });
  vm.runInContext('let exportJob=null; const exportJobs=new Map(); globalThis.route=async(req,res,url)=>{' + routes + '}', context);
  const request = async (pathname, body, wait = false) => {
    const response = { writeHead(code, headers) { this.code = code; this.headers = headers; } };
    await context.route({ method: body ? 'POST' : 'GET', body, wait }, response, new URL(pathname, 'http://localhost'));
    return response;
  };
  return { request, renders, bodies };
}

test('concurrent export requests reserve a single renderer after reading their bodies', async () => {
  const { request, renders, bodies } = fixture();
  const first = request('/api/export', { timeline }, true);
  const second = request('/api/export', { timeline }, true);
  assert.equal(bodies.length, 2); bodies.forEach((done) => done());
  assert.deepEqual((await Promise.all([first, second])).map((r) => r.code), [202, 409]);
  assert.equal(renders.length, 1);
});

test('each download stays tied to its own snapshot and session assets after later exports', async () => {
  const { request, renders } = fixture();
  const first = await request('/api/export', { timeline, sessionId: 'session-a', scale: .5, quality: 'high' });
  assert.equal(first.code, 202);
  assert.equal(renders[0].opts.assetsDir, '/assets/project-session-a');
  assert.equal(renders[0].opts.timeline.meta.width, 640);
  assert.equal(renders[0].opts.crf, 16);
  renders[0].resolve({}); await flush();
  const firstStatus = await request('/api/export/status?jobId=' + first.data.jobId);
  assert.equal(firstStatus.data.status, 'done');
  assert.equal(firstStatus.data.outFile, undefined);
  const second = await request('/api/export', { timeline, sessionId: 'session-b' });
  assert.notEqual(first.data.jobId, second.data.jobId);
  assert.notEqual(renders[0].opts.outFile, renders[1].opts.outFile);
  const download = await request('/api/export/download?jobId=' + first.data.jobId);
  assert.equal(download.file, renders[0].opts.outFile);
  assert.equal(download.code, 200);
  renders[1].reject(Error('missing source')); await flush();
  const error = await request('/api/export/status?jobId=' + second.data.jobId);
  assert.equal(error.data.status, 'error'); assert.equal(error.data.error, 'missing source');
  assert.equal((await request('/api/export/status?jobId=unknown')).code, 404);
  assert.equal((await request('/api/export/download?jobId=unknown')).code, 404);
});
