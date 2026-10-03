import { z } from "zod";
import { ANIM_CHANNELS, BLEND_MODES, DIRECTIONS, EASING_NAMES, SCHEMA_VERSION, TRANSITION_TYPES, secToFrames } from "./timeline.js";
export { ANIM_CHANNELS, BLEND_MODES, DIRECTIONS, EASING_NAMES, TRANSITION_TYPES };

// ---------- D剪 时间线 JSON 契约 v5（多轨 + 稳定 id + 可选高级字段） ----------
// 唯一事实源：AI 剪辑操作、面板手动调整都编辑这份 JSON；渲染层吃 JSON 出 mp4。
//
// 归一化模型（parseTimeline 输出一律是 v5 结构）：
//   videoTracks[0]  = 主轨道：clips 串行，无 atSeconds，时长 = Σ clipDuration（转场居中于剪辑点，不改总时长）
//   videoTracks[1+] = 叠加轨（画中画/贴图）：clip 带绝对 atSeconds + 可选 box（0-1 分数矩形）；越靠后越在上层
//   audioTracks     = 音频轨：clip 带 atSeconds / inPoint / duration，轨 volume×clip volume
//   overlays        = 文字/字幕层（稳定 id），绝对秒区间
//   markers         = 标记点
//
// 兼容：v1 {clips, audio} 自动迁移；v2–v4 缺 id 的字幕在解析时补确定性 id；
// 新字段全部可选（additive），旧数据零改动可读。version 高于本引擎支持的数据拒绝加载，防止旧版覆盖新数据。

export const transitionObjectSchema = z.object({
  type: z.enum(TRANSITION_TYPES),
  duration: z.number().min(0.05).max(3),
  direction: z.enum(DIRECTIONS).optional(),
});
// "none" / "fade"（旧：片头从黑场淡入）/ 对象（新：与前一片段交叠的转场，居中于剪辑点）
export const transitionSchema = z.union([z.enum(["none", "fade"]), transitionObjectSchema]).default("none");

export const EASINGS = EASING_NAMES;
export const easingSchema = z.union([
  z.enum(EASINGS),
  z.tuple([z.number().min(0).max(1), z.number(), z.number().min(0).max(1), z.number()]),
]);
export const keyframeSchema = z.object({
  // 分割后左半段可能保留负时间的帧，用于维持曲线连续
  t: z.number(),
  v: z.number(),
  e: easingSchema.optional(),
});

// 可动画通道。x/y 为画布分数偏移（0=原位），scale 1=原大，opacity 0-1，rotation 度，
// volume 0-1 乘在片段音量上；brightness/contrast/saturate 1=原；blur 像素。
export type AnimChannel = (typeof ANIM_CHANNELS)[number];
const kfList = z.array(keyframeSchema).optional();
export const animationsSchema = z.object({
  x: kfList, y: kfList, scale: kfList, scaleX: kfList, scaleY: kfList, opacity: kfList,
  rotation: kfList, volume: kfList, brightness: kfList, contrast: kfList, saturate: kfList, blur: kfList,
});

export const filterSchema = z.object({
  brightness: z.number().min(0).max(3).optional(),
  contrast: z.number().min(0).max(3).optional(),
  saturate: z.number().min(0).max(3).optional(),
  blur: z.number().min(0).max(20).optional(),
  grayscale: z.number().min(0).max(1).optional(),
  sepia: z.number().min(0).max(1).optional(),
  hueRotate: z.number().min(0).max(360).optional(),
});

// 动画预设引用：渲染时按片段当前时长展开，裁剪/变速后自动对齐（不再把预设烤死成关键帧）
export const effectSchema = z.object({
  preset: z.string().min(1),
});

const rectSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  w: z.number().min(0.01).max(1),
  h: z.number().min(0.01).max(1),
});


export const clipSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["video", "image"]),
  src: z.string(), // 素材文件名：相对于项目素材目录
  inPoint: z.number().min(0),
  clipDuration: z.number().positive(),
  transition: transitionSchema,
  volume: z.number().min(0).max(1).default(1),
  atSeconds: z.number().min(0).optional(), // 叠加轨专用
  box: rectSchema.optional(), // 叠加轨专用：画中画盒子
  speed: z.number().min(0.1).max(10).default(1),
  filter: filterSchema.optional(),
  animations: animationsSchema.optional(),
  effects: z.array(effectSchema).max(8).optional(),
  // v5 画面
  crop: rectSchema.optional(), // 源画面裁切（0-1 分数）
  flipH: z.boolean().optional(),
  flipV: z.boolean().optional(),
  opacity: z.number().min(0).max(1).optional(),
  blendMode: z.enum(BLEND_MODES).optional(),
  fit: z.enum(["cover", "contain", "fill"]).optional(),
  freeze: z.boolean().optional(), // 定格：整段停在 inPoint 那一帧
  radius: z.number().min(0).max(0.5).optional(), // 画中画圆角（短边分数）
  shadow: z.boolean().optional(), // 画中画投影（缺省开启）
  // v5 声音
  muted: z.boolean().optional(),
  fadeIn: z.number().min(0).max(30).optional(),
  fadeOut: z.number().min(0).max(30).optional(),
});

export const videoTrackSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  hidden: z.boolean().optional(),
  locked: z.boolean().optional(),
  muted: z.boolean().optional(),
  clips: z.array(clipSchema).default([]),
});

export const audioClipSchema = z.object({
  id: z.string().min(1),
  src: z.string(),
  inPoint: z.number().min(0).default(0),
  duration: z.number().positive(),
  volume: z.number().min(0).max(1).default(1),
  atSeconds: z.number().min(0).default(0),
  speed: z.number().min(0.1).max(10).default(1),
  animations: animationsSchema.optional(),
  muted: z.boolean().optional(),
  fadeIn: z.number().min(0).max(30).optional(),
  fadeOut: z.number().min(0).max(30).optional(),
});

export const audioTrackSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  volume: z.number().min(0).max(1).default(1),
  muted: z.boolean().default(false),
  locked: z.boolean().optional(),
  role: z.enum(["music", "voice", "sfx"]).optional(),
  // 闪避：有人声（role=voice 的轨）时把本轨压到 level，ramp 秒内渐变
  duck: z.object({ level: z.number().min(0).max(1), ramp: z.number().min(0).max(3).optional() }).optional(),
  clips: z.array(audioClipSchema).default([]),
});
/** @deprecated 旧名，等同 audioTrackSchema */
export const audioTrackV2Schema = audioTrackSchema;

export const legacyAudioSchema = z.object({
  src: z.string(),
  volume: z.number().min(0).max(1).default(1),
  startAtSeconds: z.number().min(0).default(0),
});

const colorSchema = z.string().max(40);
export const overlaySchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  startSeconds: z.number().min(0),
  endSeconds: z.number().min(0),
  position: z.enum(["top", "center", "bottom"]).default("bottom"),
  fontSize: z.number().positive().max(2000).default(64),
  color: colorSchema.default("#ffffff"),
  fontFamily: z.string().optional(),
  fontWeight: z.number().int().min(100).max(900).optional(),
  animations: animationsSchema.optional(),
  effects: z.array(effectSchema).max(8).optional(),
  // v5 版式：x/y 给出时按锚点（文字块中心）自由摆放，覆盖 position
  x: z.number().min(0).max(1).optional(),
  y: z.number().min(0).max(1).optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  maxWidth: z.number().min(0.1).max(1).optional(),
  lineHeight: z.number().min(0.8).max(3).optional(),
  letterSpacing: z.number().min(-0.2).max(1).optional(), // em
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  stroke: z.object({ color: colorSchema, width: z.number().min(0).max(40) }).optional(),
  shadow: z.union([
    z.literal(false),
    z.object({ color: colorSchema, blur: z.number().min(0).max(80), x: z.number().min(-80).max(80).optional(), y: z.number().min(-80).max(80).optional() }),
  ]).optional(),
  background: z.object({
    color: colorSchema,
    opacity: z.number().min(0).max(1).optional(),
    padding: z.number().min(0).max(200).optional(),
    radius: z.number().min(0).max(200).optional(),
  }).optional(),
  kind: z.enum(["subtitle", "title"]).optional(),
  track: z.number().int().min(0).max(31).optional(),
});

export const markerSchema = z.object({
  id: z.string().min(1),
  t: z.number().min(0),
  label: z.string().max(80).optional(),
  color: colorSchema.optional(),
});

const metaSchema = z.object({
  fps: z.number().positive().max(240),
  width: z.number().int().positive().max(16384),
  height: z.number().int().positive().max(16384),
  background: colorSchema.optional(),
});

// 输入：v1–v5 字段都收（字幕/标记 id 可缺，由归一化补齐）
const timelineInputSchema = z.object({
  meta: metaSchema,
  version: z.number().int().optional(),
  videoTracks: z.array(videoTrackSchema).optional(),
  audioTracks: z.array(audioTrackSchema).optional(),
  clips: z.array(clipSchema).optional(),
  audio: legacyAudioSchema.nullable().optional(),
  overlays: z.array(overlaySchema.extend({ id: z.string().min(1).optional() })).default([]),
  markers: z.array(markerSchema.extend({ id: z.string().min(1).optional() })).default([]),
});

export const timelineSchema = z.object({
  meta: metaSchema,
  version: z.literal(SCHEMA_VERSION).default(SCHEMA_VERSION),
  videoTracks: z.array(videoTrackSchema).min(1),
  audioTracks: z.array(audioTrackSchema),
  overlays: z.array(overlaySchema),
  markers: z.array(markerSchema).default([]),
});

export type Transition = z.infer<typeof transitionSchema>;
export type TransitionObject = z.infer<typeof transitionObjectSchema>;
export type Easing = z.infer<typeof easingSchema>;
export type Keyframe = z.infer<typeof keyframeSchema>;
export type Animations = z.infer<typeof animationsSchema>;
export type Filter = z.infer<typeof filterSchema>;
export type Effect = z.infer<typeof effectSchema>;
export type Clip = z.infer<typeof clipSchema>;
export type VideoTrack = z.infer<typeof videoTrackSchema>;
export type AudioClip = z.infer<typeof audioClipSchema>;
export type AudioTrack = z.infer<typeof audioTrackSchema>;
export type Overlay = z.infer<typeof overlaySchema>;
export type Marker = z.infer<typeof markerSchema>;
export type Meta = z.infer<typeof metaSchema>;
export type Timeline = z.infer<typeof timelineSchema>;

// 纯函数从 timeline.ts 再导出（保持旧 import 路径可用）
export {
  SCHEMA_VERSION,
  clipBox,
  evalKeyframes,
  shiftAnimations,
  timelineDurationInFrames,
  mainTrackStarts,
  locateClip,
  timelineHasContent,
  srcLabel,
} from "./timeline.js";

export class TimelineVersionError extends Error {
  constructor(public readonly version: number) {
    super(`时间线由更新版本的 D剪 创建（格式 v${version}，当前引擎支持到 v${SCHEMA_VERSION}），请升级整合包后再打开；为防止数据丢失，本版本不会改写它。`);
    this.name = "TimelineVersionError";
  }
}

// 确定性短哈希：旧数据补 id 时多次解析结果一致（FNV-1a）
export const hash36 = (s: string): string => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
};

type Input = z.infer<typeof timelineInputSchema>;

// v1 → v5 迁移 + 不变量维护（至少一条视频轨、id 全局唯一、时长至少一帧）
function normalize(input: Input): Timeline {
  const fps = input.meta.fps;
  const frame = 1 / fps;
  let videoTracks = (input.videoTracks ?? []).map((tr) => ({ ...tr, clips: tr.clips.map((c) => ({ ...c })) }));
  let audioTracks = (input.audioTracks ?? []).map((tr) => ({ ...tr, clips: tr.clips.map((c) => ({ ...c })) }));

  if (!videoTracks.length && input.clips?.length) {
    videoTracks = [{ id: "v1", name: "主轨道", clips: input.clips.map((c) => ({ ...c })) }];
  }
  if (!videoTracks.length) videoTracks = [{ id: "v1", name: "主轨道", clips: [] }];

  if (!audioTracks.length && input.audio) {
    const mainDur = videoTracks[0].clips.reduce((s, c) => s + c.clipDuration, 0);
    const startAt = input.audio.startAtSeconds ?? 0;
    audioTracks = [{
      id: "a1", name: "配乐", volume: input.audio.volume ?? 1, muted: false,
      clips: [{ id: "ac" + hash36(input.audio.src), src: input.audio.src, inPoint: 0, duration: Math.max(0.1, mainDur - startAt), volume: 1, atSeconds: startAt, speed: 1 }],
    }];
  }

  // 全局 id 唯一：重复者改名（保留第一个）
  const seen = new Set<string>();
  const unique = (id: string, salt: string): string => {
    let next = id;
    let n = 1;
    while (seen.has(next)) next = id + "_" + hash36(salt + String(n++));
    seen.add(next);
    return next;
  };
  for (const tr of videoTracks) {
    tr.id = unique(tr.id, "vt" + (tr.name ?? ""));
    for (const c of tr.clips) {
      c.id = unique(c.id, "c" + c.src + c.inPoint);
      if (c.clipDuration < frame) c.clipDuration = frame;
    }
  }
  for (const tr of audioTracks) {
    tr.id = unique(tr.id, "at" + (tr.name ?? ""));
    for (const c of tr.clips) {
      c.id = unique(c.id, "ac" + c.src + c.inPoint);
      if (c.duration < frame) c.duration = frame;
    }
  }
  const overlays = input.overlays.map((o, i) => {
    const id = unique(o.id ?? "o" + hash36(i + "|" + o.text + "|" + o.startSeconds), "o" + i + o.text);
    const endSeconds = o.endSeconds < o.startSeconds + frame ? o.startSeconds + frame : o.endSeconds;
    return { ...o, id, endSeconds };
  });
  const markers = input.markers.map((m, i) => ({ ...m, id: unique(m.id ?? "m" + hash36(i + "|" + m.t), "m" + m.t) }));

  return { meta: input.meta, version: SCHEMA_VERSION, videoTracks, audioTracks, overlays, markers } as Timeline;
}

// 解析 + 校验 + 归一化（对象或字符串），失败抛出带路径的错误；旧格式自动升级
export const parseTimeline = (input: unknown): Timeline => {
  const data = typeof input === "string" ? JSON.parse(input) : input;
  const version = (data as { version?: unknown } | null)?.version;
  if (typeof version === "number" && version > SCHEMA_VERSION) throw new TimelineVersionError(version);
  const result = timelineInputSchema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 12)
      .map((i) => "  - " + (i.path.join(".") || "(root)") + ": " + i.message)
      .join("\n");
    throw new Error("时间线 JSON 校验失败：\n" + issues);
  }
  return normalize(result.data);
};

/** 严格校验一份已归一化的时间线（ops 应用后使用）；返回问题列表，空数组 = 合法 */
export const validateTimeline = (t: unknown): string[] => {
  const result = timelineSchema.safeParse(t);
  if (!result.success) return result.error.issues.slice(0, 12).map((i) => (i.path.join(".") || "(root)") + ": " + i.message);
  const issues: string[] = [];
  const tl = result.data;
  const ids = new Set<string>();
  const dup = (id: string, where: string) => {
    if (ids.has(id)) issues.push(where + ": id「" + id + "」重复");
    ids.add(id);
  };
  tl.videoTracks.forEach((tr, i) => {
    dup(tr.id, "videoTracks." + i);
    tr.clips.forEach((c, j) => dup(c.id, "videoTracks." + i + ".clips." + j));
  });
  tl.audioTracks.forEach((tr, i) => {
    dup(tr.id, "audioTracks." + i);
    tr.clips.forEach((c, j) => dup(c.id, "audioTracks." + i + ".clips." + j));
  });
  tl.overlays.forEach((o, i) => {
    dup(o.id, "overlays." + i);
    if (secToFrames(tl.meta.fps, o.endSeconds) <= secToFrames(tl.meta.fps, o.startSeconds)) issues.push("overlays." + i + ": 结束时间必须晚于开始时间至少一帧");
  });
  tl.markers.forEach((m, i) => dup(m.id, "markers." + i));
  return issues;
};
