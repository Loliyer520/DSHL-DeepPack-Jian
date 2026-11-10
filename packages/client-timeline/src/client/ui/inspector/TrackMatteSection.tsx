import React from 'react';
import type { Clip, Overlay, Timeline } from '../../../../../engine/src/schema';
import { isMatteSource } from '../../../../../engine/src/timeline';
import { Field } from '../common';
import { Section, Toggle, useEdit } from './fields';
import type { Op } from '../../engine';
export function TrackMatteSection({item,timeline,clip=false}:{item:Overlay|Clip;timeline:Timeline;clip?:boolean}){
  const {commit}=useEdit();
  const spec=item.trackMatte;
  const set=(patch:Record<string,unknown>|null):Op[]=>[{op:clip?'updateClip':'updateOverlay',id:item.id,patch:{trackMatte:patch?{...spec,...patch}:null}}];
  const candidates=timeline.overlays.filter(o=>o.id!==item.id&&isMatteSource(o)&&o.group===(clip?undefined:(item as Overlay).group));
  return <Section title="轨道遮罩">
    <Field label="遮罩源"><select className="dj-select" value={spec?.source??''} onChange={e=>commit(set(e.target.value?{source:e.target.value}:null),'设置轨道遮罩')}><option value="">无</option>{candidates.map(o=><option key={o.id} value={o.id}>{o.name||o.text.slice(0,22)||o.id}</option>)}</select></Field>
    {spec&&<><Field label="采样方式"><select className="dj-select" value={spec.mode??'alpha'} onChange={e=>commit(set({mode:e.target.value}),'遮罩采样方式')}><option value="alpha">透明度（Alpha）</option><option value="luma">亮度（黑隐藏、白显示）</option></select></Field><Toggle label="反向遮罩" checked={spec.invert??false} onChange={v=>commit(set({invert:v}),'反向轨道遮罩')}/><Toggle label="隐藏遮罩源本身" checked={spec.hideSource!==false} onChange={v=>commit(set({hideSource:v}),'遮罩源显示')}/></>}
    <p className="dj-hint">使用同组的形状、纯文字、图片或图标揭示画面；源的位置和动画控制可见区域。源不在播放区间时，普通遮罩隐藏全部、反向遮罩显示全部。</p>
  </Section>;
}
