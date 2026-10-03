import { Icon } from './Icon';
import { useProjectSession } from './ProjectSession';
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  assetThumbUrl,
  deleteAsset,
  listAssets,
  uploadAsset,
  type AssetInfo,
} from './api';

const fmtSize = (n: number) =>
  n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)}MB` : `${Math.round(n / 1024)}KB`;
const fmtDur = (d: number | null) => d == null ? '' : `${Math.floor(d / 60)}:${String(Math.floor(d % 60)).padStart(2, '0')}`;
const kinds = { video: '视频', image: '图片', audio: '音频' };

// 与时间线共用一个素材集合；详情和删除操作只展开当前行。
export const AssetsSection: React.FC<{
  onAddClip: (asset: AssetInfo) => void;
  onAddAudio: (asset: AssetInfo) => void;
  usedSources?: readonly string[];
  videoTarget?: '主轨道' | '画中画';
}> = ({ onAddClip, onAddAudio, usedSources = [], videoTarget = '主轨道' }) => {
  const sessionId = useProjectSession();
  const [assets, setAssets] = useState<AssetInfo[]>([]);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | AssetInfo['type']>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const detailsId = useId();
  const sectionRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const alive = useRef(false);
  const operation = useRef(false);
  const pending = useRef<AbortController | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const usage = useMemo(() => {
    const counts = new Map<string, number>();
    for (const src of usedSources) {
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(src)) continue;
      const name = src.replace(/\\/g, '/').split('/').pop() ?? src;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return counts;
  }, [usedSources]);
  const visible = assets.filter(a => (kind === 'all' || a.type === kind) && a.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const restoreMoreFocus = (name: string) => {
    sectionRef.current?.querySelectorAll<HTMLButtonElement>('[data-asset-more]').forEach(button => {
      if (button.dataset.assetMore === name) button.focus();
    });
  };
  useEffect(() => { if (confirming) cancelRef.current?.focus(); }, [confirming]);

  const refresh = useCallback(async () => {
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const next = await listAssets(sessionId, controller.signal);
      if (!alive.current || pending.current !== controller) return;
      setAssets(next);
      setLoadError('');
    } catch {
      if (alive.current && pending.current === controller) setLoadError('素材暂时无法加载，请检查连接后重试。');
    } finally {
      window.clearTimeout(timeout);
      if (alive.current && pending.current === controller) setLoading(false);
    }
  }, [sessionId]);
  useEffect(() => {
    alive.current = true;
    let stopped = false;
    let timer: number;
    const poll = async () => {
      await refresh();
      if (!stopped) timer = window.setTimeout(poll, 5000);
    };
    void poll();
    return () => { stopped = true; alive.current = false; window.clearTimeout(timer); pending.current?.abort(); };
  }, [refresh]);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length || operation.current) return;
    operation.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    const batch = Array.from(files);
    const failures: string[] = [];
    try {
      for (const [index, f] of batch.entries()) {
        if (!alive.current) break;
        setProgress(`上传 ${index + 1}/${batch.length} · ${f.name}`);
        try { await uploadAsset(f, sessionId); }
        catch (e) { failures.push(`${f.name}：${e instanceof Error ? e.message : String(e)}`); }
      }
      if (alive.current) {
        setError(failures.length ? `${failures.length} 个素材上传失败：${failures.join('；')}` : '');
        setNotice(`已上传 ${batch.length - failures.length}/${batch.length} 个素材`);
        await refresh();
      }
    } finally {
      operation.current = false;
      if (alive.current) { setBusy(false); setProgress(''); }
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onDelete = async (name: string) => {
    if (operation.current || usage.has(name)) return;
    operation.current = true;
    setDeleting(name);
    setError('');
    try {
      await deleteAsset(name, sessionId);
      if (alive.current) {
        setAssets(current => current.filter(a => a.name !== name));
        setConfirming(null);
        setExpanded(null);
        setNotice(`已删除 ${name}`);
        searchRef.current?.focus();
        await refresh();
      }
    } catch (e) {
      if (alive.current) setError(e instanceof Error ? e.message : String(e));
    } finally {
      operation.current = false;
      if (alive.current) setDeleting(null);
    }
  };

  return (
    <div className="djp-section djp-asset-browser" ref={sectionRef} onKeyDown={e => {
      if (e.key === 'Escape' && expanded) {
        e.stopPropagation();
        setConfirming(null);
        setExpanded(null);
        restoreMoreFocus(expanded);
      }
    }}>
      <div className="djp-asset-toolbar">
        <div className="djp-asset-search">
          <Icon name="search" />
          <input ref={searchRef} type="search" aria-label="搜索当前项目素材" placeholder="搜索素材" value={query} onChange={e => { setQuery(e.target.value); setExpanded(null); setConfirming(null); }} />
        </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="video/*,image/*,audio/*"
            style={{ display: 'none' }}
            onChange={(e) => void onFiles(e.target.files)}
          />
          <button
            className="djp-btn"
            disabled={busy || deleting !== null}
            onClick={() => fileRef.current?.click()}
            title="上传视频/图片/音频到当前项目素材文件夹"
          >
            {busy ? '上传中…' : '上传'}
          </button>
      </div>
      <div className="djp-asset-filters" role="group" aria-label="素材类型">
        {(['all', 'video', 'image', 'audio'] as const).map(type => <button key={type} type="button" aria-pressed={kind === type} onClick={() => { setKind(type); setExpanded(null); setConfirming(null); }}>{type === 'all' ? '全部' : kinds[type]}</button>)}
        <span>{visible.length} 项</span>
      </div>
      {progress && <div className="djp-hint" role="status">{progress}</div>}
      {notice && <div className="djp-hint" role="status">{notice}</div>}
      {error && <div className="djp-hint" role="alert" style={{ color: 'var(--dsw-alias-state-error-primary)' }}>{error}</div>}
      {loadError && <div className="djp-hint" role="status">{loadError} <button className="djp-btn" onClick={() => void refresh()}>重试</button></div>}
      {visible.length === 0 ? (
          <div className="djp-asset-empty">{loading ? '正在加载素材…' : loadError && assets.length === 0 ? '连接恢复后将显示素材' : assets.length === 0 ? '点「上传」添加视频、图片或音频' : <>没有匹配的素材<button className="djp-btn" onClick={() => { setQuery(''); setKind('all'); searchRef.current?.focus(); }}>清除筛选</button></>}</div>
        ) : (
          <ul className="djp-assets" aria-label="项目素材">
            {visible.map((a) => (
              <li className="djp-asset" key={a.name}>
                <div className="djp-asset-row">
                {a.thumb ? (
                  <img className="djp-asset-thumb" src={assetThumbUrl(a.name, sessionId)} alt="" loading="lazy" />
                ) : (
                  <div className={`djp-asset-thumb djp-asset-${a.type}`}><Icon name={a.type === 'audio' ? 'music' : a.type === 'image' ? 'image' : 'film'} /></div>
                )}
                <div className="djp-asset-info">
                  <div className="djp-asset-name" title={a.name}>{a.name}</div>
                  <div className="djp-asset-meta"><span>{kinds[a.type]}{a.duration != null ? ` · ${fmtDur(a.duration)}` : ''}</span>{usage.has(a.name) && <span className="djp-asset-used">已用 {usage.get(a.name)}</span>}</div>
                </div>
                <div className="djp-asset-acts">
                  <button className="djp-iconbtn" title={a.type === 'audio' ? '添加到音频轨道' : `添加到${videoTarget}`} aria-label={`添加 ${a.name} 到${a.type === 'audio' ? '音频轨道' : videoTarget}`} disabled={deleting === a.name} onClick={() => { if (a.type === 'audio') onAddAudio(a); else onAddClip(a); setNotice(`已添加 ${a.name} 到${a.type === 'audio' ? '音频轨道' : videoTarget}`); }}><Icon name="plus" /></button>
                  <button className="djp-iconbtn" title="素材详情与操作" data-asset-more={a.name} aria-label={`更多操作 ${a.name}`} aria-expanded={expanded === a.name} aria-controls={expanded === a.name ? detailsId : undefined} onClick={() => { setExpanded(expanded === a.name ? null : a.name); setConfirming(null); }}><Icon name="dots" /></button>
                </div>
                </div>
                {expanded === a.name && <div className="djp-asset-details" id={detailsId}>
                  <span className="djp-asset-filename">{a.name}</span>
                  {confirming === a.name ? <div className="djp-asset-confirm" role="group" aria-label={`确认删除 ${a.name}`}>
                    <span>{usage.has(a.name) ? '此素材已被时间线使用，请先移除对应片段。' : '从项目中永久删除此素材？此操作无法撤销。'}</span>
                    <div><button className="djp-btn" ref={cancelRef} disabled={deleting !== null} onClick={() => { setConfirming(null); restoreMoreFocus(a.name); }}>取消</button><button className="djp-btn djp-error" disabled={busy || deleting !== null || usage.has(a.name)} onClick={() => void onDelete(a.name)}>{deleting === a.name ? '删除中…' : '确认删除'}</button></div>
                  </div> : <div className="djp-asset-detail-actions"><span>{fmtSize(a.size)}{usage.has(a.name) ? ' · 请先移除时间线中的引用再删除' : ''}</span><button className="djp-iconbtn" title={usage.has(a.name) ? '素材正在时间线中使用' : '删除素材'} aria-label={`删除素材 ${a.name}`} disabled={busy || deleting !== null || usage.has(a.name)} onClick={() => setConfirming(a.name)}><Icon name="trash" /></button></div>}
                </div>}
              </li>
            ))}
          </ul>
        )}
    </div>
  );
};
