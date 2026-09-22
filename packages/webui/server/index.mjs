// D剪 webui 后端：静态服务 + /api/chat（SDK 驱动完整 dsh agent 运行时）
// agent 通过 MCP 工具 apply_timeline_ops 改时间线 → 本服务收集 → run 结束后随响应下发给前端执行。
// 密钥：运行时读 /my/pro/api/.env 的 GLM 上游注入 DJIAN_LLM_KEY（不落库不打印）。
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DeepSeekHarness } from "@deepseek-ai/dsh-sdk-client";
import { renderVideo } from "../../engine/dist/render.js";

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

  // 静态文件（SPA 回退 index.html）
  let filePath = path.join(DIST, url.pathname === "/" ? "index.html" : url.pathname);
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403).end();
    return;
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, "index.html");
  }
  res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`djian webui server on :${PORT} (ai=${AI_READY}, model=${MODEL}, engine=dsh-sdk)`);
});
