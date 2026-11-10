import fs from 'node:fs';
import {parseTimeline} from '../../packages/engine/dist/schema.js';
import {applyOps} from '../../packages/engine/dist/ops.js';
const apply=(t,ops)=>{const r=applyOps(t,ops);if(r.receipts.some(v=>v.status==='rejected'))throw new Error(JSON.stringify(r.receipts));return r.timeline;};
const text=(id,value,fontSize,startSeconds=0,endSeconds=5)=>({op:'addOverlay',id,kind:'text',text:value,fontSize,startSeconds,endSeconds,x:.5,y:.5,w:.8});
export function visualFixtures(){
 let landscape=apply(parseTimeline({meta:{width:1280,height:720,fps:30}}),[text('body','把复杂信息讲清楚，让每一屏都拥有清晰的阅读顺序。速度 120 km/h，画幅 16:9。',30),text('title','让内容决定版式\n让设计服务表达',72),text('sub','CONTENT FIRST · 2026',42),{op:'setDesign',preset:'editorial'},{op:'applyDesignLayout',layout:'editorial'}]);
 let portrait=apply(parseTimeline({meta:{width:720,height:1280,fps:30}}),[text('title','长短不同的文案\n也能有序呈现',64),...['清晰的主次关系','文字较长的第二张卡片，通过换行和字号适配保持完整内容。','数字与单位：120 km/h','最后一张卡片'].map((v,i)=>text('card'+i,v,28)),{op:'setDesign',preset:'brand'},{op:'applyDesignLayout',layout:'cards'}]);
 const scenes=apply(parseTimeline({meta:{width:960,height:540,fps:30}}),[text('one','第一幕：暖色叙事',64),text('two','第二幕：品牌表达',64,5,10),{op:'setDesign',preset:'editorial'},{op:'setDesignScene',id:'second',start:5,end:10,preset:'brand'},{op:'applyDesignLayout',layout:'poster'}]);
 const typography=apply(parseTimeline({meta:{width:960,height:540,fps:30}}),[text('fit','在有限空间中保持完整文案：中文 Typography，16:9，120 km/h。',64),{op:'setDesign',preset:'brand'},{op:'applyDesignLayout',layout:'editorial'},{op:'updateOverlay',id:'fit',patch:{h:.24,textFit:{minFontSize:20,maxLines:3,autoShrink:true,preferredFontSize:64}}}]);
 const effects=JSON.parse(fs.readFileSync(new URL('../../examples/element-appearance.json',import.meta.url),'utf8'));
 return [{id:'adaptive-landscape',timeline:landscape,time:1},{id:'adaptive-portrait',timeline:portrait,time:1},{id:'scene-warm',timeline:scenes,time:2},{id:'scene-brand',timeline:scenes,time:6},{id:'typography-fit',timeline:typography,time:1},{id:'native-shadows',timeline:effects,time:2}];
}
