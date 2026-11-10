import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTimeline, validateTimeline } from '../packages/engine/dist/schema.js';
import { applyOps } from '../packages/engine/dist/ops.js';
import { diffTimelines, timelinesEqual } from '../packages/engine/dist/diff.js';
import { pathMotion } from '../packages/engine/dist/motionPath.js';
import { maskImage } from '../packages/engine/dist/masks.js';
import { evalKeyframes } from '../packages/engine/dist/timeline.js';
const blank = () => parseTimeline({ meta: { width: 640, height: 360, fps: 30 } });
const add = { op: 'addOverlay', id: 'a', group: 'g', shape: 'rect', startSeconds: 0, endSeconds: 4 };

test('shared group state persists, diffs independently, moves with group, and clears on ungroup', () => {
  const before = applyOps(blank(), [add]).timeline;
  const state = { pivotX: .3, pivotY: .7, rotate: 20, effects: [{ preset: 'tilt3d' }] };
  const r = applyOps(before, [{ op: 'updateGroup', group: 'g', state }]);
  assert.equal(r.receipts[0].status, 'applied');
  assert.deepEqual(r.timeline.groups.g, state);
  assert.deepEqual(validateTimeline(r.timeline), []);
  assert.deepEqual(parseTimeline(JSON.stringify(r.timeline)), r.timeline);
  assert.ok(timelinesEqual(applyOps(r.timeline, diffTimelines(r.timeline, before), { actor: 'system' }).timeline, before));
  assert.equal(applyOps(r.timeline, [{ op: 'updateGroup', group: 'g', startSeconds: 3 }]).timeline.overlays[0].startSeconds, 3);
  const clear = applyOps(r.timeline, [{ op: 'updateGroup', group: 'g', ungroup: true }]).timeline;
  assert.equal(clear.groups, undefined);
  assert.equal(clear.overlays[0].group, undefined);
  assert.equal(applyOps(r.timeline, [{ op: 'removeGroup', group: 'g' }]).timeline.groups, undefined);
});

test('path interpolation uses pixel arc length, tangent direction and closed-loop endpoints', () => {
  const d = { path: 'M 0 0 L 100 0 L 100 100', autoRotate: true };
  const half = pathMotion(d, .5, 200, 100);
  assert.ok(Math.abs(half.x - 150) < .3);
  assert.ok(Math.abs(half.y) < .1);
  const end = pathMotion(d, 1, 200, 100);
  assert.deepEqual(end, { x: 200, y: 100, angle: 90 });
  const closed = pathMotion({ path: 'M 0 0 L 20 0 L 20 20 Z' }, 1, 640, 360);
  assert.ok(Math.abs(closed.x) < 1e-6 && Math.abs(closed.y) < 1e-6);
  assert.deepEqual(pathMotion({ path: 'M 0 0' }, .5, 100, 100), { x: 0, y: 0, angle: 0 });
});

test('mask/path ops validate, clamp progress, and split without restarting implicit path motion', () => {
  const r = applyOps(blank(), [{ ...add, mask: { type: 'ellipse', feather: 12, invert: true }, motionPath: { path: 'M 0 0 L 40 0' } }]);
  assert.deepEqual(validateTimeline(r.timeline), []);
  const split = applyOps(r.timeline, [{ op: 'splitOverlay', id: 'a', atSeconds: 2, newId: 'b' }]).timeline;
  assert.equal(evalKeyframes(split.overlays[1].animations.pathProgress, 0), .5);
  assert.equal(evalKeyframes(split.overlays[0].animations.pathProgress, 2), .5);
  const bad = applyOps(r.timeline, [{ op: 'updateOverlay', id: 'a', patch: { motionPath: { path: '<script>' } } }]);
  assert.equal(bad.receipts[0].status, 'ignored');
  assert.ok(bad.receipts[0].warnings.length);
  assert.equal(bad.timeline.overlays[0].motionPath.path, 'M 0 0 L 40 0');
  const kf = applyOps(r.timeline, [{ op: 'setKeyframe', id: 'a', channel: 'pathProgress', t: 1, v: 4 }]);
  assert.equal(kf.timeline.overlays[0].animations.pathProgress[0].v, 1);
  assert.match(decodeURIComponent(maskImage({ type: 'rect', feather: 20 }, 200, 100)), /stdDeviation="10"/);
});
