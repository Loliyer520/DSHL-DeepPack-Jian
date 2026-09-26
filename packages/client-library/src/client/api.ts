// D剪 引擎服务 API 客户端（与剪辑面板同一约定）
// 端口发现：启动器 portAutoBump 后引擎可能不在 5180。策略 = localStorage 缓存端口 →
// 从 5180 起 +0..+10 逐个探 /api/health（与启动器 portAutoBump 扫描窗口一致）→
// 第一个通的即用并写缓存；全失败回落 5180。
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

let discovery: Promise<void> | null = null;
// 模块加载即启动探测（幂等）。探测成功后就地改写 API_BASE；各 API 函数都是
// 调用时读绑定，自动跟随新地址。
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
          return;
        }
      } catch { /* 端口不通，试下一个 */ }
    }
    // 全失败：维持默认，后续请求照旧报错（与引擎未启动行为一致）
  })();
  return discovery;
}
void ensureEngineBase();

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
