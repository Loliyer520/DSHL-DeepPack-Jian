import React, { useRef, useState } from 'react';

export function SubtitleTextField({ value, onCommit }: { value: string; onCommit: (value: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const composing = useRef(false);
  return <input
    className="djp-sub-text"
    type="text"
    aria-label="字幕内容"
    value={draft ?? value}
    onChange={(event) => setDraft(event.target.value)}
    onCompositionStart={() => { composing.current = true; }}
    onCompositionEnd={() => { composing.current = false; }}
    onBlur={(event) => {
      composing.current = false;
      if (event.target.value !== value) onCommit(event.target.value);
      setDraft(null);
    }}
    onKeyDownCapture={(event) => {
      if (event.key !== 'Enter' && event.key !== 'Escape') return;
      if (composing.current || event.nativeEvent.isComposing || event.keyCode === 229) {
        // Let the IME confirm/cancel its candidate without closing the drawer.
        event.stopPropagation();
        return;
      }
      if (event.key === 'Escape' && draft !== null) {
        event.preventDefault();
        event.stopPropagation();
        setDraft(null);
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.blur();
      }
    }}
  />;
}
