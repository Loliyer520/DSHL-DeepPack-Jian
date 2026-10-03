import { splitOffset } from './splitPosition';
import React, { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { usePlayerBus } from './bus';

export function ClipActions({ label, start, duration, fps, onSplit, onDelete, onInspect, onClose }: {
  label: string; start: number; duration: number; fps: number;
  onSplit: () => void; onDelete: () => void; onInspect: () => void; onClose: () => void;
}) {
  const playerBus = usePlayerBus();
  const [canSplit, setCanSplit] = useState(false);
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const at = (playerBus.ref?.getCurrentFrame() ?? 0) / fps;
      setCanSplit(splitOffset(start, duration, at, fps) !== null);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, duration, fps, playerBus]);

  return <div className="djp-clip-actions" role="group" aria-label="选中片段操作">
    <button className="djp-iconbtn" aria-label="取消选择" title="取消选择（Esc）" onClick={onClose}><Icon name="close" /></button>
    <span className="djp-selected-label" title={label}>{label}<small>{duration.toFixed(2)}s</small></span>
    <button className="djp-clip-action" aria-label="分割选中片段" disabled={!canSplit} title={canSplit ? '在播放线处分割（S）' : '将播放线移到片段内部后分割'} onClick={onSplit}><Icon name="split" /><span>分割</span></button>
    <button className="djp-clip-action" aria-label="编辑选中片段属性" title="编辑属性（Enter）" onClick={onInspect}><Icon name="settings" /><span>属性</span></button>
    <button className="djp-clip-action" aria-label="删除选中片段" title="删除（Delete），可撤销" onClick={onDelete}><Icon name="trash" /><span>删除</span></button>
  </div>;
}
