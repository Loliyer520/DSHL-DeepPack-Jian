// 时间线差异 → 系统操作（putX/removeX）。用途：
//  1. 撤销：diffTimelines(变更后, 变更前) 只触及该次变更涉及的实体，叠加在最新状态上（不吞掉 AI 期间的其它修改）
//  2. 历史恢复 / 整份替换：把整体替换翻译成实体级事件，事件流与回放保持一致
import type { AudioTrack, Marker, Overlay, Timeline, VideoTrack } from "./schema.js";
import type { Op } from "./ops.js";

/** 键序无关的稳定序列化（比较用） */
export function stableStringify(v: unknown): string {
  if (Array.isArray(v)) return "[" + v.map(stableStringify).join(",") + "]";
  if (v && typeof v === "object") {
    const keys = Object.keys(v as Record<string, unknown>).filter((k) => (v as Record<string, unknown>)[k] !== undefined).sort();
    return "{" + keys.map((k) => JSON.stringify(k) + ":" + stableStringify((v as Record<string, unknown>)[k])).join(",") + "}";
  }
  return JSON.stringify(v);
}
const same = (a: unknown, b: unknown) => stableStringify(a) === stableStringify(b);

type ClipEntry = { clip: Record<string, unknown>; trackId: string; index: number; kind: "video" | "audio" };
function clipMap(t: Timeline): Map<string, ClipEntry> {
  const m = new Map<string, ClipEntry>();
  t.videoTracks.forEach((tr) => tr.clips.forEach((c, index) => m.set(c.id, { clip: c as unknown as Record<string, unknown>, trackId: tr.id, index, kind: "video" })));
  t.audioTracks.forEach((tr) => tr.clips.forEach((c, index) => m.set(c.id, { clip: c as unknown as Record<string, unknown>, trackId: tr.id, index, kind: "audio" })));
  return m;
}
const trackProps = (tr: VideoTrack | AudioTrack) => {
  const { clips: _clips, ...rest } = tr as VideoTrack & { clips: unknown };
  return rest;
};

/** 生成把 a 变成 b 的系统操作序列（applyOps(a, diff, {actor:"system"}) ≡ b） */
export function diffTimelines(a: Timeline, b: Timeline): Op[] {
  const ops: Op[] = [];
  if (!same(a.meta, b.meta)) ops.push({ op: "putMeta", meta: b.meta });

  // 1) 轨道：新增/属性变化/位置变化 → putTrack（不带片段，片段单独 putClip）
  for (const kind of ["video", "audio"] as const) {
    const aList = (kind === "video" ? a.videoTracks : a.audioTracks) as (VideoTrack | AudioTrack)[];
    const bList = (kind === "video" ? b.videoTracks : b.audioTracks) as (VideoTrack | AudioTrack)[];
    const aIndex = new Map(aList.map((tr, i) => [tr.id, { tr, i }]));
    bList.forEach((tr, i) => {
      const prev = aIndex.get(tr.id);
      if (!prev || prev.i !== i || !same(trackProps(prev.tr), trackProps(tr))) {
        ops.push({ op: "putTrack", kind, track: { ...trackProps(tr), clips: [] }, index: i });
      }
    });
  }

  // 2) 片段：删除先行，再按目标轨道顺序写回
  const aClips = clipMap(a);
  const bClips = clipMap(b);
  for (const [id] of aClips) if (!bClips.has(id)) ops.push({ op: "removeClip", id });
  const puts: Op[] = [];
  for (const tr of [...b.videoTracks, ...b.audioTracks]) {
    tr.clips.forEach((c, index) => {
      const prev = aClips.get(c.id);
      if (!prev || prev.trackId !== tr.id || prev.index !== index || !same(prev.clip, c)) {
        puts.push({ op: "putClip", clip: c, trackId: tr.id, index });
      }
    });
  }
  ops.push(...puts);

  // 3) 文字层
  const aOv = new Map(a.overlays.map((o, i) => [o.id, { o, i }]));
  const bOvIds = new Set(b.overlays.map((o) => o.id));
  for (const o of a.overlays) if (!bOvIds.has(o.id)) ops.push({ op: "removeOverlay", id: o.id });
  b.overlays.forEach((o: Overlay, i) => {
    const prev = aOv.get(o.id);
    if (!prev || prev.i !== i || !same(prev.o, o)) ops.push({ op: "putOverlay", overlay: o, index: i });
  });

  // 4) 标记
  const aMk = new Map((a.markers ?? []).map((m) => [m.id, m]));
  const bMkIds = new Set((b.markers ?? []).map((m) => m.id));
  for (const m of a.markers ?? []) if (!bMkIds.has(m.id)) ops.push({ op: "removeMarker", id: m.id });
  for (const m of (b.markers ?? []) as Marker[]) if (!aMk.has(m.id) || !same(aMk.get(m.id), m)) ops.push({ op: "putMarker", marker: m });

  // 5) 最后删除 b 中不存在的轨道（其片段已在第 2 步删除或迁走）
  for (const kind of ["video", "audio"] as const) {
    const bIds = new Set(((kind === "video" ? b.videoTracks : b.audioTracks) as { id: string }[]).map((tr) => tr.id));
    for (const tr of (kind === "video" ? a.videoTracks : a.audioTracks) as { id: string }[]) {
      if (!bIds.has(tr.id)) ops.push({ op: "removeTrack", id: tr.id });
    }
  }
  return ops;
}

/** 两份时间线在语义上是否一致（忽略键序） */
export const timelinesEqual = (a: Timeline, b: Timeline) => same(a, b);
