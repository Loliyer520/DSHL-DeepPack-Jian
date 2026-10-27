// “插入”面板（PPT 的插入选项卡）：文字 / 形状 / 图标 / 图表 / 图片 / 幻灯片模板，都插在播放头处、画面中央
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CHART_LABEL, CHART_TYPES, SHAPE_LABEL, SHAPE_TYPES } from '../../../../engine/src/timeline';
import { SLIDE_TEMPLATES, SLIDE_THEMES } from '../../../../engine/src/templates';
import { useStore } from '../context';
import { absolute, api, type AssetInfo } from '../engine';
import type { Actions } from '../actions';
import { Icon, type IconName } from '../Icon';
import { readPref, writePref } from '../prefs';
import { IconPicker, ShapeThumb } from './inspector/ElementInspector';
import { TexPreview } from './inspector/MathInspector';

type Tab = 'text' | 'shape' | 'icon' | 'chart' | 'image' | 'slide' | 'math';
const TABS: [Tab, string, IconName][] = [['slide', '幻灯片', 'slides'], ['text', '文字', 'text'], ['shape', '形状', 'shapes'], ['math', '数学', 'sigma'], ['icon', '图标', 'star'], ['chart', '图表', 'chart'], ['image', '图片', 'image']];

const TEMPLATE_HINT: Record<string, string> = { cover: '主标题、副标题、眉题', section: '章节号 + 标题', cards: '2–4 张卡片，带图标', bullets: '要点列表 + 配图图标', stats: '1–4 个数字滚动', quote: '大号引文 + 出处', compare: '左右两栏对比', timeline: '2–6 个时间节点', steps: '2–5 步流程', chart: '标题 + 柱状/折线/饼图', imageText: '图片 + 文字要点', formula: '标题 + 逐笔书写的公式', graph: '标题 + 函数图像', ending: '结尾致谢页' };

const FORMULAS: [string, string][] = [
  ['欧拉公式', 'e^{i\\pi} + 1 = 0'],
  ['勾股定理', 'a^2 + b^2 = c^2'],
  ['求根公式', 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'],
  ['导数定义', "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}"],
  ['高斯积分', '\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}'],
  ['巴塞尔问题', '\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}'],
  ['矩阵乘向量', '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} \\begin{pmatrix} x \\\\ y \\end{pmatrix}'],
  ['彩色变量', '{\\color{#58C4DD} x}^2 + {\\color{#F7D96F} y}^2 = 1'],
];
const kf = (t: number, v: number, e?: string) => ({ t, v, ...(e ? { e } : {}) });
// 坐标系示例：插入后在属性面板里改函数、加点/切线/面积、给参数打动画
const PLOTS: [string, string, Record<string, unknown>][] = [
  ['函数图像', '正弦与余弦，依次画出', { x: [-6.5, 6.5], y: [-1.8, 1.8], grid: true, items: [{ type: 'fn', id: 'f', fn: 'sin(x)', label: '$\\sin x$' }, { type: 'fn', fn: 'cos(x)', label: '$\\cos x$' }] }],
  ['切线与导数', '点沿曲线移动，切线跟着转', { x: [-3, 3], y: [-1, 5], grid: true, params: { a: [kf(0.8, -2, 'inOut'), kf(3.6, 2)] }, items: [{ type: 'fn', id: 'f', fn: 'x^2/2', label: '$y=\\frac{x^2}{2}$' }, { type: 'tangent', of: 'f', x: 'a', length: 2.5, start: 0.6 }, { type: 'point', of: 'f', x: 'a', label: '斜率 = {a}', start: 0.6 }] }],
  ['曲线下面积', '面积随上限增长 + 黎曼和', { x: [-0.5, 4.5], y: [-0.5, 4.5], grid: true, params: { b: [kf(0.8, 0.5, 'inOut'), kf(3.6, 4)] }, items: [{ type: 'fn', id: 'f', fn: 'sqrt(x)*1.8', label: '$y=1.8\\sqrt{x}$' }, { type: 'area', of: 'f', from: 0, to: 'b', start: 0.6 }, { type: 'riemann', of: 'f', from: 0, to: 4, n: 8, start: 2.6, opacity: 0.35 }] }],
  ['参数曲线', '利萨如图形一笔画出', { x: [-1.6, 1.6], y: [-1.2, 1.2], grid: true, items: [{ type: 'param', fx: 'sin(3t)', fy: 'sin(2t)', t: [0, '2*pi'], label: '' }] }],
  ['极坐标', '四叶玫瑰线', { x: [-1.4, 1.4], y: [-1.2, 1.2], grid: true, items: [{ type: 'polar', fn: 'cos(2t)', t: [0, '2*pi'] }] }],
  ['向量', '数轴平面上的向量与和', { x: [-1, 5], y: [-1, 4], grid: true, items: [{ type: 'vector', x: 3, y: 1, label: '$\\vec{u}$' }, { type: 'vector', x: 1, y: 2, label: '$\\vec{v}$' }, { type: 'vector', x: 4, y: 3, label: '$\\vec{u}+\\vec{v}$', start: 1.5 }, { type: 'segment', x0: 3, y0: 1, x: 4, y: 3, dash: true, start: 1.2 }] }],
];

const CHART_SAMPLE: Record<string, { data: { label: string; value: number }[]; w: number; h: number }> = {
  progress: { data: [{ label: '完成度', value: 72 }], w: 0.45, h: 0.1 },
  ring: { data: [{ label: '完成度', value: 72 }], w: 0.22, h: 0 },
  pie: { data: [{ label: '甲', value: 45 }, { label: '乙', value: 30 }, { label: '丙', value: 25 }], w: 0.4, h: 0.5 },
  donut: { data: [{ label: '甲', value: 45 }, { label: '乙', value: 30 }, { label: '丙', value: 25 }], w: 0.4, h: 0.5 },
};

function useImages(enabled: boolean) {
  const project = useStore((s) => s.project);
  const [list, setList] = useState<AssetInfo[] | null>(null);
  const pid = project?.id;
  useEffect(() => {
    if (!enabled || !pid) return;
    const ac = new AbortController();
    api.assets(pid, ac.signal).then((r) => setList(r.assets.filter((a) => a.type === 'image'))).catch(() => setList([]));
    return () => ac.abort();
  }, [enabled, pid]);
  return list;
}

export function InsertPanel({ x, y, actions, onClose, scope }: { x: number; y: number; actions: Actions; onClose: () => void; scope?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>(() => readPref(scope, 'insertTab', 'slide' as Tab, (v) => TABS.some(([k]) => k === v)));
  const [theme, setTheme] = useState<string>(() => readPref(scope, 'slideTheme', 'dark', (v) => typeof v === 'string' && v in SLIDE_THEMES));
  const [pos, setPos] = useState({ x, y });
  const timeline = useStore((s) => s.timeline);
  const images = useImages(tab === 'image');
  useEffect(() => writePref(scope, 'insertTab', tab), [scope, tab]);
  // 关闭后焦点回到编辑器（否则留在 body 上，Ctrl+Z / Delete 等快捷键失效）
  useEffect(() => () => {
    requestAnimationFrame(() => { const a = document.activeElement; if (!a || a === document.body) document.querySelector<HTMLElement>('.dj-root')?.focus({ preventScroll: true }); });
  }, []);
  useEffect(() => writePref(scope, 'slideTheme', theme), [scope, theme]);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ x: Math.max(4, Math.min(x, window.innerWidth - r.width - 4)), y: Math.max(4, Math.min(y, window.innerHeight - r.height - 4)) });
  }, [x, y, tab]);
  useEffect(() => {
    const close = (e: Event) => { const t = e.target as HTMLElement; if (!ref.current?.contains(t) && !t.closest?.('[data-insert-toggle]')) onClose(); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    document.addEventListener('pointerdown', close, true);
    document.addEventListener('keydown', key, true);
    return () => { document.removeEventListener('pointerdown', close, true); document.removeEventListener('keydown', key, true); };
  }, [onClose]);
  const done = (fn: () => void) => () => { fn(); onClose(); };
  const k = timeline ? Math.min(timeline.meta.width, timeline.meta.height) / 1080 : 1;
  const px = (v: number) => Math.max(1, Math.round(v * k));
  const sq = (w: number) => (timeline ? (w * timeline.meta.width) / timeline.meta.height : w);

  let body: React.ReactNode;
  if (tab === 'text') {
    const tiles: [string, string, () => void][] = [
      ['标题', '大号粗体，弹出入场', () => actions.addElement('title')],
      ['正文文本框', '可换行、列表、**加粗**', () => actions.addElement('text')],
      ['要点列表', '每行一个要点', () => actions.addElement('text', { text: '第一个要点\n第二个要点\n第三个要点', list: 'bullet', accent: '#38bdf8', textEffect: { type: 'fadeUp', by: 'line' } })],
      ['数字滚动', '0 → 100% 计数动画', () => actions.addElement('counter')],
      ['标签', '圆角底色 + 文字', () => actions.addElement('shape', { shape: { type: 'rect', fill: '#2563eb', radius: px(999) }, text: '标签', w: 0.14, h: sq(0.14) * 0.32, fontSize: px(34), fontWeight: 700, color: '#ffffff' })],
      ['打字机', '逐字打出', () => actions.addElement('text', { text: '一个字一个字地出现', animationPreset: 'typewriter', w: 0.6 })],
      ['字幕', '底部字幕（永远在最上层）', () => actions.addText('subtitle')],
    ];
    body = <div className="dj-tiles">{tiles.map(([t, hint, run]) => <button key={t} type="button" className="dj-tile" onClick={done(run)}><b>{t}</b><small>{hint}</small></button>)}</div>;
  } else if (tab === 'shape') {
    body = (
      <div className="dj-pickgrid dj-pickgrid-lg">
        {SHAPE_TYPES.map((t) => <button key={t} type="button" title={SHAPE_LABEL[t] ?? t} aria-label={SHAPE_LABEL[t] ?? t} onClick={done(() => actions.addElement('shape', { shape: { type: t } }))}><ShapeThumb type={t} size={28} /></button>)}
      </div>
    );
  } else if (tab === 'icon') {
    body = <IconPicker onPick={(name) => { actions.addElement('icon', { icon: { name } }); onClose(); }} />;
  } else if (tab === 'chart') {
    body = (
      <div className="dj-tiles">
        {CHART_TYPES.map((t) => {
          const s = CHART_SAMPLE[t];
          return <button key={t} type="button" className="dj-tile" onClick={done(() => actions.addElement('chart', s ? { chart: { type: t, data: s.data }, w: s.w, h: s.h || sq(s.w) } : { chart: { type: t } }))}><b>{CHART_LABEL[t] ?? t}</b><small>{s ? '单个数值' : '多组数据，可在属性里编辑'}</small></button>;
        })}
      </div>
    );
  } else if (tab === 'math') {
    const tile = (key: string, title: string, hint: React.ReactNode, run: () => void) => <button key={key} type="button" className="dj-tile" onClick={done(run)}><b>{title}</b><small>{hint}</small></button>;
    body = (
      <>
        <h5 className="dj-insert-h">公式 · 逐笔书写</h5>
        <div className="dj-tiles">
          {FORMULAS.map(([title, tex]) => tile(title, title, <TexPreview tex={tex} />, () => actions.addElement('math', { text: tex })))}
        </div>
        <h5 className="dj-insert-h">坐标系 · 依次画出</h5>
        <div className="dj-tiles">
          {PLOTS.map(([title, hint, plot]) => tile(title, title, hint, () => actions.addElement('plot', { plot, name: title })))}
        </div>
        <h5 className="dj-insert-h">其他</h5>
        <div className="dj-tiles">
          {tile('arrow', '曲线箭头', '自由路径，描边绘制', () => actions.addElement('shape', { shape: { type: 'path', path: 'M0,100 C20,10 80,10 100,100', arrow: 'end', stroke: { color: '#F7D96F', width: px(6) } }, w: 0.3, h: sq(0.3) * 0.5, animationPreset: 'drawIn' }))}
          {tile('camera', '镜头', '推近、拉远、平移这一页', () => actions.addCamera())}
        </div>
        <p className="dj-hint">相同元素在播放头处“变形”（右键菜单）：公式按字符平滑移动，形状逐点变形，坐标系里的函数连续变化。</p>
      </>
    );
  } else if (tab === 'image') {
    body = (
      <div className="dj-imgpick">
        {(images ?? []).map((a) => <button key={a.name} type="button" title={a.name} onClick={done(() => actions.addImageElement(a))}><img src={absolute(a.thumb ?? a.media)} alt="" loading="lazy" /></button>)}
        {images && !images.length && <p className="dj-hint">素材库里还没有图片，先到“素材”上传；图片元素可以自由摆放、加圆角和边框。</p>}
        {!images && <p className="dj-hint">正在读取素材…</p>}
      </div>
    );
  } else {
    body = (
      <>
        <div className="dj-chips" role="radiogroup" aria-label="主题">
          {Object.entries(SLIDE_THEMES).map(([key, th]) => (
            <button key={key} type="button" role="radio" aria-checked={theme === key} className="dj-chip dj-palette" aria-pressed={theme === key} onClick={() => setTheme(key)}>
              <i style={{ background: typeof th.bg === 'string' ? th.bg : 'linear-gradient(135deg,' + th.bg.stops.map((s) => s.color).join(',') + ')' }} /><i style={{ background: th.accent }} />{th.label}
            </button>
          ))}
        </div>
        <div className="dj-tiles" style={{ marginTop: 8 }}>
          {Object.entries(SLIDE_TEMPLATES).map(([key, t]) => (
            <button key={key} type="button" className="dj-tile" onClick={done(() => actions.addSlide(key, theme))}><b>{t.label}</b><small>{TEMPLATE_HINT[key] ?? ''}</small></button>
          ))}
        </div>
        <p className="dj-hint">插入后每段文字、形状、图标都是独立元素：在画面上点选、双击改字；整页在时间线上是一块。</p>
      </>
    );
  }
  return createPortal(
    <div className="dj-pop dj-insertpop" ref={ref} role="dialog" aria-label="插入元素" style={{ left: pos.x, top: pos.y }} onContextMenu={(e) => e.preventDefault()}>
      <div className="dj-tabs dj-subtabs" role="tablist">
        {TABS.map(([key, label, icon]) => <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}><Icon name={icon} />{label}</button>)}
      </div>
      <div className="dj-insertpop-body">{body}</div>
    </div>, document.body);
}
