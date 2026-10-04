import test from 'node:test';
import assert from 'node:assert/strict';
import { applyOps, normalizeOp, splitOffset } from '../packages/engine/dist/ops.js';
import { parseTimeline, validateTimeline, TimelineVersionError } from '../packages/engine/dist/schema.js';
import { diffTimelines, timelinesEqual } from '../packages/engine/dist/diff.js';
import { describeBatch } from '../packages/engine/dist/describe.js';

let seq = 0;
const ctx = (extra = {}) => ({ newId: (p) => `${p}${++seq}`, ...extra });
const base = () => parseTimeline({
  meta: { fps: 30, width: 1280, height: 720 },
  videoTracks: [{ id: 'v1', name: '主轨道', clips: [
    { id: 'a', type: 'video', src: 'a.mp4', inPoint: 0, clipDuration: 2, transition: 'none' },
    { id: 'b', type: 'video', src: 'b.mp4', inPoint: 1, clipDuration: 3, transition: 'none' },
  ] }],
  audioTracks: [{ id: 'a1', name: '配乐', volume: 1, muted: false, clips: [{ id: 'm', src: 'm.mp3', inPoint: 0, duration: 5, atSeconds: 0 }] }],
  overlays: [{ text: '你好', startSeconds: 0, endSeconds: 1 }, { text: '世界', startSeconds: 1, endSeconds: 2 }],
});

test('legacy overlays get deterministic ids and version 5', () => {
  const a = base(), b = base();
  assert.equal(a.version, 5);
  assert.equal(a.overlays[0].id, b.overlays[0].id);
  assert.notEqual(a.overlays[0].id, a.overlays[1].id);
  assert.deepEqual(validateTimeline(a), []);
});

test('newer schema versions are refused, never rewritten', () => {
  assert.throws(() => parseTimeline({ version: 99, meta: { fps: 30, width: 2, height: 2 } }), TimelineVersionError);
});

test('durations below one frame are lifted to one frame', () => {
  const t = parseTimeline({ meta: { fps: 25, width: 640, height: 360 }, clips: [{ id: 'x', type: 'video', src: 'x.mp4', inPoint: 0, clipDuration: 0.001, transition: 'none' }] });
  assert.equal(t.videoTracks[0].clips[0].clipDuration, 1 / 25);
});

test('tolerant op shapes normalize', () => {
  assert.equal(normalizeOp({ type: 'removeClip', id: 'a' }).op.op, 'removeClip');
  assert.equal(normalizeOp({ updateClip: { id: 'a', patch: {} } }).op.op, 'updateClip');
  assert.equal(normalizeOp({ removeOverlay: 1 }).op.index, 1);
  assert.match(normalizeOp({ op: 'explode' }).error, /未知操作/);
});

test('addClip honours client ids, inserts at index and rejects missing assets', () => {
  const r = applyOps(base(), [
    { op: 'addClip', id: 'mine', src: 'c.mp4', clipDuration: 1, index: 1 },
    { op: 'addClip', src: 'ghost.mp4' },
  ], ctx({ assetExists: (s) => s !== 'ghost.mp4' }));
  assert.deepEqual(r.timeline.videoTracks[0].clips.map((c) => c.id), ['a', 'mine', 'b']);
  assert.equal(r.receipts[0].status, 'applied');
  assert.equal(r.receipts[0].id, 'mine');
  assert.equal(r.receipts[1].status, 'rejected');
  assert.match(r.receipts[1].reason, /素材库里没有/);
});

test('pip add reuses the first overlay track instead of creating one per clip', () => {
  const r = applyOps(base(), [
    { op: 'addClip', src: 'p.png', track: 'pip', atSeconds: 1, clipDuration: 2 },
    { op: 'addClip', src: 'q.png', track: 'pip', atSeconds: 3, clipDuration: 2 },
  ], ctx());
  assert.equal(r.timeline.videoTracks.length, 2);
  assert.equal(r.timeline.videoTracks[1].clips.length, 2);
  assert.equal(r.timeline.videoTracks[1].clips[0].type, 'image');
});

test('updateClip whitelists and clamps; unknown keys are reported, never stored', () => {
  const r = applyOps(base(), [{ op: 'updateClip', id: 'a', patch: { clipDuration: -5, volume: 7, evil: 1, id: 'dup', speed: 99 } }], ctx());
  const c = r.timeline.videoTracks[0].clips[0];
  assert.equal(c.id, 'a');
  assert.equal(c.clipDuration, 1 / 30);
  assert.equal(c.volume, 1);
  assert.equal(c.speed, 10);
  assert.equal(c.evil, undefined);
  assert.equal(r.receipts[0].status, 'partial');
  assert.deepEqual(validateTimeline(r.timeline), []);
});

test('overlays are addressed by id; legacy index addressing can be guarded by expectText', () => {
  const t = base();
  const [first, second] = t.overlays.map((o) => o.id);
  const r = applyOps(t, [
    { op: 'removeOverlay', id: first },
    { op: 'updateOverlay', id: second, patch: { text: '改了' } },
    { op: 'updateOverlay', index: 0, expectText: '不对', patch: { text: 'x' } },
  ], ctx());
  assert.deepEqual(r.timeline.overlays.map((o) => o.text), ['改了']);
  assert.equal(r.receipts[2].status, 'ignored');
});

test('locked tracks reject user and AI edits but not system restores', () => {
  const locked = applyOps(base(), [{ op: 'updateTrack', id: 'v1', patch: { locked: true } }], ctx()).timeline;
  const r = applyOps(locked, [{ op: 'removeClip', id: 'a' }], ctx({ actor: 'ai' }));
  assert.equal(r.receipts[0].status, 'rejected');
  assert.match(r.receipts[0].reason, /锁定/);
  const sys = applyOps(locked, [{ op: 'removeClip', id: 'a' }], ctx({ actor: 'system' }));
  assert.equal(sys.timeline.videoTracks[0].clips.length, 1);
});

test('system ops are refused for user and AI actors', () => {
  const r = applyOps(base(), [{ op: 'replaceTimeline', timeline: {} }], ctx({ actor: 'ai' }));
  assert.equal(r.receipts[0].status, 'rejected');
});

test('split keeps one frame each side, shifts keyframes and bakes preset effects', () => {
  const t = applyOps(base(), [{ op: 'updateClip', id: 'b', patch: { animationPreset: 'fadeIn' } }], ctx()).timeline;
  assert.deepEqual(t.videoTracks[0].clips[1].effects, [{ preset: 'fadeIn' }]);
  const r = applyOps(t, [{ op: 'splitClip', id: 'b', atSeconds: 3, newId: 'b2' }], ctx());
  const [, left, right] = r.timeline.videoTracks[0].clips;
  assert.equal(left.clipDuration, 1);
  assert.equal(right.id, 'b2');
  assert.equal(right.inPoint, 2);
  assert.equal(left.effects, undefined);
  assert.ok(left.animations.opacity.length >= 2);
  assert.equal(right.animations.opacity[0].t, left.animations.opacity[0].t - 1);
  assert.equal(splitOffset(0, 1, 0.01, 30), null);
  assert.equal(splitOffset(0, 1, 0.99, 30), null);
});

test('presets stay references: same group replaces, "none" clears', () => {
  let t = applyOps(base(), [{ op: 'updateClip', id: 'a', patch: { animationPreset: 'fadeIn' } }], ctx()).timeline;
  t = applyOps(t, [{ op: 'updateClip', id: 'a', patch: { animationPreset: 'zoomIn' } }], ctx()).timeline;
  t = applyOps(t, [{ op: 'updateClip', id: 'a', patch: { animationPreset: 'fadeOut' } }], ctx()).timeline;
  assert.deepEqual(t.videoTracks[0].clips[0].effects.map((e) => e.preset), ['zoomIn', 'fadeOut']);
  t = applyOps(t, [{ op: 'updateClip', id: 'a', patch: { animationPreset: 'none' } }], ctx()).timeline;
  assert.equal(t.videoTracks[0].clips[0].effects, undefined);
});

test('keyframe ops insert, replace within half a frame, and remove', () => {
  let t = applyOps(base(), [
    { op: 'setKeyframe', id: 'a', channel: 'opacity', t: 0, v: 0 },
    { op: 'setKeyframe', id: 'a', channel: 'opacity', t: 1, v: 1, e: [0.4, 0, 0.2, 1] },
    { op: 'setKeyframe', id: 'a', channel: 'opacity', t: 1.01, v: 0.5 },
  ], ctx()).timeline;
  assert.deepEqual(t.videoTracks[0].clips[0].animations.opacity.map((k) => k.v), [0, 0.5]);
  t = applyOps(t, [{ op: 'removeKeyframe', id: 'a', channel: 'opacity', t: 0 }], ctx()).timeline;
  assert.equal(t.videoTracks[0].clips[0].animations.opacity.length, 1);
  const audio = applyOps(t, [{ op: 'setKeyframe', id: 'm', channel: 'x', t: 0, v: 1 }], ctx());
  assert.equal(audio.receipts[0].status, 'rejected');
});

test('reorderClips keeps clips the caller did not know about', () => {
  const t = applyOps(base(), [{ op: 'addClip', id: 'late', src: 'z.mp4' }], ctx()).timeline;
  const r = applyOps(t, [{ op: 'reorderClips', order: ['b', 'a'] }], ctx());
  assert.deepEqual(r.timeline.videoTracks[0].clips.map((c) => c.id), ['b', 'a', 'late']);
});

test('a failing op inside a batch is rolled back alone', () => {
  const r = applyOps(base(), [
    { op: 'updateClip', id: 'a', patch: { volume: 0.5 } },
    { op: 'removeTrack', id: 'v1' },
    { op: 'updateClip', id: 'b', patch: { volume: 0.2 } },
  ], ctx());
  assert.deepEqual(r.receipts.map((x) => x.status), ['applied', 'rejected', 'applied']);
  assert.equal(r.timeline.videoTracks[0].clips.length, 2);
});

// ---- 差异回放：随机操作序列 ----
const rand = (seed) => () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
function randomOps(t, r, n) {
  const ops = [];
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  for (let i = 0; i < n; i++) {
    const clips = [...t.videoTracks, ...t.audioTracks].flatMap((tr) => tr.clips.map((c) => c.id));
    const ovs = t.overlays.map((o) => o.id);
    const k = Math.floor(r() * 10);
    const op = k === 0 ? { op: 'addClip', src: 'r.mp4', clipDuration: 1 + r() * 3, index: Math.floor(r() * 4) }
      : k === 1 ? { op: 'addClip', src: 'p.png', track: r() > 0.5 ? 'pip' : 'new', atSeconds: r() * 5, clipDuration: 1 }
      : k === 2 && clips.length ? { op: 'removeClip', id: pick(clips) }
      : k === 3 && clips.length ? { op: 'updateClip', id: pick(clips), patch: { volume: r(), speed: 0.5 + r() * 2, filter: { brightness: 1 + r() } } }
      : k === 4 && clips.length ? { op: 'splitClip', id: pick(clips), atSeconds: r() * 8 }
      : k === 5 ? { op: 'addOverlay', text: 't' + i, startSeconds: r() * 5, endSeconds: 6 }
      : k === 6 && ovs.length ? { op: 'updateOverlay', id: pick(ovs), patch: { text: 'u' + i, x: r() } }
      : k === 7 && ovs.length ? { op: 'removeOverlay', id: pick(ovs) }
      : k === 8 ? { op: 'addMarker', t: r() * 5, label: 'm' + i }
      : { op: 'moveClip', id: clips[0] ?? 'none', index: 0 };
    ops.push(op);
    t = applyOps(t, [op], ctx()).timeline;
  }
  return ops;
}

test('diff replay reproduces the target exactly (randomized)', () => {
  const r = rand(7);
  for (let round = 0; round < 60; round++) {
    const a = applyOps(base(), randomOps(base(), r, 4), ctx()).timeline;
    const b = applyOps(a, randomOps(a, r, 6), ctx()).timeline;
    const ops = diffTimelines(a, b);
    const replay = applyOps(a, ops, ctx({ actor: 'system' }));
    assert.ok(replay.receipts.every((x) => x.status !== 'rejected'), JSON.stringify(replay.receipts.filter((x) => x.status === 'rejected')));
    assert.ok(timelinesEqual(replay.timeline, b), `round ${round}: replay mismatch`);
    const back = applyOps(b, diffTimelines(b, a), ctx({ actor: 'system' })).timeline;
    assert.ok(timelinesEqual(back, a), `round ${round}: inverse mismatch`);
  }
});

test('describeBatch produces readable lines with names and before→after values', () => {
  const t = base();
  const ops = [
    { op: 'updateClip', id: 'b', patch: { clipDuration: 2.4, speed: 2 } },
    { op: 'addOverlay', text: '开场', startSeconds: 1.2, endSeconds: 3 },
    { op: 'splitClip', id: 'a', atSeconds: 1 },
  ];
  const r = applyOps(t, ops, ctx());
  const lines = describeBatch(t, r.timeline, ops, r.receipts);
  assert.match(lines[0], /b\.mp4.*时长 3s→2\.4s.*速度 1×→2×/);
  assert.match(lines[1], /添加字幕「开场」（1\.2s–3s）/);
  assert.match(lines[2], /在 1s 处分割主轨片段「a\.mp4」/);
});

test('describeBatch names clips added together with a new track (receipt carries ids)', () => {
  const t = base();
  const ops = [
    { op: 'addClip', src: 'b.mp4', track: 'new', atSeconds: 1.5, clipDuration: 3.5 },
    { op: 'addAudio', src: 'm.mp3', track: 'new', atSeconds: 0, duration: 4 },
  ];
  const r = applyOps(t, ops, ctx());
  assert.ok(r.receipts[0].ids?.length === 2, 'new track + clip');
  const lines = describeBatch(t, r.timeline, ops, r.receipts);
  assert.match(lines[0], /添加「b\.mp4」（1\.5s–5s）/);
  assert.match(lines[1], /添加音频「m\.mp3」（0s 起，时长 4s）/);
});
