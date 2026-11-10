import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTimeline, validateTimeline } from '../packages/engine/dist/schema.js';
import { applyOps, sanitizeEasing } from '../packages/engine/dist/ops.js';
import { diffTimelines, timelinesEqual } from '../packages/engine/dist/diff.js';
import { evalKeyframes } from '../packages/engine/dist/timeline.js';
import { springEase, springResponse } from '../packages/engine/dist/spring.js';
import { maskState } from '../packages/engine/dist/masks.js';
import { followMatrix, transformPoint, worldAnchor, resolveConnector } from '../packages/engine/dist/relationships.js';
import { staggerPresentation } from '../packages/engine/dist/stagger.js';
import { loadTs } from './helpers/ts-load.mjs';
const blank=()=>parseTimeline({meta:{width:400,height:300,fps:30}});
const add=(id,extra={})=>({op:'addOverlay',id,shape:'rect',x:.5,y:.5,startSeconds:0,endSeconds:4,...extra});
const apply=(t,ops)=>applyOps(t,ops,{newId:()=> 'new'});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);

test('physical spring is finite for under/critical/over damping, settles and preserves keyframe endpoints',()=>{
  for(const damping of [.1,18,20,50,100]){
    const spec={type:'spring',stiffness:100,mass:1,damping};
    near(springResponse(0,spec),0);near(springEase(0,1,spec),0);near(springEase(1,1,spec),1);
    for(let i=0;i<=100;i++)assert.ok(Number.isFinite(springEase(i/100,1,spec)));
  }
  const spec={type:'spring',stiffness:170,damping:10};
  assert.ok(Array.from({length:50},(_,i)=>springEase(i/50,1,spec)).some(x=>x>1.05),'under damping overshoots');
  near(springResponse(10,spec),1);
  const k=[{t:0,v:0,e:spec},{t:2,v:100}];near(evalKeyframes(k,1),springEase(.5,2,spec)*100);
  assert.deepEqual(sanitizeEasing({type:'spring',stiffness:9999,damping:0,mass:-1,velocity:999}),{type:'spring',stiffness:1000,damping:.1,mass:.1,velocity:20});
});

test('mask channels animate independently, clamp and survive split and group undo',()=>{
  const animations={maskW:[{t:0,v:0},{t:4,v:1}],maskX:[{t:0,v:.2},{t:4,v:.8}],maskFeather:[{t:0,v:0},{t:4,v:40}]};
  const t=apply(blank(),[add('a',{group:'g',mask:{type:'ellipse'},animations})]).timeline;
  const mask=maskState(t.overlays[0].mask,animations,2);near(mask.w,.5);near(mask.x,.5);near(mask.feather,20);
  const split=apply(t,[{op:'splitOverlay',id:'a',atSeconds:2}]).timeline;
  near(maskState(split.overlays[1].mask,split.overlays[1].animations,0).w,.5);
  const keyed=apply(t,[{op:'setKeyframe',group:'g',channel:'maskW',t:1,v:10}]).timeline;
  near(keyed.groups.g.animations.maskW[0].v,4);
  assert.ok(timelinesEqual(applyOps(keyed,diffTimelines(keyed,t),{actor:'system'}).timeline,t));
  assert.deepEqual(validateTimeline(keyed),[]);
});

test('follow composes parent motion with independent rotation/scale inheritance and multi-level links',()=>{
  const t=apply(blank(),[
    add('parent',{x:.25,y:.5,rotate:90,animations:{x:[{t:0,v:0},{t:4,v:.4}],scale:[{t:0,v:2}]}}),
    add('child',{x:.5,y:.5,follow:{target:'parent'}}),
    add('leaf',{x:.6,y:.5,follow:{target:'child'}}),
  ]).timeline;
  const [parent,child,leaf]=t.overlays;
  let p=transformPoint(followMatrix(child,t.overlays,2,400,300),200,150);near(p[0],280);near(p[1],150);
  p=transformPoint(followMatrix({...child,follow:{target:'parent',rotation:true,scale:true}},t.overlays,2,400,300),200,150);near(p[0],180);near(p[1],350);
  p=worldAnchor(leaf,t.overlays,2,400,300);near(p[0],320);near(p[1],150);
  assert.deepEqual(validateTimeline(t),[]);
  const bad=apply(t,[{op:'updateOverlay',id:'parent',patch:{follow:{target:'leaf'}}}]);
  assert.equal(bad.timeline.overlays[0].follow,undefined);assert.ok(bad.receipts[0].warnings.some(x=>x.includes('循环')));
  const corrupt=structuredClone(t);corrupt.overlays[0].follow={target:'leaf'};
  assert.throws(()=>parseTimeline(corrupt),/循环/);
  const removed=apply(t,[{op:'removeOverlay',id:'parent'}]).timeline;
  assert.equal(removed.overlays[0].follow,undefined);assert.deepEqual(validateTimeline(removed),[]);
});

test('connector endpoints track targets and anchor edges, even when start times differ',()=>{
  const t=apply(blank(),[add('a',{x:.2,w:.1}),add('b',{x:.6,w:.1,animations:{y:[{t:0,v:0},{t:4,v:.4}]}}),add('line',{shape:'arrow',h:.04,connector:{from:'a',to:'b',fromAnchor:'right',toAnchor:'left'}})]).timeline;
  const line=resolveConnector(t.overlays[2],t.overlays,2,400,300);
  near(line.x,.4);near(line.y,.6);near(line.w,Math.hypot(120,60)/400);near(line.rotate,Math.atan2(60,120)*180/Math.PI);
  const missing=apply(t,[{op:'updateOverlay',id:'line',patch:{connector:{from:'missing',to:'a'}}}]);
  assert.equal(missing.timeline.overlays[2].connector.from,'a');
});

test('stagger order and interval are deterministic and never mutate member animations or times',()=>{
  const t=apply(blank(),Array.from({length:3},(_,i)=>add('a'+i,{group:'g',animations:{x:[{t:0,v:.1}]}}))).timeline;
  const before=JSON.stringify(t.overlays), state={g:{stagger:{interval:.2,preset:'springRise',duration:.7}}};
  near(staggerPresentation(t.overlays[2],t.overlays,state,.3).seconds,-.1);
  near(staggerPresentation(t.overlays[2],t.overlays,{g:{stagger:{interval:.2,order:'reverse'}}},.3).seconds,.3);
  near(staggerPresentation(t.overlays[1],t.overlays,{g:{stagger:{interval:.2,order:'center'}}},.3).seconds,.3);
  assert.equal(JSON.stringify(t.overlays),before);
});

test('copied bindings reference new IDs and spring splits keep their original physical time span',async()=>{
  const {referenceCopies}=await loadTs('packages/client-timeline/src/client/actions.ts');
  const t=apply(blank(),[add('a'),add('b',{follow:{target:'a'}}),add('line',{shape:'arrow',connector:{from:'a',to:'b'}})]).timeline;
  const ops=referenceCopies(t.overlays,new Map([['a','aa'],['b','bb'],['line','ll']]));
  assert.equal(ops[0].patch.follow.target,'aa');assert.deepEqual(ops[1].patch.connector,{from:'aa',to:'bb'});
  const spring=apply(blank(),[add('a',{animations:{x:[{t:0,v:0,e:{type:'spring',stiffness:150,damping:12}},{t:4,v:1}]}})]).timeline;
  const split=apply(spring,[{op:'splitOverlay',id:'a',atSeconds:2}]).timeline;
  near(evalKeyframes(split.overlays[1].animations.x,.25),evalKeyframes(spring.overlays[0].animations.x,2.25));
});
