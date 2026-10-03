// 路由表：所有业务接口。项目一律显式寻址（/api/p/:pid/...），没有“全局当前项目”。
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { FONTS } from '../../engine/dist/fonts.js';
import { listAnimationPresets } from '../../engine/dist/presets.js';
import { OP_NAMES } from '../../engine/dist/ops.js';
import { Router, HttpError, readJson, sendJson } from './http.mjs';
import { serveMedia } from './media.mjs';
import { probe, thumbnail, sprite, peaks } from './media-tools.mjs';
import { searchOpenverse, safeDownload } from './library.mjs';
import { safeAssetName, sanitizeId } from './store.mjs';
import { FONTS_DIR, LIMITS, MIME, PORT, VERSION, assetKind } from './config.mjs';

const ACTORS = new Set(['user', 'ai']);

export function buildRouter({ store, render }) {
  const r = new Router();
  const project = (params) => {
    const pid = sanitizeId(params.pid);
    if (!store.exists(pid)) throw new HttpError(404, '项目不存在', 'PROJECT_NOT_FOUND');
    return pid;
  };

  // ---------- 元信息 ----------
  r.add('GET', '/api/health', (req, res) => sendJson(res, 200, { ok: true, service: 'djian-engine', version: VERSION, protocol: 2, port: PORT, pid: process.pid }));
  r.add('GET', '/api/fonts', (req, res) => sendJson(res, 200, { fonts: FONTS.map(({ id, label, weights }) => ({ id, label, variable: weights.includes(' ') })) }));
  r.add('GET', '/api/animation-presets', (req, res) => sendJson(res, 200, { presets: listAnimationPresets() }));
  r.add('GET', '/api/ops', (req, res) => sendJson(res, 200, { ops: OP_NAMES }));
  r.add('GET', '/fonts/:file', async (req, res, { params }) => {
    const font = FONTS.find((f) => f.file === params.file);
    const file = font && path.join(FONTS_DIR, font.file);
    if (!file || !fs.existsSync(file)) throw new HttpError(404, '字体不存在');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    await serveMedia(req, res, file, 'font/woff2');
  });

  // ---------- 项目与会话 ----------
  r.add('GET', '/api/projects', (req, res) => sendJson(res, 200, { projects: store.list() }));
  r.add('POST', '/api/projects', async (req, res) => {
    const body = await readJson(req);
    const id = store.create(String(body?.name ?? '').trim() || '未命名项目', body?.meta);
    sendJson(res, 200, { ok: true, id, project: store.list().find((p) => p.id === id) });
  });
  r.add('PATCH', '/api/projects/:pid', async (req, res, { params }) => {
    const pid = project(params);
    const body = await readJson(req);
    if (typeof body?.name === 'string' && body.name.trim()) store.rename(pid, body.name);
    sendJson(res, 200, { ok: true });
  });
  r.add('DELETE', '/api/projects/:pid', (req, res, { params }) => {
    store.remove(project(params));
    sendJson(res, 200, { ok: true, trashed: true });
  });
  r.add('POST', '/api/session-project', async (req, res) => {
    const body = await readJson(req);
    const pid = store.bindSession(body?.sessionId, body?.name);
    sendJson(res, 200, { ok: true, project: store.list().find((p) => p.id === pid) ?? { id: pid } });
  });
  r.add('GET', '/api/session-project', (req, res, { url }) => {
    const pid = store.projectForSession(url.searchParams.get('sessionId'));
    sendJson(res, 200, { project: pid ? store.list().find((p) => p.id === pid) ?? { id: pid } : null });
  });

  registerTimelineRoutes(r, { store, project });
  registerAssetRoutes(r, { store, project });
  registerRenderRoutes(r, { store, render, project });
  return r;
}

// ---------- 时间线与协同 ----------
function registerTimelineRoutes(r, { store, project }) {
  r.add('GET', '/api/p/:pid/timeline', (req, res, { params }) => {
    const p = store.load(project(params));
    sendJson(res, 200, { rev: p.rev, timeline: p.timeline, ...(p.readOnly ? { readOnly: p.readOnly } : {}) }, { 'X-Djian-Rev': String(p.rev) });
  });
  r.add('POST', '/api/p/:pid/ops', async (req, res, { params }) => {
    const pid = project(params);
    const body = await readJson(req);
    const actor = ACTORS.has(body?.actor) ? body.actor : 'user';
    const result = store.apply(pid, {
      ops: body?.ops, baseRev: Number.isInteger(body?.baseRev) ? body.baseRev : undefined, actor,
      clientId: typeof body?.clientId === 'string' ? body.clientId.slice(0, 80) : null,
      label: typeof body?.label === 'string' ? body.label.slice(0, 80) : null,
      // 撤销/重做由面板以实体级系统操作提交（可写回整实体、绕过锁定）
      system: body?.undo === true && actor === 'user',
      batchId: typeof body?.batchId === 'string' ? body.batchId.slice(0, 80) : null,
    });
    sendJson(res, 200, result, { 'X-Djian-Rev': String(result.rev) });
  });
  r.add('PUT', '/api/p/:pid/timeline', async (req, res, { params }) => {
    const pid = project(params);
    const body = await readJson(req);
    const label = typeof body?.label === 'string' ? body.label.slice(0, 80) : '整体替换时间线';
    sendJson(res, 200, store.replace(pid, body?.timeline, { actor: ACTORS.has(body?.actor) ? body.actor : 'user', clientId: body?.clientId ?? null, label }));
  });
  r.add('GET', '/api/p/:pid/changes', (req, res, { params, url }) => {
    const pid = project(params);
    const since = Number(url.searchParams.get('since') ?? 0);
    const actor = url.searchParams.get('actor')?.split(',').filter(Boolean);
    sendJson(res, 200, store.eventsSince(pid, Number.isFinite(since) ? since : 0, {
      actor: actor?.length ? actor : undefined,
      excludeClientId: url.searchParams.get('exclude') || undefined,
      limit: Math.min(500, Number(url.searchParams.get('limit') ?? 100) || 100),
      withPatch: url.searchParams.get('patch') === '1',
    }));
  });
  r.add('GET', '/api/p/:pid/events', (req, res, { params, url }) => streamEvents(store, project(params), req, res, url));
  r.add('POST', '/api/p/:pid/presence', async (req, res, { params }) => {
    const pid = project(params);
    const body = await readJson(req, 64 * 1024);
    const clientId = typeof body?.clientId === 'string' ? body.clientId.slice(0, 80) : 'anonymous';
    const entry = store.setPresence(pid, clientId, {
      actor: body?.actor === 'ai' ? 'ai' : 'user',
      selection: Array.isArray(body?.selection) ? body.selection.slice(0, 20) : [],
      playhead: Number.isFinite(body?.playhead) ? body.playhead : null,
      mode: typeof body?.mode === 'string' ? body.mode.slice(0, 20) : null,
      status: typeof body?.status === 'string' ? body.status.slice(0, 20) : null,
      label: typeof body?.label === 'string' ? body.label.slice(0, 120) : null,
    });
    sendJson(res, 200, { ok: true, presence: entry });
  });
  r.add('GET', '/api/p/:pid/presence', (req, res, { params }) => sendJson(res, 200, store.getPresence(project(params))));
  r.add('GET', '/api/p/:pid/history', (req, res, { params }) => sendJson(res, 200, { snapshots: store.listSnapshots(project(params)) }));
  r.add('POST', '/api/p/:pid/history', async (req, res, { params }) => {
    const pid = project(params);
    const body = await readJson(req);
    const label = typeof body?.label === 'string' && body.label.trim() ? body.label.trim().slice(0, 80) : '手动保存的版本';
    sendJson(res, 200, { ok: true, id: store.snapshot(pid, label, { actor: 'user' }) });
  });
  r.add('POST', '/api/p/:pid/history/:snap/restore', async (req, res, { params }) => {
    const pid = project(params);
    const body = await readJson(req).catch(() => ({}));
    sendJson(res, 200, store.restoreSnapshot(pid, params.snap, { actor: 'user', clientId: body?.clientId ?? null }));
  });
}

/** SSE：先补发 since 之后的事件（太旧则发 reset 整份），再实时推送；25 秒心跳保活 */
function streamEvents(store, pid, req, res, url) {
  const p = store.load(pid);
  res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  const write = (type, data, id) => { if (!res.writableEnded) res.write((id !== undefined ? 'id: ' + id + '\n' : '') + 'event: ' + type + '\ndata: ' + JSON.stringify(data) + '\n\n'); };
  const lastId = Number(req.headers['last-event-id'] ?? url.searchParams.get('since') ?? p.rev);
  const since = Number.isFinite(lastId) ? lastId : p.rev;
  write('hello', { rev: p.rev, readOnly: p.readOnly ?? null });
  const backlog = store.eventsSince(pid, since, { limit: 500 });
  if (since > p.rev || backlog.truncated) write('reset', { rev: p.rev, timeline: p.timeline }, p.rev);
  else for (const ev of backlog.events) write('ops', ev, ev.rev);
  const presence = store.getPresence(pid);
  if (presence.ai) write('presence', { presence: presence.ai });
  const unsubscribe = store.subscribe(pid, (msg) => {
    if (msg.type === 'ops') write('ops', msg, msg.rev);
    else if (msg.type === 'presence') write('presence', { presence: msg.presence });
    else if (msg.type === 'assets') write('assets', { action: msg.action, name: msg.name });
    else if (msg.type === 'deleted') { write('deleted', {}); res.end(); }
  });
  const ping = setInterval(() => { if (!res.writableEnded) res.write(': ping\n\n'); }, 25_000);
  const close = () => { clearInterval(ping); unsubscribe(); };
  req.on('close', close);
  res.on('error', close);
}

// ---------- 素材 ----------
const inflight = new Map();
const once = (key, fn) => {
  if (!inflight.has(key)) inflight.set(key, fn().finally(() => inflight.delete(key)));
  return inflight.get(key);
};

/** 素材元信息（探测结果按 size+mtime 缓存，失败也缓存，避免每次轮询都重探） */
async function assetMeta(store, pid, name) {
  const file = store.assetPath(pid, name);
  const st = fs.statSync(file);
  const cached = store.readAssetMeta(pid, name);
  if (cached && cached.size === st.size && cached.mtimeMs === Math.floor(st.mtimeMs)) return cached;
  return once('meta|' + pid + '|' + name, async () => {
    const kind = assetKind(name);
    let info = {};
    try {
      info = await probe(file);
      // 图片也探测宽高，但没有时长/音轨
      if (kind === 'image') info = { width: info.width, height: info.height };
    } catch (e) { info = kind === 'image' ? {} : { error: e.message }; }
    const meta = { kind, size: st.size, mtimeMs: Math.floor(st.mtimeMs), ...info };
    store.writeAssetMeta(pid, name, meta);
    return meta;
  });
}

function uniqueName(dir, name) {
  const ext = path.extname(name);
  const stem = name.slice(0, name.length - ext.length);
  let n = 0, final = name;
  while (fs.existsSync(path.join(dir, final))) final = stem + '-' + ++n + ext;
  return final;
}

/** 把临时文件登记为素材：校验类型、改成不重名的最终文件名、探测 */
async function admitAsset(store, pid, temp, wantedName) {
  const name = safeAssetName(wantedName);
  if (!name || !assetKind(name)) { fs.rmSync(temp, { force: true }); throw new HttpError(400, '文件名或格式不支持（视频/图片/音频）'); }
  const dir = store.assetsDir(pid);
  const final = uniqueName(dir, name);
  fs.renameSync(temp, path.join(dir, final));
  const meta = await assetMeta(store, pid, final);
  store.notifyAssets(pid, { action: 'added', name: final });
  return { ok: true, name: final, type: meta.kind, duration: meta.duration ?? null, width: meta.width ?? null, height: meta.height ?? null };
}

function usageMap(timeline) {
  const m = new Map();
  for (const tr of [...timeline.videoTracks, ...timeline.audioTracks]) for (const c of tr.clips) m.set(c.src, (m.get(c.src) ?? 0) + 1);
  return m;
}

function registerAssetRoutes(r, { store, project }) {
  const base = (pid, name) => '/api/p/' + encodeURIComponent(pid) + '/assets/' + encodeURIComponent(name);
  r.add('GET', '/api/p/:pid/assets', async (req, res, { params }) => {
    const pid = project(params);
    const dir = store.assetsDir(pid);
    let names = [];
    try { names = fs.readdirSync(dir).filter((f) => !f.startsWith('.') && assetKind(f)); } catch {}
    const usage = usageMap(store.load(pid).timeline);
    const assets = [];
    for (const name of names.sort((a, b) => a.localeCompare(b))) {
      const meta = await assetMeta(store, pid, name).catch(() => null);
      if (!meta) continue;
      assets.push({
        name, type: meta.kind, size: meta.size, duration: meta.duration ?? null, width: meta.width ?? null, height: meta.height ?? null,
        hasAudio: meta.hasAudio ?? meta.kind === 'audio', usage: usage.get(name) ?? 0, error: meta.error ?? null,
        thumb: meta.kind === 'audio' ? null : base(pid, name) + '/thumb',
        media: '/api/p/' + encodeURIComponent(pid) + '/media/' + encodeURIComponent(name),
        ...(meta.attribution ? { attribution: meta.attribution } : {}),
      });
    }
    sendJson(res, 200, { projectId: pid, assetsDir: path.resolve(dir), assets });
  });
  // 二进制流式上传：边收边写临时文件，超限即断（不再整块读进内存）
  r.add('POST', '/api/p/:pid/assets', async (req, res, { params, url }) => {
    const pid = project(params);
    const dir = store.assetsDir(pid);
    fs.mkdirSync(dir, { recursive: true });
    const declared = Number(req.headers['content-length']);
    if (Number.isFinite(declared) && declared > LIMITS.upload) throw new HttpError(413, '上传超过 512MB 上限');
    const temp = path.join(dir, '.up-' + randomUUID());
    let size = 0;
    req.on('data', (c) => { size += c.length; if (size > LIMITS.upload) req.destroy(new HttpError(413, '上传超过 512MB 上限')); });
    try { await pipeline(req, fs.createWriteStream(temp)); }
    catch (e) { fs.rmSync(temp, { force: true }); throw e instanceof HttpError ? e : new HttpError(400, '上传中断：' + e.message); }
    if (!size) { fs.rmSync(temp, { force: true }); throw new HttpError(400, '空文件'); }
    sendJson(res, 200, await admitAsset(store, pid, temp, url.searchParams.get('name')));
  });
  // 本地绝对路径入库（AI 生成的文件直接导入；只接受常见媒体扩展名）
  r.add('POST', '/api/p/:pid/assets/import', async (req, res, { params }) => {
    const pid = project(params);
    const body = await readJson(req);
    const source = String(body?.path ?? '');
    if (!path.isAbsolute(source)) throw new HttpError(400, 'path 必须是本地绝对路径');
    let st;
    try { st = fs.statSync(source); } catch { throw new HttpError(404, '文件不存在：' + source); }
    if (!st.isFile()) throw new HttpError(400, '不是文件：' + source);
    if (st.size > LIMITS.upload) throw new HttpError(413, '文件超过 512MB 上限');
    if (!assetKind(source)) throw new HttpError(400, '只支持视频/图片/音频文件');
    const dir = store.assetsDir(pid);
    fs.mkdirSync(dir, { recursive: true });
    const temp = path.join(dir, '.imp-' + randomUUID());
    fs.copyFileSync(source, temp);
    sendJson(res, 200, await admitAsset(store, pid, temp, body?.name || path.basename(source)));
  });
  r.add('POST', '/api/p/:pid/assets/base64', async (req, res, { params }) => {
    const pid = project(params);
    const body = await readJson(req, 46 * 1024 * 1024);
    const buf = Buffer.from(String(body?.base64 ?? ''), 'base64');
    if (!buf.length) throw new HttpError(400, 'base64 为空或不合法');
    const dir = store.assetsDir(pid);
    fs.mkdirSync(dir, { recursive: true });
    const temp = path.join(dir, '.b64-' + randomUUID());
    fs.writeFileSync(temp, buf);
    sendJson(res, 200, await admitAsset(store, pid, temp, body?.name));
  });
  r.add('DELETE', '/api/p/:pid/assets/:name', (req, res, { params, url }) => {
    const pid = project(params);
    const name = safeAssetName(params.name);
    const file = name && store.assetPath(pid, name);
    if (!file || !fs.existsSync(file)) throw new HttpError(404, '素材不存在');
    const used = usageMap(store.load(pid).timeline).get(name) ?? 0;
    if (used && url.searchParams.get('force') !== '1') throw new HttpError(409, '素材正在被时间线使用（' + used + ' 处），先删除相关片段', 'ASSET_IN_USE');
    fs.rmSync(file, { force: true });
    store.dropAssetMeta(pid, name);
    store.notifyAssets(pid, { action: 'removed', name });
    sendJson(res, 200, { ok: true });
  });
  registerPreviewRoutes(r, { store, project });
}

function registerPreviewRoutes(r, { store, project }) {
  const resolveAsset = (params) => {
    const pid = project(params);
    const name = safeAssetName(params.name);
    const file = name && store.assetPath(pid, name);
    if (!file || !fs.existsSync(file)) throw new HttpError(404, '素材不存在');
    return { pid, name, file, kind: assetKind(name) };
  };
  const sendFile = async (req, res, file, type) => {
    res.setHeader('Cache-Control', 'no-cache');
    await serveMedia(req, res, file, type);
  };
  r.add('GET', '/api/p/:pid/media/:name', async (req, res, { params }) => {
    const { file } = resolveAsset(params);
    await serveMedia(req, res, file, MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream');
  });
  r.add('GET', '/api/p/:pid/assets/:name/thumb', async (req, res, { params }) => {
    const { pid, name, file, kind } = resolveAsset(params);
    if (kind === 'audio') throw new HttpError(404, '音频没有缩略图');
    const out = path.join(store.thumbsDir(pid), name + '.jpg');
    if (!fs.existsSync(out)) {
      const meta = await assetMeta(store, pid, name);
      await once('thumb|' + out, () => thumbnail(file, out, { kind, duration: meta.duration }));
    }
    await sendFile(req, res, out, 'image/jpeg');
  });
  // 胶片缩略图：{ v, interval, count, height, url }；第 i 格在 url + i（0 起）
  const tilesDir = (pid, name) => path.join(store.thumbsDir(pid), name + '.tiles');
  r.add('GET', '/api/p/:pid/assets/:name/sprite', async (req, res, { params }) => {
    const { pid, name, file, kind } = resolveAsset(params);
    if (kind !== 'video') throw new HttpError(404, '只有视频有胶片缩略图');
    const meta = await assetMeta(store, pid, name);
    let info = meta.sprite;
    const dir = tilesDir(pid, name);
    if (info?.v !== 2 || !fs.existsSync(dir)) {
      info = await once('sprite|' + dir, () => sprite(file, dir, meta.duration));
      store.writeAssetMeta(pid, name, { ...meta, sprite: info });
    }
    sendJson(res, 200, { ...info, url: '/api/p/' + encodeURIComponent(pid) + '/assets/' + encodeURIComponent(name) + '/sprite/' });
  });
  r.add('GET', '/api/p/:pid/assets/:name/sprite/:i', async (req, res, { params }) => {
    const { pid, name } = resolveAsset(params);
    const i = Number(params.i);
    if (!Number.isInteger(i) || i < 0 || i >= 1000) throw new HttpError(400, '格子序号无效');
    const tile = path.join(tilesDir(pid, name), 't_' + String(i + 1).padStart(3, '0') + '.jpg');
    if (!fs.existsSync(tile)) throw new HttpError(404, '缩略图尚未生成');
    // 文件名随内容不变（素材改动会换名或清缓存）：允许浏览器长缓存
    res.setHeader('Cache-Control', 'private, max-age=86400');
    await serveMedia(req, res, tile, 'image/jpeg');
  });
  // 波形峰值：二进制 Uint8（每秒 X-Peaks-Rate 个，0–255），视频原声同样可用
  r.add('GET', '/api/p/:pid/assets/:name/peaks', async (req, res, { params }) => {
    const { pid, name, file, kind } = resolveAsset(params);
    if (kind === 'image') throw new HttpError(404, '图片没有波形');
    const meta = await assetMeta(store, pid, name);
    if (meta.hasAudio === false) throw new HttpError(404, '素材没有音轨');
    const out = path.join(store.thumbsDir(pid), name + '.peaks.bin');
    let info = meta.peaks;
    if (!info || !fs.existsSync(out)) {
      info = await once('peaks|' + out, () => peaks(file, out));
      store.writeAssetMeta(pid, name, { ...meta, peaks: info });
    }
    res.setHeader('X-Peaks-Rate', String(info.rate));
    res.setHeader('Access-Control-Expose-Headers', 'X-Peaks-Rate, Content-Length');
    await sendFile(req, res, out, 'application/octet-stream');
  });
}

function registerRenderRoutes(r, { store, render, project }) {
  // ---------- 在线素材库 ----------
  r.add('GET', '/api/library/search', async (req, res, { url }) => {
    const q = (url.searchParams.get('q') ?? '').trim();
    if (!q) throw new HttpError(400, '缺少搜索词 q');
    const kind = url.searchParams.get('type') === 'audio' ? 'audio' : 'image';
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
    sendJson(res, 200, await searchOpenverse(q, kind, page));
  });
  r.add('POST', '/api/p/:pid/library/import', async (req, res, { params }) => {
    const pid = project(params);
    const body = await readJson(req);
    const src = String(body?.url ?? '');
    let name = safeAssetName(body?.name) || safeAssetName(decodeURIComponent(new URL(src, 'http://x').pathname.split('/').pop() ?? ''));
    if (!name) name = 'lib-' + Date.now().toString(36);
    if (!path.extname(name)) name += body?.kind === 'audio' ? '.mp3' : '.jpg';
    if (!assetKind(name)) throw new HttpError(400, '文件名或格式不支持（视频/图片/音频）');
    const { temp } = await safeDownload(src, store.assetsDir(pid), { maxBytes: LIMITS.libraryDownload });
    const result = await admitAsset(store, pid, temp, name);
    if (body?.license || body?.creator || body?.title) {
      const meta = store.readAssetMeta(pid, result.name) ?? {};
      store.writeAssetMeta(pid, result.name, { ...meta, attribution: { title: body.title ?? null, creator: body.creator ?? null, license: body.license ?? null, source: src } });
    }
    sendJson(res, 200, result);
  });

  // ---------- 取帧 ----------
  r.add('POST', '/api/p/:pid/frame', async (req, res, { params, url }) => {
    const pid = project(params);
    const body = await readJson(req);
    const result = await render.frame(pid, {
      seconds: body?.seconds ?? body?.at ?? 0,
      maxSize: Math.min(2048, Math.max(128, Number(body?.maxSize) || 768)),
      format: body?.format === 'png' ? 'png' : 'jpeg',
      analyze: body?.analyze === true,
    });
    if (url.searchParams.get('raw') === '1') {
      res.writeHead(200, { 'Content-Type': result.mime, 'Cache-Control': 'no-store' });
      res.end(result.image);
      return;
    }
    const { image, ...rest } = result;
    sendJson(res, 200, { ...rest, imageBase64: image.toString('base64') });
  });

  // ---------- 导出 ----------
  r.add('POST', '/api/p/:pid/export', async (req, res, { params }) => {
    const pid = project(params);
    const body = await readJson(req);
    sendJson(res, 202, { started: true, jobId: render.startExport(pid, { scale: body?.scale, quality: body?.quality }) });
  });
  r.add('GET', '/api/export/:job', (req, res, { params }) => sendJson(res, 200, render.status(params.job)));
  r.add('POST', '/api/export/:job/cancel', (req, res, { params }) => { render.cancelExport(params.job); sendJson(res, 200, { ok: true }); });
  r.add('GET', '/api/export/:job/download', async (req, res, { params }) => {
    const { file, name } = render.downloadPath(params.job);
    res.setHeader('Content-Disposition', "attachment; filename*=UTF-8''" + encodeURIComponent(name));
    await serveMedia(req, res, file, 'video/mp4');
  });
}
