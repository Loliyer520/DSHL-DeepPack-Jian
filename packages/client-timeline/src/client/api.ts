// D剪 引擎服务 API 客户端
// 端口发现：启动器 portAutoBump 后引擎可能不在 5180。浏览器拿不到进程 env 也读不到
// 档案文件，策略 = localStorage 缓存端口 → 从 5180 起 +0..+10 逐个探 /api/health
// （与启动器 portAutoBump 扫描窗口一致）→ 第一个通的即用并写缓存；全失败回落 5180。
const DEFAULT_PORT = 5180;
const BUMP_RANGE = 10;
const PORT_CACHE_KEY = 'djian.enginePort';

const hostBase = () =>
  typeof window !== 'undefined' && window.location
    ? `${window.location.protocol}//${window.location.hostname}`
    : 'http://127.0.0.1';

export let API_BASE = (() => {
  try {
    const cached = Number(window.localStorage.getItem(PORT_CACHE_KEY));
    if (cached > 0) return `${hostBase()}:${cached}`;
  } catch { /* localStorage 不可用 */ }
  return `${hostBase()}:${DEFAULT_PORT}`;
})();

export let exportDownloadUrl = `${API_BASE}/api/export/download`;

let discovery: Promise<void> | null = null;
// 模块加载即启动探测（幂等）。探测成功后就地改写 API_BASE/exportDownloadUrl；
// 各 API 函数都是调用时读绑定，自动跟随新地址。
export function ensureEngineBase(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  discovery ??= (async () => {
    let cached = 0;
    try { cached = Number(window.localStorage.getItem(PORT_CACHE_KEY)); } catch { /* 忽略 */ }
    const candidates: number[] = cached > 0 ? [cached] : [];
    for (let p = DEFAULT_PORT; p <= DEFAULT_PORT + BUMP_RANGE; p++) if (!candidates.includes(p)) candidates.push(p);
    for (const p of candidates) {
      try {
        const r = await fetch(`${hostBase()}:${p}/api/health`, { signal: AbortSignal.timeout(1500) });
        if (r.ok) {
          try { window.localStorage.setItem(PORT_CACHE_KEY, String(p)); } catch { /* 忽略 */ }
          API_BASE = `${hostBase()}:${p}`;
          exportDownloadUrl = `${API_BASE}/api/export/download`;
          return;
        }
      } catch { /* 端口不通，试下一个 */ }
    }
    // 全失败：维持默认，后续请求照旧报错（与引擎未启动行为一致）
  })();
  return discovery;
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
  const r = await fetch(`${API_BASE}/api/internal/timeline${q}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export async function putTimeline(t: unknown, sessionId?: string): Promise<void> {
  const r = await fetch(`${API_BASE}/api/internal/timeline`, {
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
  const r = await fetch(`${API_BASE}/api/export`, {
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
  const r = await fetch(`${API_BASE}/api/export/status`);
  return r.json();
}

// ---- 导出参数版 ----
export async function startExportWith(timeline: unknown, opts: { scale?: number; quality?: string }): Promise<void> {
  const r = await fetch(`${API_BASE}/api/export`, {
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
  const r = await fetch(`${API_BASE}/api/session-project`, {
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
  const r = await fetch(`${API_BASE}/api/fonts`);
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
  const r = await fetch(`${API_BASE}/api/projects`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export async function createProject(name: string, meta?: { fps?: number; width?: number; height?: number }): Promise<{ id: string; name: string }> {
  const r = await fetch(`${API_BASE}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, meta }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export async function switchProject(id: string): Promise<void> {
  const r = await fetch(`${API_BASE}/api/current`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
}

export async function renameProject(id: string, name: string): Promise<void> {
  const r = await fetch(`${API_BASE}/api/projects/${encodeURIComponent(id)}`, {
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
  const r = await fetch(`${API_BASE}/api/assets`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()).assets ?? [];
}

export async function uploadAsset(file: File): Promise<AssetInfo> {
  const r = await fetch(`${API_BASE}/api/assets?name=${encodeURIComponent(file.name)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: file,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d as { error?: string }).error ?? `HTTP ${r.status}`);
  return d as AssetInfo;
}

export async function deleteAsset(name: string): Promise<void> {
  const r = await fetch(`${API_BASE}/api/assets/${encodeURIComponent(name)}`, { method: 'DELETE' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
}

export const assetThumbUrl = (name: string) => `${API_BASE}/api/assets/${encodeURIComponent(name)}/thumb`;
// 素材本体地址（预览播放器用）
export const assetMediaUrl = (name: string) => `${API_BASE}/project-assets/${encodeURIComponent(name)}`;
