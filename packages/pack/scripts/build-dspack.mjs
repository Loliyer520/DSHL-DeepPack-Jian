#!/usr/bin/env node
// 构建 D剪 .dspack（v3 容器）：packages/pack/src → dist/<name>-<version>.dspack（+ .sha256 旁注文件）
// 布局（pack-structure v3, profile 形态 + DSHL vendor 方言）：
//   dspack.json / manifest.json / pnpm-lock.yaml / pnpm-workspace.yaml（ZIP 根）
//   overrides/（profile 根）+ home/（home 级内容）
//   vendor/：manifest.dependencies 里 "vendor:<file>.tgz" 声明的自制包，npm pack 出 tgz，
//            sha256 与依赖快照写进 vendor/vendor.json；DSHL 按清单验哈希后直挂进 profile node_modules。
// 步骤：构建（引擎 tsc + 预构建渲染 bundle + 面板 bundle）→ 规范自检 → 叶子依赖检查 → 打包 → 回读校验。
// 用法：node packages/pack/scripts/build-dspack.mjs [--skip-build] [--check-only]
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(here, "../src");
const repoRoot = path.resolve(here, "../../..");
const outDir = path.join(repoRoot, "dist");
const args = new Set(process.argv.slice(2));
const isWin = process.platform === "win32";

const fail = (msg) => { console.error("✗ " + msg); process.exit(1); };
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf-8"));
const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
// Windows 便携 Node 只有 npm.cmd：.cmd 不是 PE 可执行文件，需要 shell 才能调用
const npm = (argv, opts = {}) => execFileSync(isWin ? "npm.cmd" : "npm", argv, { stdio: "pipe", encoding: "utf-8", ...(isWin ? { shell: true } : {}), ...opts });

const manifest = readJson(path.join(srcDir, "manifest.json"));
const pkgDirs = fs.readdirSync(path.join(repoRoot, "packages")).map((d) => path.join(repoRoot, "packages", d)).filter((d) => fs.existsSync(path.join(d, "package.json")));
const findPkg = (name) => pkgDirs.find((d) => readJson(path.join(d, "package.json")).name === name);

// ---------- 1. 构建 ----------
if (!args.has("--skip-build") && !args.has("--check-only")) {
  console.log("构建引擎、面板与预构建渲染包…");
  npm(["run", "build:engine"], { cwd: repoRoot });
  npm(["run", "build:client"], { cwd: repoRoot });
  // 预构建 Remotion bundle：安装后第一次取帧/导出无需 webpack（@remotion/bundler 不随包安装）
  const render = await import(pathToFileURL(path.join(repoRoot, "packages/engine/dist/render.js")).href);
  await render.buildBundle(render.PREBUILT_BUNDLE_DIR, undefined, { minify: true });
  console.log("  预构建渲染包：" + path.relative(repoRoot, render.PREBUILT_BUNDLE_DIR));
}

// ---------- 2. 规范自检（PackForge manifest v5 + DSHL 方言） ----------
const problems = [];
const check = (ok, msg) => { if (!ok) problems.push(msg); };
const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;
check(manifest.manifestVersion === 5, "manifestVersion 必须为 5");
check(manifest.type === "profile" || manifest.type === "dshhome", "type 必须为 profile 或 dshhome");
check(/^[a-z0-9][a-z0-9-]{1,40}$/.test(manifest.name ?? ""), "name 只能是小写字母、数字与连字符");
check(SEMVER.test(manifest.version ?? ""), "version 必须是语义化版本");
for (const field of ["displayName", "description"]) check(typeof manifest[field]?.["zh-CN"] === "string" && manifest[field]["zh-CN"].trim(), field + " 缺少 zh-CN 文案");
check(SEMVER.test(manifest.dshVersion ?? ""), "dshVersion 必须是精确版本");
check(!manifest.dshVersions || (Array.isArray(manifest.dshVersions) && manifest.dshVersions.includes(manifest.dshVersion)), "dshVersions 必须包含 dshVersion");
// launchers：完整形式，至少一个支持；不支持的写明原因
const launchers = manifest.launchers ?? {};
check(Object.values(launchers).some((l) => l?.supported === true), "launchers 至少要有一个 supported:true");
for (const [id, l] of Object.entries(launchers)) {
  check(typeof l === "object" && typeof l.supported === "boolean", "launchers." + id + " 需要 supported 布尔值");
  if (l?.supported === false) check(typeof l.reason === "string" && l.reason.trim(), "launchers." + id + " 不支持时需要 reason");
  if (l?.minVersion !== undefined) check(/^\d+(\.\d+){1,3}$/.test(l.minVersion), "launchers." + id + ".minVersion 格式无效");
}
check(Array.isArray(manifest.bundles) && manifest.bundles.length > 0, "bundles 不能为空");
// 依赖安全过滤：只允许精确版本或 vendor:<file>.tgz；拒绝 file:/link:/git/URL/范围
const deps = manifest.dependencies ?? {};
for (const [name, ref] of Object.entries(deps)) {
  if (typeof ref !== "string") { problems.push("依赖 " + name + " 的值必须是字符串"); continue; }
  if (ref.startsWith("vendor:")) check(/^vendor:[\w.@-]+\.tgz$/.test(ref), "依赖 " + name + " 的 vendor 引用无效：" + ref);
  else check(SEMVER.test(ref), "依赖 " + name + " 必须锁定精确版本（不允许范围/file:/link:/git/URL）：" + ref);
  check(!name.startsWith("@deepseek-ai/"), "宿主包 " + name + " 由 DSH 版本库提供，不要写进 dependencies（会造成双装）");
}
// services：只允许 node 运行 profile 内的脚本
for (const svc of manifest.services ?? []) {
  const where = "services." + (svc.name ?? "?");
  check(/^[a-z0-9-]+$/.test(svc.name ?? ""), where + " name 无效");
  check(svc.command === "node", where + " command 只允许 node");
  for (const a of svc.args ?? []) check(!path.isAbsolute(a) && !a.split(/[\\/]/).includes(".."), where + " 参数不能是绝对路径或跳出 profile：" + a);
  check(Number.isInteger(svc.port) && svc.port >= 1024 && svc.port <= 65535, where + " port 必须在 1024–65535");
  check(typeof svc.healthPath === "string" && svc.healthPath.startsWith("/"), where + " healthPath 必须以 / 开头");
  for (const k of Object.keys(svc.env ?? {})) check(/^[A-Z][A-Z0-9_]*$/.test(k) && !/^(PATH|NODE_OPTIONS)$/.test(k), where + " 不允许设置环境变量 " + k);
  const script = (svc.args ?? []).find((a) => a.endsWith(".mjs") || a.endsWith(".js"));
  const m = script && /node_modules\/(@[^/]+\/[^/]+|[^/]+)\//.exec(script.replaceAll("\\", "/"));
  if (m) check(Boolean(deps[m[1]]), where + " 运行的脚本属于未声明的包 " + m[1]);
}
check(fs.existsSync(path.join(srcDir, "overrides", "cordis.patch.yml")), "缺少 overrides/cordis.patch.yml");

// ---------- 3. vendor 包与叶子依赖检查 ----------
// DSHL 把 vendor tgz 直挂进 node_modules，不会再为它们解析依赖：
// vendor 包的依赖必须由 manifest 顶层依赖（精确同版本）或另一个 vendor 包满足；也不能带安装脚本。
const vendorDeps = Object.entries(deps).filter(([, v]) => typeof v === "string" && v.startsWith("vendor:"));
const vendorPkgs = [];
for (const [name, ref] of vendorDeps) {
  const dir = findPkg(name);
  if (!dir) { problems.push("找不到 vendor 包 " + name + " 的目录"); continue; }
  const pkg = readJson(path.join(dir, "package.json"));
  const expectFile = name.replace("@", "").replace("/", "-") + "-" + pkg.version + ".tgz";
  check(ref === "vendor:" + expectFile, "manifest 引用 " + ref + " 与 " + name + "@" + pkg.version + " 不符（应为 vendor:" + expectFile + "）");
  for (const s of ["preinstall", "install", "postinstall", "prepare"]) check(!pkg.scripts?.[s], name + " 不能带 " + s + " 脚本（直挂安装不会执行，也是安全风险）");
  check(Array.isArray(pkg.files) && pkg.files.length > 0, name + " 必须用 files 白名单限定发布内容");
  const required = { ...(pkg.dependencies ?? {}) };
  for (const [peer, range] of Object.entries(pkg.peerDependencies ?? {})) if (!pkg.peerDependenciesMeta?.[peer]?.optional) required[peer] = range;
  for (const [dep, range] of Object.entries(required)) {
    const top = deps[dep];
    if (top?.startsWith("vendor:")) {
      const other = readJson(path.join(findPkg(dep), "package.json"));
      check(other.version === range, name + " 依赖 " + dep + "@" + range + "，但 vendor 里是 " + other.version);
    } else check(top === range, name + " 依赖 " + dep + "@" + range + "，manifest 顶层需要同版本声明（当前：" + (top ?? "无") + "）");
  }
  vendorPkgs.push({ name, dir, pkg, file: expectFile });
}
// 锁文件与 manifest 的非 vendor 依赖一致（DSHL 用冻结安装，不一致会直接失败）
const lockFile = path.join(srcDir, "pnpm-lock.yaml");
if (fs.existsSync(lockFile)) {
  const lock = fs.readFileSync(lockFile, "utf-8");
  const importer = /importers:\s*\n\s*\.:\s*\n\s*dependencies:\s*\n([\s\S]*?)(?:\n\S|\npackages:)/.exec(lock)?.[1] ?? "";
  const locked = new Map([...importer.matchAll(/^ {6}'?([^':\s]+)'?:\s*\n {8}specifier: (\S+)/gm)].map((m) => [m[1], m[2]]));
  const wanted = Object.entries(deps).filter(([, v]) => !v.startsWith("vendor:"));
  for (const [name, version] of wanted) check(locked.get(name) === version, "pnpm-lock.yaml 与 manifest 不一致：" + name + " 锁定 " + (locked.get(name) ?? "无") + "，manifest " + version);
  for (const name of locked.keys()) check(name in deps, "pnpm-lock.yaml 多出 manifest 未声明的依赖 " + name);
}
// 引擎必须随附与源码一致的预构建渲染包
const engine = vendorPkgs.find((v) => v.name === "@djian/engine");
if (engine && !args.has("--check-only")) {
  const stamp = path.join(engine.dir, "bundle", "djian-bundle.json");
  check(fs.existsSync(stamp) && fs.existsSync(path.join(engine.dir, "bundle", "index.html")), "@djian/engine 缺少预构建渲染包（去掉 --skip-build 重新构建）");
  if (fs.existsSync(stamp)) {
    const render = await import(pathToFileURL(path.join(engine.dir, "dist/render.js")).href);
    check(readJson(stamp).hash === render.sourceHash(), "@djian/engine 预构建渲染包与源码不一致（去掉 --skip-build 重新构建）");
  }
}
if (problems.length) fail("规范自检未通过：\n  - " + problems.join("\n  - "));
console.log("✓ 规范自检通过（manifest v5、launchers、依赖安全、services、vendor 叶子依赖、锁文件、预构建渲染包）");
if (args.has("--check-only")) process.exit(0);

// ---------- 4. 打包 ----------
const outName = manifest.name + "-" + manifest.version + ".dspack";
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, outName);
const staging = fs.mkdtempSync(path.join(os.tmpdir(), "djian-pack-"));
try {
  for (const f of ["dspack.json", "manifest.json", "pnpm-lock.yaml", "pnpm-workspace.yaml"]) {
    if (fs.existsSync(path.join(srcDir, f))) fs.copyFileSync(path.join(srcDir, f), path.join(staging, f));
  }
  for (const d of ["overrides", "home"]) {
    if (fs.existsSync(path.join(srcDir, d))) fs.cpSync(path.join(srcDir, d), path.join(staging, d), { recursive: true });
  }
  const vendorIndex = [];
  if (vendorPkgs.length) {
    const vendorDir = path.join(staging, "vendor");
    fs.mkdirSync(vendorDir, { recursive: true });
    for (const v of vendorPkgs) {
      npm(["pack", v.dir, "--pack-destination", vendorDir]);
      const tgz = path.join(vendorDir, v.file);
      if (!fs.existsSync(tgz)) fail("npm pack 未产出 " + v.file);
      const buf = fs.readFileSync(tgz);
      vendorIndex.push({
        name: v.name, version: v.pkg.version, file: v.file, sha256: sha256(buf), bytes: buf.length,
        // 依赖快照：安装器/审计可据此确认直挂包不需要额外解析
        dependencies: v.pkg.dependencies ?? {}, peerDependencies: v.pkg.peerDependencies ?? {},
      });
      console.log("  vendor: " + v.name + "@" + v.pkg.version + " → " + v.file + "（" + (buf.length / 1024).toFixed(1) + " KB）");
    }
    fs.writeFileSync(path.join(vendorDir, "vendor.json"), JSON.stringify({ format: "djian-vendor", version: 1, packages: vendorIndex }, null, 2));
  }

  fs.rmSync(outFile, { force: true });
  // DSHL 按 ZIP 规范读取 .dspack。Windows 的 tar -a 可能产出 TAR 容器，改用 .NET ZipFile 生成真正的 ZIP
  // （不依赖可能缺失的 PowerShell Archive 模块）；Linux/macOS 用 zip。
  if (isWin) {
    const q = (v) => "'" + v.replaceAll("'", "''") + "'";
    const script = "Add-Type -AssemblyName System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::CreateFromDirectory(" + q(staging) + ", " + q(outFile) + ", [IO.Compression.CompressionLevel]::Optimal, $false)";
    execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", script], { stdio: "pipe" });
  } else {
    execFileSync("zip", ["-r", "-X", outFile, "."], { cwd: staging, stdio: "pipe" });
  }

  // ---------- 5. 回读校验 ----------
  // PATH 里的 tar 可能是 Git Bash 的 GNU tar（不认 ZIP、把盘符当远程主机）：显式用 System32 的 bsdtar，
  // 并在输出目录里用纯文件名调用，避开 host:path 语法。
  const winTar = path.join(process.env.SystemRoot || "C:\\Windows", "System32", "tar.exe");
  const tarOpts = { cwd: path.dirname(outFile), encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 };
  const outBase = path.basename(outFile);
  const listing = isWin ? execFileSync(winTar, ["-t", "-f", outBase], tarOpts) : execFileSync("unzip", ["-Z1", outFile], { encoding: "utf-8" });
  const entries = new Set(listing.split(/\r?\n/).map((l) => l.trim().replaceAll("\\", "/")).filter(Boolean));
  const readEntry = (entry) => isWin ? execFileSync(winTar, ["-x", "-O", "-f", outBase, entry], tarOpts) : execFileSync("unzip", ["-p", outFile, entry], { encoding: "utf-8" });
  const dspackJson = JSON.parse(readEntry("dspack.json"));
  if (!entries.has("manifest.json") || dspackJson.format !== "dspack" || dspackJson.version !== 3) fail("打包后校验失败：ZIP 根 dspack.json/manifest.json 不符合 v3 契约");
  if (vendorIndex.length) {
    const vj = JSON.parse(readEntry("vendor/vendor.json"));
    for (const e of vj.packages) if (!entries.has("vendor/" + e.file)) fail("打包后校验失败：ZIP 缺 vendor/" + e.file);
    console.log("✓ vendor 校验通过：" + vj.packages.length + " 个包");
  }
  const buf = fs.readFileSync(outFile);
  const digest = sha256(buf);
  fs.writeFileSync(outFile + ".sha256", digest + "  " + outName + "\n");
  console.log("完成：" + path.relative(repoRoot, outFile) + "（" + (buf.length / 1048576).toFixed(2) + " MB）");
  console.log("sha256：" + digest + "（已写入 " + outName + ".sha256）");
  console.log("内容：\n  " + [...entries].filter((e) => !e.endsWith("/")).slice(0, 40).join("\n  "));
} finally {
  fs.rmSync(staging, { recursive: true, force: true });
}
