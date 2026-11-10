import React from 'react';
import type { Overlay } from './schema';
import { particleFrame, type Quality } from './ambient';
export const RenderQuality=React.createContext<Quality>('full');
export const ReactiveLevel=React.createContext(0);
export const ReactiveTime=React.createContext(-1);
export function Ambient({ov,w,h,seconds}:{ov:Overlay;w:number;h:number;seconds:number}){
 const quality=React.useContext(RenderQuality),level=React.useContext(ReactiveLevel),position=React.useContext(ReactiveTime);
 return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>
 {ov.particles&&particleFrame(ov.particles,seconds,quality).map((p,i)=>ov.particles?.preset==='confetti'?<rect key={i} x={p.x*w} y={p.y*h} width={p.size*1.5} height={p.size} fill={p.color} opacity={p.opacity} transform={`rotate(${p.rotation} ${p.x*w} ${p.y*h})`}/>:ov.particles?.preset==='rain'?<line key={i} x1={p.x*w} x2={p.x*w-p.size} y1={p.y*h} y2={p.y*h+p.size*5} stroke={p.color} opacity={p.opacity} strokeWidth={Math.max(1,p.size/4)}/>:<circle key={i} cx={p.x*w} cy={p.y*h} r={p.size/2} fill={p.color} opacity={p.opacity}/>)}
 {ov.audioReactive?.waveform&&position>=0&&Array.from({length:48},(_,i)=>{const a=ov.audioReactive!, index=Math.floor(position*a.rate)+i-24, value=a.values[index]??0, height=Math.max(2,value*h*(.3+.7*level));return <rect key={i} x={i*w/48} y={(h-height)/2} width={w/64} height={height} rx={w/128} fill={ov.color}/>;})}
 </svg>;
}
