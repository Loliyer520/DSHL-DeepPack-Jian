import test from 'node:test';
import assert from 'node:assert/strict';
import {parseTimeline,validateTimeline} from '../packages/engine/dist/schema.js';
import {applyOps} from '../packages/engine/dist/ops.js';
import {diffTimelines,timelinesEqual} from '../packages/engine/dist/diff.js';
import {STUDIO_THEMES,resolveCues,prepareScheduledTimeline} from '../packages/engine/dist/studio.js';
import {projectScene} from '../packages/engine/dist/scene3d.js';
import {checkTimeline,checkAudioEnvelopes} from '../packages/engine/dist/preflight.js';
const blank=()=>parseTimeline({meta:{width:960,height:540,fps:30}});
const apply=(t,ops,ctx={})=>{const r=applyOps(t,ops,ctx);assert.equal(r.receipts.some(x=>x.status==='rejected'),false,JSON.stringify(r.receipts));return r.timeline;};
const add=(id,extra={})=>({op:'addOverlay',id,kind:'shape',shape:'rect',text:'Card',x:.5,y:.5,w:.3,h:.2,startSeconds:0,endSeconds:5,...extra});
test('theme bindings update globally, unbound artwork stays unchanged and changes undo exactly',()=>{
 let t=apply(blank(),[add('a'),add('b'),{op:'setTheme',preset:'paper'},{op:'bindStyle',id:'a',role:'heading'}]);assert.equal(t.overlays[0].color,STUDIO_THEMES.paper.roles.heading.color);const before=t;
 t=apply(t,[{op:'setTheme',preset:'neon'}]);assert.equal(t.overlays[0].color,STUDIO_THEMES.neon.roles.heading.color);assert.equal(t.overlays[1].color,before.overlays[1].color);
 assert.ok(timelinesEqual(applyOps(t,diffTimelines(t,before),{actor:'system'}).timeline,before));assert.deepEqual(validateTimeline(parseTimeline(t)),[]);
});
test('component instances keep IDs, independent params, geometry and fresh definitions including removed fields',()=>{
 let t=apply(blank(),[add('title',{group:'source',animations:{rotation:[{t:0,v:0},{t:5,v:30}]}}),{op:'saveComponent',name:'card',group:'source'},{op:'instantiateComponent',id:'one',name:'card',startSeconds:6,values:{title:{text:'One'}}},{op:'instantiateComponent',id:'two',name:'card',startSeconds:12,values:{title:{text:'Two'}}}]);
 const first=t.overlays.find(o=>o.group==='one');assert.equal(first.text,'One');assert.equal(first.startSeconds,6);const id=first.id;
 t=apply(t,[{op:'updateOverlay',id:'title',patch:{text:'Changed',animations:null}},{op:'saveComponent',name:'card',group:'source'}]);assert.equal(t.overlays.find(o=>o.id===id).text,'One');assert.equal(t.overlays.find(o=>o.id===id).animations,undefined);
 t=apply(t,[{op:'setComponentParams',group:'one',values:{title:{text:'Edited',color:'#ff0000'}}}]);assert.equal(t.overlays.find(o=>o.group==='one').text,'Edited');assert.equal(t.overlays.find(o=>o.group==='two').text,'Two');assert.deepEqual(validateTimeline(parseTimeline(t)),[]);
 const before=t;t=apply(t,[{op:'removeComponent',name:'card'}]);assert.equal(t.groups.one.component,undefined);assert.equal(t.overlays.length,before.overlays.length);assert.ok(timelinesEqual(applyOps(t,diffTimelines(t,before),{actor:'system'}).timeline,before));
});
test('component instances remap internal follower and animation cue references',()=>{
 let t=apply(blank(),[add('a',{group:'source',cues:[{id:'in',preset:'fadeIn',start:0,duration:1}]}),add('b',{group:'source',follow:{target:'a'},cues:[{id:'out',preset:'fadeOut',start:0,duration:1,after:'in'}]}),{op:'saveComponent',name:'linked',group:'source'},{op:'instantiateComponent',name:'linked',id:'inst',startSeconds:5}]);
 const [a,b]=t.overlays.filter(o=>o.group==='inst');assert.equal(b.follow.target,a.id);assert.equal(b.cues[0].after,a.cues[0].id);assert.notEqual(a.cues[0].id,'in');assert.equal(resolveCues(t).length,4);assert.deepEqual(validateTimeline(parseTimeline(t)),[]);
});
test('cue dependencies reflow and render without mutating persisted keyframes; cycles rejected',()=>{
 const t=apply(blank(),[add('a',{cues:[{id:'aIn',preset:'fadeIn',start:1,duration:1},{id:'hold',preset:'hold',start:0,duration:2,after:'aIn'}]}),add('b',{startSeconds:2,endSeconds:8,cues:[{id:'bIn',preset:'fadeIn',start:0,duration:1,after:'hold'}]})]);
 assert.equal(resolveCues(t).find(c=>c.id==='bIn').start,4);const rendered=prepareScheduledTimeline(t);assert.equal(t.overlays[1].animations,undefined);assert.equal(rendered.overlays[1].animations.opacity[0].t,2);
 const invalid=structuredClone(t);invalid.overlays[0].cues[0].after='bIn';assert.throws(()=>parseTimeline(invalid),/循环/);
});
test('asset replacement keeps timeline length, animation and layout, adapting short video safely',()=>{
 let t=apply(blank(),[{op:'addClip',id:'clip',src:'old.mp4',clipDuration:5,inPoint:2,animations:{scale:[{t:0,v:1},{t:5,v:1.2}]}},add('image',{kind:'image',image:{src:'old.png',focus:{x:.8,y:.3}}})]);const before=t;
 t=apply(t,[{op:'replaceAsset',from:'old.mp4',to:'new.mp4'},{op:'replaceAsset',from:'old.png',to:'new.png'}],{assetDuration:s=>s==='new.mp4'?3:undefined,assetExists:()=>true});const clip=t.videoTracks[0].clips[0];assert.equal(clip.clipDuration,5);assert.equal(clip.speed,.6);assert.equal(clip.inPoint,0);assert.deepEqual(clip.animations,before.videoTracks[0].clips[0].animations);assert.deepEqual(t.overlays[0].image.focus,{x:.8,y:.3});assert.equal(t.overlays[0].image.src,'new.png');
 const r=applyOps(t,[{op:'replaceAsset',from:'new.mp4',to:'tiny.mp4'}],{assetDuration:()=>.1,assetExists:()=>true});assert.equal(r.receipts[0].status,'rejected');assert.ok(timelinesEqual(r.timeline,t));
});
test('canvas adaptation scales typography, preserves animation, and reflows existing row groups',()=>{
 let t=apply(blank(),[add('a',{group:'g'}),add('b',{group:'g'}),{op:'updateGroup',group:'g',state:{layout:{direction:'row',gap:20,width:.8}}}]);t=apply(t,[{op:'adaptCanvas',width:540,height:960,mode:'reflow'}]);assert.equal(t.groups.g.layout.direction,'column');assert.equal(t.meta.width,540);assert.ok(t.overlays[0].y<t.overlays[1].y);assert.deepEqual(validateTimeline(t),[]);
});
test('3D projects real occluded triangles with deterministic time and lower preview tessellation',()=>{
 const scene={objects:[{id:'box',geometry:'cube',color:'#ff0000',spin:[0,30,0]},{id:'ball',geometry:'sphere',color:'#ffffff',position:[1,0,0]}]};const f=projectScene(scene,1,640,480);assert.ok(f.length>50);assert.deepEqual(f,projectScene(scene,1,640,480));assert.notDeepEqual(f,projectScene(scene,2,640,480));assert.ok(projectScene(scene,1,640,480,'draft').length<f.length);assert.ok(f.every(p=>p.points.every(x=>x.every(Number.isFinite))));assert.ok(f.every((p,i)=>!i||f[i-1].depth>=p.depth));
});
test('preflight locates source, typography and reading issues without modifying the timeline',()=>{
 const t=apply(blank(),[add('bad',{text:'A very long paragraph that cannot be read instantly',endSeconds:.2,x:.99,w:.5,h:.01,color:'#000000',shape:{type:'rect',fill:'#000000'}})]);const before=JSON.stringify(t);const issues=checkTimeline(t,[]);assert.ok(issues.some(i=>i.code==='off-canvas'));assert.ok(issues.some(i=>i.code==='reading-speed'));assert.ok(issues.some(i=>i.code==='text-overflow'));assert.ok(issues.some(i=>i.code==='contrast'));assert.equal(JSON.stringify(t),before);
});
test('scene schema rejects invalid cameras and meshes; unknown theme preserves state',()=>{
 const base=blank();for(const scene of [{objects:[]},{camera:{distance:0},objects:[{id:'a',geometry:'cube',color:'#ffffff'}]},{objects:[{id:'a',geometry:'external-model',color:'#ffffff'}]}]){const r=applyOps(base,[add('a',{scene3d:scene})]);assert.equal(r.receipts[0].status,'rejected');}
 const r=applyOps(base,[{op:'setTheme',preset:'missing'}]);assert.equal(r.receipts[0].status,'rejected');assert.ok(timelinesEqual(base,r.timeline));
});

test('measured envelopes detect silent clips and potentially overloaded mixes',()=>{const t=parseTimeline({meta:{width:320,height:240,fps:30},audioTracks:[{id:'a',clips:[{id:'silent',src:'silence.wav',duration:2},{id:'loud',src:'loud.wav',duration:2}]},{id:'b',clips:[{id:'second',src:'loud.wav',duration:2}]}]});const issues=checkAudioEnvelopes(t,{'silence.wav':{rate:10,values:Array(20).fill(0)},'loud.wav':{rate:10,values:Array(20).fill(.9)}});assert.ok(issues.some(i=>i.code==='audio-silence'&&i.id==='silent'));assert.ok(issues.some(i=>i.code==='audio-peak'));});
test('duplicating and splitting scheduled elements preserve valid cue identity and baked motion',()=>{
 let t=apply(blank(),[add('a',{cues:[{id:'in',preset:'fadeIn',start:0,duration:2},{id:'out',preset:'fadeOut',start:3,duration:1}]}),{op:'duplicateClip',id:'a',newId:'b'}]);assert.notEqual(t.overlays[0].cues[0].id,t.overlays[1].cues[0].id);assert.deepEqual(validateTimeline(parseTimeline(t)),[]);
 const original=prepareScheduledTimeline(t);t=apply(t,[{op:'splitOverlay',id:'a',newId:'right',atSeconds:1}]);assert.equal(t.overlays.find(o=>o.id==='right').cues,undefined);assert.ok(t.overlays.find(o=>o.id==='right').animations.opacity);assert.deepEqual(validateTimeline(parseTimeline(t)),[]);
});
test('replacement updates saved component images and instance overrides, including future instantiations',()=>{
 let t=apply(blank(),[add('image',{kind:'image',image:{src:'old.png'},group:'source'}),{op:'saveComponent',name:'photo',group:'source'},{op:'instantiateComponent',name:'photo',id:'photo1',values:{image:{imageSrc:'old.png'}}},{op:'replaceAsset',from:'old.png',to:'new.png'},{op:'instantiateComponent',name:'photo',id:'photo2'}]);assert.equal(t.components.photo.overlays[0].image.src,'new.png');assert.equal(t.groups.photo1.component.values.image.imageSrc,'new.png');assert.ok(t.overlays.every(o=>o.image.src==='new.png'));
});
test('removing cue anchors preserves dependants as independent cues at their previous times',()=>{
 let t=apply(blank(),[add('a',{cues:[{id:'first',preset:'hold',start:1,duration:2},{id:'second',preset:'fadeIn',start:0,duration:1,after:'first'}]})]);t=apply(t,[{op:'updateOverlay',id:'a',patch:{cues:[t.overlays[0].cues[1]]}}]);assert.equal(t.overlays[0].cues[0].after,undefined);assert.equal(t.overlays[0].cues[0].start,3);assert.deepEqual(validateTimeline(t),[]);
});
test('contain adaptation preserves pixel geometry, motion, and media aspect fit',()=>{
 let t=apply(blank(),[add('moving',{animations:{x:[{t:0,v:.1},{t:2,v:.2}]},motionPath:{path:'M0 0 L10 20'}}),{op:'addClip',src:'video.mp4',clipDuration:3}]);t=apply(t,[{op:'adaptCanvas',width:540,height:960,mode:'contain'}]);assert.equal(t.videoTracks[0].clips[0].fit,'contain');assert.ok(Math.abs(t.overlays[0].animations.x[1].v-.2)<.0001);assert.ok(t.overlays[0].h<.2);assert.deepEqual(validateTimeline(t),[]);
});
test('responsive adaptation keeps legacy subtitles attached to their top/bottom positions',()=>{
 let t=apply(blank(),[{op:'addOverlay',id:'sub',text:'Caption',position:'bottom'}]);t=apply(t,[{op:'adaptCanvas',width:540,height:960,mode:'reflow'}]);assert.equal(t.overlays[0].position,'bottom');assert.equal(t.overlays[0].x,undefined);assert.equal(t.overlays[0].y,undefined);
});
