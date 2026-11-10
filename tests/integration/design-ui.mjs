import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {openBrowser} from '@remotion/renderer';
import {startEngine} from '../helpers/engine.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'dj-studio-ui-'));
const engine=await startEngine();let browser,server;
try{
 const bind=await engine.api('POST','/api/session-project',{sessionId:'ui-studio'}),pid=bind.body.project.id;
 const timeline=JSON.parse(fs.readFileSync(path.join(root,'examples/design-studio.json'),'utf8'));
 const saved=await engine.api('PUT',`/api/p/${pid}/timeline`,{timeline});assert.equal(saved.status,200,JSON.stringify(saved.body));
 await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {Workspace} from './packages/client-timeline/src/client/Workspace';import {TimelineStore} from './packages/client-timeline/src/client/store';import {SelectionStore} from './packages/client-timeline/src/client/selection';import {EditorProvider,PlayerClock} from './packages/client-timeline/src/client/context';import {ALL_CSS} from './packages/client-timeline/src/client/styles';const style=document.createElement('style');style.textContent=ALL_CSS;document.head.append(style);const ed={store:new TimelineStore('ui-studio'),sel:new SelectionStore(),clock:new PlayerClock(),host:{visible:true}};window.__editor=ed;createRoot(document.getElementById('root')).render(<EditorProvider value={ed}><Workspace/></EditorProvider>);`,resolveDir:root,loader:'tsx'},bundle:true,outfile:path.join(tmp,'app.js'),define:{'process.env.NODE_ENV':'"production"'},logLevel:'silent'});
 server=http.createServer((req,res)=>{if(req.url==='/app.js'){res.setHeader('Content-Type','text/javascript');res.end(fs.readFileSync(path.join(tmp,'app.js')));}else{res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><head><meta charset="utf-8"><style>html,body,#root{height:100%;margin:0}body{background:#09111f}</style></head><body><div id="root"></div><script src="/app.js"></script></body></html>');}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await openBrowser('chrome',{headless:true});const errors=[];
 const page=await browser.newPage({context:()=>Promise.resolve(null),logLevel:'error',indent:false,pageIndex:0,onBrowserLog:entry=>{if(entry.type==='error')errors.push(entry.text);},onLog:()=>{}});
 page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});
 await page.goto({url:`http://127.0.0.1:${server.address().port}/#djian-engine=${engine.port}`,timeout:30000});
 const wait=async fn=>{for(let i=0;i<100;i++){if(await page.evaluate(fn))return;await new Promise(r=>setTimeout(r,100));}throw Error('UI did not reach expected state');};
 await wait(()=>window.__editor?.store.getSnapshot().status==='live');
 const click=async text=>{const found=await page.evaluate(text=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent?.trim()===text);if(!b)return false;b.click();return true;},text);assert.ok(found,'Missing UI button '+text);};
 await click('制作工具');await click('设计与审片');await click('品牌简洁');
 await wait(()=>window.__editor.store.getSnapshot().timeline?.design?.name==='品牌简洁');
 await click('海报');await wait(()=>window.__editor.store.getSnapshot().timeline.overlays[0].designRole==='heading');
 await new Promise(r=>setTimeout(r,1200));
 await click('生成真实画面对比');
 for(let i=0;i<180;i++){if(await page.evaluate(()=>document.querySelectorAll('img[alt="编辑叙事"]').length))break;await new Promise(r=>setTimeout(r,500));}
 assert.ok(await page.evaluate(()=>!!document.querySelector('img[alt="编辑叙事"]')),await page.evaluate(()=>document.body.innerText));
 const capture=await page._client().send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(root,'docs/screenshots/43-design-studio.png'),Buffer.from(capture.value.data,'base64'));
 await click('采用此方案');await wait(()=>window.__editor.store.getSnapshot().timeline?.design?.name==='编辑叙事');
 const base='/api/p/'+pid;
 const current=await engine.api('GET',base+'/timeline');
 const review=await engine.api('POST',base+'/design/submit',{baseRev:current.body.rev,items:[{message:'提高正文尺寸，便于移动端阅读',time:1,ops:[{op:'updateOverlay',id:'body',patch:{fontSize:36}}]}]});assert.equal(review.status,200,JSON.stringify(review.body));
 const preview=await engine.api('POST',base+'/design/preview',{id:review.body.id,indices:[0],time:1});assert.equal(preview.status,200,JSON.stringify(preview.body));assert.notEqual(preview.body.before,preview.body.after);
 const afterPreview=await engine.api('GET',base+'/timeline');assert.equal(afterPreview.body.rev,current.body.rev);
 await engine.api('POST',base+'/ops',{ops:[{op:'updateOverlay',id:'body',patch:{fontSize:40}}],actor:'user'});
 const stale=await engine.api('POST',base+'/design/apply',{id:review.body.id,indices:[0]});assert.equal(stale.status,409);
 const inspect=await engine.api('POST',base+'/design/inspect',{});assert.equal(inspect.status,200,JSON.stringify(inspect.body));assert.ok(inspect.body.sheet.startsWith('data:image/'));
 fs.writeFileSync(path.join(root,'docs/screenshots/44-design-review.jpg'),Buffer.from(inspect.body.sheet.split(',')[1],'base64'));
 const serious=errors.filter(e=>!String(e).includes('favicon'));assert.deepEqual(serious,[]);console.log('PASS design UI, three real variant frames, explicit adoption, review preview without mutation, stale review rejection and contact sheet');

}finally{if(browser)await browser.close({silent:true});if(server)await new Promise(r=>server.close(r));await engine.stop();fs.rmSync(tmp,{recursive:true,force:true});}
