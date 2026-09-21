import { z } from "zod";

// ---------- D剪 时间线 JSON 契约 v0 ----------
// 唯一事实源：AI 剪辑操作、WebUI 手动调整都编辑这份 JSON；渲染层吃 JSON 出 mp4。
// clips: 按顺序串行播放；每段从素材 inPoint 秒起截取 clipDuration 秒。
// overlays: 字幕/文字叠加层，秒为单位（与 meta.fps 换算成帧）。

export const transitionSchema = z.enum(["none", "fade"]).default("none");

export const clipSchema = z.object({
  id: z.string(),
  type: z.enum(["video", "image"]),
  src: z.string(), // 素材路径：相对于素材根目录（渲染时由 publicDir 决定）
  inPoint: z.number().min(0),
  clipDuration: z.number().positive(),
  transition: transitionSchema,
  volume: z.number().min(0).max(1).default(1),
});

export const audioTrackSchema = z.object({
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

export const timelineSchema = z.object({
  meta: z.object({
    fps: z.number().positive(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  clips: z.array(clipSchema).min(1),
  audio: audioTrackSchema.nullable().default(null),
  overlays: z.array(overlaySchema).default([]),
});

export type Transition = z.infer<typeof transitionSchema>;
export type Clip = z.infer<typeof clipSchema>;
export type AudioTrack = z.infer<typeof audioTrackSchema>;
export type Overlay = z.infer<typeof overlaySchema>;
export type Timeline = z.infer<typeof timelineSchema>;

const SEC = (fps: number, s: number) => Math.round(s * fps);

// 总时长（帧）由 clips 串行求和得出，不由 JSON 声明（避免自相矛盾）
export const timelineDurationInFrames = (t: Timeline): number =>
  t.clips.reduce((acc, c) => acc + SEC(t.meta.fps, c.clipDuration), 0);

// 解析 + 校验一份时间线 JSON（对象或字符串），失败抛出带路径的错误
export const parseTimeline = (input: unknown): Timeline => {
  const data = typeof input === "string" ? JSON.parse(input) : input;
  const result = timelineSchema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`时间线 JSON 校验失败：\n${issues}`);
  }
  return result.data;
};
