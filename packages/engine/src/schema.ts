import { z } from "zod";

// ---------- D剪 时间线 JSON 契约 v2（多轨） ----------
// 唯一事实源：AI 剪辑操作、WebUI 手动调整都编辑这份 JSON；渲染层吃 JSON 出 mp4。
//
// v2 归一化模型（parseTimeline 输出一律是 v2 结构）：
//   videoTracks[0]  = 主轨道：clips 串行（Series），无 atSeconds，时长 = Σ clipDuration
//   videoTracks[1+] = 叠加轨（画中画）：clip 带绝对 atSeconds + 可选 box（0-1 分数矩形）
//   audioTracks     = 音频轨：clip 带 atSeconds / inPoint / duration，轨 volume×clip volume
//   overlays        = 字幕叠加层，绝对秒区间
//
// v1 兼容：{clips, audio} 旧字段在 parseTimeline 自动迁移——clips → 主轨道，audio → 单clip音频轨。
// 总时长（帧）= max(主轨道Σ、所有叠加clip末尾、所有音频clip末尾)，不由 JSON 声明。

export const transitionSchema = z.enum(["none", "fade"]).default("none");

// ---------- v3：关键帧 / 滤镜 / 变速（全 additive，旧 JSON 照收） ----------
// 关键帧：t = clip 内相对秒（成片时间轴），v = 属性值；相邻帧间按缓动插值，区间外鉗端点
// e = 从本帧到下一帧的缓动曲线（省略=线性）
export const easingSchema = z.enum(["linear", "in", "out", "inOut", "bounce", "elastic"]);
export const keyframeSchema = z.object({
  t: z.number().min(0),
  v: z.number(),
  e: easingSchema.optional(),
});

// 动画通道：x/y 为画布分数偏移（0=原位），scale 1=原大，opacity 0-1，rotation 度，volume 0-1 乘在 clip.volume 上
export const animationsSchema = z.object({
  x: z.array(keyframeSchema).optional(),
  y: z.array(keyframeSchema).optional(),
  scale: z.array(keyframeSchema).optional(),
  opacity: z.array(keyframeSchema).optional(),
  rotation: z.array(keyframeSchema).optional(),
  volume: z.array(keyframeSchema).optional(),
});

// 基础滤镜（CSS filter 子集）：省略 = 不调
export const filterSchema = z.object({
  brightness: z.number().min(0).max(3).optional(), // 1=原
  contrast: z.number().min(0).max(3).optional(),
  saturate: z.number().min(0).max(3).optional(),
  blur: z.number().min(0).max(20).optional(), // px
  grayscale: z.number().min(0).max(1).optional(),
  sepia: z.number().min(0).max(1).optional(),
  hueRotate: z.number().min(0).max(360).optional(), // 度
});

// 恒定变速：clipDuration 仍是成片占时；素材消耗 = 占时 × speed（2x = 快放，素材内走两倍）

// 主轨道/叠加轨通用的片段字段
export const clipSchema = z.object({
  id: z.string(),
  type: z.enum(["video", "image"]),
  src: z.string(), // 素材路径：相对于素材根目录（渲染时由 publicDir 决定）
  inPoint: z.number().min(0),
  clipDuration: z.number().positive(),
  transition: transitionSchema,
  volume: z.number().min(0).max(1).default(1),
  // 叠加轨专用：绝对起始秒（主轨道 clip 上无意义，渲染忽略）
  atSeconds: z.number().min(0).optional(),
  // 叠加轨专用：画中画盒子（0-1 分数，默认右下 30%）
  box: z
    .object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
      w: z.number().min(0.01).max(1),
      h: z.number().min(0.01).max(1),
    })
    .optional(),
  // v3：变速 / 滤镜 / 关键帧动画
  speed: z.number().min(0.1).max(10).default(1),
  filter: filterSchema.optional(),
  animations: animationsSchema.optional(),
});

export const videoTrackSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  clips: z.array(clipSchema).default([]),
});

// 音频轨片段：绝对时间轴摆放
export const audioClipSchema = z.object({
  id: z.string(),
  src: z.string(),
  inPoint: z.number().min(0).default(0),
  duration: z.number().positive(),
  volume: z.number().min(0).max(1).default(1),
  atSeconds: z.number().min(0).default(0),
  // v3：变速（duration 仍是占时）+ 音量包络
  speed: z.number().min(0.1).max(10).default(1),
  animations: animationsSchema.optional(),
});

export const audioTrackV2Schema = z.object({
  id: z.string(),
  name: z.string().optional(),
  volume: z.number().min(0).max(1).default(1),
  muted: z.boolean().default(false),
  clips: z.array(audioClipSchema).default([]),
});

// v1 遗留字段（仅输入兼容，归一化后输出里不存在）
export const legacyAudioSchema = z.object({
  src: z.string(),
  volume: z.number().min(0).max(1).default(1),
  startAtSeconds: z.number().min(0).default(0),
});

export const overlaySchema = z.object({
  text: z.string(),
  startSeconds: z.number().min(0),
  endSeconds: z.number().min(0),
  position: z.enum(["top", "center", "bottom"]).default("bottom"),
  fontSize: z.number().positive().default(64),
  color: z.string().default("#ffffff"),
});

const metaSchema = z.object({
  fps: z.number().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

// 输入 schema：v2 字段 + v1 遗留字段都收
const timelineInputSchema = z.object({
  meta: metaSchema,
  videoTracks: z.array(videoTrackSchema).optional(),
  audioTracks: z.array(audioTrackV2Schema).optional(),
  clips: z.array(clipSchema).optional(),
  audio: legacyAudioSchema.nullable().optional(),
  overlays: z.array(overlaySchema).default([]),
});

// 输出（v2 规范形）
export const timelineSchema = z.object({
  meta: metaSchema,
  version: z.literal(2).default(2),
  videoTracks: z.array(videoTrackSchema).min(1),
  audioTracks: z.array(audioTrackV2Schema),
  overlays: z.array(overlaySchema),
});

export type Transition = z.infer<typeof transitionSchema>;
export type Keyframe = z.infer<typeof keyframeSchema>;
export type Animations = z.infer<typeof animationsSchema>;
export type Filter = z.infer<typeof filterSchema>;
export type Clip = z.infer<typeof clipSchema>;
export type VideoTrack = z.infer<typeof videoTrackSchema>;
export type AudioClip = z.infer<typeof audioClipSchema>;
export type AudioTrack = z.infer<typeof audioTrackV2Schema>;
export type Overlay = z.infer<typeof overlaySchema>;
export type Timeline = z.infer<typeof timelineSchema>;

const SEC = (fps: number, s: number) => Math.round(s * fps);

const DEFAULT_BOX = { x: 0.66, y: 0.66, w: 0.3, h: 0.3 };
export const clipBox = (c: Clip) => c.box ?? DEFAULT_BOX;

let trackSeq = 0;
const autoId = (p: string) => `${p}${Date.now().toString(36)}${(trackSeq++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

// 缓动曲线：f(0..1) → 0..1
const EASING: Record<string, (f: number) => number> = {
  linear: (f) => f,
  in: (f) => f * f * f, // cubic 加速
  out: (f) => 1 - Math.pow(1 - f, 3), // cubic 减速
  inOut: (f) => (f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2),
  bounce: (f) => {
    // ease-out bounce（落地弹跳感）
    const n1 = 7.5625;
    const d1 = 2.75;
    if (f < 1 / d1) return n1 * f * f;
    if (f < 2 / d1) return n1 * (f -= 1.5 / d1) * f + 0.75;
    if (f < 2.5 / d1) return n1 * (f -= 2.25 / d1) * f + 0.9375;
    return n1 * (f -= 2.625 / d1) * f + 0.984375;
  },
  elastic: (f) => {
    // ease-out elastic（弹簧过冲）
    if (f === 0 || f === 1) return f;
    const c4 = (2 * Math.PI) / 3;
    return Math.pow(2, -10 * f) * Math.sin((f * 10 - 0.75) * c4) + 1;
  },
};

// 关键帧求值：相邻帧按前一帧的缓动曲线插值，区间外鉗端点。空/单点退化常值。
export const evalKeyframes = (kfs: Keyframe[] | undefined, sec: number): number | undefined => {
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
      const f = (sec - a.t) / (b.t - a.t);
      const eased = EASING[a.e ?? "linear"](f);
      return a.v + (b.v - a.v) * eased;
    }
  }
  return last.v;
};

// v1 → v2 迁移 + 不变量维护（至少一条视频轨）
function normalize(input: z.infer<typeof timelineInputSchema>): Timeline {
  let videoTracks = input.videoTracks ?? [];
  let audioTracks = input.audioTracks ?? [];

  if (!videoTracks.length && input.clips?.length) {
    videoTracks = [{ id: "v1", name: "主轨道", clips: input.clips }];
  }
  if (!videoTracks.length) videoTracks = [{ id: "v1", name: "主轨道", clips: [] }];

  if (!audioTracks.length && input.audio) {
    // v1 单音频字段 → 一条音频轨一个 clip（时长先按主轨道估，渲染层会被总时长兜住）
    const mainDur = videoTracks[0].clips.reduce((s, c) => s + c.clipDuration, 0);
    const startAt = input.audio.startAtSeconds ?? 0;
    audioTracks = [
      {
        id: "a1",
        name: "配乐",
        volume: input.audio.volume ?? 1,
        muted: false,
        clips: [
          {
            id: autoId("ac"),
            src: input.audio.src,
            inPoint: 0,
            duration: Math.max(0.1, mainDur - startAt),
            volume: 1,
            atSeconds: startAt,
            speed: 1,
          },
        ],
      },
    ];
  }

  return {
    meta: input.meta,
    version: 2,
    videoTracks,
    audioTracks,
    overlays: input.overlays,
  };
}

// 总时长（帧）：主轨道串行求和 vs 叠加clip/音频clip 的绝对末尾，取最大
export const timelineDurationInFrames = (t: Timeline): number => {
  const fps = t.meta.fps;
  let frames = t.videoTracks[0]?.clips.reduce((acc, c) => acc + SEC(fps, c.clipDuration), 0) ?? 0;
  for (const tr of t.videoTracks.slice(1)) {
    for (const c of tr.clips) frames = Math.max(frames, SEC(fps, (c.atSeconds ?? 0) + c.clipDuration));
  }
  for (const tr of t.audioTracks) {
    if (tr.muted) continue;
    for (const c of tr.clips) frames = Math.max(frames, SEC(fps, c.atSeconds + c.duration));
  }
  return Math.max(1, frames);
};

// 解析 + 校验 + 归一化（对象或字符串），失败抛出带路径的错误；v1 输入自动升级 v2
export const parseTimeline = (input: unknown): Timeline => {
  const data = typeof input === "string" ? JSON.parse(input) : input;
  const result = timelineInputSchema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`时间线 JSON 校验失败：\n${issues}`);
  }
  return normalize(result.data);
};
