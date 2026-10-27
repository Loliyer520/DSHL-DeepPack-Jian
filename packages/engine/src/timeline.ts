// 时间线纯函数（不依赖 zod）：面板、服务端、渲染层共用。
// 只用 `import type` 引用 schema，保证打进浏览器包时不会带上 zod 运行时。
import type { Animations, AudioClip, Clip, Keyframe, Overlay, Timeline } from "./schema.js";

export const SCHEMA_VERSION = 6;

// 共享常量（schema 与 ops 共用；放在这里避免浏览器端引入 zod）
export const ANIM_CHANNELS = ["x", "y", "scale", "scaleX", "scaleY", "opacity", "rotation", "volume", "brightness", "contrast", "saturate", "blur", "clipL", "clipR", "clipT", "clipB", "progress"] as const;
// v6 元素（幻灯片式图层）：overlays 里每一项都是一个元素，kind 决定画什么
export const ELEMENT_KINDS = ["subtitle", "title", "text", "shape", "image", "icon", "chart"] as const;
export const BOX_KINDS = ["shape", "image", "icon", "chart"] as const;
export const SHAPE_TYPES = ["rect", "ellipse", "triangle", "rightTriangle", "diamond", "pentagon", "hexagon", "octagon", "star", "parallelogram", "trapezoid", "chevron", "blockArrow", "plus", "heart", "callout", "ring", "line", "arrow", "doubleArrow"] as const;
export const LINE_SHAPES = ["line", "arrow", "doubleArrow"] as const;
export const CHART_TYPES = ["column", "bar", "line", "area", "pie", "donut", "progress", "ring"] as const;
export const TEXT_EFFECTS = ["fadeIn", "fadeUp", "pop", "blur", "drop", "typewriter"] as const;
export const LIST_STYLES = ["bullet", "number", "check"] as const;
export const EASING_NAMES = ["linear", "in", "out", "inOut", "bounce", "elastic", "hold"] as const;
export const TRANSITION_TYPES = ["dissolve", "fadeBlack", "fadeWhite", "slide", "wipe", "push", "zoom", "blur"] as const;
export const DIRECTIONS = ["left", "right", "up", "down"] as const;
export const BLEND_MODES = ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion"] as const;
export const FILTER_RANGES = { brightness: [0, 3], contrast: [0, 3], saturate: [0, 3], blur: [0, 20], grayscale: [0, 1], sepia: [0, 1], hueRotate: [0, 360] } as const;

export const secToFrames = (fps: number, s: number) => Math.round(s * fps);

const DEFAULT_BOX = { x: 0.66, y: 0.66, w: 0.3, h: 0.3 };
export const clipBox = (c: Pick<Clip, "box">) => c.box ?? DEFAULT_BOX;

// 缓动曲线：f(0..1) → 0..1
export const EASING: Record<string, (f: number) => number> = {
  linear: (f) => f,
  in: (f) => f * f * f,
  out: (f) => 1 - Math.pow(1 - f, 3),
  inOut: (f) => (f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2),
  bounce: (f) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (f < 1 / d1) return n1 * f * f;
    if (f < 2 / d1) return n1 * (f -= 1.5 / d1) * f + 0.75;
    if (f < 2.5 / d1) return n1 * (f -= 2.25 / d1) * f + 0.9375;
    return n1 * (f -= 2.625 / d1) * f + 0.984375;
  },
  elastic: (f) => {
    if (f === 0 || f === 1) return f;
    const c4 = (2 * Math.PI) / 3;
    return Math.pow(2, -10 * f) * Math.sin((f * 10 - 0.75) * c4) + 1;
  },
};

// 三次贝塞尔缓动（CSS cubic-bezier 语义），关键帧 e 可写作 [x1,y1,x2,y2]
export const cubicBezier = (x1: number, y1: number, x2: number, y2: number) => (f: number) => {
  if (f <= 0) return 0;
  if (f >= 1) return 1;
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  let lo = 0, hi = 1, t = f;
  for (let i = 0; i < 40; i++) {
    const x = sampleX(t);
    if (Math.abs(x - f) < 1e-7) break;
    if (x < f) lo = t; else hi = t;
    t = (lo + hi) / 2;
  }
  return sampleY(t);
};

const easingFn = (e: Keyframe["e"]): ((f: number) => number) => {
  if (Array.isArray(e) && e.length === 4) return cubicBezier(e[0], e[1], e[2], e[3]);
  if (e === "hold") return () => 0;
  return EASING[(e as string | undefined) ?? "linear"] ?? EASING.linear;
};

// 关键帧求值：相邻帧按前一帧的缓动曲线插值，区间外钳端点。空/单点退化常值。
export const evalKeyframes = (kfs: readonly Keyframe[] | undefined, sec: number): number | undefined => {
  if (!kfs || kfs.length === 0) return undefined;
  if (kfs.length === 1) return kfs[0].v;
  const sorted = [...kfs].sort((a, b) => a.t - b.t);
  if (sec <= sorted[0].t) return sorted[0].v;
  const last = sorted[sorted.length - 1];
  if (sec >= last.t) return last.v;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (sec >= a.t && sec <= b.t) {
      const span = b.t - a.t;
      if (span <= 0) return b.v;
      const eased = easingFn(a.e)((sec - a.t) / span);
      return a.v + (b.v - a.v) * eased;
    }
  }
  return last.v;
};

export function shiftAnimations(animations: Animations | undefined, seconds: number): Animations | undefined {
  if (!animations) return undefined;
  return Object.fromEntries(
    Object.entries(animations).map(([channel, frames]) => [channel, frames?.map((frame) => ({ ...frame, t: frame.t - seconds }))]),
  ) as Animations;
}

// ---- 片段时间几何（秒） ----

/** 主轨各片段的起点（秒），与渲染层逐片段帧取整保持一致。 */
export function mainTrackStarts(t: Timeline): Map<string, number> {
  const fps = t.meta.fps;
  const out = new Map<string, number>();
  let frames = 0;
  for (const c of t.videoTracks[0]?.clips ?? []) {
    out.set(c.id, frames / fps);
    frames += secToFrames(fps, c.clipDuration);
  }
  return out;
}

export type ClipLocation =
  | { kind: "video"; trackIndex: number; index: number; clip: Clip; start: number; duration: number }
  | { kind: "audio"; trackIndex: number; index: number; clip: AudioClip; start: number; duration: number };

export function locateClip(t: Timeline, id: string): ClipLocation | undefined {
  for (let ti = 0; ti < t.videoTracks.length; ti++) {
    const tr = t.videoTracks[ti];
    const index = tr.clips.findIndex((c) => c.id === id);
    if (index === -1) continue;
    const clip = tr.clips[index];
    const start = ti === 0 ? mainTrackStarts(t).get(id) ?? 0 : clip.atSeconds ?? 0;
    return { kind: "video", trackIndex: ti, index, clip, start, duration: clip.clipDuration };
  }
  for (let ti = 0; ti < t.audioTracks.length; ti++) {
    const tr = t.audioTracks[ti];
    const index = tr.clips.findIndex((c) => c.id === id);
    if (index === -1) continue;
    const clip = tr.clips[index];
    return { kind: "audio", trackIndex: ti, index, clip, start: clip.atSeconds, duration: clip.duration };
  }
  return undefined;
}

export const overlayById = (t: Timeline, id: string): Overlay | undefined => t.overlays.find((o) => o.id === id);

// 总时长（帧）：主轨道串行求和 vs 叠加clip/音频clip/字幕的绝对末尾，取最大
export const timelineDurationInFrames = (t: Timeline): number => {
  const fps = t.meta.fps;
  let frames = t.videoTracks[0]?.clips.reduce((acc, c) => acc + secToFrames(fps, c.clipDuration), 0) ?? 0;
  for (const tr of t.videoTracks.slice(1)) {
    for (const c of tr.clips) frames = Math.max(frames, secToFrames(fps, (c.atSeconds ?? 0) + c.clipDuration));
  }
  for (const tr of t.audioTracks) {
    if (tr.muted) continue;
    for (const c of tr.clips) frames = Math.max(frames, secToFrames(fps, c.atSeconds + c.duration));
  }
  for (const ov of t.overlays) frames = Math.max(frames, secToFrames(fps, ov.endSeconds));
  return Math.max(1, frames);
};

export const timelineHasContent = (t: Timeline) =>
  t.videoTracks.some((tr) => tr.clips.length > 0) || t.audioTracks.some((tr) => tr.clips.length > 0) || t.overlays.length > 0;

/** 素材显示名：时间线 src 可能带路径，展示时只取文件名 */
export const srcLabel = (src: string) => src.split(/[\\/]/).pop() || src;

export const allSources = (t: Timeline): string[] => [
  ...new Set([
    ...[...t.videoTracks, ...t.audioTracks].flatMap((tr) => tr.clips.map((c) => c.src)),
    ...t.overlays.flatMap((o) => (o.image?.src ? [o.image.src] : [])),
  ]),
];

/** 有自己盒子（w×h）的元素：形状/图片/图标/图表；文字类元素给了 w 也按盒子排版 */
export const isBoxElement = (o: Pick<Overlay, "kind">) => (BOX_KINDS as readonly string[]).includes(o.kind ?? "");

/**
 * 元素叠放顺序（从下到上）：非字幕元素按 (track, 数组顺序)；字幕永远在最上层，
 * 这样幻灯片背景、卡片不会盖住字幕。
 */
export function elementOrder(overlays: readonly Overlay[]): Overlay[] {
  const indexed = overlays.map((o, i) => ({ o, i }));
  const rank = (o: Overlay) => (o.kind === "subtitle" ? 1 : 0);
  return indexed
    .sort((a, b) => rank(a.o) - rank(b.o) || (a.o.track ?? 0) - (b.o.track ?? 0) || a.i - b.i)
    .map((x) => x.o);
}

/** 元素显示名：name > 文字 > 类型名 */
const KIND_LABEL: Record<string, string> = { shape: "形状", image: "图片", icon: "图标", chart: "图表", text: "文本", title: "标题", subtitle: "字幕" };
export const SHAPE_LABEL: Record<string, string> = {
  rect: "矩形", ellipse: "椭圆", triangle: "三角形", rightTriangle: "直角三角形", diamond: "菱形", pentagon: "五边形", hexagon: "六边形",
  octagon: "八边形", star: "星形", parallelogram: "平行四边形", trapezoid: "梯形", chevron: "箭头标签", blockArrow: "块箭头", plus: "十字",
  heart: "心形", callout: "对话框", ring: "圆环", line: "直线", arrow: "箭头", doubleArrow: "双向箭头",
};
export const CHART_LABEL: Record<string, string> = { column: "柱状图", bar: "条形图", line: "折线图", area: "面积图", pie: "饼图", donut: "环形图", progress: "进度条", ring: "进度环" };
export function elementLabel(o: Overlay): string {
  if (o.name) return o.name;
  const text = o.text?.trim();
  if (text) return text.replace(/\*\*|==|\[#[0-9a-fA-F]{3,8}\]|\[\/\]/g, "").split("\n")[0];
  if (o.kind === "shape") return SHAPE_LABEL[o.shape?.type ?? "rect"] ?? "形状";
  if (o.kind === "image") return o.image?.src ? srcLabel(o.image.src) : "图片";
  if (o.kind === "icon") return "图标 " + (o.icon?.name ?? "");
  if (o.kind === "chart") return CHART_LABEL[o.chart?.type ?? "column"] ?? "图表";
  return KIND_LABEL[o.kind ?? "subtitle"] ?? "元素";
}

/** 一组元素（一页幻灯片）的标题：名为「标题」或 kind=title 的文字，否则字号最大的文字（数字滚动不算） */
export function groupTitle(members: readonly Overlay[]): string {
  const texts = members.filter((o) => o.kind !== "subtitle" && !o.counter && o.text?.trim());
  const head = texts.find((o) => o.name === "标题" || o.kind === "title") ?? [...texts].sort((a, b) => b.fontSize - a.fontSize)[0];
  return head ? head.text.trim().replace(/\*\*|==|\[#[0-9a-fA-F]{3,8}\]|\[\/\]/g, "").split("\n")[0] : "幻灯片";
}

/** 数字格式化（数字滚动、图表数值共用）：定点小数 + 可选千分位 */
export function formatNumber(v: number, decimals = 0, separator = false): string {
  let s = (Math.round(v * 10 ** decimals) / 10 ** decimals).toFixed(decimals);
  if (separator) {
    const [i, f] = s.split(".");
    s = i.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (f ? "." + f : "");
  }
  return s;
}
