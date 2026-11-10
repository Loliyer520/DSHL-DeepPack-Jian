import {protectDesignPatch} from './designLocks.js';
import {mainTrackStarts} from './timeline.js';
import type {Timeline,Overlay} from './schema.js';
import {designSchema,designSceneSchema} from './schema.js';
import {balancedTitle,measureText,fitText,cjkSpace} from './typography.js';
type Design=NonNullable<Timeline['design']>;
export const DESIGN_PRESETS:Record<string,Design>={
 editorial:{name:'编辑叙事',background:'#f3efe7',text:'#202522',muted:'#636960',accent:'#b64732',headingFont:'serif',bodyFont:'sans',baseSize:32,scale:1.8,margin:.08,columns:12,baseline:8},
 brand:{name:'品牌简洁',background:'#101827',text:'#f5f7fc',muted:'#a5b1c4',accent:'#55d9ca',headingFont:'sans',bodyFont:'sans',baseSize:32,scale:2,margin:.08,columns:12,baseline:8},
 kinetic:{name:'醒目海报',background:'#eee839',text:'#181818',muted:'#484822',accent:'#b42e63',headingFont:'qingke',bodyFont:'sans',baseSize:34,scale:2.4,margin:.06,columns:6,baseline:8}
};
export function activeDesignScene(t:Timeline,time:number){return Object.entries(t.designScenes??{}).find(([,s])=>time>=s.start&&time<s.end);}
export function effectiveDesign(t:Timeline,time:number):Design{return {...(t.design??DESIGN_PRESETS.editorial),...activeDesignScene(t,time)?.[1].design};}
const isText=(o:Overlay)=>['text','title','subtitle'].includes(o.kind??'text');
export function inferRoles(list:Overlay[]):Map<string,NonNullable<Overlay['designRole']>>{
 const text=list.filter(isText),roles=new Map<string,NonNullable<Overlay['designRole']>>();
 for(const o of text)if(o.designRole)roles.set(o.id,o.designRole);else if(o.kind==='title')roles.set(o.id,'heading');else if(o.kind==='subtitle')roles.set(o.id,'caption');
 for(const o of text.filter(o=>!roles.has(o.id))){const peers=text.filter(p=>p.startSeconds<o.endSeconds&&p.endSeconds>o.startSeconds).sort((a,b)=>b.fontSize-a.fontSize||list.indexOf(a)-list.indexOf(b));const explicit=peers.some(p=>roles.get(p.id)==='heading');const top=peers[0];roles.set(o.id,!explicit&&top.id===o.id?'heading':top&&o.fontSize>=top.fontSize*.5&&o.fontSize>Math.min(...peers.map(p=>p.fontSize))*1.15?'subheading':'body');}return roles;
}
export function designPatch(o:Overlay,d:Design):Record<string,unknown>{const role=o.designRole??(o.kind==='title'?'heading':o.kind==='subtitle'?'caption':'body'),heading=role==='heading',sub=role==='subheading';const fontSize=Math.round(d.baseSize*(heading?d.scale:sub?Math.sqrt(d.scale):role==='caption'?.75:1));return {designRole:role,color:role==='accent'?d.accent:role==='caption'?d.muted:d.text,fontFamily:heading?d.headingFont:d.bodyFont,fontSize,fontWeight:heading?700:sub?600:400,lineHeight:heading?1.2:1.5,typography:{...o.typography,cjkSpacing:true,keepNumbers:true,balance:heading},...(o.textFit?{textFit:{...o.textFit,preferredFontSize:fontSize}}:{})};}
export function designScope(t:Timeline,ids?:string[],time?:number):Overlay[]{const list=ids?.length?t.overlays.filter(o=>ids.includes(o.id)):t.overlays.filter(o=>time===undefined||o.startSeconds<=time&&o.endSeconds>time),groups=new Set(list.map(o=>o.group).filter(Boolean));return t.overlays.filter(o=>list.includes(o)||!!o.group&&groups.has(o.group));}
function styled(t:Timeline,list:Overlay[],designAt:(o:Overlay)=>Design){const roles=inferRoles(list);return list.filter(o=>o.designRole||isText(o)).map(o=>({op:'updateOverlay',id:o.id,patch:designPatch({...o,designRole:roles.get(o.id)??o.designRole},designAt(o))}));}
export function designOperations(t:Timeline,op:Record<string,unknown>):Record<string,unknown>[] {return rawDesignOperations(t,op).map(next=>{if(next.op!=='updateOverlay')return next;const o=t.overlays.find(o=>o.id===next.id);return o?{...next,patch:protectDesignPatch(o,next.patch as Record<string,unknown>)}:next;});}
function rawDesignOperations(t:Timeline,op:Record<string,unknown>):Record<string,unknown>[] {
 const sceneId=typeof op.sceneId==='string'?op.sceneId:undefined,scene=sceneId?t.designScenes?.[sceneId]:undefined;
 if(sceneId&&!scene&&op.op!=='setDesignScene')throw Error('场景不存在');
 const scope=designScope(t,Array.isArray(op.ids)?op.ids as string[]:undefined,typeof op.time==='number'?op.time:undefined),list=scene?scope.filter(o=>o.startSeconds>=scene.start&&o.endSeconds<=scene.end):scope;
 if(op.op==='setDesignScene'){
  const id=String(op.id??'');if(!/^[a-zA-Z0-9_-]{1,64}$/.test(id)||['__proto__','constructor','prototype'].includes(id))throw Error('无效场景 ID');
  if(op.preset&&!DESIGN_PRESETS[String(op.preset)])throw Error('未知设计预设');
  const previous=t.designScenes?.[id],value=designSceneSchema.parse({name:op.name??previous?.name??id,start:op.start??previous?.start,end:op.end??previous?.end,design:op.preset?DESIGN_PRESETS[String(op.preset)]:op.design??previous?.design??{}});
  for(const [key,s] of Object.entries(t.designScenes??{}))if(key!==id&&s.start<value.end&&s.end>value.start)throw Error('设计场景不能重叠');
  const next={...t,designScenes:{...t.designScenes,[id]:value}};return [{op:'putDesignScenes',scenes:next.designScenes},...styled(next,t.overlays.filter(o=>(o.startSeconds>=value.start&&o.endSeconds<=value.end)||(previous&&o.startSeconds>=previous.start&&o.endSeconds<=previous.end)),o=>effectiveDesign(next,o.startSeconds))];
 }
 if(op.op==='removeDesignScene'){const id=String(op.id),previous=t.designScenes?.[id];if(!previous)throw Error('场景不存在');const scenes={...t.designScenes};delete scenes[id];const next={...t,designScenes:scenes};return [{op:'putDesignScenes',scenes},...styled(next,t.overlays.filter(o=>o.startSeconds>=previous.start&&o.endSeconds<=previous.end),o=>effectiveDesign(next,o.startSeconds))];}
 const d=op.op==='setDesign'?designSchema.parse(op.design??DESIGN_PRESETS[String(op.preset)]):effectiveDesign(t,scene?.start??Number(op.time??list[0]?.startSeconds??0));
 if(op.op==='setDesign'){
  if(scene){const next={...t,designScenes:{...t.designScenes,[sceneId!]:{...scene,design:d}}};return [{op:'putDesignScenes',scenes:next.designScenes},...styled(next,list,()=>d)];}
  const next={...t,design:d};return [{op:'putDesign',design:d},{op:'setMeta',patch:{background:d.background}},...styled(next,list,o=>effectiveDesign(next,o.startSeconds))];
 }
 if(op.op==='bindDesignRole'){const o=t.overlays.find(o=>o.id===op.id);if(!o)throw Error('元素不存在');if(op.role!==null&&!['heading','subheading','body','caption','accent'].includes(String(op.role)))throw Error('未知设计角色');return [{op:'updateOverlay',id:o.id,patch:op.role===null?{designRole:null}:designPatch({...o,designRole:op.role as any},effectiveDesign(t,o.startSeconds))}];}
 if(op.op==='typesetText')return list.filter(isText).map(o=>({op:'updateOverlay',id:o.id,patch:{typography:{...o.typography,cjkSpacing:true,keepNumbers:true,balance:true},...(op.balance===false?{}:{text:balancedTitle(o.text)})}}));
 if(op.op!=='applyDesignLayout')throw Error('未知设计操作');
 const layout=String(op.layout??'editorial');if(!['editorial','split','poster','cards'].includes(layout))throw Error('未知版式');
 // Separate non-overlapping shots, so a project-wide operation does not stack unrelated scenes.
 const batches:Overlay[][]=[];for(const o of [...list].sort((a,b)=>a.startSeconds-b.startSeconds)){const batch=batches.find(b=>b.some(p=>p.startSeconds<o.endSeconds&&p.endSeconds>o.startSeconds));if(batch)batch.push(o);else batches.push([o]);}
 return batches.flatMap(batch=>adaptiveLayout(t,batch,layout,effectiveDesign(t,batch[0].startSeconds)));
}
function adaptiveLayout(t:Timeline,list:Overlay[],layout:string,d:Design):Record<string,unknown>[] {
 const W=t.meta.width,H=t.meta.height,mx=W*d.margin,my=H*d.margin,gap=Math.max(d.baseline,Math.min(W,H)*.028),roles=inferRoles(list),text=list.filter(isText).sort((a,b)=>({heading:0,subheading:1,body:2,accent:3,caption:4}[roles.get(a.id)??'body'])-({heading:0,subheading:1,body:2,accent:3,caption:4}[roles.get(b.id)??'body'])),media=list.filter(o=>['image','chart','plot','math'].includes(o.kind??'')),wide=W>=H,out:Record<string,unknown>[]=[];
 for(const group of new Set(list.map(o=>o.group).filter(Boolean)))if(t.groups?.[group!]?.layout){const {layout:_,...state}=t.groups[group!];out.push({op:'updateGroup',group,state});}
 let tx=mx,ty=my,tw=W-2*mx,th=H-2*my;
 let mediaBox={x:mx,y:H*.63,w:tw,h:H*.37-my};
 if(media.length){if(layout==='split'&&wide){tw=(W-2*mx-gap)*.48;mediaBox={x:mx+tw+gap,y:my,w:W-2*mx-tw-gap,h:H-2*my};}else{th=(H-2*my-gap)*.56;mediaBox={x:mx,y:my+th+gap,w:W-2*mx,h:H-2*my-th-gap};}}
 const cards=layout==='cards';
 if(cards&&text.length>1&&roles.get(text[0].id)==='heading'){
  const o=text.shift()!,p=designPatch({...o,designRole:'heading'},d),size=Number(p.fontSize),lineHeight=Number(p.lineHeight),h=Math.min(th*.32,measureText(o.text,size,tw,lineHeight).height+8),min=o.textFit?.minFontSize??18,fit=fitText(o.text,tw,h,size,min,o.textFit?.maxLines??5,o.textFit?.autoShrink??true,lineHeight,o.letterSpacing);
  out.push({op:'updateOverlay',id:o.id,patch:{...p,x:(tx+tw/2)/W,y:(ty+h/2)/H,w:tw/W,h:h/H,fontSize:fit.fontSize,align:'left',valign:'top',padding:0,autoSize:null,textFit:{minFontSize:min,maxLines:o.textFit?.maxLines??5,autoShrink:o.textFit?.autoShrink??true,preferredFontSize:fit.fontSize}}});ty+=h+gap;th-=h+gap;
 }
 const cols=cards?(wide?Math.min(3,text.length||1):Math.min(2,text.length||1)):1,rows=Math.ceil(text.length/cols),cellW=(tw-gap*(cols-1))/cols;
 const patches=text.map(o=>{const p=designPatch({...o,designRole:roles.get(o.id)},d);return {o,p,size:Number(p.fontSize),lineHeight:Number(p.lineHeight)};});
 const heightAt=(scale:number)=>patches.map(({o,size,lineHeight})=>measureText(o.typography?.cjkSpacing?cjkSpace(o.text):o.text,Math.max(o.textFit?.minFontSize??18,size*scale),cellW,lineHeight,o.letterSpacing).height+8);
 let scale=1,heights=heightAt(scale);
 const total=()=>cards?Array.from({length:rows},(_,r)=>Math.max(...heights.slice(r*cols,(r+1)*cols))).reduce((a,b)=>a+b,0)+gap*Math.max(0,rows-1):heights.reduce((a,b)=>a+b,0)+gap*Math.max(0,text.length-1);
 while(total()>th&&scale>.36){scale-=.02;heights=heightAt(scale);}
 // Equal row heights prevent neighboring cards of different text lengths from colliding.
 const rowH=cards?(th-gap*Math.max(0,rows-1))/Math.max(1,rows):0;
 let cursor=ty+(layout==='poster'?Math.max(0,(th-total())/2):0);
 patches.forEach(({o,p,size,lineHeight},i)=>{const h=cards?rowH:heights[i],x=tx+(cards?i%cols*(cellW+gap):0),y=cards?ty+Math.floor(i/cols)*(rowH+gap):cursor,min=o.textFit?.minFontSize??18,preferred=Math.max(min,Math.round(size*scale)),fit=fitText(o.text,cellW,h,preferred,min,o.textFit?.maxLines??(roles.get(o.id)==='heading'?5:20),o.textFit?.autoShrink??true,lineHeight,o.letterSpacing);out.push({op:'updateOverlay',id:o.id,patch:{...p,x:(x+cellW/2)/W,y:(y+h/2)/H,w:cellW/W,h:h/H,fontSize:fit.fontSize,align:layout==='poster'?'center':'left',valign:'top',padding:0,autoSize:null,textFit:{minFontSize:min,maxLines:o.textFit?.maxLines??(roles.get(o.id)==='heading'?5:20),autoShrink:o.textFit?.autoShrink??true,preferredFontSize:preferred}}});cursor+=h+gap;});
 media.forEach((o,i)=>{const cols=wide?Math.min(2,media.length):1,rows=Math.ceil(media.length/cols),w=(mediaBox.w-gap*(cols-1))/cols,h=(mediaBox.h-gap*(rows-1))/rows,x=mediaBox.x+(i%cols)*(w+gap),y=mediaBox.y+Math.floor(i/cols)*(h+gap);const ratio=o.image&&o.w&&o.h?o.w*W/(o.h*H):w/h,fitW=o.image?Math.min(w,h*ratio):w,fitH=o.image?fitW/ratio:h;out.push({op:'updateOverlay',id:o.id,patch:{x:(x+w/2)/W,y:(y+h/2)/H,w:fitW/W,h:fitH/H,...(o.image?{image:{...o.image,fit:o.image.fit??'contain'}}:{})}});});return out;
}
export function auditDesign(t:Timeline){const issues:{id?:string,time:number,message:string,ops:Record<string,unknown>[]}[]=[];for(const o of t.overlays){if(!isText(o))continue;const d=effectiveDesign(t,o.startSeconds);if(o.textFit&&o.w&&o.h){const fit=fitText(o.text,o.w*t.meta.width-2*(o.padding??0),o.h*t.meta.height-2*(o.padding??0),o.fontSize,o.fontSize,o.textFit.maxLines,false,o.lineHeight,o.letterSpacing);if(fit.overflow)issues.push({id:o.id,time:o.startSeconds,message:'文字在最小字号或行数限制下仍超出文本框，请扩大文本框或减少内容',ops:[]});}if(o.fontSize<24)issues.push({id:o.id,time:o.startSeconds,message:'文字小于 24px，需按目标屏幕检查可读性',ops:[{op:'updateOverlay',id:o.id,patch:{fontSize:24}}]});if(o.x!==undefined&&o.w!==undefined&&(o.x-o.w/2<d.margin-.01||o.x+o.w/2>1-d.margin+.01))issues.push({id:o.id,time:o.startSeconds,message:'文字超出设计安全边距',ops:[{op:'updateOverlay',id:o.id,patch:{x:.5,w:1-2*d.margin}}]});}return issues;}
export function sampleTimes(t:Timeline):number[]{const times=t.overlays.map(o=>(o.startSeconds+Math.min(o.endSeconds,o.startSeconds+3))/2),starts=mainTrackStarts(t);for(const c of t.videoTracks[0]?.clips??[]){const start=starts.get(c.id)??0;times.push(start+c.clipDuration/2);if(c.transition!=='none')times.push(start+Math.min(c.clipDuration/2,typeof c.transition==='object'?(c.transition.duration??.5)/2:.25));}return [...new Set(times.map(v=>Math.round(v*100)/100))].sort((a,b)=>a-b).slice(0,8);}
