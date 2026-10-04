// 操作 → 人类可读的中文事件描述（给模型的编辑事件流、面板活动流、历史标签共用）
import type { Overlay, Timeline } from "./schema.js";
import type { Op, Receipt } from "./ops.js";
import { mainTrackStarts, srcLabel } from "./timeline.js";
import { ANIMATION_PRESETS } from "./presets.js";

const sec = (v: unknown) => (typeof v === "number" ? v.toFixed(2).replace(/\.?0+$/, "") + "s" : "?");
const pct = (v: unknown) => (typeof v === "number" ? Math.round(v * 100) + "%" : "?");
const short = (s: string, n = 14) => (s.length > n ? s.slice(0, n) + "…" : s);
const ovLabel = (o: Overlay | undefined) => (o ? "「" + short(o.text || "空字幕") + "」" : "（已删除的字幕）");

type AnyClip = Record<string, unknown> & { id: string; src: string };
function findAnyClip(t: Timeline, id: unknown): { clip: AnyClip; where: string } | undefined {
  for (const [i, tr] of t.videoTracks.entries()) {
    const c = tr.clips.find((x) => x.id === id);
    if (c) return { clip: c as unknown as AnyClip, where: i === 0 ? "主轨" : tr.name ?? "画中画" };
  }
  for (const tr of t.audioTracks) {
    const c = tr.clips.find((x) => x.id === id);
    if (c) return { clip: c as unknown as AnyClip, where: tr.name ?? "音频轨" };
  }
  return undefined;
}
const clipName = (t: Timeline, id: unknown) => {
  const hit = findAnyClip(t, id);
  return hit ? "「" + srcLabel(hit.clip.src) + "」" : "片段 " + String(id);
};

const FIELD: Record<string, [string, (v: unknown) => string]> = {
  src: ["素材", (v) => srcLabel(String(v))],
  inPoint: ["入点", sec], clipDuration: ["时长", sec], duration: ["时长", sec], atSeconds: ["起点", sec],
  startSeconds: ["开始", sec], endSeconds: ["结束", sec],
  volume: ["音量", pct], opacity: ["不透明度", pct], speed: ["速度", (v) => String(v) + "×"],
  transition: ["转场", (v) => (typeof v === "string" ? (v === "fade" ? "淡入" : v === "none" ? "无" : v) : v && typeof v === "object" ? String((v as { type: string }).type) + " " + sec((v as { duration: number }).duration) : "无")],
  effects: ["动画预设", (v) => (Array.isArray(v) && v.length ? v.map((e) => ANIMATION_PRESETS[(e as { preset: string }).preset]?.label ?? (e as { preset: string }).preset).join("+") : "无")],
  animations: ["关键帧", (v) => (v && typeof v === "object" ? Object.keys(v).join("/") || "无" : "无")],
  filter: ["滤镜", (v) => (v && typeof v === "object" ? Object.entries(v).map(([k, x]) => k + "=" + x).join(",") : "无")],
  box: ["位置大小", (v) => (v && typeof v === "object" ? ["x", "y", "w", "h"].map((k) => pct((v as Record<string, number>)[k])).join("/") : "默认")],
  crop: ["裁切", (v) => (v ? "已裁切" : "无")], text: ["文字", (v) => "「" + short(String(v ?? ""), 20) + "」"],
  fontSize: ["字号", (v) => String(v)], color: ["颜色", (v) => String(v)], fontFamily: ["字体", (v) => String(v ?? "系统")],
  position: ["位置", (v) => ({ top: "顶部", center: "居中", bottom: "底部" } as Record<string, string>)[String(v)] ?? String(v)],
  x: ["横向位置", pct], y: ["纵向位置", pct], muted: ["静音", (v) => (v ? "开" : "关")], flipH: ["水平翻转", (v) => (v ? "开" : "关")],
  flipV: ["垂直翻转", (v) => (v ? "开" : "关")], freeze: ["定格", (v) => (v ? "开" : "关")], fadeIn: ["淡入", sec], fadeOut: ["淡出", sec],
  blendMode: ["混合", (v) => String(v ?? "正常")], stroke: ["描边", (v) => (v ? "有" : "无")], background: ["底框", (v) => (v ? "有" : "无")],
};

/** 实体字段级对比：「时长 3s→2.4s，速度 1×→2×」 */
export function fieldChanges(before: Record<string, unknown> | undefined, after: Record<string, unknown> | undefined): string[] {
  if (!before || !after) return [];
  const out: string[] = [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const k of keys) {
    if (k === "id" || k === "type") continue;
    const a = before[k], b = after[k];
    if (JSON.stringify(a) === JSON.stringify(b)) continue;
    const [label, fmt] = FIELD[k] ?? [k, (v: unknown) => JSON.stringify(v) ?? "无"];
    out.push(label + " " + (a === undefined ? "无" : fmt(a)) + "→" + (b === undefined ? "无" : fmt(b)));
  }
  return out;
}

/** 单条已生效操作的一句话描述；before/after 是整批应用前后的时间线 */
export function describeOp(op: Op, receipt: Receipt | undefined, before: Timeline, after: Timeline): string | undefined {
  if (receipt && (receipt.status === "rejected" || receipt.status === "ignored")) return undefined;
  const o = op as Record<string, unknown>;
  // 同一操作顺带新建了轨道时回执是 ids（轨道 id + 片段 id）：取能在时间线里找到的那个实体
  const newIds = receipt?.ids ?? (receipt?.id ? [receipt.id] : []);
  const newId = newIds.find((id) => findAnyClip(after, id) || after.overlays.some((x) => x.id === id) || (after.markers ?? []).some((m) => m.id === id)) ?? receipt?.id;
  const where = (id: unknown) => findAnyClip(after, id)?.where ?? findAnyClip(before, id)?.where ?? "";
  switch (op.op) {
    case "addClip": {
      const hit = findAnyClip(after, newId);
      if (!hit) return "添加片段";
      const c = hit.clip as unknown as { clipDuration: number; atSeconds?: number };
      if (hit.where === "主轨") {
        const start = mainTrackStarts(after).get(String(newId)) ?? 0;
        return "主轨添加片段「" + srcLabel(hit.clip.src) + "」（" + sec(start) + " 起，时长 " + sec(c.clipDuration) + "）";
      }
      return hit.where + "添加「" + srcLabel(hit.clip.src) + "」（" + sec(c.atSeconds) + "–" + sec((c.atSeconds ?? 0) + c.clipDuration) + "）";
    }
    case "addAudio": {
      const hit = findAnyClip(after, newId);
      const c = hit?.clip as { atSeconds: number; duration: number } | undefined;
      return hit ? hit.where + "添加音频「" + srcLabel(hit.clip.src) + "」（" + sec(c!.atSeconds) + " 起，时长 " + sec(c!.duration) + "）" : "添加音频";
    }
    case "removeClip":
    case "removeAudio": {
      const hit = findAnyClip(before, o.id);
      if (hit) return "删除" + hit.where + "片段「" + srcLabel(hit.clip.src) + "」";
      const ov = before.overlays.find((x) => x.id === o.id);
      return ov ? "删除字幕" + ovLabel(ov) : undefined;
    }
    case "updateClip": {
      const a = findAnyClip(before, o.id)?.clip;
      const b = findAnyClip(after, o.id)?.clip;
      if (!a) {
        const oa = before.overlays.find((x) => x.id === o.id), ob = after.overlays.find((x) => x.id === o.id);
        return oa ? "修改字幕" + ovLabel(oa) + "：" + fieldChanges(oa, ob).join("，") : undefined;
      }
      const changes = fieldChanges(a, b);
      return changes.length ? "调整" + where(o.id) + "片段「" + srcLabel(a.src) + "」：" + changes.join("，") : undefined;
    }
    case "moveClip":
    case "reorderClips": {
      const order = after.videoTracks[0].clips.map((c) => srcLabel(c.src));
      if (op.op === "moveClip" && findAnyClip(after, o.id)?.where !== "主轨") {
        const a = findAnyClip(before, o.id)?.clip, b = findAnyClip(after, o.id)?.clip;
        return "移动" + clipName(after, o.id) + "：" + fieldChanges(a, b).join("，");
      }
      return "调整主轨顺序 → " + order.map((n, i) => i + 1 + "." + short(n, 10)).join(" ");
    }
    case "splitClip": {
      const ov = before.overlays.find((x) => x.id === o.id);
      if (ov) return "在 " + sec(o.atSeconds) + " 处分割字幕" + ovLabel(ov);
      return "在 " + sec(o.atSeconds) + " 处分割" + where(o.id) + "片段" + clipName(before, o.id);
    }
    case "splitOverlay": {
      const ov = before.overlays.find((x) => x.id === o.id) ?? before.overlays[Number(o.index)];
      return "在 " + sec(o.atSeconds) + " 处分割字幕" + ovLabel(ov);
    }
    case "duplicateClip": return "复制" + clipName(before, o.id);
    case "addTrack": return "新建" + (o.kind === "audio" ? "音频轨" : "画中画轨") + (o.name ? "「" + String(o.name) + "」" : "");
    case "removeTrack": {
      const tr = [...before.videoTracks, ...before.audioTracks].find((x) => x.id === o.id);
      return "删除轨道「" + (tr?.name ?? String(o.id)) + "」及其 " + (tr?.clips.length ?? 0) + " 个片段";
    }
    case "updateTrack":
    case "updateAudioTrack": {
      const a = [...before.videoTracks, ...before.audioTracks].find((x) => x.id === o.id || x.name === o.id);
      const b = [...after.videoTracks, ...after.audioTracks].find((x) => x.id === a?.id);
      if (!a || !b) return undefined;
      const parts: string[] = [];
      const ra = a as Record<string, unknown>, rb = b as Record<string, unknown>;
      if (ra.muted !== rb.muted) parts.push(rb.muted ? "静音" : "取消静音");
      if (ra.hidden !== rb.hidden) parts.push(rb.hidden ? "隐藏" : "显示");
      if (ra.locked !== rb.locked) parts.push(rb.locked ? "锁定" : "解锁");
      if (ra.volume !== rb.volume) parts.push("音量 " + pct(ra.volume) + "→" + pct(rb.volume));
      if (ra.name !== rb.name) parts.push("改名为「" + String(rb.name) + "」");
      if (JSON.stringify(ra.duck) !== JSON.stringify(rb.duck)) parts.push(rb.duck ? "开启人声闪避（压到 " + pct((rb.duck as { level: number }).level) + "）" : "关闭闪避");
      if (ra.role !== rb.role) parts.push("用途设为 " + String(rb.role ?? "未指定"));
      return parts.length ? "轨道「" + (a.name ?? a.id) + "」" + parts.join("，") : undefined;
    }
    case "moveTrack": return "调整轨道「" + ([...after.videoTracks, ...after.audioTracks].find((x) => x.id === o.id)?.name ?? String(o.id)) + "」的层级";
    case "addOverlay": {
      const ov = after.overlays.find((x) => x.id === newId);
      return ov ? "添加字幕" + ovLabel(ov) + "（" + sec(ov.startSeconds) + "–" + sec(ov.endSeconds) + "）" : "添加字幕";
    }
    case "removeOverlay": {
      const ov = typeof o.id === "string" ? before.overlays.find((x) => x.id === o.id) : before.overlays[Number(o.index)];
      return "删除字幕" + ovLabel(ov);
    }
    case "updateOverlay": {
      const a = typeof o.id === "string" ? before.overlays.find((x) => x.id === o.id) : before.overlays[Number(o.index)];
      const b = a ? after.overlays.find((x) => x.id === a.id) : undefined;
      const changes = fieldChanges(a, b);
      return changes.length ? "修改字幕" + ovLabel(a) + "：" + changes.join("，") : undefined;
    }
    case "setMeta": return "画布改为 " + after.meta.width + "×" + after.meta.height + " @" + after.meta.fps + "fps" + (after.meta.background ? "，背景 " + after.meta.background : "");
    case "setKeyframe": return "为" + targetName(after, o.id) + "在 " + sec(o.t) + " 设 " + String(o.channel) + " 关键帧 = " + String(o.v);
    case "removeKeyframe": return "删除" + targetName(before, o.id) + "在 " + sec(o.t) + " 的 " + String(o.channel) + " 关键帧";
    case "clearKeyframes": return "清除" + targetName(before, o.id) + (o.channel ? "的 " + String(o.channel) + " 关键帧" : "的全部动画");
    case "addMarker": return "在 " + sec(o.t) + " 添加标记" + (o.label ? "「" + String(o.label) + "」" : "");
    case "updateMarker": return "修改标记";
    case "removeMarker": return "删除标记";
    default: return undefined;
  }
}

function targetName(t: Timeline, id: unknown) {
  const ov = t.overlays.find((x) => x.id === id);
  return ov ? "字幕" + ovLabel(ov) : clipName(t, id);
}

/** 实体级差异描述（撤销/恢复/整份替换等系统批次用） */
export function describeDiff(before: Timeline, after: Timeline, limit = 12): string[] {
  const lines: string[] = [];
  const clipsOf = (t: Timeline) => {
    const m = new Map<string, { clip: AnyClip; where: string }>();
    t.videoTracks.forEach((tr, i) => tr.clips.forEach((c) => m.set(c.id, { clip: c as unknown as AnyClip, where: i === 0 ? "主轨" : tr.name ?? "画中画" })));
    t.audioTracks.forEach((tr) => tr.clips.forEach((c) => m.set(c.id, { clip: c as unknown as AnyClip, where: tr.name ?? "音频轨" })));
    return m;
  };
  const a = clipsOf(before), b = clipsOf(after);
  for (const [id, x] of b) {
    const prev = a.get(id);
    if (!prev) lines.push("恢复/添加" + x.where + "片段「" + srcLabel(x.clip.src) + "」");
    else {
      const ch = fieldChanges(prev.clip, x.clip);
      if (ch.length) lines.push(x.where + "片段「" + srcLabel(x.clip.src) + "」：" + ch.join("，"));
    }
  }
  for (const [id, x] of a) if (!b.has(id)) lines.push("移除" + x.where + "片段「" + srcLabel(x.clip.src) + "」");
  const ao = new Map(before.overlays.map((o) => [o.id, o]));
  const bo = new Map(after.overlays.map((o) => [o.id, o]));
  for (const [id, o] of bo) {
    const prev = ao.get(id);
    if (!prev) lines.push("恢复/添加字幕" + ovLabel(o));
    else {
      const ch = fieldChanges(prev as unknown as Record<string, unknown>, o as unknown as Record<string, unknown>);
      if (ch.length) lines.push("字幕" + ovLabel(prev) + "：" + ch.join("，"));
    }
  }
  for (const [id, o] of ao) if (!bo.has(id)) lines.push("移除字幕" + ovLabel(o));
  if (JSON.stringify(before.meta) !== JSON.stringify(after.meta)) lines.push("画布改为 " + after.meta.width + "×" + after.meta.height + " @" + after.meta.fps + "fps");
  const tracks = (t: Timeline) => new Map([...t.videoTracks, ...t.audioTracks].map((tr) => [tr.id, tr.name ?? tr.id]));
  const at = tracks(before), bt = tracks(after);
  for (const [id, name] of bt) if (!at.has(id)) lines.push("新增轨道「" + name + "」");
  for (const [id, name] of at) if (!bt.has(id)) lines.push("移除轨道「" + name + "」");
  if (lines.length > limit) return [...lines.slice(0, limit), "…另有 " + (lines.length - limit) + " 处变化"];
  return lines;
}

/** 整批操作的描述；系统批次（撤销/恢复）退化为实体级差异 */
export function describeBatch(before: Timeline, after: Timeline, ops: readonly Op[], receipts: readonly Receipt[], label?: string): string[] {
  const system = ops.some((op) => ["putClip", "putOverlay", "putTrack", "putMarker", "putMeta", "replaceTimeline"].includes(op.op));
  if (system) {
    const lines = describeDiff(before, after);
    return label ? lines.map((l) => label + "：" + l) : lines;
  }
  const out: string[] = [];
  ops.forEach((op, i) => {
    const line = describeOp(op, receipts.find((r) => r.index === i), before, after);
    if (line) out.push(line);
  });
  return out;
}
