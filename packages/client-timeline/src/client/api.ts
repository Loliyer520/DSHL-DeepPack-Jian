// D剪 引擎服务（5180）API 客户端
export const API_BASE = 'http://127.0.0.1:5180';

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
