// D剪 webui 后端：静态服务 + /api/chat（SDK 驱动完整 dsh agent 运行时）
// agent 通过 MCP 工具 apply_timeline_ops 改时间线 → 本服务收集 → run 结束后随响应下发给前端执行。
// 密钥：运行时读 /my/pro/api/.env 的 GLM 上游注入 DJIAN_LLM_KEY（不落库不打印）。
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DeepSeekHarness } from "@deepseek-ai/dsh-sdk-client";
import { execFileSync } from "node:child_process";
import { renderFrame, renderVideo } from "../../engine/dist/render.js";

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
const PORT = Number(process.env.PORT || 5180);
const DJIAN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PATCH = path.join(DJIAN, "packages/agent/djian.cordis.yml");
const DSH_BIN = path.join(DJIAN, "node_modules/.bin/dsh");

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
      launch: {
        command: DSH_BIN,
        args: ["--profile", "sdk", "--patch", PATCH],
        cwd: DJIAN,
      },
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
      if (buf.length > 1_000_000) req.destroy();
    });
    req.on("end", () => resolve(buf));
    req.on("error", reject);
  });
}

const json = (res, code, obj) => {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
};

// ---- ops 校验归一化：容忍模型把格式写歪 ----
// 合法形：{op:"updateClip",...} / {type:"updateClip",...}；走样形：{"updateClip":{...}} 或 {"removeOverlay":0}
const OPS_NEEDING_ID = new Set(["removeClip"]);
const OPS_NEEDING_INDEX = new Set(["removeOverlay", "updateOverlay"]);
const VALID_OPS = new Set(["addClip", "removeClip", "updateClip", "reorderClips", "addOverlay", "removeOverlay", "updateOverlay"]);

// transition 消毒：fade-in/fadein→fade，其它非法值剔除
function fixTransition(v) {
  if (v === "fade" || v === "none") return v;
  if (typeof v === "string" && v.toLowerCase().startsWith("fade")) return "fade";
  return undefined;
}
function sanitizeOp(op) {
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

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
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
    return json(res, 200, { accepted: accepted.length, rejected });
  }

  // MCP server 读当前时间线
  if (url.pathname === "/api/internal/timeline") {
    return json(res, 200, lastTimeline ?? { meta: { fps: 30, width: 1280, height: 720 }, clips: [], overlays: [] });
  }

  // MCP server 取合成后单帧（供 get_frame 工具；PNG base64 回传）
  if (url.pathname === "/api/internal/frame" && req.method === "POST") {
    const body = JSON.parse(await readBody(req));
    const timeline = body?.timeline ?? lastTimeline;
    const seconds = Number(body?.seconds);
    if (!timeline?.clips?.length) return json(res, 400, { error: "时间线为空" });
    if (!Number.isFinite(seconds) || seconds < 0) return json(res, 400, { error: "seconds 必须是非负数字" });
    const outFile = path.join(DJIAN, "out", "frames", `frame-${Date.now()}.png`);
    try {
      const r = await renderFrame({ timeline, timeSeconds: seconds, outFile });
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
      return json(res, 500, { error: `取帧失败：${e.message}` });
    }
  }

  // ---- 导出 mp4（低配机器单飞行任务）----
  if (url.pathname === "/api/export" && req.method === "POST") {
    if (exportJob?.status === "rendering") return json(res, 409, { error: "已有导出任务进行中，请稍候" });
    const body = JSON.parse(await readBody(req));
    if (!body?.timeline?.clips?.length) return json(res, 400, { error: "时间线为空，没有可导出的内容" });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const outFile = path.join(DJIAN, "out", `djian-${stamp}.mp4`);
    exportJob = { status: "rendering", progress: { rendered: 0, total: 0, percent: 0, stage: "preparing" }, outFile };
    renderVideo({
      timeline: body.timeline,
      outFile,
      // 与前端预览同源：vite public 目录，时间线 src 相对它解析
      assetsDir: path.join(DJIAN, "packages/webui/public"),
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

  // 静态文件（SPA 回退 index.html——仅对无扩展名的导航路径；
  // 带扩展名的资源缺失必须 404，否则旧缓存 index.html 引用已重建的旧 hash 资源时会拿到 HTML 当 JS，直接白屏）
  let filePath = path.join(DIST, url.pathname === "/" ? "index.html" : url.pathname);
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403).end();
    return;
  }
  const hasExt = path.extname(url.pathname) !== "";
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    if (hasExt) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("not found");
      return;
    }
    filePath = path.join(DIST, "index.html");
  }
  // 缓存策略：html 每次重验证（拿新 hash 引用）；hash 指纹资源 immutable 长缓存
  const isHtml = path.extname(filePath) === ".html";
  const isFingerprinted = url.pathname.startsWith("/assets/");
  const cacheControl = isHtml ? "no-cache" : isFingerprinted ? "public, max-age=31536000, immutable" : "no-cache";
  res.writeHead(200, {
    "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream",
    "Cache-Control": cacheControl,
  });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`djian webui server on :${PORT} (ai=${AI_READY}, model=${MODEL}, engine=dsh-sdk)`);
});
