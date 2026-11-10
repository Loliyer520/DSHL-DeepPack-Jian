import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {renderFrames,closeRenderer} from '../../packages/engine/dist/render.js';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'djian-polish-'));
const box=(id,x,y,w,h,fill,extra={})=>({id,kind:'shape',text:'',x,y,w,h,shape:{type:'rect',fill},startSeconds:0,endSeconds:3,...extra});
async function frame(overlays,seconds=1,background='#000'){
 const result=await renderFrames({timeline:{meta:{width:320,height:240,fps:30,background},overlays},seconds:[seconds],format:'png',maxSize:320,assetBase:'http://127.0.0.1:1/'});
 const file=path.join(dir,'frame.png');fs.writeFileSync(file,result.buffer);
 const data=execFileSync('ffmpeg',['-v','error','-i',file,'-f','rawvideo','-pix_fmt','rgb24','pipe:1']);
 return(x,y)=>[...data.subarray((y*320+x)*3,(y*320+x)*3+3)];
}
try{
 let px=await frame([box('inset',.5,.5,.5,.5,'#fff',{shadow:{color:'#000',opacity:1,blur:4,x:10,y:0,inset:true}})],1,'#ffffff');
 assert.ok(px(83,120)[0]<100,'inner shadow darkens inside left edge');assert.ok(px(160,120)[0]>250,'inner shadow keeps center clear');assert.ok(px(75,120)[0]>250,'inner shadow never escapes contour');
 const gradient={type:'linear',angle:0,stops:[{offset:0,color:'#ff0000'},{offset:1,color:'#0000ff'}]};
 px=await frame([box('stroke',.5,.5,.5,.5,'#000',{shape:{type:'rect',fill:'#000',stroke:{color:gradient,width:8}}})]);
 assert.ok(px(84,120)[0]>220&&px(84,120)[2]<30,'gradient begins red');assert.ok(px(235,120)[2]>220&&px(235,120)[0]<30,'gradient ends blue');assert.equal(px(160,120)[0],0,'stroke does not fill the center');
 const stripes=Array.from({length:40},(_,i)=>box('s'+i,(i*8+4)/320,.5,8/320,1,i%2?'#fff':'#000'));
 px=await frame([...stripes,box('glass',.5,.5,.5,.5,'rgba(255,255,255,0)',{glass:{blur:9,opacity:0,borderOpacity:0,radius:0},shadow:{color:'#000',blur:8,opacity:.2,y:5}})]);
 console.log('glass pixels',px(160,120),px(168,120),px(24,120));
 assert.ok(Math.abs(px(160,120)[0]-px(168,120)[0])<35,'glass blurs background stripes');assert.ok(px(160,120)[0]>60&&px(160,120)[0]<200,'glass samples background');assert.ok(px(24,120)[0]>240,'outside glass keeps original sharp image');
 const shared=[box('a',.2,.5,.2,.2,'#ff0000',{endSeconds:1,shared:{key:'card'}}),box('b',.8,.5,.2,.2,'#ff0000',{startSeconds:1,shared:{key:'card',duration:.6,ease:'linear'}})];
 px=await frame(shared,1.3);assert.ok(px(160,120)[0]>250,'shared element travels through midpoint');assert.equal(px(256,120)[0],0,'normal destination hidden during transition');
 px=await frame(shared,1.7);assert.ok(px(256,120)[0]>250,'normal destination resumes after shared transition');
 console.log('PASS pixels: inset shadows, gradient stroke, real backdrop blur, shared-element continuity');
}finally{await closeRenderer();fs.rmSync(dir,{recursive:true,force:true});}
