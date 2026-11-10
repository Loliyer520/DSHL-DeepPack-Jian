import test from 'node:test';
import assert from 'node:assert/strict';
import {particleFrame,audioSample,beatTimes} from '../packages/engine/dist/ambient.js';
import {parseTimeline,validateTimeline} from '../packages/engine/dist/schema.js';
import {applyOps} from '../packages/engine/dist/ops.js';
test('particles are deterministic across seeking and quality preserves the retained particles',()=>{
 const spec={preset:'confetti',count:100,seed:42};const before=particleFrame(spec,1);particleFrame(spec,4);
 assert.deepEqual(before,particleFrame(spec,1));assert.deepEqual(particleFrame(spec,1,'draft'),before.slice(0,25));
 assert.notDeepEqual(before,particleFrame({...spec,seed:43},1));assert.notDeepEqual(before,particleFrame(spec,2));
 for(const p of before)assert.ok(p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1&&p.opacity>=0&&p.opacity<=1);
});
test('audio follows trim, speed, placement, mute, volume and missing/replaced source',()=>{
 const t=parseTimeline({meta:{width:320,height:240,fps:30},audioTracks:[{id:'a',clips:[{id:'music',src:'music.wav',atSeconds:2,inPoint:1,duration:3,speed:2,volume:.5}]}]});
 const o={audioReactive:{source:'music',src:'music.wav',rate:10,values:Array(100).fill(.8),smoothing:0}};
 assert.equal(audioSample(o,t,1).level,0);assert.deepEqual(audioSample(o,t,2.5),{level:.4,position:2});
 assert.equal(audioSample(o,t,5).level,0);t.audioTracks[0].muted=true;assert.equal(audioSample(o,t,2.5).level,0);
 t.audioTracks[0].muted=false;t.audioTracks[0].clips[0].src='new.wav';assert.equal(audioSample(o,t,2.5).level,0);
});
test('ambient fields roundtrip, update and clear through ordinary ops; reject unsafe counts',()=>{
 const t=parseTimeline({meta:{width:320,height:240,fps:30}});const a=applyOps(t,[{op:'addOverlay',id:'snow',kind:'shape',shape:'rect',particles:{preset:'snow',count:100}}]).timeline;
 assert.equal(a.overlays[0].particles.count,100);assert.deepEqual(validateTimeline(parseTimeline(a)),[]);
 const b=applyOps(a,[{op:'updateOverlay',id:'snow',patch:{particles:null}}]).timeline;assert.equal(b.overlays[0].particles,undefined);
 assert.throws(()=>parseTimeline({...a,overlays:[{...a.overlays[0],particles:{preset:'snow',count:601}}]}));
});
test('onset detection separates nearby attacks and ignores silence',()=>{
 const v=Array(100).fill(0);v[10]=1;v[12]=1;v[60]=.8;assert.deepEqual(beatTimes(v,100),[.1,.6]);assert.deepEqual(beatTimes(Array(10).fill(0),100),[]);
});
