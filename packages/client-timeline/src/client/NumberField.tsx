import React, { useState } from 'react';

/** Keep an unfinished edit separate from the saved timeline value. */
export const NumberField: React.FC<{
  label: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  onCommit: (value: number) => void;
}> = ({ label, value, step = 0.5, min = 0, max, onCommit }) => {
  const [draft, setDraft] = useState<string | null>(null);
  const numeric = draft === null || draft.trim() === '' ? NaN : Number(draft);
  const invalid = draft !== null && (!Number.isFinite(numeric) || numeric < min || (max !== undefined && numeric > max));
  return (
    <label className="djp-field">
      <span>{label}</span>
      <input
        type="number"
        value={draft ?? String(value)}
        step={step}
        min={min}
        max={max}
        aria-invalid={invalid || undefined}
        title={invalid ? '数值无效，离开输入框将恢复原值' : undefined}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          if (draft !== null && !invalid && numeric !== value) onCommit(numeric);
          setDraft(null);
        }}
        onKeyDownCapture={(event) => {
          // Capture runs before the drawer's native Escape listener.
          if (event.key === 'Escape' && draft !== null) {
            event.preventDefault();
            event.stopPropagation();
            setDraft(null);
          }
          if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
            event.preventDefault();
            event.stopPropagation();
            event.currentTarget.blur();
          }
        }}
      />
    </label>
  );
};
