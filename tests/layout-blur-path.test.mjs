import test from 'node:test';
import assert from 'node:assert/strict';
import {parseTimeline,validateTimeline} from '../packages/engine/dist/schema.js';
import {applyOps} from '../packages/engine/dist/ops.js';
import {diffTimelines,timelinesEqual} from '../packages/engine/dist/diff.js';
import {applyLayout,textSize} from '../packages/engine/dist/layout.js';
import {shutterSamples} from '../packages/engine/dist/motionBlur.js';
import {parsePath,toPathD} from '../packages/engine/dist/paths.js';
import {movePathPoint,splitPathSegment,removePathNode} from '../packages/engine/dist/pathEdit.js';
import {loadTs} from './helpers/ts-load.mjs';
const blank=()=>parseTimeline({meta:{width:320,height:240,fps:30}});
const add=(id,extra={})=>({op:'addOverlay',id,shape:'rect',startSeconds:0,endSeconds:3,x:.5,y:.5,w:.2,h:.2,...extra});
const edit=(t,ops)=>applyOps(t,ops).timeline;
test('layout materialises row geometry, updates content/background and remains stable across reload and undo',()=>{
 const before=edit(blank(),[add('bg',{group:'g'}),add('a',{group:'g',w:100/320,h:40/240}),add('b',{group:'g',w:80/320,h:60/240})]);
 const t=edit(before,[{op:'updateGroup',group:'g',state:{layout:{direction:'row',x:.5,y:.5,gap:16,padding:20,background:'bg'}}}]);
 assert.equal(t.overlays[0].w,236/320);assert.equal(t.overlays[1].x,112/320);assert.equal(t.overlays[2].x,218/320);
 assert.ok(timelinesEqual(t,parseTimeline(JSON.stringify(t))));assert.ok(timelinesEqual(t,applyLayout(t)));assert.deepEqual(validateTimeline(t),[]);
 assert.ok(timelinesEqual(applyOps(t,diffTimelines(t,before),{actor:'system'}).timeline,before));
 let auto=edit(before,[{op:'updateOverlay',id:'a',patch:{text:'短',autoSize:{maxWidth:.6,padding:12}}},{op:'updateGroup',group:'g',state:{layout:{direction:'column',background:'bg'}}}]);
 const initial=auto.overlays[0].w;auto=edit(auto,[{op:'updateOverlay',id:'a',patch:{text:'一段更长的文字内容'}}]);assert.ok(auto.overlays[0].w>initial);assert.ok(auto.overlays[1].h>40/240);
 assert.deepEqual(validateTimeline(auto),[]);
});
test('grid columns, exclusions and copied background references preserve constrained layout',async()=>{
 const t=edit(blank(),[...['a','b','c','free'].map(id=>add(id,{group:'g',layoutExclude:id==='free'})),{op:'updateGroup',group:'g',state:{layout:{direction:'grid',width:.8,columns:2,gap:10,align:'stretch'}}}]);
 assert.equal(t.overlays[0].x,t.overlays[2].x);assert.ok(t.overlays[2].y>t.overlays[0].y);assert.equal(t.overlays[3].x,.5);assert.equal(t.overlays[0].w,t.overlays[1].w);
 const {copyGroupState}=await loadTs('packages/client-timeline/src/client/actions.ts');
 assert.equal(copyGroupState({layout:{direction:'row',background:'bg'}},new Map([['bg','copy']])).layout.background,'copy');
 assert.equal(copyGroupState({layout:{direction:'row',background:'bg'}},new Map()).layout.background,undefined);
});
test('shutter sampling is deterministic, respects boundaries and preserves zero-angle sharpness',()=>{
 assert.deepEqual(shutterSamples(10,{samples:3,shutterAngle:360}),[9,9.5,10]);assert.deepEqual(shutterSamples(0,{samples:3,shutterAngle:720}),[0,0,0]);
 assert.deepEqual(shutterSamples(2,{samples:8,shutterAngle:0}),[2]);assert.equal(shutterSamples(5,{samples:16}).length,16);
 const t=edit(blank(),[add('a',{motionBlur:{samples:8,shutterAngle:270}})]);assert.equal(parseTimeline(t).overlays[0].motionBlur.shutterAngle,270);
});
test('path node movement carries its handles; subdivision retains the cubic curve and deletion remains valid',()=>{
 const p=parsePath('M0 0 C0 100 100 100 100 0 C110 0 120 0 130 0');
 const moved=movePathPoint(p,{sub:0,node:1,part:'anchor'},[100,20]);assert.deepEqual(moved[0].segs[0].c2,[100,120]);assert.deepEqual(moved[0].segs[1].c1,[110,20]);assert.deepEqual(p[0].segs[0].p,[100,0]);
 const split=splitPathSegment(p,0,0);assert.deepEqual(split[0].segs[0].p,[50,75]);assert.deepEqual(split[0].segs[1].p,[100,0]);assert.equal(split[0].segs.length,3);
 assert.equal(parsePath(toPathD(removePathNode(split,0,1)))[0].segs.length,2);
 const mirrored=movePathPoint(p,{sub:0,node:1,part:'c1'},[120,20],true);assert.deepEqual(mirrored[0].segs[0].c2,[80,-20]);
});
