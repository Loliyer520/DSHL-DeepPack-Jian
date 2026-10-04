// 通用控件：可拖动调节的数值框、字段、关键帧按钮、右键菜单、对话框
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon, type IconName } from '../Icon';

/** 数值框：左右拖动标签/框体实时调节（onPreview），松手提交（onCommit）；也可直接输入，Enter 提交、Esc 取消 */
export function ScrubNumber({ value, onCommit, onPreview, step = 0.1, min = -Infinity, max = Infinity, digits = 2, suffix = '', label, disabled }: {
  value: number; onCommit: (v: number) => void; onPreview?: (v: number | null) => void; step?: number; min?: number; max?: number; digits?: number; suffix?: string; label?: string; disabled?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const drag = useRef<{ x: number; v: number; moved: boolean; last: number } | null>(null);
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const fmt = (v: number) => (Math.round(v * 10 ** digits) / 10 ** digits).toString();
  const num = draft === null ? NaN : Number(draft);
  const invalid = draft !== null && (!Number.isFinite(num) || num < min || num > max);
  return (
    <input className="dj-input dj-scrub" aria-label={label} disabled={disabled} inputMode="decimal" value={draft ?? fmt(value) + suffix} aria-invalid={invalid || undefined}
      onPointerDown={(e) => {
        if (document.activeElement === e.currentTarget || e.button !== 0) return;
        drag.current = { x: e.clientX, v: value, moved: false, last: value };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const d = drag.current; if (!d) return;
        const dx = e.clientX - d.x;
        if (!d.moved && Math.abs(dx) < 3) return;
        d.moved = true;
        e.preventDefault();
        d.last = clamp(d.v + Math.round(dx / 2) * step * (e.shiftKey ? 10 : 1));
        onPreview?.(d.last);
        setDraft(fmt(d.last) + suffix);
      }}
      onPointerUp={(e) => {
        const d = drag.current; drag.current = null;
        if (!d) return;
        // 拖动中的预览会让 value 变成预览值：与拖动起点比较，否则松手时会误判为“没改动”
        if (d.moved) { setDraft(null); onPreview?.(null); if (d.last !== d.v) onCommit(d.last); e.currentTarget.blur(); }
        else { e.currentTarget.focus(); e.currentTarget.select(); setDraft(fmt(value)); }
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => { if (draft !== null && !invalid && num !== value && !drag.current) onCommit(clamp(num)); setDraft(null); }}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') { setDraft(null); requestAnimationFrame(() => e.currentTarget?.blur()); }
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); onCommit(clamp(value + (e.key === 'ArrowUp' ? 1 : -1) * step * (e.shiftKey ? 10 : 1))); }
      }} />
  );
}

export function Field({ label, children, row, extra }: { label: React.ReactNode; children: React.ReactNode; row?: boolean; extra?: React.ReactNode }) {
  return <label className={'dj-field' + (row ? ' dj-row' : '')}><span>{label}{extra}</span>{children}</label>;
}

/** 关键帧按钮：off=该通道无关键帧；has=有但不在播放头；on=播放头处有关键帧 */
export function KeyframeButton({ state, onClick, title }: { state: 'off' | 'has' | 'on'; onClick: () => void; title: string }) {
  return (
    <button type="button" className="dj-kfbtn" data-state={state} title={title} aria-label={title} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}>
      <svg viewBox="0 0 12 12"><path d="M6 1 11 6 6 11 1 6z" fill={state === 'off' ? 'none' : 'currentColor'} stroke="currentColor" strokeWidth="1.3" /></svg>
    </button>
  );
}

export interface MenuItem { label: string; icon?: IconName; kbd?: string; disabled?: boolean; danger?: boolean; run?: () => void; separator?: boolean }
export function ContextMenu({ x, y, items, onClose }: { x: number; y: number; items: MenuItem[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ x: Math.max(4, Math.min(x, window.innerWidth - r.width - 4)), y: Math.max(4, Math.min(y, window.innerHeight - r.height - 4)) });
    el.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
  }, [x, y]);
  useEffect(() => {
    const close = (e: Event) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    document.addEventListener('pointerdown', close, true);
    document.addEventListener('keydown', key, true);
    window.addEventListener('blur', onClose);
    return () => { document.removeEventListener('pointerdown', close, true); document.removeEventListener('keydown', key, true); window.removeEventListener('blur', onClose); };
  }, [onClose]);
  return createPortal(
    <div className="dj-menu" ref={ref} role="menu" style={{ left: pos.x, top: pos.y }} onContextMenu={(e) => e.preventDefault()}>
      {items.map((it, i) => it.separator ? <hr key={i} /> : (
        <button key={i} role="menuitem" disabled={it.disabled} style={it.danger ? { color: 'var(--dj-danger)' } : undefined} onClick={() => { onClose(); it.run?.(); }}>
          {it.icon ? <Icon name={it.icon} /> : <span style={{ width: 16 }} />}{it.label}{it.kbd && <kbd>{it.kbd}</kbd>}
        </button>
      ))}
    </div>, document.body);
}

export function Dialog({ title, onClose, children, footer }: { title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('input,select,textarea,button')?.focus();
    return () => { if (prev?.isConnected) prev.focus(); };
  }, []);
  return (
    <div className="dj-mask" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Escape') onClose(); }}>
      <div className="dj-dialog" ref={ref} role="dialog" aria-modal="true" aria-label={title}>
        <h3>{title}<span className="dj-spacer" /><button className="dj-icon-btn" aria-label="关闭" onClick={onClose}><Icon name="close" /></button></h3>
        {children}
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  );
}
