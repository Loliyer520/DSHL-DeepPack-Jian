// 编辑命令：键盘、右键菜单、按钮共用；每条命令生成一批 ops 并带人类可读的 label
import type { Clip, Overlay, Timeline } from '../../../engine/src/schema';
import { locateClip, mainTrackStarts, srcLabel } from '../../../engine/src/timeline';
import { splitOffset } from '../../../engine/src/ops';
import type { Editor } from './context';
import type { Op, AssetInfo } from './engine';
import type { Selected } from './selection';

const frame = (t: Timeline) => 1 / t.meta.fps;
const snapT = (t: Timeline, s: number) => Math.round(s * t.meta.fps) / t.meta.fps;

export function itemsAtTime(t: Timeline, at: number, kinds: Selected['kind'][] = ['clip', 'overlay']): Selected[] {
  const out: Selected[] = [];
  const starts = mainTrackStarts(t);
  t.videoTracks.forEach((tr, i) => tr.clips.forEach((c) => {
    const s = i === 0 ? starts.get(c.id) ?? 0 : c.atSeconds ?? 0;
    if (at > s && at < s + c.clipDuration) out.push({ kind: 'clip', id: c.id });
  }));
  t.audioTracks.forEach((tr) => tr.clips.forEach((c) => { if (at > c.atSeconds && at < c.atSeconds + c.duration) out.push({ kind: 'clip', id: c.id }); }));
  if (kinds.includes('overlay')) t.overlays.forEach((o) => { if (at > o.startSeconds && at < o.endSeconds) out.push({ kind: 'overlay', id: o.id }); });
  return out.filter((x) => kinds.includes(x.kind));
}

export function editPoints(t: Timeline): number[] {
  const pts = new Set<number>([0]);
  const starts = mainTrackStarts(t);
  t.videoTracks.forEach((tr, i) => tr.clips.forEach((c) => {
    const s = i === 0 ? starts.get(c.id) ?? 0 : c.atSeconds ?? 0;
    pts.add(s); pts.add(s + c.clipDuration);
  }));
  t.audioTracks.forEach((tr) => tr.clips.forEach((c) => { pts.add(c.atSeconds); pts.add(c.atSeconds + c.duration); }));
  t.overlays.forEach((o) => { pts.add(o.startSeconds); pts.add(o.endSeconds); });
  (t.markers ?? []).forEach((m) => pts.add(m.t));
  return [...pts].map((p) => snapT(t, p)).sort((a, b) => a - b);
}

let clipboard: { clips: { clip: Record<string, unknown>; kind: 'main' | 'pip' | 'audio'; offset: number }[]; overlays: { overlay: Overlay; offset: number }[] } | null = null;

export function createActions(ed: Editor) {
  const t = () => ed.store.current;
  const sel = () => ed.sel.getSnapshot().items;
  const now = () => ed.clock.time();
  const run = (ops: Op[], label: string) => (ops.length ? ed.store.dispatch(ops, { label }) : []);

  return {
    splitAtPlayhead() {
      const tl = t(); if (!tl) return;
      const at = snapT(tl, now());
      const targets = sel().length ? sel().filter((s) => s.kind === 'clip' || s.kind === 'overlay') : itemsAtTime(tl, at).filter((s) => {
        const loc = s.kind === 'clip' ? locateClip(tl, s.id) : null;
        return s.kind === 'clip' ? loc?.kind === 'video' && loc.trackIndex === 0 : false;
      });
      const ops: Op[] = [];
      for (const s of targets) {
        if (s.kind === 'clip') {
          const loc = locateClip(tl, s.id);
          if (loc && splitOffset(loc.start, loc.duration, at, tl.meta.fps) !== null) ops.push({ op: 'splitClip', id: s.id, atSeconds: at });
        } else {
          const o = tl.overlays.find((x) => x.id === s.id);
          if (o && splitOffset(o.startSeconds, o.endSeconds - o.startSeconds, at, tl.meta.fps) !== null) ops.push({ op: 'splitOverlay', id: s.id, atSeconds: at });
        }
      }
      if (!ops.length) { ed.store.toast('info', '把播放头移到片段内部再分割'); return; }
      run(ops, '分割 ' + ops.length + ' 个片段');
    },
    deleteSelection() {
      const items = sel(); if (!items.length) return;
      const ops: Op[] = items.map((s) => (s.kind === 'clip' ? { op: 'removeClip', id: s.id } : s.kind === 'overlay' ? { op: 'removeOverlay', id: s.id } : s.kind === 'marker' ? { op: 'removeMarker', id: s.id } : { op: 'removeTrack', id: s.id }));
      run(ops, '删除 ' + items.length + ' 项');
      ed.sel.clear();
    },
    duplicateSelection() {
      const items = sel().filter((s) => s.kind === 'clip' || s.kind === 'overlay');
      run(items.map((s) => ({ op: 'duplicateClip', id: s.id })), '复制 ' + items.length + ' 项');
    },
    copy() {
      const tl = t(); if (!tl) return;
      const items = sel();
      const starts = items.map((s) => (s.kind === 'clip' ? locateClip(tl, s.id)?.start : tl.overlays.find((o) => o.id === s.id)?.startSeconds)).filter((v): v is number => v !== undefined);
      const base = starts.length ? Math.min(...starts) : 0;
      clipboard = { clips: [], overlays: [] };
      for (const s of items) {
        if (s.kind === 'clip') {
          const loc = locateClip(tl, s.id);
          if (!loc) continue;
          clipboard.clips.push({ clip: structuredClone(loc.clip) as unknown as Record<string, unknown>, kind: loc.kind === 'audio' ? 'audio' : loc.trackIndex === 0 ? 'main' : 'pip', offset: loc.start - base });
        } else if (s.kind === 'overlay') {
          const o = tl.overlays.find((x) => x.id === s.id);
          if (o) clipboard.overlays.push({ overlay: structuredClone(o), offset: o.startSeconds - base });
        }
      }
      if (clipboard.clips.length + clipboard.overlays.length) ed.store.toast('info', '已复制 ' + (clipboard.clips.length + clipboard.overlays.length) + ' 项');
    },
    paste() {
      const tl = t(); if (!tl || !clipboard) return;
      const at = snapT(tl, now());
      const ops: Op[] = [];
      for (const { clip, kind, offset } of clipboard.clips) {
        const { id: _id, atSeconds: _a, ...rest } = clip as { id: string; atSeconds?: number };
        if (kind === 'audio') ops.push({ op: 'addAudio', ...rest, atSeconds: at + offset });
        else if (kind === 'pip') ops.push({ op: 'addClip', ...rest, track: 'pip', atSeconds: at + offset });
        else ops.push({ op: 'addClip', ...rest, atSeconds: at + offset });
      }
      for (const { overlay, offset } of clipboard.overlays) {
        const { id: _id, ...rest } = overlay;
        const len = overlay.endSeconds - overlay.startSeconds;
        ops.push({ op: 'addOverlay', ...rest, startSeconds: at + offset, endSeconds: at + offset + len });
      }
      run(ops, '粘贴 ' + ops.length + ' 项');
    },
    nudge(seconds: number) {
      const tl = t(); if (!tl) return;
      const ops: Op[] = [];
      for (const s of sel()) {
        if (s.kind === 'clip') {
          const loc = locateClip(tl, s.id);
          if (!loc) continue;
          if (loc.kind === 'video' && loc.trackIndex === 0) ops.push({ op: 'moveClip', id: s.id, index: Math.max(0, loc.index + Math.sign(seconds)) });
          else ops.push({ op: 'moveClip', id: s.id, atSeconds: Math.max(0, loc.start + seconds) });
        } else if (s.kind === 'overlay') {
          const o = tl.overlays.find((x) => x.id === s.id);
          if (o) ops.push({ op: 'updateOverlay', id: s.id, patch: { startSeconds: Math.max(0, o.startSeconds + seconds), endSeconds: Math.max(frame(tl), o.endSeconds + seconds) } });
        }
      }
      run(ops, '微移');
    },
    /** 把选中片段的头/尾裁到播放头（剪映 Q/W） */
    trimToPlayhead(side: 'start' | 'end') {
      const tl = t(); if (!tl) return;
      const at = snapT(tl, now());
      const ops: Op[] = [];
      for (const s of sel().length ? sel() : itemsAtTime(tl, at)) {
        if (s.kind === 'clip') {
          const loc = locateClip(tl, s.id);
          if (!loc) continue;
          const off = splitOffset(loc.start, loc.duration, at, tl.meta.fps);
          if (off === null) continue;
          const speed = loc.clip.speed ?? 1;
          if (loc.kind === 'video') {
            ops.push({ op: 'updateClip', id: s.id, patch: side === 'end' ? { clipDuration: off } : { clipDuration: loc.duration - off, inPoint: loc.clip.inPoint + off * speed, ...(loc.trackIndex > 0 ? { atSeconds: loc.start + off } : {}) } });
          } else {
            ops.push({ op: 'updateClip', id: s.id, patch: side === 'end' ? { duration: off } : { duration: loc.duration - off, inPoint: loc.clip.inPoint + off * speed, atSeconds: loc.start + off } });
          }
        } else if (s.kind === 'overlay') {
          const o = tl.overlays.find((x) => x.id === s.id);
          if (o && at > o.startSeconds && at < o.endSeconds) ops.push({ op: 'updateOverlay', id: s.id, patch: side === 'end' ? { endSeconds: at } : { startSeconds: at } });
        }
      }
      run(ops, side === 'end' ? '裁掉播放头之后' : '裁掉播放头之前');
    },
    addMarker() {
      const tl = t(); if (!tl) return;
      const r = run([{ op: 'addMarker', t: snapT(tl, now()) }], '添加标记');
      const id = r[0]?.id;
      if (id) ed.sel.select({ kind: 'marker', id });
    },
    addText(kind: 'subtitle' | 'title' = 'subtitle') {
      const tl = t(); if (!tl) return;
      const at = snapT(tl, now());
      const op: Op = kind === 'title'
        ? { op: 'addOverlay', text: '标题', startSeconds: at, endSeconds: at + 3, kind: 'title', x: 0.5, y: 0.35, fontSize: Math.round(tl.meta.height * 0.1), fontFamily: 'sans', fontWeight: 800, animationPreset: 'zoomIn' }
        : { op: 'addOverlay', text: '新字幕', startSeconds: at, endSeconds: at + 2.5, kind: 'subtitle', fontSize: Math.round(tl.meta.height * 0.065), fontFamily: 'sans', fontWeight: 600, stroke: { color: '#000000', width: 3 } };
      const r = run([op], kind === 'title' ? '添加标题' : '添加字幕');
      if (r[0]?.id) ed.sel.select({ kind: 'overlay', id: r[0].id });
    },
    /** 把素材放到时间线：视频/图片→主轨（插到最近剪辑点）或画中画；音频→音频轨 */
    addAsset(asset: Pick<AssetInfo, 'name' | 'type' | 'duration'>, target: 'main' | 'pip' | 'audio' = asset.type === 'audio' ? 'audio' : 'main', at?: number, trackId?: string) {
      const tl = t(); if (!tl) return;
      const time = snapT(tl, at ?? now());
      const dur = asset.type === 'image' ? 3 : asset.duration && asset.duration > 0 ? asset.duration : 3;
      let op: Op;
      if (asset.type === 'audio' || target === 'audio') op = { op: 'addAudio', src: asset.name, atSeconds: time, duration: dur, ...(trackId ? { track: trackId } : {}) };
      else if (target === 'pip') op = { op: 'addClip', src: asset.name, track: trackId ?? 'pip', atSeconds: time, clipDuration: dur, box: { x: 0.62, y: 0.06, w: 0.34, h: 0.34 } };
      else op = { op: 'addClip', src: asset.name, atSeconds: time, clipDuration: dur, ...(asset.type === 'image' ? { animationPreset: 'kenBurns' } : {}) };
      const r = run([op], '添加「' + srcLabel(asset.name) + '」');
      const id = r[0]?.id;
      if (id) ed.sel.select({ kind: 'clip', id });
    },
    setTransition(clipId: string, transition: Clip['transition']) {
      run([{ op: 'updateClip', id: clipId, patch: { transition } }], '设置转场');
    },
    selectAll() {
      const tl = t(); if (!tl) return;
      ed.sel.selectMany([
        ...[...tl.videoTracks, ...tl.audioTracks].flatMap((tr) => tr.clips.map((c) => ({ kind: 'clip' as const, id: c.id }))),
        ...tl.overlays.map((o) => ({ kind: 'overlay' as const, id: o.id })),
      ]);
    },
    jumpEdit(dir: 1 | -1) {
      const tl = t(); if (!tl) return;
      const cur = now();
      const pts = editPoints(tl);
      const next = dir > 0 ? pts.find((p) => p > cur + frame(tl) / 2) : [...pts].reverse().find((p) => p < cur - frame(tl) / 2);
      if (next !== undefined) ed.clock.seek(next);
    },
    keyframeAtPlayhead(target: Selected, channel: string, value: number, remove: boolean, start: number) {
      const tl = t(); if (!tl) return;
      const rel = Math.max(0, snapT(tl, now()) - start);
      run([remove ? { op: 'removeKeyframe', id: target.id, channel, t: rel } : { op: 'setKeyframe', id: target.id, channel, t: rel, v: value }], remove ? '删除关键帧' : '添加关键帧');
    },
    /** “交给 AI”：把选中对象的描述插进聊天输入框（不自动发送） */
    askAi() {
      const tl = t(); if (!tl) return false;
      const parts = sel().slice(0, 8).map((s) => {
        if (s.kind === 'clip') {
          const loc = locateClip(tl, s.id);
          return loc ? s.id + '「' + srcLabel(loc.clip.src) + '」' + loc.start.toFixed(2) + '–' + (loc.start + loc.duration).toFixed(2) + 's' : s.id;
        }
        const o = tl.overlays.find((x) => x.id === s.id);
        return o ? s.id + ' 字幕「' + o.text.slice(0, 20) + '」' : s.id;
      });
      const text = parts.length ? '【选中：' + parts.join('、') + '】' : '【播放头 ' + now().toFixed(2) + 's】';
      return ed.host.insertIntoChat?.(text) ?? false;
    },
  };
}
export type Actions = ReturnType<typeof createActions>;
