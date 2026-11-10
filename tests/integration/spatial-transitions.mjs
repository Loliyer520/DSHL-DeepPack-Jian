// Real browser pixels for perspective planes and advanced transition endpoints.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { renderFrames, closeRenderer } from '../../packages/engine/dist/render.js';
import { ADVANCED_TRANSITIONS } from '../../packages/engine/dist/transitions.js';

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'djian-spatial-'));
const meta = { width: 320, height: 180, fps: 30, background: '#ffffff' };
const image = (color) => 'data:image/svg+xml;base64,' + Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="${color}"/></svg>`).toString('base64');
const card = { id: 'card', kind: 'shape', shape: { type: 'rect', fill: '#ff0000' }, x: 0.5, y: 0.5, w: 0.5, h: 0.5, text: '', startSeconds: 0, endSeconds: 2 };
const red = (rgb) => rgb[0] > 150 && rgb[1] < 70 && rgb[2] < 70;
const blue = (rgb) => rgb[2] > 150 && rgb[0] < 70 && rgb[1] < 70;
async function pixels(timeline, seconds = 0.5) {
  const result = await renderFrames({ timeline, seconds: [seconds], format: 'png', maxSize: 320, assetBase: 'http://127.0.0.1:1/' });
  const file = path.join(scratch, 'frame.png'); fs.writeFileSync(file, result.buffer);
  const data = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], { maxBuffer: 1024 * 1024 });
  return { data, at: (x, y) => [...data.subarray((y * 320 + x) * 3, (y * 320 + x) * 3 + 3)], count: (fn) => { let n = 0; for (let i = 0; i < data.length; i += 3) if (fn(data.subarray(i, i + 3))) n++; return n; } };
}
try {
  const base = (patch = {}) => ({ meta, overlays: [{ ...card, ...patch }] });
  const flat = (await pixels(base())).count(red);
  assert.ok(flat > 14000 && flat < 15000);
  const angled = (await pixels(base({ transform3d: { rotateY: 60, perspective: 900 } }))).count(red);
  assert.ok(angled > flat * 0.4 && angled < flat * 0.65, 'Y rotation foreshortens the card');
  const distant = (await pixels(base({ transform3d: { z: -800, perspective: 800 } }))).count(red);
  assert.ok(distant > flat * 0.22 && distant < flat * 0.28, 'depth scales both dimensions');
  assert.equal((await pixels(base({ transform3d: { rotateY: 180, backface: 'hidden' } }))).count(red), 0, 'hidden backface disappears');
  assert.ok((await pixels(base({ transform3d: { rotateY: 180, backface: 'visible' } }))).count(red) > flat * 0.98, 'visible backface remains');
  const animated = base({ animations: { rotationY: [{ t: 0, v: 0 }, { t: 1, v: 60 }] } });
  assert.ok((await pixels(animated, 0)).count(red) > (await pixels(animated, 1)).count(red) * 1.5, 'keyframes animate the projected plane');
  const clip = { id: 'clip', type: 'image', src: image('#ff0000'), inPoint: 0, clipDuration: 2, volume: 0, transform3d: { rotateY: 60, perspective: 900 } };
  const media = await pixels({ meta, videoTracks: [{ id: 'v', clips: [clip] }], overlays: [] });
  assert.ok(media.count(red) > 20000 && media.count(red) < 45000, 'main-track media supports perspective');
  for (const type of ADVANCED_TRANSITIONS) {
    const timeline = { meta, videoTracks: [{ id: 'v', clips: [
      { id: 'a', type: 'image', src: image('#ff0000'), inPoint: 0, clipDuration: 1, volume: 0 },
      { id: 'b', type: 'image', src: image('#0000ff'), inPoint: 0, clipDuration: 1, volume: 0, transition: { type, duration: 0.8 } },
    ] }], overlays: [] };
    assert.ok(red((await pixels(timeline, 0.2)).at(160, 90)), type + ': outgoing frame intact before transition');
    const middle = await pixels(timeline, 0.85);
    assert.ok(middle.count((c) => c[0] > 70 && c[1] < 90 || c[2] > 70 && c[1] < 90) > 320 * 180 * 0.2, type + ': intermediate frame contains transformed media');
    assert.ok(blue((await pixels(timeline, 1.6)).at(160, 90)), type + ': incoming frame intact after transition');
  }
  // Vertical cube directions must agree with push/whip: 'up' brings the next
  // face from below, while 'down' brings it from above.
  for (const direction of ['up', 'down']) {
    const timeline = { meta, videoTracks: [{ id: 'v', clips: [
      { id: 'a', type: 'image', src: image('#ff0000'), inPoint: 0, clipDuration: 1, volume: 0 },
      { id: 'b', type: 'image', src: image('#0000ff'), inPoint: 0, clipDuration: 1, volume: 0, transition: { type: 'cube', duration: 0.8, direction } },
    ] }], overlays: [] };
    const { data } = await pixels(timeline, 1);
    const center = (test) => { let count = 0, y = 0; for (let i = 0; i < data.length; i += 3) if (test(data.subarray(i, i + 3))) { count++; y += Math.floor(i / 3 / 320); } assert.ok(count > 100); return y / count; };
    const next = center(blue), prev = center(red);
    assert.ok(direction === 'up' ? next > prev : next < prev, 'cube ' + direction + ' rotates in the advertised direction');
  }
  console.log('PASS real pixels: perspective, depth, backfaces, 3D keyframes, media transforms and all 6 advanced transitions');
} finally { await closeRenderer(); fs.rmSync(scratch, { recursive: true, force: true }); }
