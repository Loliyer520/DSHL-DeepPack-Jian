import test from 'node:test';
import assert from 'node:assert/strict';
import { activeTextLayers, bottomRegionStats } from '../packages/webui/server/frame-analysis.mjs';

test('colored subtitle-region pixels are counted without claiming text detection', () => {
  for (const rgb of [[143, 216, 255], [255, 216, 107], [40, 220, 80]]) {
    const raw = Buffer.from(Array.from({ length: 9 }, () => rgb).flat());
    assert.equal(bottomRegionStats(raw, 3, 3).bottomThirdColoredPercent, 100);
  }
  assert.equal(bottomRegionStats(Buffer.alloc(27), 3, 3).bottomThirdColoredPercent, 0);
  assert.equal(bottomRegionStats(Buffer.alloc(27, 255), 3, 3).bottomThirdColoredPercent, 0);
});

test('frame text layers follow renderer frame rounding and end-exclusive ranges', () => {
  const timeline = { meta: { fps: 30 }, overlays: [
    { text: '蓝色', color: '#8FD8FF', position: 'bottom', startSeconds: 1, endSeconds: 2 },
    { text: '绿色', color: '#28DC50', position: 'center', startSeconds: 2, endSeconds: 3 },
  ] };
  assert.deepEqual(activeTextLayers(timeline, 29), []);
  assert.equal(activeTextLayers(timeline, 30)[0].text, '蓝色');
  assert.equal(activeTextLayers(timeline, 59)[0].color, '#8FD8FF');
  assert.deepEqual(activeTextLayers(timeline, 60).map(l => l.text), ['绿色']);
  assert.deepEqual(activeTextLayers(timeline, 90), []);
});
