// 预览区：Remotion Player（与导出同一合成）+ 画布直接操作（拖动/缩放画中画，拖动/缩放/双击编辑文字）
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import type { Overlay, Timeline } from '../../../../engine/src/schema';
import { TimelineVideo } from '../../../../engine/src/TimelineVideo';
import { clipBox, locateClip, timelineDurationInFrames, timelineHasContent } from '../../../../engine/src/timeline';
import { assetBaseUrl, fontsBaseUrl, mediaUrl } from '../engine';
import { useEditor, useStore, usePlayhead } from '../context';
import { useSelection } from '../selection';

type Rect = { left: number; top: number; width: number; height: number };

function ErrorCatcher({ error, onError }: { error: Error; onError: (e: Error) => void }) {
  useEffect(() => onError(error), [error, onError]);
  return null;
}

/** 文字块近似外框（画布分数）：用于拖动与缩放手柄 */
export function overlayBox(o: Overlay, t: Timeline) {
  const H = t.meta.height, W = t.meta.width;
  const lines = Math.max(1, o.text.split('\n').length);
  const longest = Math.max(1, ...o.text.split('\n').map((l) => [...l].reduce((n, ch) => n + (ch.charCodeAt(0) > 255 ? 1 : 0.55), 0)));
  const w = Math.min(o.maxWidth ?? 0.9, (longest * o.fontSize * 1.02 + (o.background ? 40 : 0)) / W);
  const h = (lines * o.fontSize * (o.lineHeight ?? 1.3) + (o.background ? 24 : 0)) / H;
  const cx = o.x ?? 0.5;
  const cy = o.y ?? (o.position === 'top' ? (60 + (h * H) / 2) / H : o.position === 'center' ? 0.5 : 1 - (80 + (h * H) / 2) / H);
  return { x: cx - w / 2, y: cy - h / 2, w, h, cx, cy };
}

export function PreviewPane() {
  const ed = useEditor();
  const timeline = useStore((s) => s.timeline);
  const project = useStore((s) => s.project);
  const playerRef = useRef<PlayerRef | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [failure, setFailure] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const attach = useCallback((ref: PlayerRef | null) => { playerRef.current = ref; ed.clock.attach(ref); }, [ed.clock]);
  useEffect(() => { if (!ed.host.visible) ed.clock.pause(); }, [ed.host.visible, ed.clock]);
  // 浏览器在 Range 请求被中断时也会报媒体错误（数据其实已缓冲好、仍可播放）：先确认素材确实读不到再提示
  const pid = project?.id;
  const onMediaError = useCallback((src: string) => {
    const name = decodeURIComponent(String(src).split('/').pop() ?? src);
    const show = () => setFailure('无法加载素材「' + name + '」');
    if (!pid) { show(); return; }
    fetch(mediaUrl(pid, name), { method: 'HEAD', signal: AbortSignal.timeout(8000) })
      .then((r) => { if (!r.ok) show(); })
      .catch(show);
  }, [pid]);
  const inputProps = useMemo(() => (timeline && project ? { timeline, assetBase: assetBaseUrl(project.id), fontsBase: fontsBaseUrl(), onMediaError } : null), [timeline, project, onMediaError]);
  if (!timeline || !inputProps) return <div className="dj-stage-empty">正在连接剪辑引擎…</div>;
  ed.clock.fps = timeline.meta.fps;
  const duration = Math.max(1, timelineDurationInFrames(timeline));
  const ar = timeline.meta.width / timeline.meta.height;
  const dw = Math.min(size.w, size.h * ar), dh = dw / ar;
  const rect: Rect = { left: (size.w - dw) / 2, top: (size.h - dh) / 2, width: dw, height: dh };
  return (
    <div className="dj-stage" ref={wrap}>
      <Player
        key={attempt + '-' + timeline.meta.fps + '-' + timeline.meta.width + 'x' + timeline.meta.height}
        ref={attach}
        component={TimelineVideo as unknown as React.FC<Record<string, unknown>>}
        inputProps={inputProps as unknown as Record<string, unknown>}
        durationInFrames={duration}
        initialFrame={Math.min(ed.clock.frame, duration - 1)}
        fps={timeline.meta.fps}
        compositionWidth={timeline.meta.width}
        compositionHeight={timeline.meta.height}
        controls={false}
        clickToPlay={false}
        doubleClickToFullscreen={false}
        spaceKeyToPlayOrPause={false}
        errorFallback={({ error }: { error: Error }) => <ErrorCatcher error={error} onError={(e) => setFailure(e.message)} />}
        acknowledgeRemotionLicense
        style={{ width: '100%', height: '100%' }}
      />
      {!timelineHasContent(timeline) && <div className="dj-stage-empty"><b>从素材库拖入视频、图片或音频开始剪辑</b><span>也可以直接在对话里让 AI 帮你剪</span></div>}
      {rect.width > 0 && <CanvasOverlay rect={rect} timeline={timeline} />}
      {failure && (
        <div className="dj-stage-error" role="alert">
          <b>预览暂时不可用</b><span>{failure}</span>
          <button className="dj-btn" onClick={() => { setFailure(null); setAttempt((a) => a + 1); }}>重试预览</button>
        </div>
      )}
    </div>
  );
}

const SNAP = 0.015;
function snapBox(v: number, size: number, guides: number[]) {
  // 盒子左/中/右与参考线（0, 0.5, 1）对齐
  for (const g of [0, 0.5, 1]) {
    for (const [edge, off] of [[v, 0], [v + size / 2, size / 2], [v + size, size]] as const) {
      if (Math.abs(edge - g) < SNAP) { guides.push(g); return g - off; }
    }
  }
  return v;
}

function CanvasOverlay({ rect, timeline }: { rect: Rect; timeline: Timeline }) {
  const ed = useEditor();
  const { primary, items } = useSelection(ed.sel);
  const now = usePlayhead();
  const [guides, setGuides] = useState<{ v: number[]; h: number[] }>({ v: [], h: [] });
  const [editing, setEditing] = useState<string | null>(null);
  if (!primary || items.length !== 1) return null;
  const toPx = (fx: number, fy: number) => ({ x: rect.left + fx * rect.width, y: rect.top + fy * rect.height });

  if (primary.kind === 'clip') {
    const loc = locateClip(timeline, primary.id);
    if (!loc || loc.kind !== 'video' || loc.trackIndex === 0) return null;
    const box = clipBox(loc.clip);
    const active = now >= loc.start && now < loc.start + loc.duration;
    const p = toPx(box.x, box.y);
    const begin = (e: React.PointerEvent, handle: string | null) => {
      e.preventDefault(); e.stopPropagation();
      ed.clock.pause();
      const el = e.currentTarget as HTMLElement;
      el.setPointerCapture(e.pointerId);
      const start = { x: e.clientX, y: e.clientY, box };
      let last = box;
      const move = (ev: PointerEvent) => {
        const dx = (ev.clientX - start.x) / rect.width, dy = (ev.clientY - start.y) / rect.height;
        const g = { v: [] as number[], h: [] as number[] };
        let b = { ...start.box };
        if (!handle) {
          b.x = snapBox(Math.min(1 - b.w, Math.max(0, start.box.x + dx)), b.w, g.v);
          b.y = snapBox(Math.min(1 - b.h, Math.max(0, start.box.y + dy)), b.h, g.h);
        } else {
          const ratio = start.box.w / start.box.h;
          let w = start.box.w + (handle.includes('e') ? dx : -dx);
          if (w < 0.05) w = 0.05;
          let h = ev.shiftKey ? start.box.h + (handle.includes('s') ? dy : -dy) : w / ratio;
          if (h < 0.05) h = 0.05;
          b = { w: Math.min(1, w), h: Math.min(1, h), x: handle.includes('w') ? start.box.x + start.box.w - Math.min(1, w) : start.box.x, y: handle.includes('n') ? start.box.y + start.box.h - Math.min(1, h) : start.box.y };
          b.x = Math.max(0, Math.min(1 - b.w, b.x)); b.y = Math.max(0, Math.min(1 - b.h, b.y));
        }
        last = b;
        setGuides(g);
        ed.store.preview([{ op: 'updateClip', id: loc.clip.id, patch: { box: b } }]);
      };
      const up = () => {
        el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
        setGuides({ v: [], h: [] });
        if (last !== box) ed.store.dispatch([{ op: 'updateClip', id: loc.clip.id, patch: { box: last } }], { label: handle ? '缩放画中画' : '移动画中画' });
        else ed.store.preview(null);
      };
      el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    };
    return (
      <div className="dj-canvas" style={{ inset: 0 }}>
        <div className="dj-gizmo" style={{ left: p.x, top: p.y, width: box.w * rect.width, height: box.h * rect.height, opacity: active ? 1 : 0.45 }}
          onPointerDown={(e) => begin(e, null)} title="拖动移动，拖角缩放（Shift 自由比例）">
          {(['nw', 'ne', 'sw', 'se'] as const).map((h) => <b key={h} data-h={h} onPointerDown={(e) => begin(e, h)} />)}
        </div>
        {guides.v.map((g) => <div key={'v' + g} className="dj-guide dj-v" style={{ left: rect.left + g * rect.width }} />)}
        {guides.h.map((g) => <div key={'h' + g} className="dj-guide dj-h" style={{ top: rect.top + g * rect.height }} />)}
      </div>
    );
  }

  if (primary.kind === 'overlay') {
    const o = timeline.overlays.find((x) => x.id === primary.id);
    if (!o) return null;
    const b = overlayBox(o, timeline);
    const active = now >= o.startSeconds && now < o.endSeconds;
    const p = toPx(b.x, b.y);
    const scale = rect.height / timeline.meta.height;
    const begin = (e: React.PointerEvent, handle: boolean) => {
      if (e.detail > 1) return;
      e.preventDefault(); e.stopPropagation();
      ed.clock.pause();
      const el = e.currentTarget as HTMLElement;
      el.setPointerCapture(e.pointerId);
      const start = { x: e.clientX, y: e.clientY };
      let patch: Record<string, unknown> | null = null;
      const move = (ev: PointerEvent) => {
        const dx = (ev.clientX - start.x) / rect.width, dy = (ev.clientY - start.y) / rect.height;
        const g = { v: [] as number[], h: [] as number[] };
        if (!handle) {
          let cx = Math.min(1, Math.max(0, b.cx + dx)), cy = Math.min(1, Math.max(0, b.cy + dy));
          if (Math.abs(cx - 0.5) < SNAP) { cx = 0.5; g.v.push(0.5); }
          if (Math.abs(cy - 0.5) < SNAP) { cy = 0.5; g.h.push(0.5); }
          patch = { x: Math.round(cx * 1000) / 1000, y: Math.round(cy * 1000) / 1000 };
        } else {
          const factor = Math.max(0.2, 1 + (dx + dy) * 2);
          patch = { fontSize: Math.max(8, Math.round(o.fontSize * factor)) };
        }
        setGuides(g);
        ed.store.preview([{ op: 'updateOverlay', id: o.id, patch }]);
      };
      const up = () => {
        el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
        setGuides({ v: [], h: [] });
        if (patch) ed.store.dispatch([{ op: 'updateOverlay', id: o.id, patch }], { label: handle ? '缩放文字' : '移动文字' });
        else ed.store.preview(null);
      };
      el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    };
    return (
      <div className="dj-canvas" style={{ inset: 0 }}>
        {editing === o.id ? (
          <textarea className="dj-textedit" autoFocus defaultValue={o.text}
            style={{ left: p.x, top: p.y, width: Math.max(80, b.w * rect.width), height: Math.max(32, b.h * rect.height + 8), fontSize: Math.max(11, o.fontSize * scale) }}
            onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Escape') setEditing(null); if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); e.currentTarget.blur(); } }}
            onBlur={(e) => { const v = e.currentTarget.value; setEditing(null); if (v !== o.text) ed.store.dispatch([{ op: 'updateOverlay', id: o.id, patch: { text: v } }], { label: '修改文字' }); }} />
        ) : (
          <div className="dj-gizmo dj-text-gizmo" style={{ left: p.x, top: p.y, width: b.w * rect.width, height: b.h * rect.height, opacity: active ? 1 : 0.45 }}
            onPointerDown={(e) => begin(e, false)} onDoubleClick={() => setEditing(o.id)} title="拖动摆放，拖右下角缩放字号，双击编辑文字">
            <b data-h="se" onPointerDown={(e) => begin(e, true)} />
          </div>
        )}
        {guides.v.map((g) => <div key={'v' + g} className="dj-guide dj-v" style={{ left: rect.left + g * rect.width }} />)}
        {guides.h.map((g) => <div key={'h' + g} className="dj-guide dj-h" style={{ top: rect.top + g * rect.height }} />)}
      </div>
    );
  }
  return null;
}
