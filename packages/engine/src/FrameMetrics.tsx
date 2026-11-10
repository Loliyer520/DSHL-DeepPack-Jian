import React,{useEffect,useState} from 'react';
import {Artifact,continueRender,delayRender,useCurrentFrame} from 'remotion';
import type {Timeline} from './schema';
import type {FrameMeasurement,MeasuredElement,Rect} from './visualReview';

export function FrameMetrics({timeline}:{timeline:Timeline}){
 const frame=useCurrentFrame(),[handle]=useState(()=>delayRender('真实画面测量')),[content,setContent]=useState<string|null>(null);
 useEffect(()=>{let live=true;void(async()=>{
  await new Promise<void>(r=>requestAnimationFrame(()=>r()));await document.fonts.ready;await new Promise<void>(r=>requestAnimationFrame(()=>r()));
  if(!live)return;const stage=document.querySelector<HTMLElement>('[data-djian-stage]');if(!stage)throw new Error('画布节点不存在');const bounds=stage.getBoundingClientRect(),sx=timeline.meta.width/bounds.width,sy=timeline.meta.height/bounds.height;
  const rect=(r:DOMRect):Rect=>({x:(r.left-bounds.left)*sx,y:(r.top-bounds.top)*sy,w:r.width*sx,h:r.height*sy});
  const visibility=(el:Element)=>{let opacity=1,clipped=false,transformed=false;for(let p:Element|null=el;p&&p!==stage;p=p.parentElement){const s=getComputedStyle(p);opacity*=Number(s.opacity);if(s.visibility==='hidden'||s.display==='none')opacity=0;clipped ||= s.clipPath!=='none'||s.maskImage!=='none';transformed ||= s.transform!=='none';}return {opacity,clipped,transformed};};
  const nodes=Array.from(stage.querySelectorAll<HTMLElement>('[data-el]')).filter(el=>el.closest('[data-djian-stage]')===stage),elements:MeasuredElement[]=[];
  for(const el of nodes.slice(0,1000)){
   const id=el.dataset.el!,info=visibility(el),box=rect(el.getBoundingClientRect()),text=el.querySelector<HTMLElement>('[data-djian-text]');let textRect:Rect|undefined,lines=0,visibleFraction=1,fitFontSize:number|null|undefined;
   if(text&&text.closest('[data-el]')===el){
    const glyphs:DOMRect[]=[];let total=0,visible=0;const walker=document.createTreeWalker(text,NodeFilter.SHOW_TEXT);let node:Node|null;
    while((node=walker.nextNode())){const n=(node.textContent??'').trim().length;total+=n;if(node.parentElement&&visibility(node.parentElement).opacity>.1)visible+=n;const range=document.createRange();range.selectNodeContents(node);glyphs.push(...Array.from(range.getClientRects()).filter(r=>r.width>0&&r.height>0));}
    if(glyphs.length){const left=Math.min(...glyphs.map(r=>r.left)),top=Math.min(...glyphs.map(r=>r.top)),right=Math.max(...glyphs.map(r=>r.right)),bottom=Math.max(...glyphs.map(r=>r.bottom));textRect=rect(new DOMRect(left,top,right-left,bottom-top));const ys:number[]=[];for(const r of glyphs)if(!ys.some(y=>Math.abs(y-r.top)<2))ys.push(r.top);lines=ys.length;}
    visibleFraction=total?visible/total:0;
   }
   // Search using the real font and DOM line boxes instead of scaling an estimated height.
   const overlay=timeline.overlays.find(o=>o.id===id);
   if(text&&overlay&&textRect&&(textRect.h>box.h+2||textRect.w>box.w+2||lines>(overlay.textFit?.maxLines??Infinity))){
    const copy=text.cloneNode(true) as HTMLElement,css=getComputedStyle(text),paddingY=parseFloat(css.paddingTop)+parseFloat(css.paddingBottom),font=parseFloat(css.fontSize),lineHeight=parseFloat(css.lineHeight)/font;
    Object.assign(copy.style,{position:'absolute',inset:'auto',left:'-100000px',top:'0',height:'auto',width:text.clientWidth+'px',visibility:'hidden',transform:'none',lineHeight:Number.isFinite(lineHeight)?String(lineHeight):'normal'});
    document.body.appendChild(copy);fitFontSize=null;
    try{const fits=(size:number)=>{copy.style.fontSize=size+'px';const ys:number[]=[];const walker=document.createTreeWalker(copy,NodeFilter.SHOW_TEXT);let node:Node|null;while((node=walker.nextNode())){const range=document.createRange();range.selectNodeContents(node);for(const r of Array.from(range.getClientRects()))if(r.width&&r.height&&!ys.some(y=>Math.abs(y-r.top)<2))ys.push(r.top);}return copy.scrollHeight-paddingY<=el.clientHeight-paddingY+1&&copy.scrollWidth<=copy.clientWidth+1&&ys.length<=(overlay.textFit?.maxLines??Infinity);};let lo=Math.min(font,overlay.textFit?.minFontSize??18),hi=font;if(fits(lo)){for(let i=0;i<12;i++){const mid=(lo+hi)/2;if(fits(mid))lo=mid;else hi=mid;}fitFontSize=Math.floor(lo*10)/10;}}finally{copy.remove();}
   }
   elements.push({id,rect:box,...info,...(fitFontSize!==undefined?{fitFontSize}:{}),visibleFraction,lines,...(textRect?{textRect}:{})});
  }
  const result:FrameMeasurement={time:frame/timeline.meta.fps,width:timeline.meta.width,height:timeline.meta.height,elements,truncated:nodes.length>1000};setContent(JSON.stringify(result));
 })().catch(error=>{if(live)setContent(JSON.stringify({error:String(error)}));});return()=>{live=false;continueRender(handle);};},[frame,timeline,handle]);
 useEffect(()=>{if(content!==null)continueRender(handle);},[content,handle]);
 return content===null?null:<Artifact filename="djian-measurements.json" content={content}/>;
}
