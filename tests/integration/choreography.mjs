import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {renderFrames,closeRenderer} from '../../packages/engine/dist/render.js';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'djian-choreo-'));
const box=(id,x,y,w=.1,h=.1,color='#fff',extra={})=>({id,kind:'shape',text:'',x,y,w,h,shape:{type:'rect',fill:color},startSeconds:0,endSeconds:2,...extra});
async function frame(overlays,seconds,groups){
 const result=await renderFrames({timeline:{meta:{width:320,height:240,fps:30,background:'#000'},overlays,groups},seconds:[seconds],format:'png',maxSize:320,assetBase:'http://127.0.0.1:1/'});
 const file=path.join(dir,'frame.png');fs.writeFileSync(file,result.buffer);
 const bytes=execFileSync('ffmpeg',['-v','error','-i',file,'-f','rawvideo','-pix_fmt','rgb24','pipe:1']);
 return(x,y)=>[...bytes.subarray((y*320+x)*3,(y*320+x)*3+3)];
}
try{
 const masked=box('mask',.5,.5,.75,.75,'#fff',{mask:{type:'ellipse'},animations:{maskW:[{t:0,v:0},{t:1,v:1}],maskH:[{t:0,v:0},{t:1,v:1}]}});
 let px=await frame([masked],0);assert.equal(px(160,120)[0],0,'zero-size mask hides source');
 px=await frame([masked],1);assert.ok(px(160,120)[0]>250,'mask opens on keyframes');assert.equal(px(50,40)[0],0,'ellipse still clips corners');
 const parent=box('parent',.2,.5,.1,.1,'#00f',{animations:{x:[{t:0,v:0},{t:2,v:.4}]}}),child=box('child',.2,.7,.06,.06,'#f00',{follow:{target:'parent'}});
 px=await frame([parent,child],1);assert.ok(px(128,168)[0]>250,'child follows animated parent offset');assert.equal(px(64,168)[0],0,'child leaves original position');
 const line=box('line',.5,.5,.5,.04,'#fff',{shape:{type:'arrow',fill:'#fff'},connector:{from:'parent',to:'target'}});
 px=await frame([parent,box('target',.8,.5,.1,.1,'#00f'),line],1);assert.ok(px(190,120)[0]>200,'connector follows current endpoint positions');
 const cards=[box('a',.25,.5),box('b',.75,.5)].map(o=>({...o,group:'g'}));
 px=await frame(cards,.2,{g:{stagger:{interval:.6,preset:'fadeIn',duration:.3}}});assert.ok(px(80,120)[0]>100);assert.equal(px(240,120)[0],0,'stagger hides late member');
 px=await frame(cards,1.2,{g:{stagger:{interval:.6,preset:'fadeIn',duration:.3}}});assert.ok(px(240,120)[0]>250,'late member eventually appears');
 const spring=box('spring',.3,.5,.1,.1,'#fff',{animations:{x:[{t:0,v:0,e:{type:'spring',stiffness:170,damping:10}},{t:1,v:.2}]}});
 px=await frame([spring],.2666666667);assert.ok(px(170,120)[0]>200,'spring overshoots the target position');
 console.log('PASS pixels: animated mask, parent following, connector, stagger timing, spring overshoot');
}finally{await closeRenderer();fs.rmSync(dir,{recursive:true,force:true});}
