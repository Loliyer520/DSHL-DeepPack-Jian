import test from 'node:test';
import assert from 'node:assert/strict';
import {parseTimeline,validateTimeline} from '../packages/engine/dist/schema.js';
import {applyOps,OP_NAMES} from '../packages/engine/dist/ops.js';
import {createDraft,finishDraft} from '../packages/engine/dist/draft.js';
import {modelIndex} from '../packages/engine/dist/modelIndex.js';
import {PUBLIC_OP_NAMES,OP_REGISTRY,OPS_PARAMETERS,operationError} from '../packages/engine/dist/operationRegistry.js';
import {changedFields,fieldsOverlap} from '../packages/engine/dist/fieldChanges.js';
import {OPS_PARAMETERS as toolParameters} from '../packages/host-bridge/lib/ops-doc.js';
const fixture=()=>parseTimeline({meta:{fps:30,width:1280,height:720},overlays:[{id:'a',text:'A',startSeconds:0,endSeconds:3},{id:'b',text:'B',startSeconds:0,endSeconds:3}]});
function freeze(v){if(v&&typeof v==='object'){Object.freeze(v);for(const child of Object.values(v))freeze(child);}return v;}
test('copy-on-write preserves untouched references, accepts frozen input, and exports plain JSON',()=>{
 const before=freeze(fixture()),r=applyOps(before,[{op:'updateOverlay',id:'a',patch:{x:.4}}]);assert.equal(r.receipts[0].status,'applied');assert.equal(r.timeline.overlays[1],before.overlays[1]);assert.equal(r.timeline.videoTracks,before.videoTracks);assert.notEqual(r.timeline.overlays[0],before.overlays[0]);assert.deepEqual(structuredClone(r.timeline),r.timeline);assert.equal(before.overlays[0].x,undefined);
 const noop=applyOps(r.timeline,[{op:'updateOverlay',id:'a',patch:{x:.4}}]);assert.equal(noop.timeline,r.timeline);assert.equal(noop.receipts[0].status,'ignored');
});
test('failed operations roll back all mutations and release reserved identifiers',()=>{
 const before=fixture(),r=applyOps(before,[{op:'addOverlay',id:'new',kind:'image',image:{src:'bad.png'}},{op:'addOverlay',id:'new',text:'valid'}],{assetExists:()=>false});assert.equal(r.receipts[0].status,'rejected');assert.equal(r.timeline.overlays.at(-1).id,'new');assert.equal(before.overlays.length,2);
});
test('indexes follow draft structural changes and do not leak across versions',()=>{
 const before=fixture(),index=modelIndex(before),draft=createDraft(before);draft.overlays.splice(0,1);assert.equal(modelIndex(draft).overlays.has('a'),false);assert.equal(modelIndex(draft).overlays.get('b'),0);const after=finishDraft(draft);assert.equal(modelIndex(after).overlays.get('b'),0);assert.equal(index.overlays.get('b'),1);
});
test('incremental layout only affects the edited group and retains other objects',()=>{
 const t=parseTimeline({...fixture(),overlays:[...fixture().overlays.map(o=>({...o,group:'one'})),{id:'c',text:'C',startSeconds:0,endSeconds:3,group:'two',autoSize:{}}],groups:{one:{layout:{direction:'row'}},two:{layout:{direction:'column'}}}});
 const r=applyOps(t,[{op:'updateOverlay',id:'a',patch:{autoSize:{},text:'A much longer title'}}]);assert.deepEqual(validateTimeline(r.timeline),[]);assert.equal(r.timeline.overlays[2],t.overlays[2]);
});
test('operation registry drives tool schema, discovery and validation',()=>{
 assert.deepEqual(Object.keys(OP_REGISTRY),[...OP_NAMES]);assert.deepEqual(toolParameters,OPS_PARAMETERS);assert.deepEqual(OPS_PARAMETERS.properties.ops.items.properties.op.enum,PUBLIC_OP_NAMES);assert.match(operationError({op:'addClip'}),/src/);assert.equal(operationError({op:'addClip',src:'a.mp4'}),undefined);
});
test('field conflicts distinguish object fields, animation channels and removals',()=>{
 const before=fixture(),a=applyOps(before,[{op:'updateOverlay',id:'a',patch:{text:'changed'}}]).timeline,b=applyOps(before,[{op:'updateOverlay',id:'a',patch:{color:'#ff0000'}}]).timeline;
 const pa=changedFields(before,a),pb=changedFields(before,b);assert.deepEqual(pa,['overlay:a/text']);assert.deepEqual(pb,['overlay:a/color']);assert.equal(pa.some(x=>pb.some(y=>fieldsOverlap(x,y))),false);assert.equal(fieldsOverlap('overlay:a','overlay:a/text'),true);
});

test('mixed operation batches match the previous full-snapshot kernel',async()=>{
 const {referenceKernel}=await import('./helpers/reference-kernel.mjs'),legacy=await referenceKernel();
 const source=parseTimeline({...fixture(),overlays:Array.from({length:12},(_,i)=>({id:'e'+i,text:'title '+i,startSeconds:0,endSeconds:4,group:i<6?'one':'two',autoSize:{},x:.5,y:.5})),groups:{one:{layout:{direction:'row',gap:2}},two:{layout:{direction:'column',gap:3}}}});
 let seed=431;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);const ops=[];
 for(let i=0;i<80;i++){const id='e'+Math.floor(random()*12);switch(i%5){case 0:ops.push({op:'updateOverlay',id,patch:{text:'text '+i}});break;case 1:ops.push({op:'setKeyframe',id,channel:'opacity',t:random()*2,v:random()});break;case 2:ops.push({op:'updateGroup',group:i%2?'one':'two',state:{layout:{direction:'column',gap:i%7}}});break;case 3:ops.push({op:'updateOverlay',id,patch:{fontSize:20+i,shadow:{color:'#000000',blur:10}}});break;case 4:ops.push({op:'updateOverlay',id,patch:{composition:{name:'bad',timeline:'invalid'}}});break;}}
 const actual=applyOps(source,ops),expected=legacy.applyOps(source,ops);assert.deepEqual(actual.timeline,expected.timeline);assert.deepEqual(actual.receipts.map(r=>r.status),expected.receipts.map(r=>r.status));assert.deepEqual(validateTimeline(actual.timeline),[]);
});

test('equivalent structured patches and optional undefined values remain no-ops',()=>{
 const a=applyOps(fixture(),[{op:'updateOverlay',id:'a',patch:{shadow:{color:'#000000',blur:10}}}]).timeline;
 const b=applyOps(a,[{op:'updateOverlay',id:'a',patch:{shadow:{blur:10,color:'#000000'}}}]);assert.equal(b.receipts[0].status,'ignored');assert.equal(b.timeline,a);
 const draft=createDraft(a);draft.groups=undefined;assert.equal(finishDraft(draft),a);
});

test('edit tools expose stable request IDs even on an ambiguous failure',async()=>{
 const {postEdit}=await import('../packages/host-bridge/lib/project-tools.js');let sent;
 await assert.rejects(postEdit({post:async(url,body)=>{sent=body;throw new Error('transport failed');}},'/ops',{ops:[],batchId:'fixed-id'}),/requestId=fixed-id/);assert.equal(sent.batchId,'fixed-id');
 const done=await postEdit({post:async()=>({rev:1})},'/ops',{ops:[],batchId:'fixed-id'});assert.equal(done.requestId,'fixed-id');
});
