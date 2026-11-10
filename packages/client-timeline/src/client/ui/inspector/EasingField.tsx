import React from 'react';
import type { Easing, SpringSpec } from '../../../../../engine/src/schema';
import { EASING_NAMES } from '../../../../../engine/src/timeline';
import type { Op } from '../../engine';
import { BezierEditor } from './BezierEditor';
import { Field } from '../common';
import { NumberField, useEdit } from './fields';

const labels: Record<string,string> = { linear:'匀速',in:'缓入',out:'缓出',inOut:'缓入缓出',bounce:'弹跳',elastic:'弹性',hold:'定格' };
export function EasingField({ value, ops, label = '缓动' }: { value?: Easing; ops: (easing: Easing) => Op[]; label?: string }) {
  const {commit}=useEdit();
  const spring=value && typeof value==='object' && !Array.isArray(value) ? value : undefined;
  const set=(patch: Partial<SpringSpec>)=>ops({type:'spring',...spring,...patch});
  return <><Field label={label}><select className="dj-select" value={spring?'spring':Array.isArray(value)?'custom':typeof value==='string'?value:'linear'} onChange={e=>commit(ops(e.target.value==='spring'?{type:'spring',stiffness:170,damping:18,mass:1}:e.target.value==='custom'?[.25,.1,.25,1]:e.target.value as Easing),'设置缓动')}>
    {EASING_NAMES.map(key=><option key={key} value={key}>{labels[key]??key}</option>)}
    <option value="spring">物理弹簧</option><option value="custom">贝塞尔曲线</option>
  </select></Field>{Array.isArray(value)&&<BezierEditor value={value} ops={ops}/>} {spring&&<div className="dj-grid">
    <NumberField label="刚度" value={spring.stiffness??170} min={1} max={1000} step={10} ops={v=>set({stiffness:v})}/>
    <NumberField label="阻尼" value={spring.damping??18} min={.1} max={100} step={1} ops={v=>set({damping:v})}/>
    <NumberField label="质量" value={spring.mass??1} min={.1} max={20} step={.1} ops={v=>set({mass:v})}/>
    <NumberField label="初速度" value={spring.velocity??0} min={-20} max={20} step={.5} ops={v=>set({velocity:v})}/>
  </div>}</>;
}
