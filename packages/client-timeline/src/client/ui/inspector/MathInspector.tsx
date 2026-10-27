// 数学动画属性：公式（LaTeX 编辑 + 常用符号 + 实时报错）、坐标系（范围、对象、参数联动）、
// 镜头（取景、推近/拉远/对准元素）、变形（从哪个元素变来、时长与缓动）、自由路径（路径/顶点/箭头）
import React, { useEffect, useRef, useState } from 'react';
import type { Keyframe, Overlay, PlotItem, PlotSpec, Timeline } from '../../../../../engine/src/schema';
import { MATH_COLORS, PLOT_ITEM_LABEL, PLOT_ITEM_TYPES, elementLabel } from '../../../../../engine/src/timeline';
import { MathGlyphs, loadMath } from '../../../../../engine/src/math';
import { isMathError, type MathData } from '../../../../../engine/src/mathData';
import { cameraState } from '../../../../../engine/src/camera';
import { useEditor } from '../../context';
import { engineBase, type Op } from '../../engine';
import { KIND_NAME, type Actions } from '../../actions';
import { Field } from '../common';
import { ColorField, NumberField, Section, Seg, Toggle, useEdit } from './fields';

const pu = (o: Overlay, patch: Record<string, unknown>): Op[] => [{ op: 'updateOverlay', id: o.id, patch }];
const stop = (e: React.KeyboardEvent) => e.stopPropagation();

/** 文字输入：失焦/回车提交 */
function TextInput({ value, onCommit, placeholder, mono, max = 200, label }: { value: string; onCommit: (v: string) => void; placeholder?: string; mono?: boolean; max?: number; label?: string }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return <input className="dj-input" aria-label={label ?? placeholder} style={mono ? { fontFamily: 'ui-monospace, Consolas, monospace' } : undefined} value={draft} maxLength={max} placeholder={placeholder}
    onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { stop(e); if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { setDraft(value); e.currentTarget.blur(); } }}
    onBlur={() => { if (draft !== value) onCommit(draft.trim()); }} />;
}

/** LaTeX 是否能排版（防抖去引擎试排，给出错误提示） */
function useTexStatus(tex: string): string | null | undefined {
  const [status, setStatus] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    if (!tex.trim()) { setStatus('公式为空'); return; }
    let alive = true;
    const timer = setTimeout(() => { void loadMath(engineBase() + '/api/math', tex).then((r) => { if (alive) setStatus(isMathError(r) ? r.error : null); }); }, 250);
    return () => { alive = false; clearTimeout(timer); };
  }, [tex]);
  return status;
}

/** 面板里的公式缩略图（引擎排版，字形用 currentColor） */
export function TexPreview({ tex, height = 22 }: { tex: string; height?: number }) {
  const [data, setData] = useState<MathData | null>(null);
  useEffect(() => {
    let alive = true;
    void loadMath(engineBase() + '/api/math', tex).then((r) => { if (alive) setData(isMathError(r) ? null : r); });
    return () => { alive = false; };
  }, [tex]);
  if (!data) return <code>{tex.length > 28 ? tex.slice(0, 28) + '…' : tex}</code>;
  const k = height / data.vb[3];
  return (
    <svg className="dj-texpreview" width={Math.min(150, data.vb[2] * k)} height={height} viewBox={data.vb.join(' ')} preserveAspectRatio="xMinYMid meet" aria-label={tex}>
      <MathGlyphs data={data} color="currentColor" progress={1} unitPx={k} />
    </svg>
  );
}

// ---------- 公式 ----------
const SNIPPETS: [string, string][] = [
  ['a/b', '\\frac{a}{b}'], ['x²', 'x^{2}'], ['xᵢ', 'x_{i}'], ['√', '\\sqrt{x}'], ['Σ', '\\sum_{i=1}^{n}'], ['∫', '\\int_{a}^{b}'],
  ['lim', '\\lim_{x \\to 0}'], ['→', '\\to'], ['≈', '\\approx'], ['≤', '\\le'], ['∞', '\\infty'], ['·', '\\cdot'],
  ['α', '\\alpha'], ['β', '\\beta'], ['θ', '\\theta'], ['π', '\\pi'], ['Δ', '\\Delta'], ['∂', '\\partial'],
  ['v⃗', '\\vec{v}'], ['矩阵', '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}'], ['上色', '{\\color{#58C4DD} x}'], ['划掉', '\\cancel{x}'], ['文字', '\\text{面积}'], ['空格', '\\quad'],
];

export function MathPanel({ o, actions, now }: { o: Overlay; actions: Actions; now: number }) {
  const { commit } = useEdit();
  const [draft, setDraft] = useState(o.text);
  const area = useRef<HTMLTextAreaElement>(null);
  useEffect(() => setDraft(o.text), [o.text]);
  const status = useTexStatus(draft);
  const save = (v = draft) => { if (v.trim() && v !== o.text) commit(pu(o, { text: v }), '修改公式'); };
  const insert = (snippet: string) => {
    const el = area.current;
    const s = el?.selectionStart ?? draft.length, e = el?.selectionEnd ?? draft.length;
    const next = draft.slice(0, s) + snippet + draft.slice(e);
    setDraft(next);
    save(next);
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(s + snippet.length, s + snippet.length); });
  };
  const active = now > o.startSeconds && now < o.endSeconds;
  return (
    <>
      <Section title="公式（LaTeX）">
        <textarea ref={area} className="dj-textarea" spellCheck={false} rows={3} style={{ fontFamily: 'ui-monospace, Consolas, monospace' }} value={draft} aria-label="LaTeX"
          onChange={(e) => setDraft(e.target.value)} onBlur={() => save()}
          onKeyDown={(e) => { stop(e); if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); save(); } if (e.key === 'Escape') setDraft(o.text); }} />
        <p className="dj-hint" style={{ color: status ? 'var(--dj-danger, #f87171)' : undefined }}>{status === undefined ? '正在检查…' : status ?? '✓ 可以排版 · Ctrl+Enter 提交，也可以在画布上双击直接改'}</p>
        <div className="dj-chips dj-snippets">
          {SNIPPETS.map(([label, s]) => <button key={label} type="button" className="dj-chip" title={s} onMouseDown={(e) => e.preventDefault()} onClick={() => insert(s)}>{label}</button>)}
        </div>
      </Section>
      <Section title="样式">
        <div className="dj-grid">
          <ColorField label="颜色" value={o.color} onChange={(v) => commit(pu(o, { color: v }), '公式颜色')} />
          <NumberField label="字号" value={o.fontSize} step={1} min={8} max={600} digits={0} suffix="px" ops={(v) => pu(o, { fontSize: Math.round(v) })} editLabel="公式字号" />
        </div>
        <div className="dj-chips" style={{ marginTop: 8 }}>
          {MATH_COLORS.map((c) => <button key={c} type="button" className="dj-chip dj-palette" title={c} aria-pressed={o.color.toLowerCase() === c.toLowerCase()} onClick={() => commit(pu(o, { color: c }), '公式颜色')}><i style={{ background: c }} /></button>)}
          <button type="button" className="dj-chip dj-palette" aria-pressed={o.color === '#ffffff'} onClick={() => commit(pu(o, { color: '#ffffff' }), '公式颜色')}><i style={{ background: '#ffffff' }} /></button>
        </div>
        <p className="dj-hint">局部上色：把部分写成 {'{\\color{#58C4DD} x}'}。</p>
      </Section>
      <Section title="动画">
        <div className="dj-chips">
          <button type="button" className="dj-chip" aria-pressed={o.effects?.some((e) => e.preset === 'write')} onClick={() => commit(pu(o, { animationPreset: 'write' }), '公式书写')}>逐笔书写</button>
          <button type="button" className="dj-chip" disabled={!active} title={active ? '' : '把播放头移到公式显示期间'} onClick={() => actions.transformAtPlayhead(o.id)}>在播放头处变形…</button>
        </div>
        <p className="dj-hint">变形：在播放头处切出“变形后”的公式，改它的内容，相同的字符会平滑移动到新位置，多出来的淡入淡出（推导式变形）。</p>
      </Section>
    </>
  );
}

// ---------- 坐标系 ----------
const DEFAULT_ITEM: Record<string, Partial<PlotItem>> = {
  fn: { fn: 'x^2/4' }, param: { fx: 'cos(t)', fy: 'sin(t)', t: [0, '2*pi'] }, polar: { fn: '2*cos(3t)', t: [0, '2*pi'] },
  point: { x: 1 }, tangent: { x: 1, length: 3 }, area: { from: 0, to: 2 }, riemann: { from: 0, to: 2, n: 8 },
  vector: { x: 2, y: 1 }, segment: { x0: -1, y0: -1, x: 1, y: 1 }, label: { x: 0, y: 0, label: '$P$' },
};
const ex = (v: number | string | undefined) => (v === undefined ? '' : String(v));
const asExpr = (s: string): number | string | null => (s === '' ? null : /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : s);

function ItemRow({ it, i, n, fnIds, xr, onChange, onRemove, onMove }: { it: PlotItem; i: number; n: number; fnIds: string[]; xr: [number, number]; onChange: (next: PlotItem, label: string) => void; onRemove: () => void; onMove: (d: -1 | 1) => void }) {
  const set = (patch: Partial<Record<keyof PlotItem, unknown>>, label: string) => {
    const next = { ...it } as Record<string, unknown>;
    for (const [k, v] of Object.entries(patch)) { if (v === null || v === undefined || v === '') delete next[k]; else next[k] = v; }
    onChange(next as PlotItem, label);
  };
  const expr = (key: keyof PlotItem, label: string, placeholder = '') => (
    <Field label={label}><TextInput mono value={ex(it[key] as number | string | undefined)} placeholder={placeholder} label={label} onCommit={(v) => set({ [key]: asExpr(v) }, '坐标系：' + label)} /></Field>
  );
  // 区间：只改一端时另一端取缺省值；两端都清空则去掉
  const range = (key: 't' | 'domain', label: string, a: string, b: string) => {
    const cur = it[key];
    const commitAt = (idx: 0 | 1, v: string) => {
      const pair: (number | string)[] = [cur?.[0] ?? asExpr(a) ?? 0, cur?.[1] ?? asExpr(b) ?? 0];
      pair[idx] = asExpr(v) ?? asExpr(idx ? b : a) ?? 0;
      set({ [key]: v === '' && !cur ? null : pair }, '坐标系：' + label);
    };
    return (
      <Field label={label}>
        <span style={{ display: 'flex', gap: 4 }}>
          <TextInput mono value={ex(cur?.[0])} placeholder={a} label={label + ' 起'} onCommit={(v) => commitAt(0, v)} />
          <TextInput mono value={ex(cur?.[1])} placeholder={b} label={label + ' 止'} onCommit={(v) => commitAt(1, v)} />
        </span>
      </Field>
    );
  };
  const ofField = (
    <Field label="作用于函数">
      <select className="dj-select" value={it.of ?? ''} onChange={(e) => set({ of: e.target.value || null }, '坐标系：作用函数')}>
        <option value="">第一条函数</option>
        {fnIds.map((id) => <option key={id} value={id}>{id}</option>)}
      </select>
    </Field>
  );
  const color = it.color ?? MATH_COLORS[i % MATH_COLORS.length];
  return (
    <div className="dj-plotitem">
      <div className="dj-plotitem-head">
        <input type="color" className="dj-swatch" aria-label="颜色" value={/^#[0-9a-f]{6}$/i.test(color) ? color : '#58c4dd'} onChange={(e) => set({ color: e.target.value }, '坐标系：颜色')} />
        <select className="dj-select" aria-label="类型" value={it.type} onChange={(e) => onChange({ ...(DEFAULT_ITEM[e.target.value] as PlotItem), type: e.target.value as PlotItem['type'], ...(it.color ? { color: it.color } : {}) }, '坐标系：改类型')}>
          {PLOT_ITEM_TYPES.map((t) => <option key={t} value={t}>{PLOT_ITEM_LABEL[t] ?? t}</option>)}
        </select>
        <button type="button" className="dj-icon-btn" aria-label="上移" disabled={i === 0} onClick={() => onMove(-1)}>↑</button>
        <button type="button" className="dj-icon-btn" aria-label="下移" disabled={i === n - 1} onClick={() => onMove(1)}>↓</button>
        <button type="button" className="dj-icon-btn" aria-label="删除" onClick={onRemove}>×</button>
      </div>
      <div className="dj-grid">
        {it.type === 'fn' && <>{expr('fn', 'y =', 'sin(x)')}<Field label="函数名（供引用）"><TextInput value={it.id ?? ''} placeholder="如 f" max={12} label="函数名" onCommit={(v) => set({ id: v || null }, '坐标系：函数名')} /></Field>{range('domain', 'x 范围', String(xr[0]), String(xr[1]))}</>}
        {it.type === 'param' && <>{expr('fx', 'x(t) =')}{expr('fy', 'y(t) =')}{range('t', 't 范围', '0', '2*pi')}</>}
        {it.type === 'polar' && <>{expr('fn', 'r(t) =')}{range('t', 't 范围', '0', '2*pi')}</>}
        {it.type === 'point' && <>{expr('x', 'x', '0')}{expr('y', 'y', '留空=在函数上')}{ofField}<Toggle label="到坐标轴的虚线" checked={Boolean(it.guides)} onChange={(v) => set({ guides: v || null }, '坐标系：虚线')} /></>}
        {it.type === 'tangent' && <>{ofField}{expr('x', '切点 x', '0')}<Field label="长度（坐标单位）"><TextInput value={ex(it.length)} placeholder="自动" label="切线长度" onCommit={(v) => set({ length: Number(v) > 0 ? Number(v) : null }, '坐标系：切线长度')} /></Field></>}
        {(it.type === 'area' || it.type === 'riemann') && <>{ofField}{expr('from', '从 x =', '0')}{expr('to', '到 x =', '1')}{it.type === 'riemann' && expr('n', '矩形个数', '8')}</>}
        {(it.type === 'vector' || it.type === 'segment') && <>{expr('x0', '起点 x', '0')}{expr('y0', '起点 y', '0')}{expr('x', '终点 x')}{expr('y', '终点 y')}</>}
        {it.type === 'label' && <>{expr('x', 'x')}{expr('y', 'y')}</>}
        <Field label="标注"><TextInput value={it.label ?? ''} max={120} placeholder={it.type === 'point' ? '如 ({x}, {y})' : '$…$ 为公式'} label="标注" onCommit={(v) => set({ label: v || null }, '坐标系：标注')} /></Field>
        <Field label="出现于（秒）"><TextInput value={ex(it.start)} placeholder="随进度" label="出现于" onCommit={(v) => set({ start: v === '' ? null : Math.max(0, Number(v) || 0) }, '坐标系：出现时间')} /></Field>
        <Field label="消失于（秒）"><TextInput value={ex(it.end)} placeholder="不消失" label="消失于" onCommit={(v) => set({ end: v === '' ? null : Math.max(0, Number(v) || 0) }, '坐标系：消失时间')} /></Field>
      </div>
    </div>
  );
}

function ParamRow({ name, value, dur, onChange, onRemove }: { name: string; value: number | Keyframe[]; dur: number; onChange: (v: number | Keyframe[], label: string) => void; onRemove: () => void }) {
  const kfs = typeof value === 'number' ? undefined : value;
  const first = kfs?.[0], last = kfs?.[kfs.length - 1];
  const anim = Boolean(kfs && kfs.length > 1);
  const setKf = (patch: { from?: number; to?: number; t0?: number; t1?: number }) => {
    const from = patch.from ?? first?.v ?? 0, to = patch.to ?? last?.v ?? 1;
    const t0 = patch.t0 ?? first?.t ?? 0, t1 = patch.t1 ?? last?.t ?? Math.min(dur, 3);
    onChange([{ t: t0, v: from, e: first?.e ?? 'inOut' }, ...(kfs && kfs.length > 2 ? kfs.slice(1, -1) : []), { t: Math.max(t0 + 0.04, t1), v: to }], '参数动画');
  };
  const num = (label: string, v: number, onCommit: (x: number) => void, suffix = '') => (
    <Field label={label}><TextInput value={String(Math.round(v * 1000) / 1000)} label={label} onCommit={(s) => { const x = Number(s); if (Number.isFinite(x)) onCommit(x); }} />{suffix && <small>{suffix}</small>}</Field>
  );
  return (
    <div className="dj-plotitem">
      <div className="dj-plotitem-head">
        <b style={{ fontFamily: 'ui-monospace, Consolas, monospace', minWidth: 28 }}>{name}</b>
        <Seg label="参数类型" value={anim ? 'anim' : 'const'} options={[['const', '常数'], ['anim', '随时间变化']]} onChange={(m) => (m === 'anim' ? setKf({}) : onChange(first?.v ?? (typeof value === 'number' ? value : 0), '参数改为常数'))} />
        <button type="button" className="dj-icon-btn" aria-label="删除参数" onClick={onRemove}>×</button>
      </div>
      <div className="dj-grid">
        {!anim && num('值', typeof value === 'number' ? value : first?.v ?? 0, (x) => onChange(x, '参数值'))}
        {anim && <>
          {num('从', first!.v, (x) => setKf({ from: x }))}
          {num('到', last!.v, (x) => setKf({ to: x }))}
          {num('开始（秒）', first!.t, (x) => setKf({ t0: Math.max(0, x) }))}
          {num('结束（秒）', last!.t, (x) => setKf({ t1: Math.max(0, x) }))}
        </>}
      </div>
    </div>
  );
}

export function PlotPanel({ o }: { o: Overlay }) {
  const { commit } = useEdit();
  const p = o.plot!;
  const set = (plot: Partial<PlotSpec> | Record<string, unknown>, label: string) => commit(pu(o, { plot }), label);
  const setItems = (items: PlotItem[], label: string) => set({ items }, label);
  const fnIds = p.items.filter((it) => it.type === 'fn' && it.id).map((it) => it.id!);
  const params = Object.entries(p.params ?? {});
  const dur = o.endSeconds - o.startSeconds;
  const setParams = (next: Record<string, number | Keyframe[]>, label: string) => set({ params: next, items: p.items }, label);
  const range = (axis: 'x' | 'y', i: 0 | 1, label: string) => (
    <NumberField label={label} value={p[axis][i]} step={0.5} digits={2} ops={(v) => { const r: [number, number] = [...p[axis]]; r[i] = v; return r[0] < r[1] ? pu(o, { plot: { [axis]: r } }) : []; }} editLabel="坐标范围" />
  );
  return (
    <>
      <Section title="坐标范围">
        <div className="dj-grid">
          {range('x', 0, 'x 最小')}{range('x', 1, 'x 最大')}{range('y', 0, 'y 最小')}{range('y', 1, 'y 最大')}
          <NumberField label="x 刻度间距" value={p.xStep ?? 0} step={0.5} min={0} digits={2} ops={(v) => pu(o, { plot: { xStep: v > 0 ? v : null } })} editLabel="刻度间距" />
          <NumberField label="y 刻度间距" value={p.yStep ?? 0} step={0.5} min={0} digits={2} ops={(v) => pu(o, { plot: { yStep: v > 0 ? v : null } })} editLabel="刻度间距" />
        </div>
        <p className="dj-hint">刻度间距为 0 时自动选择。</p>
      </Section>
      <Section title="显示">
        <div className="dj-grid">
          <Toggle label="网格" checked={Boolean(p.grid)} onChange={(v) => set({ grid: v }, v ? '显示网格' : '隐藏网格')} />
          <Toggle label="坐标轴" checked={p.axes !== false} onChange={(v) => set({ axes: v }, v ? '显示坐标轴' : '隐藏坐标轴')} />
          <Toggle label="刻度" checked={p.ticks !== false} onChange={(v) => set({ ticks: v }, '刻度')} />
          <Toggle label="刻度数字" checked={p.numbers !== false} onChange={(v) => set({ numbers: v }, '刻度数字')} />
          <Field label="x 轴名"><TextInput value={p.xLabel ?? ''} max={60} placeholder="$x$" label="x 轴名" onCommit={(v) => set({ xLabel: v || null }, 'x 轴名')} /></Field>
          <Field label="y 轴名"><TextInput value={p.yLabel ?? ''} max={60} placeholder="$y$" label="y 轴名" onCommit={(v) => set({ yLabel: v || null }, 'y 轴名')} /></Field>
          <ColorField label="坐标轴颜色" value={p.axisColor ?? o.color} onChange={(v) => set({ axisColor: v }, '坐标轴颜色')} />
          <ColorField label="网格颜色" value={p.gridColor ?? '#58C4DD'} onChange={(v) => set({ gridColor: v }, '网格颜色')} />
          <NumberField label="字号" value={o.fontSize} step={1} min={6} max={200} digits={0} suffix="px" ops={(v) => pu(o, { fontSize: Math.round(v) })} />
        </div>
      </Section>
      <Section title={'对象（' + p.items.length + '）'}>
        <div className="dj-datalist">
          {p.items.map((it, i) => (
            <ItemRow key={i} it={it} i={i} n={p.items.length} fnIds={fnIds} xr={p.x}
              onChange={(next, label) => setItems(p.items.map((x, j) => (j === i ? next : x)), label)}
              onRemove={() => setItems(p.items.filter((_, j) => j !== i), '坐标系：删除对象')}
              onMove={(d) => { const list = [...p.items]; [list[i], list[i + d]] = [list[i + d], list[i]]; setItems(list, '坐标系：调整顺序'); }} />
          ))}
        </div>
        <div className="dj-chips" style={{ marginTop: 8 }}>
          {PLOT_ITEM_TYPES.map((t) => <button key={t} type="button" className="dj-chip" disabled={p.items.length >= 24} onClick={() => setItems([...p.items, { type: t, ...DEFAULT_ITEM[t] } as PlotItem], '坐标系：添加' + PLOT_ITEM_LABEL[t])}>+ {PLOT_ITEM_LABEL[t]}</button>)}
        </div>
        <p className="dj-hint">表达式可用 x（函数）/ t（参数、极坐标）、下面的参数、带函数名的函数（如 f(a)）、pi、sin、sqrt、ln…；标注里 {'{a}'} 显示参数当前值。没设“出现于”的对象随“动画 › 进度 › 依次画出”按顺序画出。</p>
      </Section>
      <Section title="参数（联动）" extra={<button type="button" className="dj-btn" disabled={params.length >= 8} onClick={() => {
        const name = ['a', 'b', 'k', 'm', 'n', 'c', 'h', 's'].find((x) => !(x in (p.params ?? {})));
        if (name) setParams({ ...(p.params ?? {}), [name]: [{ t: 0, v: 0, e: 'inOut' }, { t: Math.min(dur, 3), v: 2 }] }, '添加参数');
      }}>+ 参数</button>}>
        <div className="dj-datalist">
          {params.map(([name, v]) => (
            <ParamRow key={name} name={name} value={v} dur={dur}
              onChange={(next, label) => setParams({ ...(p.params ?? {}), [name]: next }, label)}
              onRemove={() => { const next = { ...(p.params ?? {}) }; delete next[name]; setParams(next, '删除参数'); }} />
          ))}
        </div>
        {!params.length && <p className="dj-hint">参数随时间变化时，用到它的曲线、点、切线、面积会跟着连续变化。例：参数 a 从 -2 变到 2，点 x=a 沿曲线移动，切线 x=a 跟着转，面积 to=a 跟着长。</p>}
      </Section>
    </>
  );
}

// ---------- 镜头 ----------
export function CameraPanel({ o, timeline, now }: { o: Overlay; timeline: Timeline; now: number }) {
  const { commit } = useEdit();
  const W = timeline.meta.width, H = timeline.meta.height;
  const dur = o.endSeconds - o.startSeconds;
  const rel = Math.max(0, Math.min(dur, Math.round((now - o.startSeconds) * timeline.meta.fps) / timeline.meta.fps));
  const st = cameraState(o, rel, W, H);
  const members = timeline.overlays.filter((x) => x.kind !== 'camera' && x.kind !== 'subtitle' && (o.group ? x.group === o.group : true) && x.startSeconds < o.endSeconds && x.endSeconds > o.startSeconds);
  const [target, setTarget] = useState('');
  // 从播放头开始 1.5 秒把镜头移到 (cx, cy)、取景宽 fw（都是画布比例）；之前的状态保持
  const moveTo = (cx: number, cy: number, fw: number, label: string) => {
    const t0 = rel, t1 = Math.min(dur, rel + 1.5);
    const cur = { x: st.cx / W - (o.x ?? 0.5), y: st.cy / H - (o.y ?? 0.5), s: 1 / st.zoom / (o.w ?? 1) };
    const to = { x: cx - (o.x ?? 0.5), y: cy - (o.y ?? 0.5), s: fw / (o.w ?? 1) };
    const keep = (ch: 'x' | 'y' | 'scale') => (o.animations?.[ch] ?? []).filter((k) => k.t < t0 - 1e-3);
    const r = (v: number) => Math.round(v * 10000) / 10000;
    commit(pu(o, { effects: null, animations: {
      ...(o.animations ?? {}),
      x: [...keep('x'), { t: t0, v: r(cur.x), e: 'inOut' }, { t: t1, v: r(to.x) }],
      y: [...keep('y'), { t: t0, v: r(cur.y), e: 'inOut' }, { t: t1, v: r(to.y) }],
      scale: [...keep('scale'), { t: t0, v: r(cur.s), e: 'inOut' }, { t: t1, v: r(to.s) }],
    } }), label);
  };
  const focus = (id: string) => {
    const el = members.find((x) => x.id === id);
    const node = document.querySelector<HTMLElement>('[data-el="' + CSS.escape(id) + '"]');
    if (!el) return;
    const ew = el.w !== undefined ? el.w * W : node?.offsetWidth ?? W * 0.3;
    const eh = el.h !== undefined ? el.h * H : node?.offsetHeight ?? ew;
    const fw = Math.min(1, Math.max(0.12, Math.max(ew / W, eh / H) * 1.5));
    moveTo(el.x ?? 0.5, el.y ?? 0.5, fw, '镜头对准「' + elementLabel(el).slice(0, 12) + '」');
  };
  return (
    <>
      <Section title="取景">
        <div className="dj-grid">
          <NumberField label="中心 X" value={o.x ?? 0.5} scale={100} suffix="%" step={0.002} min={-1} max={2} digits={1} ops={(v) => pu(o, { x: v })} editLabel="镜头位置" />
          <NumberField label="中心 Y" value={o.y ?? 0.5} scale={100} suffix="%" step={0.002} min={-1} max={2} digits={1} ops={(v) => pu(o, { y: v })} editLabel="镜头位置" />
          <NumberField label="取景宽度" value={o.w ?? 1} scale={100} suffix="%" step={0.005} min={0.05} max={4} digits={1} ops={(v) => pu(o, { w: v })} editLabel="镜头取景" />
          <Field label="此刻放大"><span className="dj-hint" style={{ margin: 0 }}>{st.zoom.toFixed(2)}×</span></Field>
        </div>
        <p className="dj-hint">选中镜头时预览显示整个画布和镜头框（可直接拖动、拖角缩放）；取消选择即看到镜头画面。{o.group ? '这个镜头只作用于本页幻灯片的元素。' : '这个镜头作用于所有元素（字幕除外）。'}</p>
      </Section>
      <Section title="运镜（从播放头开始 1.5 秒）">
        <div className="dj-chips">
          <button type="button" className="dj-chip" onClick={() => moveTo(st.cx / W, st.cy / H, 1 / st.zoom / 1.6, '镜头推近')}>推近</button>
          <button type="button" className="dj-chip" onClick={() => moveTo(st.cx / W, st.cy / H, Math.min(1, (1 / st.zoom) * 1.6), '镜头拉远')}>拉远</button>
          <button type="button" className="dj-chip" onClick={() => moveTo(0.5, 0.5, 1, '镜头回到全景')}>回到全景</button>
          <button type="button" className="dj-chip" onClick={() => moveTo(st.cx / W - 0.15 / st.zoom, st.cy / H, 1 / st.zoom, '镜头左移')}>左移</button>
          <button type="button" className="dj-chip" onClick={() => moveTo(st.cx / W + 0.15 / st.zoom, st.cy / H, 1 / st.zoom, '镜头右移')}>右移</button>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <select className="dj-select" aria-label="对准的元素" value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="">对准元素…</option>
            {members.map((x) => <option key={x.id} value={x.id}>{(KIND_NAME[x.kind ?? 'subtitle'] ?? '元素') + ' · ' + elementLabel(x).slice(0, 18)}</option>)}
          </select>
          <button type="button" className="dj-btn" disabled={!target} onClick={() => focus(target)}>推近对准</button>
        </div>
        <p className="dj-hint">运镜写成镜头的 x/y/scale 关键帧，可在“动画”页逐帧微调。</p>
      </Section>
    </>
  );
}

// ---------- 变形 ----------
const EASES: [string, string][] = [['inOut', '平滑'], ['out', '减速'], ['in', '加速'], ['linear', '匀速']];
export function MorphSection({ o, timeline, now, actions }: { o: Overlay; timeline: Timeline; now: number; actions: Actions }) {
  const ed = useEditor();
  const { commit } = useEdit();
  const m = o.morph;
  const src = m ? timeline.overlays.find((x) => x.id === m.from) : undefined;
  const frame = 1 / timeline.meta.fps;
  const candidates = timeline.overlays.filter((x) => x.id !== o.id && x.kind !== 'camera' && Math.abs(x.endSeconds - o.startSeconds) < frame * 1.5);
  const active = now > o.startSeconds && now < o.endSeconds;
  return (
    <Section title="变形">
      {m ? <>
        <p className="dj-hint" style={{ marginTop: 0 }}>开头 {(m.duration ?? 1).toFixed(2)} 秒从「{src ? elementLabel(src).slice(0, 18) : '已删除的元素'}」变形而来。</p>
        <div className="dj-grid">
          <NumberField label="变形时长" value={m.duration ?? 1} step={0.05} min={0.1} max={10} suffix="s" ops={(v) => pu(o, { morph: { ...m, duration: v } })} editLabel="变形时长" />
        </div>
        <div style={{ marginTop: 8 }}><Seg label="缓动" value={typeof m.ease === 'string' ? m.ease : 'inOut'} options={EASES as [string, string][]} onChange={(v) => commit(pu(o, { morph: { ...m, ease: v } }), '变形缓动')} /></div>
        <div className="dj-chips" style={{ marginTop: 8 }}>
          {src && <button type="button" className="dj-chip" onClick={() => ed.sel.select({ kind: 'overlay', id: src.id })}>选中变形前的元素</button>}
          <button type="button" className="dj-chip" onClick={() => commit(pu(o, { morph: null }), '取消变形')}>取消变形</button>
        </div>
      </> : <>
        {candidates.length > 0 && (
          <div className="dj-chips">
            {candidates.map((c) => <button key={c.id} type="button" className="dj-chip" onClick={() => commit(pu(o, { morph: { from: c.id } }), '从「' + elementLabel(c).slice(0, 12) + '」变形')}>从「{elementLabel(c).slice(0, 12)}」变形</button>)}
          </div>
        )}
        <div className="dj-chips" style={{ marginTop: candidates.length ? 8 : 0 }}>
          <button type="button" className="dj-chip" disabled={!active} title={active ? '' : '把播放头移到元素显示期间'} onClick={() => actions.transformAtPlayhead(o.id)}>在播放头处变形…</button>
        </div>
        <p className="dj-hint">公式→公式按字符配对移动，形状→形状逐点变形，坐标系→坐标系逐项插值（函数变形、坐标缩放），其他组合平滑过渡位置与大小并交叉淡化。</p>
      </>}
    </Section>
  );
}

// ---------- 自由路径 ----------
const PATH_PRESETS: [string, Record<string, unknown>][] = [
  ['弧形箭头', { path: 'M0,100 C20,10 80,10 100,100', arrow: 'end', vertices: null }],
  ['S 曲线', { path: 'M0,80 C30,0 70,100 100,20', arrow: null, vertices: null }],
  ['波浪', { path: 'M0,50 C12.5,0 12.5,0 25,50 S37.5,100 50,50 S62.5,0 75,50 S87.5,100 100,50', arrow: null, vertices: null }],
  ['螺旋', { path: 'M50,50 m0,-6 a6,6 0 1 1 -6,6 a12,12 0 1 1 12,12 a20,20 0 1 1 -20,-20 a30,30 0 1 1 30,30 a42,42 0 1 1 -42,-42', arrow: null, vertices: null }],
  ['折线箭头', { vertices: [[0, 90], [30, 40], [60, 70], [100, 10]], closed: false, smooth: false, arrow: 'end', path: null }],
  ['平滑闭合', { vertices: [[50, 0], [95, 35], [80, 100], [20, 100], [5, 35]], closed: true, smooth: true, arrow: null, path: null }],
];
export function PathSection({ o }: { o: Overlay }) {
  const { commit } = useEdit();
  const s = o.shape!;
  const set = (shape: Record<string, unknown>, label: string) => commit(pu(o, { shape }), label);
  const open = s.vertices ? !s.closed : !/z/i.test(s.path ?? '');
  return (
    <Section title="路径">
      <div className="dj-chips">{PATH_PRESETS.map(([label, patch]) => <button key={label} type="button" className="dj-chip" onClick={() => set(patch, '路径：' + label)}>{label}</button>)}</div>
      {s.vertices ? (
        <div className="dj-grid" style={{ marginTop: 8 }}>
          <Field label="顶点"><span className="dj-hint" style={{ margin: 0 }}>{s.vertices.length} 个（坐标 0–100）</span></Field>
          <Toggle label="首尾闭合" checked={Boolean(s.closed)} onChange={(v) => set({ closed: v }, v ? '闭合路径' : '断开路径')} />
          <Toggle label="平滑曲线" checked={Boolean(s.smooth)} onChange={(v) => set({ smooth: v }, v ? '平滑路径' : '折线路径')} />
        </div>
      ) : (
        <Field label="SVG 路径（盒子坐标 0–100）"><TextInput mono value={s.path ?? ''} max={4000} label="SVG 路径" onCommit={(v) => set({ path: v }, '修改路径')} /></Field>
      )}
      {open && <div style={{ marginTop: 8 }}><Seg label="箭头" value={s.arrow ?? 'none'} options={[['none', '无箭头'], ['end', '末端'], ['start', '起点'], ['both', '两端']]} onChange={(v) => set({ arrow: v === 'none' ? null : v }, '路径箭头')} /></div>}
      <p className="dj-hint">路径坐标以元素盒子为 0–100：拖动缩放盒子即缩放路径；“动画 › 进度 › 描边绘制”让路径一笔画出来。</p>
    </Section>
  );
}
