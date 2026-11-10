import { z } from "zod";
import { resolveCues } from './studio.js';
import { applyLayout } from "./layout.js";
import { ANIM_CHANNELS, BLEND_MODES, CHART_TYPES, DIRECTIONS, EASING_NAMES, ELEMENT_KINDS, LIST_STYLES, PLOT_ITEM_TYPES, SCHEMA_VERSION, isMatteSource, SHAPE_TYPES, TEXT_EFFECTS, TRANSITION_TYPES, secToFrames } from "./timeline.js";
export { ANIM_CHANNELS, BLEND_MODES, CHART_TYPES, DIRECTIONS, EASING_NAMES, ELEMENT_KINDS, LIST_STYLES, PLOT_ITEM_TYPES, SHAPE_TYPES, TEXT_EFFECTS, TRANSITION_TYPES };

// ---------- D剪 时间线 JSON 契约 v16（多轨 + 稳定 id + 幻灯片式元素 + 数学动画） ----------
// 唯一事实源：AI 剪辑操作、面板手动调整都编辑这份 JSON；渲染层吃 JSON 出 mp4。
//
// 归一化模型（parseTimeline 输出一律是 v5 结构）：
//   videoTracks[0]  = 主轨道：clips 串行，无 atSeconds，时长 = Σ clipDuration（转场居中于剪辑点，不改总时长）
//   videoTracks[1+] = 叠加轨（画中画/贴图）：clip 带绝对 atSeconds + 可选 box（0-1 分数矩形）；越靠后越在上层
//   audioTracks     = 音频轨：clip 带 atSeconds / inPoint / duration，轨 volume×clip volume
//   overlays        = 元素层（稳定 id，绝对秒区间）：字幕/标题/文本/形状/图片/图标/图表，kind 区分
//   markers         = 标记点
//
// 兼容：v1 {clips, audio} 自动迁移；v2–v4 缺 id 的字幕在解析时补确定性 id；v5→v6→v7 只增字段；v8 增加多层阴影与通用元素外观。
// 新字段全部可选（additive），旧数据零改动可读。version 高于本引擎支持的数据拒绝加载，防止旧版覆盖新数据。

export const EASINGS = EASING_NAMES;
export const springSchema = z.object({
  type: z.literal("spring"),
  stiffness: z.number().min(1).max(1000).optional(),
  damping: z.number().min(0.1).max(100).optional(),
  mass: z.number().min(0.1).max(20).optional(),
  velocity: z.number().min(-20).max(20).optional(),
});
export const easingSchema = z.union([
  springSchema,
  z.enum(EASINGS),
  z.tuple([z.number().min(0).max(1), z.number(), z.number().min(0).max(1), z.number()]),
]);
export const transitionObjectSchema = z.object({
  type: z.enum(TRANSITION_TYPES),
  duration: z.number().min(0.05).max(3),
  direction: z.enum(DIRECTIONS).optional(),
  ease: easingSchema.optional(),
  intensity: z.number().min(0.1).max(2).optional(),
});
// "none" / "fade"（旧：片头从黑场淡入）/ 对象（新：与前一片段交叠的转场，居中于剪辑点）
export const transitionSchema = z.union([z.enum(["none", "fade"]), transitionObjectSchema]).default("none");

// 2.5D plane transforms, shared by clips and editable elements (pixels/degrees).
export const transform3dSchema = z.object({
  rotateX: z.number().min(-3600).max(3600).optional(),
  rotateY: z.number().min(-3600).max(3600).optional(),
  z: z.number().min(-2000).max(1000).optional(),
  perspective: z.number().min(200).max(5000).optional(),
  backface: z.enum(["visible", "hidden"]).optional(),
});

export const keyframeSchema = z.object({
  // 分割后左半段可能保留负时间的帧，用于维持曲线连续
  t: z.number(),
  v: z.number(),
  e: easingSchema.optional(),
});

// 可动画通道。x/y 为画布分数偏移（0=原位），scale 1=原大，opacity 0-1，rotation 度，
// volume 0-1 乘在片段音量上；brightness/contrast/saturate 1=原；blur 像素；
// clipL/clipR/clipT/clipB 0-1 从对应边裁掉的比例（擦除入场/出场）；progress 0-1 元素进度（打字/描边/数字滚动/图表生长，缺省 1）。
export type AnimChannel = (typeof ANIM_CHANNELS)[number];
const kfList = z.array(keyframeSchema).optional();
export const animationsSchema = z.object({
  x: kfList, y: kfList, scale: kfList, scaleX: kfList, scaleY: kfList, opacity: kfList,
  rotation: kfList, volume: kfList, brightness: kfList, contrast: kfList, saturate: kfList, blur: kfList,
  clipL: kfList, clipR: kfList, clipT: kfList, clipB: kfList, progress: kfList,
  rotationX: kfList, rotationY: kfList, z: kfList, perspective: kfList, pathProgress: kfList,
  maskX: kfList, maskY: kfList, maskW: kfList, maskH: kfList, maskFeather: kfList, sweepProgress: kfList, gradientAngle: kfList, gradientShift: kfList, gradientHue: kfList,
});

export const trackMatteSchema = z.object({
  source: z.string().min(1).max(64), mode: z.enum(["alpha", "luma"]).optional(),
  invert: z.boolean().optional(), hideSource: z.boolean().optional(),
});
export const sweepSchema = z.object({
  color: z.string().max(40).optional(), width: z.number().min(.01).max(1).optional(),
  softness: z.number().min(0).max(1).optional(), angle: z.number().min(-360).max(360).optional(),
  opacity: z.number().min(0).max(1).optional(), position: z.number().min(-1).max(2).optional(),
});
export const animationClipSchema = z.object({
  duration: z.number().positive().max(86400), animations: animationsSchema,
});

export const maskSchema = z.object({
  type: z.enum(["ellipse", "rect", "path"]),
  x: z.number().min(-1).max(2).optional(), y: z.number().min(-1).max(2).optional(),
  w: z.number().min(0.001).max(4).optional(), h: z.number().min(0.001).max(4).optional(),
  feather: z.number().min(0).max(200).optional(),
  invert: z.boolean().optional(),
  // SVG path coordinates use a local 0–100 square.
  path: z.string().max(8000).regex(/^[MmLlHhVvCcSsQqTtAaZz0-9eE+.,\s-]*$/).optional(),
});
export const motionPathSchema = z.object({
  // Canvas-relative offsets, 100 units = one canvas width/height; starts at M 0 0.
  path: z.string().min(1).max(8000).regex(/^[MmLlHhVvCcSsQqTtAaZz0-9eE+.,\s-]*$/),
  autoRotate: z.boolean().optional(),
  rotationOffset: z.number().min(-3600).max(3600).optional(),
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

export const followSchema = z.object({
  target: z.string().min(1).max(64),
  rotation: z.boolean().optional(), scale: z.boolean().optional(),
});
const anchorSchema = z.enum(["center", "top", "bottom", "left", "right"]);
export const connectorSchema = z.object({
  from: z.string().min(1).max(64), to: z.string().min(1).max(64),
  fromAnchor: anchorSchema.optional(), toAnchor: anchorSchema.optional(),
});
export const staggerSchema = z.object({
  interval: z.number().min(0).max(5),
  order: z.enum(["forward", "reverse", "center"]).optional(),
  preset: z.string().min(1).optional(),
  duration: z.number().min(0.05).max(10).optional(),
});
export const particlesSchema = z.object({
  preset: z.enum(['snow','stars','rain','confetti','sparks']),
  count: z.number().int().min(1).max(600).optional(), seed: z.number().int().min(0).max(2147483647).optional(),
  speed: z.number().min(0).max(10).optional(), size: z.number().min(.2).max(100).optional(),
  colors: z.array(z.string().min(1)).min(1).max(12).optional(),
});
export const audioReactiveSchema = z.object({
  source: z.string().min(1), src: z.string().min(1),
  rate: z.number().min(1).max(200), values: z.array(z.number().min(0).max(1)).max(720000),
  channel: z.enum(['scale','opacity','rotation']).optional(), amount: z.number().min(-360).max(360).optional(),
  smoothing: z.number().min(0).max(2).optional(), waveform: z.boolean().optional(),
});
export const motionBlurSchema = z.object({
  samples: z.number().int().min(2).max(16).optional(),
  shutterAngle: z.number().min(0).max(720).optional(),
});
export const autoSizeSchema = z.object({
  maxWidth: z.number().min(.01).max(4).optional(),
  minWidth: z.number().min(.002).max(4).optional(),
  padding: z.number().min(0).max(500).optional(),
});
export const layoutSchema = z.object({
  direction: z.enum(['row','column','grid']),
  x: z.number().min(-1).max(2).optional(), y: z.number().min(-1).max(2).optional(),
  width: z.number().min(.01).max(4).optional(), height: z.number().min(.01).max(4).optional(),
  gap: z.number().min(0).max(1000).optional(), padding: z.number().min(0).max(1000).optional(),
  align: z.enum(['start','center','end','stretch']).optional(),
  justify: z.enum(['start','center','end','space-between']).optional(),
  columns: z.number().int().min(1).max(20).optional(),
  background: z.string().min(1).max(64).optional(),
});
export const cueSchema = z.object({
  id:z.string().min(1).max(64), preset:z.string().min(1).max(64),
  start:z.number().min(0).max(86400), duration:z.number().min(.01).max(86400),
  after:z.string().min(1).max(64).optional(), offset:z.number().min(-86400).max(86400).optional(),
});
const componentValuesSchema=z.record(z.string().min(1).max(64),z.object({text:z.string().max(2000).optional(),color:z.string().max(40).optional(),fill:z.string().max(40).optional(),imageSrc:z.string().max(500).optional()}));
export const componentBindingSchema=z.object({name:z.string().min(1).max(64),values:componentValuesSchema.optional()});
export const groupStateSchema = z.object({
  component:componentBindingSchema.optional(), cues:z.array(cueSchema).max(100).optional(),
  layout: layoutSchema.optional(), motionBlur: motionBlurSchema.optional(),
  stagger: staggerSchema.optional(),
  pivotX: z.number().min(-1).max(2).optional(), pivotY: z.number().min(-1).max(2).optional(),
  rotate: z.number().min(-3600).max(3600).optional(),
  scale: z.number().min(0).max(20).optional(), opacity: z.number().min(0).max(1).optional(),
  transform3d: transform3dSchema.optional(), animations: animationsSchema.optional(),
  effects: z.array(effectSchema).max(8).optional(),
  motionPath: motionPathSchema.optional(), mask: maskSchema.optional(),
});

const rectSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  w: z.number().min(0.01).max(1),
  h: z.number().min(0.01).max(1),
});


export const focusSchema=z.object({x:z.number().min(0).max(1),y:z.number().min(0).max(1)});
export const clipSchema = z.object({
  focus:focusSchema.optional(),
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
  transform3d: transform3dSchema.optional(),
  trackMatte: trackMatteSchema.optional(),
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
// 填充：纯色，或线性/径向渐变（angle 为线性渐变角度，0=从左到右，90=从上到下）
const gradientStopSchema = z.object({ offset: z.number().min(0).max(1), color: colorSchema });
export const gradientFrameSchema = z.object({
  t: z.number(), angle: z.number().min(-3600).max(3600).optional(),
  stops: z.array(gradientStopSchema).min(2).max(8), e: easingSchema.optional(),
});
export const fillSchema = z.union([
  colorSchema,
  z.object({
    type: z.enum(["linear", "radial"]),
    angle: z.number().min(-360).max(360).optional(),
    stops: z.array(gradientStopSchema).min(2).max(8),
    keyframes: z.array(gradientFrameSchema).max(200).optional(),
  }),
]);
// 阴影作用于元素真实轮廓；数组中的第一层位于最上方。
export const shadowLayerSchema = z.object({
  inset: z.boolean().optional(),
  color: colorSchema,
  blur: z.number().min(0).max(200),
  x: z.number().min(-1000).max(1000).optional(),
  y: z.number().min(-1000).max(1000).optional(),
  opacity: z.number().min(0).max(1).optional(),
  spread: z.number().min(-100).max(200).optional(),
});
export const shadowSchema = z.union([z.literal(false), shadowLayerSchema, z.array(shadowLayerSchema).min(1).max(8)]);
const outlineSchema = z.object({ color: colorSchema, width: z.number().min(0).max(200), dash: z.enum(["solid", "dashed", "dotted"]).optional() });
export const shapeSchema = z.object({
  type: z.enum(SHAPE_TYPES),
  fill: fillSchema.optional(),
  stroke: outlineSchema.extend({ color: fillSchema }).optional(),
  radius: z.number().min(0).max(2000).optional(), // 圆角（像素）：矩形/对话框
  points: z.number().int().min(3).max(24).optional(), // 星形角数
  inner: z.number().min(0.05).max(0.95).optional(), // 星形内径比 / 圆环内径比
  // 自由路径（type=path）：坐标系为盒子 0–100（左上 0,0，右下 100,100），给 path（SVG 路径）或 vertices（顶点）之一
  path: z.string().max(4000).optional(),
  vertices: z.array(z.tuple([z.number(), z.number()])).max(200).optional(),
  closed: z.boolean().optional(), // 顶点首尾相连（闭合后可填充）
  smooth: z.boolean().optional(), // 顶点之间画平滑曲线
  arrow: z.enum(["start", "end", "both"]).optional(), // 开放路径的箭头
});
export const imageSchema = z.object({
  focus:focusSchema.optional(),
  src: z.string().min(1),
  fit: z.enum(["cover", "contain", "fill"]).optional(),
  radius: z.number().min(0).max(2000).optional(),
  border: outlineSchema.optional(),
});
export const iconSchema = z.object({
  name: z.string().min(1).max(60), // 内置图标名（见 icons.ts）
  strokeWidth: z.number().min(0.25).max(6).optional(),
  fill: colorSchema.optional(), // 图标内部填充色（缺省不填充）
});
export const chartSchema = z.object({
  type: z.enum(CHART_TYPES),
  data: z.array(z.object({ label: z.string().max(60).optional(), value: z.number(), color: colorSchema.optional() })).min(1).max(24),
  max: z.number().positive().optional(), // 刻度上限（进度条/进度环缺省 100）
  colors: z.array(colorSchema).max(12).optional(),
  showValues: z.boolean().optional(),
  showLabels: z.boolean().optional(),
  prefix: z.string().max(12).optional(),
  unit: z.string().max(12).optional(),
  decimals: z.number().int().min(0).max(4).optional(),
  trackColor: colorSchema.optional(),
  thickness: z.number().min(0.02).max(1).optional(), // 柱宽/线宽/环宽比例
});
// ---- v7 坐标系：数值或表达式（可用 x/t、params 里的参数、带 id 的函数名、pi/e 与常用函数） ----
const exprSchema = z.union([z.number(), z.string().max(200)]);
export const plotItemSchema = z.object({
  type: z.enum(PLOT_ITEM_TYPES),
  id: z.string().max(12).optional(), // 函数名：fn 设了 id:"f" 后，别的表达式可以写 f(a)
  fn: z.string().max(200).optional(), // fn：y=f(x)；polar：r=f(t)
  fx: z.string().max(200).optional(), // param：x=fx(t)
  fy: z.string().max(200).optional(), // param：y=fy(t)
  t: z.tuple([exprSchema, exprSchema]).optional(), // param/polar 的 t 范围（缺省 0–2π）
  domain: z.tuple([exprSchema, exprSchema]).optional(), // fn 的 x 范围（缺省整个坐标系）
  of: z.string().max(12).optional(), // tangent/area/riemann 作用的函数 id（缺省第一条函数）
  x: exprSchema.optional(), y: exprSchema.optional(), // 点/标注位置；向量/线段终点；切点横坐标
  x0: exprSchema.optional(), y0: exprSchema.optional(), // 向量/线段起点（缺省原点）
  from: exprSchema.optional(), to: exprSchema.optional(), // 面积/黎曼和区间
  n: exprSchema.optional(), // 黎曼和矩形个数
  length: z.number().min(0.01).max(1000).optional(), // 切线长度（坐标单位）
  color: colorSchema.optional(),
  width: z.number().min(0.5).max(40).optional(), // 线宽（像素）
  dash: z.boolean().optional(),
  opacity: z.number().min(0).max(1).optional(), // 面积/黎曼和填充不透明度
  size: z.number().min(1).max(60).optional(), // 点半径（像素）
  label: z.string().max(120).optional(), // 标注文字：$…$ 为公式，{表达式} 实时代入数值
  guides: z.boolean().optional(), // 点到坐标轴的虚线
  start: z.number().min(0).max(3600).optional(), // 出现时刻（元素内相对秒）；不给则随 progress 依次画出
  draw: z.number().min(0).max(30).optional(), // 画出用时（秒，缺省 1）
  end: z.number().min(0).max(3600).optional(), // 消失时刻（元素内相对秒）
});
export const plotSchema = z.object({
  x: z.tuple([z.number(), z.number()]), // 横轴范围 [min, max]
  y: z.tuple([z.number(), z.number()]),
  xStep: z.number().positive().optional(), // 刻度间距（缺省自动）
  yStep: z.number().positive().optional(),
  grid: z.boolean().optional(), // 背景网格（数轴平面）
  axes: z.boolean().optional(), // 缺省 true
  ticks: z.boolean().optional(), // 缺省 true
  numbers: z.boolean().optional(), // 刻度数字，缺省 true
  xLabel: z.string().max(60).optional(),
  yLabel: z.string().max(60).optional(),
  axisColor: colorSchema.optional(),
  gridColor: colorSchema.optional(),
  // 参数：常数或关键帧（t 为元素内相对秒）；表达式里直接用参数名，关键帧让曲线/点/面积随之连续变化
  params: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,11}$/), z.union([z.number(), z.array(keyframeSchema).min(1).max(64)])).optional(),
  items: z.array(plotItemSchema).max(24),
});
// 变形：本元素开头 duration 秒内从 from 元素（通常刚在此刻结束）变成自己
export const morphSchema = z.object({
  from: z.string().min(1).max(64),
  duration: z.number().min(0.1).max(10).optional(), // 缺省 1 秒
  ease: easingSchema.optional(), // 缺省 inOut
});
export const counterSchema = z.object({
  from: z.number(),
  to: z.number(),
  decimals: z.number().int().min(0).max(4).optional(),
  prefix: z.string().max(12).optional(),
  suffix: z.string().max(12).optional(),
  separator: z.boolean().optional(), // 千分位
});
export const textEffectSchema = z.object({
  type: z.enum(TEXT_EFFECTS),
  by: z.enum(["char", "word", "line"]).optional(),
  interval: z.number().min(0).max(2).optional(), // 相邻单位的间隔秒
  duration: z.number().min(0.02).max(5).optional(), // 每个单位的入场时长
});
export const glassSchema = z.object({
  blur: z.number().min(0).max(100).optional(),
  saturation: z.number().min(0).max(3).optional(),
  brightness: z.number().min(0).max(2).optional(),
  tint: colorSchema.optional(), opacity: z.number().min(0).max(1).optional(),
  radius: z.number().min(0).max(1000).optional(),
  borderOpacity: z.number().min(0).max(1).optional(),
});
export const sharedElementSchema = z.object({
  key: z.string().min(1).max(64),
  duration: z.number().min(0.05).max(5).optional(),
  ease: easingSchema.optional(),
});
const vec3Schema=z.tuple([z.number().min(-100).max(100),z.number().min(-100).max(100),z.number().min(-100).max(100)]);
const angle3Schema=z.tuple([z.number().min(-3600).max(3600),z.number().min(-3600).max(3600),z.number().min(-3600).max(3600)]);
export const scene3dSchema=z.object({
  timeOffset:z.number().min(0).max(86400).optional(),
  camera:z.object({yaw:z.number().min(-3600).max(3600).optional(),pitch:z.number().min(-85).max(85).optional(),distance:z.number().min(1).max(100).optional(),fov:z.number().min(15).max(100).optional(),orbit:z.number().min(-360).max(360).optional(),target:vec3Schema.optional()}).optional(),
  light:z.object({direction:vec3Schema.optional(),intensity:z.number().min(0).max(2).optional(),ambient:z.number().min(0).max(1).optional()}).optional(),
  objects:z.array(z.object({id:z.string().min(1).max(64),geometry:z.enum(['cube','sphere','plane']),position:vec3Schema.optional(),rotation:angle3Schema.optional(),scale:z.number().min(.01).max(20).optional(),spin:angle3Schema.optional(),color:z.string().regex(/^#[0-9a-fA-F]{6}$/),wireframe:z.boolean().optional(),opacity:z.number().min(0).max(1).optional()})).min(1).max(32),
});
export const compositionSchema=z.object({name:z.string().min(1).max(64),timeline:z.string().max(2_000_000),inPoint:z.number().min(0).default(0),speed:z.number().min(.1).max(8).default(1),volume:z.number().min(0).max(2).default(1)});
export const designLocksSchema=z.array(z.enum(['position','size','fontSize','color','fontFamily','lineBreaks'])).max(6);
export const textFitSchema=z.object({minFontSize:z.number().min(4).max(500).default(20),maxLines:z.number().int().min(1).max(100).default(12),autoShrink:z.boolean().default(true),preferredFontSize:z.number().min(4).max(2000).optional()});
export const typographySchema=z.object({cjkSpacing:z.boolean().optional(),keepNumbers:z.boolean().optional(),balance:z.boolean().optional()});
export const designSchema=z.object({name:z.string().max(64),background:z.string().max(40),text:z.string().max(40),muted:z.string().max(40),accent:z.string().max(40),headingFont:z.enum(['sans','serif','kuaile','qingke','mashan']),bodyFont:z.enum(['sans','serif']),baseSize:z.number().min(12).max(120),scale:z.number().min(1.1).max(3),margin:z.number().min(.02).max(.2),columns:z.number().int().min(2).max(24),baseline:z.number().min(2).max(64)});
export const overlaySchema = z.object({
  designLocks:designLocksSchema.optional(), textFit:textFitSchema.optional(), designRole:z.enum(["heading","subheading","body","caption","accent"]).optional(), typography:typographySchema.optional(), composition:compositionSchema.optional(), scene3d:scene3dSchema.optional(), styleRole:z.string().min(1).max(64).optional(), componentSlot:z.string().min(1).max(64).optional(), cues:z.array(cueSchema).max(100).optional(),
  particles: particlesSchema.optional(), audioReactive: audioReactiveSchema.optional(), motionBlur: motionBlurSchema.optional(), autoSize: autoSizeSchema.optional(), layoutExclude: z.boolean().optional(),
  glass: glassSchema.optional(),
  sweep: sweepSchema.optional(),
  trackMatte: trackMatteSchema.optional(), shared: sharedElementSchema.optional(),
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
  // v5 版式：x/y 给出时按锚点（元素中心）自由摆放，覆盖 position；允许略出画布（-1–2）
  x: z.number().min(-1).max(2).optional(),
  y: z.number().min(-1).max(2).optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  maxWidth: z.number().min(0.1).max(1).optional(),
  lineHeight: z.number().min(0.8).max(3).optional(),
  letterSpacing: z.number().min(-0.2).max(1).optional(), // em
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  stroke: z.object({ color: colorSchema, width: z.number().min(0).max(40) }).optional(),
  follow: followSchema.optional(),
  connector: connectorSchema.optional(),
  mask: maskSchema.optional(),
  motionPath: motionPathSchema.optional(),
  shadow: shadowSchema.optional(),
  filter: filterSchema.optional(),
  transform3d: transform3dSchema.optional(),
  blendMode: z.enum(BLEND_MODES).optional(),
  background: z.object({
    color: colorSchema,
    opacity: z.number().min(0).max(1).optional(),
    padding: z.number().min(0).max(200).optional(),
    radius: z.number().min(0).max(200).optional(),
  }).optional(),
  // subtitle 字幕（永远在最上层）/ title 标题 / text 文本框 / shape 形状 / image 图片 / icon 图标 / chart 图表 /
  // math 公式（text 为 LaTeX）/ plot 坐标系 / camera 镜头；缺省按字幕
  kind: z.enum(ELEMENT_KINDS).optional(),
  track: z.number().int().min(0).max(31).optional(),
  // ---- v6 元素 ----
  name: z.string().max(40).optional(), // 图层名（面板与 AI 引用用）
  group: z.string().max(64).optional(), // 同组元素（如一页幻灯片）在时间线上合并显示、一起移动
  w: z.number().min(0.002).max(4).optional(), // 盒子宽（画布宽度的比例）；文字给了 w 就在盒子里排版
  h: z.number().min(0.002).max(4).optional(), // 盒子高（画布高度的比例）
  rotate: z.number().min(-3600).max(3600).optional(), // 静态旋转（度），rotation 关键帧叠加在上面
  opacity: z.number().min(0).max(1).optional(),
  valign: z.enum(["top", "middle", "bottom"]).optional(),
  padding: z.number().min(0).max(1000).optional(), // 盒内文字边距（像素）
  list: z.enum(LIST_STYLES).optional(), // 每行一个列表项
  accent: colorSchema.optional(), // 强调色：==文字== 高亮、列表符号
  counter: counterSchema.optional(), // 数字滚动：显示 from→to（progress 驱动）
  textEffect: textEffectSchema.optional(), // 逐字/逐词/逐行入场
  shape: shapeSchema.optional(),
  image: imageSchema.optional(),
  icon: iconSchema.optional(),
  chart: chartSchema.optional(),
  // ---- v7 数学动画 ----
  plot: plotSchema.optional(),
  morph: morphSchema.optional(),
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

const safeName=z.string().min(1).max(64).refine(n=>!['__proto__','constructor','prototype'].includes(n));
export const themeSchema=z.object({name:z.string().max(64),background:z.string().max(40).optional(),gap:z.number().min(0).max(1000).optional(),roles:z.record(safeName,z.object({color:z.string().max(40).optional(),fill:fillSchema.optional(),fontFamily:z.string().max(100).optional(),fontSize:z.number().min(4).max(500).optional(),radius:z.number().min(0).max(1000).optional(),padding:z.number().min(0).max(500).optional(),shadow:shadowSchema.optional()}))});
export const designSceneSchema=z.object({name:z.string().min(1).max(64),start:z.number().min(0).max(86400),end:z.number().positive().max(86400),design:designSchema.partial().default({})}).refine(v=>v.end>v.start,'场景结束必须晚于开始');
export const componentSchema=z.object({duration:z.number().positive().max(86400),overlays:z.array(overlaySchema).min(1).max(100),state:groupStateSchema.optional()});
// 输入：v1–v7 字段都收（字幕/标记 id 可缺，由归一化补齐）
const timelineInputSchema = z.object({
  designScenes:z.record(safeName,designSceneSchema).optional(), design:designSchema.optional(), theme:themeSchema.optional(), components:z.record(safeName,componentSchema).optional(),
  groups: z.record(groupStateSchema).optional(),
  animationLibrary: z.record(z.string().min(1).max(64).refine(n=>!["__proto__","constructor","prototype"].includes(n)), animationClipSchema).optional(),
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
  designScenes:z.record(safeName,designSceneSchema).optional(), design:designSchema.optional(), theme:themeSchema.optional(), components:z.record(safeName,componentSchema).optional(),
  groups: z.record(groupStateSchema).optional(),
  animationLibrary: z.record(z.string().min(1).max(64).refine(n=>!["__proto__","constructor","prototype"].includes(n)), animationClipSchema).optional(),
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
export type LayoutSpec = z.infer<typeof layoutSchema>;
export type AutoSize = z.infer<typeof autoSizeSchema>;
export type MotionBlurSpec = z.infer<typeof motionBlurSchema>;
export type TrackMatte = z.infer<typeof trackMatteSchema>;
export type SweepSpec = z.infer<typeof sweepSchema>;
export type AnimationClip = z.infer<typeof animationClipSchema>;
export type GlassSpec = z.infer<typeof glassSchema>;
export type SpringSpec = z.infer<typeof springSchema>;
export type FollowSpec = z.infer<typeof followSchema>;
export type ConnectorSpec = z.infer<typeof connectorSchema>;
export type GroupState = z.infer<typeof groupStateSchema>;
export type ElementMask = z.infer<typeof maskSchema>;
export type MotionPath = z.infer<typeof motionPathSchema>;
export type Transform3d = z.infer<typeof transform3dSchema>;
export type Filter = z.infer<typeof filterSchema>;
export type Effect = z.infer<typeof effectSchema>;
export type Clip = z.infer<typeof clipSchema>;
export type VideoTrack = z.infer<typeof videoTrackSchema>;
export type AudioClip = z.infer<typeof audioClipSchema>;
export type AudioTrack = z.infer<typeof audioTrackSchema>;
export type ShadowLayer = z.infer<typeof shadowLayerSchema>;
export type Overlay = z.infer<typeof overlaySchema>;
export type Fill = z.infer<typeof fillSchema>;
export type ShapeSpec = z.infer<typeof shapeSchema>;
export type ChartSpec = z.infer<typeof chartSchema>;
export type PlotSpec = z.infer<typeof plotSchema>;
export type PlotItem = z.infer<typeof plotItemSchema>;
export type MorphSpec = z.infer<typeof morphSchema>;
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

// v1 → v7 迁移 + 不变量维护（至少一条视频轨、id 全局唯一、时长至少一帧）
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

  return { ...(input.designScenes?{designScenes:input.designScenes}:{}), ...(input.design?{design:input.design}:{}), ...(input.theme?{theme:input.theme}:{}), ...(input.components&&Object.keys(input.components).length?{components:input.components}:{}), ...(input.animationLibrary && Object.keys(input.animationLibrary).length ? { animationLibrary: input.animationLibrary } : {}), ...(input.groups && Object.keys(input.groups).length ? { groups: input.groups } : {}), meta: input.meta, version: SCHEMA_VERSION, videoTracks, audioTracks, overlays, markers } as Timeline;
}

function relationshipIssues(overlays: Overlay[]): string[] {
  const byId = new Map(overlays.map(o => [o.id, o]));
  const issues: string[] = [];
  for (const o of overlays) {
    if(o.trackMatte){
      const source=byId.get(o.trackMatte.source);
      if(!source||source.id===o.id||source.trackMatte||source.group!==o.group||!isMatteSource(source))issues.push('overlays.'+o.id+': 遮罩源无效或不在同一分组');
    }
    const refs = [...(o.follow ? [o.follow.target] : []), ...(o.connector ? [o.connector.from, o.connector.to] : [])];
    if (refs.some(id => id === o.id || !byId.has(id) || byId.get(id)?.kind === "camera" || byId.get(id)?.connector)) issues.push("overlays." + o.id + ": 绑定对象无效");
    const seen = new Set<string>([o.id]); let target = o.follow?.target;
    while (target) {
      if (seen.has(target)) { issues.push("overlays." + o.id + ": 循环跟随"); break; }
      seen.add(target); target = byId.get(target)?.follow?.target;
    }
  }
  return issues;
}

function clipMatteIssues(t: Timeline): string[] {
  const issues:string[]=[];
  try{resolveCues(t);}catch(e){issues.push(String(e));}
  for(const tr of t.videoTracks)for(const c of tr.clips)if(c.trackMatte){
    const source=t.overlays.find(o=>o.id===c.trackMatte!.source);
    if(!source||source.trackMatte||source.group||!isMatteSource(source))issues.push('clip.'+c.id+': 遮罩源无效');
  }
  return issues;
}

// 解析 + 校验 + 归一化（对象或字符串），失败抛出带路径的错误；旧格式自动升级
export const parseTimeline = (input: unknown, depth = 0): Timeline => {
  if(depth>4)throw new Error("嵌套合成最多 4 层");
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
  const normalized = applyLayout(normalize(result.data));
  for(const o of [...normalized.overlays,...Object.values(normalized.components??{}).flatMap(c=>c.overlays)])if(o.composition){const child=parseTimeline(o.composition.timeline,depth+1);o.composition.timeline=JSON.stringify(child);}
  const refs = [...relationshipIssues(normalized.overlays),...clipMatteIssues(normalized),...designSceneIssues(normalized)];
  if (refs.length) throw new Error(refs.slice(0, 12).join("\n"));
  return normalized;
};

function designSceneIssues(t:Timeline):string[]{const scenes=Object.entries(t.designScenes??{}).sort((a,b)=>a[1].start-b[1].start);return scenes.slice(1).filter((v,i)=>v[1].start<scenes[i][1].end).map(v=>'设计场景不能重叠：'+v[0]);}

/** 严格校验一份已归一化的时间线（ops 应用后使用）；返回问题列表，空数组 = 合法 */
export const validateTimeline = (t: unknown): string[] => {
  const result = timelineSchema.safeParse(t);
  if (!result.success) return result.error.issues.slice(0, 12).map((i) => (i.path.join(".") || "(root)") + ": " + i.message);
  const issues: string[] = [...relationshipIssues(result.data.overlays),...clipMatteIssues(result.data),...designSceneIssues(result.data)];
  const tl = result.data;
  try { for(const o of [...tl.overlays,...Object.values(tl.components??{}).flatMap(c=>c.overlays)])if(o.composition)parseTimeline(o.composition.timeline,1); }catch(e){issues.push(String(e));}
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
