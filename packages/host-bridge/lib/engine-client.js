// 引擎服务客户端：端口发现（DSHL 注入的 DSHL_SERVICE_PORTS > profile 根端口文件 > DJIAN_ENGINE_URL > 探测 5180–5190）
// + 带身份头的 JSON 请求。宿主插件与 MCP 适配器共用。
import fs from 'node:fs';
import path from 'node:path';

const SERVICE = 'djian-engine';
const DEFAULT_PORT = 5180;

function candidatePorts(cwd = process.cwd()) {
  const ports = [];
  const push = (p) => { const n = Number(p); if (Number.isInteger(n) && n > 0 && n < 65536 && !ports.includes(n)) ports.push(n); };
  try { push(JSON.parse(process.env.DSHL_SERVICE_PORTS ?? '{}')[SERVICE]); } catch {}
  try { push(JSON.parse(fs.readFileSync(path.join(cwd, '.dshl-service-ports.json'), 'utf8'))[SERVICE]); } catch {}
  if (process.env.DJIAN_ENGINE_URL) {
    try { push(new URL(process.env.DJIAN_ENGINE_URL).port); } catch {}
  }
  for (const home of [process.env.DJIAN_DATA_DIR, process.env.HOME && path.join(process.env.HOME, '.djian'), path.join(cwd, '.djian')]) {
    if (!home) continue;
    try { push(JSON.parse(fs.readFileSync(path.join(home, 'engine-port.json'), 'utf8')).port); } catch {}
  }
  for (let p = DEFAULT_PORT; p <= DEFAULT_PORT + 10; p++) push(p);
  return ports;
}

async function isEngine(base, timeoutMs = 1200) {
  try {
    const r = await fetch(base + '/api/health', { signal: AbortSignal.timeout(timeoutMs) });
    const j = await r.json().catch(() => null);
    return r.ok && j?.service === SERVICE && j?.protocol >= 2 ? j : null;
  } catch { return null; }
}

export class EngineError extends Error {
  constructor(status, message, body) { super(message); this.status = status; this.body = body; }
}

export class EngineClient {
  constructor({ clientId = 'djian-host', cwd } = {}) {
    this.clientId = clientId;
    this.cwd = cwd ?? process.cwd();
    this.base = null;
    this.discovering = null;
    this.lastFailure = 0;
  }

  async discover(force = false) {
    if (this.base && !force) return this.base;
    if (this.discovering) return this.discovering;
    this.discovering = (async () => {
      for (const port of candidatePorts(this.cwd)) {
        const base = 'http://127.0.0.1:' + port;
        if (await isEngine(base)) { this.base = base; return base; }
      }
      throw new EngineError(503, '找不到 D剪 引擎服务（5180–5190 均无响应）。请确认整合包服务已启动，或重启 D剪。');
    })().finally(() => { this.discovering = null; });
    return this.discovering;
  }

  async request(method, url, { body, timeoutMs = 30_000, signal, raw = false } = {}) {
    const base = await this.discover();
    const signals = [AbortSignal.timeout(timeoutMs), signal].filter(Boolean);
    let response;
    try {
      response = await fetch(base + url, {
        method,
        signal: signals.length > 1 ? AbortSignal.any(signals) : signals[0],
        headers: { 'X-Djian-Client': this.clientId, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (e) {
      // 引擎重启换了端口：重新发现一次再试（10 秒内只重试一次，避免每次调用都扫端口）
      if (e?.name === 'TimeoutError' || e?.name === 'AbortError' || Date.now() - this.lastFailure < 10_000) throw new EngineError(504, '引擎请求失败：' + (e?.message ?? e));
      this.lastFailure = Date.now();
      this.base = null;
      return this.request(method, url, { body, timeoutMs, signal, raw });
    }
    if (raw && response.ok) return response;
    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { error: text }; }
    if (!response.ok) throw new EngineError(response.status, data?.error ?? 'HTTP ' + response.status, data);
    return data;
  }

  get(url, opts) { return this.request('GET', url, opts); }
  post(url, body, opts) { return this.request('POST', url, { ...opts, body }); }

  /** 会话 → 项目（幂等绑定，结果缓存） */
  async projectFor(sessionId) {
    this.projects ??= new Map();
    if (this.projects.has(sessionId)) return this.projects.get(sessionId);
    const r = await this.post('/api/session-project', { sessionId });
    const project = r.project;
    this.projects.set(sessionId, project);
    return project;
  }
}
