// 素材：本项目素材列表（拖到时间线 / 一键添加）、上传（拖入或选择文件）、筛选与搜索、删除未使用素材
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, useStore } from '../context';
import { absolute, api, type AssetInfo } from '../engine';
import { forgetAsset } from '../media';
import { Icon } from '../Icon';
import { ContextMenu, type MenuItem } from './common';
import type { Actions } from '../actions';

const TYPE_LABEL = { video: '视频', image: '图片', audio: '音频' } as const;
const fmtDur = (s: number | null) => (s == null ? '' : s >= 60 ? Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') : s.toFixed(1) + 's');
const fmtSize = (b: number) => (b > 1 << 30 ? (b / (1 << 30)).toFixed(1) + 'GB' : b > 1 << 20 ? (b / (1 << 20)).toFixed(1) + 'MB' : Math.max(1, Math.round(b / 1024)) + 'KB');

export function AssetsPane({ actions }: { actions: Actions }) {
  const ed = useEditor();
  const project = useStore((s) => s.project);
  const rev = useStore((s) => s.rev);
  const assetsRev = useStore((s) => s.assetsRev);
  const [assets, setAssets] = useState<AssetInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | AssetInfo['type']>('all');
  const [query, setQuery] = useState('');
  const [over, setOver] = useState(false);
  const [uploading, setUploading] = useState<{ done: number; total: number; name: string } | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const pid = project?.id;

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!pid) return;
    try {
      const r = await api.assets(pid, signal);
      setAssets(r.assets);
      setError(null);
    } catch (e) {
      if (!signal?.aborted) setError(e instanceof Error ? e.message : String(e));
    }
  }, [pid]);
  // 时间线变化会改变“已使用次数”；合并到 800ms 一次
  useEffect(() => {
    const ac = new AbortController();
    const t = setTimeout(() => void load(ac.signal), assets ? 800 : 0);
    return () => { clearTimeout(t); ac.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, rev, assetsRev]);
  useEffect(() => {
    const onFocus = () => void load();
    window.addEventListener('focus', onFocus);
    // 资源库面板（同一窗口）导入素材后广播
    window.addEventListener('djian:assets-changed', onFocus);
    return () => { window.removeEventListener('focus', onFocus); window.removeEventListener('djian:assets-changed', onFocus); };
  }, [load]);

  const upload = async (files: File[]) => {
    if (!pid || !files.length) return;
    let done = 0;
    for (const f of files) {
      setUploading({ done, total: files.length, name: f.name });
      try { await api.upload(pid, f); }
      catch (e) { ed.store.toast('error', '上传「' + f.name + '」失败：' + (e instanceof Error ? e.message : String(e))); }
      done++;
    }
    setUploading(null);
    await load();
    ed.store.toast('info', '已上传 ' + done + ' 个文件，拖到时间线或点 + 添加');
  };

  const remove = async (a: AssetInfo) => {
    if (!pid) return;
    try {
      await api.deleteAsset(pid, a.name);
      forgetAsset(pid, a.name);
      await load();
    } catch (e) {
      ed.store.toast('error', '删除失败：' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const openMenu = (e: React.MouseEvent, a: AssetInfo) => {
    e.preventDefault();
    const items: MenuItem[] = a.type === 'audio'
      ? [{ label: '添加到音频轨（播放头处）', icon: 'music', run: () => actions.addAsset(a, 'audio') }]
      : [
        { label: '插入主轨（播放头处）', icon: 'film', run: () => actions.addAsset(a, 'main') },
        { label: '添加为画中画', icon: 'layers', run: () => actions.addAsset(a, 'pip') },
      ];
    items.push({ separator: true, label: '' }, { label: a.usage ? '删除（正在使用 ' + a.usage + ' 处，需先移除）' : '删除素材', icon: 'trash', danger: true, disabled: a.usage > 0, run: () => void remove(a) });
    setMenu({ x: e.clientX, y: e.clientY, items });
  };

  const q = query.trim().toLowerCase();
  const list = (assets ?? []).filter((a) => (filter === 'all' || a.type === filter) && (!q || a.name.toLowerCase().includes(q)));
  return (
    <div className="dj-pane" onDragOver={(e) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setOver(true); } }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false); }}
      onDrop={(e) => { if (!e.dataTransfer.files.length) return; e.preventDefault(); setOver(false); void upload([...e.dataTransfer.files]); }}>
      <div className={'dj-dropzone' + (over ? ' dj-over' : '')} role="button" tabIndex={0} onClick={() => fileInput.current?.click()} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInput.current?.click(); }}>
        <Icon name="upload" /> {uploading ? '上传中 ' + (uploading.done + 1) + '/' + uploading.total + '：' + uploading.name : '拖入视频/图片/音频，或点击选择文件'}
        {uploading && <div className="dj-progress" style={{ marginTop: 8 }}><i style={{ width: (uploading.done / uploading.total) * 100 + '%' }} /></div>}
      </div>
      <input ref={fileInput} type="file" multiple hidden accept="video/*,image/*,audio/*" onChange={(e) => { void upload([...(e.target.files ?? [])]); e.target.value = ''; }} />
      <div style={{ display: 'flex', gap: 6, margin: '10px 0' }}>
        <input className="dj-input" type="search" placeholder="搜索素材" aria-label="搜索素材" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.stopPropagation()} />
      </div>
      <div className="dj-chips" style={{ marginBottom: 10 }}>
        {(['all', 'video', 'image', 'audio'] as const).map((k) => (
          <button key={k} type="button" className="dj-chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>
            {k === 'all' ? '全部' : TYPE_LABEL[k]}{assets ? ' ' + (k === 'all' ? assets.length : assets.filter((a) => a.type === k).length) : ''}
          </button>
        ))}
      </div>
      {error && <p className="dj-hint" style={{ color: 'var(--dj-danger)' }}>素材列表加载失败：{error} <button className="dj-btn" onClick={() => void load()}>重试</button></p>}
      {!assets && !error && <p className="dj-hint">正在加载…</p>}
      {assets && !list.length && <div className="dj-empty-state">{assets.length ? '没有符合条件的素材' : '还没有素材。上传后可拖到时间线，也可以让 AI 去素材库搜索下载。'}</div>}
      <div className="dj-assets" role="list">
        {list.map((a) => (
          <div key={a.name} className="dj-asset" role="listitem" draggable title={a.name + '\n拖到时间线添加；右键更多操作'}
            onDragStart={(e) => { e.dataTransfer.setData('application/x-djian-asset', JSON.stringify({ name: a.name, type: a.type, duration: a.duration })); e.dataTransfer.effectAllowed = 'copy'; }}
            onDoubleClick={() => actions.addAsset(a)} onContextMenu={(e) => openMenu(e, a)}>
            {a.thumb ? <img src={absolute(a.thumb)} alt="" loading="lazy" draggable={false} /> : <span className="dj-athumb"><Icon name={a.type === 'audio' ? 'music' : a.type === 'image' ? 'image' : 'film'} /></span>}
            <div style={{ minWidth: 0 }}>
              <div className="dj-aname">{a.name}</div>
              <small>{a.error ? <span style={{ color: 'var(--dj-danger)' }}>无法读取：{a.error}</span> : [TYPE_LABEL[a.type], fmtDur(a.duration), a.width && a.height ? a.width + '×' + a.height : '', fmtSize(a.size), a.usage ? '已用 ' + a.usage : ''].filter(Boolean).join(' · ')}</small>
            </div>
            <button className="dj-icon-btn" title={a.type === 'audio' ? '添加到音频轨' : '插入主轨（播放头处）'} aria-label={'添加 ' + a.name} onClick={() => actions.addAsset(a)}><Icon name="plus" /></button>
          </div>
        ))}
      </div>
      {menu && <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} />}
    </div>
  );
}
