import React, { useRef } from 'react';

/** Keep live audio feedback while treating one gesture as one undo operation. */
export function VolumeSlider({ value, onChange }: { value: number; onChange: (value: number, group?: symbol) => void }) {
  const group = useRef<symbol | undefined>(undefined);
  const finish = () => { group.current = undefined; };
  return <input
    type="range" min={0} max={1} step={0.05}
    value={value}
    aria-label="轨道音量"
    aria-valuetext={`${Math.round(value * 100)}%`}
    title={`${Math.round(value * 100)}%`}
    onPointerDown={(event) => {
      group.current = Symbol('volume gesture');
      event.currentTarget.setPointerCapture(event.pointerId);
    }}
    onPointerUp={finish}
    onPointerCancel={finish}
    onLostPointerCapture={finish}
    onKeyDown={(event) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) {
        group.current ??= Symbol('volume keyboard gesture');
      }
    }}
    onKeyUp={finish}
    onBlur={finish}
    onChange={(event) => onChange(Number(event.target.value), group.current)}
    style={{ width: 70 }}
  />;
}
