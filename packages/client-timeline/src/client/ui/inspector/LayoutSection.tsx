import React from 'react';
import type { GroupState, LayoutSpec, Overlay, Timeline } from '../../../../../engine/src/schema';
import type { Op } from '../../engine';
import { Field } from '../common';
import { NumberField, Section, Toggle, useEdit } from './fields';
export function AutoSizeSection({o,timeline}:{o:Overlay;timeline:Timeline}){
 const {commit}=useEdit(),supported=['shape','text','title','subtitle'].includes(o.kind??'subtitle');
 const patch=(p:Record<string,unknown>):Op[]=>[{op:'updateOverlay',id:o.id,patch:p}];
 return <Section title="内容尺寸与布局">{supported&&<><Toggle label="随文字调整尺寸" checked={!!o.autoSize} onChange={v=>commit(patch({autoSize:v?{maxWidth:.6,padding:16}:null}),'自动内容尺寸')}/>{o.autoSize&&<div className="dj-grid"><NumberField label="最大宽度" value={o.autoSize.maxWidth??.8} min={.01} max={4} scale={100} suffix="%" step={.01} ops={v=>patch({autoSize:{...o.autoSize,maxWidth:v}})}/><NumberField label="最小宽度" value={o.autoSize.minWidth??.04} min={.002} max={4} scale={100} suffix="%" step={.01} ops={v=>patch({autoSize:{...o.autoSize,minWidth:v}})}/><NumberField label="内边距" value={o.autoSize.padding??16} min={0} max={500} step={1} suffix="px" ops={v=>patch({autoSize:{...o.autoSize,padding:v}})}/></div>}</>}
 {o.group&&timeline.groups?.[o.group]?.layout&&<Toggle label="不参与组合自动排列" checked={o.layoutExclude??false} onChange={v=>commit(patch({layoutExclude:v}),'布局参与状态')}/>}
 <p className="dj-hint">自动尺寸按字号、字符宽度与换行计算；特殊字体可增加内边距，或关闭后手动微调。</p></Section>;
}
export function GroupLayoutSection({group,timeline}:{group:string;timeline:Timeline}){
 const {commit}=useEdit(),state=timeline.groups?.[group]??{},layout=state.layout;
 const save=(l:LayoutSpec|undefined):Op[]=>[{op:'updateGroup',group,state:{...state,layout:l}}];
 const change=(p:Partial<LayoutSpec>)=>save({...layout!,...p});
 const members=timeline.overlays.filter(o=>o.group===group&&o.kind!=='camera');
 return <Section title="组合自动布局" extra={<Toggle label="" checked={!!layout} onChange={v=>commit(save(v?{direction:'row',x:.5,y:.5,gap:16,padding:16}:undefined),'组合自动布局')}/>}>
 {layout&&<><Field label="排列方式"><select className="dj-select" value={layout.direction} onChange={e=>commit(change({direction:e.target.value as LayoutSpec['direction']}),'排列方式')}><option value="row">横排</option><option value="column">竖排</option><option value="grid">网格</option></select></Field>
 <div className="dj-grid">{(['x','y'] as const).map(k=><NumberField key={k} label={'中心 '+k.toUpperCase()} value={layout[k]??.5} min={-1} max={2} scale={100} suffix="%" step={.01} ops={v=>change({[k]:v})}/>)}<NumberField label="间距" value={layout.gap??16} min={0} max={1000} step={1} suffix="px" ops={v=>change({gap:v})}/><NumberField label="内边距" value={layout.padding??16} min={0} max={1000} step={1} suffix="px" ops={v=>change({padding:v})}/>{layout.direction==='grid'&&<NumberField label="列数" value={layout.columns??3} min={1} max={20} step={1} digits={0} ops={v=>change({columns:Math.round(v)})}/>}</div>
 {(['width','height'] as const).map(k=><React.Fragment key={k}><Toggle label={`固定${k==='width'?'宽':'高'}度`} checked={layout[k]!==undefined} onChange={v=>commit(change({[k]:v?.8:undefined}),'布局尺寸')}/>{layout[k]!==undefined&&<NumberField label={k==='width'?'宽度':'高度'} value={layout[k]!} min={.01} max={4} step={.01} scale={100} suffix="%" ops={v=>change({[k]:v})}/>}</React.Fragment>)}
 <Field label="交叉方向对齐"><select className="dj-select" value={layout.align??'center'} onChange={e=>commit(change({align:e.target.value as LayoutSpec['align']}),'布局对齐')}>{[['start','起始'],['center','居中'],['end','末尾'],['stretch','拉伸']].map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></Field>
 <Field label="主方向对齐"><select className="dj-select" value={layout.justify??'start'} onChange={e=>commit(change({justify:e.target.value as LayoutSpec['justify']}),'布局分布')}>{[['start','起始'],['center','居中'],['end','末尾'],['space-between','两端均分']].map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></Field>
 <Field label="随内容伸缩的背景"><select className="dj-select" value={layout.background??''} onChange={e=>commit(change({background:e.target.value||undefined}),'布局背景')}><option value="">无</option>{members.filter(o=>o.kind==='shape').map(o=><option key={o.id} value={o.id}>{o.name||o.text||o.id}</option>)}</select></Field></>}
 <p className="dj-hint">按图层顺序排列，背景不占排列位置。文字、字号或内容尺寸变化后自动重排；成员动画仍以新位置为起点。</p>
 </Section>;
}
