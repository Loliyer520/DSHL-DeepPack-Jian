import React, {useEffect, useLayoutEffect, useRef, useState, useId} from 'react';
import type {Overlay} from './schema';
import {paintImage} from './paint';

const useMeasureEffect=typeof window==='undefined'?useEffect:useLayoutEffect;
/** Paint the actual HTML glyph alpha, retaining wrapping, fonts and per-character animation. */
export function TextPaint({ov,children}:{ov:Overlay;children:React.ReactNode}) {
  const ref=useRef<HTMLDivElement>(null);
  const [size,setSize]=useState({w:1,h:1});
  const id='dj-text-paint-'+useId().replace(/[^a-zA-Z0-9_-]/g,'');
  const enabled=!!(ov.textFill||ov.textStrokeFill);
  useMeasureEffect(()=>{
    if(!enabled||!ref.current)return;
    const {offsetWidth:w,offsetHeight:h}=ref.current;
    if(w>0&&h>0&&(size.w!==w||size.h!==h))setSize({w,h});
  });
  if(!enabled)return <>{children}</>;
  const {w,h}=size,sw=ov.stroke?.width??0;
  const stroke=!!ov.stroke&&sw>0;
  const strokeFill=ov.textStrokeFill??ov.stroke?.color;
  const pad=Math.max(2,sw+2);
  return <>
    <svg width="0" height="0" aria-hidden="true" style={{position:'absolute',pointerEvents:'none'}}><defs>
      <filter id={id} x={-pad/w} y={-pad/h} width={1+2*pad/w} height={1+2*pad/h} colorInterpolationFilters="sRGB">
        {stroke&&<>
          <feMorphology in="SourceAlpha" operator="dilate" radius={sw/2} result="outline-mask"/>
          <feImage href={paintImage(strokeFill!,w+2*pad,h+2*pad)} x={-pad} y={-pad} width={w+2*pad} height={h+2*pad} result="outline-paint"/>
          <feComposite in="outline-paint" in2="outline-mask" operator="in" result="outline"/>
        </>}
        {ov.textFill&&<>
          <feImage href={paintImage(ov.textFill,w,h)} x="0" y="0" width={w} height={h} result="fill-paint"/>
          <feComposite in="fill-paint" in2="SourceAlpha" operator="in" result="fill"/>
        </>}
        <feMerge>{stroke&&<feMergeNode in="outline"/>}<feMergeNode in={ov.textFill?'fill':'SourceGraphic'}/></feMerge>
      </filter>
    </defs></svg>
    <div ref={ref} data-djian-text-paint="true" style={{filter:`url(#${id})`+(ov.shadow===undefined&&ov.kind!=='text'&&ov.kind!=='shape'?' drop-shadow(0 2px 4px rgba(0,0,0,.85))':''),color:ov.textFill?'#ffffff':undefined,textShadow:'none',WebkitTextStroke:'0px transparent'}}>{children}</div>
  </>;
}
