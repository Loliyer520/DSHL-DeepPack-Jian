// 文字（字幕/标题）属性：文本与样式 · 位置与时间 · 动画
import React, { useEffect, useState } from 'react';
import type { Overlay, Timeline } from '../../../../../engine/src/schema';
import { FONTS } from '../../../../../engine/src/fonts';
import type { Op } from '../../engine';
import { Field } from '../common';
import { AnimationTab } from './ClipInspector';
import { AnimNumber, ColorField, NumberField, Section, Seg, Toggle, useEdit, type Target } from './fields';

export type TextTab = 'text' | 'layout' | 'animation';
export const TEXT_TABS: [TextTab, string][] = [['text', '文本'], ['layout', '位置'], ['animation', '动画']];

// 一键样式（剪映“花字”的常用几种）
const STYLES: { label: string; patch: Record<string, unknown> }[] = [
  { label: '白字黑边', patch: { color: '#ffffff', stroke: { color: '#000000', width: 3 }, background: null, shadow: { color: 'rgba(0,0,0,0.6)', blur: 6, y: 2 } } },
  { label: '黄字黑边', patch: { color: '#ffd400', stroke: { color: '#000000', width: 3 }, background: null, shadow: { color: 'rgba(0,0,0,0.6)', blur: 6, y: 2 } } },
  { label: '黑底白字', patch: { color: '#ffffff', stroke: null, background: { color: '#000000', opacity: 0.6, padding: 12, radius: 8 }, shadow: false } },
  { label: '白底黑字', patch: { color: '#111111', stroke: null, background: { color: '#ffffff', opacity: 0.92, padding: 12, radius: 8 }, shadow: false } },
  { label: '霓虹', patch: { color: '#fdf4ff', stroke: null, background: null, shadow: { color: '#e879f9', blur: 24 } } },
  { label: '纯净', patch: { color: '#ffffff', stroke: null, background: null, shadow: false } },
];

const defaultY = (o: Overlay) => (o.position === 'top' ? 0.12 : o.position === 'center' ? 0.5 : 0.88);

function TextBox({ o }: { o: Overlay }) {
  const { commit } = useEdit();
  const [draft, setDraft] = useState(o.text);
  useEffect(() => setDraft(o.text), [o.id, o.text]);
  const save = () => { if (draft !== o.text) commit([{ op: 'updateOverlay', id: o.id, patch: { text: draft } }], '修改文字'); };
  return (
    <textarea className="dj-textarea" aria-label="文字内容" rows={3} value={draft} placeholder="输入文字（Ctrl+Enter 保存）"
      onChange={(e) => setDraft(e.target.value)} onBlur={save}
      onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); save(); } if (e.key === 'Escape') { setDraft(o.text); e.currentTarget.blur(); } }} />
  );
}

export function TextInspector({ o, tab, timeline, now }: { o: Overlay; tab: TextTab; timeline: Timeline; now: number }) {
  const { commit } = useEdit();
  const fps = timeline.meta.fps;
  const target: Target = { id: o.id, start: o.startSeconds, duration: o.endSeconds - o.startSeconds, animations: o.animations };
  const pu = (patch: Record<string, unknown>): Op[] => [{ op: 'updateOverlay', id: o.id, patch }];
  const set = (patch: Record<string, unknown>, label: string) => commit(pu(patch), label);
  const anim = { target, fps, now };
  if (tab === 'animation') return <AnimationTab target={target} kind="overlay" effects={o.effects} fps={fps} now={now} />;
  if (tab === 'layout') return (
    <>
      <Section title="位置">
        <Seg label="预设位置" value={o.x === undefined && o.y === undefined ? o.position : undefined} options={[['top', '顶部'], ['center', '居中'], ['bottom', '底部']]}
          onChange={(v) => set({ position: v, x: null, y: null }, '文字位置')} />
        <div className="dj-grid" style={{ marginTop: 8 }}>
          <NumberField label="水平" value={o.x ?? 0.5} scale={100} suffix="%" step={0.005} min={0} max={1} digits={1} ops={(v) => pu({ x: v, y: o.y ?? defaultY(o) })} editLabel="移动文字" />
          <NumberField label="垂直" value={o.y ?? defaultY(o)} scale={100} suffix="%" step={0.005} min={0} max={1} digits={1} ops={(v) => pu({ y: v, x: o.x ?? 0.5 })} editLabel="移动文字" />
          <NumberField label="最大宽度" value={o.maxWidth ?? 0.9} scale={100} suffix="%" step={0.01} min={0.1} max={1} digits={0} ops={(v) => pu({ maxWidth: v })} />
        </div>
      </Section>
      <Section title="时间">
        <div className="dj-grid">
          <NumberField label="开始" value={o.startSeconds} step={1 / fps} min={0} suffix="s" ops={(v) => pu({ startSeconds: v, endSeconds: Math.max(v + 1 / fps, o.endSeconds) })} editLabel="调整开始" />
          <NumberField label="结束" value={o.endSeconds} step={1 / fps} min={o.startSeconds + 1 / fps} suffix="s" ops={(v) => pu({ endSeconds: v })} editLabel="调整结束" />
          <NumberField label="时长" value={o.endSeconds - o.startSeconds} step={1 / fps} min={1 / fps} suffix="s" ops={(v) => pu({ endSeconds: o.startSeconds + v })} editLabel="调整时长" />
        </div>
      </Section>
      <Section title="变换">
        <div className="dj-grid">
          <AnimNumber {...anim} channel="scale" label="缩放" scale={100} suffix="%" step={0.01} min={0.05} max={10} digits={0} />
          <AnimNumber {...anim} channel="rotation" label="旋转" step={1} min={-3600} max={3600} digits={1} suffix="°" />
          <AnimNumber {...anim} channel="x" label="位移 X" scale={100} suffix="%" step={0.005} min={-2} max={2} digits={1} />
          <AnimNumber {...anim} channel="y" label="位移 Y" scale={100} suffix="%" step={0.005} min={-2} max={2} digits={1} />
          <AnimNumber {...anim} channel="opacity" label="不透明度" scale={100} suffix="%" step={0.01} min={0} max={1} digits={0} />
        </div>
      </Section>
    </>
  );
  const stroke = o.stroke;
  const shadow = o.shadow === false ? null : o.shadow;
  const bg = o.background;
  return (
    <>
      <Section title="文字">
        <TextBox o={o} />
        <div style={{ marginTop: 8 }}><Seg label="类型" value={o.kind ?? 'subtitle'} options={[['subtitle', '字幕'], ['title', '标题']]} onChange={(v) => set({ kind: v }, v === 'title' ? '设为标题' : '设为字幕')} /></div>
      </Section>
      <Section title="预设样式">
        <div className="dj-chips">{STYLES.map((s) => <button key={s.label} type="button" className="dj-chip" onClick={() => set(s.patch, '样式「' + s.label + '」')}>{s.label}</button>)}</div>
      </Section>
      <Section title="字体">
        <div className="dj-grid">
          <Field label="字体">
            <select className="dj-select" value={o.fontFamily ?? 'sans'} onChange={(e) => set({ fontFamily: e.target.value }, '字体')}>
              {FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </Field>
          <NumberField label="字号" value={o.fontSize} step={1} min={4} max={2000} digits={0} suffix="px" ops={(v) => pu({ fontSize: Math.round(v) })} />
          <Field label="字重">
            <select className="dj-select" value={o.fontWeight ?? 600} onChange={(e) => set({ fontWeight: Number(e.target.value) }, '字重')}>
              {[300, 400, 500, 600, 700, 800, 900].map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </Field>
          <ColorField label="颜色" value={o.color} onChange={(v) => set({ color: v }, '文字颜色')} />
          <Toggle label="斜体" checked={Boolean(o.italic)} onChange={(v) => set({ italic: v }, '斜体')} />
          <Toggle label="下划线" checked={Boolean(o.underline)} onChange={(v) => set({ underline: v }, '下划线')} />
        </div>
        <div style={{ marginTop: 8 }}><Seg label="对齐" value={o.align ?? 'center'} options={[['left', '左对齐'], ['center', '居中'], ['right', '右对齐']]} onChange={(v) => set({ align: v }, '对齐')} /></div>
        <div className="dj-grid" style={{ marginTop: 8 }}>
          <NumberField label="字间距" value={o.letterSpacing ?? 0} step={0.01} min={-0.2} max={1} suffix="em" ops={(v) => pu({ letterSpacing: v })} />
          <NumberField label="行高" value={o.lineHeight ?? 1.3} step={0.05} min={0.8} max={3} ops={(v) => pu({ lineHeight: v })} />
        </div>
      </Section>
      <Section title="描边" extra={<Toggle label="" checked={Boolean(stroke)} onChange={(v) => set({ stroke: v ? { color: '#000000', width: 3 } : null }, v ? '开启描边' : '关闭描边')} />}>
        {stroke && <div className="dj-grid">
          <ColorField label="颜色" value={stroke.color} onChange={(v) => set({ stroke: { ...stroke, color: v } }, '描边颜色')} />
          <NumberField label="粗细" value={stroke.width} step={0.5} min={0} max={40} digits={1} suffix="px" ops={(v) => pu({ stroke: { ...stroke, width: v } })} editLabel="描边粗细" />
        </div>}
      </Section>
      <Section title="阴影" extra={<Toggle label="" checked={Boolean(shadow)} onChange={(v) => set({ shadow: v ? { color: 'rgba(0,0,0,0.6)', blur: 8, y: 2 } : false }, v ? '开启阴影' : '关闭阴影')} />}>
        {shadow && <div className="dj-grid">
          <ColorField label="颜色" value={shadow.color} onChange={(v) => set({ shadow: { ...shadow, color: v } }, '阴影颜色')} />
          <NumberField label="模糊" value={shadow.blur} step={1} min={0} max={80} digits={0} suffix="px" ops={(v) => pu({ shadow: { ...shadow, blur: v } })} editLabel="阴影模糊" />
          <NumberField label="偏移 X" value={shadow.x ?? 0} step={1} min={-80} max={80} digits={0} ops={(v) => pu({ shadow: { ...shadow, x: v } })} editLabel="阴影偏移" />
          <NumberField label="偏移 Y" value={shadow.y ?? 2} step={1} min={-80} max={80} digits={0} ops={(v) => pu({ shadow: { ...shadow, y: v } })} editLabel="阴影偏移" />
        </div>}
      </Section>
      <Section title="背景" extra={<Toggle label="" checked={Boolean(bg)} onChange={(v) => set({ background: v ? { color: '#000000', opacity: 0.6, padding: 12, radius: 8 } : null }, v ? '开启背景' : '关闭背景')} />}>
        {bg && <div className="dj-grid">
          <ColorField label="颜色" value={bg.color} onChange={(v) => set({ background: { ...bg, color: v } }, '背景颜色')} />
          <NumberField label="不透明度" value={bg.opacity ?? 1} scale={100} suffix="%" step={0.01} min={0} max={1} digits={0} ops={(v) => pu({ background: { ...bg, opacity: v } })} editLabel="背景不透明度" />
          <NumberField label="内边距" value={bg.padding ?? 12} step={1} min={0} max={200} digits={0} suffix="px" ops={(v) => pu({ background: { ...bg, padding: v } })} editLabel="背景内边距" />
          <NumberField label="圆角" value={bg.radius ?? 0} step={1} min={0} max={200} digits={0} suffix="px" ops={(v) => pu({ background: { ...bg, radius: v } })} editLabel="背景圆角" />
        </div>}
      </Section>
    </>
  );
}
