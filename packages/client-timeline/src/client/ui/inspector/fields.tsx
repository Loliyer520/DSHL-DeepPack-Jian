// 属性面板通用字段：可打关键帧的数值（剪映式：通道有关键帧后改值即在播放头处自动打帧）、颜色、开关、分段选择
import React, { useEffect, useState } from 'react';
import type { Animations, Keyframe } from '../../../../../engine/src/schema';
import { evalKeyframes } from '../../../../../engine/src/timeline';
import { useEditor } from '../../context';
import type { Op } from '../../engine';
import { Field, KeyframeButton, ScrubNumber } from '../common';

export const CHANNEL_DEFAULT: Record<string, number> = { x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, opacity: 1, rotation: 0, volume: 1, brightness: 1, contrast: 1, saturate: 1, blur: 0 };

/** 被编辑对象：id + 在时间线上的起点/时长（把播放头换算成对象内相对秒） */
export interface Target { id: string; start: number; duration: number; animations?: Animations }

/** 属性面板用的播放头：播放中不跟（避免每帧重渲染整个面板），暂停/定位时更新 */
export function useInspectTime(): number {
  const { clock } = useEditor();
  const [t, setT] = useState(() => clock.time());
  useEffect(() => clock.subscribe((sec, playing) => { if (!playing) setT(sec); }), [clock]);
  return t;
}

export function useEdit() {
  const ed = useEditor();
  return {
    preview: (ops: Op[] | null) => ed.store.preview(ops),
    commit: (ops: Op[], label: string) => { ed.store.preview(null); if (ops.length) ed.store.dispatch(ops, { label }); },
  };
}

const isStatic = (k: Keyframe[] | undefined) => !!k && k.length === 1 && k[0].e === 'hold';

/** 通道状态：off=无关键帧（或只有“静态值”帧）；on=播放头处有帧；has=有帧但不在播放头 */
export function channelState(target: Target, channel: string, now: number, fps: number): { state: 'off' | 'has' | 'on'; rel: number; kfs: Keyframe[] | undefined } {
  const kfs = target.animations?.[channel as keyof Animations];
  const rel = Math.round((now - target.start) * fps) / fps;
  if (!kfs?.length || isStatic(kfs)) return { state: 'off', rel, kfs };
  return { state: kfs.some((k) => Math.abs(k.t - rel) < 0.5 / fps) ? 'on' : 'has', rel, kfs };
}

/**
 * 可动画数值字段。
 * staticOps：没有关键帧时改的是静态属性（如 filter.brightness / opacity / volume），由调用方给出补丁；
 *            不给时用“单个 hold 帧”表示静态值（主轨的位移/缩放/旋转没有独立静态字段）。
 */
export function AnimNumber({ target, channel, label, value: staticValue, staticOps, step = 0.01, min = -Infinity, max = Infinity, digits = 2, suffix = '', scale = 1, fps, now, disabled }: {
  target: Target; channel: string; label: string; value?: number; staticOps?: (v: number) => Op[];
  step?: number; min?: number; max?: number; digits?: number; suffix?: string; scale?: number; fps: number; now: number; disabled?: boolean;
}) {
  const { preview, commit } = useEdit();
  const { state, rel, kfs } = channelState(target, channel, now, fps);
  const inside = rel >= -0.5 / fps && rel <= target.duration + 0.5 / fps;
  const animated = state !== 'off';
  const current = animated ? evalKeyframes(kfs, rel) ?? CHANNEL_DEFAULT[channel] : isStatic(kfs) ? kfs![0].v : staticValue ?? CHANNEL_DEFAULT[channel] ?? 0;
  const opsFor = (v: number): Op[] => {
    if (animated) return [{ op: 'setKeyframe', id: target.id, channel, t: Math.max(0, rel), v }];
    if (staticOps) return staticOps(v);
    return [{ op: 'clearKeyframes', id: target.id, channel }, { op: 'setKeyframe', id: target.id, channel, t: 0, v, e: 'hold' }];
  };
  const toggleKf = () => {
    if (!inside) return;
    if (state === 'on') { commit([{ op: 'removeKeyframe', id: target.id, channel, t: rel }], '删除关键帧'); return; }
    const ops: Op[] = [];
    // 从“静态值”转为动画：把静态帧改成普通帧，再在播放头处打一帧
    const at = Math.max(0, rel);
    if (isStatic(kfs) && Math.abs(kfs![0].t - at) >= 0.5 / fps) ops.push({ op: 'setKeyframe', id: target.id, channel, t: kfs![0].t, v: kfs![0].v, e: 'linear' });
    ops.push({ op: 'setKeyframe', id: target.id, channel, t: at, v: current, e: 'linear' });
    commit(ops, '添加关键帧');
  };
  return (
    <Field label={label} extra={<KeyframeButton state={state} onClick={toggleKf} title={!inside ? '播放头不在该片段内' : state === 'on' ? '删除此处关键帧' : '在播放头处添加关键帧'} />}>
      <ScrubNumber value={current * scale} step={step * scale} min={min * scale} max={max * scale} digits={digits} suffix={suffix} label={label} disabled={disabled || (animated && !inside)}
        onPreview={(v) => preview(v === null ? null : opsFor(v / scale))}
        onCommit={(v) => commit(opsFor(v / scale), (animated ? '关键帧：' : '') + label)} />
    </Field>
  );
}

/** 普通数值字段（拖动预览、松手提交） */
export function NumberField({ label, value, ops, step = 0.1, min, max, digits = 2, suffix, scale = 1, editLabel }: {
  label: string; value: number; ops: (v: number) => Op[]; step?: number; min?: number; max?: number; digits?: number; suffix?: string; scale?: number; editLabel?: string;
}) {
  const { preview, commit } = useEdit();
  return (
    <Field label={label}>
      <ScrubNumber value={value * scale} step={step * scale} min={min === undefined ? undefined : min * scale} max={max === undefined ? undefined : max * scale} digits={digits} suffix={suffix} label={label}
        onPreview={(v) => preview(v === null ? null : ops(v / scale))} onCommit={(v) => commit(ops(v / scale), editLabel ?? label)} />
    </Field>
  );
}

export function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="dj-field dj-row dj-toggle">
      <span>{label}</span>
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const hex = /^#[0-9a-f]{6}$/i.test(value) ? value : '#ffffff';
  return (
    <Field label={label}>
      <span style={{ display: 'flex', gap: 6 }}>
        <input type="color" className="dj-swatch" value={hex} aria-label={label} onChange={(e) => setDraft(e.target.value)} onBlur={() => { if (draft && draft !== value) onChange(draft); setDraft(null); }} />
        <input className="dj-input" value={draft ?? value} aria-label={label + '（文本）'} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') e.currentTarget.blur(); }}
          onBlur={() => { if (draft !== null && draft !== value && /^(#[0-9a-f]{3,8}|rgba?\([^)]*\)|[a-z]+)$/i.test(draft.trim())) onChange(draft.trim()); setDraft(null); }} />
      </span>
    </Field>
  );
}

export function Seg<T extends string>({ value, options, onChange, label }: { value: T | undefined; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="dj-seg dj-seg-full" role="radiogroup" aria-label={label}>
      {options.map(([k, text]) => <button key={k} type="button" role="radio" aria-checked={value === k} onClick={() => onChange(k)}>{text}</button>)}
    </div>
  );
}

export function Section({ title, children, extra }: { title: string; children: React.ReactNode; extra?: React.ReactNode }) {
  return <section className="dj-section"><h4>{title}<span className="dj-spacer" />{extra}</h4>{children}</section>;
}
