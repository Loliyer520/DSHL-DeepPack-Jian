import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {renderFrames,renderVideo,closeRenderer,withStaticAssets} from '../../packages/engine/dist/render.js';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dj-video-elements-'));
const W=160,H=120,FPS=30;
const bytes=Buffer.alloc(W*H*3*120);
for(let f=0;f<120;f++)for(let i=f*W*H*3;i<(f+1)*W*H*3;i+=3){bytes[i]=f*2;bytes[i+1]=255-f*2;bytes[i+2]=20;}
execFileSync('ffmpeg',['-v','error','-f','rawvideo','-pix_fmt','rgb24','-s',`${W}x${H}`,'-r',String(FPS),'-i','pipe:0','-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=4','-c:v','libx264','-preset','veryfast','-crf','10','-pix_fmt','yuv420p','-g','60','-bf','3','-c:a','aac','-shortest','-movflags','+faststart',path.join(dir,'frames.mp4')],{input:bytes,maxBuffer:16e6});
const base={id:'v',kind:'video',text:'',x:.5,y:.5,w:1,h:1,startSeconds:0,endSeconds:1.5,video:{src:'frames.mp4',inPoint:.5,speed:1.5,muted:false,volume:.5,fit:'fill'}};
const timeline=(overlays,fps=30)=>({meta:{width:W,height:H,fps,background:'#000'},overlays});
const decode=file=>execFileSync('ffmpeg',['-v','error','-i',file,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1']);
function expect(rgb,seconds,why){const frame=Math.min(119,Math.floor(seconds*FPS+1e-4)),i=(60*W+30)*3,actual=[...rgb.subarray(i,i+3)],expected=[frame*2,255-frame*2,20];assert.ok(actual.every((n,j)=>Math.abs(n-expected[j])<8),`${why}: ${actual}, expected ${expected} at ${seconds}s`);}
try{
 await withStaticAssets(dir,async(assetBase,fontsBase,mathBase)=>{
  async function frame(t,time,label){const r=await renderFrames({timeline:t,seconds:[time],assetBase,fontsBase,mathBase,maxSize:W,format:'png'});const name=path.join(dir,'still.png');fs.writeFileSync(name,r.buffer);return decode(name);}
  const t=timeline([base,{id:'label',kind:'shape',text:'',x:.9,y:.1,w:.15,h:.15,shape:{type:'rect',fill:'#fff'},startSeconds:0,endSeconds:2}]);
  for(const seconds of [1,.1,.75,0,1.2,.25])expect(await frame(t,seconds),.5+seconds*1.5,'random seek element');
  const tracks={meta:t.meta,overlays:[],videoTracks:[{id:'main',clips:[{id:'clip',type:'video',src:'frames.mp4',inPoint:.5,speed:1.5,volume:0,clipDuration:1.5}]}]};
  for(const seconds of [.1,.7])expect(await frame(tracks,seconds),.5+seconds*1.5,'main track deterministic decoder');
  const frozen=timeline([{...base,video:{...base.video,freeze:true}}]);expect(await frame(frozen,1),.5,'freeze');
  const child=timeline([{...base,video:{...base.video,speed:1}}],24);
  const nested=timeline([{id:'comp',kind:'shape',text:'',x:.5,y:.5,w:1,h:1,startSeconds:0,endSeconds:1,composition:{name:'nested',timeline:JSON.stringify(child),inPoint:.2,speed:1.5,volume:.5}}]);
  for(const seconds of [0,.4,.2])expect(await frame(nested,seconds),.5+.2+seconds*1.5,'nested differing fps and speed');
  const nestedOut=path.join(dir,'nested.mp4');
  await renderVideo({timeline:nested,outFile:nestedOut,assetBase,fontsBase,mathBase,gpuEncoder:'off'});
  const nestedPng=path.join(dir,'nested.png');execFileSync('ffmpeg',['-v','error','-ss','0.4','-i',nestedOut,'-frames:v','1','-y',nestedPng]);expect(decode(nestedPng),1.3,'nested exported video');
  const out=path.join(dir,'export.mp4');
  await renderVideo({timeline:t,outFile:out,assetBase,fontsBase,mathBase,gpuEncoder:'off'});
  for(const seconds of [.2,.6,1]){const png=path.join(dir,'export.png');execFileSync('ffmpeg',['-v','error','-ss',String(seconds),'-i',out,'-frames:v','1','-y',png]);expect(decode(png),.5+seconds*1.5,'exported video');}
  const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-of','json',out],{encoding:'utf8'}));assert.ok(probe.streams.some(s=>s.codec_type==='audio'),'video element original sound exported');
  const pcm=execFileSync('ffmpeg',['-v','error','-i',out,'-vn','-f','s16le','-ac','1','-ar','16000','pipe:1']);let power=0;for(let i=0;i<pcm.length;i+=2)power+=pcm.readInt16LE(i)**2;assert.ok(Math.sqrt(power/(pcm.length/2))>100,'exported element audio is audible, not only an empty stream');
  const mixed=await frame(t,.5);assert.ok(mixed[(12*W+144)*3]>240,'shape can cover video in same element stack');
 });
 console.log('PASS video pixels/export: random seek, speed, freeze, nested 24/30fps, z-order, H264 B-frames and original audio');
}finally{await closeRenderer();fs.rmSync(dir,{recursive:true,force:true});}
