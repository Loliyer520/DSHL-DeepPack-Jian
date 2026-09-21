import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
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
  onProgress?: (p: { rendered: number; total: number; stage: string }) => void;
}

const engineDir = path.dirname(fileURLToPath(import.meta.url));
const entryPoint = path.resolve(engineDir, "../src/entry.tsx");

// 包级 bundle 缓存：同一进程内多次渲染只 bundle 一次
let bundleCache: { assetsDir: string; url: string } | null = null;

// selectComposition 和 renderMedia 各自都会拉起浏览器，必须给同一份 Chromium 选项
const chromiumOptions = { gl: "angle" as const };

async function getBundle(assetsDir: string, onLog?: (m: string) => void): Promise<string> {
  if (bundleCache && bundleCache.assetsDir === assetsDir) return bundleCache.url;
  const url = await bundle({
    entryPoint,
    publicDir: assetsDir,
    onProgress: () => {},
  });
  bundleCache = { assetsDir, url };
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
