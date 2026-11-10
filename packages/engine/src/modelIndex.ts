import type {Timeline} from './schema.js';
import {draftInfo} from './draft.js';
export interface ModelIndex {overlays:Map<string,number>;clips:Map<string,{kind:'video'|'audio';trackIndex:number;index:number}>;groups:Map<string,string[]>;assets:Map<string,Set<string>>;hasCues:boolean;hasLayout:boolean;}
const cache=new WeakMap<object,{version:number;value:ModelIndex}>();
export function modelIndex(t:Timeline):ModelIndex{
 const info=draftInfo(t),key=info?.version===0?info.base:t,version=info?.version??0,hit=cache.get(key);if(hit&&hit.version===(key===t?version:0))return hit.value;
 const index:ModelIndex={overlays:new Map(),clips:new Map(),groups:new Map(),assets:new Map(),hasCues:false,hasLayout:false};
 const asset=(src:string,id:string)=>{if(!index.assets.has(src))index.assets.set(src,new Set());index.assets.get(src)!.add(id);};
 t.overlays.forEach((o,i)=>{index.overlays.set(o.id,i);if(o.group){if(!index.groups.has(o.group))index.groups.set(o.group,[]);index.groups.get(o.group)!.push(o.id);}if(o.image)asset(o.image.src,o.id);if(o.audioReactive)asset(o.audioReactive.src,o.id);if(o.cues?.length)index.hasCues=true;if(o.autoSize||o.textFit)index.hasLayout=true;});
 for(const kind of ['video','audio'] as const)t[kind==='video'?'videoTracks':'audioTracks'].forEach((tr,trackIndex)=>tr.clips.forEach((c,i)=>{index.clips.set(c.id,{kind,trackIndex,index:i});asset(c.src,c.id);}));
 for(const g of Object.values(t.groups??{})){if(g.cues?.length)index.hasCues=true;if(g.layout)index.hasLayout=true;}
 cache.set(key,{version:key===t?version:0,value:index});return index;
}
/** Value-only edits keep locations and dependencies; structural or binding edits rebuild lazily. */
export function inheritIndex(before:Timeline,after:Timeline,paths:string[][]){
 if(before===after)return;
 const structural=paths.some(p=>p.length<3||p[0]==='groups'||(['overlays','videoTracks','audioTracks'].includes(p[0])&&p.some(k=>['length','id','group','src','image','audioReactive','cues','autoSize','textFit','clips'].includes(k))));
 if(!structural){const hit=cache.get(before);if(hit)cache.set(after,{version:0,value:hit.value});}
}
