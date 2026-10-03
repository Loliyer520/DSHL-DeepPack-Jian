// 顶栏：项目名（可改）、同步状态、AI 状态、导出与更多；以及右下角提示条
import React, { useEffect, useState } from 'react';
import { useEditor, useStore } from '../context';
import { Icon } from '../Icon';
import { ContextMenu, type MenuItem } from './common';

const STATUS: Record<string, string> = { connecting: '连接中', live: '已同步', saving: '保存中', offline: '离线·重试中', error: '连接失败', readonly: '只读' };

export function TopBar({ onDialog, narrowTabs, sheet, onSheet }: {
  onDialog: (d: 'export' | 'history' | 'shortcuts') => void;
  narrowTabs?: [string, string][]; sheet?: string | null; onSheet?: (s: string | null) => void;
}) {
  const ed = useEditor();
  const project = useStore((s) => s.project);
  const status = useStore((s) => s.status);
  const pending = useStore((s) => s.pending);
  const error = useStore((s) => s.error);
  const aiState = useStore((s) => s.ai);
  // AI 进程异常退出时不会发 idle：超过 2 分钟没有新状态就不再显示
  const ai = aiState && Date.now() - aiState.at < 120_000 ? aiState : null;
  const [name, setName] = useState(project?.name ?? '');
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => setName(project?.name ?? ''), [project?.name]);
  const items: MenuItem[] = [
    { label: '历史版本…', icon: 'history', run: () => onDialog('history') },
    { label: '快捷键…', icon: 'keyboard', kbd: '?', run: () => onDialog('shortcuts') },
    ...(ed.host.toggleExpand ? [{ label: ed.host.expanded ? '退出全屏' : '全屏编辑', icon: (ed.host.expanded ? 'collapse' : 'expand') as 'expand', run: ed.host.toggleExpand }] : []),
  ];
  return (
    <div className="dj-top">
      <div className="dj-title">
        <Icon name="film" />
        <input aria-label="项目名称" value={name} maxLength={60} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { setName(project?.name ?? ''); e.currentTarget.blur(); } }}
          onBlur={() => { if (name.trim() && name !== project?.name) void ed.store.renameProject(name); else setName(project?.name ?? ''); }} />
      </div>
      {ai && <span className="dj-pill dj-ai" title={ai.label ?? ai.status} aria-live="polite"><Icon name="sparkle" />AI 正在剪辑</span>}
      <span className={'dj-pill dj-' + status} title={error ?? (pending ? pending + ' 批修改待保存' : '所有修改已保存到本机')} role="status">
        <i />{STATUS[status] ?? status}{pending > 0 && status !== 'offline' ? ' ' + pending : ''}
      </span>
      {narrowTabs?.map(([k, label]) => (
        <button key={k} className="dj-icon-btn" aria-pressed={sheet === k} title={label} aria-label={label} onClick={() => onSheet?.(sheet === k ? null : k)}>
          <Icon name={k === 'inspector' ? 'sliders' : k === 'assets' ? 'library' : 'activity'} />
        </button>
      ))}
      <button className="dj-btn dj-primary" onClick={() => onDialog('export')} title="导出 MP4"><Icon name="export" /><span className="dj-hide-narrow">导出</span></button>
      {ed.host.toggleExpand && <button className="dj-icon-btn dj-hide-narrow" title={ed.host.expanded ? '退出全屏' : '全屏编辑'} aria-label={ed.host.expanded ? '退出全屏' : '全屏编辑'} onClick={ed.host.toggleExpand}><Icon name={ed.host.expanded ? 'collapse' : 'expand'} /></button>}
      <button className="dj-icon-btn" title="更多" aria-label="更多" aria-haspopup="menu" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setMenu({ x: r.right - 180, y: r.bottom + 4 }); }}><Icon name="more" /></button>
      {menu && <ContextMenu x={menu.x} y={menu.y} items={items} onClose={() => setMenu(null)} />}
    </div>
  );
}

export function Toasts() {
  const ed = useEditor();
  const toasts = useStore((s) => s.toasts);
  // AI 修改的提示由事件流直接推入，没有定时器：这里统一 9 秒后收起
  useEffect(() => {
    const ai = toasts.filter((t) => t.kind === 'ai');
    if (!ai.length) return;
    const timers = ai.map((t) => setTimeout(() => ed.store.dismiss(t.id), 9000));
    return () => timers.forEach(clearTimeout);
  }, [toasts, ed.store]);
  if (!toasts.length) return null;
  return (
    <div className="dj-toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={'dj-toast dj-' + t.kind}>
          {t.kind === 'ai' && <Icon name="sparkle" />}
          <span>{t.text}</span>
          {t.action && <button className="dj-btn" onClick={() => { t.action!.run(); ed.store.dismiss(t.id); }}>{t.action.label}</button>}
          <button className="dj-icon-btn" aria-label="关闭提示" onClick={() => ed.store.dismiss(t.id)}><Icon name="close" /></button>
        </div>
      ))}
    </div>
  );
}
