// D剪 时间线操作（ops）——唯一的语义实现。
// 面板乐观更新、服务端权威应用、AI 工具都调用这里的 applyOps，保证三方行为一致。
// 纯函数、无 zod 依赖（浏览器包体友好）；服务端在应用后再用 validateTimeline 做严格校验。
import type { Animations, AudioClip, AudioTrack, Clip, Effect, Keyframe, Marker, Overlay, Timeline, VideoTrack } from "./schema.js";
import {
  ANIM_CHANNELS,
  BLEND_MODES,
  DIRECTIONS,
  EASING_NAMES,
  FILTER_RANGES,
  TRANSITION_TYPES,
  mainTrackStarts,
  secToFrames,
  shiftAnimations,
  srcLabel,
} from "./timeline.js";
import { ANIMATION_PRESETS, presetGroup, resolveAnimations } from "./presets.js";
import { fontById } from "./fonts.js";

export type Actor = "user" | "ai" | "system";

export interface OpContext {
  /** 生成新 id（测试可注入确定性实现） */
  newId?: (prefix: string) => string;
  /** 素材是否存在（服务端提供；缺省视为存在） */
  assetExists?: (src: string) => boolean;
  /** 素材源时长（秒），用于缺省片段时长 */
  assetDuration?: (src: string) => number | undefined;
  /** 操作者：锁定轨道只对 system（撤销/恢复）放行 */
  actor?: Actor;
}

export type ReceiptStatus = "applied" | "ignored" | "partial" | "rejected";
export interface Receipt {
  index: number;
  op: string;
  status: ReceiptStatus;
  id?: string;
  ids?: string[];
  reason?: string;
  warnings?: string[];
}
export interface ApplyResult {
  timeline: Timeline;
  receipts: Receipt[];
  /** 被触及的实体键：clip:<id> / overlay:<id> / track:<id> / marker:<id> / meta */
  changed: string[];
}

export const OP_NAMES = [
  "addClip", "removeClip", "updateClip", "moveClip", "reorderClips", "splitClip", "duplicateClip",
  "addAudio", "removeAudio", "updateAudioTrack",
  "addTrack", "removeTrack", "updateTrack", "moveTrack",
  "addOverlay", "removeOverlay", "updateOverlay", "splitOverlay",
  "setMeta",
  "setKeyframe", "removeKeyframe", "clearKeyframes",
  "addMarker", "updateMarker", "removeMarker",
  "putClip", "putOverlay", "putTrack", "putMarker", "putMeta", "replaceTimeline",
] as const;
export type OpName = (typeof OP_NAMES)[number];
export type Op = { op: OpName; [k: string]: unknown };
const OP_SET = new Set<string>(OP_NAMES);
/** 只允许系统（撤销/恢复/迁移）使用的底层操作 */
export const SYSTEM_OPS = new Set<string>(["putClip", "putOverlay", "putTrack", "putMarker", "putMeta", "replaceTimeline"]);

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const defaultNewId = (prefix: string) => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ---------- 通用净化 ----------
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown): number | undefined => {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
};
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const clampOr = (v: unknown, fallback: number, lo = -Infinity, hi = Infinity) => {
  const n = num(v);
  return n === undefined ? fallback : clamp(n, lo, hi);
};
const bool = (v: unknown): boolean | undefined => (typeof v === "boolean" ? v : undefined);
const COLOR_RE = /^(#[0-9a-fA-F]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%deg]+\)|[a-zA-Z]{3,20})$/;
export const sanitizeColor = (v: unknown): string | undefined =>
  typeof v === "string" && v.length <= 40 && COLOR_RE.test(v.trim()) ? v.trim() : undefined;

export function sanitizeTransition(v: unknown): Clip["transition"] | undefined {
  if (v === "none" || v === "fade") return v;
  if (v === null || v === false) return "none";
  if (typeof v === "string") {
    const s = v.trim();
    if (/^fade[-_ ]?in$/i.test(s)) return "fade";
    if (/^(cross[-_ ]?fade|dissolve|叠化)$/i.test(s)) return { type: "dissolve", duration: 0.5 };
    const t = TRANSITION_TYPES.find((x) => x.toLowerCase() === s.toLowerCase());
    return t ? { type: t, duration: 0.5 } : undefined;
  }
  if (isObj(v)) {
    const type = TRANSITION_TYPES.find((x) => x === v.type);
    if (!type) return undefined;
    const direction = DIRECTIONS.find((d) => d === v.direction);
    return { type, duration: clampOr(v.duration, 0.5, 0.05, 3), ...(direction ? { direction } : {}) };
  }
  return undefined;
}

export function sanitizeEasing(e: unknown): Keyframe["e"] | undefined {
  if (typeof e === "string") return (EASING_NAMES as readonly string[]).includes(e) ? (e as Keyframe["e"]) : undefined;
  if (Array.isArray(e) && e.length === 4 && e.every((x) => num(x) !== undefined)) {
    const [x1, y1, x2, y2] = e.map((x) => num(x) as number);
    return [clamp(x1, 0, 1), y1, clamp(x2, 0, 1), y2];
  }
  return undefined;
}

const CHANNEL_RANGES: Record<string, [number, number]> = {
  opacity: [0, 1], volume: [0, 1], scale: [0, 20], scaleX: [-20, 20], scaleY: [-20, 20],
  x: [-5, 5], y: [-5, 5], rotation: [-3600, 3600], brightness: [0, 3], contrast: [0, 3], saturate: [0, 3], blur: [0, 50],
};
export function sanitizeKeyframes(list: unknown, channel: string): Keyframe[] | undefined {
  if (!Array.isArray(list) || !list.length) return undefined;
  const [lo, hi] = CHANNEL_RANGES[channel] ?? [-1e6, 1e6];
  const out: Keyframe[] = [];
  for (const k of list) {
    if (!isObj(k)) return undefined;
    const t = num(k.t);
    const v = num(k.v);
    if (t === undefined || v === undefined) return undefined;
    const e = sanitizeEasing(k.e);
    out.push({ t: Math.round(t * 10000) / 10000, v: clamp(v, lo, hi), ...(e !== undefined ? { e } : {}) });
  }
  return out.sort((a, b) => a.t - b.t);
}

export function sanitizeAnimations(a: unknown): Animations | undefined {
  if (!isObj(a)) return undefined;
  const out: Record<string, Keyframe[]> = {};
  for (const ch of ANIM_CHANNELS) {
    const kfs = sanitizeKeyframes(a[ch], ch);
    if (kfs) out[ch] = kfs;
  }
  return Object.keys(out).length ? (out as Animations) : undefined;
}

export function sanitizeFilter(f: unknown): Clip["filter"] | undefined {
  if (!isObj(f)) return undefined;
  const out: Record<string, number> = {};
  for (const [k, [lo, hi]] of Object.entries(FILTER_RANGES)) {
    const v = num(f[k]);
    if (v !== undefined) out[k] = clamp(v, lo, hi);
  }
  return Object.keys(out).length ? out : undefined;
}

export function sanitizeEffects(list: unknown): Effect[] | undefined {
  if (!Array.isArray(list)) return undefined;
  const out: Effect[] = [];
  for (const e of list) {
    const preset = typeof e === "string" ? e : isObj(e) && typeof e.preset === "string" ? e.preset : undefined;
    if (preset && ANIMATION_PRESETS[preset] && !out.some((x) => x.preset === preset)) out.push({ preset });
  }
  return out.slice(0, 8);
}

export function sanitizeRect(r: unknown, minSize = 0.01): { x: number; y: number; w: number; h: number } | undefined {
  if (!isObj(r)) return undefined;
  const x = num(r.x), y = num(r.y), w = num(r.w), h = num(r.h);
  if (x === undefined || y === undefined || w === undefined || h === undefined) return undefined;
  return { x: clamp(x, 0, 1), y: clamp(y, 0, 1), w: clamp(w, minSize, 1), h: clamp(h, minSize, 1) };
}

export const sanitizeSpeed = (v: unknown): number | undefined => {
  const s = num(v);
  return s === undefined ? undefined : clamp(s, 0.1, 10);
};

export function sanitizeMetaPatch(p: unknown): Partial<Timeline["meta"]> {
  const out: Partial<Timeline["meta"]> = {};
  if (!isObj(p)) return out;
  const fps = num(p.fps);
  if (fps !== undefined) out.fps = clamp(Math.round(fps), 1, 120);
  const w = num(p.width), h = num(p.height);
  if (w !== undefined) out.width = clamp(Math.round(w / 2) * 2, 16, 7680);
  if (h !== undefined) out.height = clamp(Math.round(h / 2) * 2, 16, 7680);
  const bg = sanitizeColor(p.background);
  if (bg) out.background = bg;
  return out;
}

/** 预设名 → 新 effects 列表：同组替换；"none"/"" 返回 null 表示清空；未知名字返回 undefined */
export function applyPresetToEffects(effects: Effect[] | undefined, preset: string): Effect[] | null | undefined {
  if (!preset || preset === "none") return null;
  if (!ANIMATION_PRESETS[preset]) return undefined;
  const group = presetGroup(preset);
  const kept = (effects ?? []).filter((e) => presetGroup(e.preset) !== group && e.preset !== preset);
  return [...kept, { preset }];
}

/** 容忍模型写歪的格式：{op}/{type}/单键 {"updateClip":{...}} */
export function normalizeOp(raw: unknown): { op?: Op; error?: string } {
  if (!isObj(raw)) return { error: "操作必须是对象" };
  let name = raw.op ?? raw.type;
  let op: Record<string, unknown> = { ...raw };
  if (typeof name !== "string" || !OP_SET.has(name)) {
    const keys = Object.keys(raw);
    if (keys.length === 1 && OP_SET.has(keys[0])) {
      const v = raw[keys[0]];
      name = keys[0];
      op = isObj(v) ? { ...v } : { index: v };
    } else {
      return { error: typeof name === "string" ? "未知操作「" + name + "」" : "缺少 op 字段" };
    }
  }
  if (op.type === name) delete op.type;
  op.op = name;
  return { op: op as Op };
}

// ---------- 应用 ----------
class OpError extends Error {}
const fail = (msg: string): never => { throw new OpError(msg); };

interface Scope {
  t: Timeline;
  ctx: OpContext;
  actor: Actor;
  touched: Set<string>;
  warnings: string[];
  newIds: string[];
  usedIds: Set<string>;
}

const collectIds = (t: Timeline) => {
  const s = new Set<string>();
  for (const tr of t.videoTracks) { s.add(tr.id); for (const c of tr.clips) s.add(c.id); }
  for (const tr of t.audioTracks) { s.add(tr.id); for (const c of tr.clips) s.add(c.id); }
  for (const o of t.overlays) s.add(o.id);
  for (const m of t.markers ?? []) s.add(m.id);
  return s;
};

/** 采用调用方给的 id（乐观更新需要两端一致），冲突或非法时生成新的 */
function takeId(s: Scope, wanted: unknown, prefix: string): string {
  if (typeof wanted === "string" && ID_RE.test(wanted) && !s.usedIds.has(wanted)) {
    s.usedIds.add(wanted);
    s.newIds.push(wanted);
    return wanted;
  }
  if (typeof wanted === "string" && wanted) s.warnings.push("id「" + wanted + "」已占用或不合法，已改用新 id");
  const gen = s.ctx.newId ?? defaultNewId;
  let id = gen(prefix);
  while (s.usedIds.has(id)) id = gen(prefix);
  s.usedIds.add(id);
  s.newIds.push(id);
  return id;
}

type VideoHit = { kind: "video"; track: VideoTrack; trackIndex: number; index: number; clip: Clip };
type AudioHit = { kind: "audio"; track: AudioTrack; trackIndex: number; index: number; clip: AudioClip };
function findClip(t: Timeline, id: unknown): VideoHit | AudioHit | undefined {
  if (typeof id !== "string") return undefined;
  for (let ti = 0; ti < t.videoTracks.length; ti++) {
    const track = t.videoTracks[ti];
    const index = track.clips.findIndex((c) => c.id === id);
    if (index !== -1) return { kind: "video", track, trackIndex: ti, index, clip: track.clips[index] };
  }
  for (let ti = 0; ti < t.audioTracks.length; ti++) {
    const track = t.audioTracks[ti];
    const index = track.clips.findIndex((c) => c.id === id);
    if (index !== -1) return { kind: "audio", track, trackIndex: ti, index, clip: track.clips[index] };
  }
  return undefined;
}

function findOverlay(t: Timeline, op: Record<string, unknown>): { overlay: Overlay; index: number } | undefined {
  if (typeof op.id === "string") {
    const index = t.overlays.findIndex((o) => o.id === op.id);
    return index === -1 ? undefined : { overlay: t.overlays[index], index };
  }
  const i = num(op.index);
  if (i === undefined || !Number.isInteger(i) || i < 0 || i >= t.overlays.length) return undefined;
  // 旧式按下标寻址：可带 expectText 防止下标漂移改错字幕
  if (typeof op.expectText === "string" && t.overlays[i].text !== op.expectText) return undefined;
  return { overlay: t.overlays[i], index: i };
}

const findTrack = (t: Timeline, id: unknown): { kind: "video"; track: VideoTrack; index: number } | { kind: "audio"; track: AudioTrack; index: number } | undefined => {
  if (typeof id !== "string") return undefined;
  const vi = t.videoTracks.findIndex((tr) => tr.id === id || tr.name === id);
  if (vi !== -1) return { kind: "video", track: t.videoTracks[vi], index: vi };
  const ai = t.audioTracks.findIndex((tr) => tr.id === id || tr.name === id);
  if (ai !== -1) return { kind: "audio", track: t.audioTracks[ai], index: ai };
  return undefined;
};

function assertUnlocked(s: Scope, track: { locked?: boolean; name?: string; id: string }) {
  if (track.locked && s.actor !== "system") fail("轨道「" + (track.name ?? track.id) + "」已锁定，解锁后才能修改");
}

const frameOf = (t: Timeline) => 1 / t.meta.fps;
const snapToFrame = (t: Timeline, sec: number) => Math.round(sec * t.meta.fps) / t.meta.fps;

function clipLabel(c: { src: string }) {
  return srcLabel(c.src);
}

/** 主轨插入位：给定 index 优先；否则按 atSeconds 找最近的片段边界；都没有就追加 */
function mainInsertIndex(t: Timeline, index: unknown, atSeconds: unknown): number {
  const clips = t.videoTracks[0].clips;
  const i = num(index);
  if (i !== undefined) return clamp(Math.round(i), 0, clips.length);
  const at = num(atSeconds);
  if (at === undefined) return clips.length;
  const starts = mainTrackStarts(t);
  let best = clips.length;
  let bestDist = Infinity;
  let end = 0;
  clips.forEach((c, k) => {
    const s = starts.get(c.id) ?? 0;
    end = s + c.clipDuration;
    if (Math.abs(s - at) < bestDist) { bestDist = Math.abs(s - at); best = k; }
  });
  if (Math.abs(end - at) < bestDist) best = clips.length;
  return best;
}

function overlayTrackFor(s: Scope, wanted: unknown, name?: unknown): VideoTrack {
  const t = s.t;
  const keyword = typeof wanted === "string" && ["pip", "overlay", "new", "main"].includes(wanted);
  if (typeof wanted === "string" && !keyword) {
    const hit = t.videoTracks.find((tr, i) => i > 0 && (tr.id === wanted || tr.name === wanted));
    if (hit) return hit;
    if (wanted === t.videoTracks[0].id) fail("主轨片段请用 track:\"main\"，画中画需要叠加轨");
  } else if (wanted !== "new") {
    const free = t.videoTracks.slice(1).find((tr) => !tr.locked);
    if (free) return free;
  }
  const wantedId = typeof wanted === "string" && !keyword && ID_RE.test(wanted) ? wanted : undefined;
  const id = takeId(s, wantedId, "v");
  const track: VideoTrack = { id, name: typeof name === "string" && name ? name.slice(0, 30) : "画中画", clips: [] };
  t.videoTracks.push(track);
  s.touched.add("track:" + id);
  return track;
}

function audioTrackFor(s: Scope, wanted: unknown, trackVolume?: unknown, trackName?: unknown): AudioTrack {
  const t = s.t;
  if (typeof wanted === "string" && wanted !== "new") {
    const hit = t.audioTracks.find((tr) => tr.id === wanted || tr.name === wanted);
    if (hit) return hit;
  } else if (wanted === undefined && t.audioTracks.length) {
    const free = t.audioTracks.find((tr) => !tr.locked);
    if (free) return free;
  }
  const id = takeId(s, typeof wanted === "string" && wanted !== "new" && ID_RE.test(wanted) ? wanted : undefined, "a");
  const name = typeof trackName === "string" ? trackName.slice(0, 30) : typeof wanted === "string" && wanted !== "new" ? wanted.slice(0, 30) : "音频";
  const track: AudioTrack = { id, name, volume: clampOr(trackVolume, 1, 0, 1), muted: false, clips: [] };
  t.audioTracks.push(track);
  s.touched.add("track:" + id);
  return track;
}

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|bmp|avif)$/i;

function checkAsset(s: Scope, src: unknown): string {
  if (typeof src !== "string" || !src.trim()) fail("缺少素材文件名 src");
  const name = (src as string).trim();
  if (s.ctx.assetExists && !s.ctx.assetExists(name)) {
    fail("素材库里没有「" + name + "」（素材按项目隔离）：先用 asset_list 确认文件名，缺少的素材请导入后再引用");
  }
  return name;
}

/** 可选字段：null/undefined-语义统一——值为 null 表示删除该字段 */
function setOpt<T extends object, K extends keyof T>(target: T, key: K, value: T[K] | undefined | null) {
  if (value === undefined || value === null) delete target[key];
  else target[key] = value;
}

const VIDEO_KEYS = new Set(["src", "type", "inPoint", "clipDuration", "transition", "volume", "atSeconds", "box", "speed", "filter", "animations", "animationPreset", "effects", "crop", "flipH", "flipV", "opacity", "blendMode", "fit", "freeze", "radius", "shadow", "muted", "fadeIn", "fadeOut", "track", "index"]);
const AUDIO_KEYS = new Set(["src", "inPoint", "duration", "clipDuration", "volume", "atSeconds", "speed", "animations", "animationPreset", "muted", "fadeIn", "fadeOut", "track"]);

function patchVideoClip(s: Scope, hit: VideoHit, patch: Record<string, unknown>) {
  const { clip } = hit;
  const isMain = hit.trackIndex === 0;
  const frame = frameOf(s.t);
  for (const key of Object.keys(patch)) if (!VIDEO_KEYS.has(key)) s.warnings.push("忽略未知字段「" + key + "」");
  if ("src" in patch) {
    clip.src = checkAsset(s, patch.src);
    if (!("type" in patch)) clip.type = IMAGE_EXT.test(clip.src) ? "image" : "video";
  }
  if (patch.type === "video" || patch.type === "image") clip.type = patch.type;
  if ("inPoint" in patch) clip.inPoint = clampOr(patch.inPoint, clip.inPoint, 0, 86400);
  if ("clipDuration" in patch) clip.clipDuration = Math.max(frame, clampOr(patch.clipDuration, clip.clipDuration, frame, 86400));
  if ("transition" in patch) {
    const tr = sanitizeTransition(patch.transition);
    if (tr === undefined) s.warnings.push("转场取值无效，已忽略");
    else clip.transition = tr;
  }
  if ("volume" in patch) clip.volume = clampOr(patch.volume, clip.volume, 0, 1);
  if ("speed" in patch) clip.speed = sanitizeSpeed(patch.speed) ?? clip.speed;
  if ("atSeconds" in patch) {
    if (isMain) s.warnings.push("主轨片段按顺序首尾相接，没有 atSeconds；调整顺序请用 moveClip");
    else clip.atSeconds = clampOr(patch.atSeconds, clip.atSeconds ?? 0, 0, 86400);
  }
  if ("box" in patch) {
    if (isMain) s.warnings.push("主轨片段铺满画面，没有画中画 box");
    else setOpt(clip, "box", patch.box === null ? null : sanitizeRect(patch.box) ?? clip.box);
  }
  if ("filter" in patch) setOpt(clip, "filter", sanitizeFilter(patch.filter) ?? null);
  if ("animations" in patch) setOpt(clip, "animations", sanitizeAnimations(patch.animations) ?? null);
  if ("effects" in patch) {
    const fx = sanitizeEffects(patch.effects);
    setOpt(clip, "effects", fx && fx.length ? fx : null);
  }
  if ("animationPreset" in patch) applyPresetPatch(s, clip, patch.animationPreset);
  if ("crop" in patch) setOpt(clip, "crop", patch.crop === null ? null : sanitizeRect(patch.crop, 0.05) ?? clip.crop);
  for (const key of ["flipH", "flipV", "freeze", "shadow", "muted"] as const) {
    if (key in patch) setOpt(clip, key, patch[key] === null ? null : bool(patch[key]) ?? clip[key]);
  }
  if ("opacity" in patch) setOpt(clip, "opacity", patch.opacity === null ? null : clampOr(patch.opacity, clip.opacity ?? 1, 0, 1));
  if ("blendMode" in patch) {
    const bm = BLEND_MODES.find((m) => m === patch.blendMode);
    setOpt(clip, "blendMode", !bm || bm === "normal" ? null : bm);
  }
  if ("fit" in patch) setOpt(clip, "fit", patch.fit === "contain" || patch.fit === "fill" || patch.fit === "cover" ? patch.fit : null);
  if ("radius" in patch) setOpt(clip, "radius", patch.radius === null ? null : clampOr(patch.radius, 0, 0, 0.5));
  for (const key of ["fadeIn", "fadeOut"] as const) {
    if (key in patch) {
      const v = patch[key] === null ? 0 : clampOr(patch[key], clip[key] ?? 0, 0, 30);
      setOpt(clip, key, v > 0 ? v : null);
    }
  }
  if ("track" in patch && patch.track !== undefined) {
    if (isMain) s.warnings.push("主轨片段不能直接移到其他轨道，请删除后在目标轨道添加");
    else {
      const dest = overlayTrackFor(s, patch.track);
      if (dest !== hit.track) {
        assertUnlocked(s, dest);
        hit.track.clips.splice(hit.index, 1);
        dest.clips.push(clip);
        s.touched.add("track:" + dest.id);
      }
    }
  }
  if ("index" in patch && isMain) {
    const to = clamp(Math.round(num(patch.index) ?? hit.index), 0, hit.track.clips.length - 1);
    hit.track.clips.splice(hit.index, 1);
    hit.track.clips.splice(to, 0, clip);
  }
}

function applyPresetPatch(s: Scope, item: { effects?: Effect[]; animations?: Animations }, preset: unknown) {
  if (typeof preset !== "string") { s.warnings.push("animationPreset 必须是预设名字符串"); return; }
  const next = applyPresetToEffects(item.effects, preset);
  if (next === undefined) { s.warnings.push("未知动画预设「" + preset + "」"); return; }
  if (next === null) { delete item.effects; delete item.animations; return; }
  item.effects = next;
}

function patchAudioClip(s: Scope, hit: AudioHit, patch: Record<string, unknown>) {
  const { clip } = hit;
  const frame = frameOf(s.t);
  for (const key of Object.keys(patch)) if (!AUDIO_KEYS.has(key)) s.warnings.push("音频片段忽略字段「" + key + "」");
  if ("src" in patch) clip.src = checkAsset(s, patch.src);
  if ("inPoint" in patch) clip.inPoint = clampOr(patch.inPoint, clip.inPoint, 0, 86400);
  const dur = "duration" in patch ? patch.duration : patch.clipDuration;
  if (dur !== undefined) clip.duration = Math.max(frame, clampOr(dur, clip.duration, frame, 86400));
  if ("volume" in patch) clip.volume = clampOr(patch.volume, clip.volume, 0, 1);
  if ("atSeconds" in patch) clip.atSeconds = clampOr(patch.atSeconds, clip.atSeconds, 0, 86400);
  if ("speed" in patch) clip.speed = sanitizeSpeed(patch.speed) ?? clip.speed;
  if ("animations" in patch) {
    const a = sanitizeAnimations(patch.animations);
    setOpt(clip, "animations", a?.volume ? { volume: a.volume } : null);
  }
  if ("animationPreset" in patch) {
    if (patch.animationPreset === "none" || patch.animationPreset === "") delete clip.animations;
    else s.warnings.push("音频片段不支持画面动画预设；淡入淡出请用 fadeIn/fadeOut（秒）");
  }
  if ("muted" in patch) setOpt(clip, "muted", patch.muted === null ? null : bool(patch.muted) ?? clip.muted);
  for (const key of ["fadeIn", "fadeOut"] as const) {
    if (key in patch) {
      const v = patch[key] === null ? 0 : clampOr(patch[key], clip[key] ?? 0, 0, 30);
      setOpt(clip, key, v > 0 ? v : null);
    }
  }
  if ("track" in patch && patch.track !== undefined) {
    const dest = audioTrackFor(s, patch.track);
    if (dest !== hit.track) {
      assertUnlocked(s, dest);
      hit.track.clips.splice(hit.index, 1);
      dest.clips.push(clip);
      s.touched.add("track:" + dest.id);
    }
  }
}

const OVERLAY_KEYS = new Set(["text", "startSeconds", "endSeconds", "position", "fontSize", "color", "fontFamily", "fontWeight", "animations", "animationPreset", "effects", "x", "y", "align", "maxWidth", "lineHeight", "letterSpacing", "italic", "underline", "stroke", "shadow", "background", "kind", "track"]);

function patchOverlay(s: Scope, ov: Overlay, patch: Record<string, unknown>) {
  const frame = frameOf(s.t);
  for (const key of Object.keys(patch)) if (!OVERLAY_KEYS.has(key)) s.warnings.push("字幕忽略字段「" + key + "」");
  if ("text" in patch) ov.text = String(patch.text ?? "").slice(0, 2000);
  if ("startSeconds" in patch) ov.startSeconds = clampOr(patch.startSeconds, ov.startSeconds, 0, 86400);
  if ("endSeconds" in patch) ov.endSeconds = clampOr(patch.endSeconds, ov.endSeconds, 0, 86400);
  if (secToFrames(s.t.meta.fps, ov.endSeconds) <= secToFrames(s.t.meta.fps, ov.startSeconds)) {
    ov.endSeconds = ov.startSeconds + frame;
    s.warnings.push("字幕结束时间早于开始时间，已改为只显示一帧，请检查时间");
  }
  if ("position" in patch && ["top", "center", "bottom"].includes(patch.position as string)) ov.position = patch.position as Overlay["position"];
  if ("fontSize" in patch) ov.fontSize = clampOr(patch.fontSize, ov.fontSize, 4, 2000);
  if ("color" in patch) ov.color = sanitizeColor(patch.color) ?? ov.color;
  if ("fontFamily" in patch) setOpt(ov, "fontFamily", typeof patch.fontFamily === "string" && fontById(patch.fontFamily) ? patch.fontFamily : null);
  if ("fontWeight" in patch) {
    const w = num(patch.fontWeight);
    setOpt(ov, "fontWeight", w === undefined ? null : clamp(Math.round(w / 100) * 100, 100, 900));
  }
  if ("animations" in patch) setOpt(ov, "animations", sanitizeAnimations(patch.animations) ?? null);
  if ("effects" in patch) {
    const fx = sanitizeEffects(patch.effects);
    setOpt(ov, "effects", fx && fx.length ? fx : null);
  }
  if ("animationPreset" in patch) applyPresetPatch(s, ov, patch.animationPreset);
  for (const key of ["x", "y"] as const) if (key in patch) setOpt(ov, key, patch[key] === null ? null : clampOr(patch[key], 0.5, 0, 1));
  if ("align" in patch) setOpt(ov, "align", ["left", "center", "right"].includes(patch.align as string) ? (patch.align as Overlay["align"]) : null);
  if ("maxWidth" in patch) setOpt(ov, "maxWidth", patch.maxWidth === null ? null : clampOr(patch.maxWidth, 0.9, 0.1, 1));
  if ("lineHeight" in patch) setOpt(ov, "lineHeight", patch.lineHeight === null ? null : clampOr(patch.lineHeight, 1.3, 0.8, 3));
  if ("letterSpacing" in patch) setOpt(ov, "letterSpacing", patch.letterSpacing === null ? null : clampOr(patch.letterSpacing, 0, -0.2, 1));
  for (const key of ["italic", "underline"] as const) if (key in patch) setOpt(ov, key, patch[key] ? true : null);
  if ("stroke" in patch) {
    const st = patch.stroke;
    const color = isObj(st) ? sanitizeColor(st.color) : undefined;
    setOpt(ov, "stroke", isObj(st) && color ? { color, width: clampOr(st.width, 2, 0, 40) } : null);
  }
  if ("shadow" in patch) {
    const sh = patch.shadow;
    if (sh === false) ov.shadow = false;
    else if (isObj(sh) && sanitizeColor(sh.color)) {
      ov.shadow = { color: sanitizeColor(sh.color)!, blur: clampOr(sh.blur, 8, 0, 80), ...(num(sh.x) !== undefined ? { x: clampOr(sh.x, 0, -80, 80) } : {}), ...(num(sh.y) !== undefined ? { y: clampOr(sh.y, 2, -80, 80) } : {}) };
    } else delete ov.shadow;
  }
  if ("background" in patch) {
    const bg = patch.background;
    const color = isObj(bg) ? sanitizeColor(bg.color) : undefined;
    setOpt(ov, "background", isObj(bg) && color ? {
      color,
      ...(num(bg.opacity) !== undefined ? { opacity: clampOr(bg.opacity, 1, 0, 1) } : {}),
      ...(num(bg.padding) !== undefined ? { padding: clampOr(bg.padding, 12, 0, 200) } : {}),
      ...(num(bg.radius) !== undefined ? { radius: clampOr(bg.radius, 8, 0, 200) } : {}),
    } : null);
  }
  if ("kind" in patch) setOpt(ov, "kind", patch.kind === "title" || patch.kind === "subtitle" ? patch.kind : null);
  if ("track" in patch) setOpt(ov, "track", patch.track === null ? null : clamp(Math.round(num(patch.track) ?? 0), 0, 31));
}

/** 分割偏移（相对片段起点），对齐帧网格，两侧各留至少一帧；不合法返回 null */
export function splitOffset(start: number, duration: number, atSeconds: number, fps: number): number | null {
  if (![start, duration, atSeconds, fps].every(Number.isFinite) || fps <= 0) return null;
  const offset = Math.round(atSeconds * fps) / fps - start;
  const frame = 1 / fps;
  const eps = frame * 1e-7;
  return offset >= frame - eps && duration - offset >= frame - eps ? offset : null;
}

/** 把预设引用烤成显式关键帧（分割时保持曲线连续） */
function bakeEffects<T extends { effects?: Effect[]; animations?: Animations }>(item: T, duration: number): T {
  if (!item.effects?.length) return item;
  const baked = resolveAnimations(item, duration);
  const next = { ...item };
  delete next.effects;
  if (baked) next.animations = baked; else delete next.animations;
  return next;
}

function trackOfOverlayTouch(s: Scope, id: string) { s.touched.add("overlay:" + id); }

function keyframeTarget(s: Scope, id: unknown): { item: { animations?: Animations; effects?: Effect[] }; key: string; duration: number; kind: "clip" | "audio" | "overlay"; lock?: { locked?: boolean; id: string; name?: string } } {
  const hit = findClip(s.t, id);
  if (hit) return { item: hit.clip, key: "clip:" + hit.clip.id, duration: hit.kind === "video" ? hit.clip.clipDuration : hit.clip.duration, kind: hit.kind === "video" ? "clip" : "audio", lock: hit.track };
  const ov = findOverlay(s.t, { id });
  if (ov) return { item: ov.overlay, key: "overlay:" + ov.overlay.id, duration: ov.overlay.endSeconds - ov.overlay.startSeconds, kind: "overlay" };
  return fail("找不到 id 为「" + String(id) + "」的片段或字幕");
}

function addClipOp(s: Scope, op: Record<string, unknown>) {
  const t = s.t;
  const src = checkAsset(s, op.src);
  const type: Clip["type"] = op.type === "image" || op.type === "video" ? op.type : IMAGE_EXT.test(src) ? "image" : "video";
  const inPoint = clampOr(op.inPoint, 0, 0, 86400);
  const known = s.ctx.assetDuration?.(src);
  const fallbackDur = type === "image" ? 3 : known && known > inPoint ? known - inPoint : 3;
  const isOverlay = typeof op.track === "string" ? op.track !== "main" && op.track !== t.videoTracks[0].id : num(op.atSeconds) !== undefined && op.track !== "main" && "box" in op;
  const clip: Clip = {
    id: takeId(s, op.id, "c"),
    type,
    src,
    inPoint,
    clipDuration: Math.max(frameOf(t), clampOr(op.clipDuration ?? op.duration, fallbackDur, frameOf(t), 86400)),
    transition: sanitizeTransition(op.transition) ?? "none",
    volume: clampOr(op.volume, 1, 0, 1),
    speed: sanitizeSpeed(op.speed) ?? 1,
  };
  const rest: Record<string, unknown> = {};
  for (const key of ["filter", "animations", "effects", "animationPreset", "crop", "flipH", "flipV", "opacity", "blendMode", "fit", "freeze", "radius", "shadow", "muted", "fadeIn", "fadeOut"]) {
    if (key in op) rest[key] = op[key];
  }
  if (isOverlay) {
    const track = overlayTrackFor(s, op.track ?? "pip", op.name);
    assertUnlocked(s, track);
    clip.atSeconds = clampOr(op.atSeconds, 0, 0, 86400);
    if (op.box !== undefined) {
      const box = sanitizeRect(op.box);
      if (box) clip.box = box;
    }
    track.clips.push(clip);
    patchVideoClip(s, { kind: "video", track, trackIndex: t.videoTracks.indexOf(track), index: track.clips.length - 1, clip }, rest);
  } else {
    const main = t.videoTracks[0];
    assertUnlocked(s, main);
    const at = mainInsertIndex(t, op.index, op.atSeconds);
    main.clips.splice(at, 0, clip);
    patchVideoClip(s, { kind: "video", track: main, trackIndex: 0, index: at, clip }, rest);
  }
  s.touched.add("clip:" + clip.id);
}

function addAudioOp(s: Scope, op: Record<string, unknown>) {
  const src = checkAsset(s, op.src);
  const inPoint = clampOr(op.inPoint, 0, 0, 86400);
  const known = s.ctx.assetDuration?.(src);
  const track = audioTrackFor(s, op.track, op.trackVolume, op.name);
  assertUnlocked(s, track);
  const clip: AudioClip = {
    id: takeId(s, op.id, "c"),
    src,
    inPoint,
    duration: Math.max(frameOf(s.t), clampOr(op.duration ?? op.clipDuration, known && known > inPoint ? known - inPoint : 10, frameOf(s.t), 86400)),
    volume: clampOr(op.volume, 1, 0, 1),
    atSeconds: clampOr(op.atSeconds, 0, 0, 86400),
    speed: sanitizeSpeed(op.speed) ?? 1,
  };
  track.clips.push(clip);
  const rest: Record<string, unknown> = {};
  for (const key of ["animations", "muted", "fadeIn", "fadeOut"]) if (key in op) rest[key] = op[key];
  patchAudioClip(s, { kind: "audio", track, trackIndex: s.t.audioTracks.indexOf(track), index: track.clips.length - 1, clip }, rest);
  s.touched.add("clip:" + clip.id);
}

function removeClipOp(s: Scope, op: Record<string, unknown>) {
  const hit = findClip(s.t, op.id);
  if (!hit) {
    // 兼容：removeClip 传了字幕 id
    const ov = findOverlay(s.t, { id: op.id });
    if (ov) { s.t.overlays.splice(ov.index, 1); trackOfOverlayTouch(s, ov.overlay.id); return; }
    s.warnings.push("id「" + String(op.id) + "」不存在");
    return;
  }
  assertUnlocked(s, hit.track);
  hit.track.clips.splice(hit.index, 1);
  s.touched.add("clip:" + hit.clip.id);
  // 空的叠加轨/音频轨自动收起（主轨保留；撤销/恢复按原样保留轨道结构）
  if (!hit.track.clips.length && s.actor !== "system") {
    if (hit.kind === "video" && hit.trackIndex > 0) { s.t.videoTracks.splice(hit.trackIndex, 1); s.touched.add("track:" + hit.track.id); }
    if (hit.kind === "audio") { s.t.audioTracks.splice(hit.trackIndex, 1); s.touched.add("track:" + hit.track.id); }
  }
}

function splitClipOp(s: Scope, op: Record<string, unknown>) {
  const at = num(op.atSeconds);
  if (at === undefined) fail("splitClip 缺少 atSeconds（时间线上的绝对秒）");
  const hit = findClip(s.t, op.id);
  if (!hit) {
    const ov = findOverlay(s.t, { id: op.id });
    if (ov) return splitOverlayOp(s, { id: ov.overlay.id, atSeconds: at, newId: op.newId });
    s.warnings.push("id「" + String(op.id) + "」不存在");
    return;
  }
  assertUnlocked(s, hit.track);
  const fps = s.t.meta.fps;
  if (hit.kind === "video") {
    const start = hit.trackIndex === 0 ? mainTrackStarts(s.t).get(hit.clip.id) ?? 0 : hit.clip.atSeconds ?? 0;
    const off = splitOffset(start, hit.clip.clipDuration, at!, fps);
    if (off === null) { s.warnings.push("切点须落在片段内部且两侧各留至少一帧（片段 " + start.toFixed(2) + "s 起，长 " + hit.clip.clipDuration.toFixed(2) + "s）"); return; }
    const base = bakeEffects(hit.clip, hit.clip.clipDuration);
    const left: Clip = { ...base, clipDuration: off };
    const right: Clip = { ...base, id: takeId(s, op.newId, "c"), inPoint: base.inPoint + (base.freeze ? 0 : off * (base.speed ?? 1)), clipDuration: base.clipDuration - off, transition: "none" };
    if (base.animations) right.animations = shiftAnimations(base.animations, off);
    if (base.atSeconds !== undefined) right.atSeconds = base.atSeconds + off;
    if (left.fadeOut) delete left.fadeOut;
    if (right.fadeIn) delete right.fadeIn;
    hit.track.clips.splice(hit.index, 1, left, right);
    s.touched.add("clip:" + left.id); s.touched.add("clip:" + right.id);
  } else {
    const off = splitOffset(hit.clip.atSeconds, hit.clip.duration, at!, fps);
    if (off === null) { s.warnings.push("切点须落在音频片段内部且两侧各留至少一帧"); return; }
    const c = hit.clip;
    const left: AudioClip = { ...c, duration: off };
    const right: AudioClip = { ...c, id: takeId(s, op.newId, "c"), inPoint: c.inPoint + off * (c.speed ?? 1), duration: c.duration - off, atSeconds: c.atSeconds + off };
    if (c.animations) right.animations = shiftAnimations(c.animations, off);
    if (left.fadeOut) delete left.fadeOut;
    if (right.fadeIn) delete right.fadeIn;
    hit.track.clips.splice(hit.index, 1, left, right);
    s.touched.add("clip:" + left.id); s.touched.add("clip:" + right.id);
  }
}

function splitOverlayOp(s: Scope, op: Record<string, unknown>) {
  const hit = findOverlay(s.t, op);
  if (!hit) { s.warnings.push("字幕不存在"); return; }
  const at = num(op.atSeconds);
  const ov = hit.overlay;
  const off = at === undefined ? null : splitOffset(ov.startSeconds, ov.endSeconds - ov.startSeconds, at, s.t.meta.fps);
  if (off === null) { s.warnings.push("切点须落在字幕区间内部且两侧各留至少一帧"); return; }
  const base = bakeEffects(ov, ov.endSeconds - ov.startSeconds);
  const cut = ov.startSeconds + off;
  const left: Overlay = { ...base, endSeconds: cut };
  const right: Overlay = { ...base, id: takeId(s, op.newId, "o"), startSeconds: cut };
  if (base.animations) right.animations = shiftAnimations(base.animations, off);
  s.t.overlays.splice(hit.index, 1, left, right);
  trackOfOverlayTouch(s, left.id); trackOfOverlayTouch(s, right.id);
}

function duplicateClipOp(s: Scope, op: Record<string, unknown>) {
  const hit = findClip(s.t, op.id);
  if (!hit) {
    const ov = findOverlay(s.t, { id: op.id });
    if (!ov) { s.warnings.push("id「" + String(op.id) + "」不存在"); return; }
    const len = ov.overlay.endSeconds - ov.overlay.startSeconds;
    const start = clampOr(op.atSeconds, ov.overlay.endSeconds, 0, 86400);
    const copy: Overlay = { ...structuredClone(ov.overlay), id: takeId(s, op.newId, "o"), startSeconds: start, endSeconds: start + len };
    s.t.overlays.splice(ov.index + 1, 0, copy);
    trackOfOverlayTouch(s, copy.id);
    return;
  }
  assertUnlocked(s, hit.track);
  const copy = { ...structuredClone(hit.clip), id: takeId(s, op.newId, "c") };
  if (hit.kind === "video" && hit.trackIndex === 0) {
    (hit.track.clips as Clip[]).splice(hit.index + 1, 0, copy as Clip);
  } else if (hit.kind === "video") {
    const c = copy as Clip;
    c.atSeconds = clampOr(op.atSeconds, (hit.clip.atSeconds ?? 0) + hit.clip.clipDuration, 0, 86400);
    hit.track.clips.push(c);
  } else {
    const c = copy as AudioClip;
    c.atSeconds = clampOr(op.atSeconds, hit.clip.atSeconds + hit.clip.duration, 0, 86400);
    hit.track.clips.push(c);
  }
  s.touched.add("clip:" + copy.id);
}

function moveClipOp(s: Scope, op: Record<string, unknown>) {
  const hit = findClip(s.t, op.id);
  if (!hit) { s.warnings.push("id「" + String(op.id) + "」不存在"); return; }
  assertUnlocked(s, hit.track);
  if (hit.kind === "video" && hit.trackIndex === 0) {
    const to = clamp(Math.round(num(op.index) ?? mainInsertIndex(s.t, undefined, op.atSeconds)), 0, hit.track.clips.length - 1);
    hit.track.clips.splice(hit.index, 1);
    hit.track.clips.splice(to, 0, hit.clip);
  } else {
    const patch: Record<string, unknown> = {};
    if (op.atSeconds !== undefined) patch.atSeconds = op.atSeconds;
    if (op.track !== undefined) patch.track = op.track;
    if (hit.kind === "video") patchVideoClip(s, hit, patch); else patchAudioClip(s, hit, patch);
  }
  s.touched.add("clip:" + hit.clip.id);
}

function reorderClipsOp(s: Scope, op: Record<string, unknown>) {
  if (!Array.isArray(op.order)) fail("reorderClips 缺少 order 数组");
  const main = s.t.videoTracks[0];
  assertUnlocked(s, main);
  const map = new Map(main.clips.map((c) => [c.id, c]));
  const order = (op.order as unknown[]).filter((x): x is string => typeof x === "string");
  const unknown = order.filter((id) => !map.has(id));
  if (unknown.length) s.warnings.push("order 含不存在的 id：" + unknown.join("、"));
  const picked = new Set<string>();
  const next: Clip[] = [];
  for (const id of order) { const c = map.get(id); if (c && !picked.has(id)) { next.push(c); picked.add(id); } }
  // 未列出的片段保持原相对顺序接在后面（与 AI 不知情的新片段并存）
  for (const c of main.clips) if (!picked.has(c.id)) next.push(c);
  main.clips = next;
  for (const c of next) s.touched.add("clip:" + c.id);
}

function addTrackOp(s: Scope, op: Record<string, unknown>) {
  const kind = op.kind === "audio" ? "audio" : "video";
  const id = takeId(s, op.id, kind === "audio" ? "a" : "v");
  const name = typeof op.name === "string" && op.name ? op.name.slice(0, 30) : kind === "audio" ? "音频" : "画中画";
  if (kind === "video") {
    const at = clamp(Math.round(num(op.index) ?? s.t.videoTracks.length), 1, s.t.videoTracks.length);
    s.t.videoTracks.splice(at, 0, { id, name, clips: [] });
  } else {
    const at = clamp(Math.round(num(op.index) ?? s.t.audioTracks.length), 0, s.t.audioTracks.length);
    const role = ["music", "voice", "sfx"].includes(op.role as string) ? (op.role as AudioTrack["role"]) : undefined;
    s.t.audioTracks.splice(at, 0, { id, name, volume: clampOr(op.volume, 1, 0, 1), muted: false, ...(role ? { role } : {}), clips: [] });
  }
  s.touched.add("track:" + id);
}

function removeTrackOp(s: Scope, op: Record<string, unknown>) {
  const hit = findTrack(s.t, op.id);
  if (!hit) { s.warnings.push("轨道「" + String(op.id) + "」不存在"); return; }
  if (hit.kind === "video" && hit.index === 0) fail("主轨道不能删除");
  assertUnlocked(s, hit.track);
  for (const c of hit.track.clips) s.touched.add("clip:" + c.id);
  if (hit.kind === "video") s.t.videoTracks.splice(hit.index, 1); else s.t.audioTracks.splice(hit.index, 1);
  s.touched.add("track:" + hit.track.id);
}

function updateTrackOp(s: Scope, op: Record<string, unknown>) {
  const hit = findTrack(s.t, op.id);
  if (!hit) { s.warnings.push("轨道「" + String(op.id) + "」不存在"); return; }
  const p = isObj(op.patch) ? op.patch : {};
  const tr = hit.track as VideoTrack & AudioTrack;
  // 锁定状态本身可随时切换；其余属性在锁定时拒改
  const onlyLock = Object.keys(p).every((k) => k === "locked");
  if (!onlyLock) assertUnlocked(s, tr);
  if (typeof p.name === "string" && p.name.trim()) tr.name = p.name.trim().slice(0, 30);
  if ("locked" in p) setOpt(tr, "locked", p.locked ? true : null);
  if (hit.kind === "video") {
    if ("hidden" in p) setOpt(tr, "hidden", p.hidden ? true : null);
    if ("muted" in p) setOpt(tr, "muted", p.muted ? true : null);
  } else {
    if ("muted" in p) tr.muted = Boolean(p.muted);
    if ("volume" in p) tr.volume = clampOr(p.volume, tr.volume, 0, 1);
    if ("role" in p) setOpt(tr, "role", ["music", "voice", "sfx"].includes(p.role as string) ? (p.role as AudioTrack["role"]) : null);
    if ("duck" in p) {
      const d = p.duck;
      setOpt(tr, "duck", isObj(d) ? { level: clampOr(d.level, 0.3, 0, 1), ...(num(d.ramp) !== undefined ? { ramp: clampOr(d.ramp, 0.3, 0, 3) } : {}) } : null);
    }
  }
  s.touched.add("track:" + tr.id);
}

function moveTrackOp(s: Scope, op: Record<string, unknown>) {
  const hit = findTrack(s.t, op.id);
  if (!hit) { s.warnings.push("轨道「" + String(op.id) + "」不存在"); return; }
  const list = (hit.kind === "video" ? s.t.videoTracks : s.t.audioTracks) as (VideoTrack | AudioTrack)[];
  if (hit.kind === "video" && hit.index === 0) fail("主轨道固定在最底层");
  const lo = hit.kind === "video" ? 1 : 0;
  const to = clamp(Math.round(num(op.index) ?? hit.index), lo, list.length - 1);
  list.splice(hit.index, 1);
  list.splice(to, 0, hit.track);
  s.touched.add("track:" + hit.track.id);
}

function addOverlayOp(s: Scope, op: Record<string, unknown>) {
  if (typeof op.text !== "string") fail("addOverlay 缺少 text");
  const start = clampOr(op.startSeconds, 0, 0, 86400);
  const ov: Overlay = {
    id: takeId(s, op.id, "o"),
    text: String(op.text).slice(0, 2000),
    startSeconds: start,
    endSeconds: clampOr(op.endSeconds, start + 3, 0, 86400),
    position: ["top", "center", "bottom"].includes(op.position as string) ? (op.position as Overlay["position"]) : "bottom",
    fontSize: clampOr(op.fontSize, 48, 4, 2000),
    color: sanitizeColor(op.color) ?? "#ffffff",
  };
  const patch: Record<string, unknown> = {};
  for (const key of OVERLAY_KEYS) if (key in op && !["text", "startSeconds", "position", "fontSize", "color"].includes(key)) patch[key] = op[key];
  patch.endSeconds = ov.endSeconds;
  const at = num(op.index);
  if (at !== undefined) s.t.overlays.splice(clamp(Math.round(at), 0, s.t.overlays.length), 0, ov);
  else s.t.overlays.push(ov);
  patchOverlay(s, ov, patch);
  trackOfOverlayTouch(s, ov.id);
}

function keyframeOp(s: Scope, op: Record<string, unknown>, mode: "set" | "remove" | "clear") {
  const target = keyframeTarget(s, op.id);
  if (target.lock) assertUnlocked(s, target.lock);
  const channel = op.channel as string | undefined;
  if (mode !== "clear" || channel !== undefined) {
    if (!channel || !(ANIM_CHANNELS as readonly string[]).includes(channel)) fail("未知动画通道「" + String(channel) + "」，可用：" + ANIM_CHANNELS.join("/"));
    if (target.kind === "audio" && channel !== "volume") fail("音频片段只支持 volume 通道");
  }
  // 预设引用先烤成关键帧，之后的单帧编辑才有意义
  if (target.item.effects?.length && mode !== "clear") Object.assign(target.item, bakeEffects(target.item, target.duration));
  if (target.item.effects?.length === 0) delete target.item.effects;
  const anims: Record<string, Keyframe[]> = { ...(target.item.animations ?? {}) } as Record<string, Keyframe[]>;
  const half = frameOf(s.t) / 2;
  if (mode === "set") {
    const t = num(op.t);
    const v = num(op.v);
    if (t === undefined || v === undefined) fail("setKeyframe 需要 t（片段内相对秒）与 v");
    const kf = sanitizeKeyframes([{ t, v, e: op.e }], channel!)![0];
    const list = (anims[channel!] ?? []).filter((k) => Math.abs(k.t - kf.t) >= half);
    anims[channel!] = [...list, kf].sort((a, b) => a.t - b.t);
  } else if (mode === "remove") {
    const t = num(op.t);
    if (t === undefined) fail("removeKeyframe 需要 t");
    const before = anims[channel!]?.length ?? 0;
    anims[channel!] = (anims[channel!] ?? []).filter((k) => Math.abs(k.t - t!) >= half);
    if ((anims[channel!]?.length ?? 0) === before) s.warnings.push("该时间点没有关键帧");
    if (!anims[channel!].length) delete anims[channel!];
  } else if (channel) {
    delete anims[channel];
  } else {
    for (const k of Object.keys(anims)) delete anims[k];
    delete target.item.effects;
  }
  if (Object.keys(anims).length) target.item.animations = anims as Animations; else delete target.item.animations;
  s.touched.add(target.key);
}

function markerOp(s: Scope, op: Record<string, unknown>, mode: "add" | "update" | "remove") {
  const markers = (s.t.markers ??= []);
  if (mode === "add") {
    const m: Marker = { id: takeId(s, op.id, "m"), t: snapToFrame(s.t, clampOr(op.t, 0, 0, 86400)) };
    if (typeof op.label === "string" && op.label) m.label = op.label.slice(0, 80);
    const color = sanitizeColor(op.color);
    if (color) m.color = color;
    markers.push(m);
    markers.sort((a, b) => a.t - b.t);
    s.touched.add("marker:" + m.id);
    return;
  }
  const i = markers.findIndex((m) => m.id === op.id);
  if (i === -1) { s.warnings.push("标记「" + String(op.id) + "」不存在"); return; }
  if (mode === "remove") markers.splice(i, 1);
  else {
    const p = isObj(op.patch) ? op.patch : {};
    if ("t" in p) markers[i].t = snapToFrame(s.t, clampOr(p.t, markers[i].t, 0, 86400));
    if ("label" in p) setOpt(markers[i], "label", typeof p.label === "string" && p.label ? p.label.slice(0, 80) : null);
    if ("color" in p) setOpt(markers[i], "color", sanitizeColor(p.color) ?? null);
    markers.sort((a, b) => a.t - b.t);
  }
  s.touched.add("marker:" + String(op.id));
}

// ---- 底层 put：撤销/恢复专用，整实体写回到指定位置（存在则先移除） ----
function detachClip(t: Timeline, id: string) {
  for (const tr of t.videoTracks) { const i = tr.clips.findIndex((c) => c.id === id); if (i !== -1) { tr.clips.splice(i, 1); return; } }
  for (const tr of t.audioTracks) { const i = tr.clips.findIndex((c) => c.id === id); if (i !== -1) { tr.clips.splice(i, 1); return; } }
}

function putClipOp(s: Scope, op: Record<string, unknown>) {
  const clip = op.clip as (Clip & AudioClip) | undefined;
  if (!isObj(clip) || typeof clip.id !== "string") fail("putClip 缺少 clip");
  const track = findTrack(s.t, op.trackId);
  if (!track) fail("putClip 目标轨道「" + String(op.trackId) + "」不存在");
  detachClip(s.t, clip!.id);
  const list = track!.track.clips as unknown[];
  list.splice(clamp(Math.round(num(op.index) ?? list.length), 0, list.length), 0, structuredClone(clip));
  s.usedIds.add(clip!.id);
  s.touched.add("clip:" + clip!.id);
}

function putTrackOp(s: Scope, op: Record<string, unknown>) {
  const track = op.track as Record<string, unknown> | undefined;
  if (!isObj(track) || typeof track.id !== "string") fail("putTrack 缺少 track");
  const kind = op.kind === "audio" ? "audio" : "video";
  const list = (kind === "audio" ? s.t.audioTracks : s.t.videoTracks) as unknown as Record<string, unknown>[];
  const existing = list.findIndex((tr) => tr.id === track!.id);
  const props = { ...track! };
  delete props.clips;
  if (existing !== -1) {
    const clips = list[existing].clips;
    list.splice(existing, 1);
    const at = clamp(Math.round(num(op.index) ?? existing), kind === "video" ? Math.min(1, list.length) : 0, list.length);
    list.splice(at, 0, { ...props, clips });
  } else {
    const at = clamp(Math.round(num(op.index) ?? list.length), kind === "video" ? Math.min(1, list.length) : 0, list.length);
    list.splice(at, 0, { ...props, clips: Array.isArray(track!.clips) ? structuredClone(track!.clips) : [] });
  }
  s.usedIds.add(track!.id as string);
  s.touched.add("track:" + String(track!.id));
}

function putOverlayOp(s: Scope, op: Record<string, unknown>) {
  const ov = op.overlay as Overlay | undefined;
  if (!isObj(ov) || typeof ov.id !== "string") fail("putOverlay 缺少 overlay");
  const i = s.t.overlays.findIndex((o) => o.id === ov!.id);
  if (i !== -1) s.t.overlays.splice(i, 1);
  const at = clamp(Math.round(num(op.index) ?? s.t.overlays.length), 0, s.t.overlays.length);
  s.t.overlays.splice(at, 0, structuredClone(ov!));
  s.usedIds.add(ov!.id);
  trackOfOverlayTouch(s, ov!.id);
}

function putMarkerOp(s: Scope, op: Record<string, unknown>) {
  const m = op.marker as Marker | undefined;
  if (!isObj(m) || typeof m.id !== "string") fail("putMarker 缺少 marker");
  const markers = (s.t.markers ??= []);
  const i = markers.findIndex((x) => x.id === m!.id);
  if (i !== -1) markers.splice(i, 1);
  markers.push(structuredClone(m!));
  markers.sort((a, b) => a.t - b.t);
  s.touched.add("marker:" + m!.id);
}

function applyOne(s: Scope, op: Op) {
  const o = op as Record<string, unknown>;
  if (SYSTEM_OPS.has(op.op) && s.actor !== "system") fail("「" + op.op + "」是撤销/恢复专用的系统操作");
  switch (op.op) {
    case "addClip": return addClipOp(s, o);
    case "addAudio": return addAudioOp(s, o);
    case "removeClip":
    case "removeAudio": return removeClipOp(s, o);
    case "updateClip": {
      if (!isObj(o.patch)) fail("updateClip 缺少 patch 对象");
      const hit = findClip(s.t, o.id);
      if (!hit) {
        const ov = findOverlay(s.t, { id: o.id });
        if (ov) { patchOverlay(s, ov.overlay, o.patch as Record<string, unknown>); trackOfOverlayTouch(s, ov.overlay.id); return; }
        s.warnings.push("id「" + String(o.id) + "」不存在（视频/音频轨均无此片段）");
        return;
      }
      assertUnlocked(s, hit.track);
      if (hit.kind === "video") patchVideoClip(s, hit, o.patch as Record<string, unknown>);
      else patchAudioClip(s, hit, o.patch as Record<string, unknown>);
      s.touched.add("clip:" + hit.clip.id);
      return;
    }
    case "moveClip": return moveClipOp(s, o);
    case "reorderClips": return reorderClipsOp(s, o);
    case "splitClip": return splitClipOp(s, o);
    case "duplicateClip": return duplicateClipOp(s, o);
    case "updateAudioTrack":
    case "updateTrack": return updateTrackOp(s, o);
    case "addTrack": return addTrackOp(s, o);
    case "removeTrack": return removeTrackOp(s, o);
    case "moveTrack": return moveTrackOp(s, o);
    case "addOverlay": return addOverlayOp(s, o);
    case "removeOverlay": {
      const hit = findOverlay(s.t, o);
      if (!hit) { s.warnings.push(typeof o.id === "string" ? "字幕「" + o.id + "」不存在" : "字幕下标越界或 expectText 不匹配（当前共 " + s.t.overlays.length + " 条）"); return; }
      s.t.overlays.splice(hit.index, 1);
      trackOfOverlayTouch(s, hit.overlay.id);
      return;
    }
    case "updateOverlay": {
      if (!isObj(o.patch)) fail("updateOverlay 缺少 patch 对象");
      const hit = findOverlay(s.t, o);
      if (!hit) { s.warnings.push(typeof o.id === "string" ? "字幕「" + o.id + "」不存在" : "字幕下标越界或 expectText 不匹配（当前共 " + s.t.overlays.length + " 条）"); return; }
      patchOverlay(s, hit.overlay, o.patch as Record<string, unknown>);
      trackOfOverlayTouch(s, hit.overlay.id);
      return;
    }
    case "splitOverlay": return splitOverlayOp(s, o);
    case "setMeta": {
      const patch = sanitizeMetaPatch(isObj(o.patch) ? o.patch : o);
      if (!Object.keys(patch).length) fail("setMeta 缺少有效的 fps/width/height/background");
      Object.assign(s.t.meta, patch);
      s.touched.add("meta");
      return;
    }
    case "setKeyframe": return keyframeOp(s, o, "set");
    case "removeKeyframe": return keyframeOp(s, o, "remove");
    case "clearKeyframes": return keyframeOp(s, o, "clear");
    case "addMarker": return markerOp(s, o, "add");
    case "updateMarker": return markerOp(s, o, "update");
    case "removeMarker": return markerOp(s, o, "remove");
    case "putClip": return putClipOp(s, o);
    case "putTrack": return putTrackOp(s, o);
    case "putOverlay": return putOverlayOp(s, o);
    case "putMarker": return putMarkerOp(s, o);
    case "putMeta": {
      if (!isObj(o.meta)) fail("putMeta 缺少 meta");
      s.t.meta = structuredClone(o.meta) as Timeline["meta"];
      s.touched.add("meta");
      return;
    }
    case "replaceTimeline": {
      if (!isObj(o.timeline)) fail("replaceTimeline 缺少 timeline");
      const next = structuredClone(o.timeline) as unknown as Timeline;
      for (const key of Object.keys(s.t)) delete (s.t as unknown as Record<string, unknown>)[key];
      Object.assign(s.t, next);
      s.touched.add("*");
      return;
    }
    default:
      fail("未知操作「" + String((op as { op?: unknown }).op) + "」");
  }
}

/**
 * 依次应用一批操作（纯函数：输入时间线不被修改）。
 * 每条操作独立回执：格式错误/不可执行 → rejected 并给出原因，其余照常执行；
 * 部分字段被忽略 → partial；完全没有效果 → ignored。
 */
export function applyOps(timeline: Timeline, rawOps: readonly unknown[], ctx: OpContext = {}): ApplyResult {
  const t = structuredClone(timeline);
  t.markers ??= [];
  const usedIds = collectIds(t);
  const changed = new Set<string>();
  const receipts: Receipt[] = [];
  const actor = ctx.actor ?? "user";
  rawOps.forEach((raw, index) => {
    const { op, error } = normalizeOp(raw);
    if (!op) { receipts.push({ index, op: String(isObj(raw) ? raw.op ?? raw.type ?? "?" : "?"), status: "rejected", reason: error }); return; }
    const before = JSON.stringify(t);
    const s: Scope = { t, ctx, actor, touched: new Set(), warnings: [], newIds: [], usedIds };
    try {
      applyOne(s, op);
    } catch (e) {
      // 单条失败：回滚这一条的部分修改
      const restored = JSON.parse(before) as Timeline;
      for (const key of Object.keys(t)) delete (t as unknown as Record<string, unknown>)[key];
      Object.assign(t, restored);
      receipts.push({ index, op: op.op, status: "rejected", reason: e instanceof Error ? e.message : String(e) });
      return;
    }
    const effective = JSON.stringify(t) !== before;
    for (const key of s.touched) changed.add(key);
    const id = typeof (op as Record<string, unknown>).id === "string" ? ((op as Record<string, unknown>).id as string) : undefined;
    receipts.push({
      index,
      op: op.op,
      status: !effective ? "ignored" : s.warnings.length ? "partial" : "applied",
      ...(s.newIds.length === 1 ? { id: s.newIds[0] } : s.newIds.length ? { ids: s.newIds } : id ? { id } : {}),
      ...(s.newIds.length > 1 ? { id: op.op === "addClip" ? s.newIds[0] : s.newIds[s.newIds.length - 1] } : {}),
      ...(s.warnings.length ? { warnings: s.warnings } : !effective ? { reason: "没有产生变化" } : {}),
    });
  });
  return { timeline: t, receipts, changed: [...changed] };
}

/** 回执里新建实体的 id（便于调用方把乐观 id 对齐） */
export const receiptIds = (r: Receipt) => (r.ids ?? (r.id ? [r.id] : []));

export { clipLabel };
