// v6 幻灯片元素：形状/图片/图标/图表/文本框的创建与净化、叠放顺序、幻灯片模板、整组操作、描述与撤销
import test from 'node:test';
import assert from 'node:assert/strict';
import { applyOps, applyPresetToEffects } from '../packages/engine/dist/ops.js';
import { parseTimeline, validateTimeline, TimelineVersionError } from '../packages/engine/dist/schema.js';
import { diffTimelines, timelinesEqual } from '../packages/engine/dist/diff.js';
import { describeBatch } from '../packages/engine/dist/describe.js';
import { elementOrder, elementLabel, allSources } from '../packages/engine/dist/timeline.js';
import { SLIDE_TEMPLATES, SLIDE_THEMES } from '../packages/engine/dist/templates.js';
import { ICONS, iconByName } from '../packages/engine/dist/icons.js';
import { ANIMATION_PRESETS } from '../packages/engine/dist/presets.js';
import { loadTs } from './helpers/ts-load.mjs';

let seq = 0;
const ctx = (extra = {}) => ({ newId: (p) => `${p}${++seq}`, ...extra });
const blank = (w = 1920, h = 1080) => parseTimeline({ meta: { fps: 30, width: w, height: h }, videoTracks: [{ id: 'v1', clips: [] }], audioTracks: [], overlays: [] });
const apply = (t, ops, extra) => applyOps(t, ops, ctx(extra));

test('shapes: kind inferred, pixel-square default box, default fill, string shorthand', () => {
  const r = apply(blank(), [
    { op: 'addOverlay', shape: 'ellipse', startSeconds: 0, endSeconds: 2 },
    { op: 'addOverlay', kind: 'shape', shape: { type: 'arrow' }, startSeconds: 0, endSeconds: 2 },
    { op: 'addOverlay', kind: 'shape', shape: { type: 'rect', fill: { type: 'linear', angle: 90, stops: [{ color: '#fff' }, { color: '#000' }] }, stroke: { color: '#f00', width: 3, dash: 'dashed' }, radius: 20 }, x: -0.2, y: 2.5, w: 0.3, h: 0.2 },
  ]);
  assert.deepEqual(r.receipts.map((x) => x.status), ['applied', 'applied', 'applied']);
  const [circle, arrow, rect] = r.timeline.overlays;
  assert.equal(circle.kind, 'shape');
  assert.equal(circle.w, 0.25);
  assert.ok(Math.abs(circle.h - (0.25 * 1920) / 1080) < 1e-3, '缺省按像素等宽');
  assert.equal(circle.shape.fill, '#3b82f6');
  assert.equal(circle.text, '');
  assert.deepEqual(arrow.shape.stroke, { color: '#ffffff', width: 6 });
  assert.ok(arrow.h < 0.05, '线条缺省很矮');
  assert.deepEqual(rect.shape.fill.stops, [{ offset: 0, color: '#fff' }, { offset: 1, color: '#000' }], '缺 offset 时均匀分布');
  assert.equal(rect.shape.stroke.dash, 'dashed');
  assert.equal(rect.x, -0.2);
  assert.equal(rect.y, 2, '位置钳在 -1–2');
  assert.deepEqual(validateTimeline(r.timeline), []);
});

test('images check the asset library; icons warn on unknown names; charts need data', () => {
  const has = (name) => name === 'logo.png';
  const r = apply(blank(), [
    { op: 'addOverlay', kind: 'image', image: { src: 'logo.png', radius: 24, border: { color: '#fff', width: 4 } }, startSeconds: 0, endSeconds: 1 },
    { op: 'addOverlay', kind: 'image', image: 'missing.png', startSeconds: 0, endSeconds: 1 },
    { op: 'addOverlay', icon: 'rocket', color: '#f59e0b', startSeconds: 0, endSeconds: 1 },
    { op: 'addOverlay', icon: { name: 'no-such-icon' }, startSeconds: 0, endSeconds: 1 },
    { op: 'addOverlay', chart: { type: 'pie', data: [3, { label: 'b', value: 5, color: '#123456' }, { label: 'bad' }] }, startSeconds: 0, endSeconds: 1 },
    { op: 'addOverlay', kind: 'chart', chart: { type: 'bar', data: [] }, startSeconds: 0, endSeconds: 1 },
  ], { assetExists: has });
  assert.deepEqual(r.receipts.map((x) => x.status), ['applied', 'rejected', 'applied', 'partial', 'applied', 'rejected']);
  assert.match(r.receipts[1].reason, /素材库里没有「missing\.png」/);
  assert.match(r.receipts[3].warnings[0], /内置图标里没有/);
  const [img, rocket, , pie] = r.timeline.overlays;
  assert.equal(img.image.src, 'logo.png');
  assert.equal(img.w, 0.4);
  assert.equal(rocket.kind, 'icon');
  assert.deepEqual(pie.chart.data, [{ value: 3 }, { label: 'b', value: 5, color: '#123456' }]);
  assert.deepEqual(allSources(r.timeline), ['logo.png'], '图片元素计入素材引用');
  assert.ok(ICONS.length > 200 && iconByName('rocket') && iconByName('chart-pie'));
});

test('text boxes: rich text, lists, counters and per-unit effects are sanitized', () => {
  const r = apply(blank(), [{
    op: 'addOverlay', kind: 'text', text: '**粗体** ==强调==', list: 'number', accent: '#ff0000', valign: 'bottom', padding: 20,
    counter: { to: '98.5', decimals: 1, suffix: '%' }, textEffect: { type: 'fadeUp', by: 'line', interval: 9 }, rotate: 15, opacity: 0.5,
    startSeconds: 1, endSeconds: 4,
  }]);
  const o = r.timeline.overlays[0];
  assert.equal(o.kind, 'text');
  assert.equal(o.w, 0.5);
  assert.equal(o.h, undefined, '文本框缺省自动高度');
  assert.deepEqual(o.counter, { from: 0, to: 98.5, decimals: 1, suffix: '%' });
  assert.deepEqual(o.textEffect, { type: 'fadeUp', by: 'line', interval: 2 });
  assert.equal(o.rotate, 15);
  assert.equal(elementLabel(o), '粗体 强调', '显示名去掉标记');
  const cleared = apply(r.timeline, [{ op: 'updateOverlay', id: o.id, patch: { counter: null, opacity: 1, rotate: 0, list: 'nope' } }]).timeline.overlays[0];
  assert.equal(cleared.counter, undefined);
  assert.equal(cleared.opacity, undefined);
  assert.equal(cleared.rotate, undefined);
  assert.equal(cleared.list, undefined);
});

test('stacking: track then array order, subtitles always on top; arrangeOverlay moves among overlapping peers', () => {
  let t = apply(blank(), [
    { op: 'addOverlay', id: 'sub', text: '字幕', kind: 'subtitle', startSeconds: 0, endSeconds: 5 },
    { op: 'addOverlay', id: 'a', shape: 'rect', startSeconds: 0, endSeconds: 5 },
    { op: 'addOverlay', id: 'b', shape: 'ellipse', startSeconds: 0, endSeconds: 5 },
    { op: 'addOverlay', id: 'c', shape: 'star', startSeconds: 0, endSeconds: 5, track: 2 },
    { op: 'addOverlay', id: 'late', shape: 'star', startSeconds: 9, endSeconds: 10 },
  ]).timeline;
  const ids = (tl) => elementOrder(tl.overlays).map((o) => o.id);
  assert.deepEqual(ids(t), ['a', 'b', 'late', 'c', 'sub']);
  t = apply(t, [{ op: 'arrangeOverlay', id: 'a', to: 'front' }]).timeline;
  assert.deepEqual(ids(t).filter((x) => x !== 'late'), ['b', 'c', 'a', 'sub']);
  t = apply(t, [{ op: 'arrangeOverlay', id: 'a', to: 'backward' }]).timeline;
  assert.deepEqual(ids(t).filter((x) => x !== 'late'), ['b', 'a', 'c', 'sub']);
  t = apply(t, [{ op: 'arrangeOverlay', id: 'c', to: 'back' }]).timeline;
  assert.deepEqual(ids(t).filter((x) => x !== 'late'), ['c', 'b', 'a', 'sub']);
  const r = apply(t, [{ op: 'arrangeOverlay', id: 'late', to: 'front' }, { op: 'arrangeOverlay', id: 'c', to: 'sideways' }]);
  assert.equal(r.receipts[0].status, 'ignored');
  assert.equal(r.receipts[1].status, 'rejected');
  assert.match(describeBatch(t, apply(t, [{ op: 'arrangeOverlay', id: 'b', to: 'forward' }]).timeline, [{ op: 'arrangeOverlay', id: 'b', to: 'forward' }], [{ index: 0, status: 'applied' }])[0], /上移一层 椭圆/);
});

test('every slide template expands into valid, grouped, individually editable elements (landscape and portrait)', () => {
  const item = { title: '标题', text: '说明\n第二行', value: 42.5, suffix: '%', icon: 'rocket' };
  for (const [w, h] of [[1920, 1080], [1080, 1920]]) {
    for (const template of Object.keys(SLIDE_TEMPLATES)) {
      for (const theme of Object.keys(SLIDE_THEMES)) {
        const r = apply(blank(w, h), [{ op: 'addSlide', id: 'sl', template, theme, title: '主题', subtitle: '副标题', kicker: 'KICKER', items: [item, item, item], startSeconds: 2, duration: 4 }]);
        assert.equal(r.receipts[0].status, 'applied', template + '/' + theme + ' ' + JSON.stringify(r.receipts[0]));
        assert.equal(r.receipts[0].id, 'sl', '回执 id = 分组 id（乐观更新据此对齐）');
        const els = r.timeline.overlays;
        assert.ok(els.length >= 3, template);
        assert.ok(els.every((o) => o.group === 'sl' && o.id.startsWith('sle') && o.endSeconds === 6 && o.startSeconds >= 2), template);
        assert.deepEqual(validateTimeline(r.timeline), [], template + '/' + theme);
      }
    }
  }
});

test('slides sit below existing elements, missing images fall back to a placeholder, unknown templates are rejected', () => {
  let t = apply(blank(), [{ op: 'addOverlay', id: 'logo', icon: 'star', startSeconds: 0, endSeconds: 10 }]).timeline;
  const r = apply(t, [
    { op: 'addSlide', template: 'imageText', image: 'nope.png', title: '图文', startSeconds: 0 },
    { op: 'addSlide', template: 'nope' },
    { op: 'addSlide', template: 'cover', theme: 'rainbow', title: 'x', startSeconds: 5 },
  ], { assetExists: () => false });
  assert.equal(r.receipts[0].status, 'partial');
  assert.match(r.receipts[0].warnings[0], /占位/);
  assert.ok(r.timeline.overlays.some((o) => o.name === '配图占位'));
  assert.equal(r.receipts[1].status, 'rejected');
  assert.match(r.receipts[1].reason, /可用：cover/);
  assert.match(r.receipts[2].warnings[0], /未知主题/);
  const order = elementOrder(r.timeline.overlays).map((o) => o.id);
  assert.equal(order[order.length - 1], 'logo', '原有元素仍在最上层');
  const lines = describeBatch(t, r.timeline, [{ op: 'addSlide', template: 'imageText' }], [r.receipts[0]]);
  assert.match(lines[0], /^添加幻灯片「图文」：图文（\d+ 个元素，0s–5s，分组 /);
});

test('groups move, retime, ungroup and delete together; undo restores the slide exactly', () => {
  const t0 = apply(blank(), [{ op: 'addSlide', id: 'g', template: 'cards', title: '卡片', items: [{ title: 'A' }, { title: 'B' }], startSeconds: 1, duration: 4 }]).timeline;
  const n = t0.overlays.length;
  let t = apply(t0, [{ op: 'updateGroup', group: 'g', startSeconds: 3 }]).timeline;
  assert.equal(Math.min(...t.overlays.map((o) => o.startSeconds)), 3);
  assert.ok(t.overlays.every((o) => o.endSeconds === 7));
  t = apply(t, [{ op: 'updateGroup', group: 'g', endSeconds: 4 }]).timeline;
  assert.ok(t.overlays.every((o) => o.endSeconds === 4 && o.startSeconds < 4));
  const shrunk = apply(t, [{ op: 'updateGroup', group: 'g', endSeconds: 3.2 }]).timeline;
  assert.ok(shrunk.overlays.every((o) => o.endSeconds - o.startSeconds >= 1 / 30 - 1e-9), '晚出现的元素被压到至少一帧');
  assert.deepEqual(validateTimeline(shrunk), []);
  const un = apply(t, [{ op: 'updateGroup', group: 'g', ungroup: true }]).timeline;
  assert.ok(un.overlays.every((o) => o.group === undefined));
  const gone = apply(t, [{ op: 'removeGroup', group: 'g' }]);
  assert.equal(gone.timeline.overlays.length, 0);
  assert.equal(gone.changed.length, n);
  const undo = diffTimelines(gone.timeline, t0);
  const restored = applyOps(gone.timeline, undo, { actor: 'system' }).timeline;
  assert.ok(timelinesEqual(restored, t0), '实体级撤销还原整页');
});

test('presets: new channels are valid, progress presets combine with entrance presets', () => {
  for (const name of ['wipeInLeft', 'riseUp', 'popIn', 'blurIn', 'typewriter', 'drawIn', 'countUp', 'growIn', 'spin', 'blink', 'sinkDown', 'wipeOutRight']) assert.ok(ANIMATION_PRESETS[name], name);
  assert.deepEqual(applyPresetToEffects([{ preset: 'riseUp' }], 'countUp'), [{ preset: 'riseUp' }, { preset: 'countUp' }]);
  const r = apply(blank(), [
    { op: 'addOverlay', id: 'x', shape: 'rect', startSeconds: 0, endSeconds: 3, effects: ['wipeInLeft', 'drawIn'] },
    { op: 'setKeyframe', id: 'x', channel: 'clipR', t: 0, v: 3 },
    { op: 'setKeyframe', id: 'x', channel: 'progress', t: 1, v: 0.5 },
  ]);
  assert.deepEqual(r.receipts.map((x) => x.status), ['applied', 'applied', 'applied']);
  assert.equal(r.timeline.overlays[0].animations.clipR[0].v, 1, '裁剪通道钳在 0–1');
});

test('schema v7 reads v5 data and refuses newer data', () => {
  const v5 = parseTimeline({ meta: { fps: 30, width: 1280, height: 720 }, version: 5, videoTracks: [{ id: 'v', clips: [] }], audioTracks: [], overlays: [{ id: 'o', text: 'hi', startSeconds: 0, endSeconds: 1, kind: 'title' }] });
  assert.equal(v5.version, 7);
  assert.throws(() => parseTimeline({ ...v5, version: 8 }), TimelineVersionError);
});

test('renderer helpers: rich-text markup, number formatting and shape paths', async () => {
  const el = await loadTs('packages/engine/src/elements.tsx');
  assert.deepEqual(el.parseRich('a**b**c\n==d==[#f00]e[/]'), [
    [{ text: 'a' }, { text: 'b', bold: true }, { text: 'c' }],
    [{ text: 'd', accent: true }, { text: 'e', color: '#f00' }],
  ]);
  assert.deepEqual(el.parseRich('**x**', false), [[{ text: '**x**' }]], '字幕不解析标记');
  assert.equal(el.formatNumber(12345.678, 1, true), '12,345.7');
  assert.equal(el.displayText({ text: '', counter: { from: 0, to: 200, prefix: '¥', suffix: '+', separator: true } }, 0.5), '¥100+');
  for (const type of ['rect', 'ellipse', 'triangle', 'rightTriangle', 'diamond', 'pentagon', 'hexagon', 'octagon', 'star', 'parallelogram', 'trapezoid', 'chevron', 'blockArrow', 'plus', 'heart', 'callout', 'ring']) {
    const { d } = el.shapePath({ type, radius: 12 }, 200, 120, 4);
    assert.match(d, /^M[\d.,MLACHVZ\s-]+Z$/, type);
    assert.ok(!/NaN|Infinity/.test(d), type);
  }
});
