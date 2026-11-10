import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {renderFrames,closeRenderer} from '../../packages/engine/dist/render.js';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dj-surface-'));
const rgba=Buffer.alloc(16*16*4);for(let i=0;i<256;i++){rgba[i*4]=rgba[i*4+1]=rgba[i*4+2]=255;rgba[i*4+3]=i%16<8?255:0;}
execFileSync('ffmpeg',['-v','error','-f','rawvideo','-pixel_format','rgba','-video_size','16x16','-i','pipe:0','-frames:v','1',path.join(dir,'source.png')],{input:rgba});
const srv=http.createServer((q,r)=>{r.setHeader('Content-Type','image/png');r.setHeader('Access-Control-Allow-Origin','*');r.end(fs.readFileSync(path.join(dir,'source.png')));});await new Promise(r=>srv.listen(0,'127.0.0.1',r));
const assetBase=`http://127.0.0.1:${srv.address().port}/`;
const box=(id,x=.5,fill='#ff0000',extra={})=>({id,kind:'shape',text:'',x,y:.5,w:.8,h:.8,startSeconds:0,endSeconds:3,shape:{type:'rect',fill},...extra});
async function px(overlays,seconds=1,videoTracks){
 const f=await renderFrames({timeline:{meta:{width:320,height:240,fps:30,background:'#000000'},overlays,...(videoTracks?{videoTracks}:{})},seconds:[seconds],format:'png',maxSize:320,assetBase});
 const name=path.join(dir,'frame.png');fs.writeFileSync(name,f.buffer);const rgb=execFileSync('ffmpeg',['-v','error','-i',name,'-f','rawvideo','-pix_fmt','rgb24','pipe:1']);return(x,y=120)=>[...rgb.subarray((y*320+x)*3,(y*320+x)*3+3)];
}
try{
 const source=box('matte',.3,'#000000',{w:.25,h:.5,animations:{x:[{t:0,v:0},{t:2,v:.4}]}});
 let p=await px([source,box('target',.5,'#ff0000',{trackMatte:{source:'matte'}})],0);assert.ok(p(96)[0]>240);assert.equal(p(224)[0],0);
 p=await px([source,box('target',.5,'#ff0000',{trackMatte:{source:'matte'}})],2);assert.ok(p(224)[0]>240);assert.equal(p(96)[0],0);
 p=await px([source,box('target',.5,'#ff0000',{trackMatte:{source:'matte',mode:'luma'}})],0);assert.equal(p(96)[0],0,'black luminance hides even opaque source');
 p=await px([source,box('target',.5,'#ff0000',{trackMatte:{source:'matte',invert:true}})],0);assert.equal(p(96)[0],0);assert.ok(p(224)[0]>240);
 p=await px([{...source,endSeconds:1},box('target',.5,'#ff0000',{trackMatte:{source:'matte',invert:true}})],2.5);assert.ok(p(96)[0]>240,'inverse of inactive source reveals target');
 p=await px([{...source,endSeconds:1},box('target',.5,'#ff0000',{trackMatte:{source:'matte'}})],2.5);assert.equal(p(96)[0],0,'inactive alpha source hides target');
 const image={...box('image'),kind:'image',shape:undefined,w:1,h:1,image:{src:'source.png',fit:'fill'}};
 p=await px([image,box('target',.5,'#00ff00',{trackMatte:{source:'image'}})]);assert.ok(p(80)[1]>240);assert.equal(p(240)[1],0,'image alpha masks right half');
 p=await px([box('matte',.25,'#fff',{w:.3,h:1})],1,[{id:'v1',clips:[{id:'c',type:'image',src:'source.png',inPoint:0,clipDuration:3,trackMatte:{source:'matte'}}]}]);assert.ok(p(80)[0]>240);assert.equal(p(160)[0],0,'video clip uses canvas-space matte');
 const stops=color=>[{offset:0,color},{offset:1,color}];const fill={type:'linear',stops:stops('#f00'),keyframes:[{t:0,stops:stops('#f00')},{t:2,stops:stops('#00f')}]};
 p=await px([box('gradient',.5,fill)],1);assert.ok(p(160)[0]>110&&p(160)[0]<145&&p(160)[2]>110&&p(160)[2]<145,'gradient colors interpolate');
 p=await px([box('shine',.5,'#222222',{sweep:{angle:0,width:.3,opacity:1,softness:.5},animations:{sweepProgress:[{t:0,v:0},{t:2,v:1}]}})],1);console.log('sweep pixels',p(160),p(80));assert.ok(p(160)[0]>240,'sweep illuminates center');assert.ok(p(80)[0]<40,'sweep leaves rest unchanged');assert.equal(p(10)[0],0,'sweep clips to source contour');
 console.log('PASS pixels: animated alpha/luma/inverse mattes, image alpha, clip matte, gradient color interpolation, contour-clipped sweep');
}finally{await closeRenderer();await new Promise(r=>srv.close(r));fs.rmSync(dir,{recursive:true,force:true});}
