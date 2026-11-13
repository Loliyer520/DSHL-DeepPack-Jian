import test from 'node:test';
import assert from 'node:assert/strict';
import {parseTimeline,validateTimeline} from '../packages/engine/dist/schema.js';
import {applyOps} from '../packages/engine/dist/ops.js';
import {gradientOverlay} from '../packages/engine/dist/gradient.js';
import {diffTimelines,timelinesEqual} from '../packages/engine/dist/diff.js';
const stops=[{offset:0,color:'#ff0000'},{offset:.5,color:'#00ff00'},{offset:1,color:'#0000ff'}];
const fill={type:'linear',angle:0,stops,keyframes:[{t:0,stops},{t:4,angle:180,stops:stops.toReversed()}]};
const blank=()=>parseTimeline({version:20,meta:{width:320,height:240,fps:30}});
const edit=(t,ops)=>applyOps(t,ops).timeline;

test('text and icon gradients survive creation, editing, roundtrip and undo',()=>{
  let t=edit(blank(),[{op:'addOverlay',id:'text',kind:'text',text:'Gradient',startSeconds:0,endSeconds:4,textFill:fill,textStrokeFill:fill,stroke:{color:'#fff',width:3}},
    {op:'addOverlay',id:'icon',kind:'icon',icon:{name:'star',fill,strokeFill:fill},startSeconds:0,endSeconds:4}]);
  assert.deepEqual(validateTimeline(t),[]);
  assert.deepEqual(parseTimeline(JSON.stringify(t)),t);
  assert.deepEqual(t.overlays[0].textFill,fill);
  assert.deepEqual(t.overlays[1].icon.strokeFill,fill);
  const next=edit(t,[{op:'updateOverlay',id:'text',patch:{textFill:null,textStrokeFill:null}},{op:'updateOverlay',id:'icon',patch:{icon:{fill:'#fff',strokeFill:null}}}]);
  assert.equal(next.overlays[0].textFill,undefined);
  assert.equal(next.overlays[1].icon.strokeFill,undefined);
  assert.ok(timelinesEqual(applyOps(next,diffTimelines(next,t),{actor:"system"}).timeline,t));
  assert.equal(t.version,21);
});

test('text and icon gradient keyframes retain phase when splitting, without changing the source',()=>{
  for(const kind of ['text','icon']){
    const t=edit(blank(),[{op:'addOverlay',id:'a',kind,text:'MMMM',icon:kind==='icon'?{name:'star',fill,strokeFill:fill}:undefined,textFill:fill,textStrokeFill:fill,startSeconds:0,endSeconds:4}]);
    const original=JSON.stringify(t);
    const split=edit(t,[{op:'splitOverlay',id:'a',atSeconds:2,newId:'b'}]);
    const before=gradientOverlay(t.overlays[0],3),after=gradientOverlay(split.overlays[1],1);
    for(const key of ['textFill','textStrokeFill'])assert.deepEqual(after[key],{...before[key],keyframes:after[key].keyframes});
    if(kind==='icon')assert.deepEqual(after.icon.fill.stops,before.icon.fill.stops);
    assert.equal(JSON.stringify(t),original);
    assert.deepEqual(validateTimeline(split),[]);
  }
});

test('gradient motion applies to all paint channels',()=>{
  const o=parseTimeline({meta:{width:320,height:240,fps:30},overlays:[{id:'a',text:'A',startSeconds:0,endSeconds:2,textFill:fill,textStrokeFill:fill,icon:{name:'star',fill,strokeFill:fill}}]}).overlays[0];
  const motion={gradientAngle:[{t:0,v:40}],gradientShift:[{t:0,v:.1}]};
  const result=gradientOverlay(o,0,motion);
  for(const f of [result.textFill,result.textStrokeFill,result.icon.fill,result.icon.strokeFill]){
    assert.equal(f.angle,40);assert.equal(f.stops[0].offset,.1);
  }
});

test('new gradient fields obey color design locks and older documents migrate without inventing paint',async()=>{
  const {protectDesignPatch}=await import('../packages/engine/dist/designLocks.js');
  const o={...blank(),designLocks:['color']};
  assert.deepEqual(protectDesignPatch(o,{textFill:fill,textStrokeFill:fill,text:'keep'}),{text:'keep'});
  const old=parseTimeline({version:20,meta:{width:320,height:240,fps:30},overlays:[{id:'old',text:'plain',color:'#fff',startSeconds:0,endSeconds:1}]});
  assert.equal(old.version,21);assert.equal(old.overlays[0].textFill,undefined);
});
