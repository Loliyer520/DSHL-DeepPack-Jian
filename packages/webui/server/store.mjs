// 项目存储与协同内核：每个项目一份权威时间线 + 单调修订号 rev + 事件日志（events.jsonl）。
// 用户与 AI 都提交 ops；服务端用引擎共享归约器应用、严格校验、落盘、记事件、推送给订阅者。
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { parseTimeline, validateTimeline, TimelineVersionError } from '../../engine/dist/schema.js';
import { applyOps, normalizeOp } from '../../engine/dist/ops.js';
import { diffTimelines } from '../../engine/dist/diff.js';
import { describeBatch } from '../../engine/dist/describe.js';
import { atomicWriteJson, readJsonFile } from './storage.mjs';
import { DJIAN_HOME, LEGACY_CURRENT_FILE, LEGACY_TIMELINE, LIMITS, PROJECTS_DIR, SESSIONS_FILE, TRASH_DIR, assetKind } from './config.mjs';

export class StoreError extends Error {
  constructor(status, message, code, extra) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

export const sanitizeId = (s) => String(s ?? '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
const newProjectId = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');

export const emptyTimeline = (meta = {}) => parseTimeline({
  meta: { fps: 30, width: 1280, height: 720, ...meta },
  videoTracks: [{ id: 'v1', name: '主轨道', clips: [] }],
  audioTracks: [],
  overlays: [],
});

/** 素材文件名净化：只取文件名、禁止点开头、限制字符集；返回空串表示非法 */
export function safeAssetName(raw) {
  const base = path.basename(String(raw ?? '').replace(/\\/g, '/')).normalize('NFC');
  const cleaned = base.replace(/[^\p{L}\p{N}._\- ()（）]/gu, '_').replace(/^[.\s]+/, '').slice(0, 120);
  return cleaned && cleaned !== '.' && cleaned !== '..' ? cleaned : '';
}

class Project {
  constructor(id) {
    this.id = id;
    this.timeline = null;
    this.rev = 0;
    this.events = [];
    this.subscribers = new Set();
    this.presence = new Map();
    this.readOnly = null;
    this.lastActor = null;
    this.lastSnapshotAt = 0;
    this.lastSnapshotRev = 0;
    this.assetMeta = new Map();
  }
}

export class Store {
  constructor() {
    this.projects = new Map();
    fs.mkdirSync(PROJECTS_DIR, { recursive: true });
    this.migrateLegacy();
  }

  // ---------- 路径 ----------
  dir(id) { return path.join(PROJECTS_DIR, sanitizeId(id)); }
  timelineFile(id) { return path.join(this.dir(id), 'timeline.json'); }
  assetsDir(id) { return path.join(this.dir(id), 'assets'); }
  thumbsDir(id) { return path.join(this.dir(id), '.thumbs'); }
  historyDir(id) { return path.join(this.dir(id), 'history'); }
  journalFile(id) { return path.join(this.dir(id), 'events.jsonl'); }
  exists(id) { return Boolean(sanitizeId(id)) && fs.existsSync(this.timelineFile(id)); }

  /** 素材绝对路径（保证落在项目素材目录内）；非法名返回 null */
  assetPath(id, name) {
    const safe = safeAssetName(name);
    if (!safe || safe !== String(name).normalize('NFC')) return safe ? path.join(this.assetsDir(id), safe) : null;
    return path.join(this.assetsDir(id), safe);
  }
  assetExists(id, src) {
    const file = this.assetPath(id, src);
    try { return Boolean(file) && fs.statSync(file).isFile(); } catch { return false; }
  }
  assetDuration(id, src) {
    const meta = this.readAssetMeta(id, src);
    return typeof meta?.duration === 'number' ? meta.duration : undefined;
  }
  readAssetMeta(id, name) {
    const p = this.projects.get(id);
    if (p?.assetMeta.has(name)) return p.assetMeta.get(name);
    const meta = readJsonFile(path.join(this.thumbsDir(id), safeAssetName(name) + '.json'));
    if (p && meta) p.assetMeta.set(name, meta);
    return meta;
  }
  writeAssetMeta(id, name, meta) {
    atomicWriteJson(path.join(this.thumbsDir(id), safeAssetName(name) + '.json'), meta);
    this.projects.get(id)?.assetMeta.set(name, meta);
  }
  dropAssetMeta(id, name) {
    this.projects.get(id)?.assetMeta.delete(name);
    for (const suffix of ['.json', '.jpg', '.sprite.jpg', '.sprite.json', '.peaks.bin']) {
      fs.rmSync(path.join(this.thumbsDir(id), safeAssetName(name) + suffix), { force: true });
    }
    fs.rmSync(path.join(this.thumbsDir(id), safeAssetName(name) + '.tiles'), { recursive: true, force: true });
  }

  // ---------- 项目 ----------
  readProjectMeta(id) { return readJsonFile(path.join(this.dir(id), 'project.json'), null); }
  writeProjectMeta(id, meta) { atomicWriteJson(path.join(this.dir(id), 'project.json'), meta); }

  list() {
    let dirs = [];
    try { dirs = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory() && this.exists(d.name)); } catch {}
    return dirs.map((d) => {
      const meta = this.readProjectMeta(d.name) ?? {};
      let canvas = meta.canvas ?? this.projects.get(d.name)?.timeline?.meta ?? null;
      if (!canvas) {
        canvas = readJsonFile(this.timelineFile(d.name))?.meta ?? null;
        if (canvas) this.writeProjectMeta(d.name, { ...meta, canvas });
      }
      return { id: d.name, name: meta.name ?? d.name, createdAt: meta.createdAt ?? null, updatedAt: meta.updatedAt ?? null, meta: canvas };
    }).sort((a, b) => String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? '')));
  }

  create(name, canvas) {
    const id = newProjectId();
    const t = emptyTimeline(canvas && typeof canvas === 'object' ? sanitizeCanvas(canvas) : {});
    fs.mkdirSync(this.assetsDir(id), { recursive: true });
    atomicWriteJson(this.timelineFile(id), t);
    this.writeProjectMeta(id, { name: String(name || '未命名项目').slice(0, 60), createdAt: new Date().toISOString(), canvas: t.meta });
    return id;
  }

  rename(id, name) {
    const meta = this.readProjectMeta(id);
    if (!meta) throw new StoreError(404, '项目不存在');
    meta.name = String(name).trim().slice(0, 60) || meta.name;
    this.writeProjectMeta(id, meta);
  }

  /** 删除 = 移入回收站（可手动找回），不做不可逆删除 */
  remove(id) {
    if (!this.exists(id)) throw new StoreError(404, '项目不存在');
    const p = this.projects.get(id);
    for (const fn of p?.subscribers ?? []) fn({ type: 'deleted' });
    this.projects.delete(id);
    fs.mkdirSync(TRASH_DIR, { recursive: true });
    fs.renameSync(this.dir(id), path.join(TRASH_DIR, id + '-' + stamp()));
    const map = this.sessions();
    for (const [sid, pid] of Object.entries(map)) if (pid === id) delete map[sid];
    atomicWriteJson(SESSIONS_FILE, map);
  }

  // ---------- 会话 = 项目 ----------
  sessions() {
    const m = readJsonFile(SESSIONS_FILE, {});
    return m && typeof m === 'object' && !Array.isArray(m) ? m : {};
  }
  /** 只读查询：会话已绑定的项目（不创建） */
  projectForSession(sessionId) {
    const sid = sanitizeId(sessionId);
    const pid = sid ? this.sessions()[sid] : undefined;
    return pid && this.exists(pid) ? pid : undefined;
  }
  /** 幂等绑定：已绑定直接返回；首个会话继承旧版“当前项目”（老用户数据不丢），否则新建 */
  bindSession(sessionId, name) {
    const sid = sanitizeId(sessionId);
    if (!sid) throw new StoreError(400, '缺少 sessionId');
    const map = this.sessions();
    if (map[sid] && this.exists(map[sid])) return map[sid];
    const taken = new Set(Object.values(map));
    let legacy = null;
    try { legacy = sanitizeId(fs.readFileSync(LEGACY_CURRENT_FILE, 'utf8').trim()); } catch {}
    const id = legacy && this.exists(legacy) && !taken.has(legacy)
      ? legacy
      : this.create(name || '剪辑 ' + new Date().toISOString().slice(0, 10));
    map[sid] = id;
    atomicWriteJson(SESSIONS_FILE, map);
    return id;
  }

  /** 旧版全局 timeline.json → 默认项目（只在首次启动、没有任何项目时执行一次） */
  migrateLegacy() {
    if (fs.readdirSync(PROJECTS_DIR).length) return;
    const legacy = readJsonFile(LEGACY_TIMELINE);
    if (!legacy?.meta) return;
    try {
      const t = parseTimeline(legacy);
      const id = this.create('默认项目', t.meta);
      atomicWriteJson(this.timelineFile(id), t);
      fs.writeFileSync(LEGACY_CURRENT_FILE, id);
    } catch (e) {
      console.warn('[djian] 旧版时间线迁移失败：', e.message);
    }
  }

  // ---------- 加载 ----------
  load(id) {
    const pid = sanitizeId(id);
    let p = this.projects.get(pid);
    if (p) return p;
    if (!this.exists(pid)) throw new StoreError(404, '项目不存在', 'PROJECT_NOT_FOUND');
    p = new Project(pid);
    const file = this.timelineFile(pid);
    let raw;
    try {
      raw = JSON.parse(fs.readFileSync(file, 'utf8'));
      p.timeline = parseTimeline(raw);
      // 旧格式首次加载即升级落盘；升级前留一份原样备份，便于回退旧版插件
      if (raw.version !== p.timeline.version) {
        const backup = path.join(this.dir(pid), 'timeline.v' + (raw.version ?? 1) + '.bak.json');
        if (!fs.existsSync(backup)) fs.copyFileSync(file, backup);
        atomicWriteJson(file, p.timeline);
      }
    } catch (error) {
      if (error instanceof TimelineVersionError) {
        p.readOnly = error.message;
        p.timeline = emptyTimeline();
      } else {
        // 损坏：原文件改名隔离（绝不覆盖），尝试从最近快照恢复
        const quarantined = path.join(this.dir(pid), 'timeline.corrupt-' + stamp() + '.json');
        try { fs.renameSync(file, quarantined); } catch {}
        const recovered = this.latestSnapshotTimeline(pid);
        p.timeline = recovered ?? emptyTimeline(raw?.meta && typeof raw.meta === 'object' ? sanitizeCanvas(raw.meta) : {});
        atomicWriteJson(file, p.timeline);
        console.warn('[djian] 项目 ' + pid + ' 时间线损坏（' + error.message + '），已隔离为 ' + path.basename(quarantined) + (recovered ? '，并从快照恢复' : ''));
        p.corruptNotice = '时间线文件损坏，原文件已保留为 ' + path.basename(quarantined) + (recovered ? '，已从最近快照恢复' : '，已重置为空时间线');
      }
    }
    this.readJournalTail(p);
    this.projects.set(pid, p);
    if (p.corruptNotice) this.record(p, { actor: 'system', label: '自动恢复', summary: [p.corruptNotice], changed: ['*'], patch: [] });
    return p;
  }

  readJournalTail(p) {
    let text = '';
    try { text = fs.readFileSync(this.journalFile(p.id), 'utf8'); } catch { return; }
    const lines = text.split('\n').filter(Boolean);
    for (const line of lines.slice(-LIMITS.eventRing)) {
      try { p.events.push(JSON.parse(line)); } catch {}
    }
    p.rev = p.events.length ? p.events[p.events.length - 1].rev : 0;
  }

  // ---------- 快照（版本历史） ----------
  snapshotIndex(id) { return readJsonFile(path.join(this.historyDir(id), 'index.json'), []) ?? []; }
  snapshot(id, label, { actor = 'system', timeline } = {}) {
    const p = this.load(id);
    const snapId = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const dir = this.historyDir(id);
    fs.mkdirSync(dir, { recursive: true });
    atomicWriteJson(path.join(dir, snapId + '.json'), { id: snapId, at: new Date().toISOString(), label, rev: p.rev, actor, timeline: timeline ?? p.timeline });
    const index = [...this.snapshotIndex(id), { id: snapId, at: new Date().toISOString(), label: String(label ?? '').slice(0, 80), rev: p.rev, actor }];
    while (index.length > LIMITS.historyKept) {
      const old = index.shift();
      fs.rmSync(path.join(dir, old.id + '.json'), { force: true });
    }
    atomicWriteJson(path.join(dir, 'index.json'), index);
    p.lastSnapshotAt = Date.now();
    p.lastSnapshotRev = p.rev;
    return snapId;
  }
  listSnapshots(id) {
    this.load(id);
    const index = this.snapshotIndex(id);
    if (index.length) return [...index].reverse();
    // 旧版快照没有索引：扫描一次补建
    const dir = this.historyDir(id);
    let files = [];
    try { files = fs.readdirSync(dir).filter((f) => /^v[\w]+\.json$/.test(f)); } catch {}
    const rebuilt = files.map((f) => readJsonFile(path.join(dir, f))).filter(Boolean)
      .map((s) => ({ id: s.id, at: s.at, label: s.label, rev: s.rev ?? null, actor: s.actor ?? 'system' }))
      .sort((a, b) => String(a.at).localeCompare(String(b.at)));
    if (rebuilt.length) atomicWriteJson(path.join(dir, 'index.json'), rebuilt);
    return rebuilt.reverse();
  }
  latestSnapshotTimeline(id) {
    for (const entry of [...this.snapshotIndex(id)].reverse()) {
      const snap = readJsonFile(path.join(this.historyDir(id), entry.id + '.json'));
      try { if (snap?.timeline) return parseTimeline(snap.timeline); } catch {}
    }
    return null;
  }

  // ---------- 协同：应用操作 ----------
  /**
   * 应用一批操作。actor: user/ai/system；system=true 时以系统身份执行（撤销/恢复，绕过锁定）。
   * baseRev 落后时仍按“意图”应用（操作按 id 寻址，天然可交换），并报告与他人修改重叠的实体。
   */
  apply(id, { ops, baseRev, actor = 'user', clientId = null, label = null, system = false, batchId = null }) {
    const p = this.load(id);
    // 幂等：同一批次重发（网络重试、刷新后重放草稿）直接返回首次结果
    if (batchId) {
      const done = p.batches?.get(batchId) ?? p.events.find((e) => e.batchId === batchId);
      if (done) return { ...(done.result ?? { rev: done.rev, receipts: [], changed: done.changed ?? [], summary: done.summary ?? [], patch: done.patch ?? [], conflicts: [] }), duplicate: true };
    }
    if (p.readOnly) throw new StoreError(423, p.readOnly, 'READ_ONLY');
    if (!Array.isArray(ops) || !ops.length) throw new StoreError(400, 'ops 必须是非空数组');
    if (ops.length > 500) throw new StoreError(413, '单批操作不能超过 500 条');
    const before = p.timeline;
    const result = applyOps(before, ops, {
      actor: system ? 'system' : actor,
      assetExists: (src) => this.assetExists(id, src),
      assetDuration: (src) => this.assetDuration(id, src),
    });
    const issues = validateTimeline(result.timeline);
    if (issues.length) {
      throw new StoreError(422, '修改后的时间线不合法，整批未保存：' + issues.join('；'), 'INVALID_RESULT', { receipts: result.receipts, issues });
    }
    const patch = diffTimelines(before, result.timeline);
    if (!patch.length) return { rev: p.rev, receipts: result.receipts, changed: [], summary: [], patch: [], conflicts: [] };

    // 与他人（其他客户端/AI）自 baseRev 以来修改过的实体重叠 → 提示，但不阻断
    const conflicts = [];
    if (Number.isInteger(baseRev) && baseRev < p.rev) {
      const mine = new Set(result.changed);
      for (const ev of p.events) {
        if (ev.rev <= baseRev || (clientId && ev.clientId === clientId)) continue;
        for (const key of ev.changed ?? []) if (mine.has(key)) conflicts.push({ key, rev: ev.rev, actor: ev.actor, summary: ev.summary?.[0] });
      }
    }

    this.maybeSnapshot(p, actor, before);
    const normalized = ops.map((o) => normalizeOp(o).op ?? o);
    const summary = describeBatch(before, result.timeline, normalized, result.receipts, label ?? undefined);
    p.timeline = result.timeline;
    atomicWriteJson(this.timelineFile(id), p.timeline);
    if (result.changed.includes('meta') || result.changed.includes('*')) this.touchProjectMeta(id, p.timeline.meta);
    const inverse = diffTimelines(result.timeline, before);
    const event = this.record(p, { actor, clientId, label, summary, changed: result.changed, patch, inverse, batchId });
    const response = { rev: event.rev, receipts: result.receipts, changed: result.changed, summary, patch, conflicts };
    if (batchId) {
      p.batches ??= new Map();
      p.batches.set(batchId, { result: response });
      if (p.batches.size > 300) p.batches.delete(p.batches.keys().next().value);
    }
    return response;
  }

  /** 整份替换（历史恢复/导入）：翻译成实体级系统操作，事件流保持可回放 */
  replace(id, timeline, { actor = 'user', clientId = null, label = '替换时间线' } = {}) {
    const p = this.load(id);
    const next = parseTimeline(timeline);
    const ops = diffTimelines(p.timeline, next);
    if (!ops.length) return { rev: p.rev, receipts: [], changed: [], summary: [], patch: [], conflicts: [] };
    return this.apply(id, { ops, actor, clientId, label, system: true });
  }

  restoreSnapshot(id, snapId, opts = {}) {
    if (!/^v[\w]+$/.test(snapId)) throw new StoreError(404, '快照不存在');
    const snap = readJsonFile(path.join(this.historyDir(id), snapId + '.json'));
    if (!snap?.timeline) throw new StoreError(404, '快照不存在');
    this.snapshot(id, '恢复前自动快照', { actor: opts.actor ?? 'user' });
    return this.replace(id, snap.timeline, { ...opts, label: '恢复版本「' + (snap.label ?? snapId) + '」' });
  }

  maybeSnapshot(p, actor, before) {
    const now = Date.now();
    // AI 连续修改只在开始时拍一次“修改前”快照；用户修改按时间/修订数节流
    if (actor === 'ai' && (p.lastActor !== 'ai' || now - p.lastSnapshotAt > 120_000)) {
      this.snapshot(p.id, 'AI 修改前', { actor: 'system', timeline: before });
    } else if (actor === 'user' && (p.rev - p.lastSnapshotRev >= 50 || (p.lastSnapshotAt && now - p.lastSnapshotAt > 600_000))) {
      this.snapshot(p.id, '自动保存', { actor: 'system', timeline: before });
    } else if (!p.lastSnapshotAt) {
      p.lastSnapshotAt = now;
      p.lastSnapshotRev = p.rev;
    }
    p.lastActor = actor;
  }

  touchProjectMeta(id, canvas) {
    const meta = this.readProjectMeta(id) ?? {};
    this.writeProjectMeta(id, { ...meta, canvas, updatedAt: new Date().toISOString() });
  }

  record(p, { actor, clientId = null, label = null, summary, changed, patch, inverse = [], batchId = null }) {
    const event = { rev: p.rev + 1, at: new Date().toISOString(), actor, clientId, label, summary, changed, patch, inverse, ...(batchId ? { batchId } : {}) };
    p.rev = event.rev;
    p.events.push(event);
    if (p.events.length > LIMITS.eventRing) p.events.splice(0, p.events.length - LIMITS.eventRing);
    try {
      const file = this.journalFile(p.id);
      fs.appendFileSync(file, JSON.stringify(event) + '\n');
      if (fs.statSync(file).size > LIMITS.journalBytes) {
        const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).slice(-LIMITS.journalKeepLines);
        fs.writeFileSync(file + '.tmp', lines.join('\n') + '\n');
        fs.renameSync(file + '.tmp', file);
      }
    } catch (e) {
      console.warn('[djian] 事件日志写入失败：', e.message);
    }
    this.emit(p, { type: 'ops', ...event });
    return event;
  }

  // ---------- 订阅与查询 ----------
  subscribe(id, fn) {
    const p = this.load(id);
    p.subscribers.add(fn);
    return () => p.subscribers.delete(fn);
  }
  /** 素材增删通知（面板素材列表实时刷新；AI 下载素材后用户立刻能看到） */
  notifyAssets(id, detail) {
    try { this.emit(this.load(id), { type: 'assets', ...detail }); } catch { /* 项目已删除 */ }
  }
  emit(p, message) {
    for (const fn of p.subscribers) {
      try { fn(message); } catch (e) { console.warn('[djian] 推送失败：', e.message); }
    }
  }
  /** rev 之后的事件；超出内存窗口时返回 truncated，调用方应整份重载 */
  eventsSince(id, since, { actor, excludeClientId, limit = 200, withPatch = true } = {}) {
    const p = this.load(id);
    const oldest = p.events.length ? p.events[0].rev : p.rev + 1;
    const truncated = since < oldest - 1 && p.rev > since;
    let list = p.events.filter((e) => e.rev > since);
    if (actor) list = list.filter((e) => (Array.isArray(actor) ? actor.includes(e.actor) : e.actor === actor));
    if (excludeClientId) list = list.filter((e) => e.clientId !== excludeClientId);
    list = list.slice(-limit).map((e) => (withPatch ? e : { rev: e.rev, at: e.at, actor: e.actor, clientId: e.clientId, label: e.label, summary: e.summary, changed: e.changed }));
    if (!withPatch) return { rev: p.rev, truncated, events: list };
    return { rev: p.rev, truncated, events: list };
  }

  // ---------- 在场状态：用户的选中/播放头、AI 的工作状态 ----------
  setPresence(id, clientId, data) {
    const p = this.load(id);
    const entry = { ...data, clientId, at: Date.now() };
    p.presence.set(clientId, entry);
    if (entry.actor === 'ai') this.emit(p, { type: 'presence', presence: entry });
    return entry;
  }
  getPresence(id) {
    const p = this.load(id);
    const fresh = [...p.presence.values()].filter((x) => Date.now() - x.at < 120_000);
    const user = fresh.filter((x) => x.actor !== 'ai').sort((a, b) => b.at - a.at)[0] ?? null;
    const ai = fresh.filter((x) => x.actor === 'ai').sort((a, b) => b.at - a.at)[0] ?? null;
    return { user, ai };
  }
}

export function sanitizeCanvas(meta) {
  const out = {};
  const n = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : Number(v));
  if (Number.isFinite(n(meta.fps))) out.fps = Math.min(120, Math.max(1, Math.round(n(meta.fps))));
  if (Number.isFinite(n(meta.width))) out.width = Math.min(7680, Math.max(16, Math.round(n(meta.width) / 2) * 2));
  if (Number.isFinite(n(meta.height))) out.height = Math.min(7680, Math.max(16, Math.round(n(meta.height) / 2) * 2));
  return out;
}

export const newClientEventId = () => randomUUID();
export { assetKind };
