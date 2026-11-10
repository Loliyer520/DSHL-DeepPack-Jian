import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseTimeline,validateTimeline} from '../../packages/engine/dist/schema.js';
import {applyOps} from '../../packages/engine/dist/ops.js';
import {renderFrames,renderVideo,closeRenderer} from '../../packages/engine/dist/render.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
let timeline=parseTimeline({meta:{width:960,height:640,fps:30,background:'#09111f'}});
const box=(id,x,y,w,h,extra={})=>({op:'addOverlay',id,kind:'shape',shape:{type:'rect',fill:'#172338',radius:16},x,y,w,h,startSeconds:0,endSeconds:6,...extra});
const text=(id,value,x,y,w,size=20,extra={})=>({op:'addOverlay',id,kind:'text',text:value,x,y,w,h:.06,fontSize:size,color:'#cbd5e1',shadow:false,align:'center',startSeconds:0,endSeconds:6,...extra});
function apply(ops){const result=applyOps(timeline,ops);assert.ok(result.receipts.every(r=>r.status!=='rejected'),JSON.stringify(result.receipts));timeline=result.timeline;}
apply([
 text('title','D剪 STUDIO',.5,.075,.9,34,{fontWeight:800}),text('subtitle','COMPONENTS  /  THEME  /  CHOREOGRAPHY  /  3D',.5,.135,.9,14,{color:'#64748b'}),
 box('sceneBackground',.27,.5,.46,.62),box('scene',.27,.5,.46,.62,{scene3d:{camera:{yaw:32,pitch:22,distance:5.5,orbit:14,target:[.35,0,0]},light:{ambient:.3,direction:[-2,4,3],intensity:.8},objects:[{id:'cube',geometry:'cube',color:'#38bdf8',scale:1.2,position:[-.5,0,0],spin:[12,32,0]},{id:'sphere',geometry:'sphere',color:'#fb7185',scale:1.4,position:[1,.1,.1]},{id:'floor',geometry:'plane',color:'#253751',position:[0,-.8,0]}]}}),
 text('sceneLabel','REAL GEOMETRY · CAMERA · LIGHT',.27,.83,.47,13,{color:'#64748b'}),
 box('cardBg',.745,.32,.43,.16,{group:'card',styleRole:'card'}),
 text('cardTitle','01   REUSABLE COMPONENT',.745,.29,.38,18,{group:'card',styleRole:'heading'}),
 text('cardBody','One definition, independent parameters',.745,.35,.38,13,{group:'card',styleRole:'body'}),
 {op:'saveComponent',name:'Feature card',group:'card'},
 {op:'instantiateComponent',name:'Feature card',id:'card2',startSeconds:0,values:{cardTitle:{text:'02   LINKED ANIMATION'},cardBody:{text:'Start after the previous card'}}},
 {op:'instantiateComponent',name:'Feature card',id:'card3',startSeconds:0,values:{cardTitle:{text:'03   SHARED THEME'},cardBody:{text:'Change typography and color together'}}},
]);
apply([
 {op:'updateGroup',group:'card',state:{cues:[{id:'first',preset:'fadeIn',start:.3,duration:.7}]}},
 {op:'updateGroup',group:'card2',state:{...timeline.groups.card2,animations:{y:[{t:0,v:.21,e:'hold'}]},cues:[{id:'second',preset:'fadeIn',start:0,duration:.7,after:'first',offset:.15}]}},
 {op:'updateGroup',group:'card3',state:{...timeline.groups.card3,animations:{y:[{t:0,v:.42,e:'hold'}]},cues:[{id:'third',preset:'fadeIn',start:0,duration:.7,after:'second',offset:.15}]}},
 {op:'setTheme',theme:{name:'Studio Demo',background:'#09111f',gap:16,roles:{heading:{fontSize:18,color:'#e2e8f0'},body:{fontSize:13,color:'#94a3b8'},card:{fill:'#172338',radius:16,shadow:{color:'#000000',blur:18,y:5,opacity:.25}}}}},
 text('footer','ASSET REPLACEMENT  ·  RESPONSIVE REFLOW  ·  PREFLIGHT CHECKS',.5,.94,.95,13,{color:'#64748b'}),
]);
assert.deepEqual(validateTimeline(timeline),[]);
fs.writeFileSync(path.join(root,'examples/studio-toolkit.json'),JSON.stringify(timeline,null,2)+'\n');
try{
 const options={timeline,seconds:[3],format:'png',maxSize:960,assetBase:'http://127.0.0.1:9130/'};
 const frame=await renderFrames(options),again=await renderFrames(options);assert.ok(frame.buffer.equals(again.buffer),'Seeking to same time must give identical pixels');
 fs.writeFileSync(path.join(root,'docs/screenshots/39-studio-toolkit.png'),frame.buffer);
 const different=await renderFrames({...options,seconds:[1]});assert.ok(!frame.buffer.equals(different.buffer),'Animation must move with time');
 await renderVideo({timeline,outFile:path.join(root,'dist/studio-toolkit.mp4'),assetsDir:path.join(root,'examples/assets'),concurrency:2});
 console.log('PASS studio scene + components + scheduled animation deterministic render and export');
}finally{await closeRenderer();}
