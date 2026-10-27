// D剪 时间线操作（ops）——唯一的语义实现。
// 面板乐观更新、服务端权威应用、AI 工具都调用这里的 applyOps，保证三方行为一致。
// 纯函数、无 zod 依赖（浏览器包体友好）；服务端在应用后再用 validateTimeline 做严格校验。
import type { Animations, AudioClip, AudioTrack, Clip, Effect, Keyframe, Marker, Overlay, Timeline, VideoTrack } from "./schema.js";
import {
  ANIM_CHANNELS,
  BLEND_MODES,
  CHART_TYPES,
  DIRECTIONS,
  EASING_NAMES,
  ELEMENT_KINDS,
  FILTER_RANGES,
  LINE_SHAPES,
  LIST_STYLES,
  PLOT_ITEM_TYPES,
  SHAPE_TYPES,
  TEXT_EFFECTS,
  TRANSITION_TYPES,
  elementLabel,
  elementOrder,
  isBoxElement,
  mainTrackStarts,
  secToFrames,
  shiftAnimations,
  srcLabel,
} from "./timeline.js";
import { iconByName } from "./icons.js";
import { SLIDE_TEMPLATES, SLIDE_THEMES, buildSlide } from "./templates.js";
import { ANIMATION_PRESETS, presetGroup, resolveAnimations } from "./presets.js";
import { fontById } from "./fonts.js";
import { RESERVED_NAMES, analyzeExpr } from "./expr.js";
import { normalizeTex } from "./mathData.js";
import { parsePath } from "./paths.js";

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
  /** 检查 LaTeX（服务端提供）：有错返回描述，作为警告回给模型 */
  checkTex?: (tex: string) => string | undefined;
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
  "addOverlay", "removeOverlay", "updateOverlay", "splitOverlay", "arrangeOverlay", "transform",
  "addSlide", "updateGroup", "removeGroup",
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
  clipL: [0, 1], clipR: [0, 1], clipT: [0, 1], clipB: [0, 1], progress: [0, 1],
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

// ---------- v6 元素字段净化 ----------
const pick = <T extends string>(list: readonly T[], v: unknown): T | undefined => list.find((x) => x === v);
const shortStr = (v: unknown, max: number): string | undefined => (typeof v === "string" && v.trim() ? v.slice(0, max) : undefined);

type ShapeFill = NonNullable<NonNullable<Overlay["shape"]>["fill"]>;
export function sanitizeFill(v: unknown): ShapeFill | undefined {
  const solid = sanitizeColor(v);
  if (solid) return solid;
  if (!isObj(v) || !Array.isArray(v.stops)) return undefined;
  const stops = v.stops
    .map((s, i, all) => (isObj(s) ? { offset: clampOr(s.offset, all.length > 1 ? i / (all.length - 1) : 0, 0, 1), color: sanitizeColor(s.color) } : undefined))
    .filter((s): s is { offset: number; color: string } => Boolean(s?.color))
    .slice(0, 8);
  if (stops.length < 2) return stops[0]?.color;
  return { type: v.type === "radial" ? "radial" : "linear", ...(num(v.angle) !== undefined ? { angle: clampOr(v.angle, 0, -360, 360) } : {}), stops };
}

function sanitizeOutline(v: unknown, fallbackWidth = 2) {
  if (!isObj(v)) return undefined;
  const color = sanitizeColor(v.color);
  if (!color) return undefined;
  const dash = pick(["solid", "dashed", "dotted"] as const, v.dash);
  return { color, width: clampOr(v.width, fallbackWidth, 0, 200), ...(dash && dash !== "solid" ? { dash } : {}) };
}

export function sanitizeShape(v: unknown, prev?: Overlay["shape"]): Overlay["shape"] | undefined {
  const raw = typeof v === "string" ? { type: v } : v;
  if (!isObj(raw)) return undefined;
  const type = pick(SHAPE_TYPES, raw.type) ?? prev?.type ?? "rect";
  const out: NonNullable<Overlay["shape"]> = { type };
  const base: Partial<NonNullable<Overlay["shape"]>> = prev ?? {};
  const fill = "fill" in raw ? sanitizeFill(raw.fill) : base.fill;
  const stroke = "stroke" in raw ? sanitizeOutline(raw.stroke, 4) : base.stroke;
  if (fill !== undefined && raw.fill !== null) out.fill = fill;
  if (stroke && raw.stroke !== null) out.stroke = stroke;
  const radius = "radius" in raw ? num(raw.radius) : base.radius;
  if (radius !== undefined && raw.radius !== null) out.radius = clamp(radius, 0, 2000);
  const points = "points" in raw ? num(raw.points) : base.points;
  if (points !== undefined && raw.points !== null) out.points = clamp(Math.round(points), 3, 24);
  const inner = "inner" in raw ? num(raw.inner) : base.inner;
  if (inner !== undefined && raw.inner !== null) out.inner = clamp(inner, 0.05, 0.95);
  let open = (LINE_SHAPES as readonly string[]).includes(type);
  if (type === "path") {
    // 自由路径：path（SVG 路径，盒子 0–100 坐标）或 vertices（顶点）
    const path = "path" in raw ? (typeof raw.path === "string" ? raw.path.trim().slice(0, 4000) : undefined) : base.path;
    if (path && raw.path !== null && parsePath(path).length) out.path = path;
    const verts = "vertices" in raw ? raw.vertices : base.vertices;
    if (Array.isArray(verts) && raw.vertices !== null) {
      const list = verts.map((p) => (Array.isArray(p) && p.length === 2 && num(p[0]) !== undefined && num(p[1]) !== undefined ? [clamp(num(p[0])!, -1000, 1100), clamp(num(p[1])!, -1000, 1100)] as [number, number] : undefined))
        .filter((p): p is [number, number] => Boolean(p)).slice(0, 200);
      if (list.length >= 2) out.vertices = list;
    }
    if (!out.path && !out.vertices) out.path = "M0,80 C30,0 70,100 100,20";
    for (const k of ["closed", "smooth"] as const) { const b = k in raw ? bool(raw[k]) : base[k]; if (b) out[k] = true; }
    const arrow = "arrow" in raw ? pick(["start", "end", "both"] as const, raw.arrow) : base.arrow;
    if (arrow) out.arrow = arrow;
    open = out.vertices ? !out.closed : !/z/i.test(out.path ?? "");
  }
  // 既无填充也无描边：闭合形状给默认蓝色填充，线条/开放路径给白色描边
  if (out.fill === undefined && !out.stroke) {
    if (open) out.stroke = { color: "#ffffff", width: 6 };
    else out.fill = "#3b82f6";
  }
  return out;
}

function sanitizeImageSpec(s: Scope, v: unknown, prev?: Overlay["image"]): Overlay["image"] | undefined {
  const raw = typeof v === "string" ? { src: v } : v;
  if (!isObj(raw)) return undefined;
  const src = "src" in raw ? checkAsset(s, raw.src) : prev?.src;
  if (!src) fail("图片元素缺少 image.src（素材文件名）");
  const out: NonNullable<Overlay["image"]> = { src: src! };
  const fit = "fit" in raw ? pick(["cover", "contain", "fill"] as const, raw.fit) : prev?.fit;
  if (fit) out.fit = fit;
  const radius = "radius" in raw ? num(raw.radius) : prev?.radius;
  if (radius !== undefined && raw.radius !== null) out.radius = clamp(radius, 0, 2000);
  const border = "border" in raw ? sanitizeOutline(raw.border) : prev?.border;
  if (border && raw.border !== null) out.border = border;
  return out;
}

function sanitizeIcon(s: Scope, v: unknown, prev?: Overlay["icon"]): Overlay["icon"] | undefined {
  const raw = typeof v === "string" ? { name: v } : v;
  if (!isObj(raw)) return undefined;
  const name = "name" in raw ? shortStr(raw.name, 60)?.trim() : prev?.name;
  if (!name) fail("图标元素缺少 icon.name");
  if (!iconByName(name)) s.warnings.push("内置图标里没有「" + name + "」，会显示为占位框；可用 djian_catalog{what:\"icons\"} 查看图标名");
  const out: NonNullable<Overlay["icon"]> = { name: name! };
  const sw = "strokeWidth" in raw ? num(raw.strokeWidth) : prev?.strokeWidth;
  if (sw !== undefined && raw.strokeWidth !== null) out.strokeWidth = clamp(sw, 0.25, 6);
  const fill = "fill" in raw ? sanitizeColor(raw.fill) : prev?.fill;
  if (fill && raw.fill !== null) out.fill = fill;
  return out;
}

export function sanitizeChart(v: unknown, prev?: Overlay["chart"]): Overlay["chart"] | undefined {
  if (!isObj(v)) return undefined;
  const type = pick(CHART_TYPES, v.type) ?? prev?.type ?? "column";
  const rawData = Array.isArray(v.data) ? v.data : prev?.data ?? [];
  const data = rawData
    .map((d) => {
      if (typeof d === "number") return { value: d };
      if (!isObj(d)) return undefined;
      const value = num(d.value);
      if (value === undefined) return undefined;
      const label = shortStr(d.label, 60), color = sanitizeColor(d.color);
      return { value, ...(label ? { label } : {}), ...(color ? { color } : {}) };
    })
    .filter((d): d is { value: number; label?: string; color?: string } => Boolean(d))
    .slice(0, 24);
  if (!data.length) fail("图表需要 data 数组（每项 {label, value}）");
  const out: NonNullable<Overlay["chart"]> = { type, data };
  const base = (prev ?? {}) as Record<string, unknown>;
  const val = (k: string) => (k in v ? v[k] : base[k]);
  const max = num(val("max"));
  if (max !== undefined && max > 0) out.max = max;
  const colors = val("colors");
  if (Array.isArray(colors)) {
    const list = colors.map((c) => sanitizeColor(c)).filter((c): c is string => Boolean(c)).slice(0, 12);
    if (list.length) out.colors = list;
  }
  for (const key of ["showValues", "showLabels"] as const) { const b = bool(val(key)); if (b !== undefined) out[key] = b; }
  for (const key of ["prefix", "unit"] as const) { const t = val(key); if (typeof t === "string" && t) out[key] = t.slice(0, 12); }
  const dec = num(val("decimals"));
  if (dec !== undefined) out.decimals = clamp(Math.round(dec), 0, 4);
  const track = sanitizeColor(val("trackColor"));
  if (track) out.trackColor = track;
  const thick = num(val("thickness"));
  if (thick !== undefined) out.thickness = clamp(thick, 0.02, 1);
  return out;
}

function sanitizeCounter(v: unknown): Overlay["counter"] | undefined {
  if (!isObj(v)) return undefined;
  const to = num(v.to);
  if (to === undefined) return undefined;
  const out: NonNullable<Overlay["counter"]> = { from: num(v.from) ?? 0, to };
  const dec = num(v.decimals);
  if (dec !== undefined) out.decimals = clamp(Math.round(dec), 0, 4);
  for (const key of ["prefix", "suffix"] as const) { const t = v[key]; if (typeof t === "string" && t) out[key] = t.slice(0, 12); }
  if (bool(v.separator)) out.separator = true;
  return out;
}

function sanitizeTextEffect(v: unknown): Overlay["textEffect"] | undefined {
  const raw = typeof v === "string" ? { type: v } : v;
  if (!isObj(raw)) return undefined;
  const type = pick(TEXT_EFFECTS, raw.type);
  if (!type) return undefined;
  const by = pick(["char", "word", "line"] as const, raw.by);
  return {
    type,
    ...(by ? { by } : {}),
    ...(num(raw.interval) !== undefined ? { interval: clampOr(raw.interval, 0.04, 0, 2) } : {}),
    ...(num(raw.duration) !== undefined ? { duration: clampOr(raw.duration, 0.4, 0.02, 5) } : {}),
  };
}

// ---------- v7 坐标系 / 变形 ----------
const NAME_RE = /^[A-Za-z][A-Za-z0-9_]{0,11}$/;
const DEFAULT_PLOT = { x: [-5, 5] as [number, number], y: [-3, 3] as [number, number] };
// 各类对象的表达式里可用的自变量（参数、带 id 的函数名之外）
const ITEM_VARS: Record<string, Partial<Record<string, string>>> = {
  fn: { fn: "x" }, param: { fx: "t", fy: "t" }, polar: { fn: "t" },
};
const exprOrNum = (v: unknown): number | string | undefined => {
  const n = typeof v === "number" && Number.isFinite(v) ? v : undefined;
  if (n !== undefined) return n;
  return typeof v === "string" && v.trim() ? v.trim().slice(0, 200) : undefined;
};

/** 坐标系净化：坏表达式/未定义的名字给警告（模型据此自查），主表达式坏掉的对象丢弃 */
export function sanitizePlot(v: unknown, prev: Overlay["plot"] | undefined, warnings: string[]): Overlay["plot"] | undefined {
  if (!isObj(v)) return undefined;
  const base = prev ?? { ...DEFAULT_PLOT, items: [] };
  const range = (r: unknown, fallback: [number, number], name: string): [number, number] => {
    if (!Array.isArray(r) || r.length !== 2) return fallback;
    const a = num(r[0]), b = num(r[1]);
    if (a === undefined || b === undefined || a === b) { warnings.push(name + " 范围无效，保持 [" + fallback.join(", ") + "]"); return fallback; }
    return a < b ? [clamp(a, -1e6, 1e6), clamp(b, -1e6, 1e6)] : [clamp(b, -1e6, 1e6), clamp(a, -1e6, 1e6)];
  };
  const out: NonNullable<Overlay["plot"]> = { x: "x" in v ? range(v.x, base.x, "x") : base.x, y: "y" in v ? range(v.y, base.y, "y") : base.y, items: [] };
  const val = (k: string) => (k in v ? v[k] : (base as Record<string, unknown>)[k]);
  for (const k of ["xStep", "yStep"] as const) { const n = num(val(k)); if (n !== undefined && n > 0 && val(k) !== null) out[k] = n; }
  for (const k of ["grid", "axes", "ticks", "numbers"] as const) { const b = bool(val(k)); if (b !== undefined) out[k] = b; }
  for (const k of ["xLabel", "yLabel"] as const) { const s2 = shortStr(val(k), 60); if (s2) out[k] = s2; }
  for (const k of ["axisColor", "gridColor"] as const) { const c = sanitizeColor(val(k)); if (c) out[k] = c; }
  // 参数：常数或关键帧
  const rawParams = val("params");
  if (isObj(rawParams)) {
    const params: NonNullable<NonNullable<Overlay["plot"]>["params"]> = {};
    for (const [name, pv] of Object.entries(rawParams).slice(0, 8)) {
      if (!NAME_RE.test(name) || RESERVED_NAMES.has(name) || name === "x" || name === "t") { warnings.push("参数名「" + name + "」不可用（需字母开头，且不能是 x/t/pi/e 或函数名）"); continue; }
      const n = num(pv);
      const kfs = n === undefined ? sanitizeKeyframes(pv, "param") : undefined;
      if (n !== undefined) params[name] = n;
      else if (kfs) params[name] = kfs.slice(0, 64);
      else warnings.push("参数「" + name + "」要写成数值或关键帧 [{t,v,e?}]");
    }
    if (Object.keys(params).length) out.params = params;
  }
  const paramNames = new Set(Object.keys(out.params ?? {}));
  const rawItems = "items" in v ? v.items : base.items;
  const list = Array.isArray(rawItems) ? rawItems.slice(0, 24) : [];
  // 先收集函数 id，表达式里可以互相引用
  const fnIds = new Set<string>();
  for (const it of list) if (isObj(it) && (it.type === "fn" || (!it.type && it.fn)) && typeof it.id === "string" && NAME_RE.test(it.id) && !RESERVED_NAMES.has(it.id)) fnIds.add(it.id);
  list.forEach((raw, i) => {
    if (!isObj(raw)) return;
    const type = pick(PLOT_ITEM_TYPES, raw.type) ?? (raw.fn !== undefined ? "fn" : raw.fx !== undefined ? "param" : raw.x !== undefined && raw.y !== undefined ? "point" : undefined);
    if (!type) { warnings.push("坐标系第 " + (i + 1) + " 项缺少 type"); return; }
    const it: Record<string, unknown> = { type };
    const where = "坐标系第 " + (i + 1) + " 项（" + type + "）";
    let broken = false;
    const check = (key: string, value: number | string | undefined) => {
      if (typeof value !== "string") return value;
      const own = ITEM_VARS[type]?.[key];
      try {
        const { vars, calls } = analyzeExpr(key === "fn" || key === "fx" || key === "fy" ? stripLhsExpr(value) : value, fnIds);
        const unknown = [...vars].filter((n) => !paramNames.has(n) && n !== own);
        if (unknown.length) warnings.push(where + " 的 " + key + "「" + value + "」用到未定义的 " + unknown.join("、") + (own ? "（自变量是 " + own + "）" : "") + "，请在 params 里定义");
        const missing = [...calls].filter((n) => !fnIds.has(n));
        if (missing.length) warnings.push(where + " 调用了不存在的函数 " + missing.join("、"));
        return value;
      } catch (e) {
        warnings.push(where + " 的 " + key + "「" + value + "」无法解析：" + (e instanceof Error ? e.message : String(e)));
        if (key === "fn" || key === "fx" || key === "fy") broken = true;
        return undefined;
      }
    };
    if (typeof raw.id === "string" && fnIds.has(raw.id) && type === "fn") it.id = raw.id;
    for (const key of ["fn", "fx", "fy"] as const) if (typeof raw[key] === "string") { const e = check(key, String(raw[key]).trim().slice(0, 200)); if (e !== undefined) it[key] = e; }
    for (const key of ["x", "y", "x0", "y0", "from", "to", "n"] as const) { const e = check(key, exprOrNum(raw[key])); if (e !== undefined) it[key] = e; }
    for (const key of ["t", "domain"] as const) {
      const r = raw[key];
      if (Array.isArray(r) && r.length === 2) {
        const a = check(key, exprOrNum(r[0])), b = check(key, exprOrNum(r[1]));
        if (a !== undefined && b !== undefined) it[key] = [a, b];
      }
    }
    if ((type === "fn" || type === "polar") && !it.fn) broken = true;
    if (type === "param" && (!it.fx || !it.fy)) broken = true;
    if (broken) { warnings.push(where + " 缺少可用的函数表达式，已忽略"); return; }
    if (typeof raw.of === "string" && fnIds.has(raw.of)) it.of = raw.of;
    else if (raw.of !== undefined) warnings.push(where + " 的 of「" + String(raw.of) + "」不是已定义的函数 id");
    const color = sanitizeColor(raw.color);
    if (color) it.color = color;
    const ranges = { width: [0.5, 40], size: [1, 60], opacity: [0, 1], length: [0.01, 1000], start: [0, 3600], draw: [0, 30], end: [0, 3600] } as const;
    for (const [k, [lo, hi]] of Object.entries(ranges)) { const n = num(raw[k]); if (n !== undefined) it[k] = clamp(n, lo, hi); }
    for (const k of ["dash", "guides"] as const) if (raw[k] === true) it[k] = true;
    const label = shortStr(raw.label, 120);
    if (label) it.label = label;
    out.items.push(it as NonNullable<Overlay["plot"]>["items"][number]);
  });
  return out;
}
const stripLhsExpr = (s: string) => s.replace(/^\s*(?:[A-Za-z]\w*\s*\(\s*[A-Za-zθ]\s*\)|y|r)\s*=\s*/, "");

function sanitizeMorph(s: Scope, v: unknown, self: Overlay): Overlay["morph"] | undefined {
  const raw = typeof v === "string" ? { from: v } : v;
  if (!isObj(raw)) return undefined;
  const from = typeof raw.from === "string" ? raw.from : "";
  const src = s.t.overlays.find((o) => o.id === from);
  if (!src || from === self.id) { s.warnings.push("变形来源「" + from + "」不存在或就是自己，已忽略"); return undefined; }
  if (src.kind === "camera") { s.warnings.push("镜头不能作为变形来源"); return undefined; }
  if (src.endSeconds > self.startSeconds + frameOf(s.t)) s.warnings.push("变形来源「" + elementLabel(src) + "」在 " + src.endSeconds + "s 才结束，变形期间两者会同时出现；通常让它在本元素开始时（" + self.startSeconds + "s）结束");
  const ease = sanitizeEasing(raw.ease);
  return { from, ...(num(raw.duration) !== undefined ? { duration: clampOr(raw.duration, 1, 0.1, 10) } : {}), ...(ease !== undefined ? { ease } : {}) };
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
    fail("素材库里没有「" + name + "」（素材按项目隔离）：先用 djian_assets 确认文件名，缺少的素材请先 djian_import_asset 导入");
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

const OVERLAY_KEYS = new Set(["text", "startSeconds", "endSeconds", "position", "fontSize", "color", "fontFamily", "fontWeight", "animations", "animationPreset", "effects", "x", "y", "align", "maxWidth", "lineHeight", "letterSpacing", "italic", "underline", "stroke", "shadow", "background", "kind", "track",
  "name", "group", "w", "h", "rotate", "opacity", "valign", "padding", "list", "accent", "counter", "textEffect", "shape", "image", "icon", "chart",
  "plot", "morph", "tex"]);
const BOX_FIELDS = { shape: "shape", image: "image", icon: "icon", chart: "chart", plot: "plot" } as const;

function patchOverlay(s: Scope, ov: Overlay, patch: Record<string, unknown>) {
  const frame = frameOf(s.t);
  for (const key of Object.keys(patch)) if (!OVERLAY_KEYS.has(key)) s.warnings.push("元素忽略字段「" + key + "」");
  if ("text" in patch) ov.text = String(patch.text ?? "").slice(0, 2000);
  if (typeof patch.tex === "string") { ov.text = patch.tex.slice(0, 2000); if (!("kind" in patch) && !ov.kind) patch = { ...patch, kind: "math" }; }
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
  for (const key of ["x", "y"] as const) if (key in patch) setOpt(ov, key, patch[key] === null ? null : Math.round(clampOr(patch[key], 0.5, -1, 2) * 10000) / 10000);
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
  if ("track" in patch) setOpt(ov, "track", patch.track === null ? null : clamp(Math.round(num(patch.track) ?? 0), 0, 31));
  // ---- v6 元素 ----
  if ("name" in patch) setOpt(ov, "name", shortStr(patch.name, 40) ?? null);
  if ("group" in patch) setOpt(ov, "group", typeof patch.group === "string" && ID_RE.test(patch.group) ? patch.group : null);
  for (const key of ["w", "h"] as const) if (key in patch) setOpt(ov, key, patch[key] === null ? null : Math.round(clampOr(patch[key], 0.2, 0.002, 4) * 10000) / 10000);
  if ("rotate" in patch) { const r = num(patch.rotate); setOpt(ov, "rotate", r === undefined || r === 0 ? null : clamp(r, -3600, 3600)); }
  if ("opacity" in patch) { const o = num(patch.opacity); setOpt(ov, "opacity", o === undefined || o >= 1 ? null : clamp(o, 0, 1)); }
  if ("valign" in patch) setOpt(ov, "valign", pick(["top", "middle", "bottom"] as const, patch.valign) ?? null);
  if ("padding" in patch) setOpt(ov, "padding", patch.padding === null ? null : clampOr(patch.padding, 0, 0, 1000));
  if ("list" in patch) setOpt(ov, "list", pick(LIST_STYLES, patch.list) ?? null);
  if ("accent" in patch) setOpt(ov, "accent", sanitizeColor(patch.accent) ?? null);
  if ("counter" in patch) setOpt(ov, "counter", sanitizeCounter(patch.counter) ?? null);
  if ("textEffect" in patch) setOpt(ov, "textEffect", sanitizeTextEffect(patch.textEffect) ?? null);
  if ("shape" in patch) setOpt(ov, "shape", patch.shape === null ? null : sanitizeShape(patch.shape, ov.shape) ?? ov.shape);
  if ("image" in patch) setOpt(ov, "image", patch.image === null ? null : sanitizeImageSpec(s, patch.image, ov.image) ?? ov.image);
  if ("icon" in patch) setOpt(ov, "icon", patch.icon === null ? null : sanitizeIcon(s, patch.icon, ov.icon) ?? ov.icon);
  if ("chart" in patch) setOpt(ov, "chart", patch.chart === null ? null : sanitizeChart(patch.chart, ov.chart) ?? ov.chart);
  if ("plot" in patch) setOpt(ov, "plot", patch.plot === null ? null : sanitizePlot(patch.plot, ov.plot, s.warnings) ?? ov.plot);
  if ("kind" in patch) setOpt(ov, "kind", pick(ELEMENT_KINDS, patch.kind) ?? null);
  // 给了 shape/image/icon/chart/plot 却没指定 kind：按内容推断
  if (!("kind" in patch) && !isBoxElement(ov)) {
    for (const key of Object.keys(BOX_FIELDS) as (keyof typeof BOX_FIELDS)[]) if (key in patch && ov[key]) { ov.kind = key; break; }
  }
  if ("morph" in patch) setOpt(ov, "morph", patch.morph === null ? null : sanitizeMorph(s, patch.morph, ov) ?? null);
  if (ov.kind === "shape" && !ov.shape) ov.shape = sanitizeShape({ type: "rect" });
  if (ov.kind === "image" && !ov.image) fail("图片元素需要 image:{src}（素材文件名）");
  if (ov.kind === "icon" && !ov.icon) fail("图标元素需要 icon:{name}");
  if (ov.kind === "chart" && !ov.chart) fail("图表元素需要 chart:{type, data}");
  if (ov.kind === "plot" && !ov.plot) ov.plot = { ...DEFAULT_PLOT, items: [] };
  if (ov.kind === "math") {
    ov.text = normalizeTex(ov.text);
    if (!ov.text) fail("公式元素需要 text（LaTeX，如 \\frac{a}{b}）");
    if ("text" in patch || "tex" in patch || "kind" in patch) {
      const err = s.ctx.checkTex?.(ov.text);
      if (err) s.warnings.push("公式「" + ov.text.slice(0, 40) + "」" + err + "（画面上会显示红色错误框）");
    }
  }
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
  delete right.morph; // 变形只发生在左半段开头
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

const BOX_KIND_DEFAULT_W: Record<string, number> = { shape: 0.25, image: 0.4, icon: 0.08, chart: 0.5, text: 0.5, plot: 0.6 };
const DEFAULT_FONT_SIZE: Record<string, number> = { chart: 28, plot: 28, text: 40, math: 72 };

/** 新建一个元素（addOverlay 与幻灯片模板共用）：按 kind 补缺省尺寸与样式，插到 index（缺省末尾 = 最上层） */
function createOverlay(s: Scope, op: Record<string, unknown>, index?: number): Overlay {
  const inferred = pick(ELEMENT_KINDS, op.kind)
    ?? (op.shape !== undefined ? "shape" : op.image !== undefined ? "image" : op.icon !== undefined ? "icon" : op.chart !== undefined ? "chart"
      : op.plot !== undefined ? "plot" : typeof op.tex === "string" ? "math" : undefined);
  const boxKind = inferred === "shape" || inferred === "image" || inferred === "icon" || inferred === "chart" || inferred === "plot";
  const tex = typeof op.tex === "string" ? op.tex : undefined;
  if (typeof op.text !== "string" && tex === undefined && !boxKind && inferred !== "camera" && !isObj(op.counter)) fail("addOverlay 缺少 text（形状/图片/图标/图表/坐标系/镜头元素可省略；公式写 LaTeX）");
  // 镜头没给时间时覆盖整组（一页幻灯片）
  const groupEls = inferred === "camera" && typeof op.group === "string" ? s.t.overlays.filter((o) => o.group === op.group) : [];
  const start = clampOr(op.startSeconds, groupEls.length ? Math.min(...groupEls.map((o) => o.startSeconds)) : 0, 0, 86400);
  const { width: W, height: H } = s.t.meta;
  const ov: Overlay = {
    id: takeId(s, op.id, "o"),
    text: tex ?? (typeof op.text === "string" ? op.text.slice(0, 2000) : ""),
    startSeconds: start,
    endSeconds: clampOr(op.endSeconds, groupEls.length ? Math.max(...groupEls.map((o) => o.endSeconds)) : start + 3, 0, 86400),
    position: ["top", "center", "bottom"].includes(op.position as string) ? (op.position as Overlay["position"]) : "bottom",
    fontSize: clampOr(op.fontSize, DEFAULT_FONT_SIZE[inferred ?? ""] ?? 48, 4, 2000),
    color: sanitizeColor(op.color) ?? "#ffffff",
  };
  const patch: Record<string, unknown> = {};
  for (const key of OVERLAY_KEYS) if (key in op && !["text", "tex", "startSeconds", "position", "fontSize", "color"].includes(key)) patch[key] = op[key];
  patch.endSeconds = ov.endSeconds;
  if (inferred && !("kind" in op)) patch.kind = inferred;
  if (boxKind || inferred === "text" || inferred === "math" || inferred === "camera") {
    if (!("x" in op)) patch.x = 0.5;
    if (!("y" in op)) patch.y = 0.5;
  }
  if (inferred === "camera" && !("w" in op)) patch.w = 1;
  if (boxKind || inferred === "text") {
    if (!("w" in op)) patch.w = BOX_KIND_DEFAULT_W[inferred!] ?? 0.25;
    if (!("h" in op) && boxKind) {
      const w = clampOr(patch.w, 0.25, 0.002, 4);
      const shapeType = typeof op.shape === "string" ? op.shape : isObj(op.shape) ? op.shape.type : undefined;
      patch.h = (LINE_SHAPES as readonly string[]).includes(String(shapeType)) ? Math.max(0.004, 24 / H)
        : inferred === "chart" ? 0.45 : inferred === "image" ? 0.4
        : inferred === "plot" ? Math.min(4, (w * W) / H / 1.6) // 坐标系缺省 16:10
        : Math.min(4, (w * W) / H); // 缺省按像素等宽（正方形/圆）
    }
  }
  const at = index ?? num(op.index);
  if (at !== undefined) s.t.overlays.splice(clamp(Math.round(at), 0, s.t.overlays.length), 0, ov);
  else s.t.overlays.push(ov);
  patchOverlay(s, ov, patch);
  trackOfOverlayTouch(s, ov.id);
  return ov;
}

function addOverlayOp(s: Scope, op: Record<string, unknown>) {
  createOverlay(s, op);
}

/**
 * 变形：在 atSeconds 把元素 A 变成「A + patch」。A 在该时刻结束，新元素 B 从该时刻开始，
 * 开头 duration 秒从 A 连续变成 B（公式推导、形状变形、函数变形……）。可以对 B 继续 transform 形成一串变化。
 */
function transformOp(s: Scope, op: Record<string, unknown>) {
  const hit = findOverlay(s.t, op);
  if (!hit) fail("找不到要变形的元素「" + String(op.id) + "」");
  const A = hit!.overlay;
  if (A.kind === "camera") fail("镜头不能变形；移动镜头请给它打 x/y/scale 关键帧");
  const frame = frameOf(s.t);
  const at = snapToFrame(s.t, clampOr(op.atSeconds ?? op.startSeconds, A.endSeconds, 0, 86400));
  if (at < A.startSeconds + frame || at > A.endSeconds + frame / 2) fail("atSeconds 必须在元素区间内（" + A.startSeconds + "–" + A.endSeconds + "s）");
  const origEnd = A.endSeconds;
  const end = Math.max(at + frame, clampOr(op.endSeconds, at < origEnd - frame / 2 ? origEnd : at + 3, 0, 86400));
  const off = at - A.startSeconds;
  // B 继承 A 的样子：显式关键帧平移到新起点（progress 去掉，B 一出现就是完整的），预设只留出场/循环
  const B: Overlay = { ...structuredClone(A), id: takeId(s, op.newId, "o"), startSeconds: at, endSeconds: end };
  delete B.morph;
  if (A.animations) {
    const shifted = shiftAnimations(A.animations, off) as Record<string, Keyframe[] | undefined> | undefined;
    if (shifted) delete shifted.progress;
    if (shifted && Object.values(shifted).some((k) => k?.length)) B.animations = shifted as Animations; else delete B.animations;
  }
  const keepB = (e: Effect) => ["出场", "循环"].includes(presetGroup(e.preset) ?? "");
  if (B.effects) { B.effects = B.effects.filter(keepB); if (!B.effects.length) delete B.effects; }
  if (A.effects) { const kept = A.effects.filter((e) => presetGroup(e.preset) !== "出场"); if (kept.length) A.effects = kept; else delete A.effects; }
  A.endSeconds = at;
  s.t.overlays.splice(hit!.index + 1, 0, B);
  trackOfOverlayTouch(s, A.id);
  if (isObj(op.patch)) patchOverlay(s, B, op.patch as Record<string, unknown>);
  const ease = sanitizeEasing(op.ease);
  B.morph = { from: A.id, duration: clampOr(op.duration, 1, 0.1, Math.max(0.1, Math.min(10, end - at))), ...(ease !== undefined ? { ease } : {}) };
  trackOfOverlayTouch(s, B.id);
}

/** 删掉元素后，把以它为变形来源的元素改回普通入场 */
function dropMorphRefs(s: Scope, removed: Set<string>) {
  for (const o of s.t.overlays) if (o.morph && removed.has(o.morph.from)) { delete o.morph; trackOfOverlayTouch(s, o.id); }
}

/** 叠放顺序：front 置顶 / back 置底 / forward 上移一层 / backward 下移一层（只与时间上重叠的元素比较） */
function arrangeOverlayOp(s: Scope, op: Record<string, unknown>) {
  const hit = findOverlay(s.t, op);
  if (!hit) { s.warnings.push("元素「" + String(op.id) + "」不存在"); return; }
  const to = pick(["front", "back", "forward", "backward"] as const, op.to);
  if (!to) fail("arrangeOverlay 需要 to：front/back/forward/backward");
  const ov = hit.overlay;
  if (ov.kind === "subtitle") s.warnings.push("字幕始终显示在最上层，层级只在字幕之间生效");
  const peers = (o: Overlay) => o !== ov && (o.kind === "subtitle") === (ov.kind === "subtitle") && o.startSeconds < ov.endSeconds && o.endSeconds > ov.startSeconds;
  const order = elementOrder(s.t.overlays);
  const idx = order.indexOf(ov);
  const place = (track: number, ref: Overlay | null, after: boolean) => {
    s.t.overlays.splice(s.t.overlays.indexOf(ov), 1);
    setOpt(ov, "track", track ? track : null);
    if (!ref) { if (after) s.t.overlays.push(ov); else s.t.overlays.unshift(ov); return; }
    const ri = s.t.overlays.indexOf(ref);
    s.t.overlays.splice(after ? ri + 1 : ri, 0, ov);
  };
  const others = s.t.overlays.filter(peers);
  if (!others.length) { s.warnings.push("这段时间里没有与它重叠的元素，层级不变"); return; }
  if (to === "front") place(Math.max(ov.track ?? 0, ...others.map((o) => o.track ?? 0)), null, true);
  else if (to === "back") place(Math.min(ov.track ?? 0, ...others.map((o) => o.track ?? 0)), null, false);
  else {
    const next = to === "forward" ? order.slice(idx + 1).find(peers) : order.slice(0, idx).reverse().find(peers);
    if (!next) { s.warnings.push(to === "forward" ? "已经在最上层" : "已经在最下层"); return; }
    place(next.track ?? 0, next, to === "forward");
  }
  trackOfOverlayTouch(s, ov.id);
}

const slideStr = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : typeof v === "number" ? String(v) : undefined);
function sanitizeSlideItems(v: unknown) {
  if (!Array.isArray(v)) return undefined;
  return v.slice(0, 8).map((it) => {
    if (typeof it === "string" || typeof it === "number") return { title: String(it).slice(0, 120) };
    if (!isObj(it)) return {};
    const out: Record<string, unknown> = {};
    for (const [k, max] of [["title", 120], ["text", 600], ["prefix", 12], ["suffix", 12], ["icon", 60], ["image", 200], ["label", 60]] as const) {
      const sv = slideStr(it[k], max);
      if (sv !== undefined) out[k] = sv;
    }
    const value = num(it.value);
    if (value !== undefined) out.value = value;
    return out;
  });
}

/** 插入一页幻灯片：模板展开成一组元素（同 group），缺省放在最下层，作为“背景层” */
function addSlideOp(s: Scope, op: Record<string, unknown>) {
  const template = typeof op.template === "string" ? op.template : "";
  if (!SLIDE_TEMPLATES[template]) fail("未知幻灯片模板「" + template + "」，可用：" + Object.keys(SLIDE_TEMPLATES).join("/"));
  const theme = typeof op.theme === "string" && SLIDE_THEMES[op.theme] ? op.theme : "light";
  if (op.theme !== undefined && theme !== op.theme) s.warnings.push("未知主题「" + String(op.theme) + "」，已用 light；可用：" + Object.keys(SLIDE_THEMES).join("/"));
  const start = snapToFrame(s.t, clampOr(op.startSeconds ?? op.atSeconds, 0, 0, 86400));
  const end = start + Math.max(frameOf(s.t) * 2, clampOr(op.duration, 5, 0.2, 3600));
  let image = typeof op.image === "string" ? op.image : undefined;
  if (image && s.ctx.assetExists && !s.ctx.assetExists(image)) {
    s.warnings.push("素材库里没有「" + image + "」，图片位置先放占位框");
    image = undefined;
  }
  const items = sanitizeSlideItems(op.items)?.map((it) => {
    if (it.image && s.ctx.assetExists && !s.ctx.assetExists(String(it.image))) delete it.image;
    return it;
  });
  const elements = buildSlide({
    template, theme,
    title: slideStr(op.title, 200), subtitle: slideStr(op.subtitle, 300), kicker: slideStr(op.kicker, 80),
    items, background: op.background !== false, accent: sanitizeColor(op.accent),
    chart: typeof op.chart === "string" ? op.chart : undefined, image, icon: typeof op.icon === "string" ? op.icon : undefined,
    formula: slideStr(op.formula ?? op.tex, 1000), fn: slideStr(op.fn, 400),
  }, s.t.meta);
  const group = takeId(s, op.id, "s");
  const track = clamp(Math.round(num(op.track) ?? 0), 0, 31);
  let at = op.layer === "top" ? s.t.overlays.length : 0;
  elements.forEach((el, i) => {
    const { delay, ...fields } = el;
    const elStart = snapToFrame(s.t, Math.min(start + delay, end - frameOf(s.t)));
    createOverlay(s, { ...fields, id: group + "e" + i, group, track, startSeconds: elStart, endSeconds: end }, at++);
  });
}

/** 整组（如一页幻灯片）移动/改时长/解组 */
function updateGroupOp(s: Scope, op: Record<string, unknown>) {
  const group = typeof op.group === "string" ? op.group : typeof op.id === "string" ? op.id : "";
  const els = s.t.overlays.filter((o) => o.group === group);
  if (!els.length) { s.warnings.push("没有 group 为「" + group + "」的元素"); return; }
  const frame = frameOf(s.t);
  const gStart = Math.min(...els.map((o) => o.startSeconds));
  const gEnd = Math.max(...els.map((o) => o.endSeconds));
  const newStart = num(op.startSeconds);
  if (newStart !== undefined) {
    const delta = snapToFrame(s.t, Math.max(0, newStart)) - gStart;
    for (const o of els) { o.startSeconds = Math.max(0, o.startSeconds + delta); o.endSeconds = Math.max(o.startSeconds + frame, o.endSeconds + delta); }
  }
  const newEnd = num(op.endSeconds);
  if (newEnd !== undefined) {
    const curStart = Math.min(...els.map((o) => o.startSeconds)), curEnd = Math.max(...els.map((o) => o.endSeconds));
    const ne = Math.max(curStart + frame, snapToFrame(s.t, newEnd));
    for (const o of els) {
      if (o.endSeconds >= curEnd - frame / 2 || o.endSeconds > ne) o.endSeconds = ne;
      if (o.startSeconds > o.endSeconds - frame) o.startSeconds = Math.max(curStart, o.endSeconds - frame);
    }
  }
  if (op.ungroup === true) for (const o of els) delete o.group;
  if (isObj(op.patch)) for (const o of els) patchOverlay(s, o, op.patch as Record<string, unknown>);
  for (const o of els) trackOfOverlayTouch(s, o.id);
  void gEnd;
}

function removeGroupOp(s: Scope, op: Record<string, unknown>) {
  const group = typeof op.group === "string" ? op.group : typeof op.id === "string" ? op.id : "";
  const before = s.t.overlays.length;
  const removed = new Set<string>();
  s.t.overlays = s.t.overlays.filter((o) => {
    if (o.group !== group) return true;
    trackOfOverlayTouch(s, o.id);
    removed.add(o.id);
    return false;
  });
  if (s.t.overlays.length === before) s.warnings.push("没有 group 为「" + group + "」的元素");
  dropMorphRefs(s, removed);
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
      dropMorphRefs(s, new Set([hit.overlay.id]));
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
    case "arrangeOverlay": return arrangeOverlayOp(s, o);
    case "transform": return transformOp(s, o);
    case "addSlide": return addSlideOp(s, o);
    case "updateGroup": return updateGroupOp(s, o);
    case "removeGroup": return removeGroupOp(s, o);
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
      ...(s.newIds.length > 1 ? { id: op.op === "addClip" || op.op === "addSlide" ? s.newIds[0] : s.newIds[s.newIds.length - 1] } : {}),
      ...(s.warnings.length ? { warnings: s.warnings } : !effective ? { reason: "没有产生变化" } : {}),
    });
  });
  return { timeline: t, receipts, changed: [...changed] };
}

/** 回执里新建实体的 id（便于调用方把乐观 id 对齐） */
export const receiptIds = (r: Receipt) => (r.ids ?? (r.id ? [r.id] : []));

export { clipLabel };
