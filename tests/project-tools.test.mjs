import test from 'node:test';
import assert from 'node:assert/strict';
import {parseTimeline,validateTimeline} from '../packages/engine/dist/schema.js';
import {precompose,nestedAudio,referencedAssets} from '../packages/engine/dist/compositions.js';
import {parseBatch,batchVariant} from '../packages/engine/dist/batch.js';
import {applyOps} from '../packages/engine/dist/ops.js';
import {diffTimelines} from '../packages/engine/dist/diff.js';
const empty=()=>parseTimeline({meta:{width:320,height:240,fps:30},overlays:[]});
const element=(id,extra={})=>({id,kind:'text',text:'Hello {{name}}',startSeconds:1,endSeconds:3,...extra});
test('CSV quoted newline and escaped quotes, typed JSON, malformed input',()=>{
 assert.deepEqual(parseBatch('\uFEFFname,_name\r\n"A, B","one"\r\n"x\n""y""",two','csv'),[{name:'A, B',_name:'one'},{name:'x\n"y"',_name:'two'}]);
 assert.deepEqual(parseBatch('[{"n":2,"ok":true,"empty":null}]','json'),[{n:'2',ok:'true',empty:''}]);
 for(const str of ['a,a\n1,2','a,b\n1','a\n"open','a\n"close"bad'])assert.throws(()=>parseBatch(str,'csv'));
 assert.throws(()=>parseBatch('[{}]'.repeat(2),'json'));assert.throws(()=>parseBatch('[]','json'));
});
test('precompose preserves layout, embedded time, edits and undo',()=>{
 const t=parseTimeline({...empty(),overlays:[element('a',{x:.3}),element('b',{x:.7})]});
 const {overlay,child}=precompose(t,['a','b'],'card');assert.equal(child.overlays[0].startSeconds,0);assert.equal(child.overlays[0].x,.3);assert.equal(overlay.startSeconds,1);
 const r=applyOps(t,[{op:'addOverlay',id:'nested',...overlay},{op:'removeOverlay',id:'a'},{op:'removeOverlay',id:'b'}]);assert.ok(r.receipts.every(r=>r.status==='applied'),JSON.stringify(r.receipts));assert.deepEqual(validateTimeline(r.timeline),[]);
 const undo=applyOps(r.timeline,diffTimelines(r.timeline,t),{actor:'system'});assert.deepEqual(undo.timeline,t);
 const copied=applyOps(r.timeline,[{op:'splitOverlay',id:'nested',atSeconds:2}]);if(copied.receipts[0].status==='applied'){const right=copied.timeline.overlays.find(o=>o.startSeconds===2);assert.equal(right.composition.inPoint,1);}
 assert.throws(()=>precompose(parseTimeline({...t,overlays:t.overlays.map(o=>({...o,group:'g'}))}),['a'],'bad'));
});
test('nested validation, asset discovery and replacement, recursive batch variables',()=>{
 const child=parseTimeline({...empty(),overlays:[element('image',{kind:'image',text:'',image:{src:'old.png'}})]});
 const t=parseTimeline({...empty(),overlays:[element('nest',{kind:'shape',composition:{name:'child',timeline:JSON.stringify(child),speed:2,inPoint:0,volume:1}})]});
 assert.deepEqual(referencedAssets(t),['old.png']);
 const r=applyOps(t,[{op:'replaceAsset',from:'old.png',to:'new.png'}],{assetExists:()=>true});assert.notEqual(r.receipts[0].status,'rejected',JSON.stringify(r.receipts));assert.deepEqual(referencedAssets(r.timeline),['new.png']);
 const textChild=parseTimeline({...empty(),overlays:[element('text')]});const bt=parseTimeline({...t,overlays:[{...t.overlays[0],composition:{...t.overlays[0].composition,timeline:JSON.stringify(textChild)}}]});const v=parseTimeline(batchVariant(bt,{name:'Ada "quote"'}));assert.equal(JSON.parse(v.overlays[0].composition.timeline).overlays[0].text,'Hello Ada "quote"');assert.throws(()=>batchVariant(bt,{}));
 let deep=child;for(let i=0;i<4;i++)deep=parseTimeline({...empty(),overlays:[element('n'+i,{composition:{name:'deep',timeline:JSON.stringify(deep)}})]});assert.throws(()=>parseTimeline({...empty(),overlays:[element('tooDeep',{composition:{name:'deep',timeline:JSON.stringify(deep)}})]}),/4 层/);
});
test('nested audio honors source trim, speed, bounds and gain',()=>{
 const child=parseTimeline({...empty(),audioTracks:[{id:'a',volume:.5,clips:[{id:'music',src:'music.wav',atSeconds:1,inPoint:2,duration:4,speed:1.5,volume:.8}]}]});
 const t=parseTimeline({...empty(),overlays:[element('n',{endSeconds:3,composition:{name:'audio',timeline:JSON.stringify(child),inPoint:2,speed:2,volume:.5}})]});const [a]=nestedAudio(t);assert.equal(a.start,1);assert.equal(a.end,2.5);assert.equal(a.inPoint,3.5);assert.equal(a.speed,3);assert.equal(a.gain(.25),.2);
});

test('precomposing the last member of a cue group preserves external dependant timing',()=>{
 const t=parseTimeline({...empty(),overlays:[element('a',{group:'source'}),element('b',{group:'dependent'})],groups:{source:{cues:[{id:'first',preset:'fadeIn',start:.2,duration:.5}]},dependent:{cues:[{id:'second',preset:'fadeIn',start:0,duration:.4,after:'first',offset:.1}]}}});
 const {overlay}=precompose(t,['a'],'one');const r=applyOps(t,[{op:'addOverlay',id:'nested',...overlay},{op:'removeOverlay',id:'a'}]);assert.deepEqual(validateTimeline(r.timeline),[]);assert.equal(r.timeline.groups.dependent.cues[0].after,undefined);assert.ok(Math.abs(r.timeline.groups.dependent.cues[0].start-.8)<1e-10);
});

test('malformed nested documents are rejected before optimistic rendering',()=>{
 const r=applyOps(empty(),[{op:'addOverlay',id:'bad',kind:'shape',composition:{name:'bad',timeline:'not JSON'}}]);assert.equal(r.receipts[0].status,'rejected');assert.equal(r.timeline.overlays.length,0);
});
