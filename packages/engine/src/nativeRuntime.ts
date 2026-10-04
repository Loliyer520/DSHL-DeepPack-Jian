import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const require = createRequire(import.meta.url);
const extension = process.platform === 'win32' ? '.exe' : '';
let pending: Promise<string | undefined> | undefined;
const audioModes = new Map<string, Promise<boolean>>();

export function needsNativeAac(encoders: string): boolean {
  const names = new Set(Array.from(encoders.matchAll(/^\s*A\S*\s+(\S+)\s/gm), (match) => match[1]));
  if (names.has('libfdk_aac')) return false;
  if (names.has('aac')) return true;
  throw new Error('编码器不支持 AAC 音频，请使用包含 AAC 编码器的 FFmpeg');
}

export function useNativeAudio(directory: string): Promise<boolean> {
  if (!audioModes.has(directory)) {
    const task = run(path.join(directory, 'ffmpeg' + extension), ['-hide_banner', '-encoders'],
      { timeout: 10000, maxBuffer: 1000000, windowsHide: true }).then(({ stdout }) => needsNativeAac(stdout));
    audioModes.set(directory, task);
    void task.catch(() => audioModes.delete(directory));
  }
  return audioModes.get(directory)!;
}

export async function muxNativeAudio(directory: string, video: string, audio: string, output: string, duration: number) {
  await run(path.join(directory, 'ffmpeg' + extension), ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
    '-i', video, '-i', audio, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k',
    '-t', String(duration), '-movflags', '+faststart', output], { maxBuffer: 1000000, windowsHide: true });
}

async function removeScratch(directory: string, parent: string) {
  if (path.dirname(path.resolve(directory)) !== path.resolve(parent)) throw new Error('Invalid runtime scratch directory');
  await fs.rm(directory, { recursive: true, force: true });
}

// 16×16 灰色 PNG，经 image2pipe 从 stdin 喂给编码器做自检。
// 不能用 lavfi nullsrc：Remotion 自带的精简版 FFmpeg 没有 wrapped_avframe 解码器，会误判为编码器损坏。
const PROBE_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAAAAAA6mKC9AAAAD0lEQVR4nGNoQAMMI1sAAAUMgAFaSOXNAAAAAElFTkSuQmCC', 'base64');

export async function verifyEncoder(executable: string) {
  const scratch = await fs.mkdtemp(path.join(os.tmpdir(), 'djian-encoder-probe-'));
  try {
    const output = path.join(scratch, 'probe.mp4');
    const task = run(executable, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-c:v', 'png', '-i', 'pipe:0',
      '-frames:v', '1', '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', output], { timeout: 10000, maxBuffer: 256000, windowsHide: true });
    task.child.stdin?.on('error', () => { /* 编码器提前退出时忽略写入错误，结果以退出码为准 */ });
    task.child.stdin?.end(PROBE_PNG);
    await task;
    if ((await fs.stat(output)).size < 128) throw new Error('编码器未生成有效视频');
  } finally { await removeScratch(scratch, os.tmpdir()); }
}

// Copy into an isolated, versioned runtime. Never replace files in node_modules
// or the user's FFmpeg installation. Publish only after the staged encoder works.
export async function prepareNativeRuntime(bundledDir: string, encoder: string, cacheDir: string,
  verify: (executable: string) => Promise<void> = verifyEncoder): Promise<string> {
  const files = (await fs.readdir(bundledDir, { withFileTypes: true })).filter((entry) => entry.isFile()).map((entry) => entry.name).sort();
  const fingerprint = await Promise.all(files.map(async (name) => {
    const stat = await fs.stat(path.join(bundledDir, name));
    return [name, stat.size, stat.mtimeMs];
  }));
  const stat = await fs.stat(encoder);
  const key = crypto.createHash('sha256').update(JSON.stringify([bundledDir, fingerprint, encoder, stat.size, stat.mtimeMs])).digest('hex').slice(0, 20);
  const destination = path.join(cacheDir, key);
  const targetEncoder = path.join(destination, 'ffmpeg.exe');
  try {
    await fs.access(path.join(destination, 'djian-runtime.json'));
    await verify(targetEncoder);
    return destination;
  } catch { /* Build a complete candidate before publishing it. */ }
  await fs.mkdir(cacheDir, { recursive: true });
  const staging = await fs.mkdtemp(path.join(cacheDir, '.stage-'));
  try {
    for (const name of files) if (name !== 'ffmpeg.exe') await fs.copyFile(path.join(bundledDir, name), path.join(staging, name));
    await fs.copyFile(encoder, path.join(staging, 'ffmpeg.exe'));
    await verify(path.join(staging, 'ffmpeg.exe'));
    await fs.writeFile(path.join(staging, 'djian-runtime.json'), JSON.stringify({ key, encoder }));
    try { await fs.rename(staging, destination); }
    catch (error) {
      // Another engine process may have published this same runtime first.
      const published = JSON.parse(await fs.readFile(path.join(destination, 'djian-runtime.json'), 'utf8').catch(() => '{}'));
      if (published.key !== key) throw error;
      try { await verify(targetEncoder); }
      catch {
        // A partially removed cache must not block an otherwise verified runtime.
        // Publish separately so an active process's binaries are never replaced.
        const repaired = `${destination}-repair-${crypto.randomUUID()}`;
        await fs.rename(staging, repaired);
        return repaired;
      }
    }
    return destination;
  } finally { await removeScratch(staging, cacheDir); }
}

async function resolveRuntime(): Promise<string | undefined> {
  if (process.env.DJIAN_RENDER_BINARIES_DIR) {
    const directory = path.resolve(process.env.DJIAN_RENDER_BINARIES_DIR);
    for (const name of ['ffmpeg', 'ffprobe', 'remotion']) {
      if (!(await fs.stat(path.join(directory, name + extension)).catch(() => null))?.isFile()) throw new Error(`自定义渲染目录缺少 ${name + extension}`);
    }
    await verifyEncoder(path.join(directory, 'ffmpeg' + extension));
    return directory;
  }
  if (process.platform !== 'win32' || process.arch !== 'x64') return undefined;
  const rendererRequire = createRequire(require.resolve('@remotion/renderer'));
  const bundled = path.dirname(rendererRequire.resolve('@remotion/compositor-win32-x64-msvc/package.json'));
  let failure: unknown;
  try { await verifyEncoder(path.join(bundled, 'ffmpeg.exe')); return undefined; }
  catch (error) { failure = error; }
  const candidates = new Set((process.env.PATH ?? '').split(path.delimiter).filter(Boolean).map((entry) => path.resolve(entry.replace(/^"|"$/g, ''), 'ffmpeg.exe')));
  for (const encoder of candidates) {
    if (path.dirname(encoder).toLowerCase() === bundled.toLowerCase()) continue;
    if (!(await fs.stat(encoder).catch(() => null))?.isFile()) continue;
    try {
      await verifyEncoder(encoder);
      return await prepareNativeRuntime(bundled, encoder, path.join(os.tmpdir(), 'djian-native-runtime'));
    } catch (error) { failure = error; }
  }
  const detail = failure instanceof Error ? failure.message.slice(-1500) : String(failure);
  throw new Error(`编码器自检失败，尚未开始渲染。请安装可用的 FFmpeg 并加入 PATH，或设置 DJIAN_RENDER_BINARIES_DIR。\n${detail}`);
}

export function resolveRenderBinaries(): Promise<string | undefined> {
  pending ??= resolveRuntime().catch((error) => { pending = undefined; throw error; });
  return pending;
}
