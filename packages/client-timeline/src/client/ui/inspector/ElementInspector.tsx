// 元素属性（PPT 式）：形状 / 图片 / 图标 / 图表的样式页，文本框排版（列表、强调色、数字滚动、逐字动画），
// 位置与大小（对齐画布、叠放顺序），整页幻灯片（分组）属性，多选对齐与分布
import React, { useEffect, useState } from 'react';
import type { Fill, Overlay, Timeline } from '../../../../../engine/src/schema';
import { CHART_LABEL, CHART_TYPES, LINE_SHAPES, SHAPE_LABEL, SHAPE_TYPES, elementLabel, isBoxElement } from '../../../../../engine/src/timeline';
import { ICONS, ICON_GROUPS } from '../../../../../engine/src/icons';
import { IconSvg, ShapeSvg, elementBoxPx } from '../../../../../engine/src/elements';
import { CHART_PALETTE } from '../../../../../engine/src/charts';
import { useEditor, useStore } from '../../context';
import { absolute, api, type AssetInfo, type Op } from '../../engine';
import { KIND_NAME, type Actions } from '../../actions';
import { timecode } from '../../geometry';
import { Field, ScrubNumber } from '../common';
import { AnimationTab } from './ClipInspector';
import { TextInspector, TimeSection, TransformSection, overlayTarget } from './TextInspector';
import { ColorField, NumberField, Section, Seg, Toggle, useEdit } from './fields';

export type ElTab = 'style' | 'text' | 'layout' | 'animation';
const STYLE_TAB: Record<string, string> = { shape: '形状', image: '图片', icon: '图标', chart: '图表' };
export function elementTabs(o: Overlay): [ElTab, string][] {
  if (!isBoxElement(o)) return [['text', '文本'], ['layout', '位置'], ['animation', '动画']];
  const style: [ElTab, string] = ['style', STYLE_TAB[o.kind ?? ''] ?? '样式'];
  return o.kind === 'shape' ? [style, ['text', '文字'], ['layout', '位置'], ['animation', '动画']] : [style, ['layout', '位置'], ['animation', '动画']];
}

const pu = (o: Overlay, patch: Record<string, unknown>): Op[] => [{ op: 'updateOverlay', id: o.id, patch }];
const isLine = (o: Overlay) => (LINE_SHAPES as readonly string[]).includes(o.shape?.type ?? '');

/** 元素外框（画布比例，中心 + 宽高，不含旋转）：自动高度/旧版字幕取渲染出的版面尺寸 */
export function fracBox(o: Overlay, t: Timeline): { x: number; y: number; w: number; h: number } {
  const W = t.meta.width, H = t.meta.height;
  const node = typeof document !== 'undefined' ? document.querySelector<HTMLElement>('[data-el="' + CSS.escape(o.id) + '"]') : null;
  const px = isBoxElement(o) || o.w !== undefined ? elementBoxPx(o, W, H) : { w: node?.offsetWidth ?? (o.maxWidth ?? 0.9) * W, h: undefined };
  const h = px.h ?? node?.offsetHeight ?? o.fontSize * 1.4;
  const y = o.y ?? (o.position === 'top' ? (60 + h / 2) / H : o.position === 'center' ? 0.5 : 1 - (80 + h / 2) / H);
  return { x: o.x ?? 0.5, y, w: px.w / W, h: h / H };
}

function Chips<T extends string>({ value, options, onChange, label }: { value?: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return <div className="dj-chips" role="group" aria-label={label}>{options.map(([k, text]) => <button key={k} type="button" className="dj-chip" aria-pressed={value === k} onClick={() => onChange(k)}>{text}</button>)}</div>;
}

// ---------- 填充 / 描边 ----------
function FillField({ value, onChange, allowNone = true }: { value: Fill | undefined; onChange: (f: Fill | null, label: string) => void; allowNone?: boolean }) {
  const mode = value === undefined ? 'none' : typeof value === 'string' ? 'solid' : value.type;
  const stops = typeof value === 'object' && value ? value.stops : [{ offset: 0, color: typeof value === 'string' ? value : '#3b82f6' }, { offset: 1, color: '#8b5cf6' }];
  const grad = (patch: { angle?: number; stops?: typeof stops; type?: 'linear' | 'radial' }) => ({ type: patch.type ?? (typeof value === 'object' && value ? value.type : 'linear'), angle: patch.angle ?? (typeof value === 'object' && value?.angle !== undefined ? value.angle : 90), stops: patch.stops ?? stops });
  const opts: ['none' | 'solid' | 'linear' | 'radial', string][] = [['solid', '纯色'], ['linear', '线性渐变'], ['radial', '径向渐变']];
  if (allowNone) opts.unshift(['none', '无']);
  return (
    <>
      <Seg label="填充方式" value={mode} options={opts} onChange={(m) => onChange(m === 'none' ? null : m === 'solid' ? stops[0].color : grad({ type: m }), '填充')} />
      <div className="dj-grid" style={{ marginTop: 8 }}>
        {mode === 'solid' && typeof value === 'string' && <ColorField label="颜色" value={value} onChange={(c) => onChange(c, '填充颜色')} />}
        {(mode === 'linear' || mode === 'radial') && <>
          <ColorField label="起始色" value={stops[0].color} onChange={(c) => onChange(grad({ stops: [{ ...stops[0], color: c }, ...stops.slice(1)] }), '渐变颜色')} />
          <ColorField label="结束色" value={stops[stops.length - 1].color} onChange={(c) => onChange(grad({ stops: [...stops.slice(0, -1), { ...stops[stops.length - 1], color: c }] }), '渐变颜色')} />
          {mode === 'linear' && <Field label="角度"><ScrubNumber value={typeof value === 'object' && value ? value.angle ?? 0 : 0} step={5} min={-360} max={360} digits={0} suffix="°" label="渐变角度" onCommit={(v) => onChange(grad({ angle: v }), '渐变角度')} /></Field>}
        </>}
      </div>
    </>
  );
}

function ShadowSection({ o }: { o: Overlay }) {
  const { commit } = useEdit();
  const shadow = o.shadow === false ? null : o.shadow;
  return (
    <Section title="阴影" extra={<Toggle label="" checked={Boolean(shadow)} onChange={(v) => commit(pu(o, { shadow: v ? { color: 'rgba(0,0,0,0.35)', blur: 24, y: 8 } : false }), v ? '开启阴影' : '关闭阴影')} />}>
      {shadow && <div className="dj-grid">
        <ColorField label="颜色" value={shadow.color} onChange={(v) => commit(pu(o, { shadow: { ...shadow, color: v } }), '阴影颜色')} />
        <NumberField label="模糊" value={shadow.blur} step={1} min={0} max={80} digits={0} suffix="px" ops={(v) => pu(o, { shadow: { ...shadow, blur: v } })} editLabel="阴影模糊" />
        <NumberField label="偏移 X" value={shadow.x ?? 0} step={1} min={-80} max={80} digits={0} ops={(v) => pu(o, { shadow: { ...shadow, x: v } })} editLabel="阴影偏移" />
        <NumberField label="偏移 Y" value={shadow.y ?? 4} step={1} min={-80} max={80} digits={0} ops={(v) => pu(o, { shadow: { ...shadow, y: v } })} editLabel="阴影偏移" />
      </div>}
    </Section>
  );
}

// ---------- 形状 ----------
export function ShapeThumb({ type, size = 24 }: { type: string; size?: number }) {
  const line = (LINE_SHAPES as readonly string[]).includes(type);
  const spec = (line ? { type, stroke: { color: 'currentColor', width: 2 } } : { type, fill: 'currentColor', radius: 4 }) as NonNullable<Overlay['shape']>;
  return <span className="dj-thumb" style={{ width: size, height: size }}><ShapeSvg spec={spec} w={size} h={size} progress={1} uid={'thumb-' + type} /></span>;
}

function ShapePanel({ o, timeline }: { o: Overlay; timeline: Timeline }) {
  const { commit } = useEdit();
  const s = o.shape!;
  const line = isLine(o);
  const set = (shape: Record<string, unknown>, label: string) => commit(pu(o, { shape }), label);
  const stroke = s.stroke;
  return (
    <>
      <Section title="形状">
        <div className="dj-pickgrid">
          {SHAPE_TYPES.map((t) => (
            <button key={t} type="button" title={SHAPE_LABEL[t] ?? t} aria-label={SHAPE_LABEL[t] ?? t} aria-pressed={s.type === t}
              onClick={() => {
                const toLine = (LINE_SHAPES as readonly string[]).includes(t);
                if (toLine === line) { set({ type: t }, '形状：' + (SHAPE_LABEL[t] ?? t)); return; }
                // 线条 ↔ 闭合形状：换掉不适用的填充/描边，并给出合适的高度（闭合形状按像素等宽）
                const { width: W, height: H } = timeline.meta;
                commit(pu(o, toLine
                  ? { shape: { type: t, fill: null, stroke: { color: stroke?.color ?? (typeof s.fill === 'string' ? s.fill : '#ffffff'), width: 6 } }, h: Math.max(0.004, 24 / H) }
                  : { shape: { type: t, fill: stroke?.color ?? '#3b82f6', stroke: null }, h: Math.min(4, ((o.w ?? 0.2) * W) / H) }), '形状：' + (SHAPE_LABEL[t] ?? t));
              }}><ShapeThumb type={t} /></button>
          ))}
        </div>
      </Section>
      {!line && <Section title="填充"><FillField value={s.fill} onChange={(f, label) => set({ fill: f }, label)} /></Section>}
      <Section title={line ? '线条' : '描边'} extra={!line && <Toggle label="" checked={Boolean(stroke)} onChange={(v) => set({ stroke: v ? { color: '#ffffff', width: 4 } : null }, v ? '开启描边' : '关闭描边')} />}>
        {(stroke || line) && <>
          <div className="dj-grid">
            <ColorField label="颜色" value={stroke?.color ?? '#ffffff'} onChange={(v) => set({ stroke: { ...(stroke ?? { width: 6 }), color: v } }, '线条颜色')} />
            <NumberField label="粗细" value={stroke?.width ?? 6} step={0.5} min={0} max={200} digits={1} suffix="px" ops={(v) => pu(o, { shape: { stroke: { ...(stroke ?? { color: '#ffffff' }), width: v } } })} editLabel="线条粗细" />
          </div>
          <div style={{ marginTop: 8 }}><Seg label="线型" value={stroke?.dash ?? 'solid'} options={[['solid', '实线'], ['dashed', '虚线'], ['dotted', '点线']]} onChange={(v) => set({ stroke: { ...(stroke ?? { color: '#ffffff', width: 6 }), dash: v } }, '线型')} /></div>
        </>}
      </Section>
      {(s.type === 'rect' || s.type === 'callout' || s.type === 'star' || s.type === 'ring') && (
        <Section title="细节">
          <div className="dj-grid">
            {(s.type === 'rect' || s.type === 'callout') && <NumberField label="圆角" value={s.radius ?? 0} step={1} min={0} max={2000} digits={0} suffix="px" ops={(v) => pu(o, { shape: { radius: v } })} editLabel="圆角" />}
            {s.type === 'star' && <NumberField label="角数" value={s.points ?? 5} step={1} min={3} max={24} digits={0} ops={(v) => pu(o, { shape: { points: Math.round(v) } })} editLabel="星形角数" />}
            {(s.type === 'star' || s.type === 'ring') && <NumberField label="内径" value={s.inner ?? (s.type === 'star' ? 0.45 : 0.62)} scale={100} suffix="%" step={0.01} min={0.05} max={0.95} digits={0} ops={(v) => pu(o, { shape: { inner: v } })} editLabel="内径" />}
          </div>
        </Section>
      )}
      <ShadowSection o={o} />
    </>
  );
}

// ---------- 图片 ----------
function useImageAssets(): AssetInfo[] | null {
  const project = useStore((s) => s.project);
  const assetsRev = useStore((s) => s.assetsRev);
  const [list, setList] = useState<AssetInfo[] | null>(null);
  const pid = project?.id;
  useEffect(() => {
    if (!pid) return;
    const ac = new AbortController();
    api.assets(pid, ac.signal).then((r) => setList(r.assets.filter((a) => a.type === 'image'))).catch(() => { /* 面板会显示空列表 */ });
    return () => ac.abort();
  }, [pid, assetsRev]);
  return list;
}

function ImagePanel({ o }: { o: Overlay }) {
  const { commit } = useEdit();
  const img = o.image!;
  const assets = useImageAssets();
  const set = (image: Record<string, unknown>, label: string) => commit(pu(o, { image }), label);
  return (
    <>
      <Section title="图片">
        <div className="dj-imgpick">
          {(assets ?? []).map((a) => (
            <button key={a.name} type="button" title={a.name} aria-pressed={a.name === img.src} onClick={() => set({ src: a.name }, '替换图片')}>
              <img src={absolute(a.thumb ?? a.media)} alt="" loading="lazy" />
            </button>
          ))}
          {assets && !assets.length && <p className="dj-hint">素材库里还没有图片：先在“素材”里上传。</p>}
        </div>
        <div style={{ marginTop: 8 }}><Seg label="适应方式" value={img.fit ?? 'cover'} options={[['cover', '裁切填满'], ['contain', '完整显示'], ['fill', '拉伸']]} onChange={(v) => set({ fit: v }, '图片适应')} /></div>
        <div className="dj-grid" style={{ marginTop: 8 }}>
          <NumberField label="圆角" value={img.radius ?? 0} step={1} min={0} max={2000} digits={0} suffix="px" ops={(v) => pu(o, { image: { radius: v } })} editLabel="图片圆角" />
        </div>
      </Section>
      <Section title="边框" extra={<Toggle label="" checked={Boolean(img.border)} onChange={(v) => set({ border: v ? { color: '#ffffff', width: 6 } : null }, v ? '开启边框' : '关闭边框')} />}>
        {img.border && <div className="dj-grid">
          <ColorField label="颜色" value={img.border.color} onChange={(v) => set({ border: { ...img.border!, color: v } }, '边框颜色')} />
          <NumberField label="粗细" value={img.border.width} step={1} min={0} max={200} digits={0} suffix="px" ops={(v) => pu(o, { image: { border: { ...img.border!, width: v } } })} editLabel="边框粗细" />
        </div>}
      </Section>
      <ShadowSection o={o} />
    </>
  );
}

// ---------- 图标 ----------
export function IconPicker({ value, onPick }: { value?: string; onPick: (name: string) => void }) {
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<string>('全部');
  const kw = q.trim().toLowerCase();
  const list = ICONS.filter((i) => (group === '全部' || i.group === group) && (!kw || i.name.includes(kw) || i.label.includes(kw)));
  return (
    <>
      <input className="dj-input" placeholder="搜索图标（中文或英文名）" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.stopPropagation()} />
      <div className="dj-chips" style={{ marginTop: 6 }}>
        {['全部', ...ICON_GROUPS].map((g) => <button key={g} type="button" className="dj-chip" aria-pressed={group === g} onClick={() => setGroup(g)}>{g}</button>)}
      </div>
      <div className="dj-pickgrid dj-icongrid" style={{ marginTop: 6 }}>
        {list.map((i) => (
          <button key={i.name} type="button" title={i.label + ' · ' + i.name} aria-label={i.label} aria-pressed={value === i.name} onClick={() => onPick(i.name)}>
            <span className="dj-thumb"><IconSvg name={i.name} color="currentColor" progress={1} /></span>
          </button>
        ))}
        {!list.length && <p className="dj-hint">没有匹配的图标</p>}
      </div>
    </>
  );
}

function IconPanel({ o }: { o: Overlay }) {
  const { commit } = useEdit();
  const icon = o.icon!;
  return (
    <>
      <Section title="图标"><IconPicker value={icon.name} onPick={(name) => commit(pu(o, { icon: { name } }), '换图标')} /></Section>
      <Section title="样式">
        <div className="dj-grid">
          <ColorField label="颜色" value={o.color} onChange={(v) => commit(pu(o, { color: v }), '图标颜色')} />
          <NumberField label="线宽" value={icon.strokeWidth ?? 2} step={0.25} min={0.25} max={6} digits={2} ops={(v) => pu(o, { icon: { strokeWidth: v } })} editLabel="图标线宽" />
          <Toggle label="内部填充" checked={Boolean(icon.fill)} onChange={(v) => commit(pu(o, { icon: { fill: v ? o.color : null } }), v ? '图标填充' : '取消填充')} />
          {icon.fill && <ColorField label="填充色" value={icon.fill} onChange={(v) => commit(pu(o, { icon: { fill: v } }), '图标填充色')} />}
        </div>
      </Section>
      <ShadowSection o={o} />
    </>
  );
}

// ---------- 图表 ----------
const PALETTES: [string, string[]][] = [
  ['缤纷', CHART_PALETTE],
  ['海洋', ['#0ea5e9', '#38bdf8', '#7dd3fc', '#0369a1', '#22d3ee', '#0891b2']],
  ['暖阳', ['#f97316', '#fb923c', '#facc15', '#ef4444', '#f59e0b', '#fdba74']],
  ['森林', ['#16a34a', '#22c55e', '#86efac', '#15803d', '#65a30d', '#4ade80']],
  ['紫霞', ['#8b5cf6', '#a78bfa', '#c084fc', '#6d28d9', '#e879f9', '#818cf8']],
  ['灰阶', ['#e5e7eb', '#9ca3af', '#6b7280', '#4b5563', '#d1d5db', '#374151']],
];

function DataRow({ label, value, color, onLabel, onValue, onColor, onRemove, canRemove }: { label: string; value: number; color?: string; onLabel: (v: string) => void; onValue: (v: number) => void; onColor: (v: string | null) => void; onRemove: () => void; canRemove: boolean }) {
  const [draft, setDraft] = useState(label);
  useEffect(() => setDraft(label), [label]);
  return (
    <div className="dj-datarow">
      <input className="dj-input" value={draft} placeholder="标签" aria-label="标签" onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') e.currentTarget.blur(); }} onBlur={() => { if (draft !== label) onLabel(draft); }} />
      <ScrubNumber value={value} step={1} digits={2} label="数值" onCommit={onValue} />
      <input type="color" className="dj-swatch" aria-label="颜色" value={color && /^#[0-9a-f]{6}$/i.test(color) ? color : '#888888'} title={color ? '自定义颜色（右键恢复配色）' : '使用配色'} style={{ opacity: color ? 1 : 0.4 }}
        onChange={(e) => onColor(e.target.value)} onContextMenu={(e) => { e.preventDefault(); onColor(null); }} />
      <button type="button" className="dj-icon-btn" aria-label="删除这一项" disabled={!canRemove} onClick={onRemove}>×</button>
    </div>
  );
}

function ChartPanel({ o }: { o: Overlay }) {
  const { commit } = useEdit();
  const c = o.chart!;
  const set = (chart: Record<string, unknown>, label: string) => commit(pu(o, { chart }), label);
  const setData = (data: typeof c.data, label: string) => set({ data }, label);
  const single = c.type === 'progress' || c.type === 'ring';
  const rows = single ? c.data.slice(0, 1) : c.data;
  return (
    <>
      <Section title="图表类型"><Chips label="图表类型" value={c.type} options={CHART_TYPES.map((t) => [t, CHART_LABEL[t] ?? t])} onChange={(t) => set({ type: t }, '图表：' + (CHART_LABEL[t] ?? t))} /></Section>
      <Section title={single ? '数值' : '数据'} extra={!single && <button type="button" className="dj-btn" disabled={c.data.length >= 24} onClick={() => setData([...c.data, { label: '新项', value: c.data[c.data.length - 1]?.value ?? 10 }], '添加数据')}>+ 添加</button>}>
        <div className="dj-datalist">
          {rows.map((d, i) => (
            <DataRow key={i} label={d.label ?? ''} value={d.value} color={d.color} canRemove={c.data.length > 1}
              onLabel={(v) => setData(c.data.map((x, j) => (j === i ? { ...x, label: v || undefined } : x)), '修改标签')}
              onValue={(v) => setData(c.data.map((x, j) => (j === i ? { ...x, value: v } : x)), '修改数值')}
              onColor={(v) => setData(c.data.map((x, j) => (j === i ? { label: x.label, value: x.value, ...(v ? { color: v } : {}) } : x)), '数据颜色')}
              onRemove={() => setData(c.data.filter((_, j) => j !== i), '删除数据')} />
          ))}
        </div>
        {single && <div className="dj-grid" style={{ marginTop: 8 }}><NumberField label="满值" value={c.max ?? 100} step={1} min={0.01} digits={2} ops={(v) => pu(o, { chart: { max: v } })} editLabel="满值" /></div>}
      </Section>
      <Section title="显示">
        <div className="dj-grid">
          <Toggle label="数值" checked={c.showValues !== false} onChange={(v) => set({ showValues: v }, v ? '显示数值' : '隐藏数值')} />
          {!single && <Toggle label="标签" checked={c.showLabels !== false} onChange={(v) => set({ showLabels: v }, v ? '显示标签' : '隐藏标签')} />}
          <Field label="前缀"><TextInput value={c.prefix ?? ''} max={12} onCommit={(v) => set({ prefix: v || null }, '数值前缀')} /></Field>
          <Field label="单位"><TextInput value={c.unit ?? ''} max={12} onCommit={(v) => set({ unit: v || null }, '数值单位')} /></Field>
          <NumberField label="小数位" value={c.decimals ?? 0} step={1} min={0} max={4} digits={0} ops={(v) => pu(o, { chart: { decimals: Math.round(v) } })} editLabel="小数位" />
          <NumberField label={c.type === 'line' || c.type === 'area' ? '线宽' : c.type === 'donut' || c.type === 'ring' || c.type === 'progress' ? '环/条粗细' : '柱宽'} value={c.thickness ?? (c.type === 'donut' ? 0.38 : c.type === 'ring' ? 0.14 : 0.6)} scale={100} suffix="%" step={0.01} min={0.02} max={1} digits={0} ops={(v) => pu(o, { chart: { thickness: v } })} editLabel="粗细" />
          <NumberField label="字号" value={o.fontSize} step={1} min={4} max={400} digits={0} suffix="px" ops={(v) => pu(o, { fontSize: Math.round(v) })} />
          <ColorField label="文字颜色" value={o.color} onChange={(v) => commit(pu(o, { color: v }), '图表文字颜色')} />
          {(single || c.type === 'column' || c.type === 'bar') && <ColorField label="底色" value={c.trackColor ?? 'rgba(255,255,255,0.15)'} onChange={(v) => set({ trackColor: v }, '图表底色')} />}
        </div>
      </Section>
      <Section title="配色">
        <div className="dj-chips">
          {PALETTES.map(([name, colors]) => (
            <button key={name} type="button" className="dj-chip dj-palette" aria-pressed={JSON.stringify(c.colors ?? CHART_PALETTE) === JSON.stringify(colors)} onClick={() => set({ colors }, '图表配色「' + name + '」')}>
              {colors.slice(0, 4).map((col) => <i key={col} style={{ background: col }} />)}{name}
            </button>
          ))}
        </div>
        <p className="dj-hint">单项颜色可在数据行右侧单独设置。</p>
      </Section>
    </>
  );
}

function TextInput({ value, onCommit, max = 80, placeholder }: { value: string; onCommit: (v: string) => void; max?: number; placeholder?: string }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return <input className="dj-input" value={draft} maxLength={max} placeholder={placeholder} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') e.currentTarget.blur(); }} onBlur={() => { if (draft !== value) onCommit(draft.trim()); }} />;
}

// ---------- 文本框排版 ----------
const EFFECT_LABEL: [string, string][] = [['fadeIn', '淡入'], ['fadeUp', '上浮'], ['pop', '弹出'], ['blur', '模糊'], ['drop', '下落'], ['typewriter', '打字']];

function TextBoxSection({ o }: { o: Overlay }) {
  const { commit } = useEdit();
  const set = (patch: Record<string, unknown>, label: string) => commit(pu(o, patch), label);
  const boxed = o.w !== undefined || isBoxElement(o);
  const counter = o.counter;
  const fx = o.textEffect;
  if (o.kind === 'subtitle' || o.kind === undefined) return null;
  return (
    <>
      <Section title="段落">
        <Field label="列表"><Seg label="列表" value={o.list ?? 'none'} options={[['none', '无'], ['bullet', '• 圆点'], ['number', '1. 编号'], ['check', '✓ 勾选']]} onChange={(v) => set({ list: v === 'none' ? null : v }, '列表样式')} /></Field>
        <div className="dj-grid" style={{ marginTop: 8 }}>
          <ColorField label="强调色（==文字==、列表符号）" value={o.accent ?? '#fbbf24'} onChange={(v) => set({ accent: v }, '强调色')} />
          {boxed && <NumberField label="内边距" value={o.padding ?? 0} step={1} min={0} max={1000} digits={0} suffix="px" ops={(v) => pu(o, { padding: v })} editLabel="内边距" />}
        </div>
        {boxed && (o.h !== undefined || isBoxElement(o)) && <div style={{ marginTop: 8 }}><Seg label="垂直对齐" value={o.valign ?? (o.kind === 'shape' ? 'middle' : 'top')} options={[['top', '顶部'], ['middle', '居中'], ['bottom', '底部']]} onChange={(v) => set({ valign: v }, '垂直对齐')} /></div>}
      </Section>
      <Section title="数字滚动" extra={<Toggle label="" checked={Boolean(counter)} onChange={(v) => set(v ? { counter: { from: 0, to: Number(o.text.replace(/[^\d.-]/g, '')) || 100 }, animationPreset: 'countUp' } : { counter: null }, v ? '开启数字滚动' : '关闭数字滚动')} />}>
        {counter ? <div className="dj-grid">
          <NumberField label="起始" value={counter.from} step={1} digits={2} ops={(v) => pu(o, { counter: { ...counter, from: v } })} editLabel="起始数值" />
          <NumberField label="终值" value={counter.to} step={1} digits={2} ops={(v) => pu(o, { counter: { ...counter, to: v } })} editLabel="终值" />
          <NumberField label="小数位" value={counter.decimals ?? 0} step={1} min={0} max={4} digits={0} ops={(v) => pu(o, { counter: { ...counter, decimals: Math.round(v) } })} editLabel="小数位" />
          <Toggle label="千分位" checked={Boolean(counter.separator)} onChange={(v) => set({ counter: { ...counter, separator: v } }, '千分位')} />
          <Field label="前缀"><TextInput value={counter.prefix ?? ''} max={12} placeholder="如 ￥" onCommit={(v) => set({ counter: { ...counter, prefix: v || undefined } }, '数字前缀')} /></Field>
          <Field label="后缀"><TextInput value={counter.suffix ?? ''} max={12} placeholder="如 %" onCommit={(v) => set({ counter: { ...counter, suffix: v || undefined } }, '数字后缀')} /></Field>
        </div> : <p className="dj-hint">数字从起始值滚动到终值（由“动画 › 进度 › 数字滚动”驱动）。</p>}
      </Section>
      {!counter && (
        <Section title="逐字入场" extra={<Toggle label="" checked={Boolean(fx)} onChange={(v) => set({ textEffect: v ? { type: 'fadeUp', by: 'char' } : null }, v ? '开启逐字入场' : '关闭逐字入场')} />}>
          {fx && <>
            <Chips label="效果" value={fx.type} options={EFFECT_LABEL} onChange={(v) => set({ textEffect: { ...fx, type: v } }, '逐字效果')} />
            <div style={{ marginTop: 8 }}><Seg label="单位" value={fx.by ?? 'char'} options={[['char', '逐字'], ['word', '逐词'], ['line', '逐行']]} onChange={(v) => set({ textEffect: { ...fx, by: v } }, '逐字单位')} /></div>
            <div className="dj-grid" style={{ marginTop: 8 }}>
              <NumberField label="间隔" value={fx.interval ?? (fx.by === 'line' ? 0.25 : fx.by === 'word' ? 0.12 : 0.05)} step={0.01} min={0} max={2} suffix="s" ops={(v) => pu(o, { textEffect: { ...fx, interval: v } })} editLabel="逐字间隔" />
              <NumberField label="单个时长" value={fx.duration ?? 0.4} step={0.02} min={0.02} max={5} suffix="s" ops={(v) => pu(o, { textEffect: { ...fx, duration: v } })} editLabel="逐字时长" />
            </div>
          </>}
        </Section>
      )}
    </>
  );
}

// ---------- 位置与大小 ----------
function ArrangeSection({ o, actions }: { o: Overlay; actions: Actions }) {
  return (
    <Section title="叠放顺序">
      <div className="dj-chips">
        <button type="button" className="dj-chip" onClick={() => actions.arrange(o.id, 'front')}>置于顶层</button>
        <button type="button" className="dj-chip" onClick={() => actions.arrange(o.id, 'forward')}>上移一层</button>
        <button type="button" className="dj-chip" onClick={() => actions.arrange(o.id, 'backward')}>下移一层</button>
        <button type="button" className="dj-chip" onClick={() => actions.arrange(o.id, 'back')}>置于底层</button>
      </div>
      {o.kind === 'subtitle' && <p className="dj-hint">字幕始终显示在其他元素之上。</p>}
    </Section>
  );
}

function BoxLayout({ o, timeline, now, actions }: { o: Overlay; timeline: Timeline; now: number; actions: Actions }) {
  const { commit } = useEdit();
  const fps = timeline.meta.fps;
  const box = fracBox(o, timeline);
  const autoH = o.h === undefined && !isBoxElement(o);
  const set = (patch: Record<string, unknown>, label: string) => commit(pu(o, patch), label);
  const ALIGN: [string, string, Record<string, number>][] = [
    ['left', '左', { x: box.w / 2 }], ['hcenter', '水平居中', { x: 0.5 }], ['right', '右', { x: 1 - box.w / 2 }],
    ['top', '上', { y: box.h / 2 }], ['vcenter', '垂直居中', { y: 0.5 }], ['bottom', '下', { y: 1 - box.h / 2 }],
  ];
  return (
    <>
      <Section title="名称">
        <TextInput value={o.name ?? ''} max={40} placeholder={elementLabel(o)} onCommit={(v) => set({ name: v || null }, '重命名元素')} />
      </Section>
      <Section title="位置与大小">
        <div className="dj-grid">
          <NumberField label="中心 X" value={box.x} scale={100} suffix="%" step={0.002} min={-1} max={2} digits={1} ops={(v) => pu(o, { x: v, ...(o.y === undefined ? { y: box.y } : {}) })} editLabel="移动元素" />
          <NumberField label="中心 Y" value={box.y} scale={100} suffix="%" step={0.002} min={-1} max={2} digits={1} ops={(v) => pu(o, { y: v, ...(o.x === undefined ? { x: box.x } : {}) })} editLabel="移动元素" />
          <NumberField label="宽" value={box.w} scale={100} suffix="%" step={0.002} min={0.002} max={4} digits={1} ops={(v) => pu(o, { w: v })} editLabel="调整宽度" />
          {!autoH && <NumberField label="高" value={box.h} scale={100} suffix="%" step={0.002} min={0.002} max={4} digits={1} ops={(v) => pu(o, { h: v })} editLabel="调整高度" />}
          <NumberField label="旋转" value={o.rotate ?? 0} step={1} min={-360} max={360} digits={1} suffix="°" ops={(v) => pu(o, { rotate: v })} editLabel="旋转" />
          <NumberField label="不透明度" value={o.opacity ?? 1} scale={100} suffix="%" step={0.01} min={0} max={1} digits={0} ops={(v) => pu(o, { opacity: v })} editLabel="不透明度" />
          {!isBoxElement(o) && <Toggle label="固定高度" checked={o.h !== undefined} onChange={(v) => set({ h: v ? Math.round(box.h * 1000) / 1000 : null }, v ? '固定高度' : '自动高度')} />}
        </div>
      </Section>
      <Section title="对齐画布">
        <div className="dj-chips">
          {ALIGN.map(([k, label, patch]) => <button key={k} type="button" className="dj-chip" onClick={() => set({ ...patch, ...(o.x === undefined && !('x' in patch) ? { x: box.x } : {}), ...(o.y === undefined && !('y' in patch) ? { y: box.y } : {}) }, '对齐画布：' + label)}>{label}</button>)}
          {isBoxElement(o) && <button type="button" className="dj-chip" onClick={() => set({ x: 0.5, y: 0.5, w: 1, h: 1, rotate: 0 }, '铺满画布')}>铺满画布</button>}
        </div>
      </Section>
      <ArrangeSection o={o} actions={actions} />
      <TimeSection o={o} fps={fps} />
      <TransformSection o={o} fps={fps} now={now} title="动画变换（关键帧）" />
    </>
  );
}

export function ElementInspector({ o, tab, timeline, now, actions }: { o: Overlay; tab: ElTab; timeline: Timeline; now: number; actions: Actions }) {
  const fps = timeline.meta.fps;
  if (tab === 'animation') return <AnimationTab target={overlayTarget(o)} kind="overlay" effects={o.effects} fps={fps} now={now} />;
  if (tab === 'layout') {
    if (o.w !== undefined || isBoxElement(o)) return <BoxLayout o={o} timeline={timeline} now={now} actions={actions} />;
    return <><TextInspector o={o} tab="layout" timeline={timeline} now={now} /><ArrangeSection o={o} actions={actions} /></>;
  }
  if (tab === 'text') return <TextInspector o={o} tab="text" timeline={timeline} now={now} extra={<TextBoxSection o={o} />} />;
  if (o.kind === 'shape' && o.shape) return <ShapePanel o={o} timeline={timeline} />;
  if (o.kind === 'image' && o.image) return <ImagePanel o={o} />;
  if (o.kind === 'icon' && o.icon) return <IconPanel o={o} />;
  if (o.kind === 'chart' && o.chart) return <ChartPanel o={o} />;
  return <div className="dj-empty-state">这个元素缺少样式数据</div>;
}

// ---------- 整页幻灯片 ----------
const SLIDE_ANIMS: [string, string][] = [['riseUp', '上浮'], ['fadeIn', '淡入'], ['popIn', '弹出'], ['blurIn', '模糊'], ['slideInLeft', '左滑入'], ['wipeInLeft', '擦入']];

export function GroupInspector({ group, members, timeline, actions }: { group: string; members: Overlay[]; timeline: Timeline; actions: Actions }) {
  const ed = useEditor();
  const { commit } = useEdit();
  const fps = timeline.meta.fps;
  const start = Math.min(...members.map((o) => o.startSeconds));
  const end = Math.max(...members.map((o) => o.endSeconds));
  const gu = (patch: Record<string, unknown>): Op[] => [{ op: 'updateGroup', group, ...patch }];
  return (
    <>
      <Section title="整页时间">
        <div className="dj-grid">
          <NumberField label="开始" value={start} step={1 / fps} min={0} suffix="s" ops={(v) => gu({ startSeconds: v })} editLabel="移动幻灯片" />
          <NumberField label="时长" value={end - start} step={1 / fps} min={2 / fps} suffix="s" ops={(v) => gu({ endSeconds: start + v })} editLabel="幻灯片时长" />
        </div>
        <p className="dj-hint">元素的先后出场间隔保持不变；改时长时与整页同时结束的元素一起延长。</p>
      </Section>
      <Section title="整页入场动画">
        <div className="dj-chips">
          {SLIDE_ANIMS.map(([k, label]) => <button key={k} type="button" className="dj-chip" onClick={() => commit(members.map((o, i) => ({ op: 'updateOverlay', id: o.id, patch: { animationPreset: i === 0 && isBoxElement(o) && (o.w ?? 0) >= 0.98 ? 'fadeIn' : k } })), '整页动画「' + label + '」')}>{label}</button>)}
          <button type="button" className="dj-chip" onClick={() => commit(members.map((o) => ({ op: 'updateOverlay', id: o.id, patch: { animationPreset: 'fadeOut' } })), '整页淡出')}>+ 结尾淡出</button>
        </div>
      </Section>
      <Section title={'元素（' + members.length + '）'}>
        <div className="dj-list">
          {[...members].reverse().map((o) => (
            <div key={o.id} role="button" tabIndex={0} className="dj-elrow" onClick={() => ed.sel.select({ kind: 'overlay', id: o.id })} onKeyDown={(e) => { if (e.key === 'Enter') ed.sel.select({ kind: 'overlay', id: o.id }); }}>
              <span className="dj-elkind">{KIND_NAME[o.kind ?? 'subtitle'] ?? '元素'}</span>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{elementLabel(o)}</span>
              <small>{timecode(o.startSeconds - start, fps, false)}</small>
            </div>
          ))}
        </div>
        <p className="dj-hint">点一项单独编辑；也可以在画布上直接点选、双击改字。</p>
      </Section>
      <Section title="整页操作">
        <div className="dj-chips">
          <button type="button" className="dj-chip" onClick={actions.duplicateSelection}>复制整页</button>
          <button type="button" className="dj-chip" onClick={() => commit(gu({ ungroup: true }), '解除分组')}>解除分组</button>
          <button type="button" className="dj-chip" onClick={() => actions.askAi() || ed.store.toast('info', '当前宿主不支持插入到对话框')}>交给 AI</button>
          <button type="button" className="dj-chip" style={{ color: 'var(--dj-danger)' }} onClick={() => { commit([{ op: 'removeGroup', group }], '删除幻灯片'); ed.sel.clear(); }}>删除整页</button>
        </div>
      </Section>
    </>
  );
}

// ---------- 多选：对齐与分布 ----------
export function AlignSection({ overlays, timeline }: { overlays: Overlay[]; timeline: Timeline }) {
  const { commit } = useEdit();
  if (overlays.length < 2) return null;
  const boxes = overlays.map((o) => ({ o, ...fracBox(o, timeline) }));
  const L = Math.min(...boxes.map((b) => b.x - b.w / 2)), R = Math.max(...boxes.map((b) => b.x + b.w / 2));
  const T = Math.min(...boxes.map((b) => b.y - b.h / 2)), B = Math.max(...boxes.map((b) => b.y + b.h / 2));
  const op = (b: (typeof boxes)[number], patch: { x?: number; y?: number }): Op => ({ op: 'updateOverlay', id: b.o.id, patch: { x: Math.round((patch.x ?? b.x) * 10000) / 10000, y: Math.round((patch.y ?? b.y) * 10000) / 10000 } });
  const distribute = (axis: 'x' | 'y') => {
    const sorted = [...boxes].sort((a, b) => a[axis] - b[axis]);
    const size = (b: (typeof boxes)[number]) => (axis === 'x' ? b.w : b.h);
    const lo = axis === 'x' ? L : T, hi = axis === 'x' ? R : B;
    const gap = (hi - lo - sorted.reduce((n, b) => n + size(b), 0)) / (sorted.length - 1);
    let at = lo;
    return sorted.map((b) => { const c = at + size(b) / 2; at += size(b) + gap; return op(b, { [axis]: c }); });
  };
  const ACTIONS: [string, () => Op[]][] = [
    ['左对齐', () => boxes.map((b) => op(b, { x: L + b.w / 2 }))],
    ['水平居中', () => boxes.map((b) => op(b, { x: (L + R) / 2 }))],
    ['右对齐', () => boxes.map((b) => op(b, { x: R - b.w / 2 }))],
    ['顶对齐', () => boxes.map((b) => op(b, { y: T + b.h / 2 }))],
    ['垂直居中', () => boxes.map((b) => op(b, { y: (T + B) / 2 }))],
    ['底对齐', () => boxes.map((b) => op(b, { y: B - b.h / 2 }))],
  ];
  return (
    <Section title={'对齐与分布（' + overlays.length + ' 个元素）'}>
      <div className="dj-chips">
        {ACTIONS.map(([label, ops]) => <button key={label} type="button" className="dj-chip" onClick={() => commit(ops(), label)}>{label}</button>)}
        {overlays.length > 2 && <>
          <button type="button" className="dj-chip" onClick={() => commit(distribute('x'), '水平均分')}>水平均分</button>
          <button type="button" className="dj-chip" onClick={() => commit(distribute('y'), '垂直均分')}>垂直均分</button>
        </>}
      </div>
    </Section>
  );
}
