import React, {useState} from 'react';
import type {Fill,Overlay} from '../../../../../engine/src/schema';
import {useEditor} from '../../context';
import {Field,ScrubNumber} from '../common';
import {ColorField,Section,Seg,useEdit,useInspectTime} from './fields';
import {EasingField} from './EasingField';

export function FillField({ value, onChange, allowNone = true, gradientOnly = false }: { value: Fill | undefined; onChange: (f: Fill | null, label: string) => void; allowNone?: boolean; gradientOnly?: boolean }) {
  const mode = value === undefined ? 'none' : typeof value === 'string' ? 'solid' : value.type;
  const stops = typeof value === 'object' && value ? value.stops : [{ offset: 0, color: typeof value === 'string' ? value : '#3b82f6' }, { offset: 1, color: '#8b5cf6' }];
  const grad = (patch: { angle?: number; stops?: typeof stops; type?: 'linear' | 'radial' }) => ({ ...(typeof value==='object'&&value.keyframes?{keyframes:value.keyframes}:{}), type: patch.type ?? (typeof value === 'object' && value ? value.type : 'linear'), angle: patch.angle ?? (typeof value === 'object' && value?.angle !== undefined ? value.angle : 90), stops: patch.stops ?? stops });
  const opts: ['none' | 'solid' | 'linear' | 'radial', string][] = [['solid', '纯色'], ['linear', '线性渐变'], ['radial', '径向渐变']];
  if (gradientOnly) opts.shift();
  if (allowNone) opts.unshift(['none', '无']);
  return (
    <>
      <Seg label="填充方式" value={mode} options={opts} onChange={(m) => onChange(m === 'none' ? null : m === 'solid' ? stops[0].color : grad({ type: m }), '填充')} />
      <div className="dj-grid" style={{ marginTop: 8 }}>
        {mode === 'solid' && typeof value === 'string' && <ColorField label="颜色" value={value} onChange={(c) => onChange(c, '填充颜色')} />}
        {(mode === 'linear' || mode === 'radial') && <>
          {stops.map((stop, i) => <React.Fragment key={i}>
            <ColorField label={'色标 ' + (i + 1)} value={stop.color} onChange={(color) => onChange(grad({ stops: stops.map((s, j) => j === i ? { ...s, color } : s) }), '渐变颜色')} />
            <Field label="位置"><ScrubNumber value={stop.offset * 100} min={0} max={100} step={1} digits={0} suffix="%" label={'色标 ' + (i + 1) + ' 位置'} onCommit={(v) => onChange(grad({ stops: stops.map((s, j) => j === i ? { ...s, offset: v / 100 } : s) }), '渐变色标位置')} /></Field>
            {stops.length > 2 && <button type="button" className="dj-chip" onClick={() => onChange(grad({ stops: stops.filter((_, j) => j !== i) }), '删除渐变色标')}>删除色标 {i + 1}</button>}
          </React.Fragment>)}
          {stops.length < 8 && <button type="button" className="dj-chip" onClick={() => {
            let at = 0;
            for (let i = 1; i < stops.length - 1; i++) if (stops[i + 1].offset - stops[i].offset > stops[at + 1].offset - stops[at].offset) at = i;
            const added = { offset: (stops[at].offset + stops[at + 1].offset) / 2, color: stops[at].color };
            onChange(grad({ stops: [...stops.slice(0, at + 1), added, ...stops.slice(at + 1)] }), '添加渐变色标');
          }}>添加色标</button>}
          {mode === 'linear' && <Field label="角度"><ScrubNumber value={typeof value === 'object' && value ? value.angle ?? 0 : 0} step={5} min={-360} max={360} digits={0} suffix="°" label="渐变角度" onCommit={(v) => onChange(grad({ angle: v }), '渐变角度')} /></Field>}
        </>}
      </div>
    </>
  );
}


export function GradientFrames({o,fps}:{o:Overlay;fps:number}) {
  const now=useInspectTime(),{commit}=useEdit(),ed=useEditor();
  const channels: {id:string;label:string;fill?:Fill;patch:(fill:Fill)=>Record<string,unknown>}[] = o.kind==='icon' ? [
    {id:'stroke',label:'图标描边',fill:o.icon?.strokeFill,patch:fill=>({icon:{strokeFill:fill}})},
    {id:'fill',label:'图标填充',fill:o.icon?.fill,patch:fill=>({icon:{fill}})},
  ] : [
    ...(o.kind==='shape' ? [
      {id:'fill',label:'形状填充',fill:o.shape?.fill,patch:(fill:Fill)=>({shape:{fill}})},
      {id:'stroke',label:'形状描边',fill:o.shape?.stroke?.color,patch:(fill:Fill)=>({shape:{stroke:{...o.shape?.stroke,color:fill}}})},
    ] : []),
    {id:'textFill',label:'文字填充',fill:o.textFill,patch:fill=>({textFill:fill})},
    {id:'textStrokeFill',label:'文字描边',fill:o.textStrokeFill,patch:fill=>({textStrokeFill:fill})},
  ];
  const [channelId,setChannelId]=useState(channels[0].id),[selected,setSelected]=useState(0);
  const channel=channels.find(c=>c.id===channelId)??channels[0],fill=channel.fill;
  const choose=<Seg label="渐变通道" value={channel.id} options={channels.map(c=>[c.id,c.label])} onChange={id=>{setChannelId(id);setSelected(0);}}/>;
  if(!fill||typeof fill==='string')return <Section title="渐变关键帧">{choose}<p className="dj-hint">先将对应颜色设为渐变，再添加色标颜色、位置和角度关键帧。</p></Section>;
  const frames=fill.keyframes??[],index=Math.min(selected,Math.max(0,frames.length-1)),frame=frames[index];
  const t=Math.round(Math.max(0,Math.min(o.endSeconds-o.startSeconds,now-o.startSeconds))*fps)/fps;
  const ops=(next:typeof frames)=>[{op:'updateOverlay' as const,id:o.id,patch:channel.patch({...fill,keyframes:next})}];
  const set=(next:typeof frames,label:string)=>commit(ops(next),label);
  return <Section title="渐变关键帧">{choose}<button className="dj-chip" onClick={()=>{
    const next=[...frames.filter(f=>Math.abs(f.t-t)>.5/fps),{t,angle:frame?.angle??fill.angle??0,stops:structuredClone(frame?.stops??fill.stops),e:'linear' as const}].sort((a,b)=>a.t-b.t);set(next,'添加渐变关键帧');setSelected(next.findIndex(f=>f.t===t));
  }}>在播放头添加（{t.toFixed(2)} s）</button>
  {!!frames.length&&<><Field label="编辑关键帧"><select className="dj-select" value={index} onChange={e=>{const i=Number(e.target.value);setSelected(i);ed.clock.seek(o.startSeconds+frames[i].t);}}>{frames.map((f,i)=><option key={i} value={i}>{f.t.toFixed(2)} s</option>)}</select></Field>
    <FillField value={{type:fill.type,angle:frame.angle,stops:frame.stops}} allowNone={false} gradientOnly onChange={(value,label)=>{if(value&&typeof value!=='string')set(frames.map((f,i)=>i===index?{...f,angle:value.angle,stops:value.stops}:f),label);}}/>
    <EasingField label="到下一帧的缓动" value={frame.e} ops={e=>ops(frames.map((f,i)=>i===index?{...f,e}:f))}/>
    <button className="dj-chip" onClick={()=>set(frames.filter((_,i)=>i!==index),'删除渐变关键帧')}>删除当前帧</button></>}
    <p className="dj-hint">色标颜色、位置与角度自动插值，删除所有帧恢复静态渐变。</p>
  </Section>;
}
