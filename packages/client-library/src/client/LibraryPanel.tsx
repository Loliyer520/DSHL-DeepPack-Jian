import React, { useEffect, useRef, useState } from 'react';
import { importLibrary, searchLibrary, type LibraryItem, type LibraryKind } from './api';

const fmtDur = (s: number | null) => {
  if (s == null) return '';
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `0:${String(sec).padStart(2, '0')}`;
};

type ImportState = 'idle' | 'busy' | 'done' | 'err';

// 资源库面板：在线 CC 素材（Openverse 聚合，免 key）搜索 → 预览/试听 → 一键导入当前项目素材库
export const LibraryPanel: React.FC = () => {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<LibraryKind>('image');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [imports, setImports] = useState<Record<string, { st: ImportState; name?: string; err?: string }>>({});
  const lastQuery = useRef('');

  const doSearch = async (query: string, k: LibraryKind, p: number) => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const r = await searchLibrary(query.trim(), k, p);
      setItems(r.items);
      setTotal(r.total);
      setPage(r.page);
      lastQuery.current = query.trim();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  // 切换类型时按当前关键词重搜
  useEffect(() => {
    if (lastQuery.current) doSearch(lastQuery.current, kind, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const doImport = async (it: LibraryItem) => {
    setImports((m) => ({ ...m, [it.id]: { st: 'busy' } }));
    try {
      const safe = it.title.replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 60);
      const r = await importLibrary(it.url, safe || undefined, it.kind);
      setImports((m) => ({ ...m, [it.id]: { st: 'done', name: r.name } }));
    } catch (e) {
      setImports((m) => ({ ...m, [it.id]: { st: 'err', err: e instanceof Error ? e.message : String(e) } }));
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="djl-root">
      <div className="djl-head">
        <input
          className="djl-input"
          placeholder="搜素材…（英文更准，如 ocean / piano）"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') doSearch(q, kind, 1);
          }}
        />
        <button className="djl-btn djl-primary" disabled={loading || !q.trim()} onClick={() => doSearch(q, kind, 1)}>
          {loading ? '搜索中…' : '搜索'}
        </button>
      </div>
      <div className="djl-tabs">
        {(['image', 'audio'] as const).map((k) => (
          <button key={k} className={`djl-tab ${kind === k ? 'djl-active' : ''}`} onClick={() => setKind(k)}>
            {k === 'image' ? '图片' : '音频'}
          </button>
        ))}
        <span className="djl-total">{total > 0 ? `${total} 条` : ''}</span>
      </div>

      {error && <div className="djl-error">{error}</div>}
      {!loading && !error && items.length === 0 && (
        <div className="djl-hint">
          {lastQuery.current ? '无结果——换个关键词试试（英文更准）' : '输入关键词搜索 CC 授权素材，导入后到「剪辑面板 · 素材」使用'}
        </div>
      )}

      <div className={`djl-grid ${kind === 'audio' ? 'djl-list' : ''}`}>
        {items.map((it) => {
          const im = imports[it.id] ?? { st: 'idle' as ImportState };
          return (
            <div key={it.id} className="djl-card">
              {it.kind === 'image' ? (
                <div className="djl-thumb">
                  <img src={it.thumb ?? it.url} alt={it.title} loading="lazy" />
                </div>
              ) : (
                <div className="djl-audio">
                  <span className="djl-dur">{fmtDur(it.duration)}</span>
                  <audio controls preload="none" src={it.url} />
                </div>
              )}
              <div className="djl-meta" title={`${it.title} · ${it.license}/${it.source}`}>
                <span className="djl-title">{it.title}</span>
                <span className="djl-lic">{it.license}</span>
              </div>
              <button
                className={`djl-btn djl-import ${im.st === 'done' ? 'djl-done' : ''}`}
                disabled={im.st === 'busy' || im.st === 'done'}
                title={im.st === 'err' ? im.err : im.st === 'done' ? `已存为 ${im.name}` : '下载进当前项目素材库'}
                onClick={() => doImport(it)}
              >
                {im.st === 'busy' ? '导入中…' : im.st === 'done' ? '✓ 已入库' : im.st === 'err' ? '失败·重试' : '导入'}
              </button>
            </div>
          );
        })}
      </div>

      {total > 20 && (
        <div className="djl-pager">
          <button className="djl-btn" disabled={page <= 1 || loading} onClick={() => doSearch(lastQuery.current, kind, page - 1)}>
            ‹ 上一页
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button className="djl-btn" disabled={page >= totalPages || loading} onClick={() => doSearch(lastQuery.current, kind, page + 1)}>
            下一页 ›
          </button>
        </div>
      )}
      <div className="djl-foot">Openverse CC 聚合 · 导入后到「剪辑面板 · 素材」拖上轨道 · AI 也可经 search_media 用同一资源库</div>
    </div>
  );
};
