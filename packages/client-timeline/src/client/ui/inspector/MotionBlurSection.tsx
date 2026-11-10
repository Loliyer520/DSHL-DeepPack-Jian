import React from 'react';
import type { MotionBlurSpec } from '../../../../../engine/src/schema';
import type { Op } from '../../engine';
import { NumberField, Section, Toggle, useEdit } from './fields';
export function MotionBlurSection({value,ops}:{value?:MotionBlurSpec;ops:(v:MotionBlurSpec|null)=>Op[]}){
 const {commit}=useEdit();
 return <Section title="运动模糊" extra={<Toggle label="" checked={!!value} onChange={v=>commit(ops(v?{samples:8,shutterAngle:180}:null),'运动模糊')}/>}>
 {value&&<div className="dj-grid"><NumberField label="快门角度" value={value.shutterAngle??180} min={0} max={720} step={15} suffix="°" ops={v=>ops({...value,shutterAngle:v})}/><NumberField label="采样数" value={value.samples??8} min={2} max={16} step={1} digits={0} ops={v=>ops({...value,samples:Math.round(v)})}/></div>}
 <p className="dj-hint">多次时间采样合成移动轨迹。角度越大拖影越长；采样越多越细腻，预览与导出耗时也会增加。</p>
 </Section>;
}
