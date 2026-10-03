// 时间线版面：把时间线 JSON 排成泳道与片段块（文字在上、画中画按层级、主轨、音频在下）
import type { AudioClip, Clip, Overlay, Timeline } from '../../../../engine/src/schema';
import { mainTrackStarts, srcLabel, timelineDurationInFrames } from '../../../../engine/src/timeline';
import { overlappingRows } from '../geometry';

export type LaneKind = 'text' | 'pip' | 'main' | 'audio';
export type Focus = 'all' | LaneKind;
export interface Lane { key: string; kind: LaneKind; trackId?: string; textTrack?: number; label: string; top: number; height: number; rowHeight: number; rows: number; locked?: boolean; muted?: boolean; hidden?: boolean; collapsed?: boolean; role?: string }
export interface Block { id: string; kind: LaneKind; laneKey: string; row: number; start: number; duration: number; label: string; clip?: Clip; audio?: AudioClip; overlay?: Overlay; index?: number }
export interface Layout { lanes: Lane[]; blocks: Block[]; total: number; height: number }

const H = { main: 60, pip: 44, audio: 44, text: 28, collapsed: 12 };

export function computeLayout(t: Timeline, focus: Focus, compact: boolean): Layout {
  const lanes: Lane[] = [];
  const blocks: Block[] = [];
  let top = 0;
  const scale = compact ? 0.82 : 1;
  const addLane = (lane: Omit<Lane, 'top' | 'height' | 'rowHeight'>, base: number) => {
    const collapsed = focus !== 'all' && focus !== lane.kind;
    const rowHeight = collapsed ? 0 : Math.round(base * scale);
    const height = collapsed ? H.collapsed : Math.max(1, lane.rows) * rowHeight;
    const full = { ...lane, top, height, rowHeight, collapsed };
    lanes.push(full);
    top += height;
    return full;
  };

  // 文字：按 track 分组，组内重叠的再分行
  const textTracks = new Map<number, Overlay[]>();
  for (const o of t.overlays) {
    const k = o.track ?? 0;
    if (!textTracks.has(k)) textTracks.set(k, []);
    textTracks.get(k)!.push(o);
  }
  const textKeys = [...textTracks.keys()].sort((a, b) => b - a);
  if (!textKeys.length) textKeys.push(0);
  for (const k of textKeys) {
    const items = textTracks.get(k) ?? [];
    const rows = overlappingRows(items, (o) => ({ at: o.startSeconds, duration: o.endSeconds - o.startSeconds }));
    const lane = addLane({ key: 'text:' + k, kind: 'text', textTrack: k, label: textKeys.length > 1 ? '文字 ' + (k + 1) : '文字', rows: Math.max(1, rows.length) }, H.text);
    rows.forEach((row, r) => row.forEach((o) => blocks.push({ id: o.id, kind: 'text', laneKey: lane.key, row: r, start: o.startSeconds, duration: o.endSeconds - o.startSeconds, label: o.text || '（空）', overlay: o })));
  }
  // 画中画：上层在上
  const pipTracks = t.videoTracks.slice(1).map((tr, i) => ({ tr, layer: i + 2 })).reverse();
  for (const { tr, layer } of pipTracks) {
    const rows = overlappingRows(tr.clips, (c) => ({ at: c.atSeconds ?? 0, duration: c.clipDuration }));
    const lane = addLane({ key: 'track:' + tr.id, kind: 'pip', trackId: tr.id, label: tr.name ?? '画中画 ' + layer, rows: Math.max(1, rows.length), locked: tr.locked, hidden: tr.hidden, muted: tr.muted }, H.pip);
    rows.forEach((row, r) => row.forEach((c) => blocks.push({ id: c.id, kind: 'pip', laneKey: lane.key, row: r, start: c.atSeconds ?? 0, duration: c.clipDuration, label: srcLabel(c.src), clip: c })));
  }
  const main = t.videoTracks[0];
  const mainLane = addLane({ key: 'track:' + main.id, kind: 'main', trackId: main.id, label: '主轨', rows: 1, locked: main.locked, hidden: main.hidden, muted: main.muted }, H.main);
  const starts = mainTrackStarts(t);
  main.clips.forEach((c, index) => blocks.push({ id: c.id, kind: 'main', laneKey: mainLane.key, row: 0, start: starts.get(c.id) ?? 0, duration: c.clipDuration, label: srcLabel(c.src), clip: c, index }));
  for (const tr of t.audioTracks) {
    const rows = overlappingRows(tr.clips, (c) => ({ at: c.atSeconds, duration: c.duration }));
    const lane = addLane({ key: 'track:' + tr.id, kind: 'audio', trackId: tr.id, label: tr.name ?? '音频', rows: Math.max(1, rows.length), locked: tr.locked, muted: tr.muted, role: tr.role }, H.audio);
    rows.forEach((row, r) => row.forEach((c) => blocks.push({ id: c.id, kind: 'audio', laneKey: lane.key, row: r, start: c.atSeconds, duration: c.duration, label: srcLabel(c.src), audio: c })));
  }
  if (!t.audioTracks.length) addLane({ key: 'audio:new', kind: 'audio', label: '音频', rows: 1 }, H.audio);
  return { lanes, blocks, total: timelineDurationInFrames(t) / t.meta.fps, height: top };
}

/** 吸附点：0、播放头、其他片段首尾、标记 */
export function snapPoints(t: Timeline, layout: Layout, exclude: Set<string>, playhead: number) {
  const pts = [0, playhead];
  for (const b of layout.blocks) if (!exclude.has(b.id)) pts.push(b.start, b.start + b.duration);
  for (const m of t.markers ?? []) pts.push(m.t);
  return pts;
}

export function snap(value: number, points: number[], thresholdSec: number): { value: number; at: number | null } {
  let best: number | null = null;
  let dist = thresholdSec;
  for (const p of points) {
    const d = Math.abs(p - value);
    if (d < dist) { dist = d; best = p; }
  }
  return best === null ? { value, at: null } : { value: best, at: best };
}
