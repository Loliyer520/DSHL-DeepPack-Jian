// D剪 webui 后端：静态服务 + /api/chat（SDK 驱动完整 dsh agent 运行时）
// agent 通过 MCP 工具 apply_timeline_ops 改时间线 → 本服务收集 → run 结束后随响应下发给前端执行。
// 密钥：运行时读 /my/pro/api/.env 的 GLM 上游注入 DJIAN_LLM_KEY（不落库不打印）。
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { DeepSeekHarness } from "@deepseek-ai/dsh-sdk-client";
import { execFileSync } from "node:child_process";
import { renderFrame, renderVideo, invalidateBundle } from "@djian/engine/dist/render.js";
import { parseTimeline } from "@djian/engine/dist/schema.js";
import { expandAnimationPreset, listAnimationPresets } from "@djian/engine/dist/presets.js";
import { FONTS, fontById } from "@djian/engine/dist/fonts.js";

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
const PORT = Number(process.env.PORT || 5180);
// 开发态使用仓库根；vendor 安装态使用 DSHL 传入的 profile 工作目录。
// 这两种路径都不能依赖当前源码仓库的相对层级。
const DJIAN = process.env.DJIAN_WORK || process.cwd();
const PACK_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// 内置字体目录：vendor 安装态 = node_modules/@djian/engine/fonts，开发态经 workspaces 解析
const FONTS_DIR = (() => {
  try {
    const require2 = createRequire(import.meta.url);
    return path.join(path.dirname(require2.resolve("@djian/engine/package.json")), "fonts");
  } catch {
    return path.join(PACK_ROOT, "engine-fonts");
  }
})();
const PATCH = process.env.DJIAN_PATCH ||
  (fs.existsSync(path.join(PACK_ROOT, "patch/cordis.patch.yml"))
    ? path.join(PACK_ROOT, "patch/cordis.patch.yml")
    : path.join(DJIAN, "packages/agent/djian.cordis.yml"));

// ---- 密钥与模型路由 ----
function loadKashicEnv() {
  try {
    const out = {};
    for (const line of fs.readFileSync("/my/pro/api/.env", "utf8").split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
    return out;
  } catch {
    return {};
  }
}
const kashic = loadKashicEnv();
process.env.DJIAN_LLM_KEY = process.env.DJIAN_LLM_KEY || kashic.OPENAI_API_KEY || "";
const MODEL = process.env.DJIAN_MODEL || kashic.OPENAI_MODEL || "glm-5.3-flash";
const AI_READY = Boolean(process.env.DJIAN_LLM_KEY);

// ---- dsh harness（懒启动，跨请求常驻；一个 dsh 会话对应一个 djian 会话） ----
let harness = null;
let harnessStarting = null;
const dshSessionByDjian = new Map(); // djianSessionId -> dsh sessionId

async function getHarness() {
  if (harness) return harness;
  if (harnessStarting) return harnessStarting;
  harnessStarting = (async () => {
    const h = new DeepSeekHarness({
      // sdk-client 0.1.5+ 新 API：profile/patches 顶层字段（旧式 launch:{command,args} 会被静默忽略）
      profile: "sdk",
      patches: [PATCH],
      processCwd: DJIAN,
      provider: "deepseek-official",
      model: MODEL,
      maxTokens: 8192,
    });
    await h.start();
    harness = h;
    harnessStarting = null;
    console.log("dsh harness booted");
    return h;
  })();
  return harnessStarting;
}

// ---- MCP 工具回传收集 ----
let pendingOps = []; // run 期间由 MCP server POST 进来，run 结束后 drain
let lastTimeline = null; // 前端随 /api/chat 上报的最近时间线（供 get_timeline 工具读）
let exportJob = null; // 导出任务：{ status: rendering|done|error, progress, outFile, result?, error? }

// 帧画面分析：ffmpeg 缩到 96×54 抽原始 RGB，算亮度/黑场/主色/底部字幕区亮像素占比——
// 给不支持图像输入的文本模型一份「能读懂的画面数据」。
function analyzeFrame(pngPath) {
  const W = 96, H = 54;
  const raw = execFileSync(
    "ffmpeg",
    ["-v", "error", "-i", pngPath, "-vf", `scale=${W}:${H}`, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
    { maxBuffer: 1 << 22 }
  );
  const n = W * H;
  let sum = 0, sumSq = 0, dark = 0;
  const buckets = new Map();
  const lumAt = (x, y) => {
    const i = (y * W + x) * 3;
    return 0.299 * raw[i] + 0.587 * raw[i + 1] + 0.114 * raw[i + 2];
  };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 3;
      const r = raw[i], g = raw[i + 1], b = raw[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      sum += lum;
      sumSq += lum * lum;
      if (lum < 16) dark++;
      const key = `${r >> 6},${g >> 6},${b >> 6}`;
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }
  }
  const avgBrightness = Math.round(sum / n);
  const contrast = Math.round(Math.sqrt(Math.max(0, sumSq / n - avgBrightness * avgBrightness)));
  const darkPercent = Math.round((dark / n) * 100);
  const dominant = [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k, c]) => {
      const [rq, gq, bq] = k.split(",").map(Number);
      return { rgb: [rq * 64 + 32, gq * 64 + 32, bq * 64 + 32], percent: Math.round((c / n) * 100) };
    });
  // 底部 1/3 区域（字幕常位）亮像素占比——白色字幕检测代理
  let bottomBright = 0, bottomN = 0;
  for (let y = Math.floor((H * 2) / 3); y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (lumAt(x, y) > 200) bottomBright++;
      bottomN++;
    }
  }
  const bottomBrightPercent = Math.round((bottomBright / bottomN) * 1000) / 10;
  return {
    avgBrightness, // 0-255，<16 基本黑场，>240 基本白场
    contrast, // 亮度标准差，<10 接近纯色画面
    darkPercent, // 接近黑像素(lum<16)的占比
    dominantColors: dominant, // 前 3 主色及占比
    bottomThirdBrightPercent: bottomBrightPercent, // 底部 1/3 区域亮像素(>200)占比，有白字幕时通常 1%~15%
  };
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let buf = "";
    req.on("data", (c) => {
      buf += c;
      if (buf.length > 1_000_000) {
        req.destroy();
        reject(new Error("请求体超过 1MB 上限")); // 只 destroy 不 reject 会让调用方永远挂起
      }
    });
    req.on("end", () => resolve(buf));
    req.on("error", reject);
  });
}

// 二进制上传用（素材库），上限 512MB
function readBodyRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      chunks.push(c);
      size += c.length;
      if (size > 512 * 1024 * 1024) {
        req.destroy();
        reject(new Error("上传超过 512MB 上限"));
      }
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const json = (res, code, obj) => {
  const h = { "Content-Type": "application/json" };
  if (res._aco) h["Access-Control-Allow-Origin"] = res._aco;
  res.writeHead(code, h);
  res.end(JSON.stringify(obj));
};

// ---- ops 校验归一化：容忍模型把格式写歪 ----
// 合法形：{op:"updateClip",...} / {type:"updateClip",...}；走样形：{"updateClip":{...}} 或 {"removeOverlay":0}
const OPS_NEEDING_ID = new Set(["removeClip"]);
const OPS_NEEDING_INDEX = new Set(["removeOverlay", "updateOverlay"]);
const VALID_OPS = new Set(["addClip", "removeClip", "updateClip", "reorderClips", "addOverlay", "removeOverlay", "updateOverlay", "setMeta", "addAudio", "removeAudio", "updateAudioTrack", "splitClip"]);

// 画布 meta 消毒：fps 1-120 整数；宽/高 16-7680 且偶数对齐（h264 要求）
function sanitizeMetaPatch(p) {
  const out = {};
  if (!p || typeof p !== "object") return out;
  if (Number.isInteger(p.fps)) out.fps = Math.min(120, Math.max(1, p.fps));
  if (Number.isFinite(p.width)) out.width = Math.min(7680, Math.max(16, Math.round(p.width / 2) * 2));
  if (Number.isFinite(p.height)) out.height = Math.min(7680, Math.max(16, Math.round(p.height / 2) * 2));
  return out;
}

// transition 消毒：fade-in/fadein→fade，其它非法值剔除
function fixTransition(v) {
  if (v === "fade" || v === "none") return v;
  if (typeof v === "string" && v.toLowerCase().startsWith("fade")) return "fade";
  return undefined;
}
// v3 净化：非法值丢弃而不是入库（坏值会让 parseTimeline 拒载、项目变砖）
const SPEC_FILTER = { brightness: [0, 3], contrast: [0, 3], saturate: [0, 3], blur: [0, 20], grayscale: [0, 1], sepia: [0, 1], hueRotate: [0, 360] };
const sanitizeFilter = (f) => {
  if (!f || typeof f !== "object") return undefined;
  const out = {};
  for (const [k, [lo, hi]] of Object.entries(SPEC_FILTER)) {
    const v = Number(f[k]);
    if (Number.isFinite(v)) out[k] = Math.min(hi, Math.max(lo, v));
  }
  return Object.keys(out).length ? out : undefined;
};
const VALID_EASINGS = new Set(["linear", "in", "out", "inOut", "bounce", "elastic"]);
const sanitizeAnimations = (a) => {
  if (!a || typeof a !== "object") return undefined;
  const kfOk = (arr) => Array.isArray(arr) && arr.length > 0 && arr.every((k) => k && Number.isFinite(Number(k.t)) && Number.isFinite(Number(k.v)));
  const out = {};
  for (const ch of ["x", "y", "scale", "opacity", "rotation", "volume"]) {
    if (kfOk(a[ch])) out[ch] = a[ch].map((k) => ({ t: Number(k.t), v: Number(k.v), ...(VALID_EASINGS.has(k.e) ? { e: k.e } : {}) }));
  }
  return Object.keys(out).length ? out : undefined;
};
const sanitizeSpeed = (v) => {
  const s = Number(v);
  return Number.isFinite(s) ? Math.min(10, Math.max(0.1, s)) : undefined;
};
// 分割后右半段的关键帧时间轴平移（左半段不变，越界帧由求值器牗住）
const shiftAnims = (anims, off) => {
  if (!anims || typeof anims !== "object") return undefined;
  const out = {};
  for (const ch of Object.keys(anims)) {
    if (!Array.isArray(anims[ch])) continue;
    out[ch] = anims[ch].map((k) => ({ t: Math.max(0, Number(k.t) - off), v: Number(k.v), ...(VALID_EASINGS.has(k.e) ? { e: k.e } : {}) }));
  }
  return Object.keys(out).length ? out : undefined;
};

function sanitizeOp(op) {
  if (op.op === "updateClip" && op.patch && typeof op.patch === "object") {
    if (op.patch.animationPreset !== undefined) {
      // 占位直通：applyOpsToTimeline 里拿到 clip 时长后展开；""/none 表示清除动画
      if (typeof op.patch.animationPreset !== "string") delete op.patch.animationPreset;
    }
    if (op.patch.speed !== undefined) {
      const s = sanitizeSpeed(op.patch.speed);
      if (s !== undefined) op.patch.speed = s;
      else delete op.patch.speed;
    }
    if (op.patch.filter !== undefined) {
      if (op.patch.filter && typeof op.patch.filter === "object" && !Array.isArray(op.patch.filter)) op.patch.filter = sanitizeFilter(op.patch.filter) ?? {};
      else delete op.patch.filter;
    }
    if (op.patch.animations !== undefined) {
      if (op.patch.animations && typeof op.patch.animations === "object" && !Array.isArray(op.patch.animations)) op.patch.animations = sanitizeAnimations(op.patch.animations) ?? {};
      else delete op.patch.animations;
    }
  }
  if (op.op === "setMeta") {
    const patch = sanitizeMetaPatch(op.patch ?? op);
    if (!Object.keys(patch).length) throw new Error("setMeta 缺少有效的 fps/width/height");
    op.patch = patch;
  }
  if (op.patch && op.patch.transition !== undefined) {
    const t = fixTransition(op.patch.transition);
    if (t === undefined) delete op.patch.transition;
    else op.patch.transition = t;
  }
  if (op.op === "addClip" && op.transition !== undefined) {
    const t = fixTransition(op.transition);
    if (t === undefined) delete op.transition;
    else op.transition = t;
  }
  return op;
}

function normalizeOps(rawOps) {
  const accepted = [];
  const rejected = [];
  (Array.isArray(rawOps) ? rawOps : []).forEach((o, index) => {
    let op = o;
    try {
      if (op && typeof op === "object" && !Array.isArray(op)) {
        let name = op.op ?? op.type;
        // 单键走样形：{"updateClip":{...}} / {"removeOverlay":0}
        if (typeof name !== "string") {
          const keys = Object.keys(op);
          if (keys.length === 1 && VALID_OPS.has(keys[0])) {
            const v = op[keys[0]];
            op = typeof v === "object" && v !== null && !Array.isArray(v) ? { op: keys[0], ...v } : { op: keys[0], index: v };
            name = keys[0];
          }
        } else {
          op = { ...op, op: name };
          delete op.type;
        }
        if (typeof name === "string" && VALID_OPS.has(name)) {
          if (OPS_NEEDING_ID.has(name) && typeof op.id !== "string") throw new Error("缺少 id");
          if (OPS_NEEDING_INDEX.has(name) && !Number.isInteger(op.index)) throw new Error("缺少 index");
          if (name === "updateClip" && (typeof op.id !== "string" || typeof op.patch !== "object")) throw new Error("缺少 id/patch");
          if (name === "updateOverlay" && typeof op.patch !== "object") throw new Error("缺少 patch");
          if (name === "reorderClips" && !Array.isArray(op.order)) throw new Error("缺少 order 数组");
          if (name === "addOverlay" && typeof op.text !== "string") throw new Error("缺少 text");
          if (name === "addAudio" && typeof op.src !== "string") throw new Error("addAudio 缺少 src");
          if ((name === "addClip" || name === "addAudio") && typeof op.src === "string" && !fs.existsSync(path.join(assetsPath(currentProjectId()), op.src)))
            throw new Error(`素材库里没有「${op.src}」（素材按项目隔离，其他项目的同名素材不通用）：先 asset_list 确认，缺了用 search_media/download_media 下载后再 addClip`);
          if (name === "updateAudioTrack" && (typeof op.id !== "string" || typeof op.patch !== "object")) throw new Error("updateAudioTrack 缺少 id/patch");
          if (name === "splitClip" && (typeof op.id !== "string" || !Number.isFinite(Number(op.atSeconds)))) throw new Error("splitClip 缺少 id/atSeconds");
          accepted.push(sanitizeOp(op));
          return;
        }
      }
      throw new Error("无法识别的操作格式");
    } catch (e) {
      rejected.push({ index, reason: e.message });
    }
  });
  return { accepted, rejected };
}

// ---- 项目制持久化（~/.djian/projects/<id>/ 是唯一事实源）+ 服务端直接应用 ops ----
// Windows 原生 HOME 常未设：fallback "/root" 会被解析成盘根 C:\root\.djian——改随 DJIAN（profile 根）落盘
const DJIAN_HOME = process.env.HOME ? path.join(process.env.HOME, ".djian") : path.join(DJIAN, ".djian");
const PROJECTS_DIR = path.join(DJIAN_HOME, "projects");
const CURRENT_FILE = path.join(DJIAN_HOME, "current");
const SESSIONS_FILE = path.join(DJIAN_HOME, "sessions.json"); // dsh sessionId -> djian projectId（会话=项目）
const LEGACY_TIMELINE = path.join(DJIAN_HOME, "timeline.json");
const EMPTY_TIMELINE = { meta: { fps: 30, width: 1280, height: 720 }, videoTracks: [{ id: "v1", name: "主轨道", clips: [] }], audioTracks: [], overlays: [], version: 2 };

const sanitizeId = (s) => String(s ?? "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
const newProjectId = () => "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const projectDir = (id) => path.join(PROJECTS_DIR, id);
const timelinePath = (id) => path.join(projectDir(id), "timeline.json");
const assetsPath = (id) => path.join(projectDir(id), "assets");
// 时间线引用了当前项目素材库中不存在的 src 时，渲染会以误导性的「Format error」失败——收集出来供报错提示
const collectMissingAssets = (timeline) => {
  const dir = assetsPath(currentProjectId());
  const srcs = new Set();
  for (const tr of timeline.videoTracks ?? []) for (const c of tr.clips) if (c.src) srcs.add(c.src);
  for (const tr of timeline.audioTracks ?? []) for (const c of tr.clips) if (c.src) srcs.add(c.src);
  return [...srcs].filter((s) => !fs.existsSync(path.join(dir, String(s))));
};
const thumbsPath = (id) => path.join(projectDir(id), ".thumbs");

function readProjectMeta(id) {
  try { return JSON.parse(fs.readFileSync(path.join(projectDir(id), "project.json"), "utf8")); } catch { return null; }
}
function writeProjectMeta(id, meta) {
  fs.mkdirSync(projectDir(id), { recursive: true });
  fs.writeFileSync(path.join(projectDir(id), "project.json"), JSON.stringify(meta, null, 2));
}
function listProjects() {
  try {
    return fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => {
        const meta = readProjectMeta(d.name) ?? {};
        let tmeta = null;
        try { tmeta = JSON.parse(fs.readFileSync(timelinePath(d.name), "utf8")).meta ?? null; } catch {}
        return { id: d.name, name: meta.name ?? d.name, createdAt: meta.createdAt ?? null, meta: tmeta };
      })
      .sort((a, b) => String(a.createdAt ?? "").localeCompare(String(b.createdAt ?? "")));
  } catch { return []; }
}
function createProject(name, meta) {
  const id = newProjectId();
  fs.mkdirSync(assetsPath(id), { recursive: true });
  writeProjectMeta(id, { name: name || "未命名项目", createdAt: new Date().toISOString() });
  const t = structuredClone(EMPTY_TIMELINE);
  Object.assign(t.meta, sanitizeMetaPatch(meta));
  fs.writeFileSync(timelinePath(id), JSON.stringify(t, null, 2));
  return id;
}
function setCurrentProject(id) {
  fs.mkdirSync(DJIAN_HOME, { recursive: true });
  fs.writeFileSync(CURRENT_FILE, id);
}
function currentProjectId() {
  let id = null;
  try { id = sanitizeId(fs.readFileSync(CURRENT_FILE, "utf8").trim()); } catch {}
  if (id && fs.existsSync(projectDir(id))) return id;
  const projects = listProjects();
  if (projects.length) { setCurrentProject(projects[0].id); return projects[0].id; }
  // 迁移：旧全局 timeline.json → default 项目，顺手把 public 里的散装素材搬进来
  const nid = createProject("默认项目");
  try {
    const legacy = JSON.parse(fs.readFileSync(LEGACY_TIMELINE, "utf8"));
    if (legacy?.meta && Array.isArray(legacy.clips)) fs.writeFileSync(timelinePath(nid), JSON.stringify(legacy, null, 2));
  } catch {}
  try {
    const pub = path.join(PACK_ROOT, "public");
    for (const f of fs.readdirSync(pub)) {
      if (/\.(mp4|mov|webm|mkv|png|jpe?g|webp|gif|mp3|wav|aac|ogg|m4a)$/i.test(f)) {
        fs.copyFileSync(path.join(pub, f), path.join(assetsPath(nid), f));
      }
    }
  } catch {}
  setCurrentProject(nid);
  return nid;
}
// ---- 会话=项目绑定（每个 dsh 会话固定一个 djian 项目；面板按 sessionId 自动切换） ----
function sessionProjects() {
  try {
    const m = JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf8"));
    return m && typeof m === "object" && !Array.isArray(m) ? m : {};
  } catch {
    return {};
  }
}
function saveSessionProjects(map) {
  try {
    fs.mkdirSync(DJIAN_HOME, { recursive: true });
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(map, null, 2));
  } catch (e) {
    console.warn("sessions.json 写入失败:", e.message);
  }
}
// 幂等：已绑定 → 切到该项目；未绑定 → 继承未被占用的当前项目，否则新建。
// switchCurrent=false 时只建/取绑定，不翻动全局 current 与 lastTimeline（隐藏面板 peek）。
// 返回绑定的项目 id（switchCurrent 时保证全局 current 已对齐、lastTimeline 已重载）。
function ensureSessionProject(sessionId, { switchCurrent = true } = {}) {
  const sid = sanitizeId(sessionId);
  if (!sid) return currentProjectId();
  const map = sessionProjects();
  const bound = map[sid];
  if (bound && fs.existsSync(timelinePath(bound))) {
    if (switchCurrent && bound !== currentProjectId()) {
      setCurrentProject(bound);
      lastTimeline = loadTimelineFile();
    }
    return bound;
  }
  const cur = currentProjectId();
  const taken = new Set(Object.values(map));
  let id;
  if (!taken.has(cur)) {
    id = cur; // 首个会话直接继承现有项目（老用户数据不丢）
  } else {
    id = createProject(`剪辑 ${new Date().toISOString().slice(0, 10)}`);
    if (switchCurrent) lastTimeline = structuredClone(EMPTY_TIMELINE);
  }
  map[sid] = id;
  saveSessionProjects(map);
  if (switchCurrent && id !== cur) setCurrentProject(id);
  return id;
}

function loadTimelineFile() {
  try {
    // v1 磁盘数据经 parseTimeline 自动归一化成 v2（clips → 主轨道，audio → 音频轨）
    return parseTimeline(JSON.parse(fs.readFileSync(timelinePath(currentProjectId()), "utf8")));
  } catch { return null; }
}
// 按项目 id 直读（不翻动全局 current/lastTimeline）——隐藏面板的 peek 轮询用
function loadTimelineFor(id) {
  try {
    return parseTimeline(JSON.parse(fs.readFileSync(timelinePath(id), "utf8")));
  } catch { return null; }
}
function persistTimeline(t) {
  try {
    fs.mkdirSync(path.dirname(timelinePath(currentProjectId())), { recursive: true });
    fs.writeFileSync(timelinePath(currentProjectId()), JSON.stringify(t, null, 2));
  } catch (e) { console.warn("timeline 持久化失败:", e.message); }
}

// ---- 版本历史：项目目录 history/ 下快照，AI ops 前自动存 ----
function historyDir() {
  return path.join(projectDir(currentProjectId()), "history");
}

function saveSnapshot(label) {
  if (!lastTimeline) return null;
  const dir = historyDir();
  fs.mkdirSync(dir, { recursive: true });
  const id = `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  const snap = { id, at: new Date().toISOString(), label: String(label ?? "").slice(0, 60), timeline: lastTimeline };
  fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify(snap, null, 2));
  // 最多留 40 份，超出删最旧
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  while (files.length > 40) fs.rmSync(path.join(dir, files.shift()), { force: true });
  return id;
}

function listSnapshots() {
  try {
    const dir = historyDir();
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        try {
          const s = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
          return { id: s.id, at: s.at, label: s.label };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => (a.at < b.at ? 1 : -1));
  } catch {
    return [];
  }
}
lastTimeline = loadTimelineFile();

const newClipId = () => "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const clampNum = (v, fb, min = -Infinity, max = Infinity) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fb;

// 与 webui store 的剪辑原语同语义，直接落在 lastTimeline 上并持久化
function applyOpsToTimeline(ops) {
  const t = lastTimeline ?? structuredClone(EMPTY_TIMELINE);
  const ignored = []; // 格式合法但没产生效果的操作（id 不存在、index 越界、切点太靠边）——上报给模型，防止它以为改成功了
  const mainTrack = () => t.videoTracks[0];
  const findVideoClip = (id) => {
    for (const tr of t.videoTracks) {
      const c = tr.clips.find((x) => x.id === id);
      if (c) return { track: tr, clip: c };
    }
    return null;
  };
  for (const op of ops) {
    switch (op.op) {
      case "addClip": {
        // track: "main"（默认）主轨道串行；track: "overlay"/"pip" 叠加轨（需 atSeconds）
        const isOverlay = typeof op.track === "string" && /^(overlay|pip|v\d+)$/i.test(op.track) && op.track.toLowerCase() !== "main";
        const clip = {
          id: newClipId(),
          type: op.type === "image" ? "image" : "video",
          src: typeof op.src === "string" ? op.src : "a.mp4",
          inPoint: clampNum(op.inPoint, 0, 0),
          clipDuration: clampNum(op.clipDuration, 3, 0.1),
          transition: op.transition === "fade" ? "fade" : "none",
          volume: clampNum(op.volume, 1, 0, 1),
        };
        const sp = sanitizeSpeed(op.speed);
        if (sp !== undefined && sp !== 1) clip.speed = sp;
        const flt = sanitizeFilter(op.filter);
        if (flt) clip.filter = flt;
        const anim = sanitizeAnimations(op.animations);
        if (anim) clip.animations = anim;
        else if (typeof op.animationPreset === "string" && op.animationPreset) {
          const expanded = expandAnimationPreset(op.animationPreset, clip.clipDuration);
          if (expanded) clip.animations = expanded;
        }
        if (isOverlay) {
          clip.atSeconds = clampNum(op.atSeconds, 0, 0);
          if (op.box && typeof op.box === "object") {
            const b = op.box;
            clip.box = {
              x: clampNum(b.x, 0.66, 0, 1), y: clampNum(b.y, 0.66, 0, 1),
              w: clampNum(b.w, 0.3, 0.01, 1), h: clampNum(b.h, 0.3, 0.01, 1),
            };
          }
          // 找到叠加轨（按 id），没有就建一条
          let tr = t.videoTracks.find((x) => x.id !== "v1" && (!op.track || x.id === op.track || x.name === op.track));
          if (!tr) {
            tr = { id: op.track && op.track !== "overlay" && op.track !== "pip" ? op.track : `v${t.videoTracks.length + 1}`, name: op.name ?? "画中画", clips: [] };
            t.videoTracks.push(tr);
          }
          tr.clips.push(clip);
        } else {
          mainTrack().clips.push(clip);
        }
        break;
      }
      case "removeClip": {
        const before = t.videoTracks.reduce((n, tr) => n + tr.clips.length, 0);
        for (const tr of t.videoTracks) tr.clips = tr.clips.filter((c) => c.id !== op.id);
        // 空的叠加轨顺手清掉（主轨道保留）
        t.videoTracks = t.videoTracks.filter((tr, i) => i === 0 || tr.clips.length > 0);
        if (t.videoTracks.reduce((n, tr) => n + tr.clips.length, 0) === before) ignored.push({ op: "removeClip", id: op.id, reason: "id 不存在" });
        break;
      }
      case "updateClip": {
        const hit = findVideoClip(op.id);
        const target = hit?.clip ?? (() => {
          // 音频 clip 回退：AI 给音频设变速/包络/音量走同一 op
          for (const tr of t.audioTracks) {
            const ac = tr.clips.find((x) => x.id === op.id);
            if (ac) return ac;
          }
          return null;
        })();
        if (target) {
          const { animationPreset, ...rest } = op.patch;
          Object.assign(target, rest);
          if (animationPreset !== undefined) {
            const dur = target.clipDuration ?? target.duration ?? 1;
            const expanded = animationPreset && animationPreset !== "none" ? expandAnimationPreset(animationPreset, dur) : undefined;
            if (expanded) target.animations = expanded;
            else delete target.animations; // ""/none = 清除动画
          }
        } else {
          ignored.push({ op: "updateClip", id: op.id, reason: "id 不存在（视频/音频轨均无此 clip）" });
        }
        break;
      }
      case "reorderClips": {
        const tr = mainTrack();
        const map = new Map(tr.clips.map((c) => [c.id, c]));
        const unknown = op.order.filter((id) => !map.has(id));
        if (unknown.length) ignored.push({ op: "reorderClips", id: unknown.join(","), reason: `order 含不存在的 id：${unknown.join("、")}` });
        const next = op.order.map((id) => map.get(id)).filter(Boolean);
        tr.clips = [...next, ...tr.clips.filter((c) => !op.order.includes(c.id))];
        break;
      }
      case "addAudio": {
        // 音频 clip：track 缺省建一条新轨，同名复用
        const name = typeof op.track === "string" ? op.track : "音频";
        let tr = t.audioTracks.find((x) => x.name === name || x.id === op.track);
        if (!tr) {
          tr = { id: `a${t.audioTracks.length + 1}`, name, volume: clampNum(op.trackVolume, 1, 0, 1), muted: false, clips: [] };
          t.audioTracks.push(tr);
        }
        const aclip = {
          id: newClipId(),
          src: typeof op.src === "string" ? op.src : "a.mp3",
          inPoint: clampNum(op.inPoint, 0, 0),
          duration: clampNum(op.duration, 3, 0.1),
          volume: clampNum(op.volume, 1, 0, 1),
          atSeconds: clampNum(op.atSeconds, 0, 0),
        };
        const asp = sanitizeSpeed(op.speed);
        if (asp !== undefined && asp !== 1) aclip.speed = asp;
        const aanim = sanitizeAnimations(op.animations);
        if (aanim) aclip.animations = aanim;
        tr.clips.push(aclip);
        break;
      }
      case "removeAudio": {
        const before = t.audioTracks.reduce((n, tr) => n + tr.clips.length, 0);
        for (const tr of t.audioTracks) tr.clips = tr.clips.filter((c) => c.id !== op.id);
        t.audioTracks = t.audioTracks.filter((tr) => tr.clips.length > 0);
        if (t.audioTracks.reduce((n, tr) => n + tr.clips.length, 0) === before) ignored.push({ op: "removeAudio", id: op.id, reason: "id 不存在" });
        break;
      }
      case "updateAudioTrack": {
        const tr = t.audioTracks.find((x) => x.id === op.id || x.name === op.id);
        if (tr) {
          if (op.patch && typeof op.patch === "object") {
            if (op.patch.volume !== undefined) tr.volume = clampNum(op.patch.volume, tr.volume, 0, 1);
            if (op.patch.muted !== undefined) tr.muted = Boolean(op.patch.muted);
            if (op.patch.name !== undefined && typeof op.patch.name === "string") tr.name = op.patch.name.slice(0, 30);
          }
        } else {
          ignored.push({ op: "updateAudioTrack", id: op.id, reason: "音频轨不存在" });
        }
        break;
      }
      case "splitClip": {
        // 主轨 clip：atSeconds 为全局时间，换算成 clip 内局部偏移；叠加/音频 clip：atSeconds - clip.atSeconds
        const at = Number(op.atSeconds);
        const hitV = findVideoClip(op.id);
        const hitA = hitV
          ? null
          : (() => {
              for (const tr of t.audioTracks) {
                const c = tr.clips.find((x) => x.id === op.id);
                if (c) return { track: tr, clip: c };
              }
              return null;
            })();
        if (hitV) {
          const { track, clip } = hitV;
          let start = 0;
          if (track === mainTrack()) {
            for (const c of track.clips) {
              if (c.id === clip.id) break;
              start += c.clipDuration;
            }
          } else {
            start = clip.atSeconds ?? 0;
          }
          const off = at - start;
          if (!(off > 0.05) || off >= clip.clipDuration - 0.05) {
            ignored.push({ op: "splitClip", id: op.id, reason: `切点太靠边（须落在片段内部，两侧各留 0.05s；片段占时 ${clip.clipDuration}s）` });
            break;
          }
          const left = { ...clip, clipDuration: off };
          const right = {
            ...clip,
            id: newClipId(),
            inPoint: clip.inPoint + off,
            clipDuration: clip.clipDuration - off,
          };
          if (clip.atSeconds !== undefined) right.atSeconds = (clip.atSeconds ?? 0) + off;
          if (clip.animations) right.animations = shiftAnims(clip.animations, off); // 右半段关键帧时间轴平移
          const idx = track.clips.findIndex((c) => c.id === clip.id);
          track.clips.splice(idx, 1, left, right);
        } else if (hitA) {
          const { track, clip } = hitA;
          const off = at - clip.atSeconds;
          if (!(off > 0.05) || off >= clip.duration - 0.05) {
            ignored.push({ op: "splitClip", id: op.id, reason: `切点太靠边（须落在片段内部，两侧各留 0.05s）` });
            break;
          }
          const left = { ...clip, duration: off };
          const right = {
            ...clip,
            id: newClipId(),
            inPoint: clip.inPoint + off,
            duration: clip.duration - off,
            atSeconds: clip.atSeconds + off,
          };
          if (clip.animations) right.animations = shiftAnims(clip.animations, off);
          const idx = track.clips.findIndex((c) => c.id === clip.id);
          track.clips.splice(idx, 1, left, right);
        } else {
          ignored.push({ op: "splitClip", id: op.id, reason: "id 不存在（视频/音频轨均无此 clip）" });
        }
        break;
      }
      case "addOverlay": {
        const ov = {
          text: op.text,
          startSeconds: clampNum(op.startSeconds, 0, 0),
          endSeconds: clampNum(op.endSeconds, 3, 0),
          position: ["top", "center", "bottom"].includes(op.position) ? op.position : "bottom",
          fontSize: clampNum(op.fontSize, 48, 1),
          color: typeof op.color === "string" ? op.color : "#ffffff",
          ...(fontById(op.fontFamily) ? { fontFamily: op.fontFamily } : {}),
          ...(Number.isInteger(op.fontWeight) ? { fontWeight: Math.min(900, Math.max(100, op.fontWeight)) } : {}),
        };
        const oanim = sanitizeAnimations(op.animations);
        if (oanim) ov.animations = oanim;
        else if (typeof op.animationPreset === "string" && op.animationPreset) {
          const expanded = expandAnimationPreset(op.animationPreset, Math.max(0.1, ov.endSeconds - ov.startSeconds));
          if (expanded) ov.animations = expanded;
        }
        t.overlays.push(ov);
        break;
      }
      case "removeOverlay":
        if (op.index < 0 || op.index >= t.overlays.length) ignored.push({ op: "removeOverlay", index: op.index, reason: t.overlays.length === 0 ? "index 越界（当前没有任何字幕）" : `index 越界（当前 0..${t.overlays.length - 1}）` });
        else t.overlays = t.overlays.filter((_, i) => i !== op.index);
        break;
      case "updateOverlay":
        if (op.index < 0 || op.index >= t.overlays.length) {
          ignored.push({ op: "updateOverlay", index: op.index, reason: t.overlays.length === 0 ? "index 越界（当前没有任何字幕）" : `index 越界（当前 0..${t.overlays.length - 1}）` });
          break;
        }
        t.overlays = t.overlays.map((o, i) => {
          if (i !== op.index) return o;
          const { animationPreset, animations, ...rest } = op.patch ?? {};
          const next = { ...o };
          if (rest.text !== undefined) next.text = String(rest.text);
          if (rest.startSeconds !== undefined) next.startSeconds = clampNum(rest.startSeconds, next.startSeconds, 0);
          if (rest.endSeconds !== undefined) next.endSeconds = clampNum(rest.endSeconds, next.endSeconds, 0);
          if (rest.position !== undefined && ["top", "center", "bottom"].includes(rest.position)) next.position = rest.position;
          if (rest.fontSize !== undefined) next.fontSize = clampNum(rest.fontSize, next.fontSize, 1);
          if (rest.color !== undefined && typeof rest.color === "string") next.color = rest.color;
          if (rest.fontFamily !== undefined) {
            if (fontById(rest.fontFamily)) next.fontFamily = rest.fontFamily;
            else delete next.fontFamily; // ""/未知 id = 清除，回系统默认
          }
          if (rest.fontWeight !== undefined) {
            if (Number.isFinite(Number(rest.fontWeight))) next.fontWeight = Math.min(900, Math.max(100, Math.round(Number(rest.fontWeight))));
            else delete next.fontWeight;
          }
          const anim = sanitizeAnimations(animations);
          if (anim) next.animations = anim;
          else if (animations !== undefined) delete next.animations; // 设 {} 清空动画
          if (animationPreset !== undefined) {
            const dur = Math.max(0.1, next.endSeconds - next.startSeconds);
            const expanded = animationPreset && animationPreset !== "none" ? expandAnimationPreset(animationPreset, dur) : undefined;
            if (expanded) next.animations = expanded;
            else delete next.animations;
          }
          return next;
        });
        break;
      case "setMeta":
        Object.assign(t.meta, sanitizeMetaPatch(op.patch ?? op));
        break;
    }
  }
  lastTimeline = t;
  persistTimeline(t);
  return ignored;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  // CORS：供官方 dsh web（5190/反代 5191）里的剪辑面板插件跨域读写；本机 + 服务器公网 IP 来源
  const origin = req.headers.origin ?? "";
  if (/^https?:\/\/(127\.0\.0\.1|localhost|64\.90\.25\.108)(:\d+)?$/.test(origin)) res._aco = origin;
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      ...(res._aco ? { "Access-Control-Allow-Origin": res._aco } : {}),
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }
  // 临时请求日志：定位用户端白屏（看浏览器实际请求了什么、状态码、UA）
  res.on("finish", () => {
    const skip = url.pathname.startsWith("/api/export/status"); // 轮询不吵
    if (!skip) console.log(`[req] ${req.method} ${url.pathname} → ${res.statusCode} (${(req.headers["user-agent"] ?? "").slice(0, 80)})`);
  });

  if (url.pathname === "/api/health") {
    return json(res, 200, { ok: true, ai: AI_READY, model: MODEL, engine: "dsh-sdk" });
  }

  // MCP server 回传剪辑 ops（校验归一化，rejected 反馈给模型）
  if (url.pathname === "/api/internal/ops" && req.method === "POST") {
    const body = JSON.parse(await readBody(req));
    const { accepted, rejected } = normalizeOps(body.ops);
    pendingOps.push(...accepted);
    let ignored = [];
    if (accepted.length) {
      // AI 改时间线前自动快照（历史/ 可回溯）
      saveSnapshot(`AI: ${accepted.map((o) => o.op).join(", ")}`);
      ignored = applyOpsToTimeline(accepted); // 服务端直接落时间线（事实源）；返回没生效的操作
    }
    const pid = currentProjectId();
    return json(res, 200, { accepted: accepted.length, ignored, rejected, project: { id: pid, name: listProjects().find((p) => p.id === pid)?.name } });
  }

  // 动画预设列表（面板下拉用）
  if (url.pathname === "/api/animation-presets" && req.method === "GET") {
    return json(res, 200, { presets: listAnimationPresets() });
  }

  // 内置字体列表（面板/MCP 参考）
  if (url.pathname === "/api/fonts" && req.method === "GET") {
    return json(res, 200, { fonts: FONTS.map(({ id, label, weights }) => ({ id, label, variable: weights.includes(" ") })) });
  }

  // 版本历史：列表 / 恢复（恢复前对当前状态保底快照，可来回切）
  if (url.pathname === "/api/history" && req.method === "GET") {
    return json(res, 200, { snapshots: listSnapshots() });
  }
  if (url.pathname?.startsWith("/api/history/") && req.method === "POST") {
    const id = decodeURIComponent(url.pathname.slice("/api/history/".length));
    const file = path.join(historyDir(), `${id}.json`);
    if (!/^v[\w]+$/.test(id) || !fs.existsSync(file)) return json(res, 404, { error: "快照不存在" });
    try {
      const snap = JSON.parse(fs.readFileSync(file, "utf8"));
      const norm = parseTimeline(snap.timeline);
      saveSnapshot("恢复前自动快照");
      lastTimeline = norm;
      persistTimeline(norm);
      return json(res, 200, { ok: true, restored: snap.id, label: snap.label });
    } catch (e) {
      return json(res, 400, { error: `快照恢复失败：${e.message}` });
    }
  }

  // MCP server 读当前时间线；面板轮询带 ?session= → 幂等绑定会话→项目并自动切换。
  // peek=1（隐藏面板）：只读本会话项目，不翻动全局 current——否则多个挂着的面板互相把
  // current 来回翻，MCP ops（跟全局 current 走）会落到别的项目上（2026-09-25 串项目事故）。
  if (url.pathname === "/api/internal/timeline" && req.method === "GET") {
    const sid = url.searchParams.get("session");
    if (sid) {
      const peek = url.searchParams.get("peek") === "1";
      const pid = ensureSessionProject(sid, { switchCurrent: !peek });
      if (peek) return json(res, 200, loadTimelineFor(pid) ?? structuredClone(EMPTY_TIMELINE));
    }
    return json(res, 200, lastTimeline ?? structuredClone(EMPTY_TIMELINE));
  }

  // 剪辑面板（官方壳插件）写回整份时间线：v1/v2 都收，归一化成 v2 存储
  if (url.pathname === "/api/internal/timeline" && req.method === "POST") {
    const body = JSON.parse(await readBody(req));
    if (body?.sessionId) ensureSessionProject(body.sessionId);
    const t = body?.timeline ?? body;
    if (!t?.meta || !(Array.isArray(t.videoTracks) || Array.isArray(t.clips)) || !Array.isArray(t.overlays ?? [])) {
      return json(res, 400, { error: "时间线格式不正确" });
    }
    try {
      const norm = parseTimeline(t);
      lastTimeline = norm;
      persistTimeline(norm);
    } catch (e) {
      return json(res, 400, { error: `时间线校验失败：${e.message}` });
    }
    return json(res, 200, { ok: true });
  }

  // ---- 项目管理 ----
  if (url.pathname === "/api/projects" && req.method === "GET") {
    return json(res, 200, { current: currentProjectId(), projects: listProjects() });
  }
  if (url.pathname === "/api/projects" && req.method === "POST") {
    const body = JSON.parse(await readBody(req));
    const name = String(body?.name ?? "").trim().slice(0, 60) || "未命名项目";
    const id = createProject(name, body?.meta);
    return json(res, 200, { ok: true, id, name });
  }
  const projMatch = url.pathname.match(/^\/api\/projects\/([a-zA-Z0-9_-]+)$/);
  if (projMatch && req.method === "PATCH") {
    const id = sanitizeId(projMatch[1]);
    const meta = readProjectMeta(id);
    if (!meta) return json(res, 404, { error: "项目不存在" });
    const body = JSON.parse(await readBody(req));
    if (typeof body?.name === "string" && body.name.trim()) meta.name = body.name.trim().slice(0, 60);
    writeProjectMeta(id, meta);
    return json(res, 200, { ok: true });
  }
  if (projMatch && req.method === "DELETE") {
    const id = sanitizeId(projMatch[1]);
    const all = listProjects();
    if (!all.some((p) => p.id === id)) return json(res, 404, { error: "项目不存在" });
    if (all.length <= 1) return json(res, 400, { error: "至少保留一个项目" });
    if (id === currentProjectId()) return json(res, 400, { error: "不能删除当前项目，请先切换" });
    fs.rmSync(projectDir(id), { recursive: true, force: true });
    return json(res, 200, { ok: true });
  }
  if (url.pathname === "/api/current" && req.method === "POST") {
    const body = JSON.parse(await readBody(req));
    const id = sanitizeId(body?.id);
    if (!fs.existsSync(timelinePath(id))) return json(res, 404, { error: "项目不存在" });
    setCurrentProject(id);
    lastTimeline = loadTimelineFile();
    return json(res, 200, { ok: true, current: id });
  }

  // 会话→项目绑定（面板挂载时调用；幂等）：返回该会话绑定的项目。
  // 只建绑定、不翻动全局 current（切项目是面板可见轮询的职责，挂载可能发生在后台面板）
  if (url.pathname === "/api/session-project" && req.method === "POST") {
    const body = JSON.parse(await readBody(req));
    const sid = sanitizeId(body?.sessionId);
    if (!sid) return json(res, 400, { error: "缺少 sessionId" });
    const id = ensureSessionProject(sid, { switchCurrent: false });
    const p = listProjects().find((x) => x.id === id) ?? { id, name: id, createdAt: null, meta: null };
    return json(res, 200, { ok: true, project: p });
  }

  // 内置字幕字体（engine/fonts/*.woff2；渲染浏览器与面板预览统一从这里拉）
  const fontMatch = url.pathname.match(/^\/fonts\/([\w.-]+\.woff2)$/);
  if (fontMatch) {
    const font = FONTS.find((f) => f.file === fontMatch[1]);
    const file = font && path.join(FONTS_DIR, font.file);
    if (!file || !fs.existsSync(file)) return json(res, 404, { error: "字体不存在" });
    const st = fs.statSync(file);
    const etag = `"${st.size}-${Math.floor(st.mtimeMs)}"`;
    if (req.headers["if-none-match"] === etag) return res.writeHead(304, { ETag: etag }).end();
    res.writeHead(200, {
      "Content-Type": "font/woff2",
      "Content-Length": st.size,
      "Cache-Control": "no-cache",
      ETag: etag,
      ...(res._aco ? { "Access-Control-Allow-Origin": res._aco } : {}),
    });
    fs.createReadStream(file).pipe(res);
    return;
  }

  // ---- 素材库（当前项目 assets/）----
  const ASSET_EXT = { video: /\.(mp4|mov|webm|mkv|avi)$/i, image: /\.(png|jpe?g|webp|gif)$/i, audio: /\.(mp3|wav|aac|ogg|m4a)$/i };
  const assetType = (name) => (ASSET_EXT.video.test(name) ? "video" : ASSET_EXT.image.test(name) ? "image" : ASSET_EXT.audio.test(name) ? "audio" : null);
  const sanitizeAssetName = (s) => path.basename(String(s ?? "")).replace(/[^a-zA-Z0-9._\-一-鿿]/g, "_").slice(0, 80);
  const probeDuration = (file) => {
    try {
      const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { timeout: 8000 }).toString().trim();
      const d = Number(out);
      return Number.isFinite(d) && d > 0 ? Math.round(d * 100) / 100 : null;
    } catch { return null; }
  };
  const assetMetaFile = (name) => path.join(thumbsPath(currentProjectId()), name + ".json");
  const readAssetMeta = (name) => { try { return JSON.parse(fs.readFileSync(assetMetaFile(name), "utf8")); } catch { return {}; } };

  if (url.pathname === "/api/assets" && req.method === "GET") {
    const dir = assetsPath(currentProjectId());
    let names = [];
    try { names = fs.readdirSync(dir).filter((f) => assetType(f)); } catch {}
    const items = names.map((name) => {
      const full = path.join(dir, name);
      const meta = readAssetMeta(name);
      let duration = meta.duration ?? null;
      if (duration == null && assetType(name) !== "image") {
        duration = probeDuration(full);
        if (duration != null) {
          try { fs.mkdirSync(thumbsPath(currentProjectId()), { recursive: true }); fs.writeFileSync(assetMetaFile(name), JSON.stringify({ duration })); } catch {}
        }
      }
      return {
        name,
        type: assetType(name),
        size: fs.statSync(full).size,
        duration,
        thumb: assetType(name) === "audio" ? null : `/api/assets/${encodeURIComponent(name)}/thumb`,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
    return json(res, 200, { assets: items });
  }
  if (url.pathname === "/api/assets" && req.method === "POST") {
    const raw = await readBodyRaw(req);
    if (!raw.length) return json(res, 400, { error: "空文件" });
    let name = sanitizeAssetName(url.searchParams.get("name"));
    if (!name || !assetType(name)) return json(res, 400, { error: "文件名或格式不支持（视频/图片/音频）" });
    const dir = assetsPath(currentProjectId());
    fs.mkdirSync(dir, { recursive: true });
    // 重名自动加 -1 -2 后缀
    const ext = path.extname(name), stem = name.slice(0, -ext.length);
    let n = 0, finalName = name;
    while (fs.existsSync(path.join(dir, finalName))) finalName = `${stem}-${++n}${ext}`;
    fs.writeFileSync(path.join(dir, finalName), raw);
    const duration = assetType(finalName) === "image" ? null : probeDuration(path.join(dir, finalName));
    invalidateBundle(); // 素材目录内容变了，下次渲染重新 bundle（否则新素材 404）
    if (duration != null) {
      try { fs.mkdirSync(thumbsPath(currentProjectId()), { recursive: true }); fs.writeFileSync(assetMetaFile(finalName), JSON.stringify({ duration })); } catch {}
    }
    return json(res, 200, { ok: true, name: finalName, type: assetType(finalName), duration });
  }
  const assetMatch = url.pathname.match(/^\/api\/assets\/([^/]+)$/);
  if (assetMatch && req.method === "DELETE") {
    const name = sanitizeAssetName(decodeURIComponent(assetMatch[1]));
    const full = path.join(assetsPath(currentProjectId()), name);
    if (!fs.existsSync(full)) return json(res, 404, { error: "素材不存在" });
    fs.rmSync(full, { force: true });
    invalidateBundle(); // 素材目录内容变了，下次渲染重新 bundle
    fs.rm(path.join(thumbsPath(currentProjectId()), name + ".jpg"), { force: true }, () => {});
    fs.rm(assetMetaFile(name), { force: true }, () => {});
    return json(res, 200, { ok: true });
  }
  const thumbMatch = url.pathname.match(/^\/api\/assets\/([^/]+)\/thumb$/);

  // ---- 在线资源库（Openverse 免 key CC 素材聚合：图片+音频；供资源库插件/MCP 工具共用）----
  if (url.pathname === "/api/library/search" && req.method === "GET") {
    const q = (url.searchParams.get("q") ?? "").trim();
    const kind = url.searchParams.get("type") === "audio" ? "audio" : "image";
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    if (!q) return json(res, 400, { error: "缺少搜索词 q" });
    try {
      const u = `https://api.openverse.org/v1/${kind === "audio" ? "audio" : "images"}/?q=${encodeURIComponent(q)}&page=${page}&page_size=20`;
      const r = await fetch(u, {
        headers: { "User-Agent": "djian-media-library/0.1 (personal video editor)" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!r.ok) throw new Error(`Openverse HTTP ${r.status}`);
      const d = await r.json();
      return json(res, 200, {
        total: d.result_count ?? 0,
        page,
        items: (d.results ?? []).map((x) => ({
          id: x.id,
          kind,
          title: x.title ?? x.id,
          url: x.url,
          thumb: x.thumbnail ?? null,
          license: x.license ?? "cc",
          source: x.source ?? "",
          duration: kind === "audio" && x.duration ? Math.round(x.duration / 100) / 10 : null,
        })),
      });
    } catch (e) {
      return json(res, 502, { error: `资源库查询失败：${e.message}` });
    }
  }

  if (url.pathname === "/api/library/import" && req.method === "POST") {
    const body = JSON.parse(await readBody(req));
    const srcUrl = String(body?.url ?? "");
    if (!/^https?:\/\//i.test(srcUrl)) return json(res, 400, { error: "url 必须是 http(s) 直链" });
    let name = sanitizeAssetName(body?.name) || sanitizeAssetName(decodeURIComponent(new URL(srcUrl).pathname.split("/").pop() ?? ""));
    if (!name) name = `lib-${Date.now().toString(36)}`;
    if (!path.extname(name)) name += body?.kind === "audio" ? ".mp3" : ".jpg";
    if (!assetType(name)) return json(res, 400, { error: "文件名或格式不支持（视频/图片/音频）" });
    try {
      const r = await fetch(srcUrl, {
        signal: AbortSignal.timeout(60_000),
        redirect: "follow",
        headers: { "User-Agent": "djian-media-library/0.1" },
      });
      if (!r.ok) return json(res, 502, { error: `下载失败 HTTP ${r.status}` });
      const buf = Buffer.from(await r.arrayBuffer());
      if (!buf.length) return json(res, 502, { error: "下载到空文件" });
      if (buf.length > 200 * 1024 * 1024) return json(res, 413, { error: "文件超过 200MB 上限" });
      const dir = assetsPath(currentProjectId());
      fs.mkdirSync(dir, { recursive: true });
      const ext = path.extname(name), stem = name.slice(0, -ext.length);
      let n = 0, finalName = name;
      while (fs.existsSync(path.join(dir, finalName))) finalName = `${stem}-${++n}${ext}`;
      fs.writeFileSync(path.join(dir, finalName), buf);
      invalidateBundle(); // 素材目录变了，下次渲染重新 bundle
      const duration = assetType(finalName) === "image" ? null : probeDuration(path.join(dir, finalName));
      if (duration != null) {
        try { fs.mkdirSync(thumbsPath(currentProjectId()), { recursive: true }); fs.writeFileSync(assetMetaFile(finalName), JSON.stringify({ duration })); } catch {}
      }
      return json(res, 200, { ok: true, name: finalName, type: assetType(finalName), duration });
    } catch (e) {
      return json(res, 502, { error: `导入失败：${e.message}` });
    }
  }
  if (thumbMatch && req.method === "GET") {
    const name = sanitizeAssetName(decodeURIComponent(thumbMatch[1]));
    const full = path.join(assetsPath(currentProjectId()), name);
    if (!fs.existsSync(full) || assetType(name) === "audio") return json(res, 404, { error: "无缩略图" });
    const tdir = thumbsPath(currentProjectId());
    const thumb = path.join(tdir, name + ".jpg");
    if (!fs.existsSync(thumb)) {
      try {
        fs.mkdirSync(tdir, { recursive: true });
        const args = assetType(name) === "video"
          ? ["-v", "error", "-ss", "0.5", "-i", full, "-frames:v", "1", "-vf", "scale=192:-2", "-y", thumb]
          : ["-v", "error", "-i", full, "-frames:v", "1", "-vf", "scale=192:-2", "-y", thumb];
        execFileSync("ffmpeg", args, { timeout: 15000 });
      } catch (e) { return json(res, 500, { error: `缩略图生成失败：${e.message}` }); }
    }
    res.writeHead(200, { "Content-Type": "image/jpeg", "Cache-Control": "no-cache", ...(res._aco ? { "Access-Control-Allow-Origin": res._aco } : {}) });
    return fs.createReadStream(thumb).pipe(res);
  }
  // 素材文件本体（供官方壳里的预览播放器跨域拉流）
  if (url.pathname.startsWith("/project-assets/") && req.method === "GET") {
    const name = sanitizeAssetName(decodeURIComponent(url.pathname.slice("/project-assets/".length)));
    const full = path.join(assetsPath(currentProjectId()), name);
    if (!fs.existsSync(full)) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("not found"); return; }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(full)] || "application/octet-stream",
      "Content-Length": fs.statSync(full).size,
      "Cache-Control": "no-cache",
      ...(res._aco ? { "Access-Control-Allow-Origin": res._aco } : {}),
    });
    return fs.createReadStream(full).pipe(res);
  }

  // MCP server 取合成后单帧（供 get_frame 工具；PNG base64 回传）
  if (url.pathname === "/api/internal/frame" && req.method === "POST") {
    const body = JSON.parse(await readBody(req));
    let timeline;
    try {
      timeline = parseTimeline(body?.timeline ?? lastTimeline);
    } catch (e) {
      return json(res, 400, { error: `时间线校验失败：${e.message}` });
    }
    const seconds = Number(body?.seconds);
    const hasContent = timeline.videoTracks.some((tr) => tr.clips.length > 0) || timeline.audioTracks.some((tr) => tr.clips.length > 0) || (timeline.overlays?.length ?? 0) > 0;
    if (!hasContent) return json(res, 400, { error: "时间线为空" });
    if (!Number.isFinite(seconds) || seconds < 0) return json(res, 400, { error: "seconds 必须是非负数字" });
    const outFile = path.join(DJIAN, "out", "frames", `frame-${Date.now()}.png`);
    try {
      const r = await renderFrame({ timeline, timeSeconds: seconds, outFile, assetsDir: assetsPath(currentProjectId()) });
      const png = fs.readFileSync(outFile);
      const stats = analyzeFrame(outFile);
      fs.rm(outFile, { force: true }, () => {});
      return json(res, 200, {
        frame: r.frame,
        width: r.width,
        height: r.height,
        pngBase64: png.toString("base64"),
        stats,
      });
    } catch (e) {
      const missing = collectMissingAssets(timeline);
      return json(res, 500, { error: `取帧失败：${e.message}${missing.length ? `。时间线引用了当前项目素材库中不存在的文件：${missing.join("、")}（素材按项目隔离）——用 removeClip/removeAudio 删掉引用，或重新下载素材后再 addClip` : ""}` });
    }
  }

  // ---- 导出 mp4（低配机器单飞行任务）----
  if (url.pathname === "/api/export" && req.method === "POST") {
    if (exportJob?.status === "rendering") return json(res, 409, { error: "已有导出任务进行中，请稍候" });
    const body = JSON.parse(await readBody(req));
    if (!body?.timeline) return json(res, 400, { error: "缺少 timeline" });
    // v1/v2 都收：先归一化成 v2，再应用导出参数
    let timelineOut;
    try {
      timelineOut = parseTimeline(body.timeline);
    } catch (e) {
      return json(res, 400, { error: `时间线校验失败：${e.message}` });
    }
    const hasContent = timelineOut.videoTracks.some((tr) => tr.clips.length > 0) || timelineOut.audioTracks.some((tr) => tr.clips.length > 0) || (timelineOut.overlays?.length ?? 0) > 0;
    if (!hasContent) return json(res, 400, { error: "时间线为空，没有可导出的内容" });
    // 导出参数：scale 缩放分辨率（0.5/1/2，宽高偶数对齐）；quality 质量档 → crf
    const scale = [0.5, 1, 2].includes(Number(body.scale)) ? Number(body.scale) : 1;
    const CRF = { draft: 28, standard: 20, high: 16 };
    const crf = CRF[body?.quality] ?? undefined;
    if (scale !== 1) {
      timelineOut = structuredClone(timelineOut);
      timelineOut.meta = {
        ...timelineOut.meta,
        width: Math.max(16, Math.round((timelineOut.meta.width * scale) / 2) * 2),
        height: Math.max(16, Math.round((timelineOut.meta.height * scale) / 2) * 2),
      };
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const outFile = path.join(DJIAN, "out", `djian-${stamp}.mp4`);
    exportJob = { status: "rendering", progress: { rendered: 0, total: 0, percent: 0, stage: "preparing" }, outFile };
    const renderAssets = assetsPath(currentProjectId());
    fs.mkdirSync(renderAssets, { recursive: true });
    renderVideo({
      timeline: timelineOut,
      outFile,
      // 素材根 = 当前项目 assets/（与预览同源）
      assetsDir: renderAssets,
      ...(crf != null ? { crf } : {}),
      onProgress: (p) => {
        if (exportJob?.status !== "rendering") return;
        exportJob.progress = {
          rendered: p.rendered,
          total: p.total,
          percent: p.total > 0 ? Math.round((p.rendered / p.total) * 100) : 0,
          stage: p.stage,
        };
      },
    })
      .then((r) => {
        exportJob = {
          ...exportJob,
          status: "done",
          result: { ...r, sizeBytes: fs.statSync(outFile).size, fileName: path.basename(outFile) },
        };
      })
      .catch((e) => {
        exportJob = { ...exportJob, status: "error", error: e.message };
      });
    return json(res, 202, { started: true });
  }

  if (url.pathname === "/api/export/status") {
    return json(res, 200, exportJob ?? { status: "idle" });
  }

  if (url.pathname === "/api/export/download") {
    if (exportJob?.status !== "done" || !fs.existsSync(exportJob.outFile)) {
      return json(res, 404, { error: "暂无已完成的导出" });
    }
    res.writeHead(200, {
      "Content-Type": "video/mp4",
      "Content-Length": fs.statSync(exportJob.outFile).size,
      "Content-Disposition": `attachment; filename="${exportJob.result.fileName}"`,
    });
    fs.createReadStream(exportJob.outFile).pipe(res);
    return;
  }

  if (url.pathname === "/api/chat" && req.method === "POST") {
    if (!AI_READY) return json(res, 501, { error: "模型密钥未配置" });
    try {
      const body = JSON.parse(await readBody(req));
      const { message, timeline, history = [], sessionId } = body;
      if (typeof message !== "string" || !message.trim()) return json(res, 400, { error: "message 不能为空" });

      lastTimeline = timeline ?? lastTimeline;
      const contextMsg = `当前时间线：\n${JSON.stringify(timeline)}\n\n用户指令：${message}`;

      const h = await getHarness();
      const dshSession = sessionId ? dshSessionByDjian.get(sessionId) : undefined;
      pendingOps = []; // 开跑前清空，只收本轮的 ops
      const result = await h.run(contextMsg, dshSession ? { sessionId: dshSession } : {});
      if (sessionId && result.sessionId) dshSessionByDjian.set(sessionId, result.sessionId);

      const ops = pendingOps
        // 模型经 MCP 回传时偶尔写 type: 而非协议的 op:，后端归一化
        .map((o) => ({ ...o, op: o.op ?? o.type }))
        .filter((o) => typeof o.op === "string");
      pendingOps = [];
      return json(res, 200, { reply: result.finalResponse || "（无回复）", ops });
    } catch (e) {
      return json(res, 502, { error: `agent 调用失败：${e.message}` });
    }
  }

  // 独立 UI 已下线（太难看，产品形态改为官方 dsh web 壳里的剪辑面板）——本服务只留引擎 API。
  // 带扩展名的路径仍查一次当前项目素材目录（时间线 src 裸文件名兼容，供官方壳里的预览播放器拉流）。
  const hasExt = path.extname(url.pathname) !== "";
  if (hasExt) {
    const inAssets = path.join(assetsPath(currentProjectId()), path.basename(url.pathname));
    if (fs.existsSync(inAssets) && !fs.statSync(inAssets).isDirectory()) {
      res.writeHead(200, {
        "Content-Type": MIME[path.extname(inAssets)] || "application/octet-stream",
        "Cache-Control": "no-cache",
        ...(res._aco ? { "Access-Control-Allow-Origin": res._aco } : {}),
      });
      fs.createReadStream(inAssets).pipe(res);
      return;
    }
  }
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
    .end("D剪引擎 API 服务（独立界面已下线，请从 dsh web 面板访问）");
});

// 不主动掐空闲 keep-alive 连接（默认 5s）：MCP 客户端在模型思考间隙复用连接时，
// 会撞上服务端掐线竞态——请求已落盘生效但响应丢失，客户端报 fetch failed 且有整批重发风险。
server.keepAliveTimeout = 0;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`djian webui server on :${PORT} (ai=${AI_READY}, model=${MODEL}, engine=dsh-sdk)`);
});
