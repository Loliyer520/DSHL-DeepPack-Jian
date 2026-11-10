import test from 'node:test';
import assert from 'node:assert/strict';
import {parseTimeline,validateTimeline} from '../packages/engine/dist/schema.js';
import {applyOps} from '../packages/engine/dist/ops.js';
import {diffTimelines,timelinesEqual} from '../packages/engine/dist/diff.js';
import {sharedPairs,sharedSnapshot} from '../packages/engine/dist/sharedElements.js';
import {glassStyle} from '../packages/engine/dist/glass.js';
import {loadTs} from './helpers/ts-load.mjs';
const blank=()=>parseTimeline({meta:{width:400,height:300,fps:30}});
const add=(id,props={})=>({op:'addOverlay',id,shape:'rect',x:.3,y:.5,w:.2,h:.3,startSeconds:0,endSeconds:2,...props});
const apply=(t,ops)=>applyOps(t,ops).timeline;

test('inner shadows, gradient strokes and glass persist through ops, split and undo',()=>{
 const grad={type:'linear',angle:45,stops:[{offset:0,color:'#ff0000'},{offset:1,color:'#0000ff'}]};
 const t=apply(blank(),[add('a',{shadow:[{color:'#000',blur:10,opacity:.5,inset:true}],shape:{type:'rect',fill:'#fff',stroke:{color:grad,width:8}},glass:{blur:20,opacity:.1}})]);
 assert.deepEqual(t.overlays[0].shape.stroke.color,grad);assert.equal(t.overlays[0].shadow[0].inset,true);
 assert.deepEqual(validateTimeline(t),[]);assert.deepEqual(parseTimeline(JSON.stringify(t)),t);
 const next=apply(t,[{op:'updateOverlay',id:'a',patch:{glass:null,shadow:false}}]);
 assert.ok(timelinesEqual(applyOps(next,diffTimelines(next,t),{actor:'system'}).timeline,t));
 const split=apply(t,[{op:'splitOverlay',id:'a',atSeconds:1,newId:'b'}]);assert.equal(split.overlays[1].glass.blur,20);
 assert.match(glassStyle(t.overlays[0].glass).backdropFilter,/blur\(20px\)/);
});

test('shared keys match only touching unique scenes and yield frozen canvas snapshots',()=>{
 const t=apply(blank(),[add('a',{shared:{key:'card'},group:'g',animations:{x:[{t:0,v:0},{t:2,v:.1}]}}),add('b',{shared:{key:'card',duration:.8},startSeconds:2,endSeconds:4,x:.8}),{op:'updateGroup',group:'g',state:{scale:2,pivotX:.3,pivotY:.5}}]);
 const pairs=sharedPairs(t);assert.equal(pairs.length,1);assert.equal(pairs[0].duration,.8);
 const snap=sharedSnapshot(t.overlays[0],t,2);assert.ok(Math.abs(snap.x-.5)<1e-8);assert.equal(snap.w,.4);assert.equal(snap.group,undefined);assert.equal(snap.effects,undefined);assert.equal(snap.shared,undefined);
 assert.equal(sharedPairs(apply(t,[{op:'updateOverlay',id:'b',patch:{startSeconds:2.2}}])).length,0);
 assert.equal(sharedPairs(apply(t,[{op:'updateOverlay',id:'b',patch:{transform3d:{rotateY:20}}}])).length,0);
 const duplicate=apply(t,[add('c',{shared:{key:'card'},startSeconds:2,endSeconds:4})]);assert.equal(sharedPairs(duplicate).length,0);
 const camera=apply(t,[{op:'addOverlay',id:'cam',kind:'camera',startSeconds:0,endSeconds:4}]);assert.equal(sharedPairs(camera).length,0);
 const manual=apply(t,[{op:'updateOverlay',id:'b',patch:{morph:{from:'a',duration:.5}}}]);assert.equal(sharedPairs(manual).length,0);
});

test('curve drags use atomic remove/set, snap times and retain easing for element and group keys',async()=>{
 const {curveEditOps,curveRange}=await loadTs('packages/client-timeline/src/client/ui/inspector/CurveEditor.tsx');
 const e=[.25,-.2,.75,1.2];
 const t=apply(blank(),[add('a',{animations:{x:[{t:0,v:0,e},{t:2,v:1}]}})]);
 const ops=curveEditOps({id:'a',start:0,duration:2},'x',t.overlays[0].animations.x[0],.517,.3,30);
 const changed=apply(t,ops);assert.ok(Math.abs(changed.overlays[0].animations.x[0].t-16/30)<.0001);assert.deepEqual(changed.overlays[0].animations.x[0].e,e);
 assert.ok(curveRange([{t:0,v:-5},{t:1,v:5}])[0]<-5);
 const g=curveEditOps({id:'g',group:'g',start:0,duration:2},'scale',{t:0,v:1},1,2,30);assert.equal(g[1].group,'g');assert.equal(g[1].id,undefined);
});
