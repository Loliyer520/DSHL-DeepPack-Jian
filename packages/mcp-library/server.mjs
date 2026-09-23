// 媒体资源库 MCP 服务（stdio JSON-RPC，MCP 协议）——AI 搜索/下载在线 CC 素材
// 通用设计（可复用到任意 dsh 整合包，不依赖 D剪）：
//   - 搜索：直连 Openverse 聚合 API（CC 授权图片/音频，免 key 免注册）
//   - 下载：优先走 MEDIA_SERVER_URL（默认 D剪 5180）的 /api/library/import（入库 + 刷新渲染缓存）；
//           服务不可达时降级为直接下载到 MEDIA_DOWNLOAD_DIR（默认 ./media-downloads）
// 注册示例（cordis.yml）：
//   - insert:
//       - id: mcp-media-library
//         name: '@deepseek-ai/dsh-mcp-client'
//         config:
//           serverName: media-library
//           transport: stdio
//           command: node
//           args: ['/abs/path/to/server.mjs']
//           env: { MEDIA_SERVER_URL: 'http://127.0.0.1:5180' }
import readline from "node:readline";
import fs from "node:fs";
import path from "node:path";

const SERVER = (process.env.MEDIA_SERVER_URL || "http://127.0.0.1:5180").replace(/\/+$/, "");
const FALLBACK_DIR = process.env.MEDIA_DOWNLOAD_DIR || path.resolve(process.cwd(), "media-downloads");
const OPENVERSE = "https://api.openverse.org/v1";
const UA = "mcp-media-library/0.1";

const TOOLS = [
  {
    name: "search_media",
    description:
      "搜索在线 CC 授权素材库（Openverse 聚合 Flickr/Freesound 等，图片/音频，免 key，可商用）。返回标题、直链 url、授权、来源、时长等。英文关键词效果通常更好。",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "搜索关键词" },
        type: { enum: ["image", "audio"], description: "素材类型" },
        page: { type: "number", minimum: 1, description: "页码，默认 1（每页 20 条）" },
      },
      required: ["query", "type"],
      additionalProperties: false,
    },
  },
  {
    name: "download_media",
    description:
      "把 search_media 结果里的 url 下载进素材库。D剪环境下自动进当前项目素材目录并刷新渲染缓存（之后可直接按返回的文件名 addClip 引用）；独立使用时存到 MEDIA_DOWNLOAD_DIR。",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "素材直链（http/https）" },
        name: { type: "string", description: "保存文件名（可选，缺省从 URL 推断）" },
        kind: { enum: ["image", "audio"], description: "类型提示（推断扩展名用）" },
      },
      required: ["url"],
      additionalProperties: false,
    },
  },
];

const send = (msg) => process.stdout.write(JSON.stringify(msg) + "\n");

async function searchMedia({ query, type, page = 1 }) {
  const kind = type === "audio" ? "audio" : "image";
  const u = `${OPENVERSE}/${kind === "audio" ? "audio" : "images"}/?q=${encodeURIComponent(query)}&page=${page}&page_size=20`;
  const r = await fetch(u, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15_000) });
  if (!r.ok) throw new Error(`Openverse HTTP ${r.status}`);
  const d = await r.json();
  const items = (d.results ?? []).map((x) => ({
    title: x.title ?? x.id,
    url: x.url,
    kind,
    license: x.license ?? "cc",
    source: x.source ?? "",
    ...(kind === "audio" && x.duration ? { durationSec: Math.round(x.duration / 100) / 10 } : {}),
  }));
  return { total: d.result_count ?? 0, page, items };
}

async function downloadMedia({ url, name, kind }) {
  if (!/^https?:\/\//i.test(String(url))) throw new Error("url 必须是 http(s) 直链");
  // 优先：D剪 服务端入库（自动进当前项目 assets + invalidateBundle）
  try {
    const r = await fetch(`${SERVER}/api/library/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, name, kind }),
      signal: AbortSignal.timeout(90_000),
    });
    if (r.ok) {
      const d = await r.json();
      return `已入库到 D剪 当前项目素材库：${d.name}（${d.type}${d.duration != null ? `，${d.duration}s` : ""}）。时间线里直接用文件名 "${d.name}" 引用。`;
    }
    // 4xx/5xx 不降级——服务在但拒绝了，报真实原因
    const d = await r.json().catch(() => ({}));
    throw new Error(d.error || `媒体服务 HTTP ${r.status}`);
  } catch (e) {
    if (e.cause === undefined && !/fetch failed|ECONNREFUSED|ENOTFOUND|network|timeout/i.test(String(e))) throw e;
    // 服务不可达 → 降级：直接下载到本地目录（独立整合包用法）
    fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    let fname = String(name ?? "").replace(/[^\w.-]+/g, "_");
    if (!fname) fname = decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "").replace(/[^\w.-]+/g, "_");
    if (!fname) fname = `media-${Date.now().toString(36)}`;
    if (!path.extname(fname)) fname += kind === "audio" ? ".mp3" : ".jpg";
    const r2 = await fetch(url, { signal: AbortSignal.timeout(60_000), redirect: "follow", headers: { "User-Agent": UA } });
    if (!r2.ok) throw new Error(`下载失败 HTTP ${r2.status}`);
    const buf = Buffer.from(await r2.arrayBuffer());
    if (!buf.length) throw new Error("下载到空文件");
    let finalName = fname, n = 0;
    const ext = path.extname(fname), stem = fname.slice(0, -ext.length);
    while (fs.existsSync(path.join(FALLBACK_DIR, finalName))) finalName = `${stem}-${++n}${ext}`;
    fs.writeFileSync(path.join(FALLBACK_DIR, finalName), buf);
    return `（媒体服务不可达，已降级）下载到 ${path.join(FALLBACK_DIR, finalName)}（${Math.round(buf.length / 1024)} KB）`;
  }
}

const rl = readline.createInterface({ input: process.stdin });
rl.on("line", async (line) => {
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
          serverInfo: { name: "media-library", version: "0.1.0" },
        });
      case "notifications/initialized":
      case "initialized":
        return;
      case "ping":
        return reply({});
      case "tools/list":
        return reply({ tools: TOOLS });
      case "tools/call": {
        const args = params?.arguments ?? {};
        if (params?.name === "search_media") {
          const r = await searchMedia(args);
          const lines = r.items.map(
            (x, i) =>
              `${i + 1}. ${x.title} [${x.kind}${x.durationSec != null ? ` ${x.durationSec}s` : ""}] ${x.license}/${x.source}\n   ${x.url}`,
          );
          return reply({
            content: [
              {
                type: "text",
                text: `共 ${r.total} 条结果（第 ${r.page} 页，每页 20）：\n${lines.join("\n") || "（无结果，换个关键词）"}`,
              },
            ],
          });
        }
        if (params?.name === "download_media") {
          const text = await downloadMedia(args);
          return reply({ content: [{ type: "text", text }] });
        }
        return fail(-32601, `unknown tool: ${params?.name}`);
      }
      case "resources/list":
        return reply({ resources: [] });
      case "prompts/list":
        return reply({ prompts: [] });
      default:
        if (id !== undefined) return fail(-32601, `unknown method: ${method}`);
    }
  } catch (e) {
    return reply({ content: [{ type: "text", text: `工具执行失败：${e.message}` }], isError: true });
  }
});
