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
  // Include a lockfile when supplied so DSHL can use the fast deterministic
  // frozen install path instead of resolving hundreds of packages again.
  if (fs.existsSync(path.join(srcDir, "pnpm-lock.yaml"))) {
    fs.copyFileSync(path.join(srcDir, "pnpm-lock.yaml"), path.join(staging, "pnpm-lock.yaml"));
  }
  if (fs.existsSync(path.join(srcDir, "pnpm-workspace.yaml"))) {
    fs.copyFileSync(path.join(srcDir, "pnpm-workspace.yaml"), path.join(staging, "pnpm-workspace.yaml"));
  }
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
      // Windows 的便携 Node 发行版只提供 npm.cmd；直接 spawn npm 会在 DSHL
      // 的运行环境中得到 ENOENT。显式选扩展名，开发机和启动器环境一致。
      const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
      execFileSync(npmCommand, ["pack", dir, "--pack-destination", vendorDir], {
        stdio: "pipe",
        // .cmd 不是 PE 可执行文件，Node 24 的 Windows spawn 需要 shell 才能调用它。
        ...(process.platform === "win32" ? { shell: true } : {}),
      });
      const tgz = path.join(vendorDir, file);
      if (!fs.existsSync(tgz)) { console.error(`vendor 失败：npm pack 未产出 ${file}`); process.exit(1); }
      const buf = fs.readFileSync(tgz);
      vendorIndex.push({ name, version: pkgJson.version, file, sha256: crypto.createHash("sha256").update(buf).digest("hex"), bytes: buf.length });
      console.log(`  vendor: ${name}@${pkgJson.version} → ${file}（${(buf.length / 1024).toFixed(1)} KB）`);
    }
    fs.writeFileSync(path.join(vendorDir, "vendor.json"), JSON.stringify({ format: "djian-vendor", version: 1, packages: vendorIndex }, null, 2));
  }

  fs.rmSync(outFile, { force: true });
  // Windows 的 tar -a 只会自动选择压缩算法，仍可能产出 TAR 容器，
  // 而 DSHL 按 ZIP 规范读取 .dspack。使用 .NET ZipFile 生成真正的 ZIP；
  // 不依赖 PowerShell Archive 模块（精简 Windows 环境可能未安装该模块）。
  // Linux/macOS 继续使用 zip。
  const archiveEntries = fs.readdirSync(staging);
  if (process.platform === "win32") {
    const psQuote = (value) => `'${value.replaceAll("'", "''")}'`;
    const script = `Add-Type -AssemblyName System.IO.Compression.FileSystem; if (Test-Path ${psQuote(outFile)}) { Remove-Item -LiteralPath ${psQuote(outFile)} -Force }; [IO.Compression.ZipFile]::CreateFromDirectory(${psQuote(staging)}, ${psQuote(outFile)}, [IO.Compression.CompressionLevel]::Optimal, $false)`;
    execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", script], { stdio: "pipe" });
  } else {
    execFileSync("zip", ["-r", "-X", outFile, "."], { cwd: staging, stdio: "pipe" });
  }

  // 回读校验：根必须有 dspack.json 与 manifest.json，dspack.json 版本为 3
  const listing = process.platform === "win32"
    ? execFileSync("tar.exe", ["-t", "-f", outFile], { encoding: "utf-8" })
    : execFileSync("unzip", ["-l", outFile], { encoding: "utf-8" });
  const readArchive = (entry) => process.platform === "win32"
    ? execFileSync("tar.exe", ["-xOf", outFile, entry], { encoding: "utf-8" })
    : execFileSync("unzip", ["-p", outFile, entry], { encoding: "utf-8" });
  const dspackJson = JSON.parse(readArchive("dspack.json"));
  if (!listing.includes("manifest.json") || dspackJson.format !== "dspack" || dspackJson.version !== 3) {
    console.error("打包后校验失败：ZIP 根 dspack.json/manifest.json 不符合 v3 契约");
    process.exit(1);
  }
  // vendor 回读校验：vendor.json 在包内且每个声明文件都在 ZIP 里
  if (vendorIndex.length > 0) {
    const vj = JSON.parse(readArchive("vendor/vendor.json"));
    for (const entry of vj.packages) {
      if (!listing.includes(`vendor/${entry.file}`)) { console.error(`打包后校验失败：ZIP 缺 vendor/${entry.file}`); process.exit(1); }
    }
    console.log(`vendor 校验通过：${vj.packages.length} 个包`);
  }
  const { size } = fs.statSync(outFile);
  console.log(`完成：${outFile}（${(size / 1024).toFixed(1)} KB）`);
  console.log("内容：\n" + listing.split("\n").filter((l) => l.trim() && !l.startsWith("Archive") && !l.includes("Length")).slice(0, 30).join("\n"));
} finally {
  fs.rmSync(staging, { recursive: true, force: true });
}
