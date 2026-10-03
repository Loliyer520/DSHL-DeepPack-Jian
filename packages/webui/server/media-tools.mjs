// 媒体工具：ffmpeg/ffprobe 发现 + 异步执行队列 + 探测/缩略图/雪碧图/波形峰值/画面统计。
// 全部异步 spawn（不阻塞事件循环），PATH 里没有 ffmpeg 时回退到 Remotion 随包的二进制。
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { bottomRegionStats } from './frame-analysis.mjs';

const require = createRequire(import.meta.url);
const EXT = process.platform === 'win32' ? '.exe' : '';

function compositorPackages() {
  const { platform, arch } = process;
  if (platform === 'win32') return ['@remotion/compositor-win32-x64-msvc'];
  if (platform === 'darwin') return [arch === 'arm64' ? '@remotion/compositor-darwin-arm64' : '@remotion/compositor-darwin-x64'];
  if (platform === 'linux') return arch === 'arm64'
    ? ['@remotion/compositor-linux-arm64-gnu', '@remotion/compositor-linux-arm64-musl']
    : ['@remotion/compositor-linux-x64-gnu', '@remotion/compositor-linux-x64-musl'];
  return [];
}

function findOnPath(name) {
  for (const dir of (process.env.PATH ?? '').split(path.delimiter)) {
    if (!dir) continue;
    const file = path.join(dir.replace(/^"|"$/g, ''), name + EXT);
    try { if (fs.statSync(file).isFile()) return file; } catch {}
  }
  return null;
}

let resolved;
/** { ffmpeg, ffprobe, dir? }：环境变量 > PATH > Remotion 随包二进制 */
export function resolveTools() {
  if (resolved) return resolved;
  const envFfmpeg = process.env.DJIAN_FFMPEG, envFfprobe = process.env.DJIAN_FFPROBE;
  if (envFfmpeg && envFfprobe) return (resolved = { ffmpeg: envFfmpeg, ffprobe: envFfprobe });
  const ffmpeg = findOnPath('ffmpeg'), ffprobe = findOnPath('ffprobe');
  if (ffmpeg && ffprobe) return (resolved = { ffmpeg, ffprobe });
  try {
    const rreq = createRequire(require.resolve('@remotion/renderer/package.json'));
    for (const pkg of compositorPackages()) {
      try {
        const dir = path.dirname(rreq.resolve(pkg + '/package.json'));
        if (fs.existsSync(path.join(dir, 'ffmpeg' + EXT))) return (resolved = { ffmpeg: path.join(dir, 'ffmpeg' + EXT), ffprobe: path.join(dir, 'ffprobe' + EXT), dir });
      } catch {}
    }
  } catch {}
  return (resolved = { ffmpeg: ffmpeg ?? 'ffmpeg', ffprobe: ffprobe ?? 'ffprobe' });
}

// 并发 2：缩略图/波形/探测不挤占渲染
const queue = [];
let running = 0;
const LIMIT = 2;
function schedule(task) {
  return new Promise((resolve, reject) => {
    queue.push({ task, resolve, reject });
    drain();
  });
}
function drain() {
  while (running < LIMIT && queue.length) {
    const { task, resolve, reject } = queue.shift();
    running++;
    task().then(resolve, reject).finally(() => { running--; drain(); });
  }
}

/** 运行 ffmpeg/ffprobe：超时杀进程、stdout 上限、可选 stdin；返回 { stdout: Buffer, stderr } */
export function runTool(which, args, { timeoutMs = 60_000, maxBytes = 64 * 1024 * 1024, input, onStdout } = {}) {
  return schedule(() => new Promise((resolve, reject) => {
    const tools = resolveTools();
    const bin = tools[which];
    const env = { ...process.env };
    if (tools.dir) {
      env.PATH = tools.dir + path.delimiter + (env.PATH ?? '');
      if (process.platform === 'linux') env.LD_LIBRARY_PATH = tools.dir + (env.LD_LIBRARY_PATH ? path.delimiter + env.LD_LIBRARY_PATH : '');
      if (process.platform === 'darwin') env.DYLD_LIBRARY_PATH = tools.dir;
    }
    const child = spawn(bin, args, { cwd: tools.dir, env, windowsHide: true, stdio: [input ? 'pipe' : 'ignore', 'pipe', 'pipe'] });
    const chunks = [];
    let size = 0;
    let stderr = '';
    let settled = false;
    const done = (err, value) => { if (settled) return; settled = true; clearTimeout(timer); err ? reject(err) : resolve(value); };
    const timer = setTimeout(() => { child.kill('SIGKILL'); done(new Error(which + ' 超时（' + Math.round(timeoutMs / 1000) + 's）')); }, timeoutMs);
    child.stdout.on('data', (c) => {
      if (onStdout) { onStdout(c); return; }
      size += c.length;
      if (size > maxBytes) { child.kill('SIGKILL'); done(new Error(which + ' 输出过大')); return; }
      chunks.push(c);
    });
    child.stderr.on('data', (c) => { if (stderr.length < 8000) stderr += c.toString(); });
    child.on('error', (e) => done(new Error('无法启动 ' + which + '：' + e.message + '（可安装 FFmpeg 并加入 PATH，或设置 DJIAN_FFMPEG/DJIAN_FFPROBE）')));
    child.on('close', (code) => {
      if (code === 0) done(null, { stdout: Buffer.concat(chunks), stderr });
      else done(new Error(which + ' 失败（退出码 ' + code + '）：' + stderr.trim().split('\n').slice(-3).join(' ')));
    });
    if (input) { child.stdin.on('error', () => {}); child.stdin.end(input); }
  }));
}

/** ffprobe：时长/尺寸/帧率/是否有音视频 */
export async function probe(file) {
  const { stdout } = await runTool('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file], { timeoutMs: 20_000, maxBytes: 4 * 1024 * 1024 });
  const info = JSON.parse(stdout.toString('utf8') || '{}');
  const streams = info.streams ?? [];
  const video = streams.find((s) => s.codec_type === 'video' && s.disposition?.attached_pic !== 1);
  const audio = streams.find((s) => s.codec_type === 'audio');
  const duration = Number(info.format?.duration ?? video?.duration ?? audio?.duration);
  const [num, den] = String(video?.avg_frame_rate ?? video?.r_frame_rate ?? '0/1').split('/').map(Number);
  return {
    duration: Number.isFinite(duration) && duration > 0 ? Math.round(duration * 1000) / 1000 : null,
    width: video?.width ?? null,
    height: video?.height ?? null,
    fps: num && den ? Math.round((num / den) * 100) / 100 : null,
    hasVideo: Boolean(video),
    hasAudio: Boolean(audio),
  };
}

export async function thumbnail(file, out, { kind, duration }) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const at = kind === 'video' ? String(Math.min(0.5, Math.max(0, (duration ?? 1) / 3))) : null;
  const args = ['-v', 'error', ...(at ? ['-ss', at] : []), '-i', file, '-frames:v', '1', '-vf', 'scale=320:-2', '-q:v', '5', '-y', out];
  await runTool('ffmpeg', args, { timeoutMs: 30_000 });
  return out;
}

/** 雪碧图：按固定间隔取关键帧拼成一行，时间线胶片按片段 inPoint/时长切片显示（裁剪不再重新解码） */
export async function sprite(file, out, duration) {
  const d = Math.max(0.1, duration ?? 1);
  const interval = Math.max(0.5, d / 120);
  const count = Math.max(1, Math.min(120, Math.floor(d / interval) + 1));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await runTool('ffmpeg', ['-v', 'error', '-skip_frame', 'nokey', '-i', file, '-an', '-vf', 'fps=1/' + interval.toFixed(4) + ',scale=-2:64,tile=' + count + 'x1', '-frames:v', '1', '-q:v', '6', '-y', out], { timeoutMs: 180_000 });
  return { interval, count, height: 64 };
}

/** 波形峰值：解码成 8kHz 单声道流式统计，每秒 100 个峰值（0-255），任意大小文件都可用 */
export async function peaks(file, out) {
  const SAMPLE_RATE = 8000;
  const PER_SECOND = 100;
  const bucket = SAMPLE_RATE / PER_SECOND;
  const values = [];
  let current = 0, inBucket = 0, carry = null;
  await runTool('ffmpeg', ['-v', 'error', '-i', file, '-vn', '-ac', '1', '-ar', String(SAMPLE_RATE), '-f', 's16le', '-'], {
    timeoutMs: 300_000,
    onStdout: (chunk) => {
      let buf = carry ? Buffer.concat([carry, chunk]) : chunk;
      const usable = buf.length - (buf.length % 2);
      carry = usable < buf.length ? buf.subarray(usable) : null;
      for (let i = 0; i < usable; i += 2) {
        const v = Math.abs(buf.readInt16LE(i));
        if (v > current) current = v;
        if (++inBucket >= bucket) { values.push(Math.min(255, Math.round((current / 32768) * 255))); current = 0; inBucket = 0; }
      }
    },
  });
  if (inBucket) values.push(Math.min(255, Math.round((current / 32768) * 255)));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(values));
  return { rate: PER_SECOND, count: values.length };
}

/** 画面统计（给不支持图像输入的模型）：缩到 96×54 取 RGB 算亮度/对比度/主色/底部字幕区 */
export async function analyzeImage(imageBuffer) {
  const W = 96, H = 54;
  const { stdout: raw } = await runTool('ffmpeg', ['-v', 'error', '-i', 'pipe:0', '-vf', 'scale=' + W + ':' + H, '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], { input: imageBuffer, timeoutMs: 20_000, maxBytes: W * H * 3 + 1024 });
  const n = W * H;
  let sum = 0, sumSq = 0, dark = 0, bottomBright = 0, bottomN = 0;
  const buckets = new Map();
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 3;
      const r = raw[i], g = raw[i + 1], b = raw[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      sum += lum; sumSq += lum * lum;
      if (lum < 16) dark++;
      if (y >= Math.floor((H * 2) / 3)) { bottomN++; if (lum > 200) bottomBright++; }
      const key = (r >> 6) + ',' + (g >> 6) + ',' + (b >> 6);
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }
  }
  const avg = Math.round(sum / n);
  return {
    avgBrightness: avg,
    contrast: Math.round(Math.sqrt(Math.max(0, sumSq / n - avg * avg))),
    darkPercent: Math.round((dark / n) * 100),
    dominantColors: [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, c]) => {
      const [rq, gq, bq] = k.split(',').map(Number);
      return { rgb: [rq * 64 + 32, gq * 64 + 32, bq * 64 + 32], percent: Math.round((c / n) * 100) };
    }),
    bottomThirdBrightPercent: Math.round((bottomBright / Math.max(1, bottomN)) * 1000) / 10,
    ...bottomRegionStats(raw, W, H),
  };
}
