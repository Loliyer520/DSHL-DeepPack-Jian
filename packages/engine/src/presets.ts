// D剪 动画预设库：名字 → 关键帧组（展开式，存储层不引入新字段）
// 预设只在面板/服务端 ops 层展开成 animations（纯关键帧+缓动），渲染层只认关键帧——
// 向后兼容、分割平移等已有逻辑不用动。
import type { Animations, Keyframe } from "./schema.js";

export interface AnimationPreset {
  label: string;
  group: "入场" | "出场" | "组合" | "循环";
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
  spinIn: { label: "旋转入场", group: "入场", expand: (d) => ({ rotation: [kf(0, -180, "out"), kf(Math.min(0.9, d * 0.3), 0)], scale: [kf(0, 0.4, "out"), kf(Math.min(0.9, d * 0.3), 1)], opacity: [kf(0, 0), kf(Math.min(0.4, d * 0.15), 1)] }) },
  // ---- 出场 ----
  fadeOut: { label: "淡出", group: "出场", expand: (d) => ({ opacity: [kf(Math.max(0, d - Math.min(0.8, d * 0.3)), 1, "in"), kf(d, 0)] }) },
  slideOutLeft: { label: "左滑出", group: "出场", expand: (d) => ({ x: [kf(Math.max(0, d - Math.min(0.7, d * 0.25)), 0, "in"), kf(d, -0.5)], opacity: [kf(Math.max(0, d - Math.min(0.4, d * 0.15)), 1), kf(d, 0)] }) },
  slideOutRight: { label: "右滑出", group: "出场", expand: (d) => ({ x: [kf(Math.max(0, d - Math.min(0.7, d * 0.25)), 0, "in"), kf(d, 0.5)], opacity: [kf(Math.max(0, d - Math.min(0.4, d * 0.15)), 1), kf(d, 0)] }) },
  zoomOut: { label: "缩小出场", group: "出场", expand: (d) => ({ scale: [kf(Math.max(0, d - Math.min(0.8, d * 0.3)), 1, "in"), kf(d, 0.3)], opacity: [kf(Math.max(0, d - Math.min(0.4, d * 0.15)), 1), kf(d, 0)] }) },
  // ---- 组合（覆盖全程） ----
  kenBurns: { label: "镜头缓推", group: "组合", expand: (d) => ({ scale: [kf(0, 1, "inOut"), kf(d, 1.15)], x: [kf(0, 0, "inOut"), kf(d, 0.02)] }) },
  kenBurnsOut: { label: "镜头缓拉", group: "组合", expand: (d) => ({ scale: [kf(0, 1.15, "inOut"), kf(d, 1)], y: [kf(0, 0.02, "inOut"), kf(d, 0)] }) },
  pop: { label: "弹跳强调", group: "组合", expand: (d) => ({ scale: [kf(0, 0.9, "elastic"), kf(Math.min(0.7, d * 0.25), 1)] }) },
  tilt: { label: "摇摆", group: "组合", expand: (d) => ({ rotation: [kf(0, -3, "inOut"), kf(d / 4, 3, "inOut"), kf(d / 2, -3, "inOut"), kf((d * 3) / 4, 3, "inOut"), kf(d, -3)] }) },
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
};

// 展开预设 → animations（未知名字返回 undefined，调用方净化）
export const expandAnimationPreset = (name: string, dur: number): Animations | undefined => {
  const p = ANIMATION_PRESETS[name];
  return p ? p.expand(Math.max(0.1, dur)) : undefined;
};

export const listAnimationPresets = () =>
  Object.entries(ANIMATION_PRESETS).map(([key, p]) => ({ key, label: p.label, group: p.group }));
