// 渲染调度：取帧（串行队列 + 同参数去重 + 超时）与导出任务（单任务、可取消、文件保留上限）。
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { renderFrames, renderVideo, warmup, closeRenderer } from '../../engine/dist/render.js';
import { timelineHasContent } from '../../engine/dist/timeline.js';
import { analyzeImage } from './media-tools.mjs';
import { activeTextLayers } from './frame-analysis.mjs';
import { EXPORTS_DIR, LIMITS } from './config.mjs';
import { HttpError } from './http.mjs';

export class RenderService {
  constructor({ store, baseUrl }) {
    this.store = store;
    this.baseUrl = baseUrl;
    this.frameChain = Promise.resolve();
    this.pendingFrames = new Map();
    this.jobs = new Map();
    this.activeJob = null;
  }

  assetBase(pid) { return this.baseUrl + '/api/p/' + encodeURIComponent(pid) + '/media/'; }
  get fontsBase() { return this.baseUrl + '/fonts'; }

  warmup() {
    return warmup().then(() => console.log('[djian] 渲染器已预热'), (e) => console.warn('[djian] 渲染器预热失败（首次取帧时重试）：', e.message));
  }
  close() { return closeRenderer(); }

  /** 取帧：seconds 1–12 个时间点；多点时返回联络图。analyze=true 附带画面统计（给非视觉模型） */
  async frame(pid, { seconds, maxSize = 768, format = 'jpeg', analyze = false, timeline } = {}) {
    const p = this.store.load(pid);
    const t = timeline ?? p.timeline;
    if (!timelineHasContent(t)) throw new HttpError(400, '时间线为空，没有可看的画面');
    const list = (Array.isArray(seconds) ? seconds : [seconds]).map(Number).filter((s) => Number.isFinite(s) && s >= 0).slice(0, 12);
    if (!list.length) throw new HttpError(400, 'seconds 必须是非负数字或数字数组');
    const key = JSON.stringify([pid, timeline ? 'custom' : p.rev, list, maxSize, format, analyze]);
    if (this.pendingFrames.has(key)) return this.pendingFrames.get(key);
    if (this.pendingFrames.size >= 8) throw new HttpError(429, '取帧请求过多，请稍后重试');
    const task = (this.frameChain = this.frameChain.catch(() => {}).then(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 150_000);
      try {
        const r = await renderFrames({ timeline: t, seconds: list, assetBase: this.assetBase(pid), fontsBase: this.fontsBase, format, maxSize, signal: controller.signal });
        let stats = null;
        if (analyze && !r.sheet) {
          try { stats = await analyzeImage(r.buffer); } catch (e) { stats = { error: '画面统计不可用：' + e.message }; }
        }
        return {
          image: r.buffer, mime: r.format === 'png' ? 'image/png' : 'image/jpeg', width: r.width, height: r.height, sheet: r.sheet,
          frames: r.frames.map((f) => ({ frame: f, seconds: Math.round((f / t.meta.fps) * 1000) / 1000, activeTextLayers: activeTextLayers(t, f) })),
          stats,
        };
      } catch (e) {
        const missing = [...new Set([...t.videoTracks, ...t.audioTracks].flatMap((tr) => tr.clips.map((c) => c.src)))].filter((src) => !this.store.assetExists(pid, src));
        throw new HttpError(500, '取帧失败：' + e.message + (missing.length ? '。时间线引用了素材库中不存在的文件：' + missing.join('、') + '（素材按项目隔离）' : ''));
      } finally {
        clearTimeout(timer);
      }
    }));
    this.pendingFrames.set(key, task);
    task.then(() => this.pendingFrames.delete(key), () => this.pendingFrames.delete(key));
    return task;
  }

  // ---------- 导出 ----------
  startExport(pid, { scale = 1, quality = 'standard' } = {}) {
    if (this.activeJob?.status === 'rendering') throw new HttpError(409, '已有导出任务进行中，请稍候或先取消');
    const p = this.store.load(pid);
    if (!timelineHasContent(p.timeline)) throw new HttpError(400, '时间线为空，没有可导出的内容');
    const CRF = { draft: 28, standard: 20, high: 16 };
    const s = [0.5, 1, 2].includes(Number(scale)) ? Number(scale) : 1;
    const jobId = randomUUID();
    const dir = path.join(EXPORTS_DIR, pid);
    fs.mkdirSync(dir, { recursive: true });
    const name = (this.store.readProjectMeta(pid)?.name ?? 'djian').replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 40) + '-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.mp4';
    const controller = new AbortController();
    const job = { jobId, pid, rev: p.rev, status: 'rendering', progress: { rendered: 0, total: 0, percent: 0, stage: 'preparing' }, outFile: path.join(dir, name), controller, startedAt: Date.now() };
    this.jobs.set(jobId, job);
    this.activeJob = job;
    while (this.jobs.size > 20) this.jobs.delete(this.jobs.keys().next().value);
    renderVideo({
      timeline: p.timeline, outFile: job.outFile, assetBase: this.assetBase(pid), fontsBase: this.fontsBase,
      scale: s, crf: CRF[quality], signal: controller.signal,
      onProgress: (pr) => {
        if (job.status !== 'rendering') return;
        job.progress = { rendered: pr.rendered, total: pr.total, percent: pr.total ? Math.round((pr.rendered / pr.total) * 100) : 0, stage: pr.stage };
      },
    }).then((r) => {
      job.result = { fileName: name, sizeBytes: fs.statSync(job.outFile).size, durationInFrames: r.durationInFrames, fps: r.fps };
      job.status = 'done';
      this.pruneExports();
    }).catch((e) => {
      job.status = controller.signal.aborted ? 'cancelled' : 'error';
      job.error = controller.signal.aborted ? '已取消' : e.message;
      fs.rmSync(job.outFile, { force: true });
    });
    return jobId;
  }

  cancelExport(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) throw new HttpError(404, '导出任务不存在');
    if (job.status === 'rendering') job.controller.abort();
  }

  status(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) throw new HttpError(404, '导出任务已过期或引擎已重启，请重新导出');
    const { outFile: _o, controller: _c, ...rest } = job;
    return rest;
  }

  downloadPath(jobId) {
    const job = this.jobs.get(jobId);
    if (job?.status !== 'done' || !fs.existsSync(job.outFile)) throw new HttpError(404, '暂无已完成的导出');
    return { file: job.outFile, name: job.result.fileName };
  }

  pruneExports() {
    try {
      const files = fs.readdirSync(EXPORTS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory())
        .flatMap((d) => fs.readdirSync(path.join(EXPORTS_DIR, d.name)).filter((f) => f.endsWith('.mp4')).map((f) => path.join(EXPORTS_DIR, d.name, f)))
        .map((f) => ({ f, t: fs.statSync(f).mtimeMs })).sort((a, b) => b.t - a.t);
      for (const { f } of files.slice(LIMITS.exportsKept)) fs.rmSync(f, { force: true });
    } catch {}
  }
}
