#!/usr/bin/env node
// djian-render <timeline.json> -o <out.mp4> [--assets <dir>] [--concurrency <n>]
// JSON 时间线进 → mp4 出。素材默认相对时间线文件所在目录解析。
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { renderVideo } from "../dist/render.js";

const args = process.argv.slice(2);
const usage = "用法: djian-render <timeline.json> -o <out.mp4> [--assets <dir>] [--concurrency <n>]";

if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
  console.log(usage);
  process.exit(args.length === 0 ? 1 : 0);
}

const timelinePath = args[0];
const outIdx = args.indexOf("-o");
const assetsIdx = args.indexOf("--assets");
const concIdx = args.indexOf("--concurrency");

if (outIdx === -1 || !args[outIdx + 1]) {
  console.error(usage);
  process.exit(1);
}

const timelineAbs = path.resolve(timelinePath);
if (!fs.existsSync(timelineAbs)) {
  console.error(`时间线文件不存在：${timelineAbs}`);
  process.exit(1);
}

const outFile = path.resolve(args[outIdx + 1]);
const assetsDir = assetsIdx !== -1 && args[assetsIdx + 1]
  ? path.resolve(args[assetsIdx + 1])
  : path.dirname(timelineAbs);
const concurrency = concIdx !== -1 && args[concIdx + 1] ? Number(args[concIdx + 1]) : undefined;

const started = Date.now();
let lastPrint = 0;

try {
  const result = await renderVideo({
    timeline: fs.readFileSync(timelineAbs, "utf-8"),
    outFile,
    assetsDir,
    concurrency,
    onProgress: (p) => {
      const now = Date.now();
      if (now - lastPrint > 2000 || p.rendered === p.total) {
        lastPrint = now;
        console.log(`[${p.stage}] ${p.rendered}/${p.total}`);
      }
    },
  });
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`完成：${result.outFile}（${result.durationInFrames} 帧 @ ${result.fps}fps，耗时 ${secs}s）`);
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
