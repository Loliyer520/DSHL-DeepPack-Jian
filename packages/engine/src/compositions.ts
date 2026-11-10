import type {Timeline, Overlay} from './schema.js';
import {mainTrackStarts,evalKeyframes} from './timeline.js';
import {resolveAnimations} from './presets.js';

/** Embedded documents are self-contained, with independently editable coordinates and timing. */
export function precompose(t:Timeline,ids:string[],name:string):{child:Timeline;overlay:Partial<Overlay>} {
 const selected=t.overlays.filter(o=>ids.includes(o.id));
 if(!selected.length)throw new Error('请先选择元素');
 for(const o of selected)if(o.group&&t.overlays.some(x=>x.group===o.group&&!ids.includes(x.id)))throw new Error('请完整选择分组');
 const idsSet=new Set(ids);
 for(const o of t.overlays){const refs=[o.follow?.target,o.connector?.from,o.connector?.to,o.trackMatte?.source,o.morph?.from].filter(Boolean);if(refs.some(ref=>idsSet.has(o.id)!==idsSet.has(ref!)))throw new Error('请一起选择绑定、形变或遮罩关联的元素');}
 const start=Math.min(...selected.map(o=>o.startSeconds)),end=Math.max(...selected.map(o=>o.endSeconds));
 const child:Timeline={version:t.version,meta:{...t.meta,background:'#00000000'},videoTracks:[{id:'v1',name:'主轨道',clips:[]}],audioTracks:[],markers:[],overlays:selected.map(o=>({...o,startSeconds:o.startSeconds-start,endSeconds:o.endSeconds-start})),groups:Object.fromEntries(Object.entries(t.groups??{}).filter(([g])=>selected.some(o=>o.group===g))),theme:t.theme,components:t.components,animationLibrary:t.animationLibrary};
 // Cue references outside the selected scope cannot survive moving to an independent document.
 const cues=new Set([...child.overlays.flatMap(o=>o.cues??[]),...Object.values(child.groups??{}).flatMap(g=>g.cues??[])].map(c=>c.id));
 for(const o of child.overlays)if(o.cues?.some(c=>c.after&&!cues.has(c.after)))throw new Error('请一起选择关联动画的对象');
 return {child,overlay:{kind:'shape',name,x:.5,y:.5,w:1,h:1,startSeconds:start,endSeconds:end,composition:{name,timeline:JSON.stringify(child),inPoint:0,speed:1,volume:1}}};
}
export function referencedAssets(t:Timeline,depth=0):string[]{
 if(depth>4)throw new Error('嵌套合成最多 4 层');
 const out=[...t.videoTracks,...t.audioTracks].flatMap(tr=>tr.clips.map(c=>c.src));
 for(const o of [...t.overlays,...Object.values(t.components??{}).flatMap(c=>c.overlays)]){if(o.image)out.push(o.image.src);if(o.audioReactive?.src)out.push(o.audioReactive.src);if(o.composition)out.push(...referencedAssets(JSON.parse(o.composition.timeline),depth+1));}
 for(const g of Object.values(t.groups??{}))for(const v of Object.values(g.component?.values??{}))if(v.imageSrc)out.push(v.imageSrc);
 return [...new Set(out)];
}
type Sound={src:string;start:number;end:number;inPoint:number;speed:number;gain:(s:number)=>number};
export function nestedAudio(t:Timeline,depth=0):Sound[]{
 if(depth>=4)return [];
 const result:Sound[]=[];
 for(const o of t.overlays){if(!o.composition)continue;const ref=o.composition,child=JSON.parse(ref.timeline) as Timeline,sounds:Sound[]=[],starts=mainTrackStarts(child);
  for(const [ti,tr] of child.videoTracks.entries())for(const c of tr.clips){if(tr.hidden||tr.muted||c.muted||c.type==='image'||c.freeze)continue;const start=ti===0?(starts.get(c.id)??0):(c.atSeconds??0);const anim=resolveAnimations(c,c.clipDuration);sounds.push({src:c.src,start,end:start+c.clipDuration,inPoint:c.inPoint,speed:c.speed??1,gain:s=>c.volume*(evalKeyframes(anim?.volume,s)??1)*fade(s,c.clipDuration,c.fadeIn,c.fadeOut)});}
  for(const tr of child.audioTracks)for(const c of tr.clips){if(tr.muted||c.muted)continue;sounds.push({src:c.src,start:c.atSeconds,end:c.atSeconds+c.duration,inPoint:c.inPoint,speed:c.speed??1,gain:s=>duck(tr,child,c.atSeconds+s)*tr.volume*c.volume*(evalKeyframes(c.animations?.volume,s)??1)*fade(s,c.duration,c.fadeIn,c.fadeOut)});}
  sounds.push(...nestedAudio(child,depth+1));
  for(const a of sounds){const start=Math.max(o.startSeconds,o.startSeconds+(a.start-ref.inPoint)/ref.speed),end=Math.min(o.endSeconds,o.startSeconds+(a.end-ref.inPoint)/ref.speed);if(end<=start)continue;const skipped=ref.inPoint+(start-o.startSeconds)*ref.speed-a.start;result.push({src:a.src,start,end,inPoint:a.inPoint+skipped*a.speed,speed:a.speed*ref.speed,gain:s=>a.gain(skipped+s*ref.speed)*ref.volume});}
 }
 return result;
}
function fade(s:number,d:number,fi=0,fo=0){return Math.max(0,Math.min(1,fi?s/fi:1))*Math.max(0,Math.min(1,fo?(d-s)/fo:1));}

function duck(tr:Timeline['audioTracks'][number],t:Timeline,s:number){if(!tr.duck||tr.role==='voice')return 1;const ramp=tr.duck.ramp??.3;let proximity=0;for(const voice of t.audioTracks.filter(v=>v.role==='voice'&&!v.muted))for(const c of voice.clips.filter(c=>!c.muted)){const end=c.atSeconds+c.duration,dist=s<c.atSeconds?c.atSeconds-s:s>end?s-end:0;proximity=Math.max(proximity,dist===0?1:ramp?Math.max(0,1-dist/ramp):0);}return 1-(1-tr.duck.level)*proximity;}
