// 协同时间线 store：服务端权威 + 客户端乐观更新 + 变基。
//  confirmed = 服务端已确认的状态（rev）；view = confirmed 叠加尚未确认的本地批次
//  本地修改 → 乐观应用并排队提交（带 batchId 幂等、baseRev）；远端修改经 SSE 以补丁到达，叠加后重放本地批次
//  撤销/重做只回退本面板自己的修改（实体级反向补丁），不吞掉 AI 期间的其他修改
import { applyOps, type Receipt as LocalReceipt } from '../../../engine/src/ops';
import { diffTimelines } from '../../../engine/src/diff';
import type { Timeline } from '../../../engine/src/schema';
import { api, EngineError, eventsUrl, type EngineEvent, type Op, type ProjectInfo } from './engine';

export type SyncStatus = 'connecting' | 'live' | 'saving' | 'offline' | 'error' | 'readonly';
export interface ActivityItem { rev: number; at: string; actor: EngineEvent['actor']; label: string | null; summary: string[]; changed: string[]; inverse?: Op[]; mine: boolean }
export interface Toast { id: number; kind: 'info' | 'error' | 'ai'; text: string; action?: { label: string; run: () => void } }
export interface StoreSnapshot {
  project: ProjectInfo | null;
  timeline: Timeline | null;
  rev: number;
  status: SyncStatus;
  error: string | null;
  pending: number;
  canUndo: boolean;
  canRedo: boolean;
  undoLabel: string | null;
  redoLabel: string | null;
  activity: ActivityItem[];
  flash: Record<string, number>;
  ai: { status: string; label: string | null; at: number } | null;
  toasts: Toast[];
  /** 素材变化计数（SSE assets 事件递增；素材面板据此刷新） */
  assetsRev: number;
}
interface Batch { batchId: string; ops: Op[]; label: string | null; undo: boolean; tries: number }
interface UndoEntry { label: string; before: Timeline; after: Timeline }

const uid = (p: string) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const ADD_OPS = new Set(['addClip', 'addAudio', 'addOverlay', 'addTrack', 'addMarker']);
const NEW_ID_OPS = new Set(['splitClip', 'splitOverlay', 'duplicateClip']);

/** 把乐观应用时本地生成的 id 写回操作，保证服务端使用同一批 id（选中/引用不丢失） */
export function pinIds(ops: Op[], receipts: LocalReceipt[]): Op[] {
  return ops.map((op, i) => {
    const r = receipts.find((x) => x.index === i);
    const ids = r?.ids ?? (r?.id ? [r.id] : []);
    if (!r || r.status === 'rejected' || !ids.length) return op;
    const next = { ...op };
    if (ADD_OPS.has(op.op) && next.id === undefined) next.id = r.id ?? ids[ids.length - 1];
    if ((op.op === 'addClip' || op.op === 'addAudio') && ids.length > 1) next.track = ids.find((id) => id !== next.id);
    if (op.op === 'addAudio' && ids.length > 1) next.name = op.name ?? (typeof op.track === 'string' && op.track !== 'new' ? op.track : '音频');
    if (NEW_ID_OPS.has(op.op) && next.newId === undefined) next.newId = ids[ids.length - 1];
    return next;
  });
}

export class TimelineStore {
  readonly clientId = uid('panel-');
  private listeners = new Set<() => void>();
  private snapshot: StoreSnapshot = {
    project: null, timeline: null, rev: 0, status: 'connecting', error: null, pending: 0,
    canUndo: false, canRedo: false, undoLabel: null, redoLabel: null, activity: [], flash: {}, ai: null, toasts: [], assetsRev: 0,
  };
  private confirmed: Timeline | null = null;
  private confirmedRev = 0;
  private view: Timeline | null = null;
  private transient: Timeline | null = null;
  private queue: Batch[] = [];
  private inflight = false;
  private undoStack: UndoEntry[] = [];
  private redoStack: UndoEntry[] = [];
  private source: EventSource | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private flashTimer: ReturnType<typeof setTimeout> | null = null;
  private toastSeq = 0;
  private stopped = false;
  private projectId: string | null = null;

  constructor(private readonly sessionId: string | undefined) {}

  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => this.listeners.delete(fn); };
  getSnapshot = () => this.snapshot;
  private emit(patch: Partial<StoreSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    for (const fn of this.listeners) fn();
  }
  private publish(extra: Partial<StoreSnapshot> = {}) {
    this.emit({
      timeline: this.transient ?? this.view,
      rev: this.confirmedRev,
      pending: this.queue.length + (this.inflight ? 0 : 0),
      canUndo: this.undoStack.length > 0,
      canRedo: this.redoStack.length > 0,
      undoLabel: this.undoStack.at(-1)?.label ?? null,
      redoLabel: this.redoStack.at(-1)?.label ?? null,
      ...extra,
    });
  }
  get project() { return this.snapshot.project; }
  get current() { return this.view; }

  // ---------- 生命周期 ----------
  async start() {
    this.stopped = false;
    try {
      const project = await api.bindSession(this.sessionId ?? 'standalone');
      if (this.stopped) return;
      this.projectId = project.id;
      this.emit({ project });
      await this.reload();
      void this.loadRecentActivity();
      this.restorePersisted();
      this.connect();
    } catch (e) {
      if (this.stopped) return;
      this.emit({ status: 'offline', error: e instanceof Error ? e.message : String(e) });
      this.retryTimer = setTimeout(() => void this.start(), 3000);
    }
  }
  stop() {
    this.stopped = true;
    this.source?.close();
    this.source = null;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    if (this.flashTimer) clearTimeout(this.flashTimer);
  }
  private async reload() {
    if (!this.projectId) return;
    const r = await api.timeline(this.projectId);
    this.confirmed = r.timeline;
    this.confirmedRev = r.rev;
    this.rebase();
    this.publish({ status: r.readOnly ? 'readonly' : this.queue.length ? 'saving' : 'live', error: r.readOnly ?? null });
  }
  private connect() {
    if (!this.projectId || typeof EventSource === 'undefined') return;
    this.source?.close();
    const es = new EventSource(eventsUrl(this.projectId, this.confirmedRev));
    this.source = es;
    es.addEventListener('ops', (e) => this.onRemote(JSON.parse((e as MessageEvent).data) as EngineEvent));
    es.addEventListener('reset', (e) => {
      const d = JSON.parse((e as MessageEvent).data) as { rev: number; timeline: Timeline };
      this.confirmed = d.timeline;
      this.confirmedRev = d.rev;
      this.rebase();
      this.publish();
    });
    es.addEventListener('presence', (e) => {
      const p = JSON.parse((e as MessageEvent).data).presence as { status?: string; label?: string; at: number };
      this.emit({ ai: p?.status && p.status !== 'idle' ? { status: p.status, label: p.label ?? null, at: p.at } : null });
    });
    es.addEventListener('assets', () => this.emit({ assetsRev: this.snapshot.assetsRev + 1 }));
    es.addEventListener('deleted', () => this.emit({ status: 'error', error: '项目已被删除' }));
    es.onopen = () => { if (this.snapshot.status === 'offline') this.emit({ status: this.queue.length ? 'saving' : 'live', error: null }); };
    es.onerror = () => { if (es.readyState === EventSource.CLOSED) this.emit({ status: 'offline' }); };
  }

  // ---------- 远端事件 ----------
  private onRemote(ev: EngineEvent) {
    if (!this.confirmed || ev.rev <= this.confirmedRev) return;
    if (ev.rev !== this.confirmedRev + 1 || !ev.patch) { void this.catchUp(); return; }
    this.confirmed = applyOps(this.confirmed, ev.patch, { actor: 'system' }).timeline;
    this.confirmedRev = ev.rev;
    const mine = ev.clientId === this.clientId;
    this.rebase();
    this.recordActivity(ev, mine);
    this.publish();
  }
  private async catchUp() {
    if (!this.projectId) return;
    try {
      const r = await api.changes(this.projectId, this.confirmedRev);
      if (r.truncated) { await this.reload(); return; }
      for (const ev of r.events) this.onRemote(ev);
    } catch { await this.reload().catch(() => undefined); }
  }
  /** 刷新/重开面板后补回最近 40 次修改（只填「动态」，不闪烁、不弹提示） */
  private async loadRecentActivity() {
    if (!this.projectId || this.confirmedRev <= 0) return;
    try {
      const upTo = this.confirmedRev;
      const r = await api.changes(this.projectId, Math.max(0, upTo - 40));
      const seen = new Set(this.snapshot.activity.map((a) => a.rev));
      const items: ActivityItem[] = r.events.filter((ev) => ev.rev <= upTo && !seen.has(ev.rev))
        .map((ev) => ({ rev: ev.rev, at: ev.at, actor: ev.actor, label: ev.label, summary: ev.summary, changed: ev.changed, inverse: ev.inverse, mine: ev.clientId === this.clientId }));
      if (items.length) this.emit({ activity: [...this.snapshot.activity, ...items].sort((a, b) => b.rev - a.rev).slice(0, 60) });
    } catch { /* 历史记录拿不到不影响编辑 */ }
  }

  private recordActivity(ev: EngineEvent, mine: boolean) {
    const item: ActivityItem = { rev: ev.rev, at: ev.at, actor: ev.actor, label: ev.label, summary: ev.summary, changed: ev.changed, inverse: ev.inverse, mine };
    const activity = [item, ...this.snapshot.activity.filter((a) => a.rev !== ev.rev)].slice(0, 60);
    const extra: Partial<StoreSnapshot> = { activity };
    if (!mine) {
      const now = Date.now();
      const flash = { ...this.snapshot.flash };
      for (const key of ev.changed) flash[key] = now;
      extra.flash = flash;
      if (this.flashTimer) clearTimeout(this.flashTimer);
      this.flashTimer = setTimeout(() => this.emit({ flash: {} }), 2600);
      if (ev.actor === 'ai') {
        const text = 'AI：' + (ev.label ?? ev.summary[0] ?? '修改了时间线').replace(/^AI\s*[：:]\s*/, '') + (ev.summary.length > 1 ? '（共 ' + ev.summary.length + ' 项）' : '');
        extra.toasts = [...this.snapshot.toasts, { id: ++this.toastSeq, kind: 'ai' as const, text, ...(ev.inverse?.length ? { action: { label: '撤销', run: () => this.revert(item) } } : {}) }].slice(-3);
      }
    }
    this.emit(extra);
  }

  /** 视图 = 已确认状态 + 未确认的本地批次（远端修改到达后重放，按 id 寻址天然可交换） */
  private rebase() {
    if (!this.confirmed) return;
    let t = this.confirmed;
    for (const b of this.queue) t = applyOps(t, b.ops, { actor: b.undo ? 'system' : 'user' }).timeline;
    this.view = t;
    this.transient = null;
  }

  // ---------- 本地修改 ----------
  /**
   * 乐观应用一批操作并排队提交；返回本地回执（含新建实体的 id）。
   * undo=true 表示实体级系统操作（撤销/重做/撤销 AI 修改），会以撤销身份提交。
   */
  dispatch(ops: Op[], opts: { label?: string; undo?: boolean; undoable?: boolean } = {}): LocalReceipt[] {
    if (!this.view || !ops.length || this.snapshot.status === 'readonly') return [];
    const before = this.view;
    const result = applyOps(before, ops, { actor: opts.undo ? 'system' : 'user' });
    const rejected = result.receipts.filter((r) => r.status === 'rejected');
    if (rejected.length) this.toast('error', rejected.map((r) => r.reason).join('；'));
    if (result.timeline === before || JSON.stringify(result.timeline) === JSON.stringify(before)) { this.transient = null; this.publish(); return result.receipts; }
    const batch: Batch = { batchId: uid('b'), ops: pinIds(ops, result.receipts), label: opts.label ?? null, undo: Boolean(opts.undo), tries: 0 };
    this.queue.push(batch);
    this.view = result.timeline;
    this.transient = null;
    if (opts.undoable !== false) {
      this.undoStack.push({ label: opts.label ?? '编辑', before, after: result.timeline });
      if (this.undoStack.length > 100) this.undoStack.shift();
      this.redoStack = [];
    }
    this.persist();
    this.publish({ status: 'saving' });
    void this.flush();
    return result.receipts;
  }

  /** 临时预览（拖动/滑动过程中）：不提交、不进撤销栈；传 null 结束预览 */
  preview(ops: Op[] | null) {
    if (!this.view) return;
    this.transient = ops && ops.length ? applyOps(this.view, ops, { actor: 'user' }).timeline : null;
    this.publish();
  }

  undo() {
    const entry = this.undoStack.pop();
    if (!entry || !this.view) return;
    const ops = diffTimelines(entry.after, entry.before) as Op[];
    this.redoStack.push(entry);
    if (ops.length) this.dispatch(ops, { label: '撤销：' + entry.label, undo: true, undoable: false });
    else this.publish();
  }
  redo() {
    const entry = this.redoStack.pop();
    if (!entry || !this.view) return;
    const ops = diffTimelines(entry.before, entry.after) as Op[];
    this.undoStack.push(entry);
    if (ops.length) this.dispatch(ops, { label: '重做：' + entry.label, undo: true, undoable: false });
    else this.publish();
  }
  /** 撤销某次 AI（或他人）的修改：应用服务端记录的反向补丁，本身可再撤销 */
  revert(item: ActivityItem) {
    if (!item.inverse?.length) return;
    const later = this.snapshot.activity.filter((a) => a.rev > item.rev && a.changed.some((k) => item.changed.includes(k)));
    this.dispatch(item.inverse, { label: '撤销' + (item.actor === 'ai' ? ' AI' : '') + '修改' + (item.label ? '「' + item.label + '」' : ''), undo: true });
    if (later.length) this.toast('info', '这些对象之后又被修改过，已按撤销时的状态恢复');
  }

  private async flush() {
    if (this.inflight || !this.projectId) return;
    const batch = this.queue[0];
    if (!batch) { this.publish({ status: this.snapshot.status === 'readonly' ? 'readonly' : 'live' }); return; }
    this.inflight = true;
    try {
      const r = await api.ops(this.projectId, { ops: batch.ops, baseRev: this.confirmedRev, clientId: this.clientId, label: batch.label ?? undefined, batchId: batch.batchId, undo: batch.undo });
      this.queue.shift();
      if (r.rev === this.confirmedRev + 1 && this.confirmed) {
        this.confirmed = applyOps(this.confirmed, r.patch, { actor: 'system' }).timeline;
        this.confirmedRev = r.rev;
        this.recordActivity({ rev: r.rev, at: new Date().toISOString(), actor: 'user', clientId: this.clientId, label: batch.label, summary: r.summary, changed: r.changed }, true);
      } else if (r.rev > this.confirmedRev) {
        await this.catchUp();
      }
      const bad = r.receipts.filter((x) => x.status === 'rejected');
      if (bad.length) this.toast('error', '部分修改未生效：' + bad.map((x) => x.reason).join('；'));
      if (r.conflicts?.length) this.toast('info', '你修改的对象刚被 AI 改过，已按你的修改为准');
      this.rebase();
      this.persist();
      this.publish({ status: this.queue.length ? 'saving' : 'live', error: null });
    } catch (e) {
      const err = e instanceof EngineError ? e : null;
      if (err && err.status >= 400 && err.status < 500 && err.status !== 408 && err.status !== 429) {
        // 服务端拒绝：丢弃这批，回到服务端状态
        this.queue.shift();
        this.rebase();
        this.persist();
        this.toast('error', '修改未保存：' + err.message);
        this.publish({ status: err.status === 423 ? 'readonly' : this.queue.length ? 'saving' : 'live' });
      } else {
        batch.tries++;
        this.publish({ status: 'offline', error: '连接中断，修改已保留，正在重试…' });
        const delay = Math.min(10_000, 800 * 2 ** Math.min(4, batch.tries));
        this.inflight = false;
        this.retryTimer = setTimeout(() => void this.flush(), delay);
        return;
      }
    } finally {
      this.inflight = false;
    }
    if (this.queue.length) void this.flush();
  }

  // ---------- 断电/刷新保护：未确认批次落本地，下次启动重发（服务端按 batchId 去重） ----------
  private persistKey() { return 'djian.pending.' + (this.projectId ?? 'none'); }
  private persist() {
    try {
      if (this.queue.length) localStorage.setItem(this.persistKey(), JSON.stringify(this.queue.map(({ batchId, ops, label, undo }) => ({ batchId, ops, label, undo }))));
      else localStorage.removeItem(this.persistKey());
    } catch { /* 存储不可用不影响编辑 */ }
  }
  private restorePersisted() {
    try {
      const raw = localStorage.getItem(this.persistKey());
      if (!raw) return;
      const saved = JSON.parse(raw) as Omit<Batch, 'tries'>[];
      if (!Array.isArray(saved) || !saved.length) return;
      this.queue.push(...saved.map((b) => ({ ...b, tries: 0 })));
      this.rebase();
      this.toast('info', '已恢复 ' + saved.length + ' 批上次未保存的修改，正在同步');
      this.publish({ status: 'saving' });
      void this.flush();
    } catch { /* 草稿损坏就丢弃 */ }
  }

  // ---------- 提示 ----------
  toast(kind: Toast['kind'], text: string, action?: Toast['action']) {
    const t: Toast = { id: ++this.toastSeq, kind, text, ...(action ? { action } : {}) };
    this.emit({ toasts: [...this.snapshot.toasts, t].slice(-3) });
    setTimeout(() => this.dismiss(t.id), kind === 'error' ? 7000 : 5000);
  }
  /** 重命名项目（服务端成功后再更新本地名字） */
  async renameProject(name: string) {
    const project = this.snapshot.project;
    if (!project || !name.trim() || name.trim() === project.name) return;
    try {
      await api.rename(project.id, name.trim());
      this.emit({ project: { ...project, name: name.trim() } });
    } catch (e) {
      this.toast('error', '重命名失败：' + (e instanceof Error ? e.message : String(e)));
    }
  }
  dismiss(id: number) { this.emit({ toasts: this.snapshot.toasts.filter((t) => t.id !== id) }); }
}
