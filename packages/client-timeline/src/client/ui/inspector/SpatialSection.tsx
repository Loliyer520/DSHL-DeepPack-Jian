import React from 'react';
import type { Clip, Overlay, Transform3d } from '../../../../../engine/src/schema';
import { resolveAnimations } from '../../../../../engine/src/presets';
import type { Op } from '../../engine';
import { AnimNumber, Section, Toggle, useEdit, type Target } from './fields';

const PRESETS = [['flipInX', '上翻入场'], ['flipInY', '侧翻入场'], ['depthIn', '纵深入场'], ['tilt3d', '立体摇摆'], ['spin3d', '三维自转']] as const;
const ALL_3D = new Set([...PRESETS.map(([key]) => key), 'flipOutX', 'flipOutY', 'depthOut']);

export function SpatialSection({ item, target, fps, now, kind }: { item: Clip | Overlay; target: Target; fps: number; now: number; kind: 'clip' | 'overlay' }) {
  const { commit } = useEdit();
  const spec = item.transform3d ?? {};
  const op = kind === 'clip' ? 'updateClip' : 'updateOverlay';
  const patch = (value: Record<string, unknown>): Op[] => [{ op, id: item.id, patch: value }];
  const set = (value: Partial<Transform3d>) => patch({ transform3d: { ...spec, ...value } });
  const anim = { target: { ...target, animations: resolveAnimations(item, target.duration) }, fps, now };
  return <Section title="3D 透视" extra={<button type="button" className="dj-btn" onClick={() => commit([
    ...patch({ transform3d: null, effects: (item.effects ?? []).filter((e) => !ALL_3D.has(e.preset)) }),
    ...['rotationX', 'rotationY', 'z', 'perspective'].map((channel): Op => ({ op: 'clearKeyframes', id: item.id, channel })),
  ], '重置 3D 变换')}>重置</button>}>
    <div className="dj-chips">{PRESETS.map(([key, label]) => <button type="button" className="dj-chip" key={key} onClick={() => commit(patch({ animationPreset: key }), label)}>{label}</button>)}</div>
    <div className="dj-grid" style={{ marginTop: 8 }}>
      <AnimNumber {...anim} channel="rotationX" label="俯仰 X" value={spec.rotateX ?? 0} step={1} min={-3600} max={3600} digits={1} suffix="°" staticOps={(v) => set({ rotateX: v })} />
      <AnimNumber {...anim} channel="rotationY" label="侧转 Y" value={spec.rotateY ?? 0} step={1} min={-3600} max={3600} digits={1} suffix="°" staticOps={(v) => set({ rotateY: v })} />
      <AnimNumber {...anim} channel="z" label="纵深 Z" value={spec.z ?? 0} step={10} min={-2000} max={1000} digits={0} suffix="px" staticOps={(v) => set({ z: v })} />
      <AnimNumber {...anim} channel="perspective" label="透视距离" value={spec.perspective ?? 1200} step={20} min={200} max={5000} digits={0} suffix="px" staticOps={(v) => set({ perspective: v })} />
      <Toggle label="显示背面" checked={spec.backface !== 'hidden'} onChange={(v) => commit(set({ backface: v ? 'visible' : 'hidden' }), '设置背面可见性')} />
    </div>
    <p className="dj-hint">透视距离越小，近大远小越明显。纵深正值靠近镜头；点 ◆ 可制作翻转、悬浮和推进动画。</p>
  </Section>;
}
