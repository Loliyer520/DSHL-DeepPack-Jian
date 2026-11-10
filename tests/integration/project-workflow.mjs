import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {gzipSync,gunzipSync} from 'node:zlib';
import {startEngine} from '../helpers/engine.mjs';
import {parseTimeline} from '../../packages/engine/dist/schema.js';
import {runTool,probe} from '../../packages/webui/server/media-tools.mjs';
const e=await startEngine();
const ok=r=>{assert.ok(r.status>=200&&r.status<300,JSON.stringify(r.body));return r.body;};
try{
 const pid=ok(await e.api('POST','/api/session-project',{sessionId:'workflow'})).project.id,base='/api/p/'+pid;
 const audio=ok(await e.api('POST',base+'/assets/import',{path:path.resolve('examples/assets/ambient-pulse.wav')})).name;
 const video=ok(await e.api('POST',base+'/assets/import',{path:path.resolve('examples/assets/a.mp4')})).name;
 const child=parseTimeline({meta:{fps:30,width:320,height:180,background:'#09111f'},audioTracks:[{id:'audio',volume:.6,clips:[{id:'sound',src:audio,atSeconds:0,inPoint:0,duration:2}]}],overlays:[{id:'card',kind:'shape',text:'',startSeconds:0,endSeconds:2,x:.5,y:.5,w:.8,h:.8,shape:{type:'rect',fill:'#2563eb',radius:10},animations:{rotation:[{t:0,v:-10},{t:2,v:10}]}},{id:'title',kind:'text',text:'{{title}}',startSeconds:0,endSeconds:2,fontSize:30,x:.5,y:.5,color:'#ffffff'}]});
 const ops=[{op:'setMeta',patch:{width:480,height:270,fps:30}},{op:'addOverlay',id:'nested',kind:'shape',text:'',x:.5,y:.5,w:.9,h:.8,startSeconds:0,endSeconds:1,composition:{name:'card',timeline:JSON.stringify(child),inPoint:.25,speed:1.5,volume:.8}}];
 const edit=ok(await e.api('POST',base+'/ops',{ops}));assert.ok(edit.receipts.every(r=>r.status==='applied'),JSON.stringify(edit));
 const t=ok(await e.api('GET',base+'/timeline'));const rev=t.rev;
 // Actual render and same-request cache hit.
 const first=ok(await e.api('POST',base+'/frame',{seconds:.4,format:'png',maxSize:480}));const second=ok(await e.api('POST',base+'/frame',{seconds:.4,format:'png',maxSize:480}));assert.equal(first.imageBase64,second.imageBase64);fs.writeFileSync('docs/screenshots/41-nested-workflow.png',Buffer.from(first.imageBase64,'base64'));
 fs.writeFileSync('examples/project-workflow.json',JSON.stringify(t.timeline,null,2)+'\n');
 const preview=ok(await e.api('POST',base+'/batch',{format:'csv',text:'title,_name\nAlpha,first\nBeta,second',enqueue:false}));assert.equal(preview.count,2);assert.equal(JSON.parse(preview.timeline.overlays[0].composition.timeline).overlays[1].text,'Alpha');
 const batch=ok(await e.api('POST',base+'/batch',{format:'csv',text:'title,_name\nAlpha,first\nBeta,second',enqueue:true,scale:.5,quality:'draft'}));assert.equal(batch.jobIds.length,2);
 // Queue cancel is independent of the rendering task; a third job still runs.
 ok(await e.api('POST','/api/export/'+batch.jobIds[1]+'/cancel',{}));assert.equal(ok(await e.api('GET','/api/export/'+batch.jobIds[1])).status,'cancelled');
 const retry=ok(await e.api('POST','/api/export/'+batch.jobIds[1]+'/retry',{}));
 for(const job of [batch.jobIds[0],retry.jobId]){let state;for(let i=0;i<180;i++){state=ok(await e.api('GET','/api/export/'+job));if(['done','error','cancelled'].includes(state.status))break;await new Promise(r=>setTimeout(r,1000));}assert.equal(state.status,'done',JSON.stringify(state));const bytes=Buffer.from(await(await fetch(e.base+'/api/export/'+job+'/download')).arrayBuffer());fs.writeFileSync('dist/project-workflow.mp4',bytes);}
 const media=await probe(path.resolve('dist/project-workflow.mp4'));assert.equal(media.hasAudio,true,JSON.stringify(media));
 // Decode actual nested soundtrack and ensure it is not silent.
 const decoded=await runTool('ffmpeg',['-i',path.resolve('dist/project-workflow.mp4'),'-vn','-f','f32le','-ac','1','-ar','8000','pipe:1']);let peak=0;for(let i=0;i+4<=decoded.stdout.length;i+=4)peak=Math.max(peak,Math.abs(decoded.stdout.readFloatLE(i)));assert.ok(peak>.01,'Nested audio must be audible');
 assert.equal(ok(await e.api('GET',base+'/timeline')).rev,rev,'batch export must not mutate source');
 // Proxy source must be referenced; use a PiP hidden behind the card for this check.
 ok(await e.api('POST',base+'/ops',{ops:[{op:'addClip',id:'video',src:video,track:'pip',clipDuration:1,atSeconds:0}]}));
 ok(await e.api('POST',base+'/proxies',{}));let proxy;for(let i=0;i<60;i++){proxy=ok(await e.api('GET',base+'/proxies')).items[0];if(proxy?.status==='ready'||proxy?.status==='error')break;await new Promise(r=>setTimeout(r,500));}assert.equal(proxy?.status,'ready',JSON.stringify(proxy));assert.equal((await fetch(e.base+proxy.url,{method:'HEAD'})).status,200);
 const archive=Buffer.from(await(await fetch(e.base+base+'/archive')).arrayBuffer());fs.writeFileSync('dist/project-workflow.djproj',archive);const doc=JSON.parse(gunzipSync(archive));assert.ok(doc.files.some(f=>f.name===audio));
 const upload=async bytes=>{const r=await fetch(e.base+'/api/projects/import-archive',{method:'POST',headers:{'X-Djian-Client':'test'},body:bytes});return {status:r.status,body:await r.json()};};
 const restored=ok(await upload(archive));assert.notEqual(restored.id,pid);assert.deepEqual(restored.missing,[]);assert.deepEqual(ok(await e.api('GET','/api/p/'+restored.id+'/timeline')).timeline,ok(await e.api('GET',base+'/timeline')).timeline);
 const missingDoc=JSON.parse(gunzipSync(archive));const nested=JSON.parse(missingDoc.timeline.overlays[0].composition.timeline);nested.audioTracks[0].clips[0].src='missing.wav';missingDoc.timeline.overlays[0].composition.timeline=JSON.stringify(nested);
 const missingProject=ok(await upload(gzipSync(JSON.stringify(missingDoc))));assert.deepEqual(missingProject.missing,['missing.wav']);
 const linked=ok(await e.api('POST','/api/p/'+missingProject.id+'/relink',{from:'missing.wav',to:audio,batchId:'relink-once'}));assert.ok(linked.receipts.every(r=>r.status!=='rejected'),JSON.stringify(linked));assert.equal(ok(await e.api('POST','/api/p/'+missingProject.id+'/relink',{from:'missing.wav',to:audio,batchId:'relink-once'})).duplicate,true);assert.deepEqual(ok(await e.api('GET','/api/p/'+missingProject.id+'/missing')).missing,[]);
 const corrupt=JSON.parse(gunzipSync(archive));corrupt.files[0].sha256='0'.repeat(64);assert.equal((await upload(gzipSync(JSON.stringify(corrupt)))).status,400);
 doc.files[0].name='../bad';const unsafe=await upload(gzipSync(JSON.stringify(doc)));assert.equal(unsafe.status,400);
 ok(await e.api('DELETE',base+'/cache'));assert.equal(ok(await e.api('GET',base+'/proxies')).items[0].status,'none');
 console.log('PASS nested visual + audible export, batch snapshot queue cancel/retry, proxy generation, portable archive round-trip and traversal rejection');
}finally{await e.stop();}
