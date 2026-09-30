import React, { useEffect, useRef, useState } from 'react';
import { playerBus } from './bus';
import { Icon } from './Icon';

const clock = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds) % 60).padStart(2, '0')}`;
export function TransportBar({ fps, duration, undo, redo, canUndo, canRedo }: {
  fps: number; duration: number; undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean;
}) {
  const time = useRef<HTMLOutputElement>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const player = playerBus.ref;
      if (time.current) time.current.textContent = clock((player?.getCurrentFrame() ?? 0) / fps);
      setPlaying(player?.isPlaying() ?? false);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [fps]);
  return <div className="djp-transport">
    <div className="djp-transport-time"><output ref={time} aria-label="播放时间">00:00</output><span> / {clock(duration)}</span></div>
    <button className="djp-play-toggle" aria-label={playing ? '暂停' : '播放'} title="播放 / 暂停（空格）" onClick={() => playerBus.ref?.toggle()}><Icon name={playing ? 'pause' : 'play'} /></button>
    <div className="djp-transport-actions">
      <button className="djp-iconbtn" title="撤销（Ctrl+Z）" aria-label="撤销" disabled={!canUndo} onClick={undo}><Icon name="undo" /></button>
      <button className="djp-iconbtn" title="重做（Ctrl+Shift+Z）" aria-label="重做" disabled={!canRedo} onClick={redo}><Icon name="redo" /></button>
      <button className="djp-iconbtn" title="全屏预览" aria-label="全屏预览" onClick={() => { playerBus.ref?.requestFullscreen(); }}><Icon name="expand" /></button>
    </div>
  </div>;
}
