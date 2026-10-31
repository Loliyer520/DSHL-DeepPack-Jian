// OpenAI 兼容图像工具：generations 文生图、edits 参考图/蒙版改造，结果直接导入当前项目素材库。
// 配置优先读 D剪 面板保存的 settings.json（经引擎 health.dataDir 定位，密钥不出本机文件）；
// 环境变量 DJIAN_IMAGE_* 作为无人值守部署的备用。密钥绝不放进工具参数、返回值或日志。
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const MAX_IMAGE_BYTES = 24 * 1024 * 1024;
const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-image-1';
const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
const p = (pid) => '/api/p/' + encodeURIComponent(pid);

/** 引擎数据目录里面板保存的图像设置；读不到（未配置/引擎未就绪）就回退环境变量 */
async function engineImageSettings(client) {
  try {
    const health = await client.get('/api/health', { timeoutMs: 3000 });
    const dir = str(health?.dataDir);
    if (!dir || path.isAbsolute(dir) === false) return {};
    const raw = JSON.parse(await readFile(path.join(dir, 'settings.json'), 'utf8'));
    const image = raw?.image;
    return image && typeof image === 'object' ? {
      apiKey: str(image.apiKey),
      baseUrl: str(image.baseUrl),
      model: str(image.model),
      timeoutMs: Number.isFinite(Number(image.timeoutMs)) && Number(image.timeoutMs) > 0 ? Math.round(Number(image.timeoutMs)) : undefined,
    } : {};
  } catch { return {}; }
}

async function resolveSettings(client, args, env) {
  const panel = await engineImageSettings(client);
  const apiKey = panel.apiKey ?? str(env.DJIAN_IMAGE_API_KEY);
  if (!apiKey) throw new Error('尚未配置图像模型：请打开 D剪 面板「素材 → AI 生图设置」填写中转站地址与密钥；也可用环境变量 DJIAN_IMAGE_API_KEY / DJIAN_IMAGE_BASE_URL / DJIAN_IMAGE_MODEL 配置。配置后无需重启。');
  const baseUrl = panel.baseUrl ?? str(env.DJIAN_IMAGE_BASE_URL) ?? DEFAULT_BASE_URL;
  let url;
  try { url = new URL(baseUrl); } catch { throw new Error('图像接口地址不是有效 URL：请检查面板「AI 生图设置」或 DJIAN_IMAGE_BASE_URL'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('图像接口地址只支持不带内嵌凭据的 http/https URL');
  const timeoutMs = panel.timeoutMs ?? Math.max(1000, Math.min(600_000, Number(env.DJIAN_IMAGE_TIMEOUT_MS) || 300_000));
  return { apiKey, baseUrl: baseUrl.replace(/\/+$/, ''), model: str(args.model) ?? panel.model ?? str(env.DJIAN_IMAGE_MODEL) ?? DEFAULT_MODEL, timeoutMs };
}

async function request(url, init, timeoutMs) {
  let response;
  try { response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) }); }
  catch (e) {
    if (e?.name === 'TimeoutError' || e?.name === 'AbortError') throw new Error('图像模型请求超时，请稍后重试，或在面板「AI 生图设置」里调大超时');
    throw new Error('无法连接图像中转站：' + (e?.message ?? e));
  }
  return response;
}

async function responseJson(response) {
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = undefined; }
  if (!response.ok) {
    const message = data?.error?.message ?? data?.message ?? text.slice(0, 1000) ?? ('HTTP ' + response.status);
    throw new Error('图像接口 HTTP ' + response.status + '：' + message);
  }
  if (!data || !Array.isArray(data.data)) throw new Error('图像接口返回格式不正确：缺少 data 数组');
  return data;
}

async function download(url, timeoutMs) {
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error('图像结果 URL 无效'); }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('图像结果只支持 http/https URL');
  const response = await request(parsed, {}, timeoutMs);
  if (!response.ok) throw new Error('下载图像结果失败：HTTP ' + response.status);
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_IMAGE_BYTES) throw new Error('图像结果超过 24MB 上限');
  if (!response.body) throw new Error('图像结果为空');
  const chunks = [];
  let size = 0;
  const reader = response.body.getReader();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_IMAGE_BYTES) { await reader.cancel(); throw new Error('图像结果超过 24MB 上限'); }
    chunks.push(Buffer.from(value));
  }
  return { data: Buffer.concat(chunks, size), mediaType: response.headers.get('content-type') ?? '' };
}

export function sniffImage(data) {
  if (data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: '.png', mediaType: 'image/png' };
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return { ext: '.jpg', mediaType: 'image/jpeg' };
  if (data.length >= 12 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP') return { ext: '.webp', mediaType: 'image/webp' };
  if (data.length >= 6 && ['GIF87a', 'GIF89a'].includes(data.toString('ascii', 0, 6))) return { ext: '.gif', mediaType: 'image/gif' };
  throw new Error('图像接口没有返回支持的 PNG/JPEG/WebP/GIF 图片');
}

function outputName(requested, action, index, total, ext) {
  let base = requested ? path.basename(requested) : 'ai-' + action + '-' + Date.now();
  const oldExt = path.extname(base);
  if (oldExt) base = base.slice(0, -oldExt.length);
  if (total > 1) base += '-' + (index + 1);
  return (base || 'ai-image') + ext;
}

function commonFields(args) {
  const prompt = str(args.prompt);
  if (!prompt) throw new Error('prompt 不能为空');
  if (prompt.length > 30_000) throw new Error('prompt 不能超过 30000 字符');
  const size = str(args.size);
  if (size && !/^(?:auto|\d{2,5}x\d{2,5})$/.test(size)) throw new Error('size 应为 auto 或 宽x高，例如 1536x1024');
  const n = args.n === undefined ? 1 : Number(args.n);
  if (!Number.isInteger(n) || n < 1 || n > 4) throw new Error('n 必须是 1–4 的整数');
  return {
    prompt, n,
    ...(size ? { size } : {}),
    ...(str(args.quality) ? { quality: str(args.quality) } : {}),
    ...(str(args.outputFormat) ? { output_format: str(args.outputFormat) } : {}),
  };
}

async function loadAsset(client, projectId, name, assets) {
  const info = assets.assets.find((a) => a.name === name);
  if (!info || info.type !== 'image') throw new Error('素材库里没有图片「' + name + '」，文件名以 djian_assets 返回为准');
  const root = path.resolve(assets.assetsDir);
  const file = path.resolve(root, name);
  if (path.dirname(file) !== root) throw new Error('图片素材路径无效');
  const data = await readFile(file);
  if (data.length > MAX_IMAGE_BYTES) throw new Error('参考图片「' + name + '」超过 24MB 上限');
  const kind = sniffImage(data);
  return { name, data, kind };
}

async function editBody(client, projectId, args, fields, model) {
  const names = [...new Set([str(args.image), ...(Array.isArray(args.images) ? args.images : [])].filter(Boolean))];
  if (!names.length) throw new Error('改造素材需要 image 或 images（当前项目中的图片文件名）');
  if (names.length > 4) throw new Error('一次最多使用 4 张参考图');
  const assets = await client.get(p(projectId) + '/assets');
  const images = [];
  for (const name of names) images.push(await loadAsset(client, projectId, name, assets));
  const form = new FormData();
  form.append('model', model);
  for (const [key, value] of Object.entries(fields)) form.append(key, String(value));
  for (const image of images) form.append(images.length === 1 ? 'image' : 'image[]', new Blob([image.data], { type: image.kind.mediaType }), image.name);
  if (str(args.mask)) {
    const mask = await loadAsset(client, projectId, str(args.mask), assets);
    form.append('mask', new Blob([mask.data], { type: mask.kind.mediaType }), mask.name);
  }
  return { form, sourceNames: names };
}

async function execute(client, ctx, args, env = process.env) {
  const action = args.action === 'edit' ? 'edit' : args.action === 'generate' || args.action === undefined ? 'generate' : null;
  if (!action) throw new Error('action 必须是 generate 或 edit');
  const config = await resolveSettings(client, args, env);
  const fields = commonFields(args);
  const headers = { Authorization: 'Bearer ' + config.apiKey };
  let sourceNames = [];
  let init;
  if (action === 'generate') {
    init = { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: config.model, ...fields }) };
  } else {
    const edited = await editBody(client, ctx.projectId, args, fields, config.model);
    sourceNames = edited.sourceNames;
    init = { method: 'POST', headers, body: edited.form };
  }
  const response = await request(config.baseUrl + (action === 'edit' ? '/images/edits' : '/images/generations'), init, config.timeoutMs);
  const result = await responseJson(response);
  if (!result.data.length) throw new Error('图像接口没有返回图片');
  const imported = [];
  let preview;
  for (let i = 0; i < result.data.length; i++) {
    const item = result.data[i];
    let raw;
    if (str(item?.b64_json)) raw = { data: Buffer.from(item.b64_json, 'base64'), mediaType: '' };
    else if (str(item?.url)) raw = await download(item.url, config.timeoutMs);
    else throw new Error('图像结果缺少 b64_json 或 url');
    if (!raw.data.length || raw.data.length > MAX_IMAGE_BYTES) throw new Error('图像结果为空或超过 24MB 上限');
    const kind = sniffImage(raw.data);
    const name = outputName(str(args.name), action, i, result.data.length, kind.ext);
    const asset = await client.post(p(ctx.projectId) + '/assets/base64', { base64: raw.data.toString('base64'), name }, { timeoutMs: 120_000 });
    imported.push(asset);
    if (!preview) preview = { data: raw.data, mediaType: kind.mediaType };
  }
  const names = imported.map((a) => a.name);
  const revisedPrompts = result.data.map((x) => str(x?.revised_prompt)).filter(Boolean);
  const text = (action === 'edit' ? '已改造「' + sourceNames.join('、') + '」' : '已生成图片') + '并导入 ' + imported.length + ' 个素材：' + names.map((n) => '「' + n + '」').join('、')
    + '\n可用 addClip/addOverlay 的 src 使用这些文件名；原素材未被覆盖。'
    + (revisedPrompts.length ? '\n模型改写提示词：' + revisedPrompts.join(' / ') : '');
  return {
    value: { action, model: config.model, assets: imported, name: names[0], names, revisedPrompts },
    text,
    image: preview,
  };
}

export const IMAGE_TOOL = {
  name: 'djian_image',
  description: '调用 OpenAI 兼容中转站的图像模型生成或改造图片，并自动导入当前项目素材库。action:"generate" 文生图；action:"edit" 用 image/images 指定的项目图片做参考改造，可另传 mask。支持 size、quality、n(1–4)、outputFormat；model 可覆盖默认模型。返回实际素材文件名与预览，再用 addClip/addOverlay 放入时间线。密钥由用户在 D剪 面板「素材 → AI 生图设置」或 DJIAN_IMAGE_* 环境变量配置；未配置时引导用户打开面板设置，不要索要或传入密钥。',
  parameters: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['generate', 'edit'] },
      prompt: { type: 'string', description: '画面或改造要求；改造时说明要保留和要改变的部分' },
      image: { type: 'string', description: 'edit：一张参考图的项目素材文件名' },
      images: { type: 'array', items: { type: 'string' }, maxItems: 4, description: 'edit：最多 4 张参考图的项目素材文件名' },
      mask: { type: 'string', description: 'edit：可选蒙版图片的项目素材文件名' },
      model: { type: 'string', description: '可选，覆盖默认图像模型名' },
      size: { type: 'string', description: 'auto 或 宽x高，如 1024x1024、1536x1024、1024x1536' },
      quality: { type: 'string', enum: ['auto', 'low', 'medium', 'high', 'standard', 'hd'] },
      outputFormat: { type: 'string', enum: ['png', 'jpeg', 'webp'] },
      n: { type: 'integer', minimum: 1, maximum: 4 },
      name: { type: 'string', description: '保存文件名（可省略扩展名）；多图会自动加序号，重名自动改名' },
    },
    required: ['action', 'prompt'],
  },
  execute,
};
