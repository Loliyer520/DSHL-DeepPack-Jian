import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parseTimeline, shiftAnimations, evalKeyframes } from '../packages/engine/dist/schema.js';

const serverSource = fs.readFileSync(new URL('../packages/webui/server/index.mjs', import.meta.url), 'utf8');
function apply(timeline, ops) {
  let saved;
  const context = vm.createContext({
    lastTimeline: structuredClone(timeline), structuredClone,
    persistTimeline: (value) => { saved = value; },
  });
  vm.runInContext(serverSource.slice(serverSource.indexOf('const OPS_NEEDING_ID'), serverSource.indexOf('// ---- 项目制持久化')), context);
  vm.runInContext(serverSource.slice(serverSource.indexOf('const newClipId'), serverSource.indexOf('const server =')), context);
  context.inputOps = ops;
  vm.runInContext('applyOpsToTimeline(inputOps)', context);
  return parseTimeline(saved);
}

const animations = { opacity: [{ t: 0, v: 0, e: 'in' }, { t: 4, v: 1 }] };
const fixture = () => parseTimeline({
  meta: { fps: 30, width: 1280, height: 720 },
  videoTracks: [{ id: 'v1', clips: [{ id: 'video', type: 'video', src: 'a.mp4', inPoint: 3, clipDuration: 4, speed: 2, animations }] }],
  audioTracks: [{ id: 'a1', clips: [{ id: 'audio', src: 'a.wav', inPoint: 2, duration: 4, atSeconds: 1, speed: 0.5, animations }] }],
});

test('splitting 2x video preserves source continuity and total duration', () => {
  const result = apply(fixture(), [{ op: 'splitClip', id: 'video', atSeconds: 1 }]);
  const [left, right] = result.videoTracks[0].clips;
  assert.equal(right.inPoint, 5);
  assert.equal(left.clipDuration + right.clipDuration, 4);
  assert.equal(right.inPoint, left.inPoint + left.clipDuration * left.speed);
});

test('splitting slow audio accounts for its track start', () => {
  const result = apply(fixture(), [{ op: 'splitClip', id: 'audio', atSeconds: 2 }]);
  const [left, right] = result.audioTracks[0].clips;
  assert.equal(right.inPoint, 2.5);
  assert.equal(right.atSeconds, 2);
  assert.equal(left.duration + right.duration, 4);
});

test('split keyframes retain the exact original easing and survive schema parsing', () => {
  const shifted = shiftAnimations(animations, 1.5);
  for (const seconds of [0, 0.2, 1, 2.5]) {
    assert.equal(evalKeyframes(shifted.opacity, seconds), evalKeyframes(animations.opacity, seconds + 1.5));
  }
  const result = apply(fixture(), [{ op: 'splitClip', id: 'video', atSeconds: 1.5 }]);
  assert.equal(result.videoTracks[0].clips[1].animations.opacity[0].t, -1.5);
  assert.equal(evalKeyframes(result.videoTracks[0].clips[1].animations.opacity, 0), evalKeyframes(animations.opacity, 1.5));
});
