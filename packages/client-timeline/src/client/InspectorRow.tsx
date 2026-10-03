import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import { useDialog } from './useDialog';

function InspectorDrawer({ title, summary, id, onClose, children, container }: {
  title: string; summary: string; id: string; onClose: () => void; children: React.ReactNode; container: HTMLElement;
}) {
  const dialog = useDialog(onClose);
  const mask = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const siblings = Array.from(container.children).filter((node) => node !== mask.current);
    const previous = siblings.map((node) => node.hasAttribute('inert'));
    siblings.forEach((node) => node.setAttribute('inert', ''));
    return () => siblings.forEach((node, index) => { if (!previous[index]) node.removeAttribute('inert'); });
  }, [container]);
  return createPortal(
    <div className="djp-drawer-mask" ref={mask} onClick={onClose}>
      <div className="djp-property-drawer" ref={dialog} id={id} role="dialog" aria-modal="true" aria-label={`${title} 参数`} tabIndex={-1} onClick={(event) => event.stopPropagation()}>
        <header className="djp-drawer-head">
          <div><span className="djp-drawer-label">片段属性</span><strong title={title}>{title}</strong><span className="djp-item-summary">{summary}</span></div>
          <button className="djp-iconbtn" aria-label="关闭属性面板" title="关闭（Esc）" onClick={onClose}><Icon name="close" /></button>
        </header>
        <div className="djp-inspector djp-drawer-body">{children}</div>
        <footer className="djp-drawer-footer"><span>修改自动保存</span><button className="djp-btn" onClick={onClose}>完成</button></footer>
      </div>
    </div>, container,
  );
}

export function InspectorRow({ title, summary, index, open, onToggle, onDragStart, children }: {
  title: string;
  summary: string;
  index?: number;
  open: boolean;
  onToggle: () => void;
  onDragStart?: React.DragEventHandler<HTMLButtonElement>;
  children: React.ReactNode;
}) {
  const id = useId();
  const row = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  useEffect(() => { setContainer(row.current?.closest<HTMLElement>('.djp-root') ?? null); }, []);
  useEffect(() => {
    if (open) row.current?.scrollIntoView({ block: 'nearest' });
  }, [open]);
  return (
    <div className={`djp-item${open ? ' djp-item-open' : ''}`} data-index={index} ref={row}>
      <button className="djp-item-trigger" type="button" aria-haspopup="dialog" aria-expanded={open} aria-controls={id} onClick={onToggle} draggable={Boolean(onDragStart)} onDragStart={onDragStart}>
        {onDragStart && <span className="djp-drag" title="拖拽排序"><Icon name="grip" /></span>}
        {index !== undefined && <span className="djp-item-number">{String(index + 1).padStart(2, '0')}</span>}
        <span className="djp-item-name" title={title}>{title}</span>
        <span className="djp-item-summary">{summary}</span>
        <Icon name="chevron" className="djp-chevron" />
      </button>
      {open && container && <InspectorDrawer title={title} summary={summary} id={id} onClose={onToggle} container={container}>{children}</InspectorDrawer>}
    </div>
  );
}

export function AdvancedSettings({ children, label = '滤镜与动画' }: { children: React.ReactNode; label?: string }) {
  return <details className="djp-advanced"><summary>{label}</summary><div className="djp-fields">{children}</div></details>;
}
