import React, { useRef, useState } from 'react';
import type { Animations, Keyframe } from '../../../../../engine/src/schema';
import { ANIM_CHANNELS, evalKeyframes } from '../../../../../engine/src/timeline';
import type { Op } from '../../engine';
import { Field } from '../common';
import { CHANNEL_DEFAULT, NumberField, Section, useEdit, type Target } from './fields';
import { EasingField } from './EasingField';

const W=360,H=190,L=44,R=344,T=16,B=158;
export function curveEditOps(target: Target, channel: string, frame: Keyframe, time: number, value: number, fps: number): Op[] {
  const address=target.group?{group:target.group}:{id:target.id};
  const t=Math.round(Math.max(0,Math.min(target.duration,time))*fps)/fps;
  return [{op:'removeKeyframe',...address,channel,t:frame.t},{op:'setKeyframe',...address,channel,t,v:value,...(frame.e!==undefined?{e:frame.e}:{})}];
}
export function curveRange(frames: readonly Keyframe[]): [number,number] {
  const low=Math.min(0,...frames.map(k=>k.v)),high=Math.max(1,...frames.map(k=>k.v));
  const pad=Math.max(.05,(high-low)*.15);return [low-pad,high+pad];
}

export function CurveEditor({target,fps,now,labels={}}:{target:Target;fps:number;now:number;labels?:Record<string,string>}){
  const {preview,commit}=useEdit();
  const available=Object.keys(target.animations??{}) as (keyof Animations)[];
  const [chosen,setChosen]=useState<string>(available[0]??'opacity');
  const channel=chosen as keyof Animations;
  const frames=[...(target.animations?.[channel]??[])].sort((a,b)=>a.t-b.t);
  const [selectedTime,select]=useState<number>(0);
  const selected=frames.find(k=>Math.abs(k.t-selectedTime)<.5/fps)??frames.find(k=>k.t>=0)??frames[0];
  const drag=useRef<{frame:Keyframe;range:[number,number];nextTime:number;ops:Op[]}|null>(null);
  const [dragging,setDragging]=useState(false);
  const [lo,hi]=drag.current?.range??curveRange(frames);
  const duration=Math.max(1/fps,target.duration);
  const x=(t:number)=>L+t/duration*(R-L),y=(v:number)=>B-(v-lo)/(hi-lo)*(B-T);
  const address=target.group?{group:target.group}:{id:target.id};
  const sample=Array.from({length:181},(_,i)=>{const t=i/180*duration;return `${i?'L':'M'}${x(t)},${y(evalKeyframes(frames,t)??CHANNEL_DEFAULT[channel]??0)}`;}).join(' ');
  const coords=(e:React.PointerEvent<SVGSVGElement>|React.MouseEvent<SVGSVGElement>)=>{
    const r=e.currentTarget.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*W,py=(e.clientY-r.top)/r.height*H;
    return {t:Math.round(Math.max(0,Math.min(duration,(px-L)/(R-L)*duration))*fps)/fps,v:lo+(B-py)/(B-T)*(hi-lo)};
  };
  const finish=(cancel=false)=>{
    const d=drag.current;if(!d)return;drag.current=null;setDragging(false);
    if(cancel)preview(null);else {commit(d.ops,'调整动画曲线');select(d.nextTime);}
  };
  return <Section title="关键帧曲线">
    <Field label="动画通道"><select className="dj-select" value={channel} onChange={e=>{setChosen(e.target.value);select(0);}}>{ANIM_CHANNELS.filter(k=>k!=='volume'||available.includes('volume')).map(k=><option key={k} value={k}>{labels[k]??k}{available.includes(k)?' ·':''}</option>)}</select></Field>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="动画数值随时间变化曲线，拖动圆点修改关键帧" style={{width:'100%',background:'var(--dj-bg,#111827)',borderRadius:8,touchAction:'none',cursor:dragging?'grabbing':'default'}}
      onPointerMove={e=>{const d=drag.current;if(!d)return;const p=coords(e);d.nextTime=p.t;d.ops=curveEditOps(target,channel,d.frame,p.t,p.v,fps);preview(d.ops);}}
      onPointerUp={()=>finish()} onPointerCancel={()=>finish(true)} onLostPointerCapture={()=>finish(true)}
      onDoubleClick={e=>{if((e.target as SVGElement).tagName==='circle')return;const p=coords(e);commit([{op:'setKeyframe',...address,channel,t:p.t,v:p.v,e:'linear'}],'添加曲线关键帧');select(p.t);}}>
      {[0,.25,.5,.75,1].map(f=><g key={f}><line x1={L} x2={R} y1={T+f*(B-T)} y2={T+f*(B-T)} stroke="#334155" strokeWidth=".5"/><line x1={L+f*(R-L)} x2={L+f*(R-L)} y1={T} y2={B} stroke="#334155" strokeWidth=".5"/></g>)}
      <line x1={x(Math.max(0,Math.min(duration,now-target.start)))} x2={x(Math.max(0,Math.min(duration,now-target.start)))} y1={T} y2={B} stroke="#fbbf24" strokeDasharray="3 3"/>
      <path d={sample} stroke="#38bdf8" fill="none" strokeWidth="2"/>
      {frames.filter(k=>k.t>=0&&k.t<=duration).map((k,i)=><circle key={i} cx={x(k.t)} cy={y(k.v)} r={selected===k?6:5} fill={selected===k?'#fbbf24':'#38bdf8'} tabIndex={0} role="button" aria-label={`关键帧 ${k.t.toFixed(2)} 秒，值 ${k.v.toFixed(2)}`}
        onPointerDown={e=>{e.preventDefault();e.stopPropagation();e.currentTarget.ownerSVGElement!.setPointerCapture(e.pointerId);select(k.t);drag.current={frame:k,range:[lo,hi],nextTime:k.t,ops:[]};setDragging(true);}}
        onKeyDown={e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const t=k.t+(e.key==='ArrowLeft'?-1/fps:e.key==='ArrowRight'?1/fps:0),v=k.v+(e.key==='ArrowUp'?(hi-lo)/100:e.key==='ArrowDown'?-(hi-lo)/100:0);commit(curveEditOps(target,channel,k,t,v,fps),'微调关键帧');select(t);}}/>)}
      <text x={L} y={178} fill="#94a3b8" fontSize="10">0 s</text><text x={R} y={178} fill="#94a3b8" textAnchor="end" fontSize="10">{duration.toFixed(2)} s</text>
      <text x={L-6} y={T+4} fill="#94a3b8" textAnchor="end" fontSize="9">{hi.toFixed(2)}</text><text x={L-6} y={B} fill="#94a3b8" textAnchor="end" fontSize="9">{lo.toFixed(2)}</text>
    </svg>
    <div className="dj-chips"><button className="dj-chip" onClick={()=>{const t=Math.round(Math.max(0,Math.min(duration,now-target.start))*fps)/fps;commit([{op:'setKeyframe',...address,channel,t,v:evalKeyframes(frames,t)??CHANNEL_DEFAULT[channel]??0,e:'linear'}],'添加曲线关键帧');select(t);}}>在播放头添加</button>{selected&&<button className="dj-chip" onClick={()=>commit([{op:'removeKeyframe',...address,channel,t:selected.t}],'删除曲线关键帧')}>删除选中点</button>}</div>
    {selected&&<><div className="dj-grid">
      <NumberField label="时间" value={selected.t} min={0} max={duration} step={1/fps} digits={3} suffix="s" ops={t=>curveEditOps(target,channel,selected,t,selected.v,fps)}/>
      <NumberField label="数值" value={selected.v} step={.01} digits={3} ops={v=>curveEditOps(target,channel,selected,selected.t,v,fps)}/>
    </div><EasingField label="从选中点到下一点的缓动" value={selected.e} ops={e=>[{op:'setKeyframe',...address,channel,t:selected.t,v:selected.v,e}]}/></>}
    <p className="dj-hint">拖动圆点调整时间与数值，双击空白添加点；方向键可微调。重合时间点会合并。越过范围的数值由通道自动限制。</p>
  </Section>;
}
