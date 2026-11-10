import {protectedDesignFields} from './designLocks.js';
import {cjkSpace,fitText} from './typography.js';
import type { Overlay, Timeline } from './schema.js';

/** Deterministic conservative text sizing, shared by server, editor and renderer. */
export function textSize(o: Overlay, canvasWidth: number, maxWidth?: number): {w:number;h:number} {
  const padding=o.autoSize?.padding??o.padding??12;
  const font=o.fontSize, spacing=(o.letterSpacing??0)*font;
  const max=Math.max(font+padding*2,Math.min((o.autoSize?.maxWidth??.8)*canvasWidth,maxWidth??Infinity));
  const min=Math.min(max,Math.max(font+padding*2,(o.autoSize?.minWidth??.04)*canvasWidth));
  let width=0,line=0,rows=1;
  for(const ch of (o.typography?.cjkSpacing?cjkSpace(o.text):o.text).replace(/\*\*|==|\[#[^\]]*\]|\[\/\]/g,'')){
    if(ch==='\n'){width=Math.max(width,line);line=0;rows++;continue;}
    const unit=ch==='\u2009'?.2:/\s/.test(ch)?.35:/[MW@#%]/.test(ch)?.9:/[ilI.,'!:;]/.test(ch)?.35:ch.codePointAt(0)!>0x2e80?1.08:.65;
    const advance=font*unit+spacing;
    if(line>0&&line+advance>max-padding*2){width=Math.max(width,line);line=0;rows++;}
    line+=advance;
  }
  return {w:Math.min(max,Math.max(min,Math.max(width,line)+padding*2)),h:Math.max(font,rows*font*(o.lineHeight??1.3))+padding*2};
}

/** Materialise constrained geometry so canvas selection, JSON and export agree. */
export function applyLayout(t: Timeline, affected?:{ids:Set<string>;groups:Set<string>}): Timeline {
  if(!t.overlays.some(o=>o.autoSize||o.textFit)&&!Object.values(t.groups??{}).some(g=>g.layout))return t;
  const W=t.meta.width,H=t.meta.height;
  const overlays=t.overlays.map(o=>!affected||affected.ids.has(o.id)||(o.group&&affected.groups.has(o.group))?{...o}:o);
  const size=(o:Overlay)=>({w:(o.w??.2)*W,h:o.h!==undefined?o.h*H:(o.w??.2)*W});
  const autosize=(o:Overlay,max?:number)=>{
    if(!o.autoSize||!['text','title','subtitle','shape'].includes(o.kind??'subtitle'))return;
    const s=textSize(o,W,max);o.w=s.w/W;o.h=s.h/H;o.padding=o.autoSize.padding??o.padding??12;
  };
  overlays.forEach(o=>{if(!affected||affected.ids.has(o.id)||(o.group&&affected.groups.has(o.group)))autosize(o);});
  for(const [group,state] of Object.entries(t.groups??{})){
    const l=state.layout;if(!l||(affected&&!affected.groups.has(group)))continue;
    const items=overlays.filter(o=>o.group===group&&o.kind!=='camera'&&!o.layoutExclude&&o.id!==l.background&&!o.connector&&!o.follow);
    if(!items.length)continue;
    const pad=l.padding??16,gap=l.gap??16,align=l.align??'center';
    const cols=l.direction==='grid'?Math.min(items.length,l.columns??3):l.direction==='row'?items.length:1;
    if(l.width!==undefined&&l.direction!=='row'){
      const cell=(l.width*W-pad*2-gap*(cols-1))/cols;
      items.forEach(o=>autosize(o,Math.max(1,cell)));
    }
    const dims=items.map(size),row=l.direction==='row',grid=l.direction==='grid';
    const colWidths=Array.from({length:cols},(_,c)=>Math.max(...dims.filter((_,i)=>i%cols===c).map(d=>d.w)));
    const rows=Math.ceil(items.length/cols),rowHeights=Array.from({length:rows},(_,r)=>Math.max(...dims.slice(r*cols,(r+1)*cols).map(d=>d.h)));
    const naturalW=row?dims.reduce((n,d)=>n+d.w,0)+gap*(items.length-1):grid?colWidths.reduce((n,v)=>n+v,0)+gap*(cols-1):Math.max(...dims.map(d=>d.w));
    const naturalH=row?Math.max(...dims.map(d=>d.h)):grid?rowHeights.reduce((n,v)=>n+v,0)+gap*(rows-1):dims.reduce((n,d)=>n+d.h,0)+gap*(items.length-1);
    const width=Math.max(pad*2+1,l.width!==undefined?l.width*W:naturalW+pad*2),height=Math.max(pad*2+1,l.height!==undefined?l.height*H:naturalH+pad*2);
    const left=(l.x??.5)*W-width/2+pad,top=(l.y??.5)*H-height/2+pad;
    const innerW=width-pad*2,innerH=height-pad*2;
    const spare=(row?innerW-naturalW:innerH-naturalH);
    const justify=l.justify??'start',lead=justify==='center'?spare/2:justify==='end'?spare:0;
    const stepGap=justify==='space-between'&&!grid&&items.length>1?gap+Math.max(0,spare)/(items.length-1):gap;
    const cross=(available:number,actual:number)=>align==='start'||align==='stretch'?0:align==='end'?available-actual:(available-actual)/2;
    let cursor=lead;
    items.forEach((o,i)=>{
      const d=dims[i];let x=left,y=top;
      if(grid){
        const c=i%cols,r=Math.floor(i/cols),cw=l.width!==undefined?(innerW-gap*(cols-1))/cols:colWidths[c];
        x+=l.width!==undefined?c*(cw+gap):colWidths.slice(0,c).reduce((n,v)=>n+v,0)+c*gap;
        y+=lead+rowHeights.slice(0,r).reduce((n,v)=>n+v,0)+r*(justify==='space-between'&&rows>1?gap+Math.max(0,spare)/(rows-1):gap);
        if(align==='stretch')d.w=Math.max(1,cw);else x+=cross(cw,d.w);
      }else if(row){x+=cursor;y+=cross(innerH,d.h);if(align==='stretch')d.h=innerH;cursor+=d.w+stepGap;}
      else {y+=cursor;x+=cross(innerW,d.w);if(align==='stretch')d.w=innerW;cursor+=d.h+stepGap;}
      o.x=(x+d.w/2)/W;o.y=(y+d.h/2)/H;o.w=d.w/W;o.h=d.h/H;
    });
    const background=overlays.find(o=>o.group===group&&o.id===l.background);
    if(background){background.x=l.x??.5;background.y=l.y??.5;background.w=width/W;background.h=height/H;}
  }
  for(const o of overlays)if((o.w!==undefined&&(o.w<.002||o.w>4))||(o.h!==undefined&&(o.h<.002||o.h>4))||(o.x!==undefined&&(o.x < -1 || o.x > 2))||(o.y!==undefined&&(o.y < -1 || o.y > 2)))throw new Error('自动布局超出画布坐标范围，请减小内容、间距或内边距');
  for(const o of overlays){if(!o.textFit||!o.w||!o.h||o.designLocks?.includes('fontSize'))continue;if(affected&&!affected.ids.has(o.id)&&!(o.group&&affected.groups.has(o.group)))continue;
    const fit=fitText(o.text,o.w*W-2*(o.padding??0),o.h*H-2*(o.padding??0),o.textFit.preferredFontSize??o.fontSize,o.textFit.minFontSize,o.textFit.maxLines,o.textFit.autoShrink,o.lineHeight??1.4,o.letterSpacing??0);o.fontSize=fit.fontSize;
  }
  overlays.forEach((o,i)=>{const old=t.overlays[i];if(o===old)return;for(const key of protectedDesignFields(old)){if(key==='text'||key==='typography')continue;if(key in old)(o as any)[key]=(old as any)[key];else delete (o as any)[key];}});
  let changed=false;overlays.forEach((o,i)=>{const old=t.overlays[i];if(Object.keys(o).length===Object.keys(old).length&&Object.keys(o).every(k=>Object.is((o as any)[k],(old as any)[k])))overlays[i]=old;else changed=true;});
  return changed?{...t,overlays}:t;
}
