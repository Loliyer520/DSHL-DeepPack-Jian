import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dj-visible-commit-'));process.env.DJIAN_DATA_DIR=dir;
const {Store}=await import('../packages/webui/server/store.mjs');
const {atomicWriteJsonAsync}=await import('../packages/webui/server/storage.mjs');
test.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
test('a failure after rename keeps memory aligned and retries return the visible durable receipt',async()=>{
 let fail=true;const store=new Store({writeCommit:async(file,value)=>{await atomicWriteJsonAsync(file,value);if(fail){fail=false;throw new Error('directory sync failure after rename');}}});
 const pid=store.create('commit test'),args={ops:[{op:'addOverlay',id:'x',text:'saved',startSeconds:0,endSeconds:2}],batchId:'retry'};
 await assert.rejects(store.apply(pid,args),/directory sync failure/);assert.equal(store.load(pid).rev,1);assert.equal(store.load(pid).timeline.overlays[0].text,'saved');
 const retry=await store.apply(pid,args);assert.equal(retry.duplicate,true);assert.equal(retry.rev,1);
 const next=await store.apply(pid,{ops:[{op:'addMarker',id:'marker',t:1}]});assert.equal(next.rev,2);await store.close();
});
