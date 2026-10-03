import { readViewPreference, saveViewPreference } from './viewPreferences';
import { useProjectSession } from './ProjectSession';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { timelineDurationInFrames, shiftAnimations, type Timeline, type Clip, type AudioClip, type Overlay, type Animations } from '../../../engine/src/schema';
import { usePlayerBus } from './bus';
import { Icon } from './Icon';
import { Filmstrip, Waveform } from './TrackMedia';
import { ClipActions } from './ClipActions';
import { dragPreview, edgeScrollSpeed, mergeTimeRanges, overlappingRows, timelineWindow, visibleTicks } from './timelineGeometry';

export type TrackMode = 'main' | 'pip' | 'audio' | 'subs';
type Lane = TrackMode;
const modeNames: Record<TrackMode, string> = { main: '主轨道', audio: '音频', pip: '画中画', subs: '字幕' };
type TrackOps = {
  updateClip: (id: string, patch: Partial<Clip>) => void;
  updateAudioClip: (id: string, patch: Partial<AudioClip>) => void;
  updateAudioTrack: (id: string, patch: { muted?: boolean }) => void;
  updateOverlay: (index: number, patch: Partial<Overlay>) => void;
  reorderClips: (ids: string[]) => void;
  splitClip: (id: string, atSeconds: number) => void;
  splitOverlay: (index: number, atSeconds: number) => void;
  removeClip: (id: string) => void;
  removeAudioClip: (id: string) => void;
  removeOverlay: (index: number) => void;
};
const fmtSec = (sec: number) => `${sec.toFixed(1)}s`;
const timecode = (sec: number, fps: number) => {
  const frames = Math.max(0, Math.round(sec * fps));
  return [Math.floor(frames / fps / 60), Math.floor(frames / fps) % 60, frames % fps].map((n) => String(n).padStart(2, '0')).join(':');
};
function TrackRow({ code, name, kind, children, muted, action, height }: {
  code: string; name: string; kind: Lane; children: React.ReactNode; muted?: boolean; action?: React.ReactNode; height?: number;
}) {
  return <div aria-label={name} className={`djp-trow djp-lane-${kind} ${muted ? 'djp-lane-muted' : ''}`}>
    <div className="djp-trow-name" title={name}><span className="djp-track-code">{code}</span><span className="djp-track-name">{name}</span>{action}</div>
    <div className="djp-track djp-trow-lane" style={height === undefined ? undefined : { height }}>{children}</div>
  </div>;
}

interface DragState {
  kind: 'move' | 'reorder' | 'trimL' | 'trimR';
  lane: Lane;
  id: string;
  startX: number;
  pointerId: number;
  pointerX: number;
  pointerY: number;
  startScroll: number;
  moved: boolean;
  snapAt: number | null;
  snapPlayhead: number;
  source: Timeline;
  secPerPx: number;
  origAt: number;
  origDur: number;
  origIn?: number;
  speed?: number;
  origAnimations?: Animations;
  previewAt: number;
  previewDur: number;
}

export const TrackStrip: React.FC<{
  t: Timeline;
  o: TrackOps;
  onAudio: () => void;
  onAdd: () => void;
  mode: TrackMode;
  onModeChange: (mode: TrackMode) => void;
  playheadRef: React.MutableRefObject<number>;
  onSeekClip: (start: number, lane?: Lane, id?: string) => void;
}> = ({ t, o, playheadRef, onSeekClip, onAudio, onAdd, mode, onModeChange }) => {
  const playerBus = usePlayerBus();
  const { seekToSeconds } = playerBus;
  const total = Math.max(1, timelineDurationInFrames(t) / t.meta.fps);
  const sessionId = useProjectSession();
  const [zoom, setZoom] = useState(() => readViewPreference(sessionId, 'zoom', 1, (value) => typeof value === 'number' && Number.isFinite(value) && value >= .25 && value <= 8));
  useEffect(() => { saveViewPreference(sessionId, 'zoom', zoom); }, [sessionId, zoom]);
  const [selected, setSelected] = useState<string | null>(null);
  const [snapping, setSnapping] = useState(() => readViewPreference(sessionId, 'snapping', true, (value) => typeof value === 'boolean'));
  useEffect(() => { saveViewPreference(sessionId, 'snapping', snapping); }, [sessionId, snapping]);
  const [viewport, setViewport] = useState(320);
  const [windowBucket, setWindowBucket] = useState(0);
  const updateWindow = (x: number) => setWindowBucket(Math.floor(x / Math.max(256, viewport)));
  const scrollRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const programmaticScroll = useRef(0);
  const manualUntil = useRef(0);
  const pan = useRef<{ x: number; scroll: number } | null>(null);
  const scrubRef = useRef(false);
  const hiddenViewport = useRef(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (!el.clientWidth) { hiddenViewport.current = true; return; }
      setViewport(el.clientWidth);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const dragRef = useRef<DragState | null>(null);
  const justDragged = useRef(false);
  const [, forceRender] = useState(0);
  const ctxRef = useRef({ t, o, total, snapping, zoom });
  ctxRef.current = { t, o, total, snapping, zoom };
  useLayoutEffect(() => {
    const x = playheadRef.current * 56 * zoom;
    programmaticScroll.current = x;
    manualUntil.current = 0;
    if (scrollRef.current) scrollRef.current.scrollLeft = x;
    updateWindow(x);
  }, [zoom, viewport, total, playheadRef]);
  useLayoutEffect(() => {
    dragRef.current = null;
    pan.current = null;
    scrubRef.current = false;
    setSelected(null);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [mode]);

  // Keep frame updates out of the React track tree.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = playerBus.ref;
      if (p) {
        const sec = p.getCurrentFrame() / ctxRef.current.t.meta.fps;
        playheadRef.current = sec;
        const scroll = scrollRef.current;
        if (scroll && !scroll.getClientRects().length) {
          hiddenViewport.current = true;
        } else if (scroll && hiddenViewport.current) {
          // display:none reports a zero scroll offset. Restore from the player,
          // never interpret that layout change as a user's seek to the start.
          const x = sec * 56 * ctxRef.current.zoom;
          programmaticScroll.current = x;
          scroll.scrollLeft = x;
          hiddenViewport.current = false;
          manualUntil.current = 0;
          updateWindow(x);
        } else if (scroll && !dragRef.current && !pan.current && !scrubRef.current && performance.now() > manualUntil.current) {
          const x = sec * 56 * ctxRef.current.zoom;
          if (Math.abs(scroll.scrollLeft - x) > .5) {
            programmaticScroll.current = x;
            scroll.scrollLeft = x;
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playheadRef, playerBus, viewport]);

  // 拖拽生命周期：监听器只挂一次，闭包经 ctxRef 拿最新 t/o
  useEffect(() => {
    let dragFrame = 0;
    let lastFrame = 0;
    const anchors = (cur: DragState): number[] => {
      const tt = ctxRef.current.t;
      const pts: number[] = [0, cur.snapPlayhead];
      if (cur.lane === 'main') {
        let a = 0;
        for (const c of tt.videoTracks[0]?.clips ?? []) {
          if (c.id !== cur.id) pts.push(a, a + c.clipDuration);
          a += c.clipDuration;
        }
      } else if (cur.lane === 'pip') {
        for (const tr of tt.videoTracks.slice(1))
          for (const c of tr.clips) {
            if (c.id !== cur.id) pts.push(c.atSeconds ?? 0, (c.atSeconds ?? 0) + c.clipDuration);
          }
      } else if (cur.lane === 'subs') {
        tt.overlays.forEach((ov, i) => { if ('sub-' + i !== cur.id) pts.push(ov.startSeconds, ov.endSeconds); });
      } else {
        for (const tr of tt.audioTracks)
          for (const c of tr.clips) {
            if (c.id !== cur.id) pts.push(c.atSeconds, c.atSeconds + c.duration);
          }
      }
      return pts;
    };

    const updatePreview = (cur: DragState) => {
      const delta = (cur.pointerX - cur.startX + (scrollRef.current?.scrollLeft ?? 0) - cur.startScroll) * cur.secPerPx;
      const next = dragPreview({ kind: cur.kind, start: cur.origAt, duration: cur.origDur, delta,
        fps: ctxRef.current.t.meta.fps, inPoint: cur.origIn, speed: cur.speed, subtitle: cur.lane === 'subs',
        anchors: anchors(cur), threshold: ctxRef.current.snapping ? cur.secPerPx * 7 : 0 });
      if (next.at !== cur.previewAt || next.duration !== cur.previewDur || next.snapAt !== cur.snapAt) {
        cur.previewAt = next.at; cur.previewDur = next.duration; cur.snapAt = next.snapAt;
        forceRender((x) => x + 1);
      }
    };
    const tickDrag = (now: number) => {
      dragFrame = 0;
      const cur = dragRef.current;
      if (!cur || !cur.moved) return;
      if (cur.source !== ctxRef.current.t) { cancel(); return; }
      const scroll = scrollRef.current;
      let speed = 0;
      if (scroll) {
        const rect = scroll.getBoundingClientRect();
        if (cur.pointerY >= rect.top && cur.pointerY <= rect.bottom) speed = edgeScrollSpeed(cur.pointerX, rect.left, rect.right);
        const before = scroll.scrollLeft;
        scroll.scrollLeft = Math.max(0, Math.min(scroll.scrollWidth - scroll.clientWidth, before + speed * Math.min(32, now - (lastFrame || now)) / 1000));
        if (scroll.scrollLeft !== before) {
          programmaticScroll.current = scroll.scrollLeft;
          const seconds = Math.min((timelineDurationInFrames(ctxRef.current.t) - 1) / ctxRef.current.t.meta.fps, scroll.scrollLeft * cur.secPerPx);
          playheadRef.current = seconds;
          seekToSeconds(seconds, ctxRef.current.t.meta.fps);
        }
      }
      lastFrame = now;
      updatePreview(cur);
      if (speed) dragFrame = requestAnimationFrame(tickDrag);
    };
    const onMove = (e: PointerEvent) => {
      const cur = dragRef.current;
      if (!cur || e.pointerId !== cur.pointerId) return;
      cur.pointerX = e.clientX; cur.pointerY = e.clientY;
      if (!cur.moved && Math.abs(e.clientX - cur.startX) < 3) return;
      cur.moved = true;
      if (!dragFrame) { lastFrame = performance.now(); dragFrame = requestAnimationFrame(tickDrag); }
    };

    const onUp = (e: PointerEvent) => {
      const cur = dragRef.current;
      if (!cur || e.pointerId !== cur.pointerId) return;
      cancelAnimationFrame(dragFrame); dragFrame = 0;
      if (cur.source !== ctxRef.current.t) { cancel(); return; }
      if (cur.moved) { cur.pointerX = e.clientX; updatePreview(cur); }
      dragRef.current = null;
      if (cur) {
        const moved = Math.abs(cur.previewAt - cur.origAt) > 0.001 || Math.abs(cur.previewDur - cur.origDur) > 0.001;
        if (moved) {
          justDragged.current = true;
          window.setTimeout(() => {
            justDragged.current = false;
          }, 0);
        }
        if (!moved) { forceRender((x) => x + 1); return; }
        const { o: oo } = ctxRef.current;
        const at = cur.previewAt;
        const dur = cur.previewDur;
        if (cur.lane === 'subs') {
          oo.updateOverlay(Number(cur.id.slice(4)), { startSeconds: at, endSeconds: at + dur,
            ...(cur.kind === 'trimL' ? { animations: shiftAnimations(cur.origAnimations, at - cur.origAt) } : {}) });
        } else if (cur.kind === 'reorder') {
          const clips = ctxRef.current.t.videoTracks[0]?.clips ?? [];
          let elapsed = 0;
          const target = cur.previewAt + cur.origDur / 2;
          let index = 0;
          for (const clip of clips) {
            if (clip.id !== cur.id && target > elapsed + clip.clipDuration / 2) index++;
            elapsed += clip.clipDuration;
          }
          const ids = clips.filter((clip) => clip.id !== cur.id).map((clip) => clip.id);
          ids.splice(index, 0, cur.id);
          oo.reorderClips(ids);
        } else if (cur.kind === 'move') {
          if (cur.lane === 'pip') oo.updateClip(cur.id, { atSeconds: at });
          else oo.updateAudioClip(cur.id, { atSeconds: at });
        } else if (cur.lane === 'main') {
          const patch: Partial<Clip> = { clipDuration: dur };
          if (cur.kind === 'trimL') patch.animations = shiftAnimations(cur.origAnimations, at - cur.origAt);
          if (cur.kind === 'trimL' && cur.origIn !== undefined) patch.inPoint = Math.max(0, cur.origIn + (at - cur.origAt) * (cur.speed ?? 1));
          oo.updateClip(cur.id, patch);
        } else if (cur.lane === 'pip') {
          const patch: Partial<Clip> = { clipDuration: dur };
          if (cur.kind === 'trimL') patch.animations = shiftAnimations(cur.origAnimations, at - cur.origAt);
          if (cur.kind === 'trimL') {
            patch.atSeconds = at;
            if (cur.origIn !== undefined) patch.inPoint = Math.max(0, cur.origIn + (at - cur.origAt) * (cur.speed ?? 1));
          }
          oo.updateClip(cur.id, patch);
        } else {
          const patch: Partial<AudioClip> = { duration: dur };
          if (cur.kind === 'trimL') patch.animations = shiftAnimations(cur.origAnimations, at - cur.origAt);
          if (cur.kind === 'trimL') {
            patch.atSeconds = at;
            if (cur.origIn !== undefined) patch.inPoint = Math.max(0, cur.origIn + (at - cur.origAt) * (cur.speed ?? 1));
          }
          oo.updateAudioClip(cur.id, patch);
        }
      }
      forceRender((x) => x + 1);
    };

    const cancel = () => {
      cancelAnimationFrame(dragFrame); dragFrame = 0;
      dragRef.current = null; forceRender((x) => x + 1);
    };
    const onCancel = (e: PointerEvent) => { if (e.pointerId === dragRef.current?.pointerId) cancel(); };
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') cancel(); };
    window.addEventListener('keydown', escape);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    return () => {
      cancelAnimationFrame(dragFrame);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('keydown', escape);
    };
  }, [playheadRef, seekToSeconds]);

  const beginDrag = (
    e: React.PointerEvent,
    init: { kind: DragState['kind']; lane: DragState['lane']; id: string; origAt: number; origDur: number; origIn?: number; speed?: number; origAnimations?: Animations },
  ) => {
    if (e.button !== 0 || dragRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    playerBus.ref?.pause();
    e.currentTarget.setPointerCapture(e.pointerId);
    (e.currentTarget.closest('.djp-track-block') as HTMLElement | null)?.focus({ preventScroll: true });
    setSelected(init.id);
    const laneEl = (e.currentTarget as HTMLElement).closest('.djp-trow-lane') as HTMLElement | null;
    if (!laneEl) return;
    const rect = laneEl.getBoundingClientRect();
    dragRef.current = {
      ...init,
      startX: e.clientX,
      pointerId: e.pointerId, pointerX: e.clientX, pointerY: e.clientY,
      startScroll: scrollRef.current?.scrollLeft ?? 0,
      moved: false, snapAt: null, snapPlayhead: playheadRef.current, source: t,
      secPerPx: total / Math.max(1, rect.width),
      previewAt: init.origAt,
      previewDur: init.origDur,
    };
    forceRender((x) => x + 1);
  };

  const seek = (clientX: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const seconds = Math.max(0, Math.min((timelineDurationInFrames(t) - 1) / t.meta.fps, (clientX - rect.left) / rect.width * total));
    seekToSeconds(seconds, t.meta.fps);
  };
  const drag = dragRef.current;
  const pct = (v: number) => `${Math.max(0, v) / total * 100}%`;
  const laneWidth = total * 56 * zoom;
  const visible = timelineWindow(windowBucket, viewport, 56 * zoom);
  const step = [1 / t.meta.fps, .1, .25, .5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1800, 3600].find((n) => n * laneWidth / total >= 64) ?? total / 4;
  const ticks = visibleTicks(visible.start, visible.end, total, step);
  const subtitleRows: { overlay: Overlay; index: number }[][] = [];
  t.overlays.map((overlay, index) => ({ overlay, index }))
    .sort((a, b) => a.overlay.startSeconds - b.overlay.startSeconds)
    .forEach((item) => {
      const row = subtitleRows.find((items) => items[items.length - 1].overlay.endSeconds <= item.overlay.startSeconds);
      if (row) row.push(item);
      else subtitleRows.push([item]);
    });

  const currentTime = () => (playerBus.ref?.getCurrentFrame() ?? 0) / t.meta.fps;
  const clearSelection = () => {
    dragRef.current = null;
    setSelected(null);
    editorRef.current?.focus({ preventScroll: true });
  };
  const splitSelection = (lane: Lane, id: string) => {
    if (lane === 'subs') o.splitOverlay(Number(id.slice(4)), currentTime());
    else o.splitClip(id, currentTime());
  };
  const deleteSelection = (lane: Lane, id: string) => {
    if (lane === 'subs') o.removeOverlay(Number(id.slice(4)));
    else if (lane === 'audio') o.removeAudioClip(id);
    else o.removeClip(id);
    clearSelection();
  };
  const selectionKey = (e: React.KeyboardEvent, lane: Lane, id: string) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); onSeekClip(currentTime(), lane, id); }
    if (e.key.toLowerCase() === 's') { e.preventDefault(); e.stopPropagation(); splitSelection(lane, id); }
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); e.stopPropagation(); deleteSelection(lane, id); }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); clearSelection(); }
  };

  const block = (lane: Lane, id: string, label: string, at: number, duration: number, clip?: Clip | AudioClip, overlay?: Overlay, displayRow?: number) => {
    const isD = drag?.id === id && drag.lane === lane;
    const start = isD ? drag.previewAt : at;
    const dur = isD ? drag.previewDur : duration;
    const inView = start + dur >= visible.start && start <= visible.end;
    // Keep the focused/dragged block mounted while its media leaves the viewport.
    if (!inView && selected !== id && !isD) return null;
    const init = { lane, id, origAt: at, origDur: duration, origIn: clip?.inPoint, speed: clip?.speed, origAnimations: clip?.animations ?? overlay?.animations };
    const activate = () => { setSelected(id); playerBus.ref?.pause(); };
    return <div key={id} role="button" tabIndex={0} aria-pressed={selected === id}
      aria-label={`${label}，${fmtSec(at)} 到 ${fmtSec(at + duration)}，双击编辑属性`}
      data-clip-id={id}
      className={`djp-track-block djp-${lane}-block ${selected === id ? 'djp-clip-selected' : ''} ${isD ? 'djp-dragging' : ''}`}
      style={{ left: pct(start), width: pct(dur), ...(displayRow === undefined ? {} : { top: displayRow * 56 + 4, height: 48, bottom: 'auto' }) }} title={`${label} · ${fmtSec(duration)} · 双击编辑属性`}
      onPointerDown={(e) => beginDrag(e, { ...init, kind: lane === 'main' ? 'reorder' : 'move' })}
      onClick={(e) => { e.stopPropagation(); if (!justDragged.current) activate(); }}
      onDoubleClick={(e) => { e.stopPropagation(); if (!justDragged.current) onSeekClip(currentTime(), lane, id); }}
      onKeyDown={(e) => selectionKey(e, lane, id)}>
      <div className="djp-clip-caption"><span>{lane === 'subs' ? 'T' : <Icon name={lane === 'audio' ? 'volume' : 'film'} />}</span><span>{label}</span>{(clip?.speed ?? 1) !== 1 && <small>{clip?.speed}×</small>}</div>
      {clip && inView && lane !== 'audio' && <Filmstrip src={clip.src} type={(clip as Clip).type} inPoint={clip.inPoint} duration={duration} speed={clip.speed} />}
      {clip && inView && lane === 'audio' && <Waveform src={clip.src} inPoint={clip.inPoint} duration={duration} speed={clip.speed} />}
      {lane === 'main' && (clip as Clip)?.transition === 'fade' && <span className="djp-transition-mark" title="淡入转场" />}
      <div className="djp-handle djp-hl" title="裁剪头部" onDoubleClick={(e) => e.stopPropagation()} onPointerDown={(e) => beginDrag(e, { ...init, kind: 'trimL' })} />
      <div className="djp-handle djp-hr" title="裁剪尾部" onDoubleClick={(e) => e.stopPropagation()} onPointerDown={(e) => beginDrag(e, { ...init, kind: 'trimR' })} />
    </div>;
  };
  let elapsed = 0;
  const mainBlocks = (t.videoTracks[0]?.clips ?? []).map((clip) => {
    const at = elapsed;
    elapsed += drag?.id === clip.id && drag.kind !== 'reorder' ? drag.previewDur : clip.clipDuration;
    return block('main', clip.id, clip.src.split(/[\\/]/).pop() ?? clip.src, at, clip.clipDuration, clip);
  });

  let mainAt = 0;
  const overview: { mode: TrackMode; clips: { at: number; duration: number }[] }[] = [
    { mode: 'main', clips: (t.videoTracks[0]?.clips ?? []).map((clip) => {
      const at = mainAt; mainAt += clip.clipDuration;
      return { at, duration: clip.clipDuration };
    }) },
    { mode: 'audio', clips: t.audioTracks.flatMap((track) => track.clips.map((clip) => ({ at: clip.atSeconds, duration: clip.duration }))) },
    { mode: 'pip', clips: t.videoTracks.slice(1).flatMap((track) => track.clips.map((clip) => ({ at: clip.atSeconds ?? 0, duration: clip.clipDuration }))) },
    { mode: 'subs', clips: t.overlays.map((overlay) => ({ at: overlay.startSeconds, duration: overlay.endSeconds - overlay.startSeconds })) },
  ];
  const collapsed = overview.filter((entry) => entry.mode !== mode && entry.clips.length);
  let clipStart = 0;
  const selection = mode === 'main'
    ? (t.videoTracks[0]?.clips ?? []).map((clip) => { const start = clipStart; clipStart += clip.clipDuration; return { id: clip.id, label: clip.src, start, duration: clip.clipDuration }; }).find((clip) => clip.id === selected)
    : mode === 'audio'
      ? t.audioTracks.flatMap((track) => track.clips).map((clip) => ({ id: clip.id, label: clip.src, start: clip.atSeconds, duration: clip.duration })).find((clip) => clip.id === selected)
      : mode === 'pip'
        ? t.videoTracks.slice(1).flatMap((track) => track.clips).map((clip) => ({ id: clip.id, label: clip.src, start: clip.atSeconds ?? 0, duration: clip.clipDuration })).find((clip) => clip.id === selected)
        : t.overlays.map((overlay, i) => ({ id: 'sub-' + i, label: overlay.text, start: overlay.startSeconds, duration: overlay.endSeconds - overlay.startSeconds })).find((clip) => clip.id === selected);

  return <div ref={editorRef} tabIndex={0} aria-label="时间线编辑区" className="djp-editor-timeline" data-mode={mode} style={{ '--djp-summary-count': collapsed.length } as React.CSSProperties} onKeyDown={(e) => { if (selection && e.target === e.currentTarget) selectionKey(e, mode, selection.id); }}>
    {selection && <ClipActions label={selection.label} start={selection.start} duration={selection.duration} fps={t.meta.fps} onSplit={() => splitSelection(mode, selection.id)} onDelete={() => deleteSelection(mode, selection.id)} onInspect={() => onSeekClip(currentTime(), mode, selection.id)} onClose={clearSelection} />}
    <div className="djp-timeline-tools" hidden={Boolean(selection)}>
      <button className="djp-iconbtn djp-snap" aria-label="吸附" title="吸附到播放头与片段边缘" aria-pressed={snapping} onClick={() => setSnapping(!snapping)}><Icon name="magnet" /></button>
      <label className="djp-zoom"><span aria-hidden="true">−</span><input aria-label="时间线缩放" type="range" min="0.25" max="8" step="0.25" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} /><span aria-hidden="true">+</span></label>
      <button className="djp-iconbtn" title="适合窗口" aria-label="适合窗口" onClick={() => setZoom(Math.max(.25, Math.min(8, viewport * .8 / (56 * total))))}><Icon name="fit" /></button>
    </div>
    <div className="djp-timeline-viewport">
    <div className="djp-timeline-scroll" ref={scrollRef} aria-label="剪辑轨道" onScroll={(e) => {
      if (!e.currentTarget.clientWidth || hiddenViewport.current) return;
      const x = e.currentTarget.scrollLeft;
      updateWindow(x);
      if (Math.abs(x - programmaticScroll.current) < 1 || dragRef.current) return;
      programmaticScroll.current = x;
      manualUntil.current = performance.now() + 120;
      playerBus.ref?.pause();
      seekToSeconds(Math.min((timelineDurationInFrames(t) - 1) / t.meta.fps, x / (56 * zoom)), t.meta.fps);
    }} onPointerDown={(e) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest('.djp-track-block, button, .djp-ruler')) return;
      e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);
      pan.current = { x: e.clientX, scroll: e.currentTarget.scrollLeft };
      playerBus.ref?.pause();
    }} onPointerMove={(e) => {
      if (pan.current) e.currentTarget.scrollLeft = pan.current.scroll + pan.current.x - e.clientX;
    }} onPointerUp={() => { pan.current = null; }} onPointerCancel={() => { pan.current = null; }}>
      <div className="djp-tstrip" style={{ width: laneWidth + viewport, paddingInline: viewport / 2, '--djp-grid-step': `${step * laneWidth / total}px` } as React.CSSProperties}>
        {drag?.snapAt != null && <div className="djp-snap-guide" aria-hidden="true" style={{ left: viewport / 2 + drag.snapAt * 56 * zoom }} />}
        <div className="djp-trow djp-ruler-row">
          <div className="djp-trow-name djp-ruler-unit">{t.meta.fps} FPS</div>
          <div className="djp-ruler" aria-label="时间标尺" onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); scrubRef.current = true;
            playerBus.ref?.pause(); seek(e.clientX, e.currentTarget);
          }} onPointerMove={(e) => { if (scrubRef.current) seek(e.clientX, e.currentTarget); }} onPointerUp={() => { scrubRef.current = false; }} onPointerCancel={() => { scrubRef.current = false; }}>
            {ticks.map((sec) => <div key={sec} className="djp-tick" style={{ left: pct(sec) }}><span>{step >= 1 ? timecode(sec, t.meta.fps).slice(0, 5) : timecode(sec, t.meta.fps)}</span></div>)}
          </div>
        </div>
        <div className="djp-track-overview" aria-label="其他轨道概览">
          {collapsed.map((entry) => <button key={entry.mode} className={`djp-track-summary djp-summary-${entry.mode}`} aria-label={`切换到${modeNames[entry.mode]}模式`} title={`${modeNames[entry.mode]} · ${entry.clips.length} 个片段 · 点击展开`} onClick={() => onModeChange(entry.mode)}>
            {mergeTimeRanges(entry.clips).map((clip, index) => <span key={index} style={{ left: pct(clip.at), width: pct(clip.duration) }} />)}
          </button>)}
        </div>
        <div className="djp-active-tracks" role="group" aria-label={`${modeNames[mode]}编辑轨道`}>
        {mode === 'main' && <TrackRow code="V1" name="主画面" kind="main">{mainBlocks}{!mainBlocks.length && <button className="djp-empty-audio" onClick={onAdd}><Icon name="plus" />添加画面</button>}</TrackRow>}
        {mode === 'audio' && t.audioTracks.map((tr, i) => {
          const rows = overlappingRows(tr.clips, (clip) => ({ at: clip.atSeconds, duration: clip.duration }));
          return <TrackRow key={tr.id} code={`A${i + 1}`} name={tr.name ?? '音频'} kind="audio" muted={tr.muted} height={Math.max(1, rows.length) * 56}
            action={<button className="djp-track-mute" title={tr.muted ? '取消静音' : '静音轨道'} aria-label={`${tr.name ?? '音频'}${tr.muted ? '取消静音' : '静音'}`} aria-pressed={tr.muted} onClick={() => o.updateAudioTrack(tr.id, { muted: !tr.muted })}><Icon name={tr.muted ? 'muted' : 'volume'} /></button>}>
            {rows.flatMap((row, lane) => row.map((c) => block('audio', c.id, c.src, c.atSeconds, c.duration, c, undefined, lane)))}
          </TrackRow>;
        })}
        {mode === 'audio' && !t.audioTracks.length && <TrackRow code="A1" name="音频" kind="audio"><button className="djp-empty-audio" onClick={(e) => { e.stopPropagation(); onAudio(); }}><Icon name="plus" />添加音频</button></TrackRow>}
        {mode === 'pip' && t.videoTracks.slice(1).map((tr, i) => {
          const rows = overlappingRows(tr.clips, (clip) => ({ at: clip.atSeconds ?? 0, duration: clip.clipDuration }));
          return <TrackRow key={tr.id} code={`V${i + 2}`} name={tr.name ?? '画中画'} kind="pip" height={Math.max(1, rows.length) * 56}>
            {rows.flatMap((row, lane) => row.map((c) => block('pip', c.id, c.src, c.atSeconds ?? 0, c.clipDuration, c, undefined, lane)))}
          </TrackRow>;
        })}
        {mode === 'subs' && subtitleRows.map((row, lane) => <TrackRow key={lane} code={`T${lane + 1}`} name="字幕" kind="subs">
          {row.map(({ overlay: ov, index }) => block('subs', 'sub-' + index, ov.text, ov.startSeconds, ov.endSeconds - ov.startSeconds, undefined, ov))}
        </TrackRow>)}
        {((mode === 'pip' && !t.videoTracks.slice(1).some((track) => track.clips.length)) || (mode === 'subs' && !t.overlays.length)) && <TrackRow code="" name={modeNames[mode]} kind={mode}><button className="djp-empty-audio" onClick={onAdd}><Icon name="plus" />添加{modeNames[mode]}</button></TrackRow>}
        </div>
      </div>
    </div>
    <div className="djp-center-playhead" aria-hidden="true" />
    <button className="djp-timeline-add" aria-label={`添加${mode === 'main' ? '素材' : modeNames[mode]}`} title={`添加${mode === 'main' ? '素材' : modeNames[mode]}`} onClick={onAdd}><Icon name="plus" /></button>
    </div>
  </div>;
};
