import React from 'react';
import type {Fill} from './schema';

export function Paint({fill,id}:{fill:Fill;id:string}) {
  if(typeof fill==='string') return null;
  const stops=fill.stops.map((s,i)=><stop key={i} offset={s.offset} stopColor={s.color}/>);
  if(fill.type==='radial') return <radialGradient id={id} cx="50%" cy="50%" r="60%">{stops}</radialGradient>;
  const a=(fill.angle??0)*Math.PI/180,c=Math.cos(a)/2,s=Math.sin(a)/2;
  return <linearGradient id={id} x1={.5-c} y1={.5-s} x2={.5+c} y2={.5+s}>{stops}</linearGradient>;
}
const xml=(s:string)=>s.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]!));
/** Self-contained paint image: identical gradient coordinates for HTML glyphs and SVG. */
export function paintImage(fill:Fill,w:number,h:number):string {
  let defs='',color=typeof fill==='string'?xml(fill):'url(#paint)';
  if(typeof fill!=='string'){
    const stops=fill.stops.map(s=>`<stop offset="${s.offset}" stop-color="${xml(s.color)}"/>`).join('');
    const a=(fill.angle??0)*Math.PI/180,c=Math.cos(a)/2,s=Math.sin(a)/2;
    defs=fill.type==='radial'?`<radialGradient id="paint" cx="50%" cy="50%" r="60%">${stops}</radialGradient>`:`<linearGradient id="paint" x1="${.5-c}" y1="${.5-s}" x2="${.5+c}" y2="${.5+s}">${stops}</linearGradient>`;
  }
  return 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs><rect width="100%" height="100%" fill="${color}"/></svg>`);
}
