import type {Timeline} from './schema.js';
function fields(a:any,b:any,base:string,out:string[]){
 if(a===b)return;if(a==null||b==null||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)||Array.isArray(b)){if(JSON.stringify(a)!==JSON.stringify(b))out.push(base);return;}
 for(const k of new Set([...Object.keys(a),...Object.keys(b)]))fields(a[k],b[k],base+'/'+encodeURIComponent(k),out);
}
/** Stable entity paths. Arrays such as keyframe channels are atomic fields; clips are individual entities. */
export function changedFields(a:Timeline,b:Timeline):string[]{
 const out:string[]=[];fields(a.meta,b.meta,'meta',out);fields(a.theme,b.theme,'theme',out);fields(a.design,b.design,'design',out);fields(a.designScenes,b.designScenes,'designScenes',out);
 const entities=(name:string,x:any[],y:any[])=>{const am=new Map(x.map(v=>[v.id,v])),bm=new Map(y.map(v=>[v.id,v]));for(const id of new Set([...am.keys(),...bm.keys()]))fields(am.get(id),bm.get(id),name+':'+encodeURIComponent(id),out);if(x.map(v=>v.id).join('\0')!==y.map(v=>v.id).join('\0'))out.push(name+'/order');};
 entities('overlay',a.overlays,b.overlays);entities('marker',a.markers,b.markers);
 for(const key of ['videoTracks','audioTracks'] as const){entities('track',a[key].map(({clips,...tr})=>tr),b[key].map(({clips,...tr})=>tr));entities('clip',a[key].flatMap(tr=>tr.clips.map(c=>({...c,trackId:tr.id}))),b[key].flatMap(tr=>tr.clips.map(c=>({...c,trackId:tr.id}))));}
 for(const key of ['groups','components','animationLibrary'] as const)for(const id of new Set([...Object.keys(a[key]??{}),...Object.keys(b[key]??{})]))fields(a[key]?.[id],b[key]?.[id],key+':'+encodeURIComponent(id),out);
 return out;
}
export function fieldsOverlap(a:string,b:string){return a===b||a.startsWith(b+'/')||b.startsWith(a+'/');}
