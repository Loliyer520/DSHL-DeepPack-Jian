// 引擎服务 API：端口发现（启动器锚点 #djian-engine=端口 > 本地缓存 > 5180–5190 探测）+ 带身份头的请求
import type { Timeline } from '../../../engine/src/schema';

const SERVICE = 'djian-engine';
const DEFAULT_PORT = 5180;
const PORT_CACHE = 'djian.enginePort';
const HEADERS = { 'X-Djian-Client': 'panel' };

const hostBase = () => (typeof window !== 'undefined' && window.location?.hostname
  ? 'http://' + (window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname)
  : 'http://127.0.0.1');

let base = hostBase() + ':' + DEFAULT_PORT;
export const engineBase = () => base;

async function isEngine(candidate: string) {
  try {
    const r = await fetch(candidate + '/api/health', { signal: AbortSignal.timeout(1500) });
    const j = (await r.json().catch(() => null)) as { service?: string; protocol?: number } | null;
    return r.ok && j?.service === SERVICE && (j.protocol ?? 1) >= 2;
  } catch { return false; }
}

function fragmentPort() {
  try {
    const m = /(?:^|[#&])djian-engine=(\d+)/.exec(window.location.hash || '');
    const p = m ? Number(m[1]) : 0;
    return p > 0 && p < 65536 ? p : 0;
  } catch { return 0; }
}

let discovery: Promise<string> | null = null;
export function discoverEngine(force = false): Promise<string> {
  if (force) discovery = null;
  discovery ??= (async () => {
    const ports: number[] = [];
    const push = (p: number) => { if (p > 0 && !ports.includes(p)) ports.push(p); };
    push(fragmentPort());
    try { push(Number(localStorage.getItem(PORT_CACHE))); } catch { /* 存储不可用 */ }
    for (let p = DEFAULT_PORT; p <= DEFAULT_PORT + 10; p++) push(p);
    for (const p of ports) {
      const candidate = hostBase() + ':' + p;
      if (await isEngine(candidate)) {
        base = candidate;
        try { localStorage.setItem(PORT_CACHE, String(p)); } catch { /* 忽略 */ }
        return candidate;
      }
    }
    discovery = null;
    throw new EngineError('找不到剪辑引擎服务，请确认 D剪 已启动', 503);
  })();
  return discovery;
}

export class EngineError extends Error {
  constructor(message: string, public status: number, public code?: string, public body?: unknown) { super(message); }
}

let lastHeal = 0;
export async function request<T = unknown>(method: string, path: string, init: { body?: unknown; raw?: BodyInit; signal?: AbortSignal; timeoutMs?: number; headers?: Record<string, string> } = {}): Promise<T> {
  await discoverEngine();
  const doFetch = () => fetch(base + path, {
    method,
    signal: init.signal ?? AbortSignal.timeout(init.timeoutMs ?? 20_000),
    headers: { ...HEADERS, ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
    body: init.raw ?? (init.body === undefined ? undefined : JSON.stringify(init.body)),
  });
  let r: Response;
  try { r = await doFetch(); }
  catch (e) {
    // 引擎重启换了端口：重新发现一次再试（10 秒内只救一次）
    if (!(e instanceof TypeError) || Date.now() - lastHeal < 10_000) throw e;
    lastHeal = Date.now();
    try { localStorage.removeItem(PORT_CACHE); } catch { /* 忽略 */ }
    await discoverEngine(true);
    r = await doFetch();
  }
  const text = await r.text();
  let data: unknown = undefined;
  try { data = text ? JSON.parse(text) : undefined; } catch { data = text; }
  if (!r.ok) {
    const d = data as { error?: string; code?: string } | undefined;
    throw new EngineError(d?.error ?? 'HTTP ' + r.status, r.status, d?.code, data);
  }
  return data as T;
}

// ---------- 类型 ----------
export interface ProjectInfo { id: string; name: string; createdAt: string | null; meta: { fps: number; width: number; height: number } | null }
export interface Receipt { index: number; op: string; status: 'applied' | 'ignored' | 'partial' | 'rejected'; id?: string; ids?: string[]; reason?: string; warnings?: string[] }
export type Op = { op: string; [k: string]: unknown };
export interface OpsResult { rev: number; receipts: Receipt[]; changed: string[]; summary: string[]; patch: Op[]; conflicts: { key: string; rev: number; actor: string; summary?: string }[]; duplicate?: boolean }
export interface EngineEvent { rev: number; at: string; actor: 'user' | 'ai' | 'system'; clientId: string | null; label: string | null; summary: string[]; changed: string[]; patch?: Op[]; inverse?: Op[] }
export interface AssetInfo { name: string; type: 'video' | 'image' | 'audio'; size: number; duration: number | null; width: number | null; height: number | null; hasAudio: boolean; usage: number; error: string | null; thumb: string | null; media: string }
export interface Presence { clientId: string; actor: 'user' | 'ai'; status?: string | null; label?: string | null; at: number }
export interface Snapshot { id: string; at: string; label: string; rev: number | null; actor: string }
export interface ExportStatus { jobId: string; status: 'rendering' | 'done' | 'error' | 'cancelled'; progress: { percent: number; stage: string }; result?: { fileName: string; sizeBytes: number }; error?: string }

const P = (pid: string) => '/api/p/' + encodeURIComponent(pid);
export const api = {
  bindSession: (sessionId: string) => request<{ project: ProjectInfo }>('POST', '/api/session-project', { body: { sessionId } }).then((r) => r.project),
  timeline: (pid: string) => request<{ rev: number; timeline: Timeline; readOnly?: string }>('GET', P(pid) + '/timeline'),
  ops: (pid: string, body: { ops: Op[]; baseRev?: number; clientId: string; label?: string; batchId: string; undo?: boolean }) =>
    request<OpsResult>('POST', P(pid) + '/ops', { body: { ...body, actor: 'user' }, timeoutMs: 30_000 }),
  changes: (pid: string, since: number) => request<{ rev: number; events: EngineEvent[]; truncated: boolean }>('GET', P(pid) + '/changes?since=' + since + '&patch=1&limit=200'),
  presence: (pid: string, body: Record<string, unknown>) => request('POST', P(pid) + '/presence', { body, timeoutMs: 5000 }),
  assets: (pid: string, signal?: AbortSignal) => request<{ assets: AssetInfo[]; assetsDir: string }>('GET', P(pid) + '/assets', { signal }),
  upload: (pid: string, file: File, signal?: AbortSignal) => request<{ name: string; type: string; duration: number | null }>('POST', P(pid) + '/assets?name=' + encodeURIComponent(file.name), { raw: file, headers: { 'Content-Type': 'application/octet-stream' }, signal, timeoutMs: 600_000 }),
  deleteAsset: (pid: string, name: string) => request('DELETE', P(pid) + '/assets/' + encodeURIComponent(name)),
  sprite: (pid: string, name: string) => request<{ interval: number; count: number; height: number; url: string }>('GET', P(pid) + '/assets/' + encodeURIComponent(name) + '/sprite', { timeoutMs: 200_000 }),
  history: (pid: string) => request<{ snapshots: Snapshot[] }>('GET', P(pid) + '/history'),
  saveVersion: (pid: string, label: string) => request('POST', P(pid) + '/history', { body: { label } }),
  restore: (pid: string, id: string, clientId: string) => request<OpsResult>('POST', P(pid) + '/history/' + encodeURIComponent(id) + '/restore', { body: { clientId }, timeoutMs: 30_000 }),
  fonts: () => request<{ fonts: { id: string; label: string; variable: boolean }[] }>('GET', '/api/fonts').then((r) => r.fonts),
  startExport: (pid: string, body: { scale: number; quality: string }) => request<{ jobId: string }>('POST', P(pid) + '/export', { body }),
  exportStatus: (jobId: string) => request<ExportStatus>('GET', '/api/export/' + encodeURIComponent(jobId)),
  cancelExport: (jobId: string) => request('POST', '/api/export/' + encodeURIComponent(jobId) + '/cancel', { body: {} }),
  rename: (pid: string, name: string) => request('PATCH', '/api/projects/' + encodeURIComponent(pid), { body: { name } }),
};

export const mediaUrl = (pid: string, name: string) => base + P(pid) + '/media/' + encodeURIComponent(name);
export const assetBaseUrl = (pid: string) => base + P(pid) + '/media/';
export const fontsBaseUrl = () => base + '/fonts';
export const absolute = (path: string) => (path.startsWith('http') ? path : base + path);
export const exportDownloadUrl = (jobId: string) => base + '/api/export/' + encodeURIComponent(jobId) + '/download';
export const eventsUrl = (pid: string, since: number) => base + P(pid) + '/events?since=' + since;
export const peaksUrl = (pid: string, name: string) => base + P(pid) + '/assets/' + encodeURIComponent(name) + '/peaks';
