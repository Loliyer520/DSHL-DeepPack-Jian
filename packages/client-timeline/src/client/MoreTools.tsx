import React, { useEffect, useRef } from 'react';
import { Icon } from './Icon';

export function MoreTools({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) ref.current.open = false;
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, []);
  return <details className="djp-more" ref={ref} onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) event.currentTarget.open = false;
  }} onKeyDown={(event) => {
    if (event.key === 'Escape' && ref.current?.open) { event.stopPropagation(); ref.current.open = false; ref.current.querySelector('summary')?.focus(); }
  }} onClick={(event) => {
    if ((event.target as HTMLElement).closest('button') && ref.current) {
      ref.current.open = false;
      ref.current.querySelector('summary')?.focus();
    }
  }}>
    <summary className="djp-iconbtn" aria-label="更多工具" title="更多工具"><Icon name="dots" /></summary>
    <div className="djp-more-content">{children}</div>
  </details>;
}
