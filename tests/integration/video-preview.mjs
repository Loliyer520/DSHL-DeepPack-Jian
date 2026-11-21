import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {openBrowser} from '@remotion/renderer';
import {startEngine} from '../helpers/engine.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'dj-video-preview-'));
const engine=await startEngine();let browser,server;
try{
 const bind=await engine.api('POST','/api/session-project',{sessionId:'ui-studio'}),pid=bind.body.project.id;
 const assetsDir=path.join(engine.dataDir,'projects',pid,'assets');
 execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','testsrc2=size=320x240:rate=30:duration=6','-c:v','libx264','-pix_fmt','yuv420p','-g','60','-bf','3','-movflags','+faststart',path.join(assetsDir,'preview.mp4')]);
 const child={meta:{width:320,height:240,fps:24},overlays:[{id:'video',kind:'video',text:'',x:.5,y:.5,w:1,h:1,startSeconds:0,endSeconds:5,video:{src:'preview.mp4',inPoint:.5,speed:1,muted:true}}]};
 const timeline={meta:{width:960,height:540,fps:30},overlays:[{id:'comp',kind:'shape',text:'',x:.5,y:.5,w:.8,h:.8,startSeconds:0,endSeconds:3,composition:{name:'nested',timeline:JSON.stringify(child),inPoint:.5,speed:1,volume:1}}]};
 const saved=await engine.api('PUT',`/api/p/${pid}/timeline`,{timeline});assert.equal(saved.status,200,JSON.stringify(saved.body));
 await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {Workspace} from './packages/client-timeline/src/client/Workspace';import {TimelineStore} from './packages/client-timeline/src/client/store';import {SelectionStore} from './packages/client-timeline/src/client/selection';import {EditorProvider,PlayerClock} from './packages/client-timeline/src/client/context';import {ALL_CSS} from './packages/client-timeline/src/client/styles';const style=document.createElement('style');style.textContent=ALL_CSS;document.head.append(style);const ed={store:new TimelineStore('ui-studio'),sel:new SelectionStore(),clock:new PlayerClock(),host:{visible:true}};window.__editor=ed;createRoot(document.getElementById('root')).render(<EditorProvider value={ed}><Workspace/></EditorProvider>);`,resolveDir:root,loader:'tsx'},bundle:true,outfile:path.join(tmp,'app.js'),define:{'process.env.NODE_ENV':'"production"'},logLevel:'silent'});
 server=http.createServer((req,res)=>{if(req.url==='/app.js'){res.setHeader('Content-Type','text/javascript');res.end(fs.readFileSync(path.join(tmp,'app.js')));}else{res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><head><meta charset="utf-8"><style>html,body,#root{height:100%;margin:0}body{background:#09111f}</style></head><body><div id="root"></div><script src="/app.js"></script></body></html>');}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await openBrowser('chrome',{headless:true});const errors=[];
 const page=await browser.newPage({context:()=>Promise.resolve(null),logLevel:'error',indent:false,pageIndex:0,onBrowserLog:entry=>{if(entry.type==='error')errors.push(entry.text);},onLog:()=>{}});
 page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});
 await page.goto({url:`http://127.0.0.1:${server.address().port}/#djian-engine=${engine.port}`,timeout:30000});
 const wait=async fn=>{for(let i=0;i<100;i++){if(await page.evaluate(fn))return;await new Promise(r=>setTimeout(r,100));}throw Error(JSON.stringify(await page.evaluate(()=>{const v=document.querySelector('video');return {text:document.body.innerText.slice(-1000),time:v?.currentTime,seeking:v?.seeking,paused:v?.paused,clock:window.__editor.clock.time()};})));};
 await wait(()=>window.__editor?.store.getSnapshot().status==='live');
 const click=async text=>{const found=await page.evaluate(text=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent?.trim()===text);if(!b)return false;b.click();return true;},text);assert.ok(found,'Missing UI button '+text);};


 await wait(()=>{const v=document.querySelector('video');return v&&v.readyState>=2&&!v.seeking&&Math.abs(v.currentTime-1)<.1;});
 await page.evaluate(()=>{const v=document.querySelector('video');window.__video=v;window.__seeks=0;v.addEventListener('seeking',()=>window.__seeks++);window.__editor.clock.seek(.5);});
 await wait(()=>Math.abs(document.querySelector('video').currentTime-1.5)<.1&&!document.querySelector('video').seeking);
 await page.evaluate(()=>window.__editor.clock.play());
 await new Promise(r=>setTimeout(r,1000));
 const result=await page.evaluate(()=>{const v=document.querySelector('video');return {same:v===window.__video,seeks:window.__seeks,time:v.currentTime,paused:v.paused};});
 assert.equal(result.same,true,'decoder persists across nested clock frames');
 assert.ok(result.seeks<12,'continuous nested preview must not seek once per frame: '+JSON.stringify(result));
 assert.ok(result.time>2,'nested preview advances source frames: '+JSON.stringify(result));
 await page.evaluate(()=>window.__editor.clock.pause());
 await page.evaluate(()=>window.__editor.clock.seek(.2));
 await wait(()=>Math.abs(document.querySelector('video').currentTime-1.2)<.1&&!document.querySelector('video').seeking);
 await click('插入');
 await wait(()=>!!document.querySelector('[aria-label="插入元素"]'));
 await page.evaluate(()=>[...document.querySelectorAll('[aria-label="插入元素"] [role="tab"]')].find(b=>b.textContent.trim()==='视频').click());
 await wait(()=>!!document.querySelector('[aria-label="插入元素"] button[title="preview.mp4"]'));
 await page.evaluate(()=>document.querySelector('[aria-label="插入元素"] button[title="preview.mp4"]').click());
 await wait(()=>window.__editor.store.getSnapshot().timeline.overlays.some(o=>o.kind==='video'));
 await wait(()=>document.body.textContent.includes('视频素材'));
 await wait(()=>window.__editor.store.getSnapshot().pending===0);
 const reloaded=await engine.api('GET',`/api/p/${pid}/timeline`);
 assert.ok(reloaded.body.timeline.overlays.some(o=>o.video?.src==='preview.mp4'));
 const serious=errors.filter(e=>!String(e).includes('favicon'));assert.deepEqual(serious,[]);
 console.log('PASS nested preview: random seek, persistent decoder and continuous playback',result);

}finally{if(browser)await browser.close({silent:true});if(server)await new Promise(r=>server.close(r));await engine.stop();fs.rmSync(tmp,{recursive:true,force:true});}
