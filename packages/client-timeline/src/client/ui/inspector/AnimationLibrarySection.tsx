import React, { useState } from 'react';
import type { Timeline } from '../../../../../engine/src/schema';
const EMPTY_LIBRARY: NonNullable<Timeline['animationLibrary']> = {};
import { useStore } from '../../context';
import { Field } from '../common';
import { Section, Toggle, useEdit, type Target } from './fields';

export function AnimationLibrarySection({target}:{target:Target}){
  const library=useStore(s=>s.timeline?.animationLibrary??EMPTY_LIBRARY),{commit}=useEdit();
  const [name,setName]=useState(''),[selected,setSelected]=useState(''),[original,setOriginal]=useState(false),[merge,setMerge]=useState(false);
  const chosen=Object.hasOwn(library,selected)?selected:Object.keys(library)[0]??'';
  const address=target.group?{group:target.group}:{id:target.id};
  return <Section title="我的动画片段">
    <Field label="片段名称"><input className="dj-input" value={name} maxLength={64} placeholder="例如：卡片弹入" onChange={e=>setName(e.target.value)}/></Field>
    <button className="dj-chip" disabled={!name.trim()} onClick={()=>{commit([{op:'saveAnimation',...address,name:name.trim()}],library[name.trim()]?'更新动画片段':'保存动画片段');setSelected(name.trim());}}>保存当前动画{library[name.trim()]?'（覆盖同名）':''}</button>
    {chosen&&<><Field label="已保存片段"><select className="dj-select" value={chosen} onChange={e=>setSelected(e.target.value)}>{Object.entries(library).map(([key,v])=><option value={key} key={key}>{key} · {v.duration.toFixed(2)} s</option>)}</select></Field>
    <Toggle label="保留原节奏（关闭则适配目标时长）" checked={original} onChange={setOriginal}/><Toggle label="保留目标其他动画通道" checked={merge} onChange={setMerge}/>
    <div className="dj-chips"><button className="dj-chip" onClick={()=>commit([{op:'applyAnimation',...address,name:chosen,fit:original?'original':'stretch',merge}],'应用动画片段')}>应用到当前对象</button><button className="dj-chip" onClick={()=>commit([{op:'removeAnimation',name:chosen}],'删除动画片段')}>删除片段</button></div></>}
    <p className="dj-hint">片段随项目保存，包含关键帧和展开后的动画预设，可用于元素、视频和组合；不包含形状或文字内容。</p>
  </Section>;
}
