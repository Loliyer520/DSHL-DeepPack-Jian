// D剪 引擎服务入口：项目/素材/时间线协同/取帧/导出 HTTP API。
// 安全默认：只监听 127.0.0.1；Host/Origin 校验；写请求必须带 X-Djian-Client 头。
import http from 'node:http';
import fs from 'node:fs';
import { DJIAN_HOME, HOST, LOCK_FILE, PORT, PORT_FILE, VERSION } from './config.mjs';
import { guard, sendJson } from './http.mjs';
import { Store } from './store.mjs';
import { RenderService } from './render-service.mjs';
import { buildRouter } from './routes.mjs';
import { readJsonFile } from './storage.mjs';

fs.mkdirSync(DJIAN_HOME, { recursive: true });

// 同一数据目录只允许一个引擎：两个进程各持一份内存状态会互相覆盖
async function acquireLock() {
  const lock = readJsonFile(LOCK_FILE);
  if (lock?.pid && lock.pid !== process.pid) {
    let alive = false;
    try { process.kill(lock.pid, 0); alive = true; } catch {}
    if (alive && lock.port) {
      try {
        const r = await fetch('http://127.0.0.1:' + lock.port + '/api/health', { signal: AbortSignal.timeout(1500) });
        const j = await r.json();
        if (j?.service === 'djian-engine') {
          console.error('[djian] 数据目录 ' + DJIAN_HOME + ' 已有引擎在运行（pid ' + lock.pid + '，端口 ' + lock.port + '），本进程退出以免数据互相覆盖。');
          process.exit(1);
        }
      } catch { /* 进程在但不是引擎：视为过期锁 */ }
    }
  }
  fs.writeFileSync(LOCK_FILE, JSON.stringify({ pid: process.pid, port: PORT, startedAt: new Date().toISOString() }));
}
await acquireLock();

const store = new Store();
const render = new RenderService({ store, baseUrl: 'http://127.0.0.1:' + PORT });
const router = buildRouter({ store, render });

const server = http.createServer((req, res) => {
  void (async () => {
    if (!guard(req, res)) return;
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    const match = router.match(req.method ?? 'GET', url.pathname);
    if (!match) { sendJson(res, 404, { error: '没有这个接口：' + req.method + ' ' + url.pathname }); return; }
    try {
      await match.handler(req, res, { params: match.params, url });
    } catch (error) {
      const status = error?.status ?? 500;
      if (status >= 500) console.error('[djian] ' + req.method + ' ' + url.pathname + ' 失败：', error?.stack ?? error);
      if (!res.headersSent) sendJson(res, status, { error: error?.message ?? String(error), ...(error?.code ? { code: error.code } : {}), ...(error?.extra ?? {}) });
      else res.destroy();
    }
  })();
});
// MCP/宿主客户端会复用连接：服务端空闲超时要长于客户端（undici 默认 4s），避免竞态断连
server.keepAliveTimeout = 75_000;
server.headersTimeout = 80_000;
server.requestTimeout = 0; // 上传与 SSE 是长请求

server.on('error', (err) => {
  if (err?.code === 'EADDRINUSE') {
    console.error('[djian] 端口 ' + PORT + ' 已被占用。经启动器运行时会自动顺延端口（manifest portAutoBump）；独立运行请释放端口或设置 PORT。');
  } else {
    console.error('[djian] 引擎监听失败：', err?.stack ?? err);
  }
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log('[djian] 引擎 v' + VERSION + ' 已启动：http://' + (HOST === '0.0.0.0' ? '127.0.0.1' : HOST) + ':' + PORT + '（数据目录 ' + DJIAN_HOME + '）');
  // 端口落盘：启动器顺延端口后，宿主插件/MCP 按此文件（或 DSHL_SERVICE_PORTS）发现真实端口
  try { fs.writeFileSync(PORT_FILE, JSON.stringify({ port: PORT, pid: process.pid, host: HOST, version: VERSION, startedAt: new Date().toISOString() })); } catch {}
  if (!process.env.DJIAN_NO_WARMUP) void render.warmup();
});

let closing = false;
async function shutdown(signal) {
  if (closing) return;
  closing = true;
  console.log('[djian] 收到 ' + signal + '，正在退出…');
  server.close();
  await render.close().catch(() => {});
  try { if (readJsonFile(LOCK_FILE)?.pid === process.pid) fs.rmSync(LOCK_FILE, { force: true }); } catch {}
  process.exit(0);
}
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
