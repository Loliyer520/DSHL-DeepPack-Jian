// HTTP 基础设施：安全闸门（Host/Origin/自定义头）、请求体读取、JSON 响应、极简路由。
import { EXTRA_HOSTS, EXTRA_ORIGINS, LIMITS } from './config.mjs';

export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);
const hostnameOf = (host) => {
  if (!host) return '';
  if (host.startsWith('[')) return host.slice(0, host.indexOf(']') + 1);
  return host.split(':')[0].toLowerCase();
};

/** Host 头校验：只认回环（防 DNS 重绑定）；额外主机名可经 DJIAN_ALLOWED_HOSTS 放行 */
export const isAllowedHost = (host) => {
  const name = hostnameOf(host);
  return LOOPBACK_HOSTS.has(name) || EXTRA_HOSTS.includes(name);
};

/** Origin 校验：回环来源（dsh web 壳、Remotion 渲染页）+ DJIAN_ALLOWED_ORIGINS */
export const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (EXTRA_ORIGINS.includes(origin)) return true;
  try {
    const u = new URL(origin);
    return (u.protocol === 'http:' || u.protocol === 'https:') && LOOPBACK_HOSTS.has(u.hostname.toLowerCase() === '[::1]' ? '[::1]' : u.hostname.toLowerCase());
  } catch { return false; }
};

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
export const CLIENT_HEADER = 'x-djian-client';

/**
 * 安全闸门。返回 false 表示已拒绝并写好响应。
 * - Host 必须是回环：挡住 DNS 重绑定
 * - 带 Origin 的请求必须来自回环：挡住任意网页
 * - 写请求必须带 X-Djian-Client 自定义头：迫使跨源请求走预检，挡住 text/plain 表单式 CSRF
 */
export function guard(req, res) {
  const origin = req.headers.origin;
  if (!isAllowedHost(req.headers.host)) {
    res.writeHead(421, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Misdirected request');
    return false;
  }
  if (origin && !isAllowedOrigin(origin)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Origin not allowed');
    return false;
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Expose-Headers', 'Accept-Ranges, Content-Range, Content-Length, X-Djian-Rev');
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Methods': 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range, If-Range, X-Djian-Client, Last-Event-ID',
      'Access-Control-Max-Age': '600',
    }).end();
    return false;
  }
  if (MUTATING.has(req.method) && !req.headers[CLIENT_HEADER]) {
    sendJson(res, 403, { error: '缺少 X-Djian-Client 请求头', code: 'CLIENT_HEADER_REQUIRED' });
    return false;
  }
  return true;
}

/** 读取请求体：按 Buffer 拼接后统一解码，避免多字节字符跨块被截断 */
export function readBuffer(req, limit) {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers['content-length']);
    if (Number.isFinite(declared) && declared > limit) {
      req.resume();
      reject(new HttpError(413, `请求体超过上限（${Math.round(limit / 1024 / 1024)}MB）`));
      return;
    }
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        req.destroy();
        reject(new HttpError(413, `请求体超过上限（${Math.round(limit / 1024 / 1024)}MB）`));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export async function readJson(req, limit = LIMITS.json) {
  const type = String(req.headers['content-type'] ?? '');
  if (!/^application\/json\b/i.test(type)) throw new HttpError(415, '请求体必须是 application/json');
  const buf = await readBuffer(req, limit);
  if (!buf.length) return {};
  try { return JSON.parse(buf.toString('utf8')); }
  catch { throw new HttpError(400, '请求体不是合法 JSON'); }
}

export function sendJson(res, status, body, headers = {}) {
  if (res.headersSent) return;
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(body));
}

/** 极简路由：'/api/p/:pid/ops' 风格，按注册顺序匹配 */
export class Router {
  constructor() { this.routes = []; }
  add(method, pattern, handler) {
    const keys = [];
    const re = new RegExp('^' + pattern.replace(/:([a-zA-Z]+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
    this.routes.push({ method, re, keys, handler });
    return this;
  }
  match(method, pathname) {
    for (const r of this.routes) {
      if (r.method !== method && !(r.method === 'GET' && method === 'HEAD')) continue;
      const m = r.re.exec(pathname);
      if (!m) continue;
      const params = {};
      r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
      return { handler: r.handler, params };
    }
    return null;
  }
}
