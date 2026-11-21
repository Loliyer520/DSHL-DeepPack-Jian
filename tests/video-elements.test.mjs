import test from 'node:test';
import assert from 'node:assert/strict';
import {parseTimeline,validateTimeline} from '../packages/engine/dist/schema.js';
import {applyOps} from '../packages/engine/dist/ops.js';
import {referencedAssets,nestedAudio,precompose} from '../packages/engine/dist/compositions.js';
import {checkTimeline} from '../packages/engine/dist/preflight.js';
import {taskContext} from '../packages/engine/dist/aiWorkflow.js';
import {diffTimelines,timelinesEqual} from '../packages/engine/dist/diff.js';
const blank=()=>parseTimeline({meta:{width:320,height:240,fps:30}});
const add=(id='v',video={})=>({op:'addOverlay',id,kind:'video',video:{src:'a.mp4',inPoint:.5,speed:1.5,muted:false,volume:.6,...video},startSeconds:1,endSeconds:3,w:.5,h:.5});
const edit=(t,ops)=>applyOps(t,ops).timeline;
test('video elements share z order with shapes and text, serialize, discover assets and undo',()=>{
 const t=edit(blank(),[add(),{op:'addOverlay',id:'label',kind:'text',text:'On top',startSeconds:1,endSeconds:3}]);
 assert.equal(t.overlays[0].kind,'video');assert.equal(t.overlays[1].kind,'text');
 assert.deepEqual(validateTimeline(t),[]);assert.deepEqual(parseTimeline(JSON.stringify(t)),t);
 assert.deepEqual(referencedAssets(t),['a.mp4']);
 const next=edit(t,[{op:'updateOverlay',id:'v',patch:{video:{speed:2,muted:true}}}]);
 assert.equal(next.overlays[0].video.src,'a.mp4');
 const restored=applyOps(next,diffTimelines(next,t),{actor:'system'}).timeline;assert.ok(timelinesEqual(restored,t));
 const ctx=taskContext(t,{ids:['v']},'motion');assert.match(JSON.stringify(ctx),/a.mp4/);
});
test('split advances source inPoint and preserves speed and input immutability; freeze retains source point',()=>{
 for(const freeze of [false,true]){
  const t=edit(blank(),[add('v',{freeze})]),original=JSON.stringify(t);
  const split=edit(t,[{op:'splitOverlay',id:'v',atSeconds:2,newId:'right'}]);
  assert.equal(split.overlays[1].video.inPoint,freeze?.5:2);
  assert.equal(JSON.stringify(t),original);
 }
});
test('video element audio composes inPoint, speed, trim and nested gain once',()=>{
 const t=edit(blank(),[add()]);const sound=nestedAudio(t)[0];
 assert.equal(sound.inPoint,.5);assert.equal(sound.speed,1.5);assert.equal(sound.gain(0),.6);
 const outer=blank(),comp=precompose(t,['v'],'Nested');
 outer.overlays=[{id:'c',text:'',position:'bottom',fontSize:48,color:'#fff',...comp.overlay,composition:{...comp.overlay.composition,inPoint:.5,speed:2,volume:.5}}];
 const nested=nestedAudio(outer)[0];assert.equal(nested.speed,3);assert.equal(nested.inPoint,1.25);assert.equal(nested.gain(0),.3);
 assert.equal(nestedAudio(edit(t,[{op:'updateOverlay',id:'v',patch:{video:{muted:true}}}])).length,0);
});
test('preflight rejects source overrun, missing video and invalid video spec',()=>{
 const t=edit(blank(),[add()]);assert.ok(checkTimeline(t,[{name:'a.mp4',duration:2}]).some(i=>i.code==='source-range'));
 assert.ok(checkTimeline(t,[]).some(i=>i.severity==='error'));
 const r=applyOps(t,[{op:'updateOverlay',id:'v',patch:{video:{speed:0}}}]);assert.equal(r.receipts[0].status,'rejected');assert.equal(r.timeline.overlays[0].video.speed,1.5);
});
