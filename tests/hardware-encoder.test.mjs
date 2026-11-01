import test from 'node:test';
import assert from 'node:assert/strict';
import { applyHardwareEncoder, chooseHardwareEncoder, hardwareQualityArgs, parseEncoderPreference } from '../packages/engine/dist/hardwareEncoder.js';

test('GPU preference is strict and auto falls back through real probe results', async () => {
  assert.equal(parseEncoderPreference(undefined), 'auto');
  assert.equal(parseEncoderPreference('NVENC'), 'nvenc');
  assert.throws(() => parseEncoderPreference('magic'), /只支持/);
  const tried = [];
  const selected = await chooseHardwareEncoder('auto', async (encoder) => {
    tried.push(encoder);
    return encoder === 'h264_amf';
  }, 'win32');
  assert.equal(selected, 'h264_amf');
  assert.deepEqual(tried, ['h264_nvenc', 'h264_qsv', 'h264_amf']);
  assert.equal(await chooseHardwareEncoder('auto', async () => false, 'win32'), 'libx264');
  assert.equal(await chooseHardwareEncoder('off', async () => { throw new Error('must not probe'); }, 'win32'), 'libx264');
  await assert.rejects(chooseHardwareEncoder('nvenc', async () => false, 'win32'), /实际试编码失败/);
});

test('hardware args replace only libx264, remove software quality flags and preserve stream copy', () => {
  const args = ['-i', 'frames/%d.png', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', 'out.mp4'];
  const out = applyHardwareEncoder(args, 'h264_nvenc', 20);
  assert.deepEqual(out, [
    '-i', 'frames/%d.png', '-c:v', 'h264_nvenc',
    '-preset', 'p5', '-tune', 'hq', '-rc', 'vbr', '-cq', '20', '-b:v', '0',
    '-pix_fmt', 'yuv420p', 'out.mp4',
  ]);
  assert.equal(out.includes('libx264'), false);
  assert.equal(out.includes('-crf'), false);
  const copied = ['-i', 'chunk.mp4', '-c:v', 'copy', '-an', 'out.mp4'];
  assert.deepEqual(applyHardwareEncoder(copied, 'h264_qsv', 20), copied);
});

test('quality mapping stays within valid H.264 quality range', () => {
  assert.deepEqual(hardwareQualityArgs('h264_qsv', 20), ['-preset', 'medium', '-global_quality', '20']);
  assert.deepEqual(hardwareQualityArgs('h264_amf', 99), ['-quality', 'quality', '-rc', 'cqp', '-qp_i', '51', '-qp_p', '51']);
  assert.deepEqual(hardwareQualityArgs('h264_videotoolbox', 16), ['-q:v', '16']);
});
