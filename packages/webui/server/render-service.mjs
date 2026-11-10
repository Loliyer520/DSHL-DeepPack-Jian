import {deliveryPreflight,exportFailure} from './delivery-tools.mjs';
// 渲染调度：取帧（串行队列 + 同参数去重 + 超时）与导出任务（单任务、可取消、文件保留上限）。
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
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
    this.frameCache = new Map();
    this.jobs = new Map();
    this.activeJob = null;
  }

  assetBase(pid) { return this.baseUrl + '/api/p/' + encodeURIComponent(pid) + '/media/'; }
  get fontsBase() { return this.baseUrl + '/fonts'; }
  get mathBase() { return this.baseUrl + '/api/math'; }

  warmup() {
    return warmup().then(() => console.log('[djian] 渲染器已预热'), (e) => console.warn('[djian] 渲染器预热失败（首次取帧时重试）：', e.message));
  }
  async close() { this.closing=true; for(const j of this.jobs.values())if(j.status==='queued')j.status='cancelled'; this.activeJob?.controller.abort(); await this.activeJob?.task; await this.proxies?.close(); return closeRenderer(); }
  clearCache(pid) { for(const [key,value] of this.frameCache)if(value.pid===pid)this.frameCache.delete(key); }

  /** 取帧：seconds 1–12 个时间点；多点时返回联络图。analyze=true 附带画面统计（给非视觉模型） */
  async frame(pid, { seconds, maxSize = 768, format = 'jpeg', analyze = false, measure = false, timeline } = {}) {
    const p = this.store.load(pid);
    const t = timeline ?? p.timeline;
    if (!timelineHasContent(t)) throw new HttpError(400, '时间线为空，没有可看的画面');
    const list = (Array.isArray(seconds) ? seconds : [seconds]).map(Number).filter((s) => Number.isFinite(s) && s >= 0).slice(0, 12);
    if (!list.length) throw new HttpError(400, 'seconds 必须是非负数字或数字数组');
    const assets = fs.readdirSync(this.store.assetsDir(pid)).map(n=>{const st=fs.statSync(path.join(this.store.assetsDir(pid),n));return [n,st.size,st.mtimeMs];});
    const key = createHash('sha256').update(JSON.stringify([pid,t,assets,list,maxSize,format,analyze,measure])).digest('hex');
    const cached=this.frameCache.get(key); if(cached){this.frameCache.delete(key);this.frameCache.set(key,cached);return cached.result;}
    if (this.pendingFrames.has(key)) return this.pendingFrames.get(key);
    if (this.pendingFrames.size >= 8) throw new HttpError(429, '取帧请求过多，请稍后重试');
    const task = (this.frameChain = this.frameChain.catch(() => {}).then(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 150_000);
      try {
        const r = await renderFrames({ timeline: t, seconds: list, assetBase: this.assetBase(pid), fontsBase: this.fontsBase, mathBase: this.mathBase, format, maxSize, measure, signal: controller.signal });
        let stats = null;
        if (analyze && !r.sheet) {
          try { stats = await analyzeImage(r.buffer); } catch (e) { stats = { error: '画面统计不可用：' + e.message }; }
        }
        return {
          image: r.buffer, mime: r.format === 'png' ? 'image/png' : 'image/jpeg', width: r.width, height: r.height, sheet: r.sheet,
          frames: r.frames.map((f) => ({ frame: f, seconds: Math.round((f / t.meta.fps) * 1000) / 1000, activeTextLayers: activeTextLayers(t, f) })),
          stats,
          ...(measure?{measurements:r.measurements??[]}:{}),
        };
      } catch (e) {
        const missing = [...new Set([...t.videoTracks, ...t.audioTracks].flatMap((tr) => tr.clips.map((c) => c.src)))].filter((src) => !this.store.assetExists(pid, src));
        throw new HttpError(500, '取帧失败：' + e.message + (missing.length ? '。时间线引用了素材库中不存在的文件：' + missing.join('、') + '（素材按项目隔离）' : ''));
      } finally {
        clearTimeout(timer);
      }
    }));
    this.pendingFrames.set(key, task);
    task.then(result => {this.pendingFrames.delete(key);this.frameCache.set(key,{pid,result});let size=[...this.frameCache.values()].reduce((s,c)=>s+c.result.image.length,0);while(size>32*1024*1024||this.frameCache.size>48){const first=this.frameCache.keys().next().value;size-=this.frameCache.get(first).result.image.length;this.frameCache.delete(first);}}, () => this.pendingFrames.delete(key));
    return task;
  }

  // ---------- 导出 ----------
  startExport(pid, options = {}) {
    if (this.activeJob?.status === 'rendering') throw new HttpError(409, '已有导出任务进行中，请稍候或先取消');
    return this.enqueue(pid,options);
  }
  enqueue(pid,{scale=1,quality='standard',timeline,name,baseRev,sourceRev}={}) {
    if(this.closing)throw new HttpError(503,'引擎正在关闭');
    const p=this.store.load(pid),snapshot=structuredClone(timeline??p.timeline);
    if(baseRev!==undefined&&baseRev!==p.rev)throw new HttpError(409,'项目已变化，请重新预检后导出');
    const preflight=deliveryPreflight(this.store,pid,snapshot);if(!preflight.canExport)throw new HttpError(400,'导出预检未通过：'+preflight.issues.filter(i=>i.severity==='error').map(i=>i.message).join('；'));
    if(!timelineHasContent(snapshot))throw new HttpError(400,'时间线为空');
    if([...this.jobs.values()].filter(j=>['queued','rendering'].includes(j.status)).length>=100)throw new HttpError(429,'导出队列最多 100 项');
    const jobId=randomUUID(),dir=path.join(EXPORTS_DIR,pid);fs.mkdirSync(dir,{recursive:true});
    const fileName=(name??this.store.readProjectMeta(pid)?.name??'djian').replace(/[^\p{L}\p{N}_-]+/gu,'_').slice(0,60)+'-'+jobId.slice(0,8)+'.mp4';
    const job={jobId,pid,rev:sourceRev??p.rev,preflight,name:name??fileName,status:'queued',progress:{rendered:0,total:0,percent:0,stage:'queued'},outFile:path.join(dir,fileName),fileName,timeline:snapshot,scale:[.5,1,2].includes(Number(scale))?Number(scale):1,quality:['draft','standard','high'].includes(quality)?quality:'standard',controller:new AbortController(),createdAt:Date.now()};
    this.jobs.set(jobId,job);this.drainQueue();return jobId;
  }
  drainQueue(){
    if(this.closing||this.activeJob?.status==='rendering')return;
    const job=[...this.jobs.values()].find(j=>j.status==='queued');if(!job)return;
    this.activeJob=job;job.status='rendering';job.startedAt=Date.now();
    job.task=renderVideo({timeline:job.timeline,outFile:job.outFile,assetBase:this.assetBase(job.pid),fontsBase:this.fontsBase,mathBase:this.mathBase,scale:job.scale,crf:{draft:28,standard:20,high:16}[job.quality],signal:job.controller.signal,
      onEncoder:encoder=>{job.encoder=encoder;},onProgress:pr=>{job.progress={rendered:pr.rendered,total:pr.total,percent:pr.total?Math.round(pr.rendered/pr.total*100):0,stage:pr.stage};}
    }).then(r=>{job.result={fileName:job.fileName,sizeBytes:fs.statSync(job.outFile).size,durationInFrames:r.durationInFrames,fps:r.fps,encoder:r.encoder};job.status='done';this.pruneExports();})
    .catch(e=>{job.status=job.controller.signal.aborted?'cancelled':'error';job.error=job.controller.signal.aborted?'已取消':e.message;if(!job.controller.signal.aborted)job.diagnostic=exportFailure(e,job.progress.stage);fs.rmSync(job.outFile,{force:true});})
    .finally(()=>{job.finishedAt=Date.now();this.activeJob=null;const done=[...this.jobs.values()].filter(j=>!['queued','rendering'].includes(j.status));for(const old of done.slice(0,-100))this.jobs.delete(old.jobId);this.drainQueue();});
  }
  list(pid){return [...this.jobs.values()].filter(j=>j.pid===pid).map(j=>this.status(j.jobId));}
  retry(jobId){const j=this.jobs.get(jobId);if(!j||!['error','cancelled'].includes(j.status))throw new HttpError(400,'只能重试失败或取消的任务');return this.enqueue(j.pid,{timeline:j.timeline,scale:j.scale,quality:j.quality,name:j.name,sourceRev:j.rev});}

  cancelExport(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) throw new HttpError(404, '导出任务不存在');
    if (job.status === 'rendering') job.controller.abort();
    if (job.status === 'queued') job.status='cancelled';
  }

  status(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) throw new HttpError(404, '导出任务已过期或引擎已重启，请重新导出');
    const { outFile: _o, controller: _c, timeline:_t, task:_task, ...rest } = job;
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
