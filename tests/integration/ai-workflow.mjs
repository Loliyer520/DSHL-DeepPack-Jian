import assert from 'node:assert/strict';
import fs from 'node:fs';
import {startEngine} from '../helpers/engine.mjs';
const e=await startEngine(),ok=r=>{assert.ok(r.status>=200&&r.status<300,JSON.stringify(r));return r.body;};
try{
 const pid=ok(await e.api('POST','/api/session-project',{sessionId:'ai-flow'})).project.id,base='/api/p/'+pid;
 const t={meta:{width:640,height:360,fps:24,background:'#132338'},overlays:[{id:'title',kind:'title',text:'新的工作方式',fontFamily:'sans',fontSize:36,color:'#ffffff',x:.5,y:.3,w:.8,h:.2,startSeconds:0,endSeconds:3,group:'page'},{id:'body',kind:'text',text:'先预演，再采用',fontFamily:'sans',fontSize:22,color:'#aaccee',x:.5,y:.7,w:.8,h:.15,startSeconds:0,endSeconds:3,group:'page'},{id:'later',kind:'text',text:'下一页保持原样',startSeconds:4,endSeconds:6,fontSize:26}]};
 ok(await e.api('PUT',base+'/timeline',{timeline:t}));let current=ok(await e.api('GET',base+'/timeline'));
 ok(await e.api('PUT',base+'/style',{patch:{audience:'初学者',platform:'横屏课程',mood:'清晰、克制',focalPoint:'每页一个重点',density:'sparse',motionRules:'标题出现后再显示正文',titleSize:36}}));
 const ctx=ok(await e.api('POST',base+'/ai/context',{ids:['title'],task:'text'}));assert.equal(ctx.entities.length,2);assert.ok(ctx.styleText.includes('初学者'));assert.ok(!ctx.entities.some(e=>e.id==='later'));
 const outside=ok(await e.api('POST',base+'/ai/rehearse',{baseRev:current.rev,ids:['title'],render:false,ops:[{op:'updateOverlay',id:'later',patch:{text:'不该修改'}}]}));assert.equal(outside.canApply,false);assert.ok(outside.validation.some(v=>v.includes('超出范围')));
 const invalid=ok(await e.api('POST',base+'/ai/rehearse',{baseRev:current.rev,render:false,ops:[{op:'nonexistent'}]}));assert.equal(invalid.canApply,false);assert.equal(invalid.receipts[0].status,'rejected');
 const invalidMath=ok(await e.api('POST',base+'/ai/rehearse',{baseRev:current.rev,render:false,ops:[{op:'addOverlay',tex:'\\frac{',startSeconds:0,endSeconds:1}]}));assert.equal(invalidMath.canApply,false);
 const draft=ok(await e.api('POST',base+'/ai/rehearse',{baseRev:current.rev,ids:['title'],ops:[{op:'updateOverlay',id:'title',patch:{text:'更清晰的标题',color:'#55d9ca'}}],label:'改好这一页'}));assert.equal(draft.canApply,true,JSON.stringify(draft));assert.ok(draft.before&&draft.after);assert.notEqual(draft.before,draft.after);assert.ok(draft.plan.times.every(s=>s<3));assert.equal(ok(await e.api('GET',base+'/timeline')).rev,current.rev);
 const repeated=ok(await e.api('POST',base+'/ai/rehearse',{baseRev:current.rev,ids:['title'],ops:[{op:'updateOverlay',id:'title',patch:{text:'更清晰的标题',color:'#55d9ca'}}],label:'改好这一页'}));assert.equal(repeated.id,draft.id);assert.equal(repeated.cached,true);
 fs.writeFileSync('docs/screenshots/53-ai-before.jpg',Buffer.from(draft.before.split(',')[1],'base64'));fs.writeFileSync('docs/screenshots/54-ai-after.jpg',Buffer.from(draft.after.split(',')[1],'base64'));
 const applied=ok(await e.api('POST',base+'/ai/apply',{id:draft.id,clientId:'test'}));assert.ok(applied.inverse.length);assert.equal(ok(await e.api('POST',base+'/ai/apply',{id:draft.id,clientId:'test'})).duplicate,true);current=ok(await e.api('GET',base+'/timeline'));assert.equal(current.timeline.overlays[2].text,'下一页保持原样');
 const create=ok(await e.api('POST',base+'/ai/rehearse',{baseRev:current.rev,render:false,ops:[{op:'addOverlay',kind:'text',text:'新对象',startSeconds:0,endSeconds:3}]}));const newId=create.receipts.find(r=>r.id)?.id;assert.ok(newId);ok(await e.api('POST',base+'/ai/apply',{id:create.id}));assert.ok(ok(await e.api('GET',base+'/timeline')).timeline.overlays.some(o=>o.id===newId),'adopt exactly the generated IDs');
 current=ok(await e.api('GET',base+'/timeline'));const stale=ok(await e.api('POST',base+'/ai/rehearse',{baseRev:current.rev,render:false,ops:[{op:'updateOverlay',id:'title',patch:{color:'#ff0000'}}]}));ok(await e.api('PUT',base+'/style',{patch:{mood:'温暖'}}));assert.equal((await e.api('POST',base+'/ai/apply',{id:stale.id})).status,409,'style update invalidates draft');
 // Empty projects can preview their first creation without pretending the old frame already contained it.
 const blank=ok(await e.api('POST','/api/projects',{name:'empty'})).id;
 const initial=ok(await e.api('GET','/api/p/'+blank+'/timeline'));const first=ok(await e.api('POST','/api/p/'+blank+'/ai/rehearse',{baseRev:initial.rev,ops:[{op:'addOverlay',text:'第一个画面',startSeconds:0,endSeconds:1}]}));assert.equal(first.canApply,true,JSON.stringify(first));
 console.log('PASS scoped context, read-only rendered rehearsal, scope/invalid rejection, exact draft apply, idempotence, stable generated IDs, style invalidation and first-scene creation');
}finally{await e.stop();}
