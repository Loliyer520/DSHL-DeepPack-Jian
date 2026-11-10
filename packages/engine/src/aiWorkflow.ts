import type {Timeline,Overlay} from './schema.js';
import {mainTrackStarts,timelineDurationInFrames} from './timeline.js';
import {changedFields} from './fieldChanges.js';
export type TaskKind='layout'|'text'|'motion'|'audio'|'all';
export type Scope={ids?:string[];time?:number;start?:number;end?:number};
type Entity={id:string;kind:string;start:number;end:number;value:any;track?:string};
export function workflowEntities(t:Timeline):Entity[]{
 const starts=mainTrackStarts(t),out:Entity[]=t.overlays.map(o=>({id:o.id,kind:'overlay',start:o.startSeconds,end:o.endSeconds,value:o}));
 for(const [i,tr] of t.videoTracks.entries())for(const c of tr.clips)out.push({id:c.id,kind:'video',start:i?c.atSeconds??0:starts.get(c.id)??0,end:(i?c.atSeconds??0:starts.get(c.id)??0)+c.clipDuration,value:c,track:tr.id});
 for(const tr of t.audioTracks)for(const c of tr.clips)out.push({id:c.id,kind:'audio',start:c.atSeconds,end:c.atSeconds+c.duration,value:c,track:tr.id});return out;
}
/** Include inbound as well as outbound bindings: moving a target affects its followers. */
export function relatedIds(t:Timeline,seeds:Iterable<string>):Set<string>{
 const adjacency=new Map<string,Set<string>>(),first=new Map<string,string>();
 const link=(a:string,b:string)=>{if(!adjacency.has(a))adjacency.set(a,new Set());if(!adjacency.has(b))adjacency.set(b,new Set());adjacency.get(a)!.add(b);adjacency.get(b)!.add(a);};
 for(const o of t.overlays){for(const ref of [o.follow?.target,o.connector?.from,o.connector?.to,o.trackMatte?.source,o.morph?.from])if(ref)link(o.id,ref);if(o.group){const root=first.get(o.group);if(root)link(o.id,root);else first.set(o.group,o.id);link(o.id,'group:'+o.group);}}
 for(const tr of [...t.videoTracks,...t.audioTracks])adjacency.set(tr.id,new Set(tr.clips.map(c=>c.id)));
 const shared=new Map<string,string>();for(const o of t.overlays){if(o.shared){const root=shared.get(o.shared.key);if(root)link(o.id,root);else shared.set(o.shared.key,o.id);}}
 const ids=new Set(seeds),queue=[...ids];for(let i=0;i<queue.length;i++)for(const id of adjacency.get(queue[i])??[])if(!ids.has(id)){ids.add(id);queue.push(id);}return ids;
}
export function scopedEntities(t:Timeline,scope:Scope={}){
 const all=workflowEntities(t);let seeds:string[];
 if(scope.ids?.length)seeds=scope.ids;else if(scope.time!==undefined)seeds=all.filter(e=>e.start<=scope.time!&&e.end>scope.time!).map(e=>e.id);else if(scope.start!==undefined||scope.end!==undefined)seeds=all.filter(e=>e.start<(scope.end??Infinity)&&e.end>(scope.start??0)).map(e=>e.id);else seeds=all.map(e=>e.id);
 const ids=relatedIds(t,seeds);return all.filter(e=>ids.has(e.id));
}
const essentials=['id','kind','name','text','startSeconds','endSeconds','src','inPoint','clipDuration','duration','atSeconds','designRole','designLocks','group','styleRole','componentSlot'];
const taskFields:Record<TaskKind,string[]>={
 text:['fontSize','fontFamily','fontWeight','color','accent','lineHeight','letterSpacing','x','y','w','h','maxWidth','align','valign','padding','textFit','typography'],
 layout:['x','y','w','h','maxWidth','align','valign','padding','fontSize','fontFamily','color','background','shape','image','layoutExclude','autoSize','textFit','transform3d','rotate'],
 motion:['animations','effects','cues','motionPath','follow','connector','trackMatte','shared','textEffect','transform3d','transition','speed','fadeIn','fadeOut','particles'],
 audio:['volume','muted','speed','fadeIn','fadeOut','animations','audioReactive'],all:[]};
function compact(value:any,depth=0):any{if(value===null||typeof value!=='object')return typeof value==='string'&&value.length>2000?{text:value.slice(0,2000),truncated:true,length:value.length}:value;if(Array.isArray(value))return value.length>24?{count:value.length,first:value.slice(0,4).map(x=>compact(x,depth+1)),truncated:true}:value.map(x=>compact(x,depth+1));if(depth>5)return {summary:'nested object',keys:Object.keys(value)};return Object.fromEntries(Object.entries(value).filter(([k])=>k!=='timeline').map(([k,v])=>[k,compact(v,depth+1)]));}
export function taskContext(t:Timeline,scope:Scope={},task:TaskKind='layout',limit=30){
 const all=scopedEntities(t,scope),shown=all.slice(0,Math.max(1,Math.min(100,limit))),keys=new Set([...essentials,...taskFields[task]]),sources=new Set<string>(),groups=new Set<string>();
 const entities=shown.map(e=>{const o=e.value;if(o.src)sources.add(o.src);if(o.image?.src)sources.add(o.image.src);if(o.audioReactive?.src)sources.add(o.audioReactive.src);if(o.group)groups.add(o.group);return {id:e.id,entity:e.kind,interval:[e.start,e.end],track:e.track,properties:compact(task==='all'?o:Object.fromEntries(Object.entries(o).filter(([k])=>keys.has(k)))),...(o.composition?{composition:{name:o.composition.name,nested:true}}:{})};});
 return {task,canvas:t.meta,duration:timelineDurationInFrames(t)/t.meta.fps,entities,total:all.length,truncated:shown.length<all.length,omittedIds:all.slice(shown.length,shown.length+100).map(e=>e.id),sources:[...sources],groups:Object.fromEntries([...groups].map(g=>[g,compact(t.groups?.[g]??{})])),tracks:[...t.videoTracks,...t.audioTracks].filter(tr=>shown.some(e=>e.track===tr.id)).map(({clips,...tr})=>tr),design:t.design,scenes:t.designScenes,theme:t.theme,limitations:'截断字段需用完整时间线核对后再编辑；合成内部时间线不展开。'};
}
export function affectedPlan(before:Timeline,after:Timeline,limit=6){
 const fields=changedFields(before,after),a=workflowEntities(before),b=workflowEntities(after),all=[...a,...b],seeds=new Set<string>();
 let global=fields.some(f=>/^(meta|theme|design|designScenes|components|animationLibrary)(\/|:|$)/.test(f));
 for(const f of fields){const m=/^(overlay|clip|track|groups):([^/]+)/.exec(f);if(m)seeds.add((m[1]==='groups'?'group:':'')+decodeURIComponent(m[2]));}
 // A main-track duration change shifts every later cut; compare the computed intervals.
 const startsA=mainTrackStarts(before),startsB=mainTrackStarts(after);for(const [id,start] of startsA)if(startsB.get(id)!==start)seeds.add(id);for(const [id,start] of startsB)if(startsA.get(id)!==start)seeds.add(id);
 if(fields.some(f=>f.endsWith('/order')))for(const id of new Set([...a,...b].filter(e=>!a.some(x=>x.id===e.id)||!b.some(x=>x.id===e.id)).map(e=>e.id)))seeds.add(id);
 if(fields.includes('overlay/order')&&a.filter(e=>e.kind==='overlay').length===b.filter(e=>e.kind==='overlay').length)global=true;
 if(global)for(const e of all)seeds.add(e.id);
 const ids=new Set([...relatedIds(before,seeds),...relatedIds(after,seeds)]),affected=all.filter(e=>ids.has(e.id));
 const audioEntities=new Set([...before.audioTracks,...after.audioTracks].flatMap(tr=>[tr.id,...tr.clips.map(c=>c.id)]));
 const audioOnly=fields.length>0&&fields.every(f=>{const m=/^(clip|track):([^/]+)\/(volume|muted|role|duck|fadeIn|fadeOut)(\/|$)/.exec(f);if(m)return true;const a=/^(clip|track):([^/]+)/.exec(f);return !!a&&audioEntities.has(decodeURIComponent(a[2]));});
 const motion=!audioOnly&&fields.some(f=>!/\//.test(f)||/\/(animations|effects|cues|motionPath|follow|connector|shared|textEffect|transform3d|transition|speed|startSeconds|endSeconds|clipDuration|duration|atSeconds)(\/|$)/.test(f)||/\/order$/.test(f));
 const text=!audioOnly&&fields.some(f=>/\/(text|fontSize|fontFamily|fontWeight|w|h|x|y|maxWidth|lineHeight|padding|textFit|typography)(\/|$)/.test(f));
 const max=Math.max(1,Math.min(12,limit)),duration=timelineDurationInFrames(after)/after.meta.fps,times=new Set<number>();
 if(!audioOnly)for(const e of affected){const start=Math.max(0,e.start),end=Math.min(duration,e.end);if(end<=start)continue;for(const fraction of motion?[.05,.5,.95]:[.5])times.add(Math.min(Math.max(0,duration-1/after.meta.fps),Math.round((start+(end-start)*fraction)*after.meta.fps)/after.meta.fps));}
 const candidates=[...times].sort((x,y)=>x-y),sampled=candidates.length<=max?candidates:Array.from({length:max},(_,i)=>candidates[Math.round(i*(candidates.length-1)/Math.max(1,max-1))]);
 return {fields,ids:[...ids],global,audioOnly,mode:audioOnly?'audio':motion?'motion':text?'text':'visual',measure:!audioOnly&&(text||motion),times:sampled,candidates:candidates.length,truncated:candidates.length>sampled.length,changed:fields.length>0};
}
