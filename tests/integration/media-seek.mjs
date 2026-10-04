// Optional real-browser check: requires Chrome/Edge and FFmpeg on PATH.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolveRenderBrowser } from '../../packages/engine/dist/browser.js';

const browser = resolveRenderBrowser();
assert.ok(browser, 'Install Chrome/Edge or set DJIAN_BROWSER_EXECUTABLE');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'djian-seek-test-'));
const data = path.join(root, '.djian');
const children = [];
let pageServer, ws;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const port = async () => {
  const server = net.createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const value = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return value;
};
const launch = (command, args, opts = {}) => {
  const child = spawn(command, args, { windowsHide: true, stdio: 'ignore', ...opts });
  const exited = new Promise(resolve => { child.once('exit', resolve); child.once('error', resolve); });
  children.push({ child, exited });
  return child;
};
async function ready(url) {
  for (let i = 0; i < 100; i++) {
    try { const response = await fetch(url); if (response.ok) return response.json(); } catch {}
    await wait(100);
  }
  throw new Error(`Service not ready: ${url}`);
}
try {
  const backendPort = await port(), debugPort = await port();
  const base = `http://127.0.0.1:${backendPort}`;
  launch(process.execPath, [fileURLToPath(new URL('../../packages/webui/server/index.mjs', import.meta.url))], {
    cwd: root, env: { ...process.env, PORT: String(backendPort), DJIAN_WORK: root, DJIAN_DATA_DIR: data },
  });
  await ready(base + '/api/health');
  const { project } = await (await fetch(base + '/api/session-project', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Djian-Client': 'test' }, body: JSON.stringify({ sessionId: 'seek-test' }),
  })).json();
  const file = path.join(data, 'projects', project.id, 'assets', '跳转测试.mp4');
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=30', '-t', '90', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '18', '-g', '30', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-y', file], { windowsHide: true });
  const size = fs.statSync(file).size;
  const media = `${base}/api/p/${encodeURIComponent(project.id)}/media/${encodeURIComponent(path.basename(file))}`;
  pageServer = http.createServer((_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<video crossorigin="anonymous" preload="metadata" src="${media}"></video>`);
  });
  await new Promise(resolve => pageServer.listen(0, '127.0.0.1', resolve));
  launch(browser, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--remote-debugging-port=${debugPort}`, `--user-data-dir=${path.join(root, 'chrome')}`, 'about:blank']);
  const pages = await ready(`http://127.0.0.1:${debugPort}/json`);
  ws = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
  let seq = 0, bytes = 0;
  const pending = new Map(), mediaIds = new Set(), ranges = [], statuses = [];
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const task = pending.get(message.id); pending.delete(message.id);
      if (message.error) task.reject(new Error(JSON.stringify(message.error))); else task.resolve(message.result);
    } else if (message.method === 'Network.responseReceived' && message.params.response.url === media) {
      mediaIds.add(message.params.requestId);
      ranges.push(message.params.response.headers['Content-Range']);
      statuses.push(message.params.response.status);
    } else if (message.method === 'Network.dataReceived' && mediaIds.has(message.params.requestId)) bytes += message.params.dataLength;
  });
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  };
  await call('Network.enable');
  await call('Network.emulateNetworkConditions', { offline: false, latency: 40, downloadThroughput: 512 * 1024, uploadThroughput: 1024 * 1024 });
  await call('Page.navigate', { url: `http://127.0.0.1:${pageServer.address().port}` });
  // Metadata and a seeked frame must arrive without waiting ~56 s for this file.
  const result = await evaluate(`new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('seek timed out')),15000);
    const check=()=>{const video=document.querySelector('video');if(!video||video.readyState<1){setTimeout(check,20);return;}
      video.addEventListener('error',()=>reject(Error('video decode failed')),{once:true});
      const started=performance.now();video.addEventListener('seeked',()=>{
        const canvas=document.createElement('canvas');canvas.width=32;canvas.height=18;
        const ctx=canvas.getContext('2d');ctx.drawImage(video,0,0,32,18);
        const pixels=ctx.getImageData(0,0,32,18).data;let color=0;
        for(let i=0;i<pixels.length;i+=4)color+=pixels[i]+pixels[i+1]+pixels[i+2];
        clearTimeout(timer);resolve({time:video.currentTime,width:video.videoWidth,seekMs:Math.round(performance.now()-started),color});
      },{once:true});video.currentTime=70;
    };check();
  })`);
  assert.equal(result.time, 70); assert.equal(result.width, 640); assert.ok(result.color > 10000);
  assert.ok(statuses.length > 0); assert.ok(statuses.every(status => status === 206), JSON.stringify(statuses));
  assert.ok(ranges.some(value => /^bytes [1-9]\d*-/.test(value)), JSON.stringify(ranges));
  assert.ok(bytes < size / 2, `Downloaded ${bytes}/${size} bytes before showing target frame`);
  console.log(JSON.stringify({ result, bytesRead: bytes, fileBytes: size, ranges }));
  await call('Browser.close');
} finally {
  ws?.close();
  if (pageServer) { pageServer.closeAllConnections(); await new Promise(resolve => pageServer.close(resolve)); }
  for (const { child, exited } of children.reverse()) { if (child.exitCode === null) child.kill(); await exited; }
  assert.equal(path.dirname(root), os.tmpdir());
  fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}
