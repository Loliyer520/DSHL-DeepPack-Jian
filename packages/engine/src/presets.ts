// D剪 动画预设库：名字 → 关键帧组（展开式，存储层不引入新字段）
// 预设只在面板/服务端 ops 层展开成 animations（纯关键帧+缓动），渲染层只认关键帧——
// 向后兼容、分割平移等已有逻辑不用动。
import type { Animations, Keyframe } from "./schema.js";

export interface AnimationPreset {
  label: string;
  // 进度：驱动 progress 通道（打字机/描边/数字滚动/图表生长/公式书写/坐标系依次画出），可与入场动画叠加
  group: "入场" | "出场" | "组合" | "循环" | "进度";
  // (dur = clip 成片时长秒) → 关键帧组
  expand: (dur: number) => Animations;
}

const kf = (t: number, v: number, e?: Keyframe["e"]): Keyframe => ({ t, v, ...(e ? { e } : {}) });

export const ANIMATION_PRESETS: Record<string, AnimationPreset> = {
  // ---- 入场 ----
  fadeIn: { label: "淡入", group: "入场", expand: (d) => ({ opacity: [kf(0, 0, "out"), kf(Math.min(0.8, d * 0.3), 1)] }) },
  slideInLeft: { label: "左滑入", group: "入场", expand: (d) => ({ x: [kf(0, -0.5, "out"), kf(Math.min(0.7, d * 0.25), 0)], opacity: [kf(0, 0), kf(Math.min(0.4, d * 0.15), 1)] }) },
  slideInRight: { label: "右滑入", group: "入场", expand: (d) => ({ x: [kf(0, 0.5, "out"), kf(Math.min(0.7, d * 0.25), 0)], opacity: [kf(0, 0), kf(Math.min(0.4, d * 0.15), 1)] }) },
  slideInUp: { label: "上滑入", group: "入场", expand: (d) => ({ y: [kf(0, 0.5, "out"), kf(Math.min(0.7, d * 0.25), 0)], opacity: [kf(0, 0), kf(Math.min(0.4, d * 0.15), 1)] }) },
  zoomIn: { label: "放大入场", group: "入场", expand: (d) => ({ scale: [kf(0, 0.3, "out"), kf(Math.min(0.8, d * 0.3), 1)], opacity: [kf(0, 0), kf(Math.min(0.4, d * 0.15), 1)] }) },
  bounceIn: { label: "弹跳入场", group: "入场", expand: (d) => ({ scale: [kf(0, 0.2, "bounce"), kf(Math.min(0.9, d * 0.35), 1)], opacity: [kf(0, 0), kf(Math.min(0.3, d * 0.1), 1)] }) },
  riseUp: { label: "上浮入场", group: "入场", expand: (d) => ({ y: [kf(0, 0.05, "out"), kf(Math.min(0.6, d * 0.3), 0)], opacity: [kf(0, 0), kf(Math.min(0.45, d * 0.2), 1)] }) },
  dropIn: { label: "下落入场", group: "入场", expand: (d) => ({ y: [kf(0, -0.12, "bounce"), kf(Math.min(0.9, d * 0.35), 0)], opacity: [kf(0, 0), kf(Math.min(0.2, d * 0.1), 1)] }) },
  popIn: { label: "弹出", group: "入场", expand: (d) => ({ scale: [kf(0, 0.5, [0.34, 1.56, 0.64, 1]), kf(Math.min(0.55, d * 0.25), 1)], opacity: [kf(0, 0), kf(Math.min(0.25, d * 0.1), 1)] }) },
  blurIn: { label: "模糊入场", group: "入场", expand: (d) => ({ blur: [kf(0, 24, "out"), kf(Math.min(0.7, d * 0.3), 0)], opacity: [kf(0, 0), kf(Math.min(0.5, d * 0.2), 1)] }) },
  stretchIn: { label: "展开", group: "入场", expand: (d) => ({ scaleX: [kf(0, 0, "out"), kf(Math.min(0.6, d * 0.3), 1)], opacity: [kf(0, 0), kf(Math.min(0.2, d * 0.1), 1)] }) },
  wipeInLeft: { label: "向右擦入", group: "入场", expand: (d) => ({ clipR: [kf(0, 1, "inOut"), kf(Math.min(0.8, d * 0.35), 0)] }) },
  wipeInRight: { label: "向左擦入", group: "入场", expand: (d) => ({ clipL: [kf(0, 1, "inOut"), kf(Math.min(0.8, d * 0.35), 0)] }) },
  wipeInUp: { label: "向上擦入", group: "入场", expand: (d) => ({ clipT: [kf(0, 1, "inOut"), kf(Math.min(0.8, d * 0.35), 0)] }) },
  wipeInDown: { label: "向下擦入", group: "入场", expand: (d) => ({ clipB: [kf(0, 1, "inOut"), kf(Math.min(0.8, d * 0.35), 0)] }) },
  spinIn: { label: "旋转入场", group: "入场", expand: (d) => ({ rotation: [kf(0, -180, "out"), kf(Math.min(0.9, d * 0.3), 0)], scale: [kf(0, 0.4, "out"), kf(Math.min(0.9, d * 0.3), 1)], opacity: [kf(0, 0), kf(Math.min(0.4, d * 0.15), 1)] }) },
  // ---- 出场 ----
  fadeOut: { label: "淡出", group: "出场", expand: (d) => ({ opacity: [kf(Math.max(0, d - Math.min(0.8, d * 0.3)), 1, "in"), kf(d, 0)] }) },
  slideOutLeft: { label: "左滑出", group: "出场", expand: (d) => ({ x: [kf(Math.max(0, d - Math.min(0.7, d * 0.25)), 0, "in"), kf(d, -0.5)], opacity: [kf(Math.max(0, d - Math.min(0.4, d * 0.15)), 1), kf(d, 0)] }) },
  slideOutRight: { label: "右滑出", group: "出场", expand: (d) => ({ x: [kf(Math.max(0, d - Math.min(0.7, d * 0.25)), 0, "in"), kf(d, 0.5)], opacity: [kf(Math.max(0, d - Math.min(0.4, d * 0.15)), 1), kf(d, 0)] }) },
  sinkDown: { label: "下沉出场", group: "出场", expand: (d) => ({ y: [kf(Math.max(0, d - Math.min(0.6, d * 0.3)), 0, "in"), kf(d, 0.05)], opacity: [kf(Math.max(0, d - Math.min(0.45, d * 0.2)), 1), kf(d, 0)] }) },
  blurOut: { label: "模糊出场", group: "出场", expand: (d) => ({ blur: [kf(Math.max(0, d - Math.min(0.7, d * 0.3)), 0, "in"), kf(d, 24)], opacity: [kf(Math.max(0, d - Math.min(0.5, d * 0.2)), 1), kf(d, 0)] }) },
  popOut: { label: "缩没", group: "出场", expand: (d) => ({ scale: [kf(Math.max(0, d - Math.min(0.4, d * 0.2)), 1, "in"), kf(d, 0.4)], opacity: [kf(Math.max(0, d - Math.min(0.3, d * 0.15)), 1), kf(d, 0)] }) },
  wipeOutLeft: { label: "向左擦除", group: "出场", expand: (d) => ({ clipR: [kf(Math.max(0, d - Math.min(0.7, d * 0.3)), 0, "inOut"), kf(d, 1)] }) },
  wipeOutRight: { label: "向右擦除", group: "出场", expand: (d) => ({ clipL: [kf(Math.max(0, d - Math.min(0.7, d * 0.3)), 0, "inOut"), kf(d, 1)] }) },
  zoomOut: { label: "缩小出场", group: "出场", expand: (d) => ({ scale: [kf(Math.max(0, d - Math.min(0.8, d * 0.3)), 1, "in"), kf(d, 0.3)], opacity: [kf(Math.max(0, d - Math.min(0.4, d * 0.15)), 1), kf(d, 0)] }) },
  // ---- 组合（覆盖全程） ----
  kenBurns: { label: "镜头缓推", group: "组合", expand: (d) => ({ scale: [kf(0, 1, "inOut"), kf(d, 1.15)], x: [kf(0, 0, "inOut"), kf(d, 0.02)] }) },
  kenBurnsOut: { label: "镜头缓拉", group: "组合", expand: (d) => ({ scale: [kf(0, 1.15, "inOut"), kf(d, 1)], y: [kf(0, 0.02, "inOut"), kf(d, 0)] }) },
  pop: { label: "弹跳强调", group: "组合", expand: (d) => ({ scale: [kf(0, 0.9, "elastic"), kf(Math.min(0.7, d * 0.25), 1)] }) },
  tilt: { label: "摇摆", group: "组合", expand: (d) => ({ rotation: [kf(0, -3, "inOut"), kf(d / 4, 3, "inOut"), kf(d / 2, -3, "inOut"), kf((d * 3) / 4, 3, "inOut"), kf(d, -3)] }) },
  // ---- 进度（progress 通道：打字机 / 描边绘制 / 数字滚动 / 图表生长） ----
  typewriter: { label: "打字机", group: "进度", expand: (d) => ({ progress: [kf(0, 0), kf(Math.min(2.5, d * 0.6), 1)] }) },
  drawIn: { label: "描边绘制", group: "进度", expand: (d) => ({ progress: [kf(0, 0, "inOut"), kf(Math.min(1.5, d * 0.5), 1)] }) },
  countUp: { label: "数字滚动", group: "进度", expand: (d) => ({ progress: [kf(0, 0, "out"), kf(Math.min(2, d * 0.6), 1)] }) },
  growIn: { label: "生长", group: "进度", expand: (d) => ({ progress: [kf(0, 0, "out"), kf(Math.min(1.4, d * 0.45), 1)] }) },
  // 公式逐笔书写（先描边后填色）；坐标系里依次画出坐标轴与各对象
  write: { label: "书写", group: "进度", expand: (d) => ({ progress: [kf(0, 0, "linear"), kf(Math.min(2, d * 0.5), 1)] }) },
  create: { label: "依次画出", group: "进度", expand: (d) => ({ progress: [kf(0, 0, "inOut"), kf(Math.min(3, d * 0.6), 1)] }) },
  // ---- 循环（重复波形，按 1s 周期铺到时长） ----
  pulse: {
    label: "脉冲", group: "循环",
    expand: (d) => {
      const kfs: Keyframe[] = [];
      for (let i = 0; i * 1 <= d; i++) kfs.push(kf(i, i % 2 ? 1.06 : 1, "inOut"));
      if (kfs[kfs.length - 1].t < d) kfs.push(kf(d, kfs.length % 2 ? 1.06 : 1));
      return { scale: kfs };
    },
  },
  wobble: {
    label: "抖动", group: "循环",
    expand: (d) => {
      const kfs: Keyframe[] = [];
      for (let i = 0; i * 0.5 <= d; i++) kfs.push(kf(i * 0.5, i % 2 ? 0.008 : -0.008, "linear"));
      return { x: kfs };
    },
  },
  float: {
    label: "漂浮", group: "循环",
    expand: (d) => {
      const kfs: Keyframe[] = [];
      for (let i = 0; i * 2 <= d; i++) kfs.push(kf(i * 2, i % 2 ? -0.015 : 0.015, "inOut"));
      if (kfs[kfs.length - 1].t < d) kfs.push(kf(d, kfs.length % 2 ? -0.015 : 0.015));
      return { y: kfs };
    },
  },
  spin: { label: "自转", group: "循环", expand: (d) => ({ rotation: [kf(0, 0, "linear"), kf(d, 360 * Math.max(1, Math.round(d / 4)))] }) },
  blink: {
    label: "闪烁", group: "循环",
    expand: (d) => {
      const kfs: Keyframe[] = [];
      for (let i = 0; i * 0.6 <= d; i++) kfs.push(kf(i * 0.6, i % 2 ? 0.35 : 1, "inOut"));
      return { opacity: kfs };
    },
  },
};

// 展开预设 → animations（未知名字返回 undefined，调用方净化）
export const expandAnimationPreset = (name: string, dur: number): Animations | undefined => {
  const p = ANIMATION_PRESETS[name];
  return p ? p.expand(Math.max(0.1, dur)) : undefined;
};

export const listAnimationPresets = () =>
  Object.entries(ANIMATION_PRESETS).map(([key, p]) => ({ key, label: p.label, group: p.group }));

export const presetGroup = (name: string): AnimationPreset["group"] | undefined => ANIMATION_PRESETS[name]?.group;

/**
 * 片段/字幕的生效动画 = 预设引用（按当前时长展开）+ 显式关键帧（同通道显式优先）。
 * 渲染层、面板预览、分割烘焙都走这里，保证预设在裁剪/变速后仍对齐首尾。
 */
export function resolveAnimations(
  item: { animations?: Animations; effects?: { preset: string }[] },
  duration: number,
): Animations | undefined {
  const effects = item.effects ?? [];
  if (!effects.length) return item.animations;
  const out: Animations = {};
  for (const e of effects) {
    const expanded = expandAnimationPreset(e.preset, duration);
    if (!expanded) continue;
    for (const [ch, kfs] of Object.entries(expanded) as [keyof Animations, Keyframe[] | undefined][]) {
      if (!kfs?.length) continue;
      const prev = out[ch];
      // 同通道多个预设（如入场+出场都动 opacity）：按时间拼接，后者在时间上不重叠时可共存
      out[ch] = prev ? [...prev.filter((k) => k.t < kfs[0].t), ...kfs] : kfs;
    }
  }
  for (const [ch, kfs] of Object.entries(item.animations ?? {}) as [keyof Animations, Keyframe[] | undefined][]) {
    if (kfs?.length) out[ch] = kfs;
  }
  return Object.keys(out).length ? out : undefined;
}
