import {SCHEMA_VERSION} from '../packages/engine/dist/timeline.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { applyOps } from '../packages/engine/dist/ops.js';
import { parseTimeline, validateTimeline } from '../packages/engine/dist/schema.js';
import { diffTimelines } from '../packages/engine/dist/diff.js';
import { outline } from '../packages/host-bridge/lib/outline.js';
import { OPS_DOC, OPS_PARAMETERS } from '../packages/host-bridge/lib/ops-doc.js';
import { loadTs } from './helpers/ts-load.mjs';

const blank = () => parseTimeline({ meta: { width: 320, height: 240, fps: 30 }, overlays: [] });
const edit = (t, ops) => applyOps(t, ops, { newId: () => 'el' });
const add = (extra) => edit(blank(), [{ op: 'addOverlay', id: 'el', shape: 'rect', startSeconds: 0, endSeconds: 2, ...extra }]);

test('v7 single shadows remain unchanged after migration; v8 multilayer appearance survives save/load', () => {
  const shadow = { color: 'rgba(0,0,0,0.35)', blur: 24, y: 8 };
  const old = parseTimeline({ ...blank(), version: 7, overlays: [{ id: 'old', text: 'Old', startSeconds: 0, endSeconds: 1, shadow }] });
  assert.equal(old.version, SCHEMA_VERSION);
  assert.deepEqual(old.overlays[0].shadow, shadow);
  const created = add({ shadow: [shadow, { color: '#38bdf8', blur: 12, opacity: 0.3, spread: 4, y: 0 }], filter: { blur: 3, grayscale: 0.5 }, blendMode: 'screen' });
  assert.equal(created.receipts[0].status, 'applied');
  assert.deepEqual(validateTimeline(created.timeline), []);
  assert.deepEqual(parseTimeline(JSON.parse(JSON.stringify(created.timeline))), created.timeline);
});

test('appearance parameters are bounded, invalid layers reported, and null resets optional fields', () => {
  const made = add({ shadow: [{ color: 'not a color', blur: 2 }, ...Array.from({ length: 9 }, () => ({ color: '#000', blur: 999, x: -9999, y: 9999, opacity: 2, spread: -999 }))], filter: { blur: 99, brightness: -5 }, blendMode: 'multiply' });
  const ov = made.timeline.overlays[0];
  assert.equal(ov.shadow.length, 8);
  assert.deepEqual(ov.shadow[0], { color: '#000', blur: 200, x: -1000, y: 1000, opacity: 1, spread: -100 });
  assert.deepEqual(ov.filter, { blur: 20, brightness: 0 });
  assert.ok(made.receipts[0].warnings.some((s) => s.includes('阴影')));
  const off = edit(made.timeline, [{ op: 'updateOverlay', id: ov.id, patch: { shadow: false } }]).timeline;
  assert.equal(off.overlays[0].shadow, false);
  const cleared = edit(off, [{ op: 'updateOverlay', id: ov.id, patch: { shadow: null, filter: null, blendMode: 'normal' } }]).timeline.overlays[0];
  assert.equal(cleared.shadow, undefined);
  assert.equal(cleared.filter, undefined);
  assert.equal(cleared.blendMode, undefined);
});

test('shadow edits round-trip through undo and retain effects when splitting elements', () => {
  const original = add({ shadow: [{ color: '#000', blur: 8 }, { color: '#00f', blur: 24, opacity: 0.2 }], filter: { sepia: 0.4 }, blendMode: 'screen' }).timeline;
  const changed = edit(original, [{ op: 'updateOverlay', id: 'el', patch: { shadow: { color: '#f00', blur: 0 } } }]).timeline;
  const restored = applyOps(changed, diffTimelines(changed, original), { actor: 'system' }).timeline;
  assert.deepEqual(restored, original);
  const split = applyOps(original, [{ op: 'splitOverlay', id: 'el', atSeconds: 1 }], { newId: () => 'right' }).timeline;
  assert.equal(split.overlays.length, 2);
  for (const ov of split.overlays) {
    assert.deepEqual(ov.shadow, original.overlays[0].shadow);
    assert.deepEqual(ov.filter, original.overlays[0].filter);
    assert.equal(ov.blendMode, 'screen');
  }
});

test('static overlay filters work and animated channels override only their corresponding static values', async () => {
  const { elementMotion, textStyle } = await loadTs('packages/engine/src/elements.tsx');
  const ov = add({ filter: { blur: 3, brightness: 0.5, saturate: 0, grayscale: 0.4, sepia: 0.2, hueRotate: 30 } }).timeline.overlays[0];
  assert.equal(elementMotion(ov, undefined, 0, 320, 240).filter, 'brightness(0.5) saturate(0) blur(3px) grayscale(0.4) sepia(0.2) hue-rotate(30deg)');
  assert.equal(elementMotion(ov, { blur: [{ t: 0, v: 0 }], brightness: [{ t: 0, v: 1 }] }, 0, 320, 240).filter, 'saturate(0) grayscale(0.4) sepia(0.2) hue-rotate(30deg)');
  assert.equal(textStyle({ ...ov, text: 'Card', shadow: { color: '#000', blur: 12 } }).textShadow, 'none', 'no duplicate shadow on text inside a card');
  assert.match(textStyle({ ...ov, kind: 'subtitle', shadow: undefined }).textShadow, /rgba/, 'default subtitle readability preserved');
});

test('parallel native shadows use distinct SVG ids and preserve explicit zero/negative values', async () => {
  const { useElementAppearance } = await loadTs('packages/engine/src/appearance.tsx');
  const ov = add({ shadow: [{ color: '#f00', blur: 0, x: 10, y: 0, spread: -2, opacity: 0 }, { color: '#00f', blur: 8, y: 0 }] }).timeline.overlays[0];
  function Effect() {
    const a = useElementAppearance(ov, 80, 60);
    return React.createElement('div', { style: { filter: a.filter } }, a.defs);
  }
  const html = renderToStaticMarkup(React.createElement(React.Fragment, null, React.createElement(Effect), React.createElement(Effect)));
  const ids = [...html.matchAll(/<filter id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, 2);
  assert.equal((html.match(/in="SourceAlpha"/g) ?? []).length, 4, 'each shadow starts from original alpha');
  assert.match(html, /operator="erode" radius="2"/);
  assert.match(html, /flood-opacity="0"/);
  assert.match(html, /dy="0"/);
  assert.match(html, /in="shadow1".*in="shadow0".*in="SourceGraphic"/);
});

test('AI can discover and read back effects; gradient stops are ordered by position', () => {
  const made = add({ shadow: [{ color: '#000', blur: 24, opacity: 0.2 }], filter: { grayscale: 1 }, blendMode: 'multiply', shape: { type: 'rect', fill: { type: 'linear', stops: [{ offset: 1, color: '#fff' }, { offset: 0, color: '#000' }, { offset: 0.5, color: '#f00' }] } } });
  assert.deepEqual(made.timeline.overlays[0].shape.fill.stops.map((s) => s.offset), [0, 0.5, 1]);
  const summary = outline(made.timeline);
  assert.match(summary, /阴影.*#000.*20%/);
  assert.match(summary, /滤镜 grayscale=1/);
  assert.match(summary, /混合 multiply/);
  assert.match(OPS_DOC, /不要复制多层半透明形状/);
  assert.ok(OPS_PARAMETERS.properties.ops.items.properties.shadow);
});

test('engine API persists appearance edits and exposes them in full timeline reads', async () => {
  const { startEngine } = await import('./helpers/engine.mjs');
  const engine = await startEngine();
  try {
    const bound = await engine.api('POST', '/api/session-project', { sessionId: 'appearance' });
    const route = '/api/p/' + bound.body.project.id;
    const shadow = [{ color: '#000000', blur: 12, opacity: 0.2, spread: 4, y: 0 }, { color: '#38bdf8', blur: 30, opacity: 0.5 }];
    const response = await engine.api('POST', route + '/ops', { actor: 'ai', clientId: 'test', ops: [{ op: 'addOverlay', id: 'native', shape: 'ellipse', startSeconds: 0, endSeconds: 2, shadow, filter: { blur: 2 }, blendMode: 'screen' }] });
    assert.equal(response.status, 200);
    assert.equal(response.body.receipts[0].status, 'applied');
    const { body } = await engine.api('GET', route + '/timeline');
    assert.equal(body.timeline.overlays.length, 1, 'effect does not require additional timeline elements');
    assert.deepEqual(body.timeline.overlays[0].shadow, shadow);
    assert.equal(body.timeline.overlays[0].blendMode, 'screen');
    assert.deepEqual(body.timeline.overlays[0].filter, { blur: 2 });
    const stored = JSON.parse((await import('node:fs')).readFileSync(engine.dataDir + '/projects/' + bound.body.project.id + '/timeline.json', 'utf8'));
    assert.deepEqual(stored.overlays[0].shadow, shadow);
  } finally {
    await engine.stop();
  }
});
