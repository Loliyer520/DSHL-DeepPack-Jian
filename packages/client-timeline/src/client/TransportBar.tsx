import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { usePlayerBus } from './bus';
import { Icon } from './Icon';
import { formatTimePosition, parseTimePosition, type PositionMode } from './timePosition';

const clock = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds) % 60).padStart(2, '0')}`;
export function TransportBar({ fps, duration, undo, redo, canUndo, canRedo }: {
  fps: number; duration: number; undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean;
}) {
  const playerBus = usePlayerBus();
  const time = useRef<HTMLOutputElement>(null);
  const [playing, setPlaying] = useState(false);
  const [available, setAvailable] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PositionMode>('time');
  const [position, setPosition] = useState('');
  const [error, setError] = useState('');
  const [jumpStyle, setJumpStyle] = useState<React.CSSProperties>({});
  const positionId = useId();
  const jumpRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const maxFrame = Math.max(0, Math.round(duration * fps) - 1);
  useEffect(() => { if (!available) setOpen(false); }, [available]);
  const close = (restoreFocus = false) => { setOpen(false); if (restoreFocus) triggerRef.current?.focus(); };
  const openJump = () => {
    const player = playerBus.ref;
    if (!player) return;
    if (open) { close(); return; }
    player.pause();
    const frame = player.getCurrentFrame();
    setPosition(mode === 'frame' ? String(frame) : formatTimePosition(frame, fps));
    setError('');
    setOpen(true);
  };
  useLayoutEffect(() => {
    if (!open) return;
    const transport = jumpRef.current?.closest<HTMLElement>('.djp-transport');
    const root = jumpRef.current?.closest<HTMLElement>('.djp-root');
    if (!transport || !root) return;
    const place = () => {
      const bar = transport.getBoundingClientRect(), bounds = root.getBoundingClientRect();
      const above = bar.top - Math.max(0, bounds.top) - 12;
      const below = Math.min(window.innerHeight, bounds.bottom) - bar.bottom - 12;
      const useBelow = above < 250 && below > above;
      setJumpStyle({ top: useBelow ? 'calc(100% + 6px)' : 'auto', bottom: useBelow ? 'auto' : 'calc(100% + 6px)', maxHeight: Math.max(80, useBelow ? below : above) });
    };
    const observer = new ResizeObserver(place);
    observer.observe(root); observer.observe(transport);
    window.addEventListener('resize', place); place();
    return () => { observer.disconnect(); window.removeEventListener('resize', place); };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [open, mode]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: Event) => {
      if (event.target instanceof Node && !jumpRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('focusin', outside); };
  }, [open]);
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const player = playerBus.ref;
      if (time.current) time.current.textContent = clock((player?.getCurrentFrame() ?? 0) / fps);
      setPlaying(player?.isPlaying() ?? false);
      setAvailable(Boolean(player));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [fps, playerBus]);
  return <div className="djp-transport">
    <div className="djp-transport-time" ref={jumpRef}>
      <button className="djp-time-trigger" ref={triggerRef} aria-label="定位播放头" aria-expanded={open} aria-haspopup="dialog" title="输入时间或帧数定位" disabled={!available} onClick={openJump}><output ref={time} aria-label="播放时间">00:00</output><span> / {clock(duration)}</span></button>
      {open && <form className="djp-time-jump" style={jumpStyle} role="dialog" aria-label="定位播放头" onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); } }} onSubmit={event => {
        event.preventDefault();
        const result = parseTimePosition(position, mode, fps, maxFrame);
        if ('error' in result) { setError(result.error); inputRef.current?.focus(); return; }
        playerBus.ref?.seekTo(result.frame);
        close(true);
      }}>
        <div className="djp-jump-head"><strong>定位播放头</strong><button className="djp-iconbtn" type="button" aria-label="关闭定位" onClick={() => close(true)}><Icon name="close" /></button></div>
        <div className="djp-jump-modes" role="group" aria-label="定位方式">{(['time', 'frame'] as const).map(next => <button key={next} type="button" aria-pressed={mode === next} onClick={() => {
          if (next === mode) { inputRef.current?.focus(); inputRef.current?.select(); return; }
          const parsed = parseTimePosition(position, mode, fps, maxFrame);
          const frame = 'frame' in parsed ? parsed.frame : playerBus.ref?.getCurrentFrame() ?? 0;
          setMode(next); setPosition(next === 'frame' ? String(frame) : formatTimePosition(frame, fps)); setError('');
        }}>{next === 'time' ? '时间' : '帧'}</button>)}</div>
        <label htmlFor={positionId}>{mode === 'time' ? '目标时间' : '帧位置（从 0 开始）'}</label>
        <input id={positionId} ref={inputRef} type="text" inputMode={mode === 'frame' ? 'numeric' : 'text'} autoComplete="off" spellCheck={false} value={position} aria-invalid={Boolean(error)} aria-describedby={`${positionId}-hint`} onChange={event => { setPosition(event.target.value); setError(''); }} />
        <p id={`${positionId}-hint`} className={error ? 'djp-jump-error' : ''} role={error ? 'alert' : undefined}>{error || (mode === 'time' ? `最晚 ${formatTimePosition(maxFrame, fps)} · 自动对齐到帧` : `0–${maxFrame} 帧 · ${fps} FPS`)}</p>
        <div className="djp-jump-actions"><button className="djp-btn" type="button" onClick={() => close(true)}>取消</button><button className="djp-btn" type="submit">定位</button></div>
      </form>}
    </div>
    <button className="djp-play-toggle" aria-label={playing ? '暂停' : '播放'} title="播放 / 暂停（空格）" disabled={!available} onClick={event => playerBus.ref?.toggle(event)}><Icon name={playing ? 'pause' : 'play'} /></button>
    <div className="djp-transport-actions">
      <button className="djp-iconbtn" title="撤销（Ctrl+Z）" aria-label="撤销" disabled={!canUndo} onClick={undo}><Icon name="undo" /></button>
      <button className="djp-iconbtn" title="重做（Ctrl+Shift+Z）" aria-label="重做" disabled={!canRedo} onClick={redo}><Icon name="redo" /></button>
      <button className="djp-iconbtn" title="全屏预览" aria-label="全屏预览" disabled={!available} onClick={() => { playerBus.ref?.requestFullscreen(); }}><Icon name="expand" /></button>
    </div>
  </div>;
}
