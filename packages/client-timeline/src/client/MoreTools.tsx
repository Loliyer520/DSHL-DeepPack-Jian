import React, { useEffect, useRef } from 'react';

export function MoreTools({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) ref.current.open = false;
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, []);
  return <details className="djp-more" ref={ref} onKeyDown={(event) => {
    if (event.key === 'Escape' && ref.current?.open) { event.stopPropagation(); ref.current.open = false; ref.current.querySelector('summary')?.focus(); }
  }} onClick={(event) => {
    if ((event.target as HTMLElement).closest('button') && ref.current) ref.current.open = false;
  }}>
    <summary className="djp-iconbtn" aria-label="更多工具" title="更多工具"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="3" cy="8" r="1.3"/><circle cx="8" cy="8" r="1.3"/><circle cx="13" cy="8" r="1.3"/></svg></summary>
    <div className="djp-more-content">{children}</div>
  </details>;
}
