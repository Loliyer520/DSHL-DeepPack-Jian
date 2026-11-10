import React from 'react';
import type { Overlay, Timeline } from '../../../../../engine/src/schema';
import { sharedPairs } from '../../../../../engine/src/sharedElements';
import { Field } from '../common';
import type { Op } from '../../engine';
import { NumberField, Section, useEdit } from './fields';
import { EasingField } from './EasingField';

export function SharedSection({o,timeline}:{o:Overlay;timeline:Timeline}){
  const {commit}=useEdit();
  const set=(patch:Partial<NonNullable<Overlay['shared']>>):Op[]=>[{op:'updateOverlay',id:o.id,patch:{shared:{key:o.shared?.key??o.id,...o.shared,...patch}}}];
  const pair=sharedPairs(timeline).find(p=>p.target.id===o.id);
  return <Section title="共享元素转场">
    <Field label="跨页匹配名称"><input className="dj-input" key={o.shared?.key??'none'} defaultValue={o.shared?.key??''} placeholder="例如 product-photo" list={'shared-'+o.id} onBlur={e=>{const key=e.target.value.trim();commit([{op:'updateOverlay',id:o.id,patch:{shared:key?{...o.shared,key}:null}}],'共享元素名称');}}/></Field>
    <datalist id={'shared-'+o.id}>{[...new Set(timeline.overlays.filter(x=>x.id!==o.id&&x.shared).map(x=>x.shared!.key))].map(key=><option key={key} value={key}/>)}</datalist>
    {o.shared&&<><NumberField label="转场时长" value={o.shared.duration??.6} min={.05} max={5} step={.05} suffix="s" ops={v=>set({duration:v})}/><EasingField value={o.shared.ease??'inOut'} ops={ease=>set({ease})}/></>}
    <p className="dj-hint">相邻两页中填写相同名称的元素会自动衔接位置、大小与外观。前一个元素的结束时间须与后一个的开始时间相接。</p>
    {o.shared&&<p className="dj-hint">{pair?'已匹配前一个元素：'+(pair.source.name||pair.source.text||pair.source.id):'当前元素作为起点，或尚未匹配到相接的前一个元素。手动变形、3D 和组遮罩优先使用原动画。'}</p>}
  </Section>;
}
