// Real-pixel regression for native element shadows and filters. Requires Chrome
// (Remotion can download its headless shell) and FFmpeg; no model/API calls.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { renderFrames, closeRenderer } from '../../packages/engine/dist/render.js';

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'djian-appearance-'));
const base = { id: 'card', kind: 'shape', shape: { type: 'rect', fill: '#fff' }, x: 0.5, y: 0.5, w: 0.25, h: 0.25, text: '', startSeconds: 0, endSeconds: 1 };
async function frame(overrides = {}, background = '#ffffff', extra = []) {
  const timeline = { meta: { width: 320, height: 240, fps: 30, background }, overlays: [{ ...base, ...overrides }, ...extra] };
  const result = await renderFrames({ timeline, seconds: [0.5], format: 'png', maxSize: 320, assetBase: 'http://127.0.0.1:1/' });
  const file = path.join(scratch, 'frame.png');
  fs.writeFileSync(file, result.buffer);
  const rgb = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], { maxBuffer: 1024 * 1024 });
  return (x, y) => [...rgb.subarray((y * 320 + x) * 3, (y * 320 + x) * 3 + 3)];
}
const near = (actual, expected, why, tolerance = 3) => assert.ok(actual.every((v, i) => Math.abs(v - expected[i]) <= tolerance), `${why}: got ${actual}, expected ${expected}`);
try {
  let pixel = await frame({ shadow: { color: '#000000', blur: 0, x: 80, y: 0, opacity: 0.5 } });
  near(pixel(250, 120), [128, 128, 128], 'native shadow has independent opacity');
  near(pixel(160, 120), [255, 255, 255], 'source is above its shadow');
  pixel = await frame({ shadow: [{ color: '#ff0000', blur: 0, x: 40, y: 0, opacity: 0.5 }, { color: '#0000ff', blur: 0, x: 80, y: 0, opacity: 0.5 }] });
  near(pixel(260, 120), [128, 128, 255], 'far shadow is not cast from nearer shadow');
  near(pixel(220, 120), [191, 64, 128], 'first shadow layer is on top');
  pixel = await frame({ h: 1 / 3, shape: { type: 'ellipse', fill: '#fff' }, shadow: { color: '#000000', blur: 0, x: 90, y: 0 } });
  near(pixel(212, 82), [255, 255, 255], 'shadow follows ellipse alpha, not bounding rectangle');
  near(pixel(250, 120), [0, 0, 0], 'ellipse center casts shadow');
  pixel = await frame({ h: 1 / 3, shape: { type: 'ellipse', fill: '#fff' }, shadow: { color: '#000000', blur: 0, x: 90, y: 0, spread: 12 } });
  near(pixel(300, 120), [0, 0, 0], 'positive spread expands alpha contour');
  pixel = await frame({ shadow: { color: '#000000', blur: 0, x: 80, y: 0, opacity: 0 } });
  near(pixel(250, 120), [255, 255, 255], 'zero opacity disables shadow');
  pixel = await frame({ shape: { type: 'rect', fill: '#ff0000' }, filter: { grayscale: 1 } });
  const gray = pixel(160, 120);
  assert.ok(Math.max(...gray) - Math.min(...gray) <= 1 && gray[0] > 20 && gray[0] < 100, 'static grayscale renders');
  pixel = await frame({ shape: { type: 'rect', fill: '#c080ff' }, blendMode: 'multiply' }, '#80c080');
  near(pixel(160, 120), [96, 96, 128], 'element blends with canvas');
  pixel = await frame({ shape: { type: 'rect', fill: '#c080ff' }, blendMode: 'multiply' }, '#80c080', [{ id: 'camera', kind: 'camera', text: '', x: 0.5, y: 0.5, w: 1, startSeconds: 0, endSeconds: 1 }]);
  near(pixel(160, 120), [96, 96, 128], 'blend reaches backdrop through camera transform');
  pixel = await frame({ shadow: { color: 'rgba(0,0,0,0.5)', blur: 0, x: 80, y: 0, opacity: 0.5 } });
  near(pixel(250, 120), [191, 191, 191], 'color alpha multiplies layer opacity');
  pixel = await frame({ shadow: { color: '#000000', blur: 8, x: 80, y: 0 } });
  const fringe = pixel(290, 120)[0];
  assert.ok(fringe > 180 && fringe < 254, 'soft shadow blur extends beyond original contour');
  pixel = await frame({ h: 1 / 3, shape: { type: 'ellipse', fill: '#fff' }, shadow: { color: '#000000', blur: 0, x: 90, y: 0, spread: -12 } });
  near(pixel(286, 120), [255, 255, 255], 'negative spread contracts alpha contour');
  pixel = await frame({ kind: 'text', shape: undefined, w: undefined, h: undefined, text: 'I', fontSize: 24, background: { color: '#ffffff', opacity: 1, padding: 12 }, shadow: { color: '#000000', blur: 0, x: 80, y: 0, opacity: 0.5 } });
  near(pixel(240, 120), [128, 128, 128], 'short auto-width text retains distant shadow');
  pixel = await frame({ kind: 'text', shape: undefined, w: 0.1, h: undefined, text: 'I\nI\nI', fontSize: 24, background: { color: '#ffffff', opacity: 1, padding: 4 }, shadow: { color: '#000000', blur: 0, x: 80, y: 0, opacity: 0.5 } });
  near(pixel(240, 155), [128, 128, 128], 'multiline auto-height text retains full shadow');
  console.log('PASS real pixels: shadow opacity/layer order/alpha contour/spread, grayscale and blend mode');
} finally {
  await closeRenderer();
  fs.rmSync(scratch, { recursive: true, force: true });
}
