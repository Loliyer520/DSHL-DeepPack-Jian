#!/usr/bin/env node
// 构建 D剪 .dspack（v3 容器）：packages/pack/src → dist/<name>-<version>.dspack
// 布局（pack-structure v3, profile 形态）：
//   dspack.json / manifest.json（ZIP 根）+ overrides/（profile 根）+ home/（home 级内容）
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(here, "../src");
const repoRoot = path.resolve(here, "../../..");
const outDir = path.join(repoRoot, "dist");

const manifest = JSON.parse(fs.readFileSync(path.join(srcDir, "manifest.json"), "utf-8"));
if (manifest.manifestVersion !== 5 || (manifest.type !== "profile" && manifest.type !== "dshhome")) {
  console.error("manifest 校验失败：需要 manifestVersion 5 且 type 为 profile/dshhome");
  process.exit(1);
}

const outName = `${manifest.name}-${manifest.version}.dspack`;
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, outName);

// 用系统 zip 打包（容器 = 纯 ZIP）
const staging = fs.mkdtempSync(path.join(os.tmpdir(), "djian-pack-"));
try {
  fs.copyFileSync(path.join(srcDir, "dspack.json"), path.join(staging, "dspack.json"));
  fs.copyFileSync(path.join(srcDir, "manifest.json"), path.join(staging, "manifest.json"));
  if (fs.existsSync(path.join(srcDir, "overrides"))) {
    fs.cpSync(path.join(srcDir, "overrides"), path.join(staging, "overrides"), { recursive: true });
  }
  if (fs.existsSync(path.join(srcDir, "home"))) {
    fs.cpSync(path.join(srcDir, "home"), path.join(staging, "home"), { recursive: true });
  }
  fs.rmSync(outFile, { force: true });
  execFileSync("zip", ["-r", "-X", outFile, "."], { cwd: staging, stdio: "pipe" });

  // 回读校验：根必须有 dspack.json 与 manifest.json，dspack.json 版本为 3
  const listing = execFileSync("unzip", ["-l", outFile], { encoding: "utf-8" });
  const dspackJson = JSON.parse(execFileSync("unzip", ["-p", outFile, "dspack.json"], { encoding: "utf-8" }));
  if (!listing.includes(" manifest.json") || dspackJson.format !== "dspack" || dspackJson.version !== 3) {
    console.error("打包后校验失败：ZIP 根 dspack.json/manifest.json 不符合 v3 契约");
    process.exit(1);
  }
  const { size } = fs.statSync(outFile);
  console.log(`完成：${outFile}（${(size / 1024).toFixed(1)} KB）`);
  console.log("内容：\n" + listing.split("\n").filter((l) => l.trim() && !l.startsWith("Archive") && !l.includes("Length")).slice(0, 30).join("\n"));
} finally {
  fs.rmSync(staging, { recursive: true, force: true });
}
