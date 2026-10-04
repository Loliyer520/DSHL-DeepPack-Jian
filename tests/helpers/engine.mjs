// 测试辅助：在临时数据目录启动一个真实引擎进程（随机端口、不预热渲染器）
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const freePort = () => new Promise((resolve) => {
  const s = net.createServer();
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
});

export async function startEngine({ warm = false, env = {} } = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'djian-test-'));
  const port = await freePort();
  const child = spawn(process.execPath, [path.join(ROOT, 'packages/webui/server/index.mjs')], {
    env: { ...process.env, DJIAN_DATA_DIR: dataDir, PORT: String(port), ...(warm ? {} : { DJIAN_NO_WARMUP: '1' }), ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  child.stdout.on('data', (c) => { log += c; });
  child.stderr.on('data', (c) => { log += c; });
  const base = 'http://127.0.0.1:' + port;
  for (let i = 0; i < 100; i++) {
    try { const r = await fetch(base + '/api/health'); if (r.ok) break; } catch {}
    await new Promise((r) => setTimeout(r, 100));
    if (i === 99) throw new Error('引擎未启动：\n' + log);
  }
  const api = async (method, url, body, headers = {}) => {
    const r = await fetch(base + url, {
      method,
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), 'X-Djian-Client': 'test', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await r.text();
    let json;
    try { json = JSON.parse(text); } catch { json = text; }
    return { status: r.status, body: json, headers: r.headers };
  };
  const stop = async () => {
    child.kill();
    await new Promise((r) => child.once('exit', r));
    fs.rmSync(dataDir, { recursive: true, force: true });
  };
  return { base, port, dataDir, api, stop, log: () => log, child };
}

/** 读 SSE 流，收集事件直到 predicate 满足或超时 */
export async function collectSse(url, predicate, timeoutMs = 5000) {
  const controller = new AbortController();
  const events = [];
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: controller.signal });
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n\n')) !== -1) {
        const block = buf.slice(0, i);
        buf = buf.slice(i + 2);
        const type = /^event: (.*)$/m.exec(block)?.[1];
        const data = /^data: (.*)$/m.exec(block)?.[1];
        if (type) events.push({ type, data: data ? JSON.parse(data) : null });
        if (predicate(events)) { controller.abort(); return events; }
      }
    }
  } catch (e) {
    if (e.name !== 'AbortError') throw e;
  } finally {
    clearTimeout(timer);
  }
  return events;
}

export const EXAMPLE_VIDEO = path.join(ROOT, 'examples/assets/a.mp4');
