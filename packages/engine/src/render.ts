// 渲染服务：预打包 bundle（按源码哈希缓存）+ 常驻浏览器 + 素材经 HTTP 读取。
// 取帧从「每次打包 + 两次冷启动浏览器」降为一次页面渲染；导出用 Remotion 原生 scale。
import { makeCancelSignal, openBrowser, renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { pipeline } from "node:stream/promises";
import crypto from "node:crypto";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { parseTimeline, type Timeline } from "./schema.js";
import { timelineDurationInFrames } from "./timeline.js";
import { resolveRenderBrowser } from "./browser.js";
import { muxNativeAudio, resolveRenderBinaries, useNativeAudio } from "./nativeRuntime.js";

const ENGINE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC_DIR = path.join(ENGINE_ROOT, "src");
const ENTRY = path.join(SRC_DIR, "entry.tsx");
export const PREBUILT_BUNDLE_DIR = path.join(ENGINE_ROOT, "bundle");
const STAMP = "djian-bundle.json";
const chromiumOptions = {};

type Browser = Awaited<ReturnType<typeof openBrowser>>;

/** 源码内容哈希：src 任何改动都会换一个 bundle 目录，绝不复用旧代码；没有源码（精简安装）时返回 null */
export function sourceHash(): string | null {
  if (!fs.existsSync(SRC_DIR)) return null;
  const h = crypto.createHash("sha256");
  for (const f of fs.readdirSync(SRC_DIR).filter((x) => /\.(ts|tsx)$/.test(x)).sort()) {
    h.update(f).update(fs.readFileSync(path.join(SRC_DIR, f)));
  }
  return h.digest("hex").slice(0, 16);
}

const readStamp = (dir: string): string | null => {
  try { return JSON.parse(fs.readFileSync(path.join(dir, STAMP), "utf8")).hash ?? null; } catch { return null; }
};

/** 打包到指定目录（整合包构建时调用，安装后零打包） */
export async function buildBundle(outDir: string, onProgress?: (p: number) => void, { minify = false } = {}): Promise<string> {
  const hash = sourceHash();
  if (!hash) throw new Error("缺少引擎源码，无法打包渲染器");
  const publicDir = fs.mkdtempSync(path.join(os.tmpdir(), "djian-empty-public-"));
  try {
    // 只清空目录内容而不删目录本身：Windows 上目录被其他进程当作工作目录时 rmdir 会 EBUSY
    if (fs.existsSync(outDir)) for (const entry of fs.readdirSync(outDir)) fs.rmSync(path.join(outDir, entry), { recursive: true, force: true });
    // 按需加载打包器：整合包随附预构建 bundle 时，运行环境不需要 webpack 这一整套依赖
    const { bundle } = await import("@remotion/bundler");
    await bundle({
      entryPoint: ENTRY, outDir, publicDir, enableCaching: false, onProgress: (p) => onProgress?.(p),
      // 源码按 NodeNext 写 "./x.js" 导入：让 webpack 把 .js 映射回 .ts/.tsx
      // 不产出 source map：渲染用不到。整合包里的预构建 bundle 额外压缩（体积约降三分之二）；本机临时缓存不压缩，打包更快
      webpackOverride: (config) => ({
        ...config,
        devtool: false,
        ...(minify ? { optimization: { ...config.optimization, minimize: true } } : {}),
        resolve: { ...config.resolve, extensionAlias: { ".js": [".ts", ".tsx", ".js"] } },
      }),
    });
    fs.writeFileSync(path.join(outDir, STAMP), JSON.stringify({ hash, builtAt: new Date().toISOString() }));
    return outDir;
  } finally {
    fs.rmSync(publicDir, { recursive: true, force: true });
  }
}

/** 清理一周前的旧 bundle 缓存（源码每改一次就多一个目录）；较新的可能正被其他版本的引擎使用，保留 */
function pruneStaleBundles(keep: string) {
  const weekAgo = Date.now() - 7 * 86400_000;
  try {
    for (const name of fs.readdirSync(os.tmpdir())) {
      if (!/^djian-bundle-[0-9a-f]{16}$/.test(name)) continue;
      const dir = path.join(os.tmpdir(), name);
      if (dir === keep) continue;
      if (fs.statSync(dir).mtimeMs < weekAgo) fs.rmSync(dir, { recursive: true, force: true });
    }
  } catch { /* 清理失败不影响渲染 */ }
}

let serveUrlTask: Promise<string> | null = null;
export function getServeUrl(): Promise<string> {
  serveUrlTask ??= (async () => {
    const hash = sourceHash();
    const prebuilt = readStamp(PREBUILT_BUNDLE_DIR);
    if (prebuilt && (hash === null || prebuilt === hash)) return PREBUILT_BUNDLE_DIR;
    if (hash === null) throw new Error("渲染包缺失：引擎既没有预构建 bundle 也没有源码，请重新安装整合包");
    const cacheDir = path.join(os.tmpdir(), "djian-bundle-" + hash);
    if (readStamp(cacheDir) === hash && fs.existsSync(path.join(cacheDir, "index.html"))) return cacheDir;
    const built = await buildBundle(cacheDir);
    pruneStaleBundles(cacheDir);
    return built;
  })().catch((e) => { serveUrlTask = null; throw e; });
  return serveUrlTask;
}

let browserTask: Promise<Browser> | null = null;
function getBrowser(): Promise<Browser> {
  browserTask ??= openBrowser("chrome", { browserExecutable: resolveRenderBrowser() ?? null, chromiumOptions })
    .catch((e) => { browserTask = null; throw e; });
  return browserTask;
}
async function resetBrowser() {
  const task = browserTask;
  browserTask = null;
  try { await (await task)?.close({ silent: true } as never); } catch { /* 已断开 */ }
}
export async function closeRenderer() { await resetBrowser(); }

/** 浏览器崩溃/断开后重开一次再试 */
async function withBrowser<T>(fn: (browser: Browser) => Promise<T>): Promise<T> {
  try {
    return await fn(await getBrowser());
  } catch (error) {
    const msg = String((error as Error)?.message ?? error);
    if (!/Target closed|disconnected|Session closed|Protocol error|browser has been closed/i.test(msg)) throw error;
    await resetBrowser();
    return fn(await getBrowser());
  }
}

/** 启动预热：准备 bundle 与浏览器，首次取帧不再等几分钟 */
export async function warmup(): Promise<void> {
  await getServeUrl();
  await getBrowser();
}

function linkSignal(signal?: AbortSignal) {
  const { cancelSignal, cancel } = makeCancelSignal();
  if (signal) {
    if (signal.aborted) cancel();
    else signal.addEventListener("abort", () => cancel(), { once: true });
  }
  return cancelSignal;
}

export interface AssetContext {
  /** 素材 HTTP 基址，以 / 结尾：src 会被 URL 编码后拼接 */
  assetBase: string;
  /** 内置字体 HTTP 基址（…/fonts） */
  fontsBase?: string;
}

export interface FrameResult {
  buffer: Buffer;
  format: "jpeg" | "png";
  width: number;
  height: number;
  frames: number[];
  sheet: boolean;
}

/**
 * 渲染一个或多个时间点。多个时间点拼成一张带时间标签的联络图（一次渲染）。
 * maxSize 限制输出长边（给模型看图时省 token）。
 */
export async function renderFrames(opts: AssetContext & {
  timeline: unknown;
  seconds: number[];
  format?: "jpeg" | "png";
  maxSize?: number;
  quality?: number;
  signal?: AbortSignal;
}): Promise<FrameResult> {
  const timeline: Timeline = parseTimeline(opts.timeline);
  const fps = timeline.meta.fps;
  const total = Math.max(1, timelineDurationInFrames(timeline));
  const frames = opts.seconds.slice(0, 12).map((s) => Math.min(total - 1, Math.max(0, Math.round(s * fps))));
  if (!frames.length) throw new Error("至少需要一个时间点");
  const format = opts.format ?? "jpeg";
  const maxSize = Math.max(64, opts.maxSize ?? 1280);
  const serveUrl = await getServeUrl();
  const inputProps = { timeline, assetBase: opts.assetBase, fontsBase: opts.fontsBase };
  const cancelSignal = linkSignal(opts.signal);
  return withBrowser(async (puppeteerInstance) => {
    const composition = await selectComposition({ serveUrl, id: "TimelineVideo", inputProps, puppeteerInstance, chromiumOptions, timeoutInMilliseconds: 120_000 });
    const still = (frame: number, scale: number, imageFormat: "jpeg" | "png") => renderStill({
      composition, serveUrl, inputProps, puppeteerInstance, chromiumOptions, frame, scale, imageFormat,
      output: null, overwrite: true, timeoutInMilliseconds: 120_000, cancelSignal,
      ...(imageFormat === "jpeg" ? { jpegQuality: opts.quality ?? 80 } : {}),
    }).then((r) => { if (!r.buffer) throw new Error("渲染没有返回图像数据"); return r.buffer; });
    if (frames.length === 1) {
      const scale = Math.min(1, maxSize / Math.max(composition.width, composition.height));
      const buffer = await still(frames[0], scale, format);
      return { buffer, format, width: Math.round(composition.width * scale), height: Math.round(composition.height * scale), frames, sheet: false };
    }
    // 多个时间点：逐帧渲染（每帧独立 seek，保证画面准确），再在浏览器里拼成带时间标签的网格
    const cols = frames.length <= 2 ? frames.length : frames.length <= 4 ? 2 : 3;
    const cellWidth = Math.min(480, Math.floor(maxSize / cols));
    const scale = cellWidth / composition.width;
    const cellHeight = Math.max(2, Math.round(composition.height * scale));
    const images: string[] = [];
    for (const f of frames) images.push("data:image/jpeg;base64," + (await still(f, scale, "jpeg")).toString("base64"));
    const gridProps = { images, labels: frames.map((f, i) => "#" + (i + 1) + " " + (f / fps).toFixed(2) + "s"), cols, cellWidth, cellHeight };
    const grid = await selectComposition({ serveUrl, id: "ImageGrid", inputProps: gridProps, puppeteerInstance, chromiumOptions });
    const { buffer } = await renderStill({
      composition: grid, serveUrl, inputProps: gridProps, puppeteerInstance, chromiumOptions, frame: 0, output: null, overwrite: true, imageFormat: format,
      ...(format === "jpeg" ? { jpegQuality: opts.quality ?? 80 } : {}), cancelSignal,
    });
    if (!buffer) throw new Error("渲染没有返回图像数据");
    return { buffer, format, width: grid.width, height: grid.height, frames, sheet: true };
  });
}

export interface RenderOptions extends Partial<AssetContext> {
  timeline: unknown;
  outFile: string;
  /** 兼容旧调用：本地素材目录（会临时起一个只读静态服务） */
  assetsDir?: string;
  scale?: number;
  concurrency?: number;
  crf?: number;
  signal?: AbortSignal;
  onProgress?: (p: { rendered: number; total: number; stage: string }) => void;
}

/** 导出 mp4：JSON 时间线进 → mp4 出 */
export async function renderVideo(opts: RenderOptions): Promise<{ outFile: string; durationInFrames: number; fps: number }> {
  if (!opts.assetBase) {
    if (!opts.assetsDir) throw new Error("缺少素材来源（assetBase 或 assetsDir）");
    return withStaticAssets(opts.assetsDir, (assetBase, fontsBase) => renderVideo({ ...opts, assetsDir: undefined, assetBase, fontsBase: opts.fontsBase ?? fontsBase }));
  }
  const timeline: Timeline = parseTimeline(opts.timeline);
  const durationInFrames = Math.max(1, timelineDurationInFrames(timeline));
  const binariesDirectory = await resolveRenderBinaries();
  const separateAudio = binariesDirectory ? await useNativeAudio(binariesDirectory) : false;
  const serveUrl = await getServeUrl();
  const inputProps = { timeline, assetBase: opts.assetBase, fontsBase: opts.fontsBase };
  const outFile = path.resolve(opts.outFile);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const scratch = separateAudio ? fs.mkdtempSync(path.join(path.dirname(outFile), ".djian-render-")) : null;
  try {
    await withBrowser(async (puppeteerInstance) => {
      const composition = await selectComposition({ serveUrl, id: "TimelineVideo", inputProps, puppeteerInstance, chromiumOptions, binariesDirectory, timeoutInMilliseconds: 120_000 });
      await renderMedia({
        binariesDirectory, composition, serveUrl, inputProps, puppeteerInstance, chromiumOptions,
        codec: "h264",
        outputLocation: scratch ? path.join(scratch, "video.mp4") : outFile,
        ...(scratch ? { audioCodec: "pcm-16" as const, separateAudioTo: path.join(scratch, "audio.wav") } : {}),
        scale: opts.scale ?? 1,
        concurrency: opts.concurrency ?? Math.max(1, Math.floor(os.cpus().length / 2)),
        ...(opts.crf != null ? { crf: opts.crf } : {}),
        timeoutInMilliseconds: 120_000,
        cancelSignal: linkSignal(opts.signal),
        onProgress: (p) => opts.onProgress?.({ rendered: p.renderedFrames, total: durationInFrames, stage: p.stitchStage }),
      });
    });
    if (scratch && binariesDirectory) {
      opts.onProgress?.({ rendered: durationInFrames, total: durationInFrames, stage: "muxing" });
      const completed = path.join(scratch, "completed.mp4");
      await muxNativeAudio(binariesDirectory, path.join(scratch, "video.mp4"), path.join(scratch, "audio.wav"), completed, durationInFrames / timeline.meta.fps);
      fs.renameSync(completed, outFile);
    }
  } finally {
    if (scratch) fs.rmSync(scratch, { recursive: true, force: true });
  }
  return { outFile, durationInFrames, fps: timeline.meta.fps };
}

/** 单帧 PNG 落盘（旧 API，CLI/调试用） */
export async function renderFrame(opts: { timeline: unknown; timeSeconds: number; outFile: string; assetsDir: string }) {
  return withStaticAssets(opts.assetsDir, async (assetBase, fontsBase) => {
    const r = await renderFrames({ timeline: opts.timeline, seconds: [opts.timeSeconds], assetBase, fontsBase, format: "png", maxSize: 16384 });
    fs.mkdirSync(path.dirname(opts.outFile), { recursive: true });
    fs.writeFileSync(opts.outFile, r.buffer);
    return { outFile: opts.outFile, frame: r.frames[0], width: r.width, height: r.height };
  });
}

const MIME: Record<string, string> = {
  ".mp4": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm", ".mkv": "video/x-matroska",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
  ".mp3": "audio/mpeg", ".wav": "audio/wav", ".m4a": "audio/mp4", ".aac": "audio/aac", ".ogg": "audio/ogg", ".flac": "audio/flac",
  ".woff2": "font/woff2",
};

/** 临时只读静态服务（命令行导出/测试用）：/a/<素材>、/fonts/<字体>，支持单段 Range */
export async function withStaticAssets<T>(assetsDir: string, fn: (assetBase: string, fontsBase: string) => Promise<T>): Promise<T> {
  const roots: Record<string, string> = { a: path.resolve(assetsDir), fonts: path.join(ENGINE_ROOT, "fonts") };
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    const [, scope, ...rest] = url.pathname.split("/");
    const root = roots[scope];
    const name = decodeURIComponent(rest.join("/"));
    const file = root ? path.resolve(root, name) : "";
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (!root || !file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
    const size = fs.statSync(file).size;
    const type = MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream";
    const m = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range ?? ""));
    if (m && (m[1] || m[2])) {
      const start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
      const end = m[1] && m[2] ? Math.min(size - 1, Number(m[2])) : size - 1;
      if (start >= size) { res.writeHead(416, { "Content-Range": "bytes */" + size }).end(); return; }
      res.writeHead(206, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Range": "bytes " + start + "-" + end + "/" + size, "Content-Length": end - start + 1 });
      pipeline(fs.createReadStream(file, { start, end }), res).catch(() => res.destroy());
      return;
    }
    res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Length": size });
    if (req.method === "HEAD") { res.end(); return; }
    pipeline(fs.createReadStream(file), res).catch(() => res.destroy());
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const port = (server.address() as { port: number }).port;
  try {
    return await fn("http://127.0.0.1:" + port + "/a/", "http://127.0.0.1:" + port + "/fonts");
  } finally {
    server.close();
  }
}
