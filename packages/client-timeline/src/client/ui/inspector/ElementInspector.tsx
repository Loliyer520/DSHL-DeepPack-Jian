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
import { ColorField, NumberField, Section, Seg, Toggle, useEdit, useInspectTime } from './fields';
import { CameraPanel, MathPanel, MorphSection, PathSection, PlotPanel } from './MathInspector';

import { MotionSection, GroupMotionSection } from './MotionSection';
import { SharedSection } from './SharedSection';
import { SpatialSection } from './SpatialSection';
import { AutoSizeSection } from './LayoutSection';
import { MotionBlurSection } from './MotionBlurSection';
import { SurfaceMotionSection } from './SurfaceMotionSection';
import { TrackMatteSection } from './TrackMatteSection';
import { EasingField } from './EasingField';
import { AppearanceSection } from './AppearanceSection';

export type ElTab = 'style' | 'text' | 'layout' | 'animation';
const STYLE_TAB: Record<string, string> = { shape: '形状', image: '图片', icon: '图标', chart: '图表', plot: '坐标系' };
export function elementTabs(o: Overlay): [ElTab, string][] {
  if (o.kind === 'math') return [['style', '公式'], ['layout', '位置'], ['animation', '动画']];
  if (o.kind === 'camera') return [['style', '镜头'], ['animation', '动画']];
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
export function FillField({ value, onChange, allowNone = true, gradientOnly = false }: { value: Fill | undefined; onChange: (f: Fill | null, label: string) => void; allowNone?: boolean; gradientOnly?: boolean }) {
  const mode = value === undefined ? 'none' : typeof value === 'string' ? 'solid' : value.type;
  const stops = typeof value === 'object' && value ? value.stops : [{ offset: 0, color: typeof value === 'string' ? value : '#3b82f6' }, { offset: 1, color: '#8b5cf6' }];
  const grad = (patch: { angle?: number; stops?: typeof stops; type?: 'linear' | 'radial' }) => ({ ...(typeof value==='object'&&value.keyframes?{keyframes:value.keyframes}:{}), type: patch.type ?? (typeof value === 'object' && value ? value.type : 'linear'), angle: patch.angle ?? (typeof value === 'object' && value?.angle !== undefined ? value.angle : 90), stops: patch.stops ?? stops });
  const opts: ['none' | 'solid' | 'linear' | 'radial', string][] = [['solid', '纯色'], ['linear', '线性渐变'], ['radial', '径向渐变']];
  if (gradientOnly) opts.shift();
  if (allowNone) opts.unshift(['none', '无']);
  return (
    <>
      <Seg label="填充方式" value={mode} options={opts} onChange={(m) => onChange(m === 'none' ? null : m === 'solid' ? stops[0].color : grad({ type: m }), '填充')} />
      <div className="dj-grid" style={{ marginTop: 8 }}>
        {mode === 'solid' && typeof value === 'string' && <ColorField label="颜色" value={value} onChange={(c) => onChange(c, '填充颜色')} />}
        {(mode === 'linear' || mode === 'radial') && <>
          {stops.map((stop, i) => <React.Fragment key={i}>
            <ColorField label={'色标 ' + (i + 1)} value={stop.color} onChange={(color) => onChange(grad({ stops: stops.map((s, j) => j === i ? { ...s, color } : s) }), '渐变颜色')} />
            <Field label="位置"><ScrubNumber value={stop.offset * 100} min={0} max={100} step={1} digits={0} suffix="%" label={'色标 ' + (i + 1) + ' 位置'} onCommit={(v) => onChange(grad({ stops: stops.map((s, j) => j === i ? { ...s, offset: v / 100 } : s) }), '渐变色标位置')} /></Field>
            {stops.length > 2 && <button type="button" className="dj-chip" onClick={() => onChange(grad({ stops: stops.filter((_, j) => j !== i) }), '删除渐变色标')}>删除色标 {i + 1}</button>}
          </React.Fragment>)}
          {stops.length < 8 && <button type="button" className="dj-chip" onClick={() => {
            let at = 0;
            for (let i = 1; i < stops.length - 1; i++) if (stops[i + 1].offset - stops[i].offset > stops[at + 1].offset - stops[at].offset) at = i;
            const added = { offset: (stops[at].offset + stops[at + 1].offset) / 2, color: stops[at].color };
            onChange(grad({ stops: [...stops.slice(0, at + 1), added, ...stops.slice(at + 1)] }), '添加渐变色标');
          }}>添加色标</button>}
          {mode === 'linear' && <Field label="角度"><ScrubNumber value={typeof value === 'object' && value ? value.angle ?? 0 : 0} step={5} min={-360} max={360} digits={0} suffix="°" label="渐变角度" onCommit={(v) => onChange(grad({ angle: v }), '渐变角度')} /></Field>}
        </>}
      </div>
    </>
  );
}

// ---------- 形状 ----------
export function ShapeThumb({ type, size = 24 }: { type: string; size?: number }) {
  const line = (LINE_SHAPES as readonly string[]).includes(type);
  const spec = (type === 'path' ? { type, path: 'M4,85 C30,-10 70,110 96,15', stroke: { color: 'currentColor', width: 2 } }
    : line ? { type, stroke: { color: 'currentColor', width: 2 } } : { type, fill: 'currentColor', radius: 4 }) as NonNullable<Overlay['shape']>;
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
      <GradientFrames o={o} fps={timeline.meta.fps}/><Section title="形状">
        <div className="dj-pickgrid">
          {SHAPE_TYPES.map((t) => (
            <button key={t} type="button" title={SHAPE_LABEL[t] ?? t} aria-label={SHAPE_LABEL[t] ?? t} aria-pressed={s.type === t}
              onClick={() => {
                const toLine = (LINE_SHAPES as readonly string[]).includes(t);
                // 自由路径缺省是一条开放曲线：用描边，不填充
                if (t === 'path' && s.type !== 'path') { set({ type: t, fill: null, stroke: { color: stroke?.color ?? (typeof s.fill === 'string' ? s.fill : '#ffffff'), width: stroke?.width ?? 6 } }, '形状：自由路径'); return; }
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
      {s.type === 'path' && <PathSection o={o} />}
      {!line && <Section title="填充"><FillField value={s.fill} onChange={(f, label) => set({ fill: f }, label)} /></Section>}
      <Section title={line ? '线条' : '描边'} extra={!line && <Toggle label="" checked={Boolean(stroke)} onChange={(v) => set({ stroke: v ? { color: '#ffffff', width: 4 } : null }, v ? '开启描边' : '关闭描边')} />}>
        {(stroke || line) && <>
          <div className="dj-grid">
            <div style={{gridColumn:'1 / -1'}}><FillField value={stroke?.color ?? '#ffffff'} allowNone={false} onChange={(v,label)=>set({stroke:{...(stroke??{width:6}),color:v}},label)}/></div>
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
          {o.kind === 'math'
            ? <NumberField label="字号" value={o.fontSize} step={1} min={8} max={600} digits={0} suffix="px" ops={(v) => pu(o, { fontSize: Math.round(v) })} editLabel="公式字号" />
            : <NumberField label="宽" value={box.w} scale={100} suffix="%" step={0.002} min={0.002} max={4} digits={1} ops={(v) => pu(o, { w: v })} editLabel="调整宽度" />}
          {!autoH && o.kind !== 'math' && <NumberField label="高" value={box.h} scale={100} suffix="%" step={0.002} min={0.002} max={4} digits={1} ops={(v) => pu(o, { h: v })} editLabel="调整高度" />}
          <NumberField label="旋转" value={o.rotate ?? 0} step={1} min={-360} max={360} digits={1} suffix="°" ops={(v) => pu(o, { rotate: v })} editLabel="旋转" />
          <NumberField label="不透明度" value={o.opacity ?? 1} scale={100} suffix="%" step={0.01} min={0} max={1} digits={0} ops={(v) => pu(o, { opacity: v })} editLabel="不透明度" />
          {!isBoxElement(o) && o.kind !== 'math' && <Toggle label="固定高度" checked={o.h !== undefined} onChange={(v) => set({ h: v ? Math.round(box.h * 1000) / 1000 : null }, v ? '固定高度' : '自动高度')} />}
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
      <MorphSection o={o} timeline={timeline} now={now} actions={actions} />
      <TransformSection o={o} fps={fps} now={now} title="动画变换（关键帧）" />
    </>
  );
}

function ElementInspectorBody({ o, tab, timeline, now, actions }: { o: Overlay; tab: ElTab; timeline: Timeline; now: number; actions: Actions }) {
  const fps = timeline.meta.fps;
  if (tab === 'animation') return <AnimationTab target={overlayTarget(o)} kind="overlay" effects={o.effects} fps={fps} now={now} />;
  if (tab === 'layout') {
    if (o.w !== undefined || isBoxElement(o) || o.kind === 'math') return <BoxLayout o={o} timeline={timeline} now={now} actions={actions} />;
    return <><TextInspector o={o} tab="layout" timeline={timeline} now={now} /><ArrangeSection o={o} actions={actions} /></>;
  }
  if (tab === 'text') return <TextInspector o={o} tab="text" timeline={timeline} now={now} extra={<TextBoxSection o={o} />} />;
  if (o.kind === 'shape' && o.shape) return <ShapePanel o={o} timeline={timeline} />;
  if (o.kind === 'image' && o.image) return <ImagePanel o={o} />;
  if (o.kind === 'icon' && o.icon) return <IconPanel o={o} />;
  if (o.kind === 'chart' && o.chart) return <ChartPanel o={o} />;
  if (o.kind === 'math') return <MathPanel o={o} actions={actions} now={now} />;
  if (o.kind === 'plot' && o.plot) return <PlotPanel o={o} />;
  if (o.kind === 'camera') return <><CameraPanel o={o} timeline={timeline} now={now} /><TimeSection o={o} fps={fps} /></>;
  return <div className="dj-empty-state">这个元素缺少样式数据</div>;
}

export function ElementInspector(props: Parameters<typeof ElementInspectorBody>[0]) {
  return <><ElementInspectorBody {...props} />{props.tab === 'animation' && props.o.kind !== 'camera' && <SharedSection o={props.o} timeline={props.timeline}/>}{props.tab === 'layout' && props.o.kind !== 'camera' && <MotionSection timeline={props.timeline} o={props.o} fps={props.timeline.meta.fps} now={props.now} />}{props.tab === 'layout' && props.o.kind !== 'camera' && <SpatialSection item={props.o} target={overlayTarget(props.o)} fps={props.timeline.meta.fps} now={props.now} kind="overlay" />}{['style', 'text'].includes(props.tab) && props.o.kind !== 'camera' && <><AppearanceSection o={props.o} /><AutoSizeSection o={props.o} timeline={props.timeline}/><MotionBlurSection value={props.o.motionBlur} ops={v=>pu(props.o,{motionBlur:v})}/><SurfaceMotionSection o={props.o} fps={props.timeline.meta.fps} now={props.now}/><TrackMatteSection item={props.o} timeline={props.timeline}/></>}</>;
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
      <GroupMotionSection group={group} timeline={timeline} />
      <Section title="成员入场动画">
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

function GradientFrames({o,fps}:{o:Overlay;fps:number}){
  const now=useInspectTime(),{commit}=useEdit(),ed=useEditor();
  const [channel,setChannel]=useState<'fill'|'stroke'>('fill'),[selected,setSelected]=useState(0);
  const fill=channel==='fill'?o.shape?.fill:o.shape?.stroke?.color;
  if(!fill||typeof fill==='string')return <Section title="渐变关键帧"><div className="dj-chips"><button className="dj-chip" onClick={()=>setChannel(channel==='fill'?'stroke':'fill')}>当前：{channel==='fill'?'填充':'描边'} · 切换</button></div><p className="dj-hint">先把对应填充或描边设为渐变，即可为色标颜色、位置和角度添加关键帧。</p></Section>;
  const frames=fill.keyframes??[],index=Math.min(selected,Math.max(0,frames.length-1)),frame=frames[index];
  const t=Math.round(Math.max(0,Math.min(o.endSeconds-o.startSeconds,now-o.startSeconds))*fps)/fps;
  const set=(next:typeof frames,label:string)=>commit([{op:'updateOverlay',id:o.id,patch:{shape:channel==='fill'?{fill:{...fill,keyframes:next}}:{stroke:{...o.shape?.stroke,color:{...fill,keyframes:next}}}}}],label);
  return <Section title="渐变关键帧"><div className="dj-chips"><button className="dj-chip" onClick={()=>{setChannel(channel==='fill'?'stroke':'fill');setSelected(0);}}>当前：{channel==='fill'?'填充':'描边'} · 切换</button><button className="dj-chip" onClick={()=>{
    const next=[...frames.filter(f=>Math.abs(f.t-t)>.5/fps),{t,angle:frame?.angle??fill.angle??0,stops:structuredClone(frame?.stops??fill.stops),e:'linear' as const}].sort((a,b)=>a.t-b.t);set(next,'添加渐变关键帧');setSelected(next.findIndex(f=>f.t===t));
  }}>在播放头添加（{t.toFixed(2)} s）</button></div>
  {!!frames.length&&<><Field label="编辑关键帧"><select className="dj-select" value={index} onChange={e=>{const i=Number(e.target.value);setSelected(i);ed.clock.seek(o.startSeconds+frames[i].t);}}>{frames.map((f,i)=><option key={i} value={i}>{f.t.toFixed(2)} s</option>)}</select></Field>
    <FillField value={{type:fill.type,angle:frame.angle,stops:frame.stops}} allowNone={false} gradientOnly onChange={(value,label)=>{if(value&&typeof value!=='string')set(frames.map((f,i)=>i===index?{...f,angle:value.angle,stops:value.stops}:f),label);}}/>
    <EasingField label="到下一帧的缓动" value={frame.e} ops={e=>[{op:'updateOverlay',id:o.id,patch:{shape:channel==='fill'?{fill:{...fill,keyframes:frames.map((f,i)=>i===index?{...f,e}:f)}}:{stroke:{...o.shape?.stroke,color:{...fill,keyframes:frames.map((f,i)=>i===index?{...f,e}:f)}}}}}]}/>
    <button className="dj-chip" onClick={()=>set(frames.filter((_,i)=>i!==index),'删除渐变关键帧')}>删除当前帧</button></>}
    <p className="dj-hint">在不同时刻保存色标，颜色、位置与角度会自动插值。删除所有帧恢复静态渐变。</p>
  </Section>;
}
