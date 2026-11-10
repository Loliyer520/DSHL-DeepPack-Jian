import React, { useContext, useEffect, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AbsoluteFill, continueRender, delayRender, cancelRender, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Overlay, Timeline, TrackMatte } from './schema';
import { sharedSnapshot } from './sharedElements';
import { ShapeSvg, IconSvg } from './elements';
import { gradientOverlay } from './gradient';
import { resolveAnimations } from './presets';
import { evalKeyframes } from './timeline';
import { AssetResolver } from './renderContext';
import { overlayFontFamily } from './fonts';

export const MatteTimeline = React.createContext<Timeline | null>(null);
const escapeXml=(s:string)=>s.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]!));
const imageCache=new Map<string,Promise<string>>();
function embeddedImage(url:string):Promise<string>{
  if(url.startsWith('data:'))return Promise.resolve(url);
  let p=imageCache.get(url);if(!p){p=fetch(url).then(r=>{if(!r.ok)throw new Error('遮罩图片加载失败 '+r.status);return r.blob();}).then(blob=>new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);}));imageCache.set(url,p);p.catch(()=>imageCache.delete(url));}return p;
}
/** SVG matte uses actual shape contours and image pixels, independently of source visibility. */
export function matteImage(source:Overlay|undefined,t:Timeline,seconds:number,spec:TrackMatte,image?:string):string{
  const W=t.meta.width,H=t.meta.height;
  let content='';
  if(source && seconds>=source.startSeconds && seconds<source.endSeconds){
    const a=resolveAnimations(source,source.endSeconds-source.startSeconds),sec=seconds-source.startSeconds;
    const o=gradientOverlay(sharedSnapshot(source,{...t,groups:undefined},seconds),sec,a);
    const w=(o.w??.8)*W,h=o.h!==undefined?o.h*H:o.kind==='shape'||o.kind==='image'||o.kind==='icon'?w:o.fontSize*(o.lineHeight??1.3)*o.text.split('\n').length;
    const progress=evalKeyframes(a?.progress,sec)??1;
    let graphic='';
    if(o.kind==='shape'&&o.shape)graphic=renderToStaticMarkup(<ShapeSvg spec={o.shape} w={w} h={h} progress={progress} uid={'matte-'+o.id}/>);
    else if(o.kind==='icon')graphic=renderToStaticMarkup(<svg width={w} height={h}><IconSvg name={o.icon?.name} color={o.color} fill={o.icon?.fill} strokeWidth={o.icon?.strokeWidth} progress={progress}/></svg>);
    else if(o.kind==='image'&&image)graphic=`<svg width="${w}" height="${h}"><defs><clipPath id="round"><rect width="${w}" height="${h}" rx="${o.image?.radius??0}"/></clipPath></defs><image width="${w}" height="${h}" href="${escapeXml(image)}" preserveAspectRatio="${o.image?.fit==='fill'?'none':o.image?.fit==='contain'?'xMidYMid meet':'xMidYMid slice'}" clip-path="url(#round)"/></svg>`;
    else if(o.kind!=='image'){
      const align=o.align??'center',x=align==='left'?0:align==='right'?w:w/2;
      graphic=`<text font-family="${escapeXml(overlayFontFamily(o.fontFamily))}" font-size="${o.fontSize}" font-weight="${o.fontWeight??400}" font-style="${o.italic?'italic':'normal'}" fill="${escapeXml(o.color)}" text-anchor="${align==='left'?'start':align==='right'?'end':'middle'}">${o.text.split('\n').map((line,i)=>`<tspan x="${x}" y="${o.fontSize+(i*(o.lineHeight??1.3)*o.fontSize)}">${escapeXml(line)}</tspan>`).join('')}</text>`;
    }
    const angle=o.rotate??0;
    content=`<g transform="translate(${(o.x??.5)*W} ${(o.y??.5)*H}) rotate(${angle}) translate(${-w/2} ${-h/2})" opacity="${o.opacity??1}">${graphic}</g>`;
  }
  // Convert luminance to alpha first, then invert alpha if requested.
  const luma=spec.mode==='luma'?'<feColorMatrix result="luminance" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 .2126 .7152 .0722 0 0"/><feComposite in="luminance" in2="SourceAlpha" operator="in"/>':'';
  const inv=spec.invert?'<feComponentTransfer><feFuncA type="table" tableValues="1 0"/></feComponentTransfer>':'';
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><filter id="convert" x="0" y="0" width="${W}" height="${H}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"/>${luma}${inv}</filter></defs><g filter="url(#convert)"><rect width="100%" height="100%" fill="transparent"/>${content}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
export function TrackMatteLayer({spec,from,children}:{spec?:TrackMatte;from:number;children:React.ReactNode}){
  const timeline=useContext(MatteTimeline),resolve=useContext(AssetResolver);
  const seconds=(useCurrentFrame()+from)/useVideoConfig().fps;
  const source=spec?timeline?.overlays.find(o=>o.id===spec.source):undefined;
  const url=source?.kind==='image'&&source.image?resolve(source.image.src):undefined;
  const [loaded,setLoaded]=useState<{url:string;data:string}>();
  useEffect(()=>{if(!url)return;let alive=true;const handle=delayRender('加载轨道遮罩图片');embeddedImage(url).then(data=>{if(alive)setLoaded({url,data});continueRender(handle);},error=>{continueRender(handle);if(alive)cancelRender(error);});return()=>{alive=false;continueRender(handle);};},[url]);
  if(!spec||!timeline)return <>{children}</>;
  return <AbsoluteFill style={{maskImage:matteImage(source,timeline,seconds,spec,loaded && loaded.url===url?loaded.data:undefined),maskSize:'100% 100%',maskRepeat:'no-repeat'}}>{children}</AbsoluteFill>;
}
export function matteSources(t:Timeline):Set<string>{
  return new Set([...t.overlays,...t.videoTracks.flatMap(tr=>tr.clips)].flatMap(o=>o.trackMatte&&o.trackMatte.hideSource!==false?[o.trackMatte.source]:[]));
}
