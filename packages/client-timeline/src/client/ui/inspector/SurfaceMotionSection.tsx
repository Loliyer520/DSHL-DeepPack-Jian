import React from 'react';
import {AmbientSection} from './AmbientSection';
import type { Overlay } from '../../../../../engine/src/schema';
import type { Op } from '../../engine';
import { overlayTarget } from './TextInspector';
import { AnimNumber, ColorField, NumberField, Section, Toggle, useEdit } from './fields';
export function SurfaceMotionSection({o,fps,now}:{o:Overlay;fps:number;now:number}){
  const {commit}=useEdit(),target=overlayTarget(o),anim={target,fps,now};
  const patch=(p:Record<string,unknown>):Op[]=>[{op:'updateOverlay',id:o.id,patch:p}];
  const set=(p:Record<string,unknown>)=>patch({sweep:{...o.sweep,...p}});
  return <><AmbientSection o={o}/><Section title="表面扫光" extra={<Toggle label="" checked={!!o.sweep} onChange={v=>commit(v?[...patch({sweep:{color:'#ffffff',width:.25,softness:.65,opacity:.7,angle:20}}),{op:'setKeyframe',id:o.id,channel:'sweepProgress',t:0,v:0},{op:'setKeyframe',id:o.id,channel:'sweepProgress',t:target.duration,v:1}]:patch({sweep:null}),'表面扫光')}/>}>
    {o.sweep&&<div className="dj-grid"><ColorField label="高光颜色" value={o.sweep.color??'#ffffff'} onChange={v=>commit(set({color:v}),'高光颜色')}/><NumberField label="宽度" value={o.sweep.width??.25} min={.01} max={1} scale={100} suffix="%" step={.01} ops={v=>set({width:v})}/><NumberField label="柔和度" value={o.sweep.softness??.65} min={0} max={1} scale={100} suffix="%" step={.01} ops={v=>set({softness:v})}/><NumberField label="强度" value={o.sweep.opacity??.7} min={0} max={1} scale={100} suffix="%" step={.01} ops={v=>set({opacity:v})}/><NumberField label="角度" value={o.sweep.angle??20} min={-360} max={360} step={1} suffix="°" ops={v=>set({angle:v})}/><AnimNumber {...anim} channel="sweepProgress" label="扫光进度" value={o.sweep.position??.5} min={-1} max={2} step={.01} scale={100} suffix="%" staticOps={v=>set({position:v})}/></div>}
    <p className="dj-hint">高光按元素真实轮廓裁切，开启后自动从左扫到右，可通过进度关键帧改变节奏。</p>
  </Section>{o.kind==='shape'&&<Section title="渐变运动"><div className="dj-chips"><button className="dj-chip" onClick={()=>commit([{op:'setKeyframe',id:o.id,channel:'gradientAngle',t:0,v:0},{op:'setKeyframe',id:o.id,channel:'gradientAngle',t:target.duration,v:360}],'渐变旋转')}>旋转一周</button><button className="dj-chip" onClick={()=>commit([{op:'setKeyframe',id:o.id,channel:'gradientHue',t:0,v:0},{op:'setKeyframe',id:o.id,channel:'gradientHue',t:target.duration,v:360}],'渐变流色')}>流动色相</button></div><div className="dj-grid"><AnimNumber {...anim} channel="gradientAngle" label="角度偏移" value={0} step={1} suffix="°"/><AnimNumber {...anim} channel="gradientShift" label="色标偏移" value={0} min={-1} max={1} step={.01} scale={100} suffix="%"/><AnimNumber {...anim} channel="gradientHue" label="色相偏移" value={0} step={1} suffix="°"/></div><p className="dj-hint">作用于渐变填充和渐变描边。每个色标的颜色、位置可在形状页的「渐变关键帧」分别编辑。</p></Section>}</>;
}
