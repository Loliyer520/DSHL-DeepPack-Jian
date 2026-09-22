// D剪 webui 后端：静态服务 + /api/chat（DeepSeek 驱动时间线剪辑）
// 运行：DEEPSEEK_API_KEY 由 OpenClaw secrets 注入 env；无 key 时 /api/chat 返回 501（前端回退演示回复）
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
const PORT = Number(process.env.PORT || 5180);

// 密钥来源（不明文落库）：
// 1. env 里的 DEEPSEEK_API_KEY（OpenClaw secrets 注入时）
// 2. kashic-api 的 .env（本机既有 GLM 上游，运行时读文件，不复制进仓库）
function loadKashicEnv() {
  const envPath = "/my/pro/api/.env";
  try {
    const out = {};
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
    return out;
  } catch {
    return {};
  }
}

const kashic = loadKashicEnv();
const API_KEY = process.env.DEEPSEEK_API_KEY || kashic.OPENAI_API_KEY || "";
const BASE_URL = (process.env.DEEPSEEK_API_KEY ? "https://api.deepseek.com" : kashic.OPENAI_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, "");
const MODEL = process.env.DJIAN_MODEL || (process.env.DEEPSEEK_API_KEY ? "deepseek-chat" : kashic.OPENAI_MODEL || "deepseek-chat");

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

const SYSTEM_PROMPT = `你是 D剪 的 AI 视频剪辑助手。用户用自然语言描述剪辑需求，你输出**严格 JSON**（不要 markdown 代码围栏）：

{
  "reply": "给用户看的简短中文回复，说明做了什么",
  "ops": [ 剪辑操作数组，按执行顺序 ]
}

当前时间线会随用户消息提供，结构：
- meta: { fps, width, height }
- clips: [{ id, type:"video", src, inPoint(素材内起点秒), clipDuration(秒), transition:"none"|"fade", volume 0-1 }]
- overlays: [{ text, startSeconds, endSeconds, position:"top"|"center"|"bottom", fontSize, color }]
- 总时长 = clips 的 clipDuration 之和（顺序拼接，无轨道重叠）

允许的 ops（字段名严格一致）：
- { "op": "addClip", "src": "a.mp4", "inPoint": 0, "clipDuration": 3, "transition": "none", "volume": 1 }
- { "op": "removeClip", "id": "片段id" }
- { "op": "updateClip", "id": "片段id", "patch": { "inPoint"?: 秒, "clipDuration"?: 秒, "transition"?: "none"|"fade", "volume"?: 0-1 } }
- { "op": "reorderClips", "order": ["id1","id2",...] }  （完整新顺序）
- { "op": "addOverlay", "text": "字幕", "startSeconds": 0, "endSeconds": 3, "position": "bottom", "fontSize": 48, "color": "#ffffff" }
- { "op": "removeOverlay", "index": 0 }
- { "op": "updateOverlay", "index": 0, "patch": { "text"?: "...", "startSeconds"?: 秒, "endSeconds"?: 秒 } }

规则：
1. 素材只有用户消息里列出的文件，不要编造不存在的 src。
2. 修改现有片段优先用 updateClip；引用片段用它的 id。
3. 时间一律用秒（number），字幕时间不得超出成片总时长。
4. ops 可以为空数组（纯咨询/聊天时）。
5. 只输出 JSON 本体。`;

async function callLLM(messages) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2000,
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`LLM HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

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

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (url.pathname === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, ai: Boolean(API_KEY), model: MODEL }));
    return;
  }

  if (url.pathname === "/api/chat" && req.method === "POST") {
    if (!API_KEY) {
      res.writeHead(501, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "DEEPSEEK_API_KEY 未配置" }));
      return;
    }
    try {
      const body = JSON.parse(await readBody(req));
      const { message, timeline, history = [] } = body;
      if (typeof message !== "string" || !message.trim()) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "message 不能为空" }));
        return;
      }
      const contextMsg = `当前时间线：\n${JSON.stringify(timeline)}\n\n可用素材：a.mp4（16 秒）\n\n历史对话（最近）：\n${history
        .slice(-6)
        .map((m) => `${m.role === "user" ? "用户" : m.role === "assistant" ? "助手" : "操作记录"}: ${m.text}`)
        .join("\n")}`;
      const content = await callLLM([
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `${contextMsg}\n\n用户指令：${message}` },
      ]);
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        // 模型没按 JSON 来：当纯文本回复处理，不动时间线
        parsed = { reply: content.slice(0, 500), ops: [] };
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ reply: String(parsed.reply ?? "（无回复）"), ops: Array.isArray(parsed.ops) ? parsed.ops : [] }));
    } catch (e) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `AI 调用失败：${e.message}` }));
    }
    return;
  }

  // 静态文件（SPA：未知路径回退 index.html）
  let filePath = path.join(DIST, url.pathname === "/" ? "index.html" : url.pathname);
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403).end();
    return;
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, "index.html");
  }
  const ext = path.extname(filePath);
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`djian webui server on :${PORT} (ai=${Boolean(API_KEY)}, model=${MODEL}, base=${new URL(BASE_URL).host})`);
});
