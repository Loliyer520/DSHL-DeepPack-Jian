export const DELIVERY_TOOLS=[{
 name:'djian_delivery',
 description:'交付质量：preflight 检查导出前素材/字体/分辨率风险；inspect 采样检查图片白底，audio=true 时实测音频轨源片段 LUFS/真峰值，返回增益/淡入淡出/闪避建议；subtitles 按标点词边界断行、字幕安全区及关键词强调，返回预览建议。全部只读，采用返回 ops 前核对 rev，使用 djian_apply_ops。响度并非最终混音；不自动修改。',
 parameters:{type:'object',properties:{action:{type:'string',enum:['preflight','inspect','subtitles']},audio:{type:'boolean'},maxChars:{type:'integer',minimum:6,maximum:40},safeBottom:{type:'number',minimum:.05,maximum:.3},keywords:{type:'array',maxItems:20,items:{type:'string',maxLength:40}}},required:['action']},
 async execute(client,ctx,args){const url='/api/p/'+encodeURIComponent(ctx.projectId)+'/delivery/'+args.action;const r=args.action==='preflight'?await client.get(url):await client.post(url,args,{timeoutMs:300000});ctx.observe(r.rev);return {value:r,text:JSON.stringify(r)};}
}];
