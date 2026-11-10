import {OPS_PARAMETERS,OPS_DOC} from './ops-doc.js';
import {PUBLIC_OP_NAMES,OP_REGISTRY} from '../../engine/dist/operationRegistry.js';
const scope={ids:{type:'array',maxItems:100,items:{type:'string'}},time:{type:'number',minimum:0},start:{type:'number',minimum:0},end:{type:'number',minimum:0}};
export const COMPACT_OPS_PARAMETERS={type:'object',properties:{ops:{type:'array',minItems:1,maxItems:200,items:{type:'object',properties:{op:{type:'string',enum:PUBLIC_OP_NAMES}},required:['op'],additionalProperties:true}},requestId:OPS_PARAMETERS.properties.requestId,conflictPolicy:OPS_PARAMETERS.properties.conflictPolicy,label:OPS_PARAMETERS.properties.label},required:['ops']};
const imageResult=r=>{const {before,after,...summary}=r;return {value:summary,text:JSON.stringify(summary),...(after?{image:{data:Buffer.from(after.split(',')[1],'base64'),mediaType:'image/jpeg'}}:{})};};
export const AI_TOOLS=[{
 name:'djian_context',description:'按任务读取精简上下文：当前选中/播放头或指定 ids/时间段，包含分组、绑定依赖、素材元数据、设计锁和项目审美规范。task=text/layout/motion/audio/all。wholeProject=true 读取全项目，limit 默认30，截断会明示。需要未返回字段时读 djian_timeline full。',
 parameters:{type:'object',properties:{...scope,task:{type:'string',enum:['layout','text','motion','audio','all']},wholeProject:{type:'boolean'},limit:{type:'integer',minimum:1,maximum:100}}},
 async execute(client,ctx,args){const r=await client.post('/api/p/'+encodeURIComponent(ctx.projectId)+'/ai/context',args);ctx.observe(r.rev);return {value:r,text:JSON.stringify(r)};}
},{
 name:'djian_operation',description:'按需查询操作参数：names 指定最多5个操作名，返回规范参数结构、必需字段与相关用法。修改前不确定参数时查这里，避免每次携带完整操作手册。',
 parameters:{type:'object',properties:{names:{type:'array',minItems:1,maxItems:5,items:{type:'string',enum:PUBLIC_OP_NAMES}}},required:['names']},
 async execute(client,ctx,args){if(!Array.isArray(args.names)||!args.names.length||args.names.length>5||args.names.some(n=>!PUBLIC_OP_NAMES.includes(n)))throw Error('请选择 1–5 个公开操作');const names=args.names;const lines=OPS_DOC.split('\n');const relevant=lines.filter(line=>names.some(name=>line.includes(name+'{')));const r={operations:names.map(name=>OP_REGISTRY[name]),parameters:OPS_PARAMETERS.properties.ops.items,examples:relevant.slice(0,12),notes:'参数结构为公开操作共用超集；每个操作接受的字段以用法为准。时间为秒，位置尺寸为画布比例；批量先用 djian_rehearse 预演。'};return {value:r,text:JSON.stringify(r)};}
},{
 name:'djian_rehearse',description:'批量修改预演：action=preview 提交 ops、可选范围，先校验回执/设计锁/范围，在独立快照生成前后画面及受影响检查，不改项目。按差异自动选择静态/文字/动画检查，音量修改不渲染画面。action=show 用 id 看已存预演，view=before 看修改前。action=apply 用 id 采用已检查方案，校验版本、素材及审美规范；保留预演生成的元素 ID，可撤销。不通过时修正操作重新 preview。',
 parameters:{type:'object',properties:{action:{type:'string',enum:['preview','show','apply']},id:{type:'string'},view:{type:'string',enum:['before','after']},ops:COMPACT_OPS_PARAMETERS.properties.ops,...scope,label:{type:'string'},render:{type:'boolean'},maxFrames:{type:'integer',minimum:1,maximum:12}},required:['action']},
 async execute(client,ctx,args){const base='/api/p/'+encodeURIComponent(ctx.projectId)+'/ai/';if(args.action==='apply'){const r=await client.post(base+'apply',{id:args.id,clientId:ctx.clientId});ctx.observe(r.rev,r.changed);return {value:r,text:JSON.stringify(r)};}let r;if(args.action==='show')r=await client.post(base+'preview',{id:args.id});else{if(!Number.isInteger(ctx.lastSeenRev)){const current=await client.get('/api/p/'+encodeURIComponent(ctx.projectId)+'/timeline');ctx.observe(current.rev);}r=await client.post(base+'rehearse',{...args,baseRev:ctx.lastSeenRev},{timeoutMs:300000});ctx.observe(r.baseRev);}if(args.view==='before')r={...r,after:r.before};return imageResult(r);}
}];
