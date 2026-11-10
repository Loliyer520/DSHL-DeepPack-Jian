import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {renderFrames,closeRenderer} from '../../packages/engine/dist/render.js';
import {parseTimeline} from '../../packages/engine/dist/schema.js';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dj-layout-blur-'));
const box=(id,extra={})=>({id,kind:'shape',text:'',x:.5,y:.5,w:.1,h:.2,startSeconds:0,endSeconds:2,shape:{type:'rect',fill:'#ffffff'},...extra});
async function frame(overlays,seconds,groups){
 const result=await renderFrames({timeline:{meta:{width:320,height:240,fps:30,background:'#000'},overlays,groups},seconds:[seconds],format:'png',maxSize:320,assetBase:'http://127.0.0.1:1/'});
 const file=path.join(dir,'frame.png');fs.writeFileSync(file,result.buffer);
 const rgb=execFileSync('ffmpeg',['-v','error','-i',file,'-f','rawvideo','-pix_fmt','rgb24','pipe:1']);
 return {px:(x,y=120)=>[...rgb.subarray((y*320+x)*3,(y*320+x)*3+3)],row:(y=120)=>Array.from({length:320},(_,x)=>rgb[(y*320+x)*3])};
}
try{
 let f=await frame([box('static',{motionBlur:{samples:8,shutterAngle:360},opacity:.5,shape:{type:'rect',fill:'#808080'}})],1);
 assert.ok(Math.abs(f.px(160)[0]-64)<4,'temporal averaging preserves stationary opacity');
 const moving=box('moving',{x:.1,w:.05,motionBlur:{samples:8,shutterAngle:360},animations:{x:[{t:0,v:0},{t:2/30,v:.6}]}});
 f=await frame([moving],1/30);const blurred=f.row().filter(v=>v>8).length;console.log('moving blur pixels',blurred,f.px(48),f.px(128));assert.ok(blurred>60,'moving object leaves a time-sampled trail');assert.ok(f.px(48)[0]>10,'earlier position visible');assert.ok(f.px(200)[0]<5,'no blur outside motion');
 f=await frame([{...moving,motionBlur:undefined}],1/30);assert.ok(f.row().filter(v=>v>8).length<=18,'disabled blur keeps sharp shape');
 f=await frame([box('grouped',{group:'g',x:.1,w:.05})],1/30,{g:{motionBlur:{samples:8,shutterAngle:360},animations:{x:[{t:0,v:0},{t:2/30,v:.6}]}}});assert.ok(f.row().filter(v=>v>8).length>60,'group transform sampled at each shutter time');
 const future=box('future',{group:'future',startSeconds:1,endSeconds:2}),later=box('later',{x:.9,w:.05,startSeconds:3,endSeconds:4});
 f=await frame([future,later],.5,{future:{motionBlur:{samples:4}}});assert.equal(f.px(160)[0],0,'blur group stays hidden before start');
 f=await frame([future,later],2.5,{future:{motionBlur:{samples:4}}});assert.equal(f.px(160)[0],0,'blur group stays hidden after end');
 const overlays=[box('a',{group:'layout',shape:{type:'rect',fill:'#ff0000'}}),box('b',{group:'layout',shape:{type:'rect',fill:'#0000ff'}})];
 const groups={layout:{layout:{direction:'row',x:.5,y:.5,gap:32,padding:16}}};
 const t=parseTimeline({meta:{width:320,height:240,fps:30},overlays,groups});
 f=await frame(overlays,1,groups);assert.ok(f.px(Math.round(t.overlays[0].x*320))[0]>250);assert.ok(f.px(Math.round(t.overlays[1].x*320))[2]>250);assert.equal(f.px(160)[0],0,'layout gap remains empty');
 console.log('PASS pixels: stationary brightness, temporal trails, sharp toggle, group sampling, materialised layout');
}finally{await closeRenderer();fs.rmSync(dir,{recursive:true,force:true});}
