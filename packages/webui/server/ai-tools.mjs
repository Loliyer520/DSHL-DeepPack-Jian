import fs from 'node:fs';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {taskContext,scopedEntities,affectedPlan,workflowEntities} from '../../engine/dist/aiWorkflow.js';
import {timelineHasContent} from '../../engine/dist/timeline.js';
import {applyOps} from '../../engine/dist/ops.js';
import {parseTimeline,validateTimeline} from '../../engine/dist/schema.js';
import {texError} from '../../engine/dist/mathServer.js';
import {diffTimelines} from '../../engine/dist/diff.js';
import {inspectMeasurements} from '../../engine/dist/visualReview.js';
import {checkTimeline} from '../../engine/dist/preflight.js';
import {referencedAssets} from '../../engine/dist/compositions.js';
import {readJson,sendJson,HttpError} from './http.mjs';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const picture=f=>'data:'+f.mime+';base64,'+f.image.toString('base64');
function fingerprint(store,pid,t){return hash([store.getStyle(pid).style,[...new Set([...referencedAssets(t),...fs.readdirSync(store.assetsDir(pid))])].sort().map(src=>{try{const stat=fs.statSync(store.assetPath(pid,src));return [src,stat.size,stat.mtimeMs];}catch{return [src,'missing'];}})]);}
function scopeInput(b){const out={};if(b.ids!==undefined){if(!Array.isArray(b.ids)||b.ids.length>100||b.ids.some(s=>typeof s!=='string'))throw new HttpError(400,'ids 最多 100 个字符串');out.ids=b.ids;}for(const key of ['time','start','end'])if(b[key]!==undefined){if(!Number.isFinite(b[key])||b[key]<0)throw new HttpError(400,key+' 必须为非负秒数');out[key]=b[key];}if(out.end!==undefined&&out.start!==undefined&&out.end<=out.start)throw new HttpError(400,'时间范围无效');return out;}
export function styleAudit(t,style,ids){
 if(!style)return [];const issues=[],list=t.overlays.filter(o=>ids.includes(o.id));
 for(const o of list.filter(o=>o.text.trim())){const title=o.designRole==='heading'||o.kind==='title',expected=title?style.titleSize:style.bodySize;if(expected&&Math.abs(o.fontSize-expected)>expected*.25)issues.push({id:o.id,time:o.startSeconds,source:'style',message:`字号 ${o.fontSize}px 与项目${title?'标题':'正文'}参考 ${expected}px 相差超过 25%，请核对层级`,objective:true});}
 if(style.maxAnimations!==undefined)for(const anchor of list){const active=list.filter(o=>o.startSeconds<=anchor.startSeconds&&o.endSeconds>anchor.startSeconds);const presets=new Set(active.flatMap(o=>(o.effects??[]).map(e=>e.preset)));if(presets.size>style.maxAnimations){issues.push({time:anchor.startSeconds,source:'style',message:`当前场景有 ${presets.size} 种动效预设，超过约定 ${style.maxAnimations} 种`,objective:true});break;}}
 return issues;
}
export function registerAiTools(r,{store,render,project}){
 const drafts=new Map();const prune=()=>{for(const [id,d] of drafts)if(Date.now()-d.created>1800000)drafts.delete(id);while(drafts.size>=16)drafts.delete(drafts.keys().next().value);};
 const fetchDraft=(id,pid)=>{const d=drafts.get(id);if(!d||d.pid!==pid||Date.now()-d.created>1800000)throw new HttpError(404,'预演已过期，请重新生成');return d;};
 r.add('POST','/api/p/:pid/ai/context',async(req,res,{params})=>{
  const pid=project(params),b=await readJson(req),{timeline:t,rev}=store.load(pid),scope=scopeInput(b);
  if(!b.wholeProject&&!scope.ids?.length&&scope.time===undefined&&scope.start===undefined&&scope.end===undefined){const presence=store.getPresence(pid).user;if(presence&&Date.now()-presence.at<120000&&presence.selection?.length)scope.ids=presence.selection.map(s=>s.id);else scope.time=presence&&Date.now()-presence.at<120000?presence.playhead??0:0;}
  const task=['layout','text','motion','audio','all'].includes(b.task)?b.task:'layout',context=taskContext(t,scope,task,Number(b.limit)||30),style=store.getStyle(pid);
  const assets=context.sources.map(name=>({name,...store.readAssetMeta(pid,name)}));
  sendJson(res,200,{rev,scope,...context,assets,style:style.style,styleText:style.text,issues:styleAudit(t,style.style,context.entities.map(e=>e.id)),instructions:'先使用返回 id 和约束；细节截断时读取完整时间线。djian_rehearse 预演批量操作，不立即修改项目。'});
 });
 r.add('GET','/api/p/:pid/ai/drafts',(req,res,{params})=>{const pid=project(params);prune();sendJson(res,200,{drafts:[...drafts].filter(([,d])=>d.pid===pid).map(([id,d])=>({id,baseRev:d.baseRev,label:d.label,created:d.created,canApply:d.canApply,plan:d.plan,issues:d.issues,receipts:d.receipts,applied:!!d.result}))});});
 r.add('POST','/api/p/:pid/ai/rehearse',async(req,res,{params})=>{
  const pid=project(params),b=await readJson(req),p=store.load(pid),before=p.timeline,baseRev=p.rev;
  if(b.baseRev!==baseRev)throw new HttpError(409,'项目已变化，请重新获取任务上下文');
  if(!Array.isArray(b.ops)||!b.ops.length||b.ops.length>200)throw new HttpError(400,'预演需要 1–200 条操作');
  const scope=scopeInput(b),started=Date.now(),baseFingerprint=fingerprint(store,pid,before),requestHash=hash([pid,baseRev,baseFingerprint,b.ops,scope,b.render!==false,b.maxFrames??6,b.label??null]);prune();const cached=[...drafts].find(([,d])=>d.requestHash===requestHash);if(cached){sendJson(res,200,{id:cached[0],...publicDraft(cached[1]),cached:true});return;}const result=applyOps(before,b.ops,{actor:'ai',assetExists:s=>store.assetExists(pid,s),assetDuration:s=>store.assetDuration(pid,s),checkTex:texError});
  let candidate,validation=[];try{candidate=parseTimeline(result.timeline);validation=validateTimeline(candidate);}catch(e){validation=[String(e.message)];candidate=before;}
  const plan=affectedPlan(before,candidate,Number(b.maxFrames)||6),scopeEntities=scopedEntities(before,scope),allowed=scopeEntities.map(e=>e.id),constrained=!!(scope.ids?.length||scope.time!==undefined||scope.start!==undefined||scope.end!==undefined);
  for(const o of candidate.overlays)if(o.kind==='math'&&plan.ids.includes(o.id)){const error=texError(o.text);if(error)validation.push('公式 '+o.id+'：'+error);}
  const oldIds=new Set(workflowEntities(before).map(e=>e.id)),newEntities=workflowEntities(candidate),newTracks=[...candidate.videoTracks,...candidate.audioTracks].filter(tr=>![...before.videoTracks,...before.audioTracks].some(old=>old.id===tr.id));
  const inRange=e=>scopeEntities.some(old=>e.start>=old.start&&e.end<=old.end);
  const allowedNew=new Set(newEntities.filter(e=>!oldIds.has(e.id)&&inRange(e)).map(e=>e.id));
  const allowedGroups=new Set(scopeEntities.map(e=>e.value.group).filter(Boolean));
  for(const tr of newTracks)if(tr.clips.every(c=>allowedNew.has(c.id)))allowedNew.add(tr.id);
  for(const e of newEntities)if(allowedNew.has(e.id)&&e.value.group)allowedGroups.add(e.value.group);
  const changedIds=[...new Set(plan.fields.flatMap(f=>{const m=/^(overlay|clip|track|groups):([^/]+)/.exec(f);return m?[{kind:m[1],id:decodeURIComponent(m[2])}]:[];}))];
  const outside=constrained?changedIds.filter(({kind,id})=>kind==='groups'?!allowedGroups.has(id):!allowed.includes(id)&&!allowedNew.has(id)).map(e=>e.id):[];
  if(constrained&&plan.global)validation.push('局部预演不允许修改项目级配置或全局顺序');if(outside.length)validation.push('修改超出范围：'+outside.join('、'));
  const receipts=result.receipts,valid=!validation.length&&!receipts.some(r=>r.status==='rejected');
  const assets=fs.readdirSync(store.assetsDir(pid)).map(name=>({name,...store.readAssetMeta(pid,name)})),issues=checkTimeline(candidate,assets).filter(i=>plan.global||!i.id||plan.ids.includes(i.id));
  issues.push(...styleAudit(candidate,store.getStyle(pid).style,plan.ids));
  let beforeImage,afterImage,measurements=[],renderError;
  if(valid&&plan.times.length&&b.render!==false){try{const first=await render.frame(pid,{timeline:timelineHasContent(before)?before:parseTimeline({...before,overlays:[{id:'empty-preview',kind:'shape',text:'',shape:{type:'rect',fill:before.meta.background??'#000000'},x:.5,y:.5,w:1,h:1,startSeconds:0,endSeconds:Math.max(...plan.times)+1}]}),seconds:plan.times,maxSize:640});beforeImage=picture(first);const second=await render.frame(pid,{timeline:candidate,seconds:plan.times,maxSize:640,measure:plan.measure});afterImage=picture(second);measurements=second.measurements??[];issues.push(...inspectMeasurements(candidate,measurements,plan.mode==='motion'));}catch(e){renderError=e.message;}}
  const canApply=valid&&plan.changed&&!p.readOnly&&!renderError,id=randomUUID();prune();
  const d={requestHash,patch:diffTimelines(before,candidate),pid,created:Date.now(),baseRev,label:typeof b.label==='string'?b.label.slice(0,80):'AI 批量修改预演',ops:b.ops,plan,receipts,issues,validation,canApply,before:beforeImage,after:afterImage,fingerprint:baseFingerprint,renderError,rendered:!!afterImage,elapsedMs:Date.now()-started};drafts.set(id,d);
  sendJson(res,200,{id,...publicDraft(d),instructions:'检查回执、问题与前后画面，再 apply 采用。仅几何与风格规则可自动判断；视觉焦点、留白和情绪需看图。'});
 });
 r.add('POST','/api/p/:pid/ai/preview',async(req,res,{params})=>{const pid=project(params),b=await readJson(req);sendJson(res,200,publicDraft(fetchDraft(b.id,pid)));});
 r.add('POST','/api/p/:pid/ai/apply',async(req,res,{params})=>{
  const pid=project(params),b=await readJson(req),d=fetchDraft(b.id,pid);if(d.result){sendJson(res,200,{...d.result,duplicate:true});return;}if(!d.canApply)throw new HttpError(400,'预演未通过，不能采用');
  const result=await store.serialize(pid,async()=>{if(d.result)return {...d.result,duplicate:true};const current=store.load(pid);if(current.rev!==d.baseRev||fingerprint(store,pid,current.timeline)!==d.fingerprint)throw new HttpError(409,'项目、素材或审美规范已变化，请重新预演');const before=current.timeline,applied=await store.applyNow(pid,{ops:d.patch,system:true,actor:'ai',clientId:typeof b.clientId==='string'?b.clientId:null,baseRev:d.baseRev,label:d.label,conflictPolicy:'reject',batchId:'rehearsal-'+b.id});const result={...applied,originalReceipts:d.receipts,inverse:diffTimelines(store.load(pid).timeline,before)};d.result=result;return result;});sendJson(res,200,result);
 });
}
function publicDraft(d){const {pid,ops,patch,fingerprint,requestHash,result,...out}=d;return {...out,applied:!!result};}
