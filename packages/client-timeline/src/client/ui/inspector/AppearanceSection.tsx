import React from 'react';
import type { Overlay, ShadowLayer } from '../../../../../engine/src/schema';
import { SHADOW_PRESETS, shadowLayers } from '../../../../../engine/src/appearance';
import { BLEND_MODES } from '../../../../../engine/src/timeline';
import { BLEND_LABEL } from './ClipInspector';
import { ColorField, NumberField, Section, Toggle, useEdit } from './fields';
import { Field } from '../common';
import type { Op } from '../../engine';

export function AppearanceSection({ o }: { o: Overlay }) {
  const { commit } = useEdit();
  const ops = (patch: Record<string, unknown>): Op[] => [{ op: 'updateOverlay', id: o.id, patch }];
  const layers = shadowLayers(o.shadow);
  const setLayers = (next: ShadowLayer[]) => ops({ shadow: next.length === 0 ? false : next.length === 1 ? next[0] : next });
  const layerOps = (i: number, patch: Partial<ShadowLayer>) => setLayers(layers.map((s, j) => i === j ? { ...s, ...patch } : s));
  const filter = o.filter ?? {};
  const defaultShadow = o.shadow === undefined && (!o.kind || ['subtitle', 'title'].includes(o.kind));
  return <>
    <Section title="阴影与发光" extra={<Toggle label="" checked={layers.length > 0 || defaultShadow} onChange={(v) => commit(ops({ shadow: v ? SHADOW_PRESETS[1].shadow : false }), v ? '开启阴影' : '关闭阴影')} />}>
      <div className="dj-chips">{SHADOW_PRESETS.map((p) => <button type="button" className="dj-chip" key={p.name} onClick={() => commit(ops({ shadow: p.shadow }), '阴影：' + p.name)}>{p.name}</button>)}</div>
      {layers.map((s, i) => <div key={i} style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>第 {i + 1} 层{s.inset ? " · 内阴影" : " · 外阴影"}</span>
          <button type="button" className="dj-chip" aria-label={'删除第 ' + (i + 1) + ' 层阴影'} onClick={() => commit(setLayers(layers.filter((_, j) => j !== i)), '删除阴影层')}>删除</button>
        </div>
        <div className="dj-grid">
          <Toggle label="内阴影" checked={s.inset??false} onChange={v=>commit(layerOps(i,{inset:v}),'阴影方向')}/>
          <ColorField label="颜色" value={s.color} onChange={(v) => commit(layerOps(i, { color: v }), '阴影颜色')} />
          <NumberField label="不透明度" value={s.opacity ?? 1} scale={100} suffix="%" step={0.01} min={0} max={1} digits={0} ops={(v) => layerOps(i, { opacity: v })} editLabel="阴影不透明度" />
          <NumberField label="模糊" value={s.blur} step={1} min={0} max={200} digits={0} suffix="px" ops={(v) => layerOps(i, { blur: v })} editLabel="阴影模糊" />
          <NumberField label="扩展" value={s.spread ?? 0} step={1} min={-100} max={200} digits={0} suffix="px" ops={(v) => layerOps(i, { spread: v })} editLabel="阴影扩展" />
          <NumberField label="偏移 X" value={s.x ?? 0} step={1} min={-1000} max={1000} digits={0} suffix="px" ops={(v) => layerOps(i, { x: v })} editLabel="阴影偏移" />
          <NumberField label="偏移 Y" value={s.y ?? (!o.kind || ['subtitle', 'title', 'text'].includes(o.kind) ? 2 : 4)} step={1} min={-1000} max={1000} digits={0} suffix="px" ops={(v) => layerOps(i, { y: v })} editLabel="阴影偏移" />
        </div>
      </div>)}
      {layers.length > 0 && layers.length < 8 && <button type="button" className="dj-chip" style={{ marginTop: 8 }} onClick={() => commit(setLayers([...layers, { color: '#000000', opacity: 0.15, blur: 32, y: 12 }]), '添加阴影层')}>添加阴影层</button>}
      {defaultShadow && <p className="dj-hint">当前使用字幕默认阴影。选择预设可自定义，选择“无”可关闭。</p>}
    </Section>
    <Section title="磨砂玻璃" extra={<Toggle label="" checked={!!o.glass} onChange={v=>commit(ops({glass:v?{blur:18,saturation:1.3,opacity:.12,radius:16}:null,...(v&&o.kind==='shape'?{shape:{...o.shape,fill:'rgba(255,255,255,0)'}}:{})}),'磨砂玻璃')}/>}>
      {o.glass&&<div className="dj-grid">
        <NumberField label="背景模糊" value={o.glass.blur??18} min={0} max={100} step={1} suffix="px" ops={v=>ops({glass:{...o.glass,blur:v}})}/>
        <NumberField label="背景饱和度" value={o.glass.saturation??1.3} min={0} max={3} step={.05} ops={v=>ops({glass:{...o.glass,saturation:v}})}/>
        <NumberField label="背景亮度" value={o.glass.brightness??1} min={0} max={2} step={.05} ops={v=>ops({glass:{...o.glass,brightness:v}})}/>
        <ColorField label="玻璃底色" value={o.glass.tint??'#ffffff'} onChange={v=>commit(ops({glass:{...o.glass,tint:v}}),'玻璃底色')}/>
        <NumberField label="底色透明度" value={o.glass.opacity??.12} min={0} max={1} step={.01} scale={100} suffix="%" ops={v=>ops({glass:{...o.glass,opacity:v}})}/>
        <NumberField label="圆角" value={o.glass.radius??16} min={0} max={1000} step={1} suffix="px" ops={v=>ops({glass:{...o.glass,radius:v}})}/>
        <NumberField label="亮边透明度" value={o.glass.borderOpacity??.25} min={0} max={1} step={.01} scale={100} suffix="%" ops={v=>ops({glass:{...o.glass,borderOpacity:v}})}/>
      </div>}
      <p className="dj-hint">模糊元素背后的画面，文字保持清晰。开启时会把形状填充设为透明。</p>
    </Section>
    <Section title="滤镜与混合">
      <div className="dj-grid">
        {([
          ['blur', '模糊', 0, 20, 0, 0.5, 'px'],
          ['brightness', '亮度', 0, 3, 1, 0.05, ''],
          ['contrast', '对比度', 0, 3, 1, 0.05, ''],
          ['saturate', '饱和度', 0, 3, 1, 0.05, ''],
          ['grayscale', '灰度', 0, 1, 0, 0.05, ''],
          ['sepia', '复古', 0, 1, 0, 0.05, ''],
          ['hueRotate', '色相', 0, 360, 0, 1, '°'],
        ] as const).map(([key, label, min, max, fallback, step, suffix]) => <NumberField key={key} label={label} value={filter[key] ?? fallback} min={min} max={max} step={step} digits={step < 1 ? 2 : 0} suffix={suffix} ops={(v) => ops({ filter: { ...filter, [key]: v } })} editLabel={label} />)}
        <Field label="混合模式"><select className="dj-select" value={o.blendMode ?? 'normal'} onChange={(e) => commit(ops({ blendMode: e.target.value }), '混合模式')}>
          {BLEND_MODES.map((mode) => <option key={mode} value={mode}>{BLEND_LABEL[mode]}</option>)}
        </select></Field>
      </div>
      <button type="button" className="dj-chip" style={{ marginTop: 8 }} onClick={() => commit(ops({ filter: null, blendMode: null }), '重置滤镜与混合')}>重置滤镜与混合</button>
      <p className="dj-hint">亮度、对比度、饱和度和模糊的关键帧会覆盖对应静态值。</p>
    </Section>
  </>;
}
