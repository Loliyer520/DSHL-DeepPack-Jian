import {diffTimelines} from '../../engine/dist/diff.js';
import {applyOps} from '../../engine/dist/ops.js';
import {protectedDesignFields} from '../../engine/dist/designLocks.js';
import fs from 'node:fs';
import path from 'node:path';
import {checkTimeline} from '../../engine/dist/preflight.js';
import {checkMediaQuality,subtitleProposals,audioProposals} from '../../engine/dist/delivery.js';
import {referencedAssets} from '../../engine/dist/compositions.js';
import {FONTS} from '../../engine/dist/fonts.js';
import {FONTS_DIR,assetKind} from './config.mjs';
import {runTool,probe} from './media-tools.mjs';
import {readJson,sendJson,HttpError} from './http.mjs';

export function deliveryPreflight(store,pid,timeline=store.load(pid).timeline){
 const assets=fs.readdirSync(store.assetsDir(pid)).filter(n=>assetKind(n)).map(name=>({name,...store.readAssetMeta(pid,name)}));
 const available=FONTS.filter(f=>fs.existsSync(path.join(FONTS_DIR,f.file))).map(f=>f.id);
 const issues=[...checkTimeline(timeline,assets),...checkMediaQuality(timeline,assets,available)];
 for(const name of referencedAssets(timeline))if(!store.assetExists(pid,name)&&!issues.some(i=>i.code==='missing-asset'&&i.message.includes(name)))issues.push({code:'missing-asset',severity:'error',time:0,message:'找不到素材：'+name});
 return {rev:store.load(pid).rev,issues,canExport:!issues.some(i=>i.severity==='error')};
}
export function exportFailure(error,stage){
 const raw=String(error?.message??error);let code='render-failed',hint='查看原始错误，修复后重试；重试保留原任务的时间线快照。';
 if(/ENOSPC|no space left/i.test(raw)){code='disk-full';hint='磁盘空间不足，清理输出目录所在磁盘后重试。';}
 else if(/ENOENT|404|not found|failed to fetch/i.test(raw)){code='missing-resource';hint='检查素材、字体及本地服务是否可访问，然后重新导出当前项目。';}
 else if(/timeout|timed out/i.test(raw)){code='timeout';hint='素材加载或渲染超时，检查素材后尝试低清样片。';}
 else if(/codec|encoder|ffmpeg/i.test(raw)){code='encoder';hint='编码或解码失败，请检查素材格式及 FFmpeg，或尝试标准画质。';}
 return {code,stage,hint,detail:raw.slice(0,4000)};
}
const audioCache=new Map(),imageCache=new Map();
const remember=(cache,key,value)=>{cache.set(key,value);while(cache.size>128)cache.delete(cache.keys().next().value);return value;};
export async function measureLoudness(file,{inPoint=0,duration=600,speed=1}={}){
 const st=fs.statSync(file),key=JSON.stringify([file,st.size,st.mtimeMs,inPoint,duration,speed]);if(audioCache.has(key))return audioCache.get(key);
 let remaining=speed;const tempo=[];while(remaining>2){tempo.push('atempo=2');remaining/=2;}while(remaining<.5){tempo.push('atempo=0.5');remaining*=2;}tempo.push('atempo='+remaining);
 const {stderr}=await runTool('ffmpeg',['-hide_banner','-nostats','-ss',String(inPoint),'-t',String(duration*speed),'-i',file,'-vn','-af',tempo.concat('loudnorm=I=-16:TP=-1:LRA=11:print_format=json').join(','),'-f','null','-'],{timeoutMs:180000,maxBytes:1024*1024});
 const json=String(stderr).match(/\{\s*"input_i"[\s\S]*?\}/)?.[0];if(!json)throw new Error('FFmpeg 未返回响度数据（需要 loudnorm 滤镜）');const data=JSON.parse(json),finite=v=>Number.isFinite(Number(v))?Number(v):null;
 return remember(audioCache,key,{integrated:finite(data.input_i),truePeak:finite(data.input_tp),range:finite(data.input_lra),duration});
}
async function imageBackground(file){
 const st=fs.statSync(file),key=JSON.stringify([file,st.size,st.mtimeMs]);if(imageCache.has(key))return imageCache.get(key);
 const {stdout}=await runTool('ffmpeg',['-v','error','-i',file,'-frames:v','1','-vf','scale=16:16','-f','rawvideo','-pix_fmt','rgba','-'],{maxBytes:4096,timeoutMs:20000});if(stdout.length!==1024)throw Error('图片样本不完整');
 let transparent=0,whiteCorners=0;for(let i=0;i<256;i++)if(stdout[i*4+3]<250)transparent++;for(const i of [0,15,240,255])if([0,1,2,3].every(c=>stdout[i*4+c]>245))whiteCorners++;
 return remember(imageCache,key,{hasTransparency:transparent>0,whiteCorners});
}
export async function inspectDelivery(store,pid,{audio=false}={}){
 const {timeline:t,rev}=store.load(pid),measurements={};
 for(const name of referencedAssets(t)){const file=store.assetPath(pid,name);if(!file||!store.assetExists(pid,name))continue;const st=fs.statSync(file),cached=store.readAssetMeta(pid,name);if(cached?.size===st.size&&cached?.mtimeMs===Math.floor(st.mtimeMs))continue;try{store.writeAssetMeta(pid,name,{...await probe(file),kind:assetKind(name),size:st.size,mtimeMs:Math.floor(st.mtimeMs)});}catch(e){store.writeAssetMeta(pid,name,{error:e.message,size:st.size,mtimeMs:Math.floor(st.mtimeMs)});}}
 const result=deliveryPreflight(store,pid,t),issues=[...result.issues];
 const images=[...new Set(t.overlays.filter(o=>o.image).map(o=>o.image.src))];
 for(const name of images.slice(0,20)){const file=store.assetPath(pid,name);if(!file||!store.assetExists(pid,name))continue;try{const m=await imageBackground(file);if(!m.hasTransparency&&m.whiteCorners===4)issues.push({code:'image-white-background',severity:'info',id:t.overlays.find(o=>o.image?.src===name)?.id,time:0,message:name+' 的四角样本为不透明白色；若原意为透明贴图，请更换带透明通道的 PNG/WebP。白色背景也可能是有意设计。'});}catch(e){issues.push({code:'image-unchecked',severity:'info',time:0,message:'图片背景未能检测：'+name});}}
 if(images.length>20)issues.push({code:'image-limit',severity:'info',time:0,message:'图片背景检测限于前 20 个图片元素素材'});
 if(audio){let count=0;for(const tr of t.audioTracks)if(!tr.muted)for(const c of tr.clips)if(!c.muted){if(++count>30)continue;const file=store.assetPath(pid,c.src);if(!file||!store.assetExists(pid,c.src))continue;try{measurements[c.id]=await measureLoudness(file,{inPoint:c.inPoint,duration:Math.min(c.duration,600),speed:c.speed});const m=measurements[c.id];if(m.integrated===null||m.integrated< -60)issues.push({code:'audio-silence',severity:'warning',id:c.id,time:c.atSeconds,message:'实测片段近乎静音'});if(m.truePeak!==null&&m.truePeak>=0)issues.push({code:'audio-true-peak',severity:'warning',id:c.id,time:c.atSeconds,message:`源片段真峰值 ${m.truePeak} dBTP，存在削波风险`});if(c.duration>600)issues.push({code:'audio-duration-limit',severity:'info',id:c.id,time:c.atSeconds,message:'仅测量本片段前 10 分钟'});}catch(e){issues.push({code:'audio-unchecked',severity:'info',id:c.id,time:c.atSeconds,message:'响度未能测量：'+e.message});}}if(count>30)issues.push({code:'audio-count-limit',severity:'info',time:0,message:'本次响度分析限于前 30 个未静音音频片段'});}
 return {...result,rev,issues,measurements,proposals:audio?audioProposals(t,measurements):[],scope:'图片背景为缩略图采样；响度仅测量音频轨的源片段（含倍速），不含最终混音、视频内音轨、淡入淡出和闪避。'};
}
export function registerDeliveryTools(r,{store,project}){
 r.add('POST','/api/p/:pid/delivery/apply',async(req,res,{params})=>{
  const pid=project(params),b=await readJson(req);
  if(!Array.isArray(b?.ops)||!b.ops.length||b.ops.length>2000)throw new HttpError(400,'质量建议操作无效');
  const result=await store.serialize(pid,async()=>{
   const {timeline:before,rev}=store.load(pid);if(b.baseRev!==rev)throw new HttpError(409,'项目已变化，请重新检查');
   for(const op of b.ops){const fields=op.op==='updateOverlay'?['text','x','y','w','align']:op.op==='updateClip'?['volume','fadeIn','fadeOut']:op.op==='updateTrack'?['duck']:null;
    if(!fields||!op.patch||Object.keys(op.patch).some(k=>!fields.includes(k)))throw new HttpError(400,'质量建议包含不支持的修改');
    if(op.op==='updateOverlay'){const o=before.overlays.find(o=>o.id===op.id);if(!o||Object.keys(op.patch).some(k=>protectedDesignFields(o).has(k)))throw new HttpError(400,'建议涉及手工保护字段');}
   }
   const checked=applyOps(before,b.ops,{actor:'user'});if(checked.receipts.some(r=>r.status==='rejected'))throw new HttpError(400,'建议无法应用：'+checked.receipts.filter(r=>r.status==='rejected').map(r=>r.reason).join('；'));
   const applied=await store.applyNow(pid,{ops:b.ops,baseRev:rev,actor:'user',clientId:typeof b.clientId==='string'?b.clientId:null,label:'采用交付质量建议',conflictPolicy:'reject'});
   return {...applied,inverse:diffTimelines(store.load(pid).timeline,before)};
  });sendJson(res,200,result);
 });

 r.add('GET','/api/p/:pid/delivery/preflight',(req,res,{params})=>sendJson(res,200,deliveryPreflight(store,project(params))));
 r.add('POST','/api/p/:pid/delivery/inspect',async(req,res,{params})=>{const b=await readJson(req);sendJson(res,200,await inspectDelivery(store,project(params),{audio:b?.audio===true}));});
 r.add('POST','/api/p/:pid/delivery/subtitles',async(req,res,{params})=>{const pid=project(params),b=await readJson(req);if(b?.keywords!==undefined&&(!Array.isArray(b.keywords)||b.keywords.length>20||b.keywords.some(s=>typeof s!=='string'||s.length>40)))throw new HttpError(400,'关键词最多 20 个，每个最多 40 字');const {timeline,rev}=store.load(pid);sendJson(res,200,{rev,proposals:subtitleProposals(timeline,{maxChars:Number(b?.maxChars)||18,safeBottom:Number(b?.safeBottom)||.12,keywords:b?.keywords??[]})});});
}
