// 播放控制：时间码（点击可精确定位）、逐帧、剪辑点跳转、播放/暂停、撤销重做、全屏
import React, { useEffect, useRef, useState } from 'react';
import { timelineDurationInFrames } from '../../../../engine/src/timeline';
import { Icon } from '../Icon';
import { useEditor, useStore, usePlaying } from '../context';
import { formatTimePosition, parseTimePosition } from '../timePosition';
import { timecode } from '../geometry';
import type { Actions } from '../actions';

export function TransportBar({ actions }: { actions: Actions }) {
  const ed = useEditor();
  const timeline = useStore((s) => s.timeline);
  const canUndo = useStore((s) => s.canUndo);
  const canRedo = useStore((s) => s.canRedo);
  const undoLabel = useStore((s) => s.undoLabel);
  const redoLabel = useStore((s) => s.redoLabel);
  const playing = usePlaying();
  const out = useRef<HTMLElement>(null);
  const [jump, setJump] = useState(false);
  const fps = timeline?.meta.fps ?? 30;
  const total = timeline ? timelineDurationInFrames(timeline) / fps : 0;
  useEffect(() => ed.clock.subscribe((sec) => { if (out.current) out.current.textContent = timecode(sec, fps); }), [ed.clock, fps]);
  const step = (frames: number) => { ed.clock.pause(); ed.clock.seek(Math.max(0, Math.min(total, ed.clock.time() + frames / fps))); };
  return (
    <div className="dj-transport" style={{ position: 'relative' }}>
      <button className="dj-time" onClick={() => { ed.clock.pause(); setJump(!jump); }} title="点击输入时间或帧数定位" aria-label="定位播放头">
        <b ref={out}>00:00.00</b> / {timecode(total, fps, false)}
      </button>
      {jump && timeline && <JumpBox fps={fps} maxFrame={Math.max(0, Math.round(total * fps) - 1)} onClose={() => setJump(false)} />}
      <span className="dj-spacer" />
      <button className="dj-icon-btn" title="上一个剪辑点（↑）" aria-label="上一个剪辑点" onClick={() => actions.jumpEdit(-1)}><Icon name="prevEdit" /></button>
      <button className="dj-icon-btn" title="上一帧（←）" aria-label="上一帧" onClick={() => step(-1)}><Icon name="prevFrame" /></button>
      <button className="dj-icon-btn dj-play" title="播放 / 暂停（空格）" aria-label={playing ? '暂停' : '播放'} onClick={() => ed.clock.toggle()}><Icon name={playing ? 'pause' : 'play'} /></button>
      <button className="dj-icon-btn" title="下一帧（→）" aria-label="下一帧" onClick={() => step(1)}><Icon name="nextFrame" /></button>
      <button className="dj-icon-btn" title="下一个剪辑点（↓）" aria-label="下一个剪辑点" onClick={() => actions.jumpEdit(1)}><Icon name="nextEdit" /></button>
      <span className="dj-spacer" />
      <button className="dj-icon-btn" disabled={!canUndo} title={'撤销' + (undoLabel ? '：' + undoLabel : '') + '（Ctrl+Z）'} aria-label="撤销" onClick={() => ed.store.undo()}><Icon name="undo" /></button>
      <button className="dj-icon-btn" disabled={!canRedo} title={'重做' + (redoLabel ? '：' + redoLabel : '') + '（Ctrl+Shift+Z）'} aria-label="重做" onClick={() => ed.store.redo()}><Icon name="redo" /></button>
      <button className="dj-icon-btn" title="全屏预览" aria-label="全屏预览" onClick={() => ed.clock.ref?.requestFullscreen()}><Icon name="expand" /></button>
    </div>
  );
}

function JumpBox({ fps, maxFrame, onClose }: { fps: number; maxFrame: number; onClose: () => void }) {
  const ed = useEditor();
  const [mode, setMode] = useState<'time' | 'frame'>('time');
  const [value, setValue] = useState(() => formatTimePosition(ed.clock.frame, fps));
  const [error, setError] = useState('');
  return (
    <form className="dj-jump" role="dialog" aria-label="定位播放头" onSubmit={(e) => {
      e.preventDefault();
      const r = parseTimePosition(value, mode, fps, maxFrame);
      if ('error' in r) { setError(r.error); return; }
      ed.clock.seek(r.frame / fps);
      onClose();
    }} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Escape') onClose(); }}>
      <div className="dj-chips">
        {(['time', 'frame'] as const).map((m) => <button type="button" key={m} className="dj-chip" aria-pressed={mode === m} onClick={() => { setMode(m); setValue(m === 'frame' ? String(ed.clock.frame) : formatTimePosition(ed.clock.frame, fps)); setError(''); }}>{m === 'time' ? '时间' : '帧'}</button>)}
      </div>
      <input className="dj-input" autoFocus value={value} onChange={(e) => { setValue(e.target.value); setError(''); }} aria-invalid={Boolean(error)} />
      <small className="dj-hint" role={error ? 'alert' : undefined} style={error ? { color: 'var(--dj-danger)' } : undefined}>{error || (mode === 'time' ? '秒、分:秒或时:分:秒，自动对齐到帧' : '0–' + maxFrame + ' 帧')}</small>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}><button type="button" className="dj-btn" onClick={onClose}>取消</button><button className="dj-btn dj-primary">定位</button></div>
    </form>
  );
}
