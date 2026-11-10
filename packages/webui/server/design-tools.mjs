import {diffTimelines} from '../../engine/dist/diff.js';
import {randomUUID} from 'node:crypto';
import {DESIGN_PRESETS,auditDesign,designScope,sampleTimes} from '../../engine/dist/design.js';
import {protectedDesignFields} from '../../engine/dist/designLocks.js';
import {inspectMeasurements,motionSampleTimes} from '../../engine/dist/visualReview.js';
import {applyOps} from '../../engine/dist/ops.js';
import {readJson,sendJson,HttpError} from './http.mjs';
const allowed=new Set(['x','y','w','h','align','fontSize','fontFamily','fontWeight','lineHeight','letterSpacing','color','background','shadow','typography','designRole','textFit']);
export function validateReview(t,items){
 if(!Array.isArray(items)||items.length>30)throw new HttpError(400,'审片建议最多30项');
 return items.map(item=>{
  if(!item||typeof item.message!=='string'||!item.message.trim()||item.message.length>2000)throw new HttpError(400,'建议需要说明依据');
  if(!Array.isArray(item.ops)||item.ops.length>50)throw new HttpError(400,'每项最多50个修改');
  for(const op of item.ops){const o=t.overlays.find(o=>o.id===op.id);if(op.op!=='updateOverlay'||!o||!op.patch||Object.keys(op.patch).some(k=>!allowed.has(k)))throw new HttpError(400,'只允许修改现有元素的视觉属性');if(Object.keys(op.patch).some(k=>protectedDesignFields(o).has(k)))throw new HttpError(400,'建议涉及手工保护字段，请先解除对应设计锁');}
  const id=typeof item.id==='string'?item.id:item.ops[0]?.id;if(id&&!t.overlays.some(o=>o.id===id))throw new HttpError(400,'建议目标不存在');
  let region;if(item.region){const r=item.region;if(!['x','y','w','h'].every(k=>Number.isFinite(r[k]))||r.x<0||r.y<0||r.w<=0||r.h<=0||r.x+r.w>1.001||r.y+r.h>1.001)throw new HttpError(400,'问题区域必须为画布内的归一化矩形');region={x:r.x,y:r.y,w:r.w,h:r.h};}
  return {message:item.message,time:Number.isFinite(item.time)?Math.max(0,item.time):0,ops:item.ops,id,...(region?{region}:{}),evidence:typeof item.evidence==='string'?item.evidence.slice(0,2000):'由 AI 看图提出，需结合画面确认',kind:'ai',source:'ai'};
 });
}
export function registerDesignTools(r,{store,render,project}){
 const cache=new Map();
 const remember=(pid,value)=>{for(const [key,v] of cache)if(Date.now()-v.created>1800000)cache.delete(key);while(cache.size>=24)cache.delete(cache.keys().next().value);const id=randomUUID();cache.set(id,{...value,pid,created:Date.now(),dismissed:[]});return id;};
 const snapshot=(t,ops)=>{const result=applyOps(t,ops,{actor:'system'});if(result.receipts.some(r=>r.status==='rejected'))throw new HttpError(400,JSON.stringify(result.receipts));return result.timeline;};
 const toImage=f=>'data:'+f.mime+';base64,'+f.image.toString('base64');
 const frame=async(pid,t,time)=>toImage(await render.frame(pid,{seconds:time,maxSize:640,timeline:t}));
 const measure=async(pid,t,times)=>{const measurements=[],sheets=[];for(let i=0;i<times.length;i+=6){const slice=times.slice(i,i+6),f=await render.frame(pid,{seconds:slice,maxSize:960,timeline:t,measure:true});if(!f.measurements?.length)throw new HttpError(500,'浏览器未返回实测数据，请检查渲染器');measurements.push(...f.measurements);sheets.push({image:toImage(f),times:slice});}return {measurements,sheets};};
 r.add('POST','/api/p/:pid/design/:action',async(req,res,{params})=>{
  const pid=project(params),b=await readJson(req),p=store.load(pid),t=p.timeline,baseRev=p.rev;
  if(params.action==='inspect'){
   const times=sampleTimes(t),frames=[],measurements=[];for(const time of times.length?times:[0]){const f=await render.frame(pid,{seconds:time,maxSize:640,timeline:t,measure:true});frames.push({time,image:toImage(f)});measurements.push(...f.measurements);}
   const measuredIssues=inspectMeasurements(t,measurements),id=remember(pid,{baseRev,items:measuredIssues,kind:'measure'});const sheet=await render.frame(pid,{seconds:times.length?times:[0],maxSize:640,timeline:t});sendJson(res,200,{id,items:measuredIssues,baseRev,design:t.design,designScenes:t.designScenes,issues:auditDesign(t),measuredIssues,measurements,frames,sheet:toImage(sheet),instructions:'观察真实帧和浏览器实测：检查层级、留白、字体、色彩与遮挡。submit 提交有依据的建议，可附 id、region{x,y,w,h}、evidence。不得修改设计锁保护字段；不要自动应用。'});return;
  }
  if(params.action==='measure'||params.action==='motion'){
   let plan=params.action==='motion'?motionSampleTimes(t,b.ids):{times:[Number(b.time??t.designScenes?.[b.sceneId]?.start??0)],truncated:false,candidates:1};
   if(b.sceneId){const scene=t.designScenes?.[b.sceneId];if(!scene)throw new HttpError(400,'场景不存在');plan={...plan,times:plan.times.filter(v=>v>=scene.start&&v<scene.end)};}
   if(!plan.times.length)throw new HttpError(400,'范围内没有可检查画面');
   const measured=await measure(pid,t,plan.times),items=inspectMeasurements(t,measured.measurements,params.action==='motion').filter(item=>!b.ids?.length||b.ids.includes(item.id)),coverage={sampled:plan.times.length,candidates:plan.candidates,truncated:plan.truncated,times:plan.times};
   const id=remember(pid,{baseRev,items,coverage,kind:params.action});sendJson(res,200,{id,baseRev,items,coverage,sheets:measured.sheets,measurements:measured.measurements});return;
  }
  if(params.action==='variants'){
   const ids=designScope(t,b.ids,b.sceneId?undefined:Number(b.time)||0).filter(o=>!b.sceneId||(t.designScenes?.[b.sceneId]&&o.startSeconds>=t.designScenes[b.sceneId].start&&o.endSeconds<=t.designScenes[b.sceneId].end)).map(o=>o.id);if(!ids.length)throw new HttpError(400,'当前场景没有可设计元素');
   const variants=[];for(const [preset,d] of Object.entries(DESIGN_PRESETS)){const ops=[{op:'setDesign',preset,ids,sceneId:b.sceneId},{op:'applyDesignLayout',ids,sceneId:b.sceneId,layout:preset==='kinetic'?'poster':preset==='brand'?'split':'editorial'}],candidate=snapshot(t,ops),id=remember(pid,{baseRev,ops,name:d.name});variants.push({id,name:d.name,image:await frame(pid,candidate,Number(b.time??t.designScenes?.[b.sceneId]?.start)||0)});}sendJson(res,200,{baseRev,variants});return;
  }
  if(params.action==='submit'){if(b.baseRev!==baseRev)throw new HttpError(409,'审片基准已过期，请重新取帧');const items=validateReview(t,b.items),id=remember(pid,{baseRev,items,kind:'ai'});sendJson(res,200,{id,baseRev,items});return;}
  if(params.action==='list'){sendJson(res,200,{reviews:[...cache].filter(([,v])=>v.pid===pid&&v.items&&Date.now()-v.created<1800000).map(([id,v])=>({id,baseRev:v.baseRev,items:v.items,dismissed:v.dismissed,coverage:v.coverage,kind:v.kind}))});return;}
  const entry=cache.get(b.id);if(!entry||entry.pid!==pid||Date.now()-entry.created>1800000)throw new HttpError(404,'预览已过期，请重新生成');
  if(params.action==='dismiss'){if(!Number.isInteger(b.index)||!entry.items?.[b.index])throw new HttpError(400,'请选择有效建议');entry.dismissed=b.restore?entry.dismissed.filter(i=>i!==b.index):[...new Set([...entry.dismissed,b.index])];sendJson(res,200,{dismissed:entry.dismissed});return;}
  if(params.action==='recheck'){
   const item=entry.items?.[b.index];if(!item)throw new HttpError(400,'请选择有效建议');const measured=await measure(pid,t,[item.time]),findings=inspectMeasurements(t,measured.measurements).filter(v=>!item.id||v.id===item.id);sendJson(res,200,{baseRev,findings,image:measured.sheets[0].image,message:findings.length?'当前画面仍有实测问题，请查看新的测量结果。':'当前采样未发现该目标的几何问题；审美建议仍需看图确认。'});return;
  }
  if(entry.baseRev!==baseRev)throw new HttpError(409,'工程已变化，请重新生成方案或审片');
  if(params.action==='evidence'){
   const item=entry.items?.[b.index];if(!item)throw new HttpError(400,'请选择有效建议');const measured=await measure(pid,t,[item.time]),m=measured.measurements[0]?.elements.find(m=>m.id===item.id),r=item.region??(m?{x:Math.max(0,m.rect.x/t.meta.width),y:Math.max(0,m.rect.y/t.meta.height),w:Math.min(1,m.rect.w/t.meta.width),h:Math.min(1,m.rect.h/t.meta.height)}:undefined);sendJson(res,200,{image:measured.sheets[0].image,region:r,time:item.time,id:item.id,evidence:item.evidence,measurement:m});return;
  }
  const indices=Array.isArray(b.indices)?b.indices:[];if(entry.items&&(!indices.length||indices.some(i=>!Number.isInteger(i)||!entry.items[i]||entry.dismissed.includes(i))))throw new HttpError(400,'请选择未忽略的有效建议');const ops=entry.ops??indices.flatMap(i=>entry.items[i].ops);
  // Revalidate protection at the point of use, including old in-memory proposals.
  if(entry.items)validateReview(t,indices.map(i=>entry.items[i]));
  if(params.action==='preview'){const after=snapshot(t,ops),measured=await measure(pid,after,[Number(b.time??entry.items?.[indices[0]]?.time??0)]);sendJson(res,200,{before:await frame(pid,t,Number(b.time??entry.items?.[indices[0]]?.time??0)),after:measured.sheets[0].image,remaining:inspectMeasurements(after,measured.measurements)});return;}
  if(params.action==='apply'){
   if(!ops.length)throw new HttpError(400,'所选建议没有可自动执行的修改，请手工调整后复查');
   const result=await store.serialize(pid,async()=>{if(store.load(pid).rev!==entry.baseRev)throw new HttpError(409,'工程已变化，请重新预览');const before=store.load(pid).timeline;const applied=await store.applyNow(pid,{ops,actor:'user',clientId:typeof b.clientId==='string'?b.clientId:null,baseRev:entry.baseRev,label:entry.name??'采用审片建议',conflictPolicy:'reject'});return {...applied,inverse:diffTimelines(store.load(pid).timeline,before)};});sendJson(res,200,result);return;
  }
  throw new HttpError(404,'未知设计操作');
 });
}
