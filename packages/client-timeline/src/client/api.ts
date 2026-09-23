// D剪 引擎服务 API 客户端
// 独立 webui 已下线：浏览器端走 nginx 反代 5192 → 引擎 5180（面板可能在远程浏览器里跑，127.0.0.1 不可达）
export const API_BASE =
  typeof window !== "undefined" && window.location
    ? `${window.location.protocol}//${window.location.hostname}:5192`
    : "http://127.0.0.1:5180";

// 浏览器里预览用的素材绝对地址（src 相对 webui public/dist 根）
export const assetUrl = (src: string) =>
  /^(?:[a-z]+:)?\/\//i.test(src) ? src : `${API_BASE}/${src.replace(/^\/+/, '')}`;

export async function getTimeline<T>(): Promise<T> {
  const r = await fetch(`${API_BASE}/api/internal/timeline`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export async function putTimeline(t: unknown): Promise<void> {
  const r = await fetch(`${API_BASE}/api/internal/timeline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(t),
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

export const exportDownloadUrl = `${API_BASE}/api/export/download`;

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
