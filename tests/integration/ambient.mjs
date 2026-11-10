import fs from 'node:fs';
import http from 'node:http';
import {parseTimeline} from '../../packages/engine/dist/schema.js';
import {renderFrames,renderVideo,closeRenderer} from '../../packages/engine/dist/render.js';
const root=new URL('../..',import.meta.url).pathname.replace(/\/$/,'');
const sr=8000,n=sr*4,b=Buffer.alloc(44+n*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(sr,24);b.writeUInt32LE(sr*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(n*2,40);
const values=Array.from({length:400},(_,i)=>Math.exp(-(i%50)/10)*.8);for(let i=0;i<n;i++)b.writeInt16LE(Math.round(Math.sin(i/sr*220*Math.PI*2)*values[Math.floor(i/80)]*20000),44+i*2);
fs.mkdirSync(root+'/examples/assets',{recursive:true});fs.writeFileSync(root+'/examples/assets/ambient-pulse.wav',b);
const box=(id,x,y,w,h,extra)=>({id,kind:'shape',text:'',x,y,w,h,startSeconds:0,endSeconds:4,shape:{type:'rect',fill:'#162239',radius:20},...extra});
const text=(id,value,y,size=24)=>({id,kind:'text',text:value,x:.5,y,w:.9,h:.08,color:'#e2e8f0',fontSize:size,align:'center',startSeconds:0,endSeconds:4,shadow:false});
const audioReactive={source:'music',src:'ambient-pulse.wav',rate:100,values,channel:'scale',amount:.2,smoothing:.04};
const timeline=parseTimeline({meta:{width:960,height:540,fps:30,background:'#081020'},audioTracks:[{id:'audio',clips:[{id:'music',src:'ambient-pulse.wav',duration:4}]}],overlays:[text('title','PARTICLES + AUDIO REACTIVE',.1,32),text('sub','D剪 2.8.0 · Deterministic motion',.18,16),box('snow',.18,.47,.28,.4,{particles:{preset:'snow',seed:12,count:90,size:5}}),box('confetti',.5,.47,.28,.4,{particles:{preset:'confetti',seed:34,count:80,size:7}}),box('rain',.82,.47,.28,.4,{particles:{preset:'rain',seed:5,count:80,size:3,speed:2}}),box('wave',.5,.83,.85,.15,{color:'#38bdf8',audioReactive:{...audioReactive,waveform:true}}),text('labels','SNOW                         CONFETTI                         RAIN',.7,18)]});
fs.writeFileSync(root+'/examples/ambient-audio.json',JSON.stringify(timeline,null,2)+'\n');
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','audio/wav');res.end(b)});await new Promise(r=>server.listen(0,'127.0.0.1',r));const assetBase=`http://127.0.0.1:${server.address().port}/`;
try{const a=await renderFrames({timeline,seconds:[1.1],format:'png',maxSize:960,assetBase});fs.writeFileSync(root+'/docs/screenshots/38-ambient-audio.png',a.buffer);const again=await renderFrames({timeline,seconds:[1.1],format:'png',maxSize:960,assetBase});if(!a.buffer.equals(again.buffer))throw Error('Seek determinism failed');await renderVideo({timeline,outFile:root+'/dist/ambient-audio.mp4',assetsDir:root+'/examples/assets',concurrency:2});console.log('PASS deterministic render and audio demo export');}finally{await closeRenderer();server.close();}
