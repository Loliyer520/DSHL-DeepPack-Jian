// The former full-snapshot transaction loop is retained only as a regression oracle.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
export async function referenceKernel(){
 const file=path.resolve('packages/engine/src/ops.ts');let source=fs.readFileSync(file,'utf8');const a=source.indexOf('export function applyOps('),b=source.indexOf('\n/** 回执里',a);
 source=source.slice(0,a)+`export function applyOps(timeline:Timeline,rawOps:readonly unknown[],ctx:OpContext={}){
 const t=structuredClone(timeline),usedIds=collectIds(t),changed=new Set<string>(),receipts:any[]=[],actor=ctx.actor??'user';
 rawOps.forEach((raw,index)=>{const {op,error}=normalizeOp(raw);if(!op){receipts.push({index,op:String((raw as any)?.op??'?'),status:'rejected',reason:error});return;}
 const before=JSON.stringify(t),s:Scope={t,ctx,actor,touched:new Set(),warnings:[],newIds:[],usedIds};
 try{applyOne(s,op);if(actor!=='system'){if(before.includes('"cues"'))for(const key of repairRemovedCues(t,JSON.parse(before)))s.touched.add(key);const layout=applyLayout(t);layout.overlays.forEach((o,i)=>{if(JSON.stringify(o)!==JSON.stringify(t.overlays[i]))s.touched.add('overlay:'+o.id);});t.overlays=layout.overlays;}}
 catch(e){const restored=JSON.parse(before);for(const key of Object.keys(t))delete (t as any)[key];Object.assign(t,restored);receipts.push({index,op:op.op,status:'rejected',reason:(e as Error).message});return;}
 const effective=JSON.stringify(t)!==before;for(const key of s.touched)changed.add(key);receipts.push({index,op:op.op,status:!effective?'ignored':s.warnings.length?'partial':'applied'});
 });return {timeline:t,receipts,changed:[...changed]};}
 `+source.slice(b);
 // The oracle mutates in place, so it deliberately does not reuse immutable indexes.
 source=source.replace("import {modelIndex,inheritIndex}","import {modelIndex as buildIndex,inheritIndex}");source+='\nfunction modelIndex(t:Timeline){return buildIndex(structuredClone(t));}\n';
 const out=path.resolve('node_modules/.cache/reference-kernel-'+process.pid+'.mjs');await build({stdin:{contents:source,resolveDir:path.dirname(file),loader:'ts'},outfile:out,bundle:true,platform:'node',format:'esm',packages:'external',logLevel:'silent'});
 try{return await import(pathToFileURL(out).href);}finally{fs.rmSync(out,{force:true});}
}
