import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const load = async (file) => {
  const source = readFileSync(new URL(`../packages/client-timeline/src/client/${file}.ts`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
};
const { dragPreview, mergeTimeRanges, timelineWindow, visibleTicks, edgeScrollSpeed } = await load('timelineGeometry');
const { PreviewCache, PreviewQueue } = await load('previewCache');
const { formatTimePosition, parseTimePosition } = await load('timePosition');

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
const flush = () => new Promise((resolve) => setImmediate(resolve));

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

test('preview decoding limits concurrency, drops offscreen jobs, and recovers after errors', async () => {
  const queue = new PreviewQueue(2), complete = [];
  let started = 0, running = 0, peak = 0;
  const loader = () => { started++; running++; peak = Math.max(peak, running); return new Promise((resolve) => complete.push(() => { running--; resolve('ok'); })); };
  const controllers = Array.from({ length: 5 }, () => new AbortController());
  const jobs = controllers.map((c) => queue.run(loader, c.signal, 'cancelled'));
  await flush(); assert.equal(started, 2);
  controllers[2].abort(); assert.equal(await jobs[2], 'cancelled');
  while (complete.length) { complete.shift()(); await flush(); }
  assert.equal(started, 4); assert.equal(peak, 2);
  assert.deepEqual(await Promise.all(jobs), ['ok', 'ok', 'cancelled', 'ok', 'ok']);
  assert.equal(await queue.run(() => Promise.reject(Error('decode')), new AbortController().signal, 'fallback'), 'fallback');
  assert.equal(await queue.run(async () => 'next', new AbortController().signal, ''), 'next');
});

test('preview cache shares media, cancels only the last subscriber, and evicts unused entries', async () => {
  const cache = new PreviewCache(new PreviewQueue(2), 1, null);
  let loads = 0, aborted = 0;
  const loader = (signal) => { loads++; return new Promise((resolve) => signal.addEventListener('abort', () => { aborted++; resolve(null); }, { once: true })); };
  const a = cache.acquire('shared', loader), b = cache.acquire('shared', loader);
  await flush(); assert.equal(loads, 1);
  a.release(); a.release(); assert.equal(aborted, 0);
  b.release(); assert.equal(aborted, 1); await b.promise;
  const c = cache.acquire('first', async () => 1); assert.equal(await c.promise, 1); c.release();
  const d = cache.acquire('second', async () => 2); assert.equal(await d.promise, 2); d.release();
  const again = cache.acquire('first', async () => 3); assert.equal(await again.promise, 3); again.release();
});

const { splitOffset } = await load('splitPosition');
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

const { overlappingRows } = await load('timelineGeometry');
test('overlapping clip display lanes preserve references, order and adjacent boundaries', () => {
  const items = [{ at: 3, duration: 1 }, { at: 0, duration: 3 }, { at: 1, duration: 1 }, { at: 1, duration: 4 }];
  const original = structuredClone(items);
  const rows = overlappingRows(items, item => item);
  assert.deepEqual(rows, [[items[1], items[0]], [items[2]], [items[3]]]);
  assert.deepEqual(items, original);
  assert.equal(rows[0][0], items[1]);
  assert.deepEqual(overlappingRows([], item => item), []);
});
