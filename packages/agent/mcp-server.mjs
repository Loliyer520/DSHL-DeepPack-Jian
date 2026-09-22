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
    atSeconds: { type: "number", minimum: 0, description: "叠加轨专用：绝对起始秒" },
    box: {
      type: "object",
      properties: {
        x: { type: "number", minimum: 0, maximum: 1 },
        y: { type: "number", minimum: 0, maximum: 1 },
        w: { type: "number", minimum: 0.01, maximum: 1 },
        h: { type: "number", minimum: 0.01, maximum: 1 },
      },
      description: "叠加轨专用：画中画盒子（0-1 分数矩形）",
    },
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
      "对当前视频时间线应用一批剪辑操作（时间线 v2 多轨模型）。ops 数组按顺序执行。每个元素必须是 {\"op\":\"操作名\", ...参数} 形式：\n" +
      'addClip{src,inPoint,clipDuration,transition,volume,track?,atSeconds?,box?} —— track 省略或 "main" 加主轨道（串行）；track:"pip" 加画中画叠加轨（必顷 atSeconds 绝对秒，box 可选 0-1 分数矩形 {x,y,w,h}，默认右下 30%）/ ' +
      'removeClip{id} / updateClip{id,patch} / reorderClips{order:[id...]} / ' +
      'addAudio{src,duration,atSeconds,volume?,track?} —— 音频轨加 clip，track 是轨名（同名复用，缺省新建） / ' +
      'removeAudio{id} / updateAudioTrack{id,patch:{volume?,muted?,name?}} / ' +
      'addOverlay{text,startSeconds,endSeconds,position,fontSize,color} / removeOverlay{index} / updateOverlay{index,patch} / ' +
      'setMeta{patch:{fps?,width?,height?}}（调画布：帧率 1-120，宽高 16-7680 偶数）。\n' +
      "时间单位都是秒；transition 只接受 \"fade\" 或 \"none\"。总时长 = 主轨道串行与所有叠加/音频 clip 末尾的最大值。",
    inputSchema: {
      type: "object",
      properties: {
        ops: {
          type: "array",
          items: {
            oneOf: [
              opSchema("addClip", { src: { type: "string" }, inPoint: NUM, clipDuration: { type: "number", exclusiveMinimum: 0 }, transition: { enum: ["none", "fade"] }, volume: { type: "number", minimum: 0, maximum: 1 }, track: { type: "string" }, atSeconds: NUM, box: { type: "object" } }),
              opSchema("removeClip", { id: { type: "string" } }, ["id"]),
              opSchema("updateClip", { id: { type: "string" }, patch: PATCH }, ["id", "patch"]),
              opSchema("reorderClips", { order: { type: "array", items: { type: "string" } } }, ["order"]),
              opSchema("addAudio", { src: { type: "string" }, inPoint: NUM, duration: { type: "number", exclusiveMinimum: 0 }, volume: { type: "number", minimum: 0, maximum: 1 }, atSeconds: NUM, track: { type: "string" } }, ["src", "duration"]),
              opSchema("removeAudio", { id: { type: "string" } }, ["id"]),
              opSchema("updateAudioTrack", { id: { type: "string" }, patch: { type: "object", properties: { volume: { type: "number", minimum: 0, maximum: 1 }, muted: { type: "boolean" }, name: { type: "string" } } } }, ["id", "patch"]),
              opSchema("addOverlay", { text: { type: "string" }, startSeconds: NUM, endSeconds: NUM, position: { enum: ["top", "center", "bottom"] }, fontSize: NUM, color: { type: "string" } }, ["text", "startSeconds", "endSeconds"]),
              opSchema("removeOverlay", { index: { type: "integer", minimum: 0 } }, ["index"]),
              opSchema("updateOverlay", { index: { type: "integer", minimum: 0 }, patch: PATCH }, ["index", "patch"]),
              opSchema("setMeta", { patch: { type: "object", properties: { fps: { type: "integer", minimum: 1, maximum: 120 }, width: { type: "number" }, height: { type: "number" } }, required: [] } }, ["patch"]),
            ],
          },
        },
      },
      required: ["ops"],
    },
  },
  {
    name: "get_timeline",
    description: "读取当前时间线的最新 JSON（v2 多轨：videoTracks[0] 主轨串行、叠加轨 PiP、audioTracks、overlays）。修改前后都可以调用以确认状态。",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "project_list",
    description: "列出所有剪辑项目（id/名称/画布参数），并标明当前活跃项目。",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "project_create",
    description: "新建剪辑项目。可指定名称与画布预设（1080p/720p/竖屏 9:16/方形 1:1/4K）或自定义宽高帧率。创建后不会自动切换，需要时用 project_switch。",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "项目名称" },
        preset: { enum: ["1080p", "720p", "vertical", "square", "4k"], description: "画布预设（与自定义参数二选一）" },
        width: { type: "number" },
        height: { type: "number" },
        fps: { type: "integer", minimum: 1, maximum: 120 },
      },
    },
  },
  {
    name: "project_switch",
    description: "切换当前活跃剪辑项目。之后 get_timeline / apply_timeline_ops / get_frame 都作用于该项目。",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "项目 id（project_list 返回）" } },
      required: ["id"],
    },
  },
  {
    name: "asset_list",
    description: "列出当前项目素材库里的素材（文件名/类型/大小/时长）。addClip 的 src 用素材文件名。",
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

// 通用 GET/POST JSON（项目/素材工具用）
async function apiJson(pathname, body) {
  const res = await fetch(`${WEBUI}${pathname}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `webui HTTP ${res.status}`);
  return data;
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
        if (name === "project_list") {
          const r = await apiJson("/api/projects");
          return reply({ content: [{ type: "text", text: JSON.stringify(r) }] });
        }
        if (name === "project_create") {
          const PRESETS = {
            "1080p": { width: 1920, height: 1080, fps: 30 },
            "720p": { width: 1280, height: 720, fps: 30 },
            vertical: { width: 1080, height: 1920, fps: 30 },
            square: { width: 1080, height: 1080, fps: 30 },
            "4k": { width: 3840, height: 2160, fps: 30 },
          };
          const meta = PRESETS[args.preset] ?? { width: args.width, height: args.height, fps: args.fps };
          const r = await apiJson("/api/projects", { name: args.name, meta });
          return reply({ content: [{ type: "text", text: `已创建项目「${r.name}」（id: ${r.id}）。用 project_switch 切换过去。` }] });
        }
        if (name === "project_switch") {
          const r = await apiJson("/api/current", { id: args.id });
          return reply({ content: [{ type: "text", text: r.ok ? `已切换到项目 ${r.current}。` : "切换失败" }], isError: !r.ok });
        }
        if (name === "asset_list") {
          const r = await apiJson("/api/assets");
          return reply({ content: [{ type: "text", text: JSON.stringify(r.assets ?? []) }] });
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
