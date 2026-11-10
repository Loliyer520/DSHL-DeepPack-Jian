import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { renderFrames, closeRenderer } from '../../packages/engine/dist/render.js';
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'djian-motion-'));
const base = { id: 'a', kind: 'shape', shape: { type: 'rect', fill: '#fff' }, text: '', x: .5, y: .5, w: .5, h: .5, startSeconds: 0, endSeconds: 2 };
async function frame(overlays, groups, second = 1) {
  const timeline = { meta: { width: 320, height: 240, fps: 30, background: '#000' }, overlays, groups };
  const r = await renderFrames({ timeline, seconds: [second], format: 'png', maxSize: 320, assetBase: 'http://127.0.0.1:1/' });
  const file = path.join(scratch, 'frame.png'); fs.writeFileSync(file, r.buffer);
  const rgb = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1']);
  return (x, y) => rgb[(y * 320 + x) * 3];
}
try {
  let px = await frame([{ ...base, mask: { type: 'ellipse', w: .6, h: .6, feather: 20 } }]);
  assert.ok(px(160, 120) > 250, 'mask keeps center crisp');
  assert.ok(px(200, 120) > 50 && px(200, 120) < 200, 'feather has partial alpha');
  assert.ok(px(235, 120) < 10, 'mask hides outside');
  px = await frame([{ ...base, mask: { type: 'ellipse', w: .6, h: .6, invert: true } }]);
  assert.equal(px(160, 120), 0, 'inverse mask removes center');
  assert.ok(px(235, 120) > 250, 'inverse mask keeps outside');
  px = await frame([{ ...base, group: 'g', x: .25, w: .1, h: .1 }, { ...base, id: 'b', group: 'g', x: .75, w: .1, h: .1 }], { g: { rotate: 90 } });
  assert.ok(px(160, 40) > 250 && px(160, 200) > 250, 'members rotate around shared canvas center');
  assert.equal(px(80, 120), 0, 'member does not remain at its individual center');
  px = await frame([{ ...base, x: .2, w: .1, h: .1, motionPath: { path: 'M 0 0 L 60 0' } }]);
  assert.ok(px(160, 120) > 250, 'path reaches midpoint at half duration');
  assert.equal(px(64, 120), 0, 'path translates original anchor');
  console.log('PASS: native mask feather/inversion, shared group pivot, and path motion pixels');
} finally { await closeRenderer(); fs.rmSync(scratch, { recursive: true, force: true }); }
