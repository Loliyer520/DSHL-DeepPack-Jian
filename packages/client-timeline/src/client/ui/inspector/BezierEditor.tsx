import React, { useRef } from 'react';
import type { Easing } from '../../../../../engine/src/schema';
import { cubicBezier } from '../../../../../engine/src/timeline';
import type { Op } from '../../engine';
import { NumberField, useEdit } from './fields';

type Curve = [number,number,number,number];
export function BezierEditor({value,ops}:{value:Curve;ops:(e:Easing)=>Op[]}){
  const {preview,commit}=useEdit();
  const drag=useRef<{index:number;base:Curve;last:Curve}|null>(null);
  const x=(v:number)=>24+v*252,y=(v:number)=>160-v*112;
  const path=Array.from({length:101},(_,i)=>`${i?'L':'M'}${x(i/100)},${y(cubicBezier(...value)(i/100))}`).join(' ');
  const finish=(cancel=false)=>{const d=drag.current;if(!d)return;drag.current=null;if(cancel)preview(null);else commit(ops(d.last),'调整贝塞尔曲线');};
  return <>
    <svg viewBox="0 0 300 208" style={{width:'100%',touchAction:'none',background:'var(--dj-bg,#111827)',borderRadius:8}} aria-label="拖动贝塞尔控制点调整缓动"
      onPointerMove={e=>{const d=drag.current;if(!d)return;const r=e.currentTarget.getBoundingClientRect();const next=[...d.base] as Curve;next[d.index]=Math.max(0,Math.min(1,((e.clientX-r.left)/r.width*300-24)/252));next[d.index+1]=Math.max(-.4,Math.min(1.4,(160-(e.clientY-r.top)/r.height*208)/112));d.last=next;preview(ops(next));}}
      onPointerUp={()=>finish()} onPointerCancel={()=>finish(true)} onLostPointerCapture={()=>finish(true)}>
      <path d={`M24 48V160H276`} stroke="#475569" fill="none"/>
      <path d={`M24 160L${x(value[0])} ${y(value[1])} M276 48L${x(value[2])} ${y(value[3])}`} stroke="#64748b" fill="none"/>
      <path d={path} stroke="#38bdf8" strokeWidth="2.5" fill="none"/>
      {[0,2].map(index=><circle key={index} cx={x(value[index])} cy={y(value[index+1])} r={7} fill={index?'#c084fc':'#38bdf8'} tabIndex={0} role="slider" aria-label={'控制点 '+(index/2+1)} aria-valuetext={`${value[index].toFixed(2)}, ${value[index+1].toFixed(2)}`}
        onPointerDown={e=>{e.preventDefault();const svg=e.currentTarget.ownerSVGElement!;svg.setPointerCapture(e.pointerId);drag.current={index,base:[...value],last:[...value]};}}
        onKeyDown={e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const next=[...value] as Curve;const axis=e.key==='ArrowLeft'||e.key==='ArrowRight'?index:index+1;next[axis]+=(e.key==='ArrowLeft'||e.key==='ArrowDown'?-.02:.02);next[index]=Math.max(0,Math.min(1,next[index]));commit(ops(next),'调整贝塞尔控制点');}}/>)}
      <text x="24" y="192" fill="#94a3b8" fontSize="11">时间 →</text><text x="210" y="192" fill="#94a3b8" fontSize="11">进度 ↑</text>
    </svg>
    <div className="dj-grid">{value.map((v,i)=><NumberField key={i} label={['X1','Y1','X2','Y2'][i]} value={v} step={.02} min={i%2?-4:0} max={i%2?4:1} ops={v=>{const next=[...value] as Curve;next[i]=v;return ops(next);}}/>)}</div>
  </>;
}
