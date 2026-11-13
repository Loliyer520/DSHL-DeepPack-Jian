import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {renderFrames,closeRenderer} from '../../packages/engine/dist/render.js';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'dj-text-gradient-'));
const text={id:'text',kind:'text',text:'MMMM',fontSize:94,fontWeight:900,align:'center',x:.5,y:.5,w:.95,h:.7,padding:0,shadow:false,startSeconds:0,endSeconds:3};
const stops=[{offset:0,color:'#ff0000'},{offset:.5,color:'#00ff00'},{offset:1,color:'#0000ff'}];
const fill={type:'linear',angle:0,stops};
async function pixels(overlays,seconds=1){
 const r=await renderFrames({timeline:{meta:{width:320,height:240,fps:30,background:'#000000'},overlays},seconds:[seconds],format:'png',maxSize:320,assetBase:'http://127.0.0.1:1/'});
 const name=path.join(tmp,'frame.png');fs.writeFileSync(name,r.buffer);
 return execFileSync('ffmpeg',['-v','error','-i',name,'-f','rawvideo','-pix_fmt','rgb24','pipe:1']);
}
function count(rgb,predicate,x0=0,x1=320){let n=0;for(let y=0;y<240;y++)for(let x=x0;x<x1;x++){const i=(y*320+x)*3;if(predicate(rgb[i],rgb[i+1],rgb[i+2]))n++;}return n;}
try{
 let rgb=await pixels([{...text,color:'transparent',textFill:fill}]);
 for(let c=0;c<3;c++)assert.ok(count(rgb,(r,g,b)=>[r,g,b][c]>100&&[r,g,b][c]>[r,g,b][(c+1)%3]*1.3&&[r,g,b][c]>[r,g,b][(c+2)%3]*1.3)>100,'text shows color '+c);
 rgb=await pixels([{...text,color:'#ffffff',stroke:{color:'#000',width:8},textStrokeFill:fill}]);
 assert.ok(count(rgb,(r,g,b)=>r>240&&g>240&&b>240)>1000,'outline retains white glyph fill');
 assert.ok(count(rgb,(r,g,b)=>r>100&&r>g*1.5&&r>b*1.5)>40,'gradient outline has red pixels');
 assert.ok(count(rgb,(r,g,b)=>b>100&&b>g*1.5&&b>r*1.5)>40,'gradient outline has blue pixels');
 rgb=await pixels([{...text,textFill:fill,stroke:{color:'#ffffff',width:6}}]);
 assert.ok(count(rgb,(r,g,b)=>r>240&&g>240&&b>240)>100,'solid outline survives gradient glyph fill');
 const transparent={type:'linear',stops:[{offset:0,color:'rgba(255,0,0,0)'},{offset:1,color:'rgba(255,0,0,0)'}]};
 rgb=await pixels([{...text,textFill:transparent}]);
 assert.equal(count(rgb,(r,g,b)=>r+g+b>0),0,'transparent color stops hide glyph fill');
 rgb=await pixels([{...text,textFill:transparent,stroke:{color:'#ffffff',width:6}}]);
 assert.ok(count(rgb,(r,g,b)=>r>240&&g>240&&b>240)>100,'transparent fill preserves independent outline');
 rgb=await pixels([{...text,textFill:fill,textEffect:{type:'fadeUp',by:'char',interval:.25,duration:.5}}],0);
 assert.equal(count(rgb,(r,g,b)=>r+g+b>0),0,'gradient respects hidden animated glyphs');
 const animated={...fill,keyframes:[{t:0,stops:stops.map(s=>({...s,color:'#ff0000'}))},{t:2,stops:stops.map(s=>({...s,color:'#0000ff'}))}]};
 rgb=await pixels([{...text,textFill:animated}]);
 assert.ok(count(rgb,(r,g,b)=>r>100&&b>100&&g<5)>1000,'text keyframe interpolation produces purple');
 rgb=await pixels([{...text,kind:'icon',text:'',w:.7,h:.8,icon:{name:'star',fill,strokeFill:fill}}]);
 for(let c=0;c<3;c++)assert.ok(count(rgb,(r,g,b)=>[r,g,b][c]>100&&[r,g,b][c]>[r,g,b][(c+1)%3]*1.3&&[r,g,b][c]>[r,g,b][(c+2)%3]*1.3)>30,'icon shows color '+c);
 const half={type:'linear',stops:[{offset:0,color:'#fff'},{offset:.49,color:'#fff'},{offset:.51,color:'#000'},{offset:1,color:'#000'}]};
 rgb=await pixels([{...text,textFill:half},{id:'target',kind:'shape',shape:{type:'rect',fill:'#f00'},text:'',w:1,h:1,x:.5,y:.5,startSeconds:0,endSeconds:3,trackMatte:{source:'text',mode:'luma'}}]);
 assert.ok(count(rgb,(r,g,b)=>r>100&&g<5&&b<5,0,150)>200,'luma matte uses bright glyph half');
 assert.equal(count(rgb,(r,g,b)=>r>20,175,320),0,'luma matte excludes dark glyph half');
 console.log('PASS pixels: multistop text and icon, gradient/solid outlines, interpolated color, text luma matte');
}finally{await closeRenderer();fs.rmSync(tmp,{recursive:true,force:true});}
