// Real rendering regression: requires Chrome/Edge and ffmpeg/ffprobe on PATH.
// Separate from the fast unit suite so npm test does not launch a browser.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { renderVideo } from '../../packages/engine/dist/render.js';

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'djian-render-test-'));
const output = path.join(scratch, 'result.mp4');
const run = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', ...args], { windowsHide: true, maxBuffer: 16_000_000 });
try {
  run(['-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=30:duration=4', '-an', '-c:v', 'libx264', '-crf', '16', path.join(scratch, 'source.mp4')]);
  run(['-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=6', path.join(scratch, 'source.wav')]);
  const clip = (id, speed) => ({ id, type: 'video', src: 'source.mp4', inPoint: 1, clipDuration: 1, speed, volume: 0 });
  const timeline = {
    meta: { fps: 30, width: 320, height: 180 },
    videoTracks: [{ id: 'main', clips: [clip('fast', 2), clip('slow', .5)] },
      { id: 'pip', clips: [{ ...clip('inset', 1), atSeconds: .5, box: { x: .65, y: .08, w: .3, h: .3 } }] }],
    audioTracks: [{ id: 'audio', clips: [{ id: 'sound', src: 'source.wav', inPoint: 1, atSeconds: 0, duration: 2, speed: 1.5, volume: .5 }] }],
    overlays: [{ text: 'D剪 · Rendering', startSeconds: 0, endSeconds: 2, position: 'center', fontSize: 18 }],
  };
  await renderVideo({ timeline, outFile: output, assetsDir: scratch, concurrency: 2 });
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', output], { windowsHide: true }));
  const video = probe.streams.find((s) => s.codec_type === 'video');
  const audio = probe.streams.find((s) => s.codec_type === 'audio');
  assert.equal(video.codec_name, 'h264'); assert.equal(video.nb_frames, '60');
  assert.equal(audio.codec_name, 'aac'); assert.equal(Number(probe.format.duration), 2);
  const roi = ['-vf', 'crop=60:30:0:0', '-pix_fmt', 'rgb24', '-f', 'rawvideo', 'pipe:1'];
  const original = run(['-i', path.join(scratch, 'source.mp4'), ...roi]);
  const rendered = run(['-i', output, ...roi]);
  const bytesPerFrame = 60 * 30 * 3;
  assert.equal(rendered.length / bytesPerFrame, 60);
  let worst = 0;
  for (let frame = 0; frame < 60; frame++) {
    const sourceFrame = frame < 30 ? 30 + frame * 2 : 30 + (frame - 30) * .5;
    let best = Infinity;
    for (const candidate of [Math.floor(sourceFrame), Math.ceil(sourceFrame)]) {
      let difference = 0;
      for (let i = 0; i < bytesPerFrame; i++) difference += Math.abs(rendered[frame * bytesPerFrame + i] - original[candidate * bytesPerFrame + i]);
      best = Math.min(best, difference / bytesPerFrame);
    }
    worst = Math.max(worst, best);
    assert.ok(best < 18, `frame ${frame} differs from expected source frame ${sourceFrame}: ${best.toFixed(2)} (black frame or wrong source position)`);
  }
  const samples = run(['-i', output, '-vn', '-ac', '1', '-ar', '48000', '-f', 'f32le', 'pipe:1']);
  // Check every quarter second, including the tail formerly cut short by endAt.
  for (let section = 0; section < 8; section++) {
    let power = 0;
    for (let i = section * 12000; i < (section + 1) * 12000; i++) power += samples.readFloatLE(i * 4) ** 2;
    assert.ok(Math.sqrt(power / 12000) > .015, `audio is missing in quarter-second ${section}`);
  }
  const destinationIndex = process.argv.indexOf('--output');
  if (destinationIndex !== -1) {
    const destination = path.resolve(process.argv[destinationIndex + 1]);
    fs.mkdirSync(path.dirname(destination), { recursive: true }); fs.copyFileSync(output, destination);
  }
  console.log(`PASS real export: 60 source-matched frames (worst mean error ${worst.toFixed(2)}), 2s H264/AAC, continuous speed-adjusted audio`);
} finally {
  assert.equal(path.dirname(path.resolve(scratch)), path.resolve(os.tmpdir()));
  fs.rmSync(scratch, { recursive: true, force: true });
}
