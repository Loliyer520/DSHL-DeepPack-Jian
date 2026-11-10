import {SCHEMA_VERSION} from '../packages/engine/dist/timeline.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { applyOps, sanitizeTransition } from '../packages/engine/dist/ops.js';
import { parseTimeline, validateTimeline } from '../packages/engine/dist/schema.js';
import { spatialState } from '../packages/engine/dist/spatial.js';
import { transitionPresentation, listTransitions, ADVANCED_TRANSITIONS } from '../packages/engine/dist/transitions.js';
import { ANIMATION_PRESETS, resolveAnimations } from '../packages/engine/dist/presets.js';
import { TRANSITION_TYPES } from '../packages/engine/dist/timeline.js';
import { loadTs } from './helpers/ts-load.mjs';
import { startEngine } from './helpers/engine.mjs';

const blank = () => parseTimeline({ meta: { width: 640, height: 360, fps: 30 }, overlays: [] });
const apply = (t, ops) => applyOps(t, ops, { newId: () => 'new' });

test('3D transforms persist on clips and elements, clamp unsafe input, and clear cleanly', () => {
  const spec = { rotateX: 15, rotateY: -30, z: -200, perspective: 900, backface: 'hidden' };
  const r = apply(blank(), [
    { op: 'addOverlay', id: 'card', shape: 'rect', startSeconds: 0, endSeconds: 2, transform3d: spec },
    { op: 'addClip', id: 'clip', src: 'x.png', transform3d: spec },
  ]);
  assert.ok(r.receipts.every((r) => r.status === 'applied'));
  assert.deepEqual(r.timeline.overlays[0].transform3d, spec);
  assert.deepEqual(r.timeline.videoTracks[0].clips[0].transform3d, spec);
  assert.deepEqual(validateTimeline(r.timeline), []);
  assert.deepEqual(parseTimeline(JSON.parse(JSON.stringify(r.timeline))), r.timeline);
  const dirty = apply(r.timeline, [{ op: 'updateOverlay', id: 'card', patch: { transform3d: { rotateX: 9000, z: 9000, perspective: 0, backface: 'invalid' } } }]);
  assert.deepEqual(dirty.timeline.overlays[0].transform3d, { rotateX: 3600, z: 1000, perspective: 200 });
  const clear = apply(r.timeline, [{ op: 'updateClip', id: 'clip', patch: { transform3d: null } }, { op: 'updateOverlay', id: 'card', patch: { transform3d: null } }]);
  assert.equal(clear.timeline.overlays[0].transform3d, undefined);
  assert.equal(clear.timeline.videoTracks[0].clips[0].transform3d, undefined);
});

test('3D keyframes override static values and never project across the camera plane', async () => {
  const anims = { rotationY: [{ t: 0, v: 0 }, { t: 1, v: 60 }], z: [{ t: 0, v: 999 }], perspective: [{ t: 0, v: 400 }] };
  const state = spatialState({ rotateX: 12, rotateY: -10, perspective: 1000 }, anims, 0.5);
  assert.equal(state.transform, 'perspective(400px) translateZ(360px) rotateX(12deg) rotateY(30deg)');
  assert.equal(spatialState(undefined, undefined, 0).transform, undefined);
  const { elementMotion, motionTransform } = await loadTs('packages/engine/src/elements.tsx');
  const m = elementMotion({ transform3d: { rotateY: 30 }, rotate: 5 }, undefined, 0, 640, 360);
  assert.match(motionTransform(m), /perspective\(1200px\).*rotateY\(30deg\).*rotate\(5deg\)/);
  const { animState } = await loadTs('packages/engine/src/TimelineVideo.tsx');
  assert.match(animState(undefined, 0, { rotateY: 30 }).transform, /rotateY\(30deg\)/);
});

test('3D presets create valid animations; splits retain continuous 3D channels', () => {
  for (const name of ['flipInX', 'flipInY', 'flipOutX', 'flipOutY', 'depthIn', 'depthOut', 'tilt3d', 'spin3d']) {
    assert.ok(ANIMATION_PRESETS[name]);
    const r = apply(blank(), [{ op: 'addOverlay', id: 'card', shape: 'rect', startSeconds: 0, endSeconds: 4, animationPreset: name }]);
    assert.equal(r.receipts[0].status, 'applied', name);
    assert.deepEqual(validateTimeline(r.timeline), []);
    const anims = resolveAnimations(r.timeline.overlays[0], 4);
    assert.ok(Object.keys(anims).some((k) => ['rotationX', 'rotationY', 'z'].includes(k)), name);
  }
  const t = apply(blank(), [{ op: 'addOverlay', id: 'card', shape: 'rect', startSeconds: 0, endSeconds: 4, animations: { rotationY: [{ t: 0, v: 0 }, { t: 4, v: 120 }] } }]).timeline;
  const split = apply(t, [{ op: 'splitOverlay', id: 'card', atSeconds: 2 }]).timeline;
  const right = split.overlays.find((o) => o.id !== 'card');
  assert.match(spatialState(undefined, right.animations, 0).transform, /rotateY\(60deg\)/);
});

test('all transitions are bounded, discoverable, directional and deterministic', () => {
  assert.deepEqual(listTransitions().map((t) => t.type), [...TRANSITION_TYPES]);
  for (const type of TRANSITION_TYPES) for (const direction of ['left', 'right', 'up', 'down']) {
    const spec = sanitizeTransition({ type, direction, duration: 99, intensity: 99, ease: 'inOut' });
    assert.equal(spec.duration, 3);
    assert.equal(spec.intensity, 2);
    for (const role of ['in', 'out']) for (const p of [-1, 0, 0.25, 0.5, 0.75, 1, 2]) {
      const a = transitionPresentation(role, spec, p, 640, 360);
      assert.deepEqual(a, transitionPresentation(role, spec, p, 640, 360));
      assert.doesNotMatch(JSON.stringify(a), /NaN|Infinity|undefined/);
      if (a.opacity !== undefined) assert.ok(a.opacity >= 0 && a.opacity <= 1);
    }
  }
  assert.match(transitionPresentation('in', { type: 'cube', duration: 1 }, 0.5).transform, /rotateY/);
  assert.match(transitionPresentation('in', { type: 'cube', duration: 1, direction: 'up' }, 0.5).transform, /rotateX\(-45deg\)/);
  assert.match(transitionPresentation('in', { type: 'cube', duration: 1, direction: 'down' }, 0.5).transform, /rotateX\(45deg\)/);
  assert.notDeepEqual(transitionPresentation('in', { type: 'zoomBlur', duration: 1, intensity: 1 }, 0.5), transitionPresentation('in', { type: 'zoomBlur', duration: 1, intensity: 2 }, 0.5));
  assert.deepEqual(transitionPresentation('in', { type: 'dissolve', duration: 1 }, 0.25), { opacity: 0.25 }, 'old default easing unchanged');
});

test('v8 appearance projects migrate to current schema without losing shadows', () => {
  const old = { ...blank(), version: 8, overlays: [{ id: 'a', kind: 'shape', shape: { type: 'rect' }, text: '', startSeconds: 0, endSeconds: 1, shadow: [{ color: '#000', blur: 20, opacity: 0.3 }] }] };
  const migrated = parseTimeline(old);
  assert.equal(migrated.version, SCHEMA_VERSION);
  assert.deepEqual(migrated.overlays[0].shadow, old.overlays[0].shadow);
});

test('engine catalogue exposes advanced transitions and 3D presets to AI clients', async () => {
  const engine = await startEngine();
  try {
    const { body } = await engine.api('GET', '/api/catalog');
    for (const type of ADVANCED_TRANSITIONS) assert.ok(body.transitions.some((x) => x.type === type));
    assert.ok(body.presets.some((p) => p.key === 'flipInY'));
  } finally { await engine.stop(); }
});
