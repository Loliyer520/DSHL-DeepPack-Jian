import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {startEngine} from '../helpers/engine.mjs';
import {runTool,probe} from '../../packages/webui/server/media-tools.mjs';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'dj-delivery-')),e=await startEngine();
const ok=r=>{assert.ok(r.status>=200&&r.status<300,JSON.stringify(r));return r.body;};
try{
 const wav=path.join(tmp,'tone.wav'),png=path.join(tmp,'white.png');
 await runTool('ffmpeg',['-y','-f','lavfi','-i','sine=frequency=440:duration=2','-c:a','pcm_s16le',wav]);
 await runTool('ffmpeg',['-y','-f','lavfi','-i','color=c=white:s=64x64','-frames:v','1',png]);
 const pid=ok(await e.api('POST','/api/session-project',{sessionId:'delivery'})).project.id,base='/api/p/'+pid;
 const sound=ok(await e.api('POST',base+'/assets/import',{path:wav})).name,img=ok(await e.api('POST',base+'/assets/import',{path:png})).name;
 const timeline={meta:{width:640,height:360,fps:24,background:'#182033'},overlays:[{id:'sub',kind:'subtitle',text:'这是一段中文测试，标点需要合理换行。',fontSize:26,color:'#ffffff',fontFamily:'sans',startSeconds:0,endSeconds:1},{id:'pic',kind:'image',text:'',image:{src:img,fit:'contain'},x:.2,y:.2,w:.3,h:.3,startSeconds:0,endSeconds:1}],audioTracks:[{id:'voice',role:'voice',clips:[{id:'audio',src:sound,atSeconds:0,duration:1,volume:.8}]}]};
 ok(await e.api('PUT',base+'/timeline',{timeline}));const before=ok(await e.api('GET',base+'/timeline'));
 const quality=ok(await e.api('POST',base+'/delivery/inspect',{audio:true}));assert.equal(quality.rev,before.rev);assert.ok(quality.issues.some(i=>i.code==='asset-upscale'));assert.ok(quality.issues.some(i=>i.code==='image-white-background'));assert.ok(Number.isFinite(quality.measurements.audio.integrated),JSON.stringify(quality));assert.ok(quality.proposals.some(p=>p.id==='audio'));
 const captions=ok(await e.api('POST',base+'/delivery/subtitles',{maxChars:8,keywords:['中文']}));assert.match(captions.proposals[0].after,/==中文==/);assert.ok(captions.proposals[0].after.includes('\n'));assert.equal(ok(await e.api('GET',base+'/timeline')).rev,before.rev,'reports are read only');
 const apply=ok(await e.api('POST',base+'/delivery/apply',{ops:[...captions.proposals,...quality.proposals].flatMap(p=>p.ops),baseRev:before.rev,conflictPolicy:'reject'}));assert.ok(apply.inverse.length);assert.equal((await e.api('POST',base+'/export',{baseRev:before.rev,scale:.5,quality:'draft'})).status,409,'stale export rejected');
 assert.equal((await e.api('POST',base+'/delivery/apply',{ops:captions.proposals.flatMap(p=>p.ops),baseRev:before.rev})).status,409,'stale suggestions rejected');
 const current=ok(await e.api('GET',base+'/timeline'));assert.ok(current.timeline.audioTracks[0].clips[0].fadeIn>0);const report=ok(await e.api('GET',base+'/delivery/preflight'));assert.equal(report.canExport,true);
 const job=ok(await e.api('POST',base+'/export',{baseRev:current.rev,scale:.5,quality:'draft'}));let status;
 for(let i=0;i<120;i++){status=ok(await e.api('GET','/api/export/'+job.jobId));if(['done','error','cancelled'].includes(status.status))break;await new Promise(r=>setTimeout(r,1000));}assert.equal(status.status,'done',JSON.stringify(status));assert.equal(status.rev,current.rev);assert.ok(status.preflight.canExport);
 const exported=path.join(tmp,'sample.mp4');fs.writeFileSync(exported,Buffer.from(await(await fetch(e.base+'/api/export/'+job.jobId+'/download')).arrayBuffer()));const meta=await probe(exported);assert.equal(meta.width,320);assert.equal(meta.height,180);assert.equal(meta.hasAudio,true);
 const frame=ok(await e.api('POST',base+'/frame',{seconds:.5,format:'png',maxSize:640}));fs.writeFileSync('docs/screenshots/50-delivery-quality.png',Buffer.from(frame.imageBase64,'base64'));
 const broken=ok(await e.api('GET',base+'/timeline')).timeline;broken.overlays.find(o=>o.id==='pic').image.src='missing.png';ok(await e.api('PUT',base+'/timeline',{timeline:broken}));assert.equal(ok(await e.api('GET',base+'/delivery/preflight')).canExport,false);assert.equal((await e.api('POST',base+'/export',{})).status,400);
 console.log('PASS source LUFS/true-peak measurement, image white-background and resolution checks, read-only subtitle preview, versioned apply, stale/missing-asset export rejection, actual low-resolution MP4 with audio');
}finally{await e.stop();fs.rmSync(tmp,{recursive:true,force:true});}
