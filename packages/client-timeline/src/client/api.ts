// D剪 引擎服务 API 客户端
// 端口发现（分层，越靠前越权威；启动器 portAutoBump 后引擎可能不在 5180）：
// ① 启动器在 Web 地址锚点带进来的 #djian-engine=<端口>（本次启动的真实端口，免探测）
// ② localStorage 缓存（上次验证通过的端口）
// ③ 从 5180 起 +0..+10 逐个探测（与启动器 portAutoBump 扫描窗口一致）
// 每个候选都必须通过 /api/health 身份校验（service === "djian-engine"）：
// 浏览器拿不到进程 env 也读不到档案文件，探测是最后兜底，但不该撞上恰好
// 监听同端口、同样应答 200 的别家服务。
const DEFAULT_PORT = 5180;
const BUMP_RANGE = 10;
const PORT_CACHE_KEY = 'djian.enginePort';

const hostBase = () =>
  typeof window !== 'undefined' && window.location
    ? `${window.location.protocol}//${window.location.hostname}`
    : 'http://127.0.0.1';

export let API_BASE = `${hostBase()}:${DEFAULT_PORT}`;
export let exportDownloadUrl = `${API_BASE}/api/export/download`;

const applyBase = (port: number) => {
  API_BASE = `${hostBase()}:${port}`;
  exportDownloadUrl = `${API_BASE}/api/export/download`;
};

// 身份校验：只认真引擎，健康检查 200 不够
async function isEngine(base: string): Promise<boolean> {
  try {
    const r = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(1500) });
    if (!r.ok) return false;
    const j = (await r.json().catch(() => null)) as { service?: string } | null;
    return j?.service === 'djian-engine';
  } catch { return false; }
}

// 启动器在 Web 地址后追加的锚点（#djian-engine=端口），是本次启动的权威端口
function fragmentPort(): number {
  try {
    const m = /(?:^|[#&])djian-engine=(\d+)/.exec(window.location.hash || '');
    const p = m ? Number(m[1]) : 0;
    return p > 0 && p < 65536 ? p : 0;
  } catch { return 0; }
}

let discovery: Promise<void> | null = null;
// 自愈时 +1 使进行中的旧发现作废，避免并发重发现互相覆盖结果
let generation = 0;
// 模块加载即启动发现（幂等）。成功后就地改写 API_BASE/exportDownloadUrl；
// 各 API 函数都是调用时读绑定，自动跟随新地址。
export function ensureEngineBase(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  discovery ??= (async (gen: number) => {
    const candidates: number[] = [];
    const frag = fragmentPort();
    if (frag > 0) candidates.push(frag);
    let cached = 0;
    try { cached = Number(window.localStorage.getItem(PORT_CACHE_KEY)); } catch { /* 忽略 */ }
    if (cached > 0) candidates.push(cached);
    for (let p = DEFAULT_PORT; p <= DEFAULT_PORT + BUMP_RANGE; p++) if (!candidates.includes(p)) candidates.push(p);
    for (const p of candidates) {
      const base = `${hostBase()}:${p}`;
      if (await isEngine(base)) {
        if (gen !== generation) return; // 发现期间已被更新的重发现接管
        try { window.localStorage.setItem(PORT_CACHE_KEY, String(p)); } catch { /* 忽略 */ }
        applyBase(p);
        return;
      }
    }
    // 全失败：维持默认，后续请求照旧报错（与引擎未启动行为一致）
  })(generation);
  return discovery;
}

let lastHealAt = 0;
// 断线自愈：引擎重启换口后，旧地址连接失败（TypeError）→ 作废缓存重新发现，再重试本次请求。
// 引擎彻底下线时限流（10 秒内只重发现一次），面板 2 秒轮询不至于每次都全量扫端口。
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_BASE}${path}`, init);
  } catch (e) {
    if (!(e instanceof TypeError)) throw e; // 只救网络失败；HTTP 错误与中止照常抛
    if (Date.now() - lastHealAt < 10_000) throw e;
    lastHealAt = Date.now();
    discovery = null;
    generation++;
    try { window.localStorage.removeItem(PORT_CACHE_KEY); } catch { /* 忽略 */ }
    await ensureEngineBase();
    return fetch(`${API_BASE}${path}`, init);
  }
}
void ensureEngineBase();

// 浏览器里预览用的素材绝对地址（src 相对 webui public/dist 根）
export const assetUrl = (src: string) =>
  /^(?:[a-z]+:)?\/\//i.test(src) ? src : `${API_BASE}/${src.replace(/^\/+/, '')}`;

// peek=1：隐藏面板的窥探轮询——服务端只读本会话项目，不翻动全局 current（防多会话串项目）
export async function getTimeline<T>(sessionId?: string, peek = false): Promise<T> {
  const q = sessionId
    ? `?session=${encodeURIComponent(sessionId)}${peek ? '&peek=1' : ''}`
    : '';
  const r = await apiFetch(`/api/internal/timeline${q}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export async function putTimeline(t: unknown, sessionId?: string): Promise<void> {
  const r = await apiFetch(`/api/internal/timeline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionId ? { timeline: t, sessionId } : t),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
}

export type ExportStatus =
  | { status: 'idle' }
  | { status: 'rendering'; progress: { percent: number; stage?: string } }
  | { status: 'done'; result: { fileName: string; sizeBytes: number } }
  | { status: 'error'; error?: string };

export async function startExport(timeline: unknown): Promise<void> {
  const r = await apiFetch(`/api/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timeline }),
  });
  if (r.status !== 202) {
    const d = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(d.error ?? `HTTP ${r.status}`);
  }
}

export async function getExportStatus(): Promise<ExportStatus> {
  const r = await apiFetch(`/api/export/status`);
  return r.json();
}

// ---- 导出参数版 ----
export async function startExportWith(timeline: unknown, opts: { scale?: number; quality?: string }): Promise<void> {
  const r = await apiFetch(`/api/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timeline, scale: opts.scale ?? 1, quality: opts.quality ?? 'standard' }),
  });
  if (r.status !== 202) {
    const d = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(d.error ?? `HTTP ${r.status}`);
  }
}

// ---- 项目管理 ----
// 会话=项目：面板挂载时绑定（幂等），返回该 dsh 会话固定使用的项目
export async function sessionProject(sessionId: string): Promise<ProjectInfo | null> {
  const r = await apiFetch(`/api/session-project`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = (await r.json()) as { project?: ProjectInfo };
  return d.project ?? null;
}

// 内置字幕字体（与 engine fonts.ts 同源，经 webui /api/fonts 提供）
export interface DjianFontInfo {
  id: 'sans' | 'serif' | 'kuaile' | 'qingke' | 'mashan' | string;
  label: string;
  variable: boolean;
}
export async function listFonts(): Promise<DjianFontInfo[]> {
  const r = await apiFetch(`/api/fonts`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return ((await r.json()) as { fonts: DjianFontInfo[] }).fonts ?? [];
}

export interface ProjectInfo {
  id: string;
  name: string;
  createdAt: string | null;
  meta: { fps: number; width: number; height: number } | null;
}

export async function listProjects(): Promise<{ current: string; projects: ProjectInfo[] }> {
  const r = await apiFetch(`/api/projects`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export async function createProject(name: string, meta?: { fps?: number; width?: number; height?: number }): Promise<{ id: string; name: string }> {
  const r = await apiFetch(`/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, meta }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export async function switchProject(id: string): Promise<void> {
  const r = await apiFetch(`/api/current`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
}

export async function renameProject(id: string, name: string): Promise<void> {
  const r = await apiFetch(`/api/projects/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
}

// ---- 素材库 ----
export interface AssetInfo {
  name: string;
  type: 'video' | 'image' | 'audio';
  size: number;
  duration: number | null;
  thumb: string | null;
}

export async function listAssets(): Promise<AssetInfo[]> {
  const r = await apiFetch(`/api/assets`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()).assets ?? [];
}

export async function uploadAsset(file: File): Promise<AssetInfo> {
  const r = await apiFetch(`/api/assets?name=${encodeURIComponent(file.name)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: file,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d as { error?: string }).error ?? `HTTP ${r.status}`);
  return d as AssetInfo;
}

export async function deleteAsset(name: string): Promise<void> {
  const r = await apiFetch(`/api/assets/${encodeURIComponent(name)}`, { method: 'DELETE' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
}

export const assetThumbUrl = (name: string) => `${API_BASE}/api/assets/${encodeURIComponent(name)}/thumb`;
// 素材本体地址（预览播放器用）
export const assetMediaUrl = (name: string) => `${API_BASE}/project-assets/${encodeURIComponent(name)}`;
