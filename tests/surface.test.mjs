import test from 'node:test';
import assert from 'node:assert/strict';
import {parseTimeline,validateTimeline} from '../packages/engine/dist/schema.js';
import {applyOps} from '../packages/engine/dist/ops.js';
import {diffTimelines,timelinesEqual} from '../packages/engine/dist/diff.js';
import {gradientAt} from '../packages/engine/dist/gradient.js';
const blank=()=>parseTimeline({meta:{width:320,height:240,fps:30}});
const add=(id,extra={})=>({op:'addOverlay',id,shape:'rect',startSeconds:0,endSeconds:4,...extra});
const run=(t,ops)=>applyOps(t,ops);
const edit=(t,ops)=>run(t,ops).timeline;
test('track matte validates references, rejects nesting, survives undo, and clears references on source removal',()=>{
 let t=edit(blank(),[add('source'),add('target',{trackMatte:{source:'source',mode:'luma',invert:true}})]);
 assert.deepEqual(validateTimeline(t),[]);assert.deepEqual(parseTimeline(JSON.stringify(t)),t);
 assert.equal(run(t,[{op:'updateOverlay',id:'source',patch:{trackMatte:{source:'target'}}}]).receipts[0].status,'rejected');
 assert.equal(run(t,[{op:'updateOverlay',id:'target',patch:{trackMatte:{source:'missing'}}}]).receipts[0].status,'rejected');
 assert.equal(run(t,[{op:'updateOverlay',id:'source',patch:{transform3d:{rotateY:30}}}]).receipts[0].status,'rejected');
 const next=edit(t,[{op:'removeOverlay',id:'source'}]);assert.equal(next.overlays[0].trackMatte,undefined);
 assert.ok(timelinesEqual(applyOps(next,diffTimelines(next,t),{actor:"system"}).timeline,t));
});
test('gradient keyframes interpolate colors and offsets and retain continuity after split',()=>{
 const fill={type:'linear',stops:[{offset:0,color:'#f00'},{offset:1,color:'#00f'}],keyframes:[{t:0,angle:0,stops:[{offset:0,color:'#f00'},{offset:.8,color:'#fff'}],e:'linear'},{t:4,angle:180,stops:[{offset:.2,color:'#00f'},{offset:1,color:'#000'}]}]};
 const t=edit(blank(),[add('gradient',{shape:{type:'rect',fill}})]);
 const before=gradientAt(t.overlays[0].shape.fill,3);
 assert.equal(before.angle,135);assert.ok(Math.abs(before.stops[0].offset-.15)<1e-6);assert.match(before.stops[0].color,/color-mix/);
 const split=edit(t,[{op:'splitOverlay',id:'gradient',atSeconds:2,newId:'right'}]);
 const after=gradientAt(split.overlays[1].shape.fill,1);assert.deepEqual(after.stops,before.stops);assert.equal(after.angle,before.angle);assert.equal(t.overlays[0].shape.fill.keyframes[0].t,0);
 assert.deepEqual(validateTimeline(split),[]);
});
test('saved animations persist, stretch, merge, respect locked tracks, and undo independently',()=>{
 let t=edit(blank(),[add('a',{animations:{x:[{t:0,v:0,e:[.2,0,.8,1]},{t:4,v:1}],sweepProgress:[{t:0,v:0},{t:4,v:1}]}}),add('b',{endSeconds:2,animations:{opacity:[{t:0,v:.5}]}}),{op:'saveAnimation',id:'a',name:'Move'}]);
 assert.deepEqual(parseTimeline(JSON.stringify(t)),t);
 let b=edit(t,[{op:'applyAnimation',id:'b',name:'Move',merge:true}]).overlays[1];
 assert.equal(b.animations.x[1].t,2);assert.equal(b.animations.opacity[0].v,.5);assert.deepEqual(b.animations.x[0].e,[.2,0,.8,1]);
 b=edit(t,[{op:'applyAnimation',id:'b',name:'Move',fit:'original'}]).overlays[1];assert.equal(b.animations.x[1].t,4);assert.equal(b.animations.opacity,undefined);
 const saved=t;t=edit(t,[{op:'removeAnimation',name:'Move'}]);assert.equal(t.animationLibrary,undefined);
 const restored=applyOps(t,diffTimelines(t,saved),{actor:'system'}).timeline;assert.ok(timelinesEqual(restored,saved));
 t=edit(saved,[{op:'addClip',id:'locked',src:'a.png',type:'image',clipDuration:2},{op:'updateTrack',id:saved.videoTracks[0].id,patch:{locked:true}}]);
 assert.equal(run(t,[{op:'applyAnimation',id:'locked',name:'Move'}]).receipts[0].status,'rejected');
});
test('gradient and sweep channels survive keyframe sanitation and group animation reuse',()=>{
 const t=edit(blank(),[add('a',{group:'g',sweep:{width:.2,color:'#fff',opacity:.7}}),{op:'setKeyframe',group:'g',channel:'gradientHue',t:0,v:0},{op:'setKeyframe',group:'g',channel:'gradientHue',t:4,v:360},{op:'saveAnimation',group:'g',name:'Group'},{op:'applyAnimation',id:'a',name:'Group'}]);
 assert.equal(t.overlays[0].animations.gradientHue[1].v,360);assert.equal(t.overlays[0].sweep.width,.2);assert.deepEqual(validateTimeline(t),[]);
});
