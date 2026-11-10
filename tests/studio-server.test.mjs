import test from 'node:test';
import assert from 'node:assert/strict';
import {startEngine} from './helpers/engine.mjs';
const engine=await startEngine();test.after(()=>engine.stop());
test('studio edits persist through HTTP, expose AI tooling, and preflight does not alter the revision',async()=>{
 const {api}=engine;const bind=await api('POST','/api/session-project',{sessionId:'studio'}),pid=bind.body.project.id;
 const ops=[{op:'addOverlay',id:'title',text:'This is far too much text to read in a short time',startSeconds:0,endSeconds:.2,x:.99,w:.5,h:.02,group:'card'},{op:'setTheme',preset:'paper'},{op:'bindStyle',id:'title',role:'heading'},{op:'saveComponent',name:'saved',group:'card'},{op:'instantiateComponent',name:'saved',id:'copy',startSeconds:3}];
 const r=await api('POST',`/api/p/${pid}/ops`,{ops});assert.equal(r.status,200,JSON.stringify(r.body));assert.ok(r.body.receipts.every(x=>x.status==='applied'),JSON.stringify(r.body.receipts));
 const check=await api('GET',`/api/p/${pid}/check`);assert.equal(check.status,200);assert.equal(check.body.rev,r.body.rev);assert.ok(check.body.issues.some(i=>i.code==='reading-speed'));
 const t=await api('GET',`/api/p/${pid}/timeline`);assert.equal(t.body.timeline.theme.name,'纸白');assert.ok(t.body.timeline.components.saved);assert.equal(t.body.rev,r.body.rev);
});
