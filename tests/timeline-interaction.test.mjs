import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './helpers/ts-load.mjs';

const { dragPreview, mergeTimeRanges, timelineWindow, visibleTicks, edgeScrollSpeed, overlappingRows, tickStep, fitPxPerSec, clampZoom } = await loadTs('packages/client-timeline/src/client/geometry.ts');
const { formatTimePosition, parseTimePosition } = await loadTs('packages/client-timeline/src/client/timePosition.ts');
const { splitOffset } = await loadTs('packages/engine/src/ops.ts');

test('time entry resolves exact frames across frame rates and rejects invalid/out-of-range positions', () => {
  for (const fps of [24, 25, 29.97, 30, 59.94, 60, 120]) {
    for (const frame of [0, 1, 23, 100, 108001, 250000]) {
      assert.deepEqual(parseTimePosition(formatTimePosition(frame, fps), 'time', fps, 250000), { frame });
    }
  }
  assert.deepEqual(parseTimePosition('1:02:03.5', 'time', 30, 200000), { frame: 111705 });
  assert.deepEqual(parseTimePosition('90:00', 'time', 30, 200000), { frame: 162000 });
  assert.deepEqual(parseTimePosition('1.5', 'time', 30, 299), { frame: 45 });
  assert.deepEqual(parseTimePosition('299', 'frame', 30, 299), { frame: 299 });
  for (const input of ['', '-1', '1e2', '0:60', '1:60:00', '1:02:03:04', 'NaN', '10']) assert.ok('error' in parseTimePosition(input, 'time', 30, 299), input);
  for (const input of ['1.5', '300', '-1', '1e2', 'Infinity']) assert.ok('error' in parseTimePosition(input, 'frame', 30, 299), input);
});

const preview = (patch) => dragPreview({ kind: 'move', start: 2, duration: 3, delta: 0, fps: 30, anchors: [], threshold: .125, ...patch });

test('either clip edge snaps, constrained edges never show a false guide', () => {
  assert.deepEqual(preview({ delta: 2.94, anchors: [8] }), { at: 5, duration: 3, snapAt: 8 });
  assert.deepEqual(preview({ delta: .94, anchors: [3] }), { at: 3, duration: 3, snapAt: 3 });
  assert.deepEqual(preview({ start: 0, delta: -.95, anchors: [2] }), { at: 0, duration: 3, snapAt: null });
  assert.equal(preview({ delta: .94, anchors: [3], threshold: 0 }).snapAt, null);
});

test('trim respects source speed, frame precision, and one-frame minimum', () => {
  const source = preview({ kind: 'trimL', inPoint: 2, speed: 2, delta: -5 });
  assert.equal(source.at, 1);
  assert.equal(source.duration, 4);
  const left = preview({ kind: 'trimL', delta: 10 });
  assert.ok(Math.abs(left.duration - 1 / 30) < 1e-8);
  assert.equal(left.at + left.duration, 5);
  const right = preview({ kind: 'trimR', delta: -10 });
  assert.ok(Math.abs(right.duration - 1 / 30) < 1e-8);
  assert.equal(preview({ kind: 'trimL', subtitle: true, delta: -2 }).at, 0);
});

test('viewport windows cover both edges with bounded ticks for a two-hour project', () => {
  for (const viewport of [240, 440, 1200]) for (const zoom of [.25, 1, 8]) {
    const pps = 56 * zoom;
    for (const x of [0, 399, 10000, 30000]) {
      const range = timelineWindow(Math.floor(x / Math.max(256, viewport)), viewport, pps);
      assert.ok(range.start <= Math.max(0, (x - viewport / 2) / pps));
      assert.ok(range.end >= (x + viewport / 2) / pps);
      assert.ok(visibleTicks(range.start, range.end, 7200, 64 / pps).length < 85);
    }
  }
  assert.equal(edgeScrollSpeed(200, 0, 440), 0);
  assert.equal(edgeScrollSpeed(440, 0, 440), 360);
  assert.equal(edgeScrollSpeed(0, 0, 440), -360);
});

test('summary merges overlapping tracks without mutating source or filling gaps', () => {
  const ranges = [{ at: 4, duration: 2 }, { at: 0, duration: 3 }, { at: 2, duration: 2 }, { at: 9, duration: 1 }];
  const original = structuredClone(ranges);
  assert.deepEqual(mergeTimeRanges(ranges), [{ at: 0, duration: 6 }, { at: 9, duration: 1 }]);
  assert.deepEqual(ranges, original);
});

test('splits retain one frame at either edge and use the same frame grid at every rate', () => {
  for (const fps of [24, 25, 29.97, 30, 59.94, 60, 120]) {
    const start = 101 / fps, duration = 10 / fps;
    for (const frame of [102, 110]) {
      const offset = splitOffset(start, duration, frame / fps, fps);
      assert.notEqual(offset, null);
      assert.ok(Math.abs((start + offset) * fps - frame) < 1e-8);
      assert.ok(offset >= 1 / fps - 1e-8);
      assert.ok(duration - offset >= 1 / fps - 1e-8);
    }
    for (const frame of [100, 101, 111, 112]) assert.equal(splitOffset(start, duration, frame / fps, fps), null);
    assert.equal(splitOffset(0, 1 / fps, 1 / fps, fps), null);
    assert.ok(Math.abs(splitOffset(0, 1, 1.1 / fps, fps) - 1 / fps) < 1e-8);
    assert.equal(splitOffset(.5 / fps, 10 / fps, 1 / fps, fps), null);
  }
  assert.equal(splitOffset(0, 1, NaN, 30), null);
  assert.equal(splitOffset(0, 1, .5, 0), null);
});

test('overlapping clip display lanes preserve references, order and adjacent boundaries', () => {
  const items = [{ at: 3, duration: 1 }, { at: 0, duration: 3 }, { at: 1, duration: 1 }, { at: 1, duration: 4 }];
  const original = structuredClone(items);
  const rows = overlappingRows(items, item => item);
  assert.deepEqual(rows, [[items[1], items[0]], [items[2]], [items[3]]]);
  assert.deepEqual(items, original);
  assert.equal(rows[0][0], items[1]);
  assert.deepEqual(overlappingRows([], item => item), []);
});

test('ruler ticks stay readable at every zoom, fit never clamps long projects to unreadable widths', () => {
  for (const pps of [0.5, 2, 10, 60, 300, 600]) {
    const step = tickStep(pps, 30);
    assert.ok(step * pps >= 72 || step === 7200, 'pps ' + pps);
  }
  assert.equal(tickStep(600, 30), 1 / 30 * 5);
  assert.ok(Math.abs(fitPxPerSec(1000, 100) - 9.2) < 1e-9);
  assert.equal(fitPxPerSec(1000, 7200 * 4), 0.5);
  assert.equal(clampZoom(10000), 600);
  assert.equal(clampZoom(0), 0.5);
});
