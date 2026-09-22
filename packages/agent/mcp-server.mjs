// D剪 MCP 剪辑工具服务（stdio JSON-RPC，MCP 协议）
// dsh agent 通过它修改时间线；本进程只做校验+转发到 webui 后端收集，run 结束后由前端统一下发执行。
import readline from "node:readline";
import fs from "node:fs";

const WEBUI = process.env.DJIAN_WEBUI_URL || "http://127.0.0.1:5180";

const NUM = { type: "number" };
const PATCH = {
  type: "object",
  properties: {
    src: { type: "string" },
    inPoint: NUM,
    clipDuration: { type: "number", exclusiveMinimum: 0 },
    transition: { enum: ["none", "fade"] },
    volume: { type: "number", minimum: 0, maximum: 1 },
    text: { type: "string" },
    startSeconds: NUM,
    endSeconds: NUM,
    position: { enum: ["top", "center", "bottom"] },
    fontSize: NUM,
    color: { type: "string" },
  },
};
const opSchema = (op, props, required = []) => ({
  type: "object",
  properties: { op: { enum: [op] }, ...props },
  required: ["op", ...required],
  additionalProperties: false,
});

const TOOLS = [
  {
    name: "apply_timeline_ops",
    description:
      "对当前视频时间线应用一批剪辑操作。ops 数组按顺序执行。每个元素必须是 {\"op\":\"操作名\", ...参数} 形式，op 字段必填且必须是以下之一：\n" +
      'addClip{src,inPoint,clipDuration,transition,volume} / removeClip{id} / updateClip{id,patch} / reorderClips{order:[id...]} / ' +
      'addOverlay{text,startSeconds,endSeconds,position,fontSize,color} / removeOverlay{index} / updateOverlay{index,patch}。\n' +
      "patch 可含：inPoint/clipDuration/transition/volume（改片段）或 text/startSeconds/endSeconds/position/fontSize/color（改字幕）。\n" +
      "时间单位都是秒；transition 只接受 \"fade\" 或 \"none\"。",
    inputSchema: {
      type: "object",
      properties: {
        ops: {
          type: "array",
          items: {
            oneOf: [
              opSchema("addClip", { src: { type: "string" }, inPoint: NUM, clipDuration: { type: "number", exclusiveMinimum: 0 }, transition: { enum: ["none", "fade"] }, volume: { type: "number", minimum: 0, maximum: 1 } }),
              opSchema("removeClip", { id: { type: "string" } }, ["id"]),
              opSchema("updateClip", { id: { type: "string" }, patch: PATCH }, ["id", "patch"]),
              opSchema("reorderClips", { order: { type: "array", items: { type: "string" } } }, ["order"]),
              opSchema("addOverlay", { text: { type: "string" }, startSeconds: NUM, endSeconds: NUM, position: { enum: ["top", "center", "bottom"] }, fontSize: NUM, color: { type: "string" } }, ["text", "startSeconds", "endSeconds"]),
              opSchema("removeOverlay", { index: { type: "integer", minimum: 0 } }, ["index"]),
              opSchema("updateOverlay", { index: { type: "integer", minimum: 0 }, patch: PATCH }, ["index", "patch"]),
            ],
          },
        },
      },
      required: ["ops"],
    },
  },
  {
    name: "get_timeline",
    description: "读取当前时间线的最新 JSON（meta/clips/overlays）。修改前后都可以调用以确认状态。",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_frame",
    description:
      "查看时间线在第 N 秒处合成后的实际画面（与成片一致，含字幕/淡入等效果）。" +
      "返回该帧 PNG 图片 + 画面数据统计（平均亮度/黑场占比/主色/底部字幕区亮像素占比）。" +
      "若你无法接收图像，请依据 stats 数据判断：avgBrightness<16 是黑场、contrast<10 接近纯色、" +
      "bottomThirdBrightPercent 在 1~15 通常表示底部有白色字幕。秒数越界会自动钳到有效范围。",
    inputSchema: {
      type: "object",
      properties: { seconds: { type: "number", minimum: 0, description: "要看的时间点（秒）" } },
      required: ["seconds"],
    },
  },
];

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}

async function forwardOps(ops) {
  const res = await fetch(`${WEBUI}/api/internal/ops`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ops }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`webui HTTP ${res.status}`);
  return res.json();
}

async function fetchTimeline() {
  const res = await fetch(`${WEBUI}/api/internal/timeline`, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`webui HTTP ${res.status}`);
  return res.json();
}

async function fetchFrame(seconds) {
  const res = await fetch(`${WEBUI}/api/internal/frame`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seconds }),
    signal: AbortSignal.timeout(120_000), // 首次取帧要拉浏览器，留足时间
  });
  if (!res.ok) throw new Error(`webui HTTP ${res.status}`);
  return res.json();
}

const rl = readline.createInterface({ input: process.stdin });
rl.on("line", async (line) => {
  try { fs.appendFileSync("/tmp/djian-mcp.log", line + "\n"); } catch {}
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return;
  }
  const { id, method, params } = msg;
  const reply = (result) => id !== undefined && send({ jsonrpc: "2.0", id, result });
  const fail = (code, message) => id !== undefined && send({ jsonrpc: "2.0", id, error: { code, message } });

  try {
    switch (method) {
      case "initialize":
        return reply({
          protocolVersion: params?.protocolVersion ?? "2025-03-26",
          capabilities: { tools: {} },
          serverInfo: { name: "djian-timeline", version: "0.1.0" },
        });
      case "notifications/initialized":
      case "initialized":
        return; // 通知无需回复
      case "ping":
        return reply({});
      case "tools/list":
        return reply({ tools: TOOLS });
      case "tools/call": {
        const name = params?.name;
        const args = params?.arguments ?? {};
        if (name === "apply_timeline_ops") {
          const ops = Array.isArray(args.ops) ? args.ops : [];
          const r = await forwardOps(ops);
          const rejected = r.rejected ?? [];
          if (rejected.length > 0 && (r.accepted ?? 0) === 0) {
            return reply({
              content: [{ type: "text", text: `全部 ${rejected.length} 个操作都被拒绝：${rejected.map((x) => `#${x.index} ${x.reason}`).join("；")}。请严格按 {"op":"操作名",...} 格式重试。` }],
              isError: true,
            });
          }
          const note = rejected.length > 0 ? `；被拒绝 ${rejected.length} 个（${rejected.map((x) => `#${x.index} ${x.reason}`).join("；")}）` : "";
          return reply({
            content: [{ type: "text", text: `已应用 ${r.accepted ?? ops.length} 个剪辑操作${note}。可用 get_timeline 确认。` }],
          });
        }
        if (name === "get_timeline") {
          const t = await fetchTimeline();
          return reply({ content: [{ type: "text", text: JSON.stringify(t) }] });
        }
        if (name === "get_frame") {
          const seconds = Number(args.seconds);
          if (!Number.isFinite(seconds) || seconds < 0) {
            return reply({ content: [{ type: "text", text: "seconds 必须是非负数字" }], isError: true });
          }
          const r = await fetchFrame(seconds);
          if (r.error) return reply({ content: [{ type: "text", text: r.error }], isError: true });
          return reply({
            content: [
              { type: "image", data: r.pngBase64, mimeType: "image/png" },
              {
                type: "text",
                text:
                  `第 ${seconds}s 处的合成帧（第 ${r.frame} 帧，${r.width}×${r.height}）。\n` +
                  `画面数据统计：${JSON.stringify(r.stats)}\n` +
                  `判读参考：avgBrightness<16=黑场；contrast<10=接近纯色；` +
                  `bottomThirdBrightPercent 1~15=底部大概率有白色字幕；darkPercent 高=画面整体偏暗。`,
              },
            ],
          });
        }
        return fail(-32601, `unknown tool: ${name}`);
      }
      case "resources/list":
        return reply({ resources: [] });
      case "prompts/list":
        return reply({ prompts: [] });
      default:
        if (id !== undefined) return fail(-32601, `unknown method: ${method}`);
    }
  } catch (e) {
    return reply({
      content: [{ type: "text", text: `工具执行失败：${e.message}` }],
      isError: true,
    });
  }
});
