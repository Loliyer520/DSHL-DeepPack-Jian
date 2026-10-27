// v7 数学动画：表达式、路径几何、公式排版、坐标系/变形/镜头的 ops 语义与渲染辅助函数
import test from 'node:test';
import assert from 'node:assert/strict';
import { applyOps } from '../packages/engine/dist/ops.js';
import { parseTimeline, validateTimeline } from '../packages/engine/dist/schema.js';
import { describeBatch } from '../packages/engine/dist/describe.js';
import { compileExpr, analyzeExpr, evalValue, fillTemplate, ExprError } from '../packages/engine/dist/expr.js';
import { parsePath, samplePath, trimEnd, verticesPath, pathLength } from '../packages/engine/dist/paths.js';
import { layoutTex, texError } from '../packages/engine/dist/mathServer.js';
import { normalizeTex, writeOrder } from '../packages/engine/dist/mathData.js';
import { SLIDE_SAMPLES, SLIDE_TEMPLATES, autoRange, fnTex } from '../packages/engine/dist/templates.js';
import { elementLabel, groupTitle, texLabel } from '../packages/engine/dist/timeline.js';
import { loadTs } from './helpers/ts-load.mjs';

let seq = 0;
const ctx = (extra = {}) => ({ newId: (p) => `${p}${++seq}`, checkTex: texError, ...extra });
const blank = (w = 1920, h = 1080) => parseTimeline({ meta: { fps: 30, width: w, height: h }, videoTracks: [{ id: 'v1', clips: [] }], audioTracks: [], overlays: [] });
const apply = (t, ops, extra) => applyOps(t, ops, ctx(extra));
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, a + ' ≈ ' + b);

test('expressions: precedence, implicit multiplication, functions, user functions, errors', () => {
  const ev = (s, vars = {}, fns) => compileExpr(s, new Set(Object.keys(fns ?? {})))({ vars, fns });
  near(ev('2x^2 + 3x - 1', { x: 2 }), 13);
  near(ev('-x^2', { x: 3 }), -9, 1e-9);
  near(ev('2^3^2'), 512);
  near(ev('2(x+1)', { x: 1 }), 4);
  near(ev('2sin(pi/2)'), 2);
  near(ev('|x-5|', { x: 2 }), 3);
  near(ev('3!'), 6);
  near(ev('sqrt(16) + ln(e) + max(1, 4, 2)'), 9);
  near(ev('2π'), Math.PI * 2);
  near(ev('f(a) + 1', { a: 3 }, { f: (x) => x * x }), 10);
  assert.ok(Number.isNaN(ev('nope', {})), '未定义变量求值为 NaN');
  assert.throws(() => compileExpr('sin'), ExprError);
  assert.throws(() => compileExpr('(1+2'), /缺少/);
  assert.throws(() => compileExpr('1 # 2'), /无法识别/);
  const a = analyzeExpr('a*sin(b x) + f(c)', new Set(['f']));
  assert.deepEqual([...a.vars].sort(), ['a', 'b', 'c', 'x']);
  assert.deepEqual([...a.calls], ['f']);
  assert.equal(evalValue('1/0', { vars: {} }, undefined, 7), 7, '非有限值退回缺省');
  assert.equal(fillTemplate('a = {a}, f = {a*2:1} $\\frac{a}{b}$', { vars: { a: 1.2345 } }), 'a = 1.23, f = 2.5 $\\frac{a}{b}$', '$…$ 内不代入');
});

test('paths: arcs, relative commands, sampling, trimming and smooth vertices', () => {
  const circle = parsePath('M0,50 A50,50 0 1 0 100,50 A50,50 0 1 0 0,50 Z');
  assert.equal(circle.length, 1);
  assert.ok(circle[0].closed);
  near(pathLength(circle[0]), Math.PI * 100, 0.5);
  const pts = samplePath(circle[0], 40);
  assert.equal(pts.length, 40);
  for (const [x, y] of pts) near(Math.hypot(x - 50, y - 50), 50, 0.6);
  const rel = parsePath('m10 10 l 20 0 h 10 v 10 q 5 5 10 0 t 10 0 s 10 10 20 0 z M0 0 L1 1');
  assert.equal(rel.length, 2);
  assert.deepEqual(rel[0].segs[0].p, [30, 10]);
  assert.deepEqual(rel[0].segs[2].p, [40, 20]);
  const line = parsePath('M0,0 L100,0')[0];
  const t = trimEnd(line, 10);
  near(t.tip[0], 100); near(t.angle, 0);
  near(t.path.segs[0].p[0], 90, 0.01);
  const smooth = verticesPath([[0, 0], [50, 100], [100, 0]], false, true);
  assert.equal(smooth[0].segs.length, 2);
  assert.deepEqual(smooth[0].segs[1].p, [100, 0]);
  assert.equal(verticesPath([[0, 0], [1, 0], [1, 1]], true, false)[0].segs.length, 3);
});

test('LaTeX layout: glyph pieces with matrices, colors, rects, text; errors are reported', () => {
  assert.equal(normalizeTex('$$ x^2 $$'), 'x^2');
  assert.equal(normalizeTex('\\[a\\]'), 'a');
  const r = layoutTex('{\\color{#58C4DD}a}^2+\\frac{1}{2}');
  assert.ok(!('error' in r));
  assert.equal(r.vb.length, 4);
  const keys = r.pieces.map((p) => p.k);
  assert.ok(keys.includes('1D44E') && keys.includes('2B') && keys.includes('rect:mfrac'));
  assert.equal(r.pieces.find((p) => p.k === '1D44E').c, '#58C4DD');
  const sup = r.pieces.find((p) => p.k === '32');
  near(sup.m[0], 0.707, 1e-3);
  assert.deepEqual(writeOrder(r).slice(0, 2).map((i) => r.pieces[i].k), ['1D44E', '32'], '从左到右书写');
  const cjk = layoutTex('\\text{面积}=\\pi r^2');
  assert.deepEqual(cjk.pieces.filter((p) => p.tag === 'text').map((p) => p.a.text), ['面', '积']);
  assert.match(layoutTex('\\frac{a').error, /LaTeX 错误/);
  assert.match(texError('\\badmacro'), /Undefined control sequence/);
  assert.equal(texError('x'), undefined);
});

test('math elements: tex alias, delimiter stripping, LaTeX warnings, label and slide title', () => {
  const r = apply(blank(), [
    { op: 'addOverlay', tex: '$E = mc^2$', startSeconds: 0, endSeconds: 3 },
    { op: 'addOverlay', kind: 'math', text: '\\frac{1}{', startSeconds: 0, endSeconds: 3 },
    { op: 'addOverlay', kind: 'math', text: '  ', startSeconds: 0, endSeconds: 3 },
  ]);
  assert.deepEqual(r.receipts.map((x) => x.status), ['applied', 'partial', 'rejected']);
  const [m, bad] = r.timeline.overlays;
  assert.equal(m.kind, 'math');
  assert.equal(m.text, 'E = mc^2');
  assert.equal(m.fontSize, 72);
  assert.equal(m.x, 0.5);
  assert.equal(m.w, undefined, '公式按字号自然大小，不设盒子');
  assert.match(r.receipts[1].warnings[0], /LaTeX 错误/);
  assert.equal(bad.text, '\\frac{1}{');
  assert.equal(elementLabel(m), 'E = mc^2');
  assert.equal(texLabel('{\\color{#58C4DD}a}^{2} + \\frac{a}{b}'), 'a^{2} + \\frac{a}{b}', '显示名去掉上色、保留命令参数');
  assert.equal(groupTitle([{ ...m, group: 'g' }, { id: 't', kind: 'text', text: '质能方程', fontSize: 40 }]), '质能方程', '公式不当页标题');
  assert.deepEqual(validateTimeline(r.timeline), []);
});

test('plot sanitizing: ranges, params with keyframes, unknown names and broken expressions', () => {
  const r = apply(blank(), [{
    op: 'addOverlay', startSeconds: 0, endSeconds: 6,
    plot: {
      x: [5, -5], y: [-2, 2], grid: true,
      params: { a: [{ t: 0, v: -2 }, { t: 3, v: 2, e: 'inOut' }], k: 1, pi: 3, '1bad': 2 },
      items: [
        { type: 'fn', id: 'f', fn: 'y = k*sin(x)', label: '$f$' },
        { type: 'point', x: 'a', of: 'f', label: '({x}, {y})', guides: true },
        { type: 'tangent', of: 'f', x: 'a', length: 2 },
        { type: 'area', of: 'g', from: 0, to: 'a' },
        { fn: 'sin(' },
        { type: 'fn', fn: 'q*x' },
        { type: 'param', fx: 'cos(t)', fy: 'sin(t)', t: [0, '2pi'], color: '#FC6255', width: 999 },
        { type: 'riemann', from: 0, to: 3, n: 'k*6' },
      ],
    },
  }]);
  const rec = r.receipts[0];
  assert.equal(rec.status, 'partial');
  const plot = r.timeline.overlays[0].plot;
  assert.equal(r.timeline.overlays[0].kind, 'plot');
  assert.deepEqual(plot.x, [-5, 5], '范围自动按大小排序');
  assert.deepEqual(Object.keys(plot.params), ['a', 'k']);
  assert.equal(plot.params.a.length, 2);
  const warn = rec.warnings.join('\n');
  assert.match(warn, /参数名「pi」不可用/);
  assert.match(warn, /参数名「1bad」不可用/);
  assert.match(warn, /of「g」不是已定义的函数 id/);
  assert.match(warn, /无法解析/);
  assert.match(warn, /未定义的 q/);
  assert.equal(plot.items.length, 7, '主表达式坏掉的函数被丢弃');
  assert.equal(plot.items[1].of, 'f');
  assert.equal(plot.items[5].width, 40);
  assert.deepEqual(plot.items[5].t, [0, '2pi']);
  assert.deepEqual(validateTimeline(r.timeline), []);
  const ov = r.timeline.overlays[0];
  assert.ok(Math.abs(ov.h - (0.6 * 1920) / 1080 / 1.6) < 1e-3, '缺省 16:10');
  assert.match(elementLabel(ov), /^坐标系 y=y = k\*sin\(x\)|^坐标系 y=k\*sin\(x\)|^坐标系 y=/);
});

test('free path shapes: path or vertices, open paths get a stroke, closed get a fill', () => {
  const r = apply(blank(), [
    { op: 'addOverlay', shape: { type: 'path', path: 'M0,100 C30,0 70,0 100,100', arrow: 'end' }, startSeconds: 0, endSeconds: 1 },
    { op: 'addOverlay', shape: { type: 'path', vertices: [[0, 0], [100, 0], [50, 100], ['x', 1]], closed: true, smooth: true }, startSeconds: 0, endSeconds: 1 },
    { op: 'addOverlay', shape: { type: 'path', path: 'garbage' }, startSeconds: 0, endSeconds: 1 },
  ]);
  const [open, closed, fallback] = r.timeline.overlays.map((o) => o.shape);
  assert.deepEqual(open.stroke, { color: '#ffffff', width: 6 });
  assert.equal(open.fill, undefined);
  assert.equal(open.arrow, 'end');
  assert.equal(closed.vertices.length, 3, '非法顶点丢弃');
  assert.equal(closed.fill, '#3b82f6');
  assert.ok(closed.closed && closed.smooth);
  assert.match(fallback.path, /^M0,80 C/);
  assert.deepEqual(validateTimeline(r.timeline), []);
});

test('transform: A ends at the cut, B starts with morph, effects and keyframes carried sensibly', () => {
  let t = apply(blank(), [{ op: 'addOverlay', id: 'eq', tex: 'a^2+b^2', startSeconds: 1, endSeconds: 8, effects: [{ preset: 'write' }, { preset: 'fadeOut' }, { preset: 'pulse' }], animations: { x: [{ t: 0, v: 0 }, { t: 4, v: 0.1 }], progress: [{ t: 0, v: 0 }, { t: 1, v: 1 }] } }]).timeline;
  const r = apply(t, [{ op: 'transform', id: 'eq', atSeconds: 3, duration: 1.5, ease: 'out', patch: { text: 'c^2', color: '#F7D96F' } }]);
  assert.equal(r.receipts[0].status, 'applied');
  const [A, B] = r.timeline.overlays;
  assert.equal(A.endSeconds, 3);
  assert.deepEqual(A.effects.map((e) => e.preset), ['write', 'pulse'], 'A 去掉出场');
  assert.equal(B.id, r.receipts[0].id);
  assert.equal(B.startSeconds, 3);
  assert.equal(B.endSeconds, 8);
  assert.equal(B.text, 'c^2');
  assert.equal(B.color, '#F7D96F');
  assert.deepEqual(B.morph, { from: 'eq', duration: 1.5, ease: 'out' });
  assert.deepEqual(B.effects.map((e) => e.preset), ['fadeOut', 'pulse'], 'B 只留出场/循环');
  assert.equal(B.animations.progress, undefined, 'B 一出现就是完整的');
  assert.deepEqual(B.animations.x.map((k) => k.t), [-2, 2], '关键帧平移到新起点');
  assert.deepEqual(validateTimeline(r.timeline), []);
  // 链式变形 + 描述
  const r2 = apply(r.timeline, [{ op: 'transform', id: B.id, atSeconds: 5, patch: { text: 'c' } }]);
  assert.equal(r2.timeline.overlays[2].morph.from, B.id);
  const lines = describeBatch(r.timeline, r2.timeline, [{ op: 'transform', id: B.id, atSeconds: 5, patch: { text: 'c' } }], r2.receipts);
  assert.equal(lines[0], '在 5s 把公式「c^2」变形为「c」（1s 过渡）');
  // 不在区间内 / 镜头不能变形
  const bad = apply(r2.timeline, [{ op: 'transform', id: 'eq', atSeconds: 9 }, { op: 'addOverlay', id: 'cam', kind: 'camera', startSeconds: 0, endSeconds: 2 }, { op: 'transform', id: 'cam', atSeconds: 1 }]);
  assert.deepEqual(bad.receipts.map((x) => x.status), ['rejected', 'applied', 'rejected']);
  // 在末尾变形：A 不缩短，B 接着显示 3 秒
  const tail = apply(t, [{ op: 'transform', id: 'eq', atSeconds: 8, patch: { text: 'x' } }]);
  assert.equal(tail.timeline.overlays[0].endSeconds, 8);
  assert.deepEqual([tail.timeline.overlays[1].startSeconds, tail.timeline.overlays[1].endSeconds], [8, 11]);
});

test('morph links: validated on update, dropped when the source is removed, not copied by split', () => {
  let r = apply(blank(), [
    { op: 'addOverlay', id: 'a', shape: 'ellipse', startSeconds: 0, endSeconds: 2 },
    { op: 'addOverlay', id: 'b', shape: 'star', startSeconds: 2, endSeconds: 5 },
    { op: 'addOverlay', id: 'c', shape: 'rect', startSeconds: 1, endSeconds: 5 },
    { op: 'updateOverlay', id: 'b', patch: { morph: { from: 'a', duration: 0.8 } } },
    { op: 'updateOverlay', id: 'c', patch: { morph: 'b' } },
    { op: 'updateOverlay', id: 'c', patch: { morph: { from: 'zzz' } } },
  ]);
  assert.deepEqual(r.receipts.slice(3).map((x) => x.status), ['applied', 'partial', 'partial']);
  assert.match(r.receipts[4].warnings[0], /同时出现/);
  assert.equal(r.timeline.overlays[2].morph, undefined, '无效来源清掉');
  const split = apply(r.timeline, [{ op: 'splitOverlay', id: 'b', atSeconds: 3 }]);
  assert.deepEqual(split.timeline.overlays.filter((o) => o.morph).map((o) => o.id), ['b']);
  const removed = apply(r.timeline, [{ op: 'removeOverlay', id: 'a' }]);
  assert.equal(removed.timeline.overlays.find((o) => o.id === 'b').morph, undefined);
  assert.ok(removed.changed.includes('overlay:b'));
});

test('camera: spans its slide by default, keyframes drive the frame, only affects its group', async () => {
  let t = apply(blank(), [{ op: 'addSlide', id: 's', template: 'graph', theme: 'math', startSeconds: 2, duration: 6, fn: 'x^2' }]).timeline;
  const r = apply(t, [{ op: 'addOverlay', kind: 'camera', group: 's', w: 0.5, x: 0.6, y: 0.4, animations: { scale: [{ t: 0, v: 2 }, { t: 2, v: 1 }] } }]);
  const cam = r.timeline.overlays.find((o) => o.kind === 'camera');
  assert.deepEqual([cam.startSeconds, cam.endSeconds], [2, 8]);
  assert.equal(elementLabel(cam), '镜头');
  const { cameraState, activeCamera } = await loadTs('packages/engine/src/camera.ts');
  const s0 = cameraState(cam, 0, 1920, 1080), s2 = cameraState(cam, 2, 1920, 1080);
  near(s0.zoom, 1); near(s2.zoom, 2);
  near(s2.cx, 0.6 * 1920); near(s2.cy, 0.4 * 1080);
  const member = r.timeline.overlays.find((o) => o.group === 's' && o.kind === 'plot');
  assert.equal(activeCamera([cam], member, 3), cam);
  assert.equal(activeCamera([cam], { ...member, group: 'other' }, 3), undefined);
  assert.equal(activeCamera([cam], member, 9), undefined);
  assert.equal(activeCamera([cam], { id: 'sub', text: 'hi', kind: 'subtitle' }, 3), undefined, '字幕不受镜头影响');
  assert.equal(activeCamera([{ ...cam, group: undefined }], { ...member, group: 'other' }, 3)?.id, cam.id, '不分组的镜头作用于所有元素');
});

test('math slide templates and helpers', () => {
  assert.ok(SLIDE_TEMPLATES.formula && SLIDE_TEMPLATES.graph);
  for (const template of ['formula', 'graph']) {
    for (const [w, h] of [[1920, 1080], [1080, 1920]]) {
      const r = apply(blank(w, h), [{ op: 'addSlide', template, theme: 'math', startSeconds: 0, duration: 5, ...SLIDE_SAMPLES[template] }]);
      assert.equal(r.receipts[0].status, 'applied', template + ' ' + JSON.stringify(r.receipts[0]));
      assert.deepEqual(validateTimeline(r.timeline), []);
    }
  }
  const g = apply(blank(), [{ op: 'addSlide', template: 'graph', startSeconds: 0, fn: 'x^2; sqrt(x+1); 2^(x/2)' }]).timeline.overlays.find((o) => o.kind === 'plot');
  assert.deepEqual(g.plot.items.map((it) => it.id), ['f1', 'f2', 'f3']);
  for (const it of g.plot.items) assert.ok(!('error' in layoutTex(it.label.slice(1, -1))), it.label + ' 是合法 LaTeX');
  assert.equal(fnTex('sqrt(x+1)'), 'y=\\sqrt{x+1}');
  assert.equal(fnTex('2^(x/2)'), 'y=2^{x/2}');
  assert.equal(fnTex('y = sin(x)'), 'y=\\sin(x)');
  const [lo, hi] = autoRange(['tan(x)'], [-6, 6]);
  assert.ok(hi - lo < 80, 'tan 的渐近线不会把范围撑爆');
  assert.deepEqual(autoRange(['x^2'], [-2, 2]), [-1, 4.5]);
  const f = apply(blank(), [{ op: 'addSlide', template: 'formula', startSeconds: 0, formula: '$\\int_0^1 x\\,dx$' }]).timeline.overlays.find((o) => o.kind === 'math');
  assert.equal(f.text, '\\int_0^1 x\\,dx');
  assert.deepEqual(f.effects, [{ preset: 'write' }]);
});

test('renderer helpers: plot reveal and params, morph matching and point alignment', async () => {
  const plot = await loadTs('packages/engine/src/plot.tsx');
  const spec = { x: [-5, 5], y: [-3, 3], params: { a: [{ t: 0, v: 0 }, { t: 2, v: 4 }] }, items: [{ type: 'fn', fn: 'sin(x)' }, { type: 'point', x: 'a', start: 1, draw: 0.5, end: 3 }, { type: 'area', from: 0, to: 'a' }] };
  near(plot.plotParams(spec, 1).a, 2);
  const r0 = plot.itemReveal(spec, 0.25, 0), r1 = plot.itemReveal(spec, 1, 1.25), r2 = plot.itemReveal(spec, 1, 3.2);
  near(r0.axes, 1); near(r0.items[0].r, 0);
  near(r1.items[1].r, 0.5); near(r2.items[1].o, 0.5);
  const model = plot.plotModel({ ...spec, items: [{ type: 'fn', id: 'f', fn: 'f(x) = x^2 + a' }] }, 2);
  near(model.fnOf('f')(3), 13);
  near(model.val('f(1)'), 5);
  assert.equal(plot.niceStep(10), 1);
  assert.equal(plot.niceStep(37), 5);
  const morph = await loadTs('packages/engine/src/morph.tsx');
  const a = layoutTex('a^2+b^2'), b = layoutTex('b^2+a^2+c');
  const m = morph.matchPieces(a, b);
  assert.equal(m.pairs.length, 5);
  assert.equal(m.outA.length, 0);
  assert.deepEqual(m.inB.map((j) => b.pieces[j].k).sort(), ['1D450', '2B'].sort());
  // 整段出现在新公式里：整体对到那一段，不被拆散到前面的同名字符上
  const s = layoutTex('a^2+2ab+b^2'), t = layoutTex('(a+b)^2=a^2+2ab+b^2');
  const ms = morph.matchPieces(s, t);
  const eqX = t.pieces.find((p) => p.k === '3D').m[4];
  assert.equal(ms.pairs.length, s.pieces.length);
  assert.ok(ms.pairs.every(([, j]) => t.pieces[j].m[4] > eqX), '全部配到等号右边');
  const sq = [[0, 0], [10, 0], [10, 10], [0, 10]];
  const shifted = [[10, 10], [0, 10], [0, 0], [10, 0]];
  assert.deepEqual(morph.alignPoints(sq, shifted, true), sq, '起点错位对齐');
  assert.deepEqual(morph.alignPoints(sq, [...sq].reverse(), true)[0], [0, 0], '反向也能对齐');
  assert.equal(morph.mixColor('#000000', '#ffffff', 0.5), 'rgba(128,128,128,1)');
  assert.equal(morph.mixColor('red', '#fff', 0.2), 'red');
});
