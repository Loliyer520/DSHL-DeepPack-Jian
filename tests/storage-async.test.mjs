import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {atomicWriteJsonAsync} from '../packages/webui/server/storage.mjs';
test('async durable writes retry file contention without blocking timers and clean failed temporaries',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dj-write-')),target=path.join(dir,'state.json'),original=fs.promises.rename;let attempts=0,ticks=0;
 fs.writeFileSync(target,'{"old":true}');const timer=setInterval(()=>ticks++,5);
 try{
  fs.promises.rename=async(a,b)=>{if(b===target&&attempts++<2)throw Object.assign(new Error('busy'),{code:'EBUSY'});return original(a,b);};
  await atomicWriteJsonAsync(target,{new:true});assert.deepEqual(JSON.parse(fs.readFileSync(target)),{new:true});assert.ok(ticks>=5,'retry waits must yield to the event loop');
  fs.promises.rename=async()=>{throw Object.assign(new Error('disk error'),{code:'EIO'});};await assert.rejects(atomicWriteJsonAsync(target,{bad:true}),/disk error/);assert.deepEqual(JSON.parse(fs.readFileSync(target)),{new:true});assert.deepEqual(fs.readdirSync(dir),['state.json']);
 }finally{clearInterval(timer);fs.promises.rename=original;fs.rmSync(dir,{recursive:true,force:true});}
});
