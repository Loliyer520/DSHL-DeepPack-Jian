import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {once} from 'node:events';
import {startEngine} from './helpers/engine.mjs';
const good=r=>{assert.equal(r.status,200,JSON.stringify(r.body));return r.body;};
test('serialized durable commits, field conflict policy, crash recovery and persistent deduplication',async()=>{
 let e=await startEngine(),killed=false;const dir=e.dataDir;
 try{
  const pid=good(await e.api('POST','/api/session-project',{sessionId:'kernel'})).project.id,p='/api/p/'+pid,project=path.join(dir,'projects',pid);
  const first={ops:[{op:'addOverlay',id:'x',text:'first',startSeconds:0,endSeconds:3}],actor:'ai',clientId:'old-client',batchId:'stable-first'};
  const saved=good(await e.api('POST',p+'/ops',first));
  const conflictBase=saved.rev;
  good(await e.api('POST',p+'/ops',{ops:[{op:'updateOverlay',id:'x',patch:{text:'user'}}],clientId:'user'}));
  const independent=good(await e.api('POST',p+'/ops',{ops:[{op:'updateOverlay',id:'x',patch:{color:'#ff0000'}}],actor:'ai',clientId:'ai',baseRev:conflictBase,conflictPolicy:'reject'}));assert.equal(independent.conflicts.length,0);
  const blocked=await e.api('POST',p+'/ops',{ops:[{op:'updateOverlay',id:'x',patch:{text:'overwrite'}}],actor:'ai',clientId:'ai',baseRev:conflictBase,conflictPolicy:'reject'});assert.equal(blocked.status,409);assert.equal(blocked.body.code,'FIELD_CONFLICT');
  const requests=await Promise.all([.3,.4,.5].map((x,i)=>e.api('POST',p+'/ops',{ops:[{op:'updateOverlay',id:'x',patch:{x}}],batchId:'concurrent-'+i})));assert.ok(requests.every(r=>r.status===200));const revisions=requests.map(r=>r.body.rev);assert.equal(new Set(revisions).size,3);
  const before=good(await e.api('GET',p+'/timeline'));
  fs.renameSync(path.join(project,'commit.json'),path.join(project,'saved-commit.json'));fs.mkdirSync(path.join(project,'commit.json'));
  const failed=await e.api('POST',p+'/ops',{ops:[{op:'updateOverlay',id:'x',patch:{text:'must not publish'}}]});assert.equal(failed.status,500);assert.deepEqual(good(await e.api('GET',p+'/timeline')),before);
  fs.rmdirSync(path.join(project,'commit.json'));fs.renameSync(path.join(project,'saved-commit.json'),path.join(project,'commit.json'));
  const exit=once(e.child,'exit');e.child.kill('SIGKILL');await exit;killed=true;
  // Model a crash after authoritative commit but before the compatibility timeline/journal writes.
  fs.writeFileSync(path.join(project,'timeline.json'),JSON.stringify({broken:true}));fs.writeFileSync(path.join(project,'events.jsonl'),'');
  e=await startEngine({env:{DJIAN_DATA_DIR:dir}});killed=false;
  const recovered=good(await e.api('GET',p+'/timeline'));assert.deepEqual(recovered,before);
  const replay=good(await e.api('POST',p+'/ops',{...first,clientId:'new-client'}));assert.equal(replay.duplicate,true);assert.equal(replay.rev,saved.rev);assert.deepEqual(good(await e.api('GET',p+'/timeline')),before);
  const reused=await e.api('POST',p+'/ops',{...first,ops:[{op:'addMarker',t:1}]});assert.equal(reused.status,409);assert.equal(reused.body.code,'REQUEST_ID_REUSED');
  const next=good(await e.api('POST',p+'/ops',{ops:[{op:'addMarker',id:'last',t:2}]}));assert.equal(next.rev,before.rev+1);
  const compose={ids:['x'],name:'nested',actor:'ai',clientId:'one',batchId:'precompose-once',baseRev:next.rev,conflictPolicy:'reject'};const composed=good(await e.api('POST',p+'/precompose',compose));const again=good(await e.api('POST',p+'/precompose',{...compose,clientId:'two'}));assert.equal(again.duplicate,true);assert.equal(again.rev,composed.rev);assert.equal(good(await e.api('GET',p+'/timeline')).timeline.overlays.filter(o=>o.composition).length,1);
 }finally{if(!killed)await e.stop();fs.rmSync(dir,{recursive:true,force:true});}
});
