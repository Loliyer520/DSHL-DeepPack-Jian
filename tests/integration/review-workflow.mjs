import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startEngine} from '../helpers/engine.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),engine=await startEngine();
const image=s=>Buffer.from(s.split(',')[1],'base64');
try{
 const bind=await engine.api('POST','/api/session-project',{sessionId:'review-workflow'}),pid=bind.body.project.id,base='/api/p/'+pid;
 const timeline={meta:{width:960,height:540,fps:30,background:'#172033'},overlays:[{id:'title',kind:'text',text:'浏览器真实测量中文排版，避免长文案挤出文本框。',fontSize:70,fontFamily:'sans',color:'#ffffff',x:.5,y:.35,w:.5,h:.16,startSeconds:0,endSeconds:5},{id:'short',kind:'text',text:'短文',fontSize:20,fontFamily:'sans',color:'#ffffff',x:.5,y:.9,w:.5,h:.08,startSeconds:0,endSeconds:5}]};
 assert.equal((await engine.api('PUT',base+'/timeline',{timeline})).status,200);
 const before=(await engine.api('GET',base+'/timeline')).body;
 const measured=await engine.api('POST',base+'/design/measure',{time:1});assert.equal(measured.status,200,JSON.stringify(measured.body));const result=measured.body;
 assert.equal(result.measurements.length,1,'must receive real browser measurement artifact');const short=result.measurements[0].elements.find(e=>e.id==='short');assert.ok(short.textRect.w<short.rect.w*.5,'measure glyphs rather than the full-width text container');assert.ok(result.measurements[0].elements[0].textRect.h>result.measurements[0].elements[0].rect.h);
 const index=result.items.findIndex(i=>i.kind==='overflow');assert.ok(index>=0,JSON.stringify(result.items));assert.ok(result.items[index].ops.length);
 assert.equal((await engine.api('GET',base+'/timeline')).body.rev,before.rev,'measurement is read only');
 const evidence=await engine.api('POST',base+'/design/evidence',{id:result.id,index});assert.equal(evidence.status,200);assert.ok(evidence.body.region);fs.writeFileSync(path.join(root,'docs/screenshots/46-browser-measurement.jpg'),image(evidence.body.image));
 const preview=await engine.api('POST',base+'/design/preview',{id:result.id,indices:[index]});assert.equal(preview.status,200,JSON.stringify(preview.body));assert.notEqual(preview.body.before,preview.body.after);assert.equal((await engine.api('GET',base+'/timeline')).body.rev,before.rev);
 const applied=await engine.api('POST',base+'/design/apply',{id:result.id,indices:[index],clientId:'test'});assert.equal(applied.status,200,JSON.stringify(applied.body));assert.ok(applied.body.inverse.length);
 const after=(await engine.api('GET',base+'/timeline')).body;assert.ok(after.timeline.overlays[0].fontSize<70);
 const recheck=await engine.api('POST',base+'/design/recheck',{id:result.id,index});assert.equal(recheck.status,200,JSON.stringify(recheck.body));assert.ok(!recheck.body.findings.some(i=>i.kind==='overflow'),JSON.stringify(recheck.body.findings));fs.writeFileSync(path.join(root,'docs/screenshots/47-measurement-fixed.jpg'),image(recheck.body.image));
 assert.equal((await engine.api('POST',base+'/design/dismiss',{id:result.id,index})).status,200);const list=(await engine.api('POST',base+'/design/list',{})).body;assert.ok(list.reviews.find(r=>r.id===result.id).dismissed.includes(index));
 await engine.api('POST',base+'/ops',{ops:[{op:'updateOverlay',id:'title',patch:{designLocks:['fontSize']}},{op:'addOverlay',id:'moving',kind:'text',text:'运动中的文字需要足够阅读时间',fontSize:42,fontFamily:'sans',color:'#55d9ca',x:.5,y:.8,w:.6,h:.12,startSeconds:2,endSeconds:5,animations:{x:[{t:0,v:-.9},{t:3,v:.9}],opacity:[{t:0,v:1,e:'hold'},{t:1,v:0,e:'hold'},{t:1.2,v:1}]}}],actor:'user'});
 const now=(await engine.api('GET',base+'/timeline')).body;
 const blocked=await engine.api('POST',base+'/design/submit',{baseRev:now.rev,items:[{message:'不能覆盖字号保护',time:1,ops:[{op:'updateOverlay',id:'title',patch:{fontSize:99}}]}]});assert.equal(blocked.status,400);
 const dynamic=await engine.api('POST',base+'/design/motion',{ids:['moving']});assert.equal(dynamic.status,200,JSON.stringify(dynamic.body));assert.ok(dynamic.body.measurements.length>=7);assert.ok(dynamic.body.items.some(i=>i.kind==='motion-outside'||i.kind==='visibility-jump'),JSON.stringify(dynamic.body.items));fs.writeFileSync(path.join(root,'docs/screenshots/48-motion-review.jpg'),image(dynamic.body.sheets[0].image));
 console.log('PASS browser measurement artifacts, before/after preview, read-only checks, apply, recheck, ignored findings, design protection and dynamic sampling');
}finally{await engine.stop();}
