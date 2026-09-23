#!/usr/bin/env node
// 构建 D剪 .dspack（v3 容器）：packages/pack/src → dist/<name>-<version>.dspack
// 布局（pack-structure v3, profile 形态 + vendor 扩展）：
//   dspack.json / manifest.json（ZIP 根）+ overrides/（profile 根）+ home/（home 级内容）
//   vendor/（B2 自制扩展）：manifest.dependencies 里 "vendor:<file>.tgz" 声明的包，
//   构建时 npm pack 出 tgz + sha256 写进 vendor.json；安装器按 vendor.json 验哈希后解进 profile node_modules。
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
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

  // vendor 打包：dependencies 里 "vendor:<file>.tgz" → npm pack 实包进 vendor/ + sha256 清单
  const vendorDeps = Object.entries(manifest.dependencies ?? {}).filter(([, v]) => typeof v === "string" && v.startsWith("vendor:"));
  const vendorIndex = [];
  if (vendorDeps.length > 0) {
    const vendorDir = path.join(staging, "vendor");
    fs.mkdirSync(vendorDir, { recursive: true });
    // 按 name 反查包目录（packages/*/package.json）
    const pkgDirs = fs.readdirSync(path.join(repoRoot, "packages")).map((d) => path.join(repoRoot, "packages", d));
    for (const [name, ref] of vendorDeps) {
      const file = ref.slice("vendor:".length);
      const dir = pkgDirs.find((d) => {
        try { return JSON.parse(fs.readFileSync(path.join(d, "package.json"), "utf-8")).name === name; } catch { return false; }
      });
      if (!dir) { console.error(`vendor 失败：找不到 ${name} 的包目录`); process.exit(1); }
      const pkgJson = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf-8"));
      const expectFile = `${name.replace("@", "").replace("/", "-")}-${pkgJson.version}.tgz`;
      if (file !== expectFile) { console.error(`vendor 失败：manifest 引用 ${file} 与 ${name}@${pkgJson.version} 不符（应为 ${expectFile}）`); process.exit(1); }
      execFileSync("npm", ["pack", dir, "--pack-destination", vendorDir], { stdio: "pipe" });
      const tgz = path.join(vendorDir, file);
      if (!fs.existsSync(tgz)) { console.error(`vendor 失败：npm pack 未产出 ${file}`); process.exit(1); }
      const buf = fs.readFileSync(tgz);
      vendorIndex.push({ name, version: pkgJson.version, file, sha256: crypto.createHash("sha256").update(buf).digest("hex"), bytes: buf.length });
      console.log(`  vendor: ${name}@${pkgJson.version} → ${file}（${(buf.length / 1024).toFixed(1)} KB）`);
    }
    fs.writeFileSync(path.join(vendorDir, "vendor.json"), JSON.stringify({ format: "djian-vendor", version: 1, packages: vendorIndex }, null, 2));
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
  // vendor 回读校验：vendor.json 在包内且每个声明文件都在 ZIP 里
  if (vendorIndex.length > 0) {
    const vj = JSON.parse(execFileSync("unzip", ["-p", outFile, "vendor/vendor.json"], { encoding: "utf-8" }));
    for (const entry of vj.packages) {
      if (!listing.includes(` vendor/${entry.file}`)) { console.error(`打包后校验失败：ZIP 缺 vendor/${entry.file}`); process.exit(1); }
    }
    console.log(`vendor 校验通过：${vj.packages.length} 个包`);
  }
  const { size } = fs.statSync(outFile);
  console.log(`完成：${outFile}（${(size / 1024).toFixed(1)} KB）`);
  console.log("内容：\n" + listing.split("\n").filter((l) => l.trim() && !l.startsWith("Archive") && !l.includes("Length")).slice(0, 30).join("\n"));
} finally {
  fs.rmSync(staging, { recursive: true, force: true });
}
