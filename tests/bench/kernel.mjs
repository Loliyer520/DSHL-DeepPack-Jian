import {performance} from 'node:perf_hooks';
import {parseTimeline} from '../../packages/engine/dist/schema.js';
import {applyOps} from '../../packages/engine/dist/ops.js';
const count=Number(process.env.BENCH_ELEMENTS??2000),edits=100;
const t=parseTimeline({meta:{fps:30,width:1920,height:1080},overlays:Array.from({length:count},(_,i)=>({id:'o'+i,text:'Element '+i,startSeconds:0,endSeconds:10,x:.5,y:.5}))});
const ops=Array.from({length:edits},(_,i)=>({op:'updateOverlay',id:'o'+(i%count),patch:{x:.25+i/1000}}));
applyOps(t,ops.slice(0,2));const times=[];
for(let i=0;i<3;i++){const start=performance.now();const r=applyOps(t,ops);if(r.receipts.some(r=>r.status==='rejected'))throw Error('benchmark failed');times.push(performance.now()-start);}
console.log(JSON.stringify({elements:count,edits,medianMs:times.sort((a,b)=>a-b)[1],runsMs:times,rssMB:Math.round(process.memoryUsage().rss/1048576)}));
