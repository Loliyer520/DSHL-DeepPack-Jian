import {randomUUID} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
const p=id=>'/api/p/'+encodeURIComponent(id);
export async function postEdit(client,url,body){const requestId=body.batchId??randomUUID();try{return {...await client.post(url,{...body,batchId:requestId}),requestId};}catch(error){error.message+='；重试同一修改请复用 requestId='+requestId;throw error;}}
export async function ensureRevision(client,ctx){if(Number.isInteger(ctx.lastSeenRev))return ctx.lastSeenRev;const current=await client.get(p(ctx.projectId)+'/timeline');ctx.observe(current.rev);return current.rev;}
export const PROJECT_TOOLS=[{
 name:'djian_project_tools',
 description:'工程工具：precompose 将 ids 元素预合成；proxies 后台生成720p代理；cache 清理代理和取帧缓存；missing 检查缺失素材；relink 用 to 替换 from 的全部引用；queue 列出批量导出任务；retry/cancel 操作 jobId。嵌套合成可通过 updateOverlay 的 composition{ name,timeline:内部时间线JSON字符串,inPoint:0,speed:1,volume:1 } 继续编辑，最多4层。',
 parameters:{type:'object',properties:{action:{type:'string',enum:['precompose','proxies','cache','missing','relink','queue','retry','cancel']},ids:{type:'array',items:{type:'string'}},name:{type:'string'},from:{type:'string'},to:{type:'string'},jobId:{type:'string'},requestId:{type:'string',maxLength:80}},required:['action']},
 async execute(client,ctx,args){let result;const base=p(ctx.projectId),baseRev=['precompose','relink'].includes(args.action)?await ensureRevision(client,ctx):ctx.lastSeenRev;switch(args.action){case 'precompose':result=await postEdit(client,base+'/precompose',{ids:args.ids,name:args.name,actor:'ai',clientId:ctx.clientId,baseRev,batchId:args.requestId,conflictPolicy:'reject'});break;case 'proxies':result=await client.post(base+'/proxies',{});break;case 'cache':result=await client.request('DELETE',base+'/cache');break;case 'relink':result=await postEdit(client,base+'/relink',{from:args.from,to:args.to,actor:'ai',clientId:ctx.clientId,baseRev,batchId:args.requestId,conflictPolicy:'reject'});break;case 'retry':case 'cancel':result=await client.post('/api/export/'+encodeURIComponent(args.jobId)+'/'+args.action,{});break;default:result=await client.get(base+'/'+args.action);}if(Number.isInteger(result?.rev))ctx.observe(result.rev,result.changed);return {value:result,text:JSON.stringify(result)};}
},{
 name:'djian_batch',description:'用 CSV/JSON 对象数组批量填充当前工程中的 {{列名}} 占位文字/颜色/素材；_name 列指定输出名。enqueue=false 先验证并返回首条时间线，true 将最多100个快照加入串行导出队列，源工程不变。',
 parameters:{type:'object',properties:{text:{type:'string'},format:{type:'string',enum:['csv','json']},enqueue:{type:'boolean'},scale:{type:'number',enum:[.5,1,2]},quality:{type:'string',enum:['draft','standard','high']}},required:['text']},
 async execute(client,ctx,args){const result=await client.post(p(ctx.projectId)+'/batch',args,{timeoutMs:60000});return {value:result,text:JSON.stringify(result)};}
}];

PROJECT_TOOLS.push({
 name:'djian_project_archive',description:'把当前工程、引用素材与字体保存为本地 .djproj 便携工程包，或从 .djproj 导入为新工程。path 必须是绝对路径；导出拒绝覆盖已有文件，素材总量最多128MB。',
 parameters:{type:'object',properties:{action:{type:'string',enum:['export','import']},path:{type:'string'}},required:['action','path']},
 async execute(client,ctx,args){if(!path.isAbsolute(args.path??''))throw new Error('path 必须为绝对路径');
  if(args.action==='export'){const response=await client.get(p(ctx.projectId)+'/archive',{raw:true,timeoutMs:300000});const data=Buffer.from(await response.arrayBuffer());await fs.writeFile(args.path,data,{flag:'wx'});return {value:{path:args.path,bytes:data.length},text:'已保存工程包：'+args.path};}
  const stat=await fs.stat(args.path);if(stat.size>128*1024*1024)throw new Error('工程包超过128MB');const data=await fs.readFile(args.path);const base=await client.discover();const response=await fetch(base+'/api/projects/import-archive',{method:'POST',headers:{'X-Djian-Client':client.clientId},body:data,signal:AbortSignal.timeout(300000)});const result=await response.json();if(!response.ok)throw new Error(result.error??'导入失败');return {value:result,text:'已导入为新工程 '+result.id+'。原会话仍绑定原工程。'};
 }
});
