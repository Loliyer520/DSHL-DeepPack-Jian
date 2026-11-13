import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {openBrowser} from '@remotion/renderer';
import {startEngine} from '../helpers/engine.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'dj-gradient-ui-'));
const engine=await startEngine();let browser,server;
try{
 const bind=await engine.api('POST','/api/session-project',{sessionId:'ui-studio'}),pid=bind.body.project.id;
 const timeline={meta:{width:960,height:540,fps:30,background:'#101827'},overlays:[{id:'title',kind:'text',text:'多色渐变 GRADIENT',fontSize:72,color:'#fff',x:.5,y:.3,w:.9,h:.3,startSeconds:0,endSeconds:5},{id:'icon',kind:'icon',text:'',icon:{name:'star'},w:.2,h:.3,x:.5,y:.7,startSeconds:0,endSeconds:5}]};
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

 await page.evaluate(()=>window.__editor.sel.select({kind:'overlay',id:'title'}));
 await wait(()=>document.body.textContent.includes('极光渐变'));
 await click('极光渐变');
 await wait(()=>window.__editor.store.getSnapshot().timeline.overlays[0].textFill?.stops.length===3);
 const sectionClick=async(title,text)=>{
   const found=await page.evaluate(({title,text})=>{const heading=[...document.querySelectorAll('.dj-section h4')].find(h=>h.textContent===title);const section=heading?.closest('.dj-section');const button=[...(section?.querySelectorAll('button')??[])].find(b=>b.textContent?.trim()===text);button?.click();return !!button;},{title,text});assert.ok(found,title+': '+text);
 };
 await sectionClick('文字填充','添加色标');
 await wait(()=>window.__editor.store.getSnapshot().timeline.overlays[0].textFill.stops.length===4);
 await sectionClick('渐变关键帧','在播放头添加（0.00 s）');
 await wait(()=>window.__editor.store.getSnapshot().timeline.overlays[0].textFill.keyframes?.length===1);
 await page.evaluate(()=>window.__editor.clock.seek(2));
 await wait(()=>document.body.textContent.includes('在播放头添加（2.00 s）'));
 await sectionClick('渐变关键帧','在播放头添加（2.00 s）');
 await wait(()=>window.__editor.store.getSnapshot().timeline.overlays[0].textFill.keyframes?.length===2);
 await sectionClick('文字填充','纯色');
 await wait(()=>!window.__editor.store.getSnapshot().timeline.overlays[0].textFill);
 await wait(()=>window.__editor.store.getSnapshot().pending===0);
 await page.evaluate(()=>window.__editor.store.undo());
 await wait(()=>window.__editor.store.getSnapshot().timeline.overlays[0].textFill?.keyframes?.length===2);
 await page.evaluate(()=>window.__editor.sel.select({kind:'overlay',id:'icon'}));
 await wait(()=>document.body.textContent.includes('描边颜色'));
 await sectionClick('描边颜色','径向渐变');
 await wait(()=>window.__editor.store.getSnapshot().timeline.overlays[1].icon.strokeFill?.type==='radial');
 await sectionClick('描边颜色','添加色标');
 await wait(()=>window.__editor.store.getSnapshot().timeline.overlays[1].icon.strokeFill.stops.length===3);
 await wait(()=>window.__editor.store.getSnapshot().pending===0);
 const savedTimeline=await engine.api('GET',`/api/p/${pid}/timeline`);
 assert.equal(savedTimeline.body.timeline.overlays[1].icon.strokeFill.stops.length,3);
 const serious=errors.filter(e=>!String(e).includes('favicon'));assert.deepEqual(serious,[]);
 console.log('PASS gradient UI: presets, color stops, keyframes, solid reset, undo, icon gradient and server persistence');

}finally{if(browser)await browser.close({silent:true});if(server)await new Promise(r=>server.close(r));await engine.stop();fs.rmSync(tmp,{recursive:true,force:true});}
