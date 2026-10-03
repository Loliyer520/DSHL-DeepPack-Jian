import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { needsNativeAac, prepareNativeRuntime } from '../packages/engine/dist/nativeRuntime.js';

test('audio compatibility prefers FDK, supports native AAC, and rejects missing encoders', () => {
  assert.equal(needsNativeAac(' A..... aac AAC\n A....D libfdk_aac FDK AAC\n'), false);
  assert.equal(needsNativeAac(' A..... aac AAC\n V..... libx264 H264\n'), true);
  assert.throws(() => needsNativeAac(' A..... libmp3lame MP3\n'), /不支持 AAC/);
});

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'djian-runtime-test-'));
  t.after(async () => {
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
    await fs.rm(root, { recursive: true, force: true });
  });
  const bundled = path.join(root, 'bundled'), cache = path.join(root, 'cache'), encoder = path.join(root, 'system.exe');
  await fs.mkdir(bundled);
  for (const name of ['ffmpeg.exe', 'ffprobe.exe', 'remotion.exe', 'avcodec.dll']) await fs.writeFile(path.join(bundled, name), 'original-' + name);
  await fs.writeFile(encoder, 'working-encoder');
  const verify = async (file) => { assert.equal(await fs.readFile(file, 'utf8'), 'working-encoder'); };
  return { bundled, cache, encoder, verify };
}

test('native runtime preserves original installations and keeps compositor libraries together', async (t) => {
  const f = await fixture(t);
  const directory = await prepareNativeRuntime(f.bundled, f.encoder, f.cache, f.verify);
  assert.equal(await fs.readFile(path.join(f.bundled, 'ffmpeg.exe'), 'utf8'), 'original-ffmpeg.exe');
  assert.equal(await fs.readFile(f.encoder, 'utf8'), 'working-encoder');
  assert.equal(await fs.readFile(path.join(directory, 'remotion.exe'), 'utf8'), 'original-remotion.exe');
  assert.equal(await fs.readFile(path.join(directory, 'avcodec.dll'), 'utf8'), 'original-avcodec.dll');
  assert.equal(await prepareNativeRuntime(f.bundled, f.encoder, f.cache, f.verify), directory);
  await fs.writeFile(f.encoder, 'new-working-encoder');
  const changed = await prepareNativeRuntime(f.bundled, f.encoder, f.cache, async () => {});
  assert.notEqual(changed, directory, 'updated encoder must invalidate cached runtime');
});

test('failed encoder verification never publishes a partial native runtime', async (t) => {
  const f = await fixture(t);
  await assert.rejects(prepareNativeRuntime(f.bundled, f.encoder, f.cache, async () => { throw Error('cannot encode'); }), /cannot encode/);
  assert.deepEqual(await fs.readdir(f.cache), []);
});

test('a cache with a missing encoder is repaired without replacing its other binaries', async (t) => {
  const f = await fixture(t);
  const old = await prepareNativeRuntime(f.bundled, f.encoder, f.cache, f.verify);
  await fs.rm(path.join(old, 'ffmpeg.exe'));
  const repaired = await prepareNativeRuntime(f.bundled, f.encoder, f.cache, f.verify);
  assert.notEqual(repaired, old);
  await f.verify(path.join(repaired, 'ffmpeg.exe'));
  assert.equal(await fs.readFile(path.join(old, 'remotion.exe'), 'utf8'), 'original-remotion.exe');
});

test('two engine processes can prepare the same runtime without corrupting its files', async (t) => {
  const f = await fixture(t);
  const [first, second] = await Promise.all([
    prepareNativeRuntime(f.bundled, f.encoder, f.cache, f.verify),
    prepareNativeRuntime(f.bundled, f.encoder, f.cache, f.verify),
  ]);
  assert.equal(first, second);
  assert.equal(await fs.readFile(path.join(first, 'ffprobe.exe'), 'utf8'), 'original-ffprobe.exe');
  assert.deepEqual(await fs.readdir(f.cache), [path.basename(first)]);
});
