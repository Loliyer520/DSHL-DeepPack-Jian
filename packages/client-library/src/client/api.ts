// 资源库 API：复用剪辑面板的引擎发现与请求（启动器锚点/缓存/探测、身份头、断线自愈完全一致）
import { api, request } from '../../../client-timeline/src/client/engine';

export type LibraryKind = 'image' | 'audio';

export interface LibraryItem {
  id: string;
  kind: LibraryKind;
  title: string;
  url: string;
  thumb: string | null;
  license: string;
  source: string;
  creator?: string | null;
  duration: number | null;
}

export interface LibrarySearchResult {
  total: number;
  page: number;
  items: LibraryItem[];
}

export const searchLibrary = (q: string, kind: LibraryKind, page: number) =>
  request<LibrarySearchResult>('GET', '/api/library/search?q=' + encodeURIComponent(q) + '&type=' + kind + '&page=' + page, { timeoutMs: 30_000 });

/** 导入到当前会话绑定的项目（与剪辑面板、AI 工具同一个项目） */
export async function importLibrary(item: LibraryItem, name: string | undefined, sessionId?: string) {
  const project = await api.bindSession(sessionId ?? 'standalone');
  const r = await request<{ name: string; type: string; duration: number | null }>('POST', '/api/p/' + encodeURIComponent(project.id) + '/library/import', {
    body: { url: item.url, name, kind: item.kind, title: item.title, license: item.license, creator: item.creator ?? null },
    timeoutMs: 180_000,
  });
  // 通知同一窗口里的剪辑面板刷新素材列表
  try { window.dispatchEvent(new CustomEvent('djian:assets-changed', { detail: { projectId: project.id, name: r.name } })); } catch { /* 非浏览器 */ }
  return r;
}
