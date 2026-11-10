import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {gzip,gunzip} from 'node:zlib';
import {promisify} from 'node:util';
import {parseTimeline} from '../../engine/dist/schema.js';
import {precompose,referencedAssets} from '../../engine/dist/compositions.js';
import {parseBatch,batchVariant} from '../../engine/dist/batch.js';
import {FONTS} from '../../engine/dist/fonts.js';
import {FONTS_DIR} from './config.mjs';
import {safeAssetName} from './store.mjs';
import {readJson,readBuffer,sendJson,HttpError} from './http.mjs';
import {serveMedia} from './media.mjs';
import {runTool,probe} from './media-tools.mjs';
const zip=promisify(gzip),unzip=promisify(gunzip),hash=b=>createHash('sha256').update(b).digest('hex');
const MAX=128*1024*1024;
const input=fn=>{try{return fn();}catch(e){throw new HttpError(400,e.message);}};
export async function packProject(store,pid){
 const t=store.load(pid).timeline,files=[],missing=[];let total=0;
 const add=(kind,name,file)=>{if(!fs.existsSync(file)){missing.push(name);return;}const b=fs.readFileSync(file);total+=b.length;if(total>MAX)throw new HttpError(413,'工程包素材总量超过 128MB');files.push({kind,name,size:b.length,sha256:hash(b),data:b.toString('base64')});};
 for(const name of referencedAssets(t)){const file=store.assetPath(pid,name);if(!file)throw new HttpError(400,'工程引用了非法素材名：'+name);add('asset',name,file);}
 // All bundled font families travel with the document, including nested compositions and component definitions.
 for(const font of FONTS)add('font',font.file,path.join(FONTS_DIR,font.file));
 return zip(Buffer.from(JSON.stringify({format:'djian-project',version:1,name:store.readProjectMeta(pid)?.name,timeline:t,files,missing})),{level:6});
}
export async function unpackProject(store,data){
 let doc;try{doc=JSON.parse((await unzip(data,{maxOutputLength:200*1024*1024})).toString());}catch{throw new HttpError(400,'无效或过大的 .djproj 工程包');}
 if(doc.format!=='djian-project'||doc.version!==1||!Array.isArray(doc.files)||doc.files.length>2000)throw new HttpError(400,'不支持的工程包');
 const timeline=input(()=>parseTimeline(doc.timeline)),seen=new Set();let total=0;
 const files=doc.files.map(f=>{if(!f||!['asset','font'].includes(f.kind)||typeof f.name!=='string'||safeAssetName(f.name)!==f.name||typeof f.data!=='string')throw new HttpError(400,'工程包文件名无效');const key=f.kind+'/'+f.name;if(seen.has(key))throw new HttpError(400,'工程包含重复文件');seen.add(key);const b=Buffer.from(f.data,'base64');total+=b.length;if(total>MAX||b.length!==f.size||hash(b)!==f.sha256)throw new HttpError(400,'工程包文件校验失败');if(f.kind==='font'&&!FONTS.some(font=>font.file===f.name))throw new HttpError(400,'工程包含未知字体');return {...f,buffer:b};});
 const pid=store.create((doc.name??'导入工程')+'（导入）',timeline.meta);
 try{for(const f of files){if(f.kind==='asset'){fs.writeFileSync(path.join(store.assetsDir(pid),f.name),f.buffer,{flag:'wx'});try{store.writeAssetMeta(pid,f.name,await probe(path.join(store.assetsDir(pid),f.name)));}catch{}}else{const font=path.join(FONTS_DIR,f.name);if(!fs.existsSync(font))fs.writeFileSync(font,f.buffer,{flag:'wx'});}}
 await store.replace(pid,timeline,{label:'导入便携工程'});return {id:pid,missing:referencedAssets(timeline).filter(n=>!store.assetExists(pid,n))};
 }catch(e){fs.rmSync(store.dir(pid),{recursive:true,force:true});store.projects.delete(pid);throw e;}
}
export class ProxyService{
 constructor(store){this.store=store;this.tasks=new Map();}
 dir(pid){return path.join(this.store.dir(pid),'.proxies');}
 fingerprint(pid,name){const file=this.store.assetPath(pid,name);if(!file||!fs.existsSync(file))throw new HttpError(404,'素材不存在');const st=fs.statSync(file);return hash(JSON.stringify([name,st.size,st.mtimeMs,'h264-720-v1'])).slice(0,32);}
 status(pid){const sources=referencedAssets(this.store.load(pid).timeline),items=[];for(const name of sources){if(!/\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(name)||!this.store.assetExists(pid,name))continue;const key=this.fingerprint(pid,name),task=this.tasks.get(pid+':'+key),ready=fs.existsSync(path.join(this.dir(pid),key+'.mp4'));items.push({name,key,status:ready?'ready':task?.status??'none',error:task?.error,url:ready?`/api/p/${encodeURIComponent(pid)}/proxy/${key}`:null});}return {items};}
 start(pid){const status=this.status(pid);for(const item of status.items){if(item.status==='ready'||item.status==='working')continue;const key=pid+':'+item.key,task={status:'working'};this.tasks.set(key,task);fs.mkdirSync(this.dir(pid),{recursive:true});const temp=path.join(this.dir(pid),item.key+'.'+randomUUID()+'.mp4');task.promise=runTool('ffmpeg',['-y','-i',this.store.assetPath(pid,item.name),'-map','0:v:0','-map','0:a?','-vf',"scale=w='min(1280,iw)':h='min(720,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",'-c:v','libx264','-preset','ultrafast','-crf','28','-c:a','aac','-b:a','128k','-movflags','+faststart',temp],{timeoutMs:600000}).then(()=>{if(this.fingerprint(pid,item.name)===item.key){fs.renameSync(temp,path.join(this.dir(pid),item.key+'.mp4'));task.status='ready';}else task.status='none';}).catch(e=>{task.status='error';task.error=e.message;}).finally(()=>{fs.rmSync(temp,{force:true});});}return this.status(pid);}
 async clear(pid){if([...this.tasks.entries()].some(([k,t])=>k.startsWith(pid+':')&&t.status==='working'))throw new HttpError(409,'代理正在生成，请完成后清理');fs.rmSync(this.dir(pid),{recursive:true,force:true});for(const key of this.tasks.keys())if(key.startsWith(pid+':'))this.tasks.delete(key);}
 async close(){await Promise.all([...this.tasks.values()].map(t=>t.promise));}
}
export function registerProjectTools(r,{store,render,project}){
 const proxies=new ProxyService(store);render.proxies=proxies;
 r.add('GET','/api/p/:pid/proxies',(req,res,{params})=>sendJson(res,200,proxies.status(project(params))));
 r.add('POST','/api/p/:pid/proxies',(req,res,{params})=>sendJson(res,202,proxies.start(project(params))));
 r.add('DELETE','/api/p/:pid/cache',async(req,res,{params})=>{const pid=project(params);await proxies.clear(pid);render.clearCache(pid);sendJson(res,200,{ok:true});});
 r.add('GET','/api/p/:pid/proxy/:key',async(req,res,{params})=>{const pid=project(params);if(!/^[a-f0-9]{32}$/.test(params.key))throw new HttpError(400,'无效代理');await serveMedia(req,res,path.join(proxies.dir(pid),params.key+'.mp4'),'video/mp4');});
 r.add('GET','/api/p/:pid/archive',async(req,res,{params})=>{const data=await packProject(store,project(params));res.writeHead(200,{'Content-Type':'application/gzip','Content-Disposition':"attachment; filename=project.djproj"});res.end(data);});
 r.add('POST','/api/projects/import-archive',async(req,res)=>sendJson(res,201,await unpackProject(store,await readBuffer(req,MAX))));
 r.add('GET','/api/p/:pid/missing',(req,res,{params})=>{const pid=project(params);sendJson(res,200,{missing:referencedAssets(store.load(pid).timeline).filter(n=>!store.assetExists(pid,n)),available:fs.readdirSync(store.assetsDir(pid)).filter(n=>!n.startsWith('.'))});});
 r.add('POST','/api/p/:pid/relink',async(req,res,{params})=>{
  const pid=project(params),b=await readJson(req),opts={actor:b.actor==='ai'?'ai':'user',clientId:typeof b.clientId==='string'?b.clientId.slice(0,80):null,baseRev:Number.isInteger(b.baseRev)?b.baseRev:undefined,batchId:typeof b.batchId==='string'?b.batchId.slice(0,80):null,conflictPolicy:b.conflictPolicy??'warn',label:'重链接素材',requestPayload:{tool:'relink',from:b.from,to:b.to}};
  sendJson(res,200,await store.applyIntent(pid,opts,t=>{if(!referencedAssets(t).includes(b.from))throw new HttpError(400,'原素材未被引用');return [{op:'replaceAsset',from:b.from,to:b.to}];}));
 });
 r.add('POST','/api/p/:pid/precompose',async(req,res,{params})=>{
  const pid=project(params),b=await readJson(req),opts={actor:b.actor==='ai'?'ai':'user',clientId:typeof b.clientId==='string'?b.clientId.slice(0,80):null,baseRev:Number.isInteger(b.baseRev)?b.baseRev:undefined,batchId:typeof b.batchId==='string'?b.batchId.slice(0,80):null,conflictPolicy:b.conflictPolicy??'warn',label:'预合成',requestPayload:{tool:'precompose',ids:b.ids,name:b.name}};
  sendJson(res,200,await store.applyIntent(pid,opts,t=>{let result;try{result=precompose(t,Array.isArray(b.ids)?b.ids:[],String(b.name??'新合成'));}catch(e){throw new HttpError(400,e.message);}return [{op:'addOverlay',id:'comp_'+randomUUID(),...result.overlay},...b.ids.map(id=>({op:'removeOverlay',id}))];}));
 });
 r.add('GET','/api/p/:pid/queue' ,(req,res,{params})=>sendJson(res,200,{jobs:render.list(project(params))}));
 r.add('POST','/api/export/:job/retry',(req,res,{params})=>sendJson(res,202,{jobId:render.retry(params.job)}));
 r.add('POST','/api/p/:pid/batch',async(req,res,{params})=>{
  const pid=project(params),b=await readJson(req),rows=input(()=>parseBatch(String(b.text??''),b.format==='json'?'json':'csv')),source=store.load(pid).timeline;
  const variants=rows.map((row,index)=>{const timeline=input(()=>parseTimeline(batchVariant(source,row)));const missing=referencedAssets(timeline).filter(n=>!store.assetExists(pid,n));if(missing.length)throw new HttpError(400,`第 ${index+1} 条缺少素材：${missing.join('、')}`);return {name:row._name||`批量-${index+1}`,timeline};});
  if(!b.enqueue){sendJson(res,200,{count:variants.length,names:variants.map(v=>v.name),timeline:variants[0].timeline});return;}
  const pending=[...render.jobs.values()].filter(j=>['queued','rendering'].includes(j.status)).length;if(pending+variants.length>100)throw new HttpError(429,'导出队列最多 100 项');
  sendJson(res,202,{jobIds:variants.map(v=>render.enqueue(pid,{...v,scale:b.scale,quality:b.quality}))});
 });
}
