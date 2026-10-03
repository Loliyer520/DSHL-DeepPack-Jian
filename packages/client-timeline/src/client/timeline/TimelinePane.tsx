// 时间线：所有轨道同屏（可切专注模式），拖动移动/换轨/重排、裁剪、淡入淡出、音量包络、框选、
// 吸附、Ctrl+滚轮缩放、右键菜单、从素材库拖入。拖动过程走 store.preview，松手一次提交。
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Timeline } from '../../../../engine/src/schema';
import { evalKeyframes, shiftAnimations, timelineHasContent } from '../../../../engine/src/timeline';
import { Icon } from '../Icon';
import { useEditor, useStore } from '../context';
import { useSelection, type Selected } from '../selection';
import { readPref, writePref } from '../prefs';
import { clampZoom, edgeScrollSpeed, fitPxPerSec, mergeTimeRanges, tickStep, timecode } from '../geometry';
import { ContextMenu, type MenuItem } from '../ui/common';
import type { Actions } from '../actions';
import { api, type Op } from '../engine';
import { ClipBlock } from './ClipBlock';
import { computeLayout, snap, snapPoints, type Block, type Focus, type Lane, type Layout } from './layout';

const RULER = 26;
const LANE_COLORS: Record<string, string> = { main: 'var(--dj-main)', pip: 'var(--dj-pip)', audio: 'var(--dj-audio)', text: 'var(--dj-text)' };
const TRANSITION_LABEL: Record<string, string> = { dissolve: '叠化', fadeBlack: '闪黑', fadeWhite: '闪白', slide: '滑动', wipe: '擦除', push: '推入', zoom: '缩放', blur: '模糊' };

type Drag =
  | { type: 'scrub' }
  | { type: 'marquee'; x0: number; y0: number; x1: number; y1: number; base: Selected[] }
  | { type: 'move'; block: Block; ids: Block[]; x0: number; y0: number; moved: boolean }
  | { type: 'trimL' | 'trimR' | 'fadeIn' | 'fadeOut'; block: Block; x0: number }
  | { type: 'env'; block: Block; index: number | null; y0: number }
  | { type: 'marker'; id: string; t0: number; x0: number };

export interface TimelineApi { zoom: (factor: number) => void; fit: () => void; toggleSnap: () => void }

export function TimelinePane({ actions, compact, onInspect, apiRef }: { actions: Actions; compact: boolean; onInspect: (section?: string) => void; apiRef?: React.MutableRefObject<TimelineApi | null> }) {
  const ed = useEditor();
  const timeline = useStore((s) => s.timeline);
  const project = useStore((s) => s.project);
  const flash = useStore((s) => s.flash);
  const { items: selected } = useSelection(ed.sel);
  const scope = ed.sessionId;
  const [pps, setPps] = useState(() => readPref(scope, 'pps', 60, (v) => typeof v === 'number' && v > 0));
  const [focus, setFocus] = useState<Focus>(() => readPref(scope, 'focus', 'all' as Focus));
  const [snapping, setSnapping] = useState(() => readPref(scope, 'snap', true));
  useEffect(() => writePref(scope, 'pps', pps), [scope, pps]);
  useEffect(() => writePref(scope, 'focus', focus), [scope, focus]);
  useEffect(() => writePref(scope, 'snap', snapping), [scope, snapping]);
  const scroll = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const heads = useRef<HTMLDivElement>(null);
  const playhead = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ left: 0, width: 600, top: 0 });
  const [overlay, setOverlay] = useState<{ snap: number | null; marquee: { x: number; y: number; w: number; h: number } | null; insert: { x: number; top: number; height: number } | null; dropLane: string | null }>({ snap: null, marquee: null, insert: null, dropLane: null });
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const drag = useRef<Drag | null>(null);
  const layout: Layout | null = useMemo(() => (timeline ? computeLayout(timeline, focus, compact) : null), [timeline, focus, compact]);
  const selectedIds = useMemo(() => new Set(selected.map((s) => s.id)), [selected]);
  const ctx = useRef({ timeline, layout, pps, snapping });
  ctx.current = { timeline, layout, pps, snapping };

  // 视口与滚动（rAF 合并）
  useLayoutEffect(() => {
    const el = scroll.current; if (!el) return;
    let raf = 0;
    const update = () => { raf = 0; setView({ left: el.scrollLeft, width: el.clientWidth, top: el.scrollTop }); if (heads.current) heads.current.style.transform = 'translateY(' + -el.scrollTop + 'px)'; };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    const ro = new ResizeObserver(onScroll);
    el.addEventListener('scroll', onScroll, { passive: true });
    ro.observe(el);
    update();
    return () => { el.removeEventListener('scroll', onScroll); ro.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  // 播放头：直接改 DOM；播放时翻页跟随，外部定位时滚到可见
  useEffect(() => ed.clock.subscribe((sec, playing) => {
    const px = sec * ctx.current.pps;
    if (playhead.current) playhead.current.style.transform = 'translateX(' + px + 'px)';
    const el = scroll.current;
    if (!el || drag.current) return;
    const right = el.scrollLeft + el.clientWidth;
    if (playing && px > right - el.clientWidth * 0.12) el.scrollLeft = px - el.clientWidth * 0.15;
    else if (!playing && (px < el.scrollLeft || px > right)) el.scrollLeft = Math.max(0, px - el.clientWidth * 0.3);
  }), [ed.clock]);
  useEffect(() => { if (playhead.current) playhead.current.style.transform = 'translateX(' + ed.clock.time() * pps + 'px)'; }, [pps, ed.clock]);

  // Ctrl/⌘ + 滚轮：以指针处时间为锚点缩放
  useEffect(() => {
    const el = scroll.current; if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = el.getBoundingClientRect();
        const xIn = e.clientX - rect.left;
        const sec = (el.scrollLeft + xIn) / ctx.current.pps;
        const next = clampZoom(ctx.current.pps * (e.deltaY < 0 ? 1.18 : 1 / 1.18));
        setPps(next);
        requestAnimationFrame(() => { el.scrollLeft = sec * next - xIn; });
      } else if (e.shiftKey && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const fit = useCallback(() => {
    const el = scroll.current; if (!el || !layout) return;
    setPps(fitPxPerSec(el.clientWidth, layout.total));
    requestAnimationFrame(() => { el.scrollLeft = 0; });
  }, [layout]);
  const zoom = (factor: number) => setPps((p) => clampZoom(p * factor));
  useEffect(() => {
    if (!apiRef) return;
    apiRef.current = { zoom, fit, toggleSnap: () => setSnapping((v) => !v) };
    return () => { apiRef.current = null; };
  });

  // ---------- 坐标换算 ----------
  const toLocal = (e: { clientX: number; clientY: number }) => {
    const r = content.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top - RULER };
  };
  const laneAt = (y: number): Lane | undefined => ctx.current.layout?.lanes.find((l) => y >= l.top && y < l.top + l.height);
  const blockSel = (b: Block): Selected => ({ kind: b.kind === 'text' ? 'overlay' : 'clip', id: b.id });

  /** 拖动中的预览操作（松手时同一批操作正式提交） */
  function opsFor(d: Drag, x: number, y: number): { ops: Op[]; label: string; snapAt: number | null; insert?: { x: number; top: number; height: number } } | null {
    const { timeline: t, layout: L, pps: p, snapping: s } = ctx.current;
    if (!t || !L) return null;
    const fps = t.meta.fps, frame = 1 / fps;
    const round = (v: number) => Math.round(v * fps) / fps;
    const thr = s ? 8 / p : 0;
    if (d.type === 'move') {
      const b = d.block;
      if (b.kind === 'main') {
        const sec = x / p;
        const others = L.blocks.filter((o) => o.kind === 'main' && o.id !== b.id);
        let index = 0;
        for (const o of others) if (sec > o.start + o.duration / 2) index++;
        const lane = L.lanes.find((l) => l.kind === 'main')!;
        const at = index < others.length ? others[index].start : others.length ? others[others.length - 1].start + others[others.length - 1].duration : 0;
        return { ops: [{ op: 'moveClip', id: b.id, index }], label: '调整主轨顺序', snapAt: null, insert: { x: at * p, top: lane.top, height: lane.height } };
      }
      const dx = (x - d.x0) / p;
      const exclude = new Set(d.ids.map((i) => i.id));
      const pts = snapPoints(t, L, exclude, ed.clock.time());
      let delta = round(dx);
      let snapAt: number | null = null;
      if (thr) {
        const a = snap(b.start + dx, pts, thr), z = snap(b.start + b.duration + dx, pts, thr);
        if (a.at !== null && (z.at === null || Math.abs(a.value - b.start - dx) <= Math.abs(z.value - b.start - b.duration - dx))) { delta = a.value - b.start; snapAt = a.at; }
        else if (z.at !== null) { delta = z.value - b.start - b.duration; snapAt = z.at; }
      }
      const minStart = Math.min(...d.ids.map((i) => i.start));
      if (minStart + delta < 0) delta = -minStart;
      const target = laneAt(y);
      const ops: Op[] = [];
      for (const it of d.ids) {
        const start = Math.max(0, it.start + delta);
        const isPrimary = it.id === b.id && d.ids.length === 1;
        if (it.kind === 'text') {
          const patch: Record<string, unknown> = { startSeconds: start, endSeconds: start + it.duration };
          if (isPrimary && target?.kind === 'text' && target.textTrack !== (it.overlay?.track ?? 0)) patch.track = target.textTrack;
          ops.push({ op: 'updateOverlay', id: it.id, patch });
        } else if (it.kind === 'pip' || it.kind === 'audio') {
          const op: Op = { op: 'moveClip', id: it.id, atSeconds: start };
          if (isPrimary && target && target.kind === it.kind && target.trackId && target.key !== it.laneKey) op.track = target.trackId;
          // 拖到所有音轨下方 → 新音轨；拖到最上层画中画之上（文字区）→ 新画中画层
          if (isPrimary && it.kind === 'audio' && y > L.height + 4) op.track = 'new';
          if (isPrimary && it.kind === 'pip' && (y < 0 || target?.kind === 'text')) op.track = 'new';
          ops.push(op);
        }
      }
      return { ops, label: '移动 ' + d.ids.length + ' 项', snapAt };
    }
    if (d.type === 'trimL' || d.type === 'trimR') {
      const b = d.block;
      const pts = snapPoints(t, L, new Set([b.id]), ed.clock.time());
      const edge = d.type === 'trimL' ? b.start : b.start + b.duration;
      const raw = edge + (x - d.x0) / p;
      const sn = thr ? snap(raw, pts, thr) : { value: raw, at: null };
      let v = round(sn.value);
      if (d.type === 'trimL') {
        const speed = b.clip?.speed ?? b.audio?.speed ?? 1;
        const inPoint = b.clip?.inPoint ?? b.audio?.inPoint ?? 0;
        const earliest = b.kind === 'text' || b.clip?.type === 'image' ? 0 : Math.max(0, b.start - inPoint / speed);
        v = Math.min(b.start + b.duration - frame, Math.max(earliest, v));
        const off = v - b.start;
        if (b.kind === 'text') return { ops: [{ op: 'updateOverlay', id: b.id, patch: { startSeconds: v } }], label: '裁剪字幕开头', snapAt: sn.at };
        const anim = (b.clip?.animations ?? b.audio?.animations) ? { animations: shiftAnimations(b.clip?.animations ?? b.audio?.animations, off) } : {};
        if (b.kind === 'audio') return { ops: [{ op: 'updateClip', id: b.id, patch: { atSeconds: v, duration: b.duration - off, inPoint: Math.max(0, inPoint + off * speed), ...anim } }], label: '裁剪开头', snapAt: sn.at };
        return { ops: [{ op: 'updateClip', id: b.id, patch: { clipDuration: b.duration - off, inPoint: b.clip?.type === 'image' ? 0 : Math.max(0, inPoint + off * speed), ...(b.kind === 'pip' ? { atSeconds: v } : {}), ...anim } }], label: '裁剪开头', snapAt: sn.at };
      }
      v = Math.max(b.start + frame, v);
      const dur = v - b.start;
      if (b.kind === 'text') return { ops: [{ op: 'updateOverlay', id: b.id, patch: { endSeconds: v } }], label: '裁剪字幕结尾', snapAt: sn.at };
      return { ops: [{ op: 'updateClip', id: b.id, patch: b.kind === 'audio' ? { duration: dur } : { clipDuration: dur } }], label: '裁剪结尾', snapAt: sn.at };
    }
    if (d.type === 'fadeIn' || d.type === 'fadeOut') {
      const b = d.block;
      const rel = x / p - b.start;
      const v = Math.max(0, Math.min(b.duration / 2, d.type === 'fadeIn' ? rel : b.duration - rel));
      return { ops: [{ op: 'updateClip', id: b.id, patch: { [d.type]: Math.round(v * 20) / 20 } }], label: d.type === 'fadeIn' ? '设置淡入' : '设置淡出', snapAt: null };
    }
    if (d.type === 'env') {
      const b = d.block;
      const lane = L.lanes.find((l) => l.key === b.laneKey)!;
      const h = lane.rowHeight - 6;
      const top = lane.top + b.row * lane.rowHeight + 3;
      const vol = Math.max(0, Math.min(1, 1 - (y - top - 4) / (h - 8)));
      const base = b.audio?.volume ?? 1;
      const kfs = b.audio?.animations?.volume;
      if (d.index === null || !kfs?.length) return { ops: [{ op: 'updateClip', id: b.id, patch: { volume: Math.round(vol * 100) / 100 } }], label: '调整音量', snapAt: null };
      const k = kfs[d.index];
      return { ops: [{ op: 'setKeyframe', id: b.id, channel: 'volume', t: k.t, v: Math.round(Math.min(1, vol / Math.max(0.01, base)) * 100) / 100 }], label: '调整音量包络', snapAt: null };
    }
    if (d.type === 'marker') {
      const v = Math.max(0, round(d.t0 + (x - d.x0) / p));
      return { ops: [{ op: 'updateMarker', id: d.id, patch: { t: v } }], label: '移动标记', snapAt: null };
    }
    return null;
  }

  // ---------- 指针交互（事件委托到滚动区） ----------
  const pendingOps = useRef<{ ops: Op[]; label: string } | null>(null);
  const lastPointer = useRef<{ clientX: number; clientY: number } | null>(null);
  const autoRaf = useRef(0);
  const seekAt = (x: number) => ed.clock.seek(Math.max(0, Math.min(ctx.current.layout?.total ?? 0, x / ctx.current.pps)));
  const resetOverlay = () => setOverlay({ snap: null, marquee: null, insert: null, dropLane: null });

  const update = (d: Drag, e: { clientX: number; clientY: number }) => {
    const { x, y } = toLocal(e);
    if (d.type === 'scrub') { seekAt(x); return; }
    if (d.type === 'marquee') {
      d.x1 = x; d.y1 = y;
      const L = ctx.current.layout!, p = ctx.current.pps;
      const rx = Math.min(d.x0, x), ry = Math.min(d.y0, y), w = Math.abs(x - d.x0), h = Math.abs(y - d.y0);
      setOverlay((o) => ({ ...o, marquee: { x: rx, y: ry, w, h } }));
      if (w < 4 && h < 4) return;
      const hits = L.blocks.filter((b) => {
        const lane = L.lanes.find((l) => l.key === b.laneKey);
        if (!lane || lane.collapsed || lane.locked) return false;
        const top = lane.top + b.row * lane.rowHeight, l = b.start * p;
        return l + b.duration * p > rx && l < rx + w && top + lane.rowHeight > ry && top < ry + h;
      }).map(blockSel);
      const seen = new Set(d.base.map((s) => s.id));
      ed.sel.selectMany([...d.base, ...hits.filter((s) => !seen.has(s.id))]);
      return;
    }
    if (d.type === 'move' && !d.moved) {
      if (Math.abs(x - d.x0) < 4 && Math.abs(y - d.y0) < 4) return;
      d.moved = true;
    }
    const r = opsFor(d, x, y);
    if (!r) return;
    pendingOps.current = { ops: r.ops, label: r.label };
    ed.store.preview(r.ops);
    setOverlay((o) => (o.snap === r.snapAt && o.insert?.x === r.insert?.x ? o : { ...o, snap: r.snapAt, insert: r.insert ?? null }));
  };

  // 拖到边缘时自动滚动
  const autoScroll = () => {
    cancelAnimationFrame(autoRaf.current);
    let last = performance.now();
    const step = (now: number) => {
      const el = scroll.current, d = drag.current, ptr = lastPointer.current;
      if (!el || !d || !ptr) return;
      const r = el.getBoundingClientRect();
      const v = edgeScrollSpeed(ptr.clientX, r.left, r.right);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (v) { el.scrollLeft += v * dt; update(d, ptr); }
      autoRaf.current = requestAnimationFrame(step);
    };
    autoRaf.current = requestAnimationFrame(step);
  };

  const finish = (commit: boolean) => {
    const d = drag.current;
    drag.current = null;
    cancelAnimationFrame(autoRaf.current);
    const pend = pendingOps.current;
    pendingOps.current = null;
    if (pend && commit) ed.store.dispatch(pend.ops, { label: pend.label });
    else ed.store.preview(null);
    // 空白处单击（没拉出选框）= 定位播放头，与剪映一致
    if (d?.type === 'marquee' && commit && Math.abs(d.x1 - d.x0) < 4 && Math.abs(d.y1 - d.y0) < 4) seekAt(d.x0);
    resetOverlay();
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape' && drag.current) { e.stopPropagation(); e.preventDefault(); finish(false); } };
    window.addEventListener('keydown', key, true);
    return () => { window.removeEventListener('keydown', key, true); cancelAnimationFrame(autoRaf.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !timeline || !layout) return;
    const target = e.target as HTMLElement;
    const { x, y } = toLocal(e);
    let d: Drag | null = null;
    const markerEl = target.closest<HTMLElement>('[data-marker]');
    const transEl = target.closest<HTMLElement>('[data-trans]');
    const blockEl = target.closest<HTMLElement>('[data-block]');
    const collapsedEl = target.closest<HTMLElement>('[data-expand]');
    if (markerEl) {
      const id = markerEl.dataset.marker!;
      const m = timeline.markers?.find((k) => k.id === id);
      if (!m) return;
      ed.sel.select({ kind: 'marker', id });
      d = { type: 'marker', id, t0: m.t, x0: x };
    } else if (target.closest('.dj-ruler')) {
      ed.clock.pause();
      seekAt(x);
      d = { type: 'scrub' };
    } else if (transEl) {
      ed.sel.select({ kind: 'clip', id: transEl.dataset.trans! });
      onInspect('transition');
      return;
    } else if (collapsedEl) {
      setFocus(collapsedEl.dataset.expand as Focus);
      return;
    } else if (blockEl) {
      const b = layout.blocks.find((o) => o.id === blockEl.dataset.block);
      if (!b) return;
      const lane = layout.lanes.find((l) => l.key === b.laneKey);
      const item = blockSel(b);
      const handle = target.closest('[data-handle]')?.getAttribute('data-handle') ?? undefined;
      if (e.shiftKey || e.ctrlKey || e.metaKey) { ed.sel.select(item, e.shiftKey ? 'add' : 'toggle'); return; }
      if (!selectedIds.has(b.id) || handle) ed.sel.select(item);
      if (lane?.locked) { ed.store.toast('info', '「' + lane.label + '」已锁定，解锁后才能拖动'); return; }
      if (handle === 'trimL' || handle === 'trimR' || handle === 'fadeIn' || handle === 'fadeOut') d = { type: handle, block: b, x0: x };
      else if (handle === 'envpoint' || handle === 'envelope') {
        const idx = handle === 'envpoint' ? Number(target.getAttribute('data-index')) : null;
        d = { type: 'env', block: b, index: Number.isFinite(idx) ? idx : null, y0: y };
      } else {
        const group = selectedIds.has(b.id) && b.kind !== 'main' ? layout.blocks.filter((o) => selectedIds.has(o.id) && o.kind !== 'main') : [b];
        d = { type: 'move', block: b, ids: group.length ? group : [b], x0: x, y0: y, moved: false };
      }
    } else {
      const base = e.shiftKey ? ed.sel.getSnapshot().items : [];
      if (!e.shiftKey) ed.sel.clear();
      d = { type: 'marquee', x0: x, y0: y, x1: x, y1: y, base };
    }
    if (!d) return;
    e.preventDefault();
    setMenu(null);
    drag.current = d;
    lastPointer.current = { clientX: e.clientX, clientY: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    if (d.type !== 'scrub') autoScroll();
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return;
    lastPointer.current = { clientX: e.clientX, clientY: e.clientY };
    update(d, e);
  };
  const onPointerUp = () => { if (drag.current) finish(true); };
  const onPointerCancel = () => { if (drag.current) finish(false); };

  // 双击：音量线加关键帧；片段打开属性
  const onDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const blockEl = target.closest<HTMLElement>('[data-block]');
    if (!blockEl || !layout || !timeline) return;
    const b = layout.blocks.find((o) => o.id === blockEl.dataset.block);
    if (!b) return;
    const handle = target.closest('[data-handle]')?.getAttribute('data-handle');
    if (handle === 'envelope' && b.audio) {
      const { x } = toLocal(e);
      const rel = Math.round((x / pps - b.start) * timeline.meta.fps) / timeline.meta.fps;
      const cur = evalKeyframes(b.audio.animations?.volume, rel) ?? 1;
      ed.store.dispatch([{ op: 'setKeyframe', id: b.id, channel: 'volume', t: Math.max(0, rel), v: cur }], { label: '添加音量关键帧' });
      return;
    }
    onInspect(b.kind === 'text' ? 'text' : undefined);
  };

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!timeline || !layout) return;
    const target = e.target as HTMLElement;
    const { x } = toLocal(e);
    const at = Math.max(0, x / pps);
    const blockEl = target.closest<HTMLElement>('[data-block]');
    const markerEl = target.closest<HTMLElement>('[data-marker]');
    let items: MenuItem[];
    if (markerEl) {
      const id = markerEl.dataset.marker!;
      ed.sel.select({ kind: 'marker', id });
      items = [
        { label: '编辑标记', icon: 'marker', run: () => onInspect('marker') },
        { label: '删除标记', icon: 'trash', danger: true, run: () => ed.store.dispatch([{ op: 'removeMarker', id }], { label: '删除标记' }) },
      ];
    } else if (blockEl) {
      const b = layout.blocks.find((o) => o.id === blockEl.dataset.block);
      if (!b) return;
      if (!selectedIds.has(b.id)) ed.sel.select(blockSel(b));
      const n = selectedIds.has(b.id) ? selected.length : 1;
      items = [
        { label: '在此处分割', icon: 'split', kbd: 'S', run: () => { ed.clock.seek(at); actions.splitAtPlayhead(); } },
        { label: '裁掉播放头之前', kbd: 'Q', run: () => actions.trimToPlayhead('start') },
        { label: '裁掉播放头之后', kbd: 'W', run: () => actions.trimToPlayhead('end') },
        { separator: true, label: '' },
        { label: '复制', icon: 'copy', kbd: 'Ctrl+C', run: actions.copy },
        { label: '创建副本', icon: 'duplicate', kbd: 'Ctrl+D', run: actions.duplicateSelection },
        ...(b.kind === 'main' && (b.index ?? 0) > 0 ? [{ label: '与上一段的转场…', icon: 'wand' as const, run: () => onInspect('transition') }] : []),
        { label: '属性', icon: 'sliders', run: () => onInspect(b.kind === 'text' ? 'text' : undefined) },
        { label: '交给 AI 处理', icon: 'sparkle', disabled: !ed.host.insertIntoChat, run: () => { if (!actions.askAi()) ed.store.toast('info', '当前宿主不支持插入到对话框'); } },
        { separator: true, label: '' },
        { label: n > 1 ? '删除 ' + n + ' 项' : '删除', icon: 'trash', kbd: 'Del', danger: true, run: actions.deleteSelection },
      ];
    } else {
      items = [
        { label: '在此添加字幕', icon: 'text', run: () => { ed.clock.seek(at); actions.addText('subtitle'); } },
        { label: '在此添加标题', icon: 'text', run: () => { ed.clock.seek(at); actions.addText('title'); } },
        { label: '在此添加标记', icon: 'marker', kbd: 'M', run: () => { ed.clock.seek(at); actions.addMarker(); } },
        { label: '粘贴到此处', icon: 'copy', kbd: 'Ctrl+V', run: () => { ed.clock.seek(at); actions.paste(); } },
        { separator: true, label: '' },
        { label: '全选', kbd: 'Ctrl+A', run: actions.selectAll },
        { label: '缩放到适合', icon: 'fit', kbd: 'Shift+Z', run: fit },
      ];
    }
    setMenu({ x: e.clientX, y: e.clientY, items });
  };

  // 从素材库（或系统文件管理器）拖入
  const dropTarget = (y: number, type: string) => {
    const lane = laneAt(y);
    if (type === 'audio') return { target: 'audio' as const, trackId: lane?.kind === 'audio' ? lane.trackId : undefined };
    if (lane?.kind === 'pip') return { target: 'pip' as const, trackId: lane.trackId };
    if (lane?.kind === 'text' || y < 0) return { target: 'pip' as const, trackId: 'new' };
    return { target: 'main' as const, trackId: undefined };
  };
  const onDragOver = (e: React.DragEvent) => {
    const types = e.dataTransfer.types;
    if (!types.includes('application/x-djian-asset') && !types.includes('Files')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const { x, y } = toLocal(e);
    const lane = laneAt(y);
    const top = lane?.top ?? 0, height = lane?.height ?? layout?.height ?? 0;
    setOverlay((o) => (o.dropLane === (lane?.key ?? null) && o.insert?.x === x ? o : { ...o, dropLane: lane?.key ?? null, insert: { x: Math.max(0, x), top, height } }));
  };
  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    resetOverlay();
    if (!project) return;
    const { x, y } = toLocal(e);
    const at = Math.max(0, x / pps);
    const raw = e.dataTransfer.getData('application/x-djian-asset');
    if (raw) {
      try {
        const asset = JSON.parse(raw) as { name: string; type: 'video' | 'image' | 'audio'; duration: number | null };
        const d = dropTarget(y, asset.type);
        actions.addAsset(asset, d.target, at, d.trackId);
      } catch { /* 非本面板的数据 */ }
      return;
    }
    const files = [...e.dataTransfer.files];
    for (const f of files) {
      ed.store.toast('info', '正在上传「' + f.name + '」…');
      try {
        const info = await api.upload(project.id, f);
        const type = (info.type === 'audio' || info.type === 'image' ? info.type : 'video') as 'video' | 'image' | 'audio';
        const d = dropTarget(y, type);
        actions.addAsset({ name: info.name, type, duration: info.duration }, d.target, at, d.trackId);
      } catch (err) {
        ed.store.toast('error', '上传「' + f.name + '」失败：' + (err instanceof Error ? err.message : String(err)));
      }
    }
  };

  // ---------- 渲染 ----------
  if (!timeline || !layout || !project) return <div className="dj-timeline"><div className="dj-empty-state">正在加载时间线…</div></div>;
  const fps = timeline.meta.fps;
  const width = Math.max(view.width, (layout.total + Math.max(10, view.width / pps * 0.5)) * pps);
  const height = RULER + layout.height + 40;
  const from = view.left / pps, to = (view.left + view.width) / pps;
  const step = tickStep(pps, fps);
  const ticks: number[] = [];
  for (let s = Math.max(0, Math.floor(from / step) * step); s <= to + step; s += step) ticks.push(s);
  const minor = step / (step >= 1 ? 5 : 2);
  const minorTicks: number[] = [];
  if (minor * pps >= 10) for (let s = Math.max(0, Math.floor(from / minor) * minor); s <= to + minor; s += minor) if (Math.abs(s / step - Math.round(s / step)) > 1e-6) minorTicks.push(s);
  const margin = view.width / pps;
  const visible = layout.blocks.filter((b) => b.start + b.duration >= from - margin && b.start <= to + margin);
  const laneOf = new Map(layout.lanes.map((l) => [l.key, l]));
  const selectedMarker = selected.find((s) => s.kind === 'marker')?.id;
  const updateTrack = (lane: Lane, patch: Record<string, unknown>, label: string) => lane.trackId && ed.store.dispatch([{ op: 'updateTrack', id: lane.trackId, patch }], { label });
  const FOCUS: [Focus, string][] = [['all', '全部'], ['text', '文字'], ['pip', '画中画'], ['main', '主轨'], ['audio', '音频']];

  return (
    <div className="dj-timeline" onContextMenu={(e) => e.preventDefault()}>
      <div className="dj-tl-tools" role="toolbar" aria-label="时间线工具">
        <button className="dj-icon-btn" title="分割 (S / Ctrl+B)" aria-label="分割" onClick={actions.splitAtPlayhead}><Icon name="split" /></button>
        <button className="dj-icon-btn" title="删除 (Delete)" aria-label="删除" disabled={!selected.length} onClick={actions.deleteSelection}><Icon name="trash" /></button>
        <button className="dj-icon-btn" title="创建副本 (Ctrl+D)" aria-label="创建副本" disabled={!selected.length} onClick={actions.duplicateSelection}><Icon name="duplicate" /></button>
        <span className="dj-sep" />
        <button className="dj-icon-btn" title="添加字幕 (T)" aria-label="添加字幕" onClick={() => actions.addText('subtitle')}><Icon name="text" /></button>
        <button className="dj-icon-btn" title="添加标记 (M)" aria-label="添加标记" onClick={actions.addMarker}><Icon name="marker" /></button>
        <span className="dj-sep" />
        <div className="dj-seg" role="radiogroup" aria-label="专注轨道">
          {FOCUS.map(([k, label]) => <button key={k} role="radio" aria-checked={focus === k} onClick={() => setFocus(k)}>{label}</button>)}
        </div>
        <span className="dj-spacer" />
        <button className="dj-icon-btn" title={snapping ? '吸附：开 (N)' : '吸附：关 (N)'} aria-label="吸附" aria-pressed={snapping} onClick={() => setSnapping((v) => !v)}><Icon name="magnet" /></button>
        <button className="dj-icon-btn" title="缩小 (-)" aria-label="缩小" onClick={() => zoom(1 / 1.4)}><Icon name="zoomOut" /></button>
        {!compact && <input type="range" aria-label="缩放" min={0} max={1000} value={Math.round(Math.log(pps / 0.5) / Math.log(1200) * 1000)} onChange={(e) => setPps(clampZoom(0.5 * Math.pow(1200, Number(e.target.value) / 1000)))} />}
        <button className="dj-icon-btn" title="放大 (+)" aria-label="放大" onClick={() => zoom(1.4)}><Icon name="zoomIn" /></button>
        <button className="dj-icon-btn" title="适应窗口 (Shift+Z)" aria-label="适应窗口" onClick={fit}><Icon name="fit" /></button>
      </div>
      <div className="dj-tl-body">
        <div className="dj-heads">
          <div className="dj-head-ruler" title="成片时长">{timecode(layout.total, fps, false)}</div>
          <div ref={heads} className="dj-heads-inner">
            {layout.lanes.map((lane) => (
              <div key={lane.key} className="dj-head" style={{ top: RULER + lane.top, height: lane.height }}>
                <i style={{ background: LANE_COLORS[lane.kind] }} />
                {!lane.collapsed && <>
                  <span className="dj-hname" title={lane.label} onClick={() => lane.trackId ? ed.sel.select({ kind: 'track', id: lane.trackId }) : setFocus(focus === lane.kind ? 'all' : lane.kind)}>{lane.label}{lane.role ? ' · ' + ({ music: '音乐', voice: '人声', sfx: '音效' } as Record<string, string>)[lane.role] : ''}</span>
                  {lane.trackId && lane.kind !== 'audio' && <button className="dj-icon-btn" aria-label={lane.hidden ? '显示轨道' : '隐藏轨道'} title={lane.hidden ? '显示' : '隐藏'} onClick={() => updateTrack(lane, { hidden: !lane.hidden }, lane.hidden ? '显示轨道' : '隐藏轨道')}><Icon name={lane.hidden ? 'eyeOff' : 'eye'} /></button>}
                  {lane.trackId && <button className="dj-icon-btn" aria-label={lane.muted ? '取消静音' : '静音'} title={lane.muted ? '取消静音' : '静音'} onClick={() => updateTrack(lane, { muted: !lane.muted }, lane.muted ? '取消静音' : '轨道静音')}><Icon name={lane.muted ? 'muted' : 'volume'} /></button>}
                  {lane.trackId && !compact && <button className="dj-icon-btn" aria-label={lane.locked ? '解锁' : '锁定'} title={lane.locked ? '解锁（AI 和你都能改）' : '锁定（防止 AI 和误操作修改）'} onClick={() => updateTrack(lane, { locked: !lane.locked }, lane.locked ? '解锁轨道' : '锁定轨道')}><Icon name={lane.locked ? 'lock' : 'unlock'} /></button>}
                </>}
              </div>
            ))}
          </div>
        </div>
        <div className="dj-scroll" ref={scroll}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}
          onDoubleClick={onDoubleClick} onContextMenu={onContextMenu} onDragOver={onDragOver} onDrop={(e) => void onDrop(e)}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) resetOverlay(); }}>
          <div className="dj-canvas-tl" ref={content} style={{ width, height }}>
            <div className="dj-ruler" style={{ width }}>
              {minorTicks.map((s) => <span key={'m' + s} className="dj-tick dj-minor" style={{ left: s * pps }} />)}
              {ticks.map((s) => <span key={s} className="dj-tick" style={{ left: s * pps }}>{step < 1 ? timecode(s, fps) : timecode(s, fps, false)}</span>)}
              {(timeline.markers ?? []).map((m) => (
                <span key={m.id} data-marker={m.id} className={'dj-marker' + (selectedMarker === m.id ? ' dj-sel' : '')} style={{ left: m.t * pps, ...(m.color ? { background: m.color } : {}) }} title={(m.label || '标记') + ' · ' + timecode(m.t, fps)} />
              ))}
            </div>
            {layout.lanes.map((lane) => (
              <div key={lane.key} className={'dj-lane' + (lane.locked ? ' dj-locked' : '') + (overlay.dropLane === lane.key ? ' dj-drop' : '')} style={{ top: RULER + lane.top, height: lane.height, width }}>
                {lane.collapsed && mergeTimeRanges(layout.blocks.filter((b) => b.laneKey === lane.key).map((b) => ({ at: b.start, duration: b.duration }))).map((r, i) => (
                  <span key={i} className="dj-collapsed" data-expand={lane.kind} title={'展开' + lane.label} style={{ left: r.at * pps, width: Math.max(2, r.duration * pps), top: 2, background: LANE_COLORS[lane.kind] }} />
                ))}
              </div>
            ))}
            {visible.map((b) => {
              const lane = laneOf.get(b.laneKey)!;
              if (lane.collapsed) return null;
              return (
                <ClipBlock key={b.id} block={b} pid={project.id} pps={pps} top={RULER + lane.top + b.row * lane.rowHeight} height={lane.rowHeight}
                  selected={selectedIds.has(b.id)} flash={Boolean(flash[(b.kind === 'text' ? 'overlay:' : 'clip:') + b.id])} dim={Boolean(lane.hidden || lane.muted && b.kind === 'audio')}
                  visibleFrom={from} visibleTo={to} />
              );
            })}
            {(() => {
              const main = layout.lanes.find((l) => l.kind === 'main');
              if (!main || main.collapsed) return null;
              return layout.blocks.filter((b) => b.kind === 'main' && (b.index ?? 0) > 0 && b.start >= from - 1 && b.start <= to + 1).map((b) => {
                const tr = b.clip?.transition;
                const type = typeof tr === 'object' ? tr.type : tr === 'fade' ? 'dissolve' : null;
                return (
                  <span key={'t' + b.id} data-trans={b.id} className={'dj-trans' + (type ? '' : ' dj-none')} style={{ left: b.start * pps, top: RULER + main.top + main.height / 2 }}
                    title={type ? '转场：' + (TRANSITION_LABEL[type] ?? type) + (typeof tr === 'object' ? ' ' + tr.duration + 's' : '') : '添加转场'}>
                    {type ? (TRANSITION_LABEL[type] ?? '转').slice(0, 1) : '+'}
                  </span>
                );
              });
            })()}
            {!timelineHasContent(timeline) && (
              <div className="dj-newtrack" style={{ top: RULER + (layout.lanes.find((l) => l.kind === 'main')?.top ?? 0) + 8, left: 12, right: 'auto', width: Math.max(240, view.width - 24), height: 44 }}>
                把素材拖到这里，或在对话里让 AI 帮你粗剪
              </div>
            )}
            {layout.lanes.some((l) => l.kind === 'audio' && l.trackId) && (
              <div className="dj-newtrack" style={{ top: RULER + layout.height + 6, left: view.left + 8, right: 'auto', width: Math.max(160, view.width - 16), opacity: overlay.dropLane === null && overlay.insert ? 1 : 0.5 }}>拖到这里新建音频轨</div>
            )}
            <div className="dj-playhead" ref={playhead} style={{ height }} />
            {overlay.snap !== null && <div className="dj-snapline" style={{ left: overlay.snap * pps, height }} />}
            {overlay.insert && <div className="dj-insert" style={{ left: overlay.insert.x - 1, top: RULER + overlay.insert.top, height: overlay.insert.height }} />}
            {overlay.marquee && (overlay.marquee.w > 3 || overlay.marquee.h > 3) && <div className="dj-marquee" style={{ left: overlay.marquee.x, top: RULER + overlay.marquee.y, width: overlay.marquee.w, height: overlay.marquee.h }} />}
          </div>
        </div>
      </div>
      {menu && <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} />}
    </div>
  );
}
