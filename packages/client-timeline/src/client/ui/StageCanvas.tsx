// 画布直接操作（PPT 式）：点选元素/画中画（按住即可拖动）、吸附画布与其他元素、八向缩放、旋转、
// 双击就地改字、右键选中被遮挡的元素与调整叠放顺序。拖动中走 store.preview，松手一次提交。
import React, { useEffect, useReducer, useState } from 'react';
import type { Overlay, Timeline } from '../../../../engine/src/schema';
import { clipBox, elementLabel, isBoxElement, LINE_SHAPES, locateClip } from '../../../../engine/src/timeline';
import { elementBoxPx } from '../../../../engine/src/elements';
import { useEditor, usePlayhead, usePlaying } from '../context';
import { useSelection, type Selected } from '../selection';
import type { Op } from '../engine';
import { KIND_NAME, type Actions } from '../actions';
import { ContextMenu, type MenuItem } from './common';

export type Rect = { left: number; top: number; width: number; height: number };
type Guides = { v: number[]; h: number[] };
/** 元素在舞台上的静态外框（舞台像素：中心 + 尺寸 + 旋转），不含动画 */
interface Geo { cx: number; cy: number; w: number; h: number; rot: number; box: boolean; autoH: boolean; live: boolean }

const SNAP_PX = 6;
const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;
type Handle = typeof HANDLES[number];
const r4 = (v: number) => Math.round(v * 10000) / 10000;
const rad = (deg: number) => (deg * Math.PI) / 180;
const isLine = (o: Overlay) => o.kind === 'shape' && (LINE_SHAPES as readonly string[]).includes(o.shape?.type ?? '');
const editable = (o: Overlay) => !o.counter && (!isBoxElement(o) || o.kind === 'shape');

const nodeOf = (stage: HTMLElement | null, id: string) => stage?.querySelector<HTMLElement>('[data-el="' + CSS.escape(id) + '"]') ?? null;
const estimateH = (o: Overlay) => Math.max(1, (o.text || ' ').split('\n').length) * o.fontSize * (o.lineHeight ?? 1.3) + (o.background ? 2 * (o.background.padding ?? 12) : 0) + 2 * (o.padding ?? 0);

export function measure(o: Overlay, t: Timeline, rect: Rect, stage: HTMLElement | null): Geo {
  const W = t.meta.width, H = t.meta.height, sc = rect.width / W;
  const node = nodeOf(stage, o.id);
  if (isBoxElement(o) || o.w !== undefined) {
    const { w, h } = elementBoxPx(o, W, H);
    // 自动高度的文本框：读渲染出的版面高度（offsetHeight 不受 Player 缩放与动画影响）
    const hh = h ?? (node ? node.offsetHeight : estimateH(o));
    return { cx: rect.left + (o.x ?? 0.5) * rect.width, cy: rect.top + (o.y ?? 0.5) * rect.height, w: w * sc, h: hh * sc, rot: o.rotate ?? 0, box: true, autoH: h === undefined, live: Boolean(node) };
  }
  if (node && stage) {
    const r = node.getBoundingClientRect(), s = stage.getBoundingClientRect();
    return { cx: r.left - s.left + r.width / 2, cy: r.top - s.top + r.height / 2, w: r.width, h: r.height, rot: 0, box: false, autoH: true, live: true };
  }
  // 不在播放头处的旧版字幕：按字号粗估
  const longest = Math.max(1, ...(o.text || ' ').split('\n').map((l) => [...l].reduce((n, ch) => n + (ch.charCodeAt(0) > 255 ? 1 : 0.55), 0)));
  const w = Math.min((o.maxWidth ?? 0.9) * W, longest * o.fontSize * 1.02 + (o.background ? 40 : 0));
  const h = estimateH(o);
  const cy = o.y !== undefined ? o.y * H : o.position === 'top' ? 60 + h / 2 : o.position === 'center' ? H / 2 : H - 80 - h / 2;
  return { cx: rect.left + (o.x ?? 0.5) * rect.width, cy: rect.top + cy * sc, w: w * sc, h: h * sc, rot: 0, box: false, autoH: true, live: false };
}

/** 指针下的元素/画中画，按画面叠放从上到下 */
function hitsAt(stage: HTMLElement | null, x: number, y: number): Selected[] {
  const out: Selected[] = [];
  if (!stage) return out;
  for (const el of document.elementsFromPoint(x, y)) {
    if (!stage.contains(el)) continue;
    const n = (el as HTMLElement).closest<HTMLElement>('[data-el],[data-clip]');
    if (!n) continue;
    const s: Selected = n.dataset.el ? { kind: 'overlay', id: n.dataset.el } : { kind: 'clip', id: n.dataset.clip! };
    if (!out.some((o) => o.id === s.id)) out.push(s);
  }
  return out;
}

/** 吸附参考线：画布四边与中线 + 画面上其他元素的边与中线（舞台像素） */
function snapTargets(stage: HTMLElement | null, rect: Rect, exclude: Set<string>): Guides {
  const v = [rect.left, rect.left + rect.width / 2, rect.left + rect.width];
  const h = [rect.top, rect.top + rect.height / 2, rect.top + rect.height];
  if (!stage) return { v, h };
  const s = stage.getBoundingClientRect();
  stage.querySelectorAll<HTMLElement>('[data-el]').forEach((n) => {
    if (exclude.has(n.dataset.el!)) return;
    const r = n.getBoundingClientRect();
    if (r.width < 2 || (r.width >= rect.width * 0.98 && r.height >= rect.height * 0.98)) return;
    v.push(r.left - s.left, r.left - s.left + r.width / 2, r.right - s.left);
    h.push(r.top - s.top, r.top - s.top + r.height / 2, r.bottom - s.top);
  });
  return { v, h };
}

function snap1(edges: number[], targets: number[]): { off: number; at: number } | null {
  let best: { off: number; at: number } | null = null;
  for (const e of edges) for (const t of targets) {
    const d = t - e;
    if (Math.abs(d) < SNAP_PX && (!best || Math.abs(d) < Math.abs(best.off))) best = { off: d, at: t };
  }
  return best;
}

/** 拖动会话：捕获指针，移动时算补丁预览，松手提交（没动则回调 onClick） */
function drag(e: React.PointerEvent, onMove: (ev: PointerEvent, dx: number, dy: number) => Op[] | null, commit: (ops: Op[]) => void, onClick?: () => void, preview?: (ops: Op[] | null) => void) {
  e.preventDefault(); e.stopPropagation();
  const el = e.currentTarget as HTMLElement;
  // 拦下了事件，工作区根节点拿不到焦点：手动聚焦，Ctrl+Z / Delete 等快捷键才能继续用
  el.closest<HTMLElement>('.dj-root')?.focus({ preventScroll: true });
  el.setPointerCapture(e.pointerId);
  const x0 = e.clientX, y0 = e.clientY;
  let moved = false;
  let last: Op[] | null = null;
  const move = (ev: PointerEvent) => {
    const dx = ev.clientX - x0, dy = ev.clientY - y0;
    if (!moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
    moved = true;
    last = onMove(ev, dx, dy);
    preview?.(last);
  };
  const up = (ev: PointerEvent) => {
    el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
    if (moved && last && ev.type === 'pointerup') commit(last);
    else { preview?.(null); if (!moved && ev.type === 'pointerup') onClick?.(); }
  };
  el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
}

export function StageCanvas({ rect, timeline, stage, actions }: { rect: Rect; timeline: Timeline; stage: React.RefObject<HTMLDivElement | null>; actions: Actions }) {
  const ed = useEditor();
  const { primary, items } = useSelection(ed.sel);
  const now = usePlayhead();
  const [guides, setGuides] = useState<Guides>({ v: [], h: [] });
  const [editing, setEditing] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);
  // 外框取自 Player 渲染结果（自动高度、是否在画面上）：时间线变化或暂停时定位后，等 Player 画完这一帧再量一次
  const playing = usePlaying();
  const [, remeasure] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    if (playing) return;
    let r = requestAnimationFrame(() => { r = requestAnimationFrame(remeasure); });
    return () => cancelAnimationFrame(r);
  }, [timeline, now, playing]);
  const stageEl = stage.current;
  const W = timeline.meta.width;
  const sc = rect.width / W;
  const clearGuides = () => setGuides((g) => (g.v.length || g.h.length ? { v: [], h: [] } : g));
  const preview = (ops: Op[] | null) => { if (!ops) clearGuides(); ed.store.preview(ops); };
  const commit = (label: string) => (ops: Op[]) => { clearGuides(); ed.store.dispatch(ops, { label }); };
  const overlayOf = (id: string) => timeline.overlays.find((o) => o.id === id);
  const selOverlays = items.filter((s) => s.kind === 'overlay').map((s) => overlayOf(s.id)).filter((o): o is Overlay => Boolean(o));

  // ---------- 移动 ----------
  function moveElements(e: React.PointerEvent, ids: string[], primaryId: string, onClick?: () => void) {
    ed.clock.pause();
    const els = ids.map(overlayOf).filter((o): o is Overlay => Boolean(o));
    const geos = new Map(els.map((o) => [o.id, measure(o, timeline, rect, stageEl)]));
    const base = new Map(els.map((o) => [o.id, { x: o.x ?? 0.5, y: o.y ?? (geos.get(o.id)!.cy - rect.top) / rect.height }]));
    const pg = geos.get(primaryId) ?? [...geos.values()][0];
    if (!pg) return;
    const c = Math.abs(Math.cos(rad(pg.rot))), s = Math.abs(Math.sin(rad(pg.rot)));
    const aw = pg.w * c + pg.h * s, ah = pg.w * s + pg.h * c;
    const targets = snapTargets(stageEl, rect, new Set(ids));
    drag(e, (ev, dx, dy) => {
      if (ev.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
      const g: Guides = { v: [], h: [] };
      if (!ev.altKey) {
        const sx = snap1([pg.cx - aw / 2 + dx, pg.cx + dx, pg.cx + aw / 2 + dx], targets.v);
        if (sx) { dx += sx.off; g.v.push(sx.at); }
        const sy = snap1([pg.cy - ah / 2 + dy, pg.cy + dy, pg.cy + ah / 2 + dy], targets.h);
        if (sy) { dy += sy.off; g.h.push(sy.at); }
      }
      setGuides(g);
      return els.map((o) => { const b = base.get(o.id)!; return { op: 'updateOverlay', id: o.id, patch: { x: r4(b.x + dx / rect.width), y: r4(b.y + dy / rect.height) } }; });
    }, commit(els.length > 1 ? '移动 ' + els.length + ' 个元素' : '移动元素'), () => { clearGuides(); onClick?.(); }, preview);
  }

  // ---------- 缩放（在元素自身坐标系里算，支持旋转后的元素） ----------
  function resize(e: React.PointerEvent, o: Overlay, handle: Handle) {
    ed.clock.pause();
    const g = measure(o, timeline, rect, stageEl);
    const th = rad(g.rot), cos = Math.cos(th), sin = Math.sin(th);
    const sx = handle.includes('e') ? 1 : handle.includes('w') ? -1 : 0;
    const sy = handle.includes('s') ? 1 : handle.includes('n') ? -1 : 0;
    const corner = sx !== 0 && sy !== 0;
    const textAuto = g.autoH && !isBoxElement(o);
    drag(e, (ev, dx, dy) => {
      const ldx = dx * cos + dy * sin, ldy = -dx * sin + dy * cos;
      let nw = sx ? Math.max(8, g.w + sx * ldx) : g.w;
      let nh = sy ? Math.max(4, g.h + sy * ldy) : g.h;
      // 角点：图片/图标/自动高度文字默认等比，Shift 反转
      if (corner && ((o.kind === 'image' || o.kind === 'icon' || textAuto) !== ev.shiftKey)) {
        const fx = nw / g.w, fy = nh / g.h;
        const f = Math.abs(fx - 1) > Math.abs(fy - 1) ? fx : fy;
        nw = g.w * f; nh = g.h * f;
      }
      const lx = ev.altKey ? 0 : (sx * (nw - g.w)) / 2, ly = ev.altKey ? 0 : (sy * (nh - g.h)) / 2;
      const cx = g.cx + lx * cos - ly * sin, cy = g.cy + lx * sin + ly * cos;
      const patch: Record<string, unknown> = { x: r4((cx - rect.left) / rect.width), y: r4((cy - rect.top) / rect.height), w: r4(nw / rect.width) };
      if (textAuto && corner) patch.fontSize = Math.max(4, Math.round((o.fontSize * nw) / g.w));
      else if (!g.autoH || sy) patch.h = r4(nh / rect.height);
      if (!g.box) patch.align = o.align ?? 'center'; // 旧版字幕第一次拖宽：转成文本框，保持原对齐
      return [{ op: 'updateOverlay', id: o.id, patch }];
    }, commit(textAuto && corner ? '缩放文字' : '调整大小'), undefined, preview);
  }

  // ---------- 旋转 ----------
  function rotate(e: React.PointerEvent, o: Overlay) {
    ed.clock.pause();
    const g = measure(o, timeline, rect, stageEl);
    const s = stageEl?.getBoundingClientRect();
    if (!s) return;
    drag(e, (ev) => {
      let a = (Math.atan2(ev.clientY - (s.top + g.cy), ev.clientX - (s.left + g.cx)) * 180) / Math.PI + 90;
      if (ev.shiftKey) a = Math.round(a / 15) * 15;
      a = ((a % 360) + 540) % 360 - 180;
      for (const k of [-180, -90, 0, 90, 180]) if (Math.abs(a - k) < 3) a = k;
      if (a === -180) a = 180;
      return [{ op: 'updateOverlay', id: o.id, patch: { rotate: Math.round(a * 10) / 10 } }];
    }, commit('旋转'), undefined, preview);
  }

  // ---------- 画中画（拖动/角点缩放） ----------
  function clipDrag(e: React.PointerEvent, id: string, handle: string | null) {
    const loc = locateClip(timeline, id);
    if (!loc || loc.kind !== 'video' || loc.trackIndex === 0) return;
    ed.clock.pause();
    const box = clipBox(loc.clip);
    const snapBox = (v: number, size: number, out: number[]) => {
      for (const g of [0, 0.5, 1]) for (const [edge, off] of [[v, 0], [v + size / 2, size / 2], [v + size, size]] as const) {
        if (Math.abs(edge - g) < SNAP_PX / rect.width) { out.push(g); return g - off; }
      }
      return v;
    };
    drag(e, (ev, dx0, dy0) => {
      const dx = dx0 / rect.width, dy = dy0 / rect.height;
      const g = { v: [] as number[], h: [] as number[] };
      let b = { ...box };
      if (!handle) {
        b.x = snapBox(Math.min(1 - b.w, Math.max(0, box.x + dx)), b.w, g.v);
        b.y = snapBox(Math.min(1 - b.h, Math.max(0, box.y + dy)), b.h, g.h);
      } else {
        const ratio = box.w / box.h;
        const w = Math.min(1, Math.max(0.05, box.w + (handle.includes('e') ? dx : -dx)));
        const h = Math.min(1, Math.max(0.05, ev.shiftKey ? box.h + (handle.includes('s') ? dy : -dy) : w / ratio));
        b = { w, h, x: handle.includes('w') ? box.x + box.w - w : box.x, y: handle.includes('n') ? box.y + box.h - h : box.y };
        b.x = Math.max(0, Math.min(1 - b.w, b.x)); b.y = Math.max(0, Math.min(1 - b.h, b.y));
      }
      setGuides({ v: g.v.map((x) => rect.left + x * rect.width), h: g.h.map((y) => rect.top + y * rect.height) });
      return [{ op: 'updateClip', id, patch: { box: b } }];
    }, commit(handle ? '缩放画中画' : '移动画中画'), clearGuides, preview);
  }

  // ---------- 点选 ----------
  const onPick = (e: React.PointerEvent) => {
    if (e.button !== 0 || e.detail > 1) return;
    setMenu(null);
    const hits = hitsAt(stageEl, e.clientX, e.clientY);
    const top = hits[0];
    const additive = e.shiftKey || e.ctrlKey || e.metaKey;
    if (!top) { if (!additive) ed.sel.clear(); return; }
    if (top.kind === 'clip') { ed.sel.select(top, additive ? 'toggle' : 'replace'); if (!additive) clipDrag(e, top.id, null); return; }
    const wasSelected = items.some((s) => s.id === top.id);
    if (additive) { ed.sel.select(top, 'toggle'); return; }
    if (!wasSelected) {
      ed.sel.select(top);
      moveElements(e, [top.id], top.id);
      return;
    }
    // 已选中：一起拖动所有选中元素；没拖动就单选它（从整页里点进某个元素）
    const ids = selOverlays.map((o) => o.id);
    moveElements(e, ids, top.id, () => { if (ids.length > 1) ed.sel.select(top); });
  };

  const onDouble = (e: React.MouseEvent) => {
    const top = hitsAt(stageEl, e.clientX, e.clientY).find((s) => s.kind === 'overlay');
    const o = top && overlayOf(top.id);
    if (!o) return;
    ed.sel.select({ kind: 'overlay', id: o.id });
    if (editable(o)) { ed.clock.pause(); setEditing(o.id); }
  };

  const onMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const hits = hitsAt(stageEl, e.clientX, e.clientY).filter((s) => s.kind === 'overlay');
    if (hits.length && !items.some((s) => s.id === hits[0].id)) ed.sel.select(hits[0]);
    const cur = items.length === 1 && items[0].kind === 'overlay' && hits.some((h) => h.id === items[0].id) ? overlayOf(items[0].id) : hits[0] ? overlayOf(hits[0].id) : undefined;
    const list: MenuItem[] = hits.slice(0, 8).map((h) => {
      const o = overlayOf(h.id)!;
      return { label: '选择' + (KIND_NAME[o.kind ?? 'subtitle'] ?? '元素') + '「' + elementLabel(o).slice(0, 14) + '」', icon: o.kind === 'image' ? 'image' : o.kind === 'chart' ? 'chart' : o.kind === 'icon' ? 'star' : o.kind === 'shape' ? 'shapes' : 'text', run: () => ed.sel.select(h) };
    });
    if (cur) {
      list.push({ separator: true, label: '' },
        { label: '置于顶层', icon: 'front', run: () => actions.arrange(cur.id, 'front') },
        { label: '上移一层', run: () => actions.arrange(cur.id, 'forward') },
        { label: '下移一层', run: () => actions.arrange(cur.id, 'backward') },
        { label: '置于底层', icon: 'back', run: () => actions.arrange(cur.id, 'back') });
      if (cur.group) list.push({ separator: true, label: '' }, { label: '选中整页幻灯片', icon: 'slides', run: () => actions.selectGroup(cur.group!) });
      if (editable(cur)) list.push({ label: '编辑文字', icon: 'text', run: () => setEditing(cur.id) });
      list.push({ separator: true, label: '' },
        { label: '创建副本', icon: 'duplicate', kbd: 'Ctrl+D', run: actions.duplicateSelection },
        { label: '交给 AI', icon: 'sparkle', disabled: !ed.host.insertIntoChat, run: () => { actions.askAi(); } },
        { label: '删除', icon: 'trash', kbd: 'Del', danger: true, run: actions.deleteSelection });
    }
    if (!list.length) return;
    setMenu({ x: e.clientX, y: e.clientY, items: list });
  };

  // ---------- 渲染 ----------
  const single = items.length === 1 ? primary : null;
  const sel1 = single?.kind === 'overlay' ? overlayOf(single.id) : undefined;
  const clipLoc = single?.kind === 'clip' ? locateClip(timeline, single.id) : undefined;
  const pip = clipLoc && clipLoc.kind === 'video' && clipLoc.trackIndex > 0 ? clipLoc : undefined;
  const editO = editing ? overlayOf(editing) : undefined;

  const gizmoFor = (o: Overlay, handles: boolean) => {
    const g = measure(o, timeline, rect, stageEl);
    const active = now >= o.startSeconds && now < o.endSeconds;
    const line = isLine(o);
    const hs: readonly Handle[] = !handles ? [] : line ? ['e', 'w'] : g.autoH ? ['nw', 'ne', 'e', 'se', 'sw', 'w'] : HANDLES;
    return (
      <div key={o.id} className={'dj-gizmo dj-el-gizmo' + (g.box ? '' : ' dj-text-gizmo') + (handles ? '' : ' dj-multi')}
        style={{ left: g.cx - g.w / 2, top: g.cy - g.h / 2, width: g.w, height: g.h, transform: g.rot ? 'rotate(' + g.rot + 'deg)' : undefined, opacity: active ? 1 : 0.45, pointerEvents: handles && !g.live ? 'auto' : 'none' }}
        onPointerDown={(e) => {
          // 只有“选中的元素此刻不在画面上”时外框本身可拖；没拖动就当作点选画面上的元素
          const { clientX, clientY } = e;
          moveElements(e, selOverlays.map((x) => x.id), o.id, () => { const t = hitsAt(stageEl, clientX, clientY)[0]; if (t && t.id !== o.id) ed.sel.select(t); });
        }} onDoubleClick={() => { if (editable(o)) setEditing(o.id); }}>
        {hs.map((h) => <b key={h} data-h={h} onPointerDown={(e) => resize(e, o, h)} />)}
        {handles && g.box && <i className="dj-rot" title="拖动旋转（Shift 按 15°）" onPointerDown={(e) => rotate(e, o)} />}
      </div>
    );
  };

  let editor: React.ReactNode = null;
  if (editO) {
    const g = measure(editO, timeline, rect, stageEl);
    const box = isBoxElement(editO) || editO.w !== undefined;
    const multiline = editO.kind === 'text' || editO.kind === 'shape';
    let cancelled = false;
    editor = (
      <textarea className="dj-textedit" autoFocus defaultValue={editO.text}
        style={{ left: g.cx - Math.max(80, g.w) / 2, top: g.cy - Math.max(32, g.h + 8) / 2, width: Math.max(80, g.w), height: Math.max(32, g.h + 8), transform: g.rot ? 'rotate(' + g.rot + 'deg)' : undefined,
          fontSize: Math.max(11, editO.fontSize * sc), lineHeight: editO.lineHeight ?? 1.3, textAlign: editO.align ?? (box && editO.kind !== 'shape' ? 'left' : 'center') }}
        onFocus={(e) => e.currentTarget.select()}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Escape') { cancelled = true; e.currentTarget.blur(); }
          if (e.key === 'Enter' && !e.nativeEvent.isComposing && (e.ctrlKey || e.metaKey || (!multiline && !e.shiftKey))) { e.preventDefault(); e.currentTarget.blur(); }
        }}
        onBlur={(e) => { const v = e.currentTarget.value; const root = e.currentTarget.closest<HTMLElement>('.dj-root'); setEditing(null); requestAnimationFrame(() => { if (!document.activeElement || document.activeElement === document.body) root?.focus({ preventScroll: true }); }); if (!cancelled && v !== editO.text) ed.store.dispatch([{ op: 'updateOverlay', id: editO.id, patch: { text: v } }], { label: '修改文字' }); }} />
    );
  }

  return (
    <div className="dj-canvas" style={{ inset: 0 }}>
      <div className="dj-picker" style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
        onPointerDown={onPick} onDoubleClick={onDouble} onContextMenu={onMenu} />
      {pip && (() => {
        const box = clipBox(pip.clip);
        const active = now >= pip.start && now < pip.start + pip.duration;
        return (
          <div className="dj-gizmo" style={{ left: rect.left + box.x * rect.width, top: rect.top + box.y * rect.height, width: box.w * rect.width, height: box.h * rect.height, opacity: active ? 1 : 0.45, pointerEvents: active ? 'none' : 'auto' }}
            onPointerDown={(e) => clipDrag(e, pip.clip.id, null)} title="拖动移动，拖角缩放（Shift 自由比例）">
            {(['nw', 'ne', 'sw', 'se'] as const).map((h) => <b key={h} data-h={h} onPointerDown={(e) => clipDrag(e, pip.clip.id, h)} />)}
          </div>
        );
      })()}
      {sel1 && !editing && gizmoFor(sel1, true)}
      {items.length > 1 && selOverlays.map((o) => gizmoFor(o, false))}
      {editor}
      {guides.v.map((g, i) => <div key={'v' + i} className="dj-guide dj-v" style={{ left: g, top: rect.top, bottom: 'auto', height: rect.height }} />)}
      {guides.h.map((g, i) => <div key={'h' + i} className="dj-guide dj-h" style={{ top: g, left: rect.left, right: 'auto', width: rect.width }} />)}
      {menu && <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} />}
    </div>
  );
}
