// D剪 引擎服务 API 客户端（与剪辑面板同一约定）
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

const applyBase = (port: number) => {
  API_BASE = `${hostBase()}:${port}`;
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
// 模块加载即启动发现（幂等）。成功后就地改写 API_BASE；
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
// 引擎彻底下线时限流（10 秒内只重发现一次），面板轮询不至于每次都全量扫端口。
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
  const r = await apiFetch(`/api/library/search?q=${encodeURIComponent(q)}&type=${kind}&page=${page}`);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d as { error?: string }).error ?? `HTTP ${r.status}`);
  return d as LibrarySearchResult;
}

export async function importLibrary(url: string, name: string | undefined, kind: LibraryKind, sessionId?: string): Promise<{ name: string; type: string; duration: number | null }> {
  const r = await apiFetch(`/api/library/import${sessionId ? `?session=${encodeURIComponent(sessionId)}` : ''}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, name, kind }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d as { error?: string }).error ?? `HTTP ${r.status}`);
  return d as { name: string; type: string; duration: number | null };
}
