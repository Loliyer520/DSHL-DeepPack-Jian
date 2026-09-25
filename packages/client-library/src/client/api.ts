// D剪 引擎服务 API 客户端（与剪辑面板同一约定）
// DSHL 运行态：面板由 webui 服务本身（:5180）托管，同源直连；远程浏览器场景也走 5180
export const API_BASE =
  typeof window !== 'undefined' && window.location
    ? `${window.location.protocol}//${window.location.hostname}:5180`
    : 'http://127.0.0.1:5180';

export type LibraryKind = 'image' | 'audio';

export interface LibraryItem {
  id: string;
  kind: LibraryKind;
  title: string;
  url: string;
  thumb: string | null;
  license: string;
  source: string;
  duration: number | null;
}

export interface LibrarySearchResult {
  total: number;
  page: number;
  items: LibraryItem[];
}

export async function searchLibrary(q: string, kind: LibraryKind, page: number): Promise<LibrarySearchResult> {
  const r = await fetch(`${API_BASE}/api/library/search?q=${encodeURIComponent(q)}&type=${kind}&page=${page}`);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d as { error?: string }).error ?? `HTTP ${r.status}`);
  return d as LibrarySearchResult;
}

export async function importLibrary(url: string, name: string | undefined, kind: LibraryKind): Promise<{ name: string; type: string; duration: number | null }> {
  const r = await fetch(`${API_BASE}/api/library/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, name, kind }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d as { error?: string }).error ?? `HTTP ${r.status}`);
  return d as { name: string; type: string; duration: number | null };
}
