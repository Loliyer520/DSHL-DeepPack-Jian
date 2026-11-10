import {cloneValue} from './draft.js';
import type { Animations, Overlay, Timeline } from './schema.js';
import type { Op } from './ops.js';
import {parsePath,mapPath,toPathD} from './paths.js';
import { ANIMATION_PRESETS, resolveAnimations } from './presets.js';
export const STUDIO_THEMES: Record<string,NonNullable<Timeline['theme']>>={
 midnight:{name:'午夜蓝',background:'#09111f',gap:16,roles:{heading:{color:'#f8fafc',fontSize:64},body:{color:'#cbd5e1',fontSize:32},accent:{color:'#38bdf8',fill:'#38bdf8'},card:{fill:'#172338',radius:24,padding:24,shadow:{color:'#000000',opacity:.25,blur:24,x:0,y:8}}}},
 paper:{name:'纸白',background:'#f8fafc',gap:20,roles:{heading:{color:'#172033',fontSize:64},body:{color:'#475569',fontSize:32},accent:{color:'#2563eb',fill:'#2563eb'},card:{fill:'#ffffff',radius:16,padding:24,shadow:{color:'#172033',opacity:.12,blur:20,x:0,y:6}}}},
 neon:{name:'霓虹',background:'#120d24',gap:24,roles:{heading:{color:'#faf5ff',fontSize:64},body:{color:'#d8b4fe',fontSize:32},accent:{color:'#f472b6',fill:'#f472b6'},card:{fill:'#291742',radius:28,padding:24,shadow:{color:'#c084fc',opacity:.3,blur:24,x:0,y:0}}}},
};
export function themePatch(o:Overlay,theme:NonNullable<Timeline['theme']>):Record<string,unknown>{
 const role=theme.roles[o.styleRole??''];if(!role)return {};
 const {fill,radius,...rest}=role;
 return {...rest,...(o.shape&&(fill!==undefined||radius!==undefined)?{shape:{...o.shape,...(fill!==undefined?{fill}:{}),...(radius!==undefined?{radius}:{})}}:{})};
}
export function captureComponent(t:Timeline,group:string):NonNullable<Timeline['components']>[string]{
 const members=t.overlays.filter(o=>o.group===group);if(!members.length)throw Error('分组不存在');
 const start=Math.min(...members.map(o=>o.startSeconds)),end=Math.max(...members.map(o=>o.endSeconds));
 const slots=new Set<string>();
 const overlays=members.map(o=>{const v=cloneValue(o);delete v.group;v.startSeconds-=start;v.endSeconds-=start;v.componentSlot??=v.id;if(slots.has(v.componentSlot))throw Error('组件插槽重复');slots.add(v.componentSlot);return v;});
 const state=cloneValue(t.groups?.[group]??{});delete state.component;
 return {overlays,duration:end-start,state};
}
export function componentOps(t:Timeline,name:string,group:string,start:number,values:NonNullable<NonNullable<Timeline['groups']>[string]['component']>['values']={},refresh=false):Op[]{
 const def=t.components?.[name];if(!def)throw Error('找不到组件：'+name);
 const current=t.overlays.filter(o=>o.group===group),ids=new Map<string,string>();
 const hash=(s:string)=>{let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0).toString(36);};
 for(const o of def.overlays){const slot=o.componentSlot??o.id;ids.set(o.id,current.find(x=>x.componentSlot===slot)?.id??group.slice(0,40)+'_'+hash(slot));}
 const cueIds=new Map<string,string>();for(const cue of [...def.overlays.flatMap(o=>o.cues??[]),...(def.state?.cues??[])])cueIds.set(cue.id,group.slice(0,40)+'_c'+hash(cue.id));
 const mapCues=(cues:Overlay['cues'])=>cues?.map(c=>({...c,id:cueIds.get(c.id)!,...(c.after?{after:cueIds.get(c.after)??c.after}:{})}));
 const links:Op[]=[];
 const ops:Op[]=refresh?current.filter(o=>![...ids.values()].includes(o.id)).map(o=>({op:'removeOverlay',id:o.id})):[];
 for(const o of def.overlays){const v=cloneValue(o),slot=v.componentSlot??v.id,params=values?.[slot];
  v.cues=mapCues(v.cues);
  v.id=ids.get(o.id)!;v.group=group;v.componentSlot=slot;v.startSeconds+=start;v.endSeconds+=start;
  if(v.follow)v.follow.target=ids.get(v.follow.target)??v.follow.target;
  if(v.connector){v.connector.from=ids.get(v.connector.from)??v.connector.from;v.connector.to=ids.get(v.connector.to)??v.connector.to;}
  if(v.trackMatte)v.trackMatte.source=ids.get(v.trackMatte.source)??v.trackMatte.source;
  if(v.morph)v.morph.from=ids.get(v.morph.from)??v.morph.from;
  if(params?.text!==undefined)v.text=params.text;if(params?.color){v.color=params.color;}if(params?.fill&&v.shape)v.shape.fill=params.fill;if(params?.imageSrc&&v.image)v.image.src=params.imageSrc;
  const {id,follow,connector,trackMatte,morph,...base}=v;const patch:Record<string,unknown>={...base};const old=current.find(x=>x.id===id);if(old)for(const key of Object.keys(old))if(key!=='id'&&!(key in v))patch[key]=null;if(follow||connector||trackMatte||morph)links.push({op:'updateOverlay',id,patch:{...(follow?{follow}:{}),...(connector?{connector}:{}),...(trackMatte?{trackMatte}:{}),...(morph?{morph}:{})}});ops.push(current.some(x=>x.id===id)?{op:'updateOverlay',id,patch}:{op:'addOverlay',id,...patch});
 }
 ops.push(...links);
 const state=cloneValue(def.state??{});state.cues=mapCues(state.cues);if(state.layout?.background)state.layout.background=ids.get(state.layout.background);
 // Keep placement/transform of an existing instance while replacing its content.
 const existing=t.groups?.[group];ops.push({op:'updateGroup',group,state:{...state,...(refresh?Object.fromEntries(Object.entries(existing??{}).filter(([k])=>!['component','cues','layout'].includes(k))):{}),component:{name,values}}});return ops;
}
export interface ResolvedCue {id:string;target:string;start:number;end:number;preset:string;local:number;duration:number;}
export function resolveCues(t:Timeline):ResolvedCue[]{
 const all=new Map<string,{cue:NonNullable<Overlay['cues']>[number];target:string;base:number}>();
 const add=(target:string,base:number,cues:Overlay['cues'])=>{for(const cue of cues??[]){if(all.has(cue.id))throw Error('动画编排 ID 重复：'+cue.id);if(cue.preset!=='hold'&&!ANIMATION_PRESETS[cue.preset])throw Error('未知编排动画：'+cue.preset);all.set(cue.id,{cue,target,base});}};
 for(const o of t.overlays)add(o.id,o.startSeconds,o.cues);
 for(const [g,state] of Object.entries(t.groups??{})){const os=t.overlays.filter(o=>o.group===g);if(os.length)add('group:'+g,Math.min(...os.map(o=>o.startSeconds)),state.cues);}
 const done=new Map<string,ResolvedCue>(),pending=new Set<string>();
 const visit=(id:string):ResolvedCue=>{if(done.has(id))return done.get(id)!;const item=all.get(id);if(!item)throw Error('动画前序不存在：'+id);if(pending.has(id))throw Error('动画编排存在循环依赖');pending.add(id);const {cue,target,base}=item;const start=cue.after?visit(cue.after).end+(cue.offset??0):base+cue.start;if(start<0)throw Error('编排不能早于时间线起点');const result={id,target,start,end:start+cue.duration,preset:cue.preset,local:start-base,duration:cue.duration};pending.delete(id);done.set(id,result);return result;};
 return [...all.keys()].map(visit);
}
export function prepareScheduledTimeline(t:Timeline):Timeline{
 const cues=resolveCues(t);if(!cues.length)return t;
 const next={...t,overlays:t.overlays.map(o=>({...o})),groups:{...t.groups}};
 const apply=(item:{animations?:Animations;effects?:Overlay['effects']},list:ResolvedCue[],duration:number)=>{
  const animations=cloneValue(resolveAnimations(item,duration)??{});
  for(const c of list.sort((a,b)=>a.start-b.start)){
   if(c.preset==='hold')continue;
   const expanded=ANIMATION_PRESETS[c.preset].expand(c.duration);
   const frames=Object.values(expanded).flatMap(f=>f??[]),lo=Math.min(...frames.map(f=>f.t)),hi=Math.max(...frames.map(f=>f.t));
   for(const [ch,fs] of Object.entries(expanded) as [keyof Animations,NonNullable<Animations['x']>][]){const mapped=fs.map(f=>({...f,t:c.local+(hi>lo?(f.t-lo)/(hi-lo)*c.duration:0)}));animations[ch]=[...(animations[ch]??[]).filter(f=>f.t<mapped[0].t),...mapped];}
  }item.animations=animations;
 };
 for(const o of next.overlays)apply(o,cues.filter(c=>c.target===o.id),o.endSeconds-o.startSeconds);
 for(const [g,state] of Object.entries(next.groups)){const members=t.overlays.filter(o=>o.group===g);if(members.length){next.groups[g]={...state};apply(next.groups[g],cues.filter(c=>c.target==='group:'+g),Math.max(...members.map(o=>o.endSeconds))-Math.min(...members.map(o=>o.startSeconds)));}}
 return next;
}
/** Reflow in normalized coordinates, or contain the existing composition uniformly in pixel space. */
export function adaptCanvasOps(t:Timeline,width:number,height:number,mode:'contain'|'reflow'='reflow'):Op[]{
 const ratio=Math.min(width/t.meta.width,height/t.meta.height),sx=t.meta.width*ratio/width,sy=t.meta.height*ratio/height;
 const ops:Op[]=[{op:'setMeta',patch:{width,height}}];
 const fitAnimations=(animations:Animations|undefined)=>animations?Object.fromEntries(Object.entries(animations).map(([ch,frames])=>[ch,frames?.map(f=>({...f,v:f.v*(ch==='x'?sx:ch==='y'?sy:1)}))])):undefined;
 const fitPath=(motionPath:Overlay['motionPath'])=>motionPath?{...motionPath,path:toPathD(mapPath(parsePath(motionPath.path),p=>[p[0]*sx,p[1]*sy]))}:undefined;
 if(mode==='contain')for(const [ti,tr] of t.videoTracks.entries())for(const c of tr.clips)ops.push({op:'updateClip',id:c.id,patch:ti===0?{fit:'contain'}:{box:{x:.5+((c.box?.x??.7)-.5)*sx,y:.5+((c.box?.y??.7)-.5)*sy,w:(c.box?.w??.28)*sx,h:(c.box?.h??.28)*sy},animations:fitAnimations(c.animations)}});

 for(const o of t.overlays){if(o.kind==='camera')continue;const patch:Record<string,unknown>={};
  if(mode==='contain'){patch.x=.5+((o.x??.5)-.5)*sx;patch.y=.5+((o.y??.5)-.5)*sy;if(o.w!==undefined)patch.w=o.w*sx;if(o.h!==undefined)patch.h=o.h*sy;if(o.animations)patch.animations=fitAnimations(o.animations);if(o.motionPath)patch.motionPath=fitPath(o.motionPath);}
  else{const edge=.06;patch.x=Math.max(edge,Math.min(1-edge,o.x??.5));patch.y=Math.max(edge,Math.min(1-edge,o.y??.5));if(o.w!==undefined)patch.w=Math.min(.88,Math.max(.04,o.w));if(o.h!==undefined)patch.h=Math.min(.88,o.h);}
  if(o.w===undefined&&o.x===undefined&&o.y===undefined){delete patch.x;delete patch.y;if(mode==='contain')patch.maxWidth=(o.maxWidth??.9)*sx;}
  if(o.autoSize)patch.autoSize={...o.autoSize,padding:(o.autoSize.padding??o.padding??12)*ratio};
  patch.fontSize=Math.max(4,o.fontSize*ratio);if(o.padding!==undefined)patch.padding=o.padding*ratio;ops.push({op:'updateOverlay',id:o.id,patch});
 }
 for(const [group,state] of Object.entries(t.groups??{})){if(mode==='contain'&&(state.animations||state.motionPath))ops.push({op:'updateGroup',group,state:{...state,animations:fitAnimations(state.animations),motionPath:fitPath(state.motionPath)}});if(state.layout)ops.push({op:'updateGroup',group,state:{...state,...(mode==='contain'?{animations:fitAnimations(state.animations),motionPath:fitPath(state.motionPath)}:{}),layout:{...state.layout,...(mode==='reflow'&&height>width?{direction:'column'}:{}),width:mode==='reflow'?.88:state.layout.width,padding:(state.layout.padding??0)*ratio,gap:(state.layout.gap??0)*ratio}}});}
 return ops;
}

export function copiedCues(cues:Overlay['cues'],scope:string,allIds:Set<string>=new Set(cues?.map(c=>c.id))):Overlay['cues']{
 const id=(value:string)=>{let h=2166136261;for(const c of value)h=Math.imul(h^c.charCodeAt(0),16777619);return scope.slice(0,45)+'_c'+(h>>>0).toString(36);};
 return cues?.map(c=>({...c,id:id(c.id),...(c.after&&allIds.has(c.after)?{after:id(c.after)}:{})}));
}

/** Deleting an anchor preserves dependants' last absolute timing as independent cues. */
export function repairRemovedCues(t:Timeline,before:Timeline):string[]{
 let previous:ResolvedCue[];try{previous=resolveCues(before);}catch{return [];}
 if(!previous.length)return [];const prior=new Map(previous.map(c=>[c.id,c]));
 const existing=new Set([...t.overlays.flatMap(o=>o.cues??[]),...Object.entries(t.groups??{}).filter(([g])=>t.overlays.some(o=>o.group===g)).flatMap(([,g])=>g.cues??[])].map(c=>c.id)),changed:string[]=[];
 const repair=(cues:Overlay['cues'],base:number,key:string)=>{let touched=false;for(const c of cues??[])if(c.after&&!existing.has(c.after)&&prior.has(c.after)){c.start=Math.max(0,(prior.get(c.id)?.start??base+c.start)-base);delete c.after;delete c.offset;touched=true;}if(touched)changed.push(key);};
 for(const o of t.overlays)repair(o.cues,o.startSeconds,'overlay:'+o.id);
 for(const [g,state] of Object.entries(t.groups??{})){const members=t.overlays.filter(o=>o.group===g);if(members.length)repair(state.cues,Math.min(...members.map(o=>o.startSeconds)),'group:'+g);}
 return changed;
}
