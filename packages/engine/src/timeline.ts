// 时间线纯函数（不依赖 zod）：面板、服务端、渲染层共用。
// 只用 `import type` 引用 schema，保证打进浏览器包时不会带上 zod 运行时。
import type { Animations, AudioClip, Clip, Keyframe, Overlay, Timeline } from "./schema.js";

export const SCHEMA_VERSION = 5;

// 共享常量（schema 与 ops 共用；放在这里避免浏览器端引入 zod）
export const ANIM_CHANNELS = ["x", "y", "scale", "scaleX", "scaleY", "opacity", "rotation", "volume", "brightness", "contrast", "saturate", "blur"] as const;
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
export const srcLabel = (src: string) => src.split(/[\/]/).pop() || src;

export const allSources = (t: Timeline): string[] => [
  ...new Set([...t.videoTracks, ...t.audioTracks].flatMap((tr) => tr.clips.map((c) => c.src))),
];
