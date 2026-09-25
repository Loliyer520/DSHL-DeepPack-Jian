import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { parseTimeline, timelineDurationInFrames, type Timeline } from "./schema.js";

export interface RenderOptions {
  // 时间线 JSON（对象 / 字符串 / 文件路径均可，见 renderVideo）
  timeline: unknown;
  // 输出 mp4 绝对路径
  outFile: string;
  // 素材根目录：时间线里所有 src 相对它解析（会映射为 Remotion publicDir）
  assetsDir: string;
  concurrency?: number; // 渲染并发，低配机器调小（默认按 CPU 核数一半）
  crf?: number; // h264 质量档：越小越清晰越大（草稿 28 / 标准 20 / 高 16）
  offthreadVideoCacheMb?: number; // OffthreadVideo 帧缓存上限 MB（默认按可用内存自适应）
  onProgress?: (p: { rendered: number; total: number; stage: string }) => void;
}

const engineDir = path.dirname(fileURLToPath(import.meta.url));
const entryPoint = path.resolve(engineDir, "../src/entry.tsx");

// 包级 bundle 缓存：同一进程内多次渲染只 bundle 一次
let bundleCache: { assetsDir: string; sig: string; url: string } | null = null;

// 素材目录内容变化（上传/删除）后必须调用：bundle 是打包时快照，不失效会 404 新素材
export function invalidateBundle(): void {
  bundleCache = null;
}

// selectComposition 和 renderMedia 各自都会拉起浏览器，必须给同一份 Chromium 选项
const chromiumOptions = { gl: "angle" as const };

// 目录签名：绕过 API 直接落盘的素材变动也要能触发重新 bundle（2026-09-25 black_bg 事故）
const assetsSignature = (dir: string): string => {
  try {
    return fs
      .readdirSync(dir)
      .map((f) => {
        const st = fs.statSync(path.join(dir, f));
        return `${f}:${st.size}:${Math.floor(st.mtimeMs)}`;
      })
      .sort()
      .join("|");
  } catch {
    return "";
  }
};

async function getBundle(assetsDir: string, onLog?: (m: string) => void): Promise<string> {
  const sig = assetsSignature(assetsDir);
  if (bundleCache && bundleCache.assetsDir === assetsDir && bundleCache.sig === sig) return bundleCache.url;
  const url = await bundle({
    entryPoint,
    publicDir: assetsDir,
    onProgress: () => {},
  });
  bundleCache = { assetsDir, sig, url };
  return url;
}

// 渲染主 API：JSON 时间线进 → mp4 出。返回输出路径与时长帧数。
export async function renderVideo(opts: RenderOptions): Promise<{ outFile: string; durationInFrames: number; fps: number }> {
  const timeline: Timeline = parseTimeline(opts.timeline);
  const durationInFrames = Math.max(1, timelineDurationInFrames(timeline));
  const assetsDir = path.resolve(opts.assetsDir);
  if (!fs.existsSync(assetsDir)) throw new Error(`素材目录不存在：${assetsDir}`);

  const serveUrl = await getBundle(assetsDir);

  const composition = await selectComposition({
    serveUrl,
    id: "TimelineVideo",
    inputProps: { timeline },
    chromiumOptions,
  });

  const concurrency = opts.concurrency ?? Math.max(1, Math.floor(os.cpus().length / 2));
  fs.mkdirSync(path.dirname(opts.outFile), { recursive: true });

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: opts.outFile,
    inputProps: { timeline },
    concurrency,
    // OffthreadVideo 帧缓存：Remotion 默认按 2GB 跑，4GB 小机上会把可用内存挤爆，
    // 合成器抽帧时帧已被逐出 → "No frame found at position" 随机失败（2026-09-23 实测）。
    // 按当时可用内存给保守值：freemem/3，鑎在 256–600MB。
    offthreadVideoCacheSizeInBytes:
      opts.offthreadVideoCacheMb != null
        ? opts.offthreadVideoCacheMb * 1024 * 1024
        : Math.min(600 * 1024 * 1024, Math.max(256 * 1024 * 1024, Math.floor(os.freemem() / 3))),
    ...(opts.crf != null ? { crf: opts.crf } : {}),
    chromiumOptions,
    onProgress: (p) => {
      opts.onProgress?.({
        rendered: p.renderedFrames,
        total: durationInFrames,
        stage: p.stitchStage,
      });
    },
  });

  return { outFile: opts.outFile, durationInFrames, fps: timeline.meta.fps };
}

// 渲染合成后的单帧（含字幕/转场，与成片一致）→ PNG。供「看指定帧」工具与调试用。
// assetsDir 省略时取 DJIAN_ASSETS_DIR 环境变量或 monorepo 的 webui/public。
export async function renderFrame(opts: {
  timeline: unknown;
  timeSeconds: number;
  outFile: string; // PNG 绝对路径
  assetsDir?: string;
}): Promise<{ outFile: string; frame: number; width: number; height: number }> {
  const timeline: Timeline = parseTimeline(opts.timeline);
  const durationInFrames = Math.max(1, timelineDurationInFrames(timeline));
  const fps = timeline.meta.fps;
  const frame = Math.min(Math.max(0, Math.round(opts.timeSeconds * fps)), durationInFrames - 1);

  const assetsDir =
    opts.assetsDir ?? process.env.DJIAN_ASSETS_DIR ?? path.resolve(engineDir, "../../webui/public");
  const serveUrl = await getBundle(assetsDir);
  const composition = await selectComposition({
    serveUrl,
    id: "TimelineVideo",
    inputProps: { timeline },
    chromiumOptions,
  });

  fs.mkdirSync(path.dirname(opts.outFile), { recursive: true });
  await renderStill({
    composition,
    serveUrl,
    output: opts.outFile,
    frame,
    inputProps: { timeline },
    chromiumOptions,
    imageFormat: "png",
    overwrite: true,
  });
  return { outFile: opts.outFile, frame, width: timeline.meta.width, height: timeline.meta.height };
}
