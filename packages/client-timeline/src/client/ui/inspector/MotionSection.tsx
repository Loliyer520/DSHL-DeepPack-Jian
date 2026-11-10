import React from 'react';
import type { Animations, ElementMask, GroupState, Overlay, Timeline } from '../../../../../engine/src/schema';
import type { Op } from '../../engine';
import { PathEditor } from './PathEditor';
import { GroupLayoutSection } from './LayoutSection';
import { MotionBlurSection } from './MotionBlurSection';
import { AnimationLibrarySection } from './AnimationLibrarySection';
import { CurveEditor } from './CurveEditor';
import { overlayTarget } from './TextInspector';
import { Field } from '../common';
import { AnimNumber, NumberField, Section, Toggle, useEdit, useInspectTime, type Target } from './fields';

function MaskFields({ mask, ops, target, fps, now, animate }: { mask?: ElementMask; ops: (mask: ElementMask | null) => Op[]; target: Target; fps: number; now: number; animate: (a: Animations, mask?: ElementMask) => Op[] }) {
  const { commit } = useEdit();
  const set = (patch: Partial<ElementMask>) => ops({ type: 'ellipse', ...mask, ...patch });
  return <Section title="羽化遮罩" extra={<button className="dj-chip" onClick={() => commit(ops(null), '清除遮罩')}>清除</button>}>
    <div className="dj-chips">{(['ellipse', 'rect', 'path'] as const).map((type, i) => <button className="dj-chip" key={type} onClick={() => commit(set({ type, ...(type === 'path' && !mask?.path ? { path: 'M 50 0 L 100 50 L 50 100 L 0 50 Z' } : {}) }), '设置遮罩')}>{['椭圆', '矩形', '自定义路径'][i]}</button>)}</div>
    {mask && <><div className="dj-chips" style={{marginTop:8}}>{['扩散显现','水平擦入','聚光扫过'].map((label,i)=><button className="dj-chip" key={label} onClick={()=>{
      const d=Math.min(1,target.duration), pair=(a:number,b:number)=>[{t:0,v:a,e:'inOut' as const},{t:d,v:b}];
      const anim: Animations = i===0 ? {maskW:pair(0,2),maskH:pair(0,2)} : i===1 ? {maskX:pair(-.5,.5)} : {maskX:[{t:0,v:-.3},{t:target.duration,v:1.3}]};
      const current={...target.animations};for(const k of ['maskX','maskY','maskW','maskH','maskFeather'] as const)delete current[k];
      commit(animate({...current,...anim},{...mask,type:i===1?'rect':'ellipse',x:.5,y:.5,w:i===2?.35:1,h:1}),label);
    }}>{label}</button>)}</div><div className="dj-grid">
      {(['x', 'y', 'w', 'h'] as const).map((key, i) => <AnimNumber target={target} fps={fps} now={now} channel={{x:"maskX",y:"maskY",w:"maskW",h:"maskH"}[key]} key={key} label={['中心 X', '中心 Y', '宽度', '高度'][i]} value={mask[key] ?? (i < 2 ? 0.5 : 1)} min={i < 2 ? -1 : 0.001} max={i < 2 ? 2 : 4} scale={100} suffix="%" step={0.01} staticOps={v => set({ [key]: v })} />)}
      <AnimNumber target={target} fps={fps} now={now} channel="maskFeather" label="羽化" value={mask.feather ?? 0} min={0} max={200} step={1} suffix="px" staticOps={v => set({ feather: v })} />
      <Toggle label="反向遮罩" checked={mask.invert ?? false} onChange={v => commit(set({ invert: v }), '反向遮罩')} />
    </div>{mask.type === 'path' && <><PathEditor value={mask.path??''} ops={path=>set({path})}/><Field label="SVG 路径（0–100）"><input className="dj-input" key={mask.path} defaultValue={mask.path} onBlur={e => commit(set({ path: e.target.value }), '遮罩路径')} /></Field></>}</>}
    <p className="dj-hint">只柔化可见区域的边缘，文字和图片内部保持清晰。遮罩坐标相对元素自身。</p>
  </Section>;
}

export function MotionSection({ o, fps, now, timeline }: { o: Overlay; fps: number; now: number; timeline: Timeline }) {
  const { commit } = useEdit();
  const patch = (value: Record<string, unknown>): Op[] => [{ op: 'updateOverlay', id: o.id, patch: value }];
  const path = o.motionPath;
  return <><Section title="路径运动" extra={<button className="dj-chip" onClick={() => commit(patch({ motionPath: null }), '清除路径运动')}>清除</button>}>
    <div className="dj-chips">{[
      ['弧线', 'M 0 0 Q 20 -35 40 0'], ['波浪', 'M 0 0 C 10 -30 30 30 40 0'], ['环绕', 'M 0 0 A 15 20 0 1 1 0 40 A 15 20 0 1 1 0 0'],
    ].map(([label, d]) => <button className="dj-chip" key={label} onClick={() => commit(patch({ motionPath: { ...path, path: d } }), '路径：' + label)}>{label}</button>)}</div>
    {path && <>
      <Field label="SVG 运动路径"><input className="dj-input" key={path.path} defaultValue={path.path} onBlur={e => commit(patch({ motionPath: { ...path, path: e.target.value } }), '编辑运动路径')} /></Field>
      <PathEditor key={o.id} value={path.path} ops={d=>patch({motionPath:{...path,path:d}})}/><Toggle label="沿路径自动转向" checked={path.autoRotate ?? false} onChange={v => commit(patch({ motionPath: { ...path, autoRotate: v } }), '路径转向')} />
      <AnimNumber target={overlayTarget(o)} fps={fps} now={now} channel="pathProgress" label="路径进度" value={Math.max(0, Math.min(1, (now - o.startSeconds) / (o.endSeconds - o.startSeconds)))} min={0} max={1} step={0.01} scale={100} suffix="%" staticOps={v => [{ op: 'setKeyframe', id: o.id, channel: 'pathProgress', t: 0, v }]} />
    </>}
    <p className="dj-hint">默认在元素时长内匀速走完整条路径；100 单位等于画布宽或高，M 0 0 是元素原位。用进度关键帧控制停顿、倒放和变速。</p>
  </Section><FollowFields o={o} timeline={timeline}/><MaskFields mask={o.mask} ops={mask => patch({ mask })} target={overlayTarget(o)} fps={fps} now={now} animate={(animations,mask)=>patch({animations,...(mask?{mask}:{})})} /></>;
}

export function GroupMotionSection({ group, timeline }: { group: string; timeline: Timeline }) {
  const { commit } = useEdit();
  const state = timeline.groups?.[group] ?? {};
  const now=useInspectTime(), members=timeline.overlays.filter(o=>o.group===group&&o.kind!=='camera');
  const start=Math.min(...members.map(o=>o.startSeconds)),end=Math.max(...members.map(o=>o.endSeconds));
  const target: Target={id:group,group,start,duration:end-start,animations:state.animations};
  const set = (patch: Partial<GroupState>): Op[] => [{ op: 'updateGroup', group, state: { ...state, ...patch } }];
  return <><Section title="组合整体动画" extra={<button className="dj-chip" onClick={() => commit([{ op: 'updateGroup', group, state: null }], '重置组合动画')}>重置</button>}>
    <div className="dj-chips">{[['fadeIn', '淡入'], ['popIn', '弹入'], ['flipInY', '整体翻入'], ['tilt3d', '立体摇摆'], ['spin3d', '三维自转'], ['springIn','弹簧入场']].map(([preset, label]) => <button key={preset} className="dj-chip" onClick={() => commit(set({ effects: [{ preset }] }), label)}>{label}</button>)}</div>
    <div className="dj-grid">
      <NumberField label="共同支点 X" value={state.pivotX ?? 0.5} min={-1} max={2} step={0.01} scale={100} suffix="%" ops={v => set({ pivotX: v })} />
      <NumberField label="共同支点 Y" value={state.pivotY ?? 0.5} min={-1} max={2} step={0.01} scale={100} suffix="%" ops={v => set({ pivotY: v })} />
      <NumberField label="整体旋转" value={state.rotate ?? 0} min={-3600} max={3600} step={1} suffix="°" ops={v => set({ rotate: v })} />
      <NumberField label="整体缩放" value={state.scale ?? 1} min={0} max={20} step={0.01} scale={100} suffix="%" ops={v => set({ scale: v })} />
      <NumberField label="整体不透明度" value={state.opacity ?? 1} min={0} max={1} step={0.01} scale={100} suffix="%" ops={v => set({ opacity: v })} />
    </div>
    <p className="dj-hint">整组围绕共同支点运动，默认支点在画布中心。成员保留自己的动画；组合按最上层成员的位置参与叠放。</p>
  </Section><GroupLayoutSection group={group} timeline={timeline}/><MotionBlurSection value={state.motionBlur} ops={v=>set({motionBlur:v??undefined})}/><AnimationLibrarySection target={target}/><CurveEditor target={target} fps={timeline.meta.fps} now={now}/><StaggerFields state={state} set={set}/><MaskFields target={target} fps={timeline.meta.fps} now={now} animate={(animations,mask)=>set({animations,...(mask?{mask}:{})})} mask={state.mask} ops={mask => [{ op: 'updateGroup', group, state: { ...state, mask: mask ?? undefined } }]} /></>;
}

function StaggerFields({state,set}:{state:GroupState;set:(patch:Partial<GroupState>)=>Op[]}){
  const {commit}=useEdit();const stagger=state.stagger;
  const change=(p:Partial<NonNullable<GroupState['stagger']>>)=>set({stagger:{interval:.15,...stagger,...p}});
  return <Section title="错峰入场" extra={<Toggle label="" checked={!!stagger} onChange={v=>commit(set({stagger:v?{interval:.15,preset:'springRise'}:undefined}),'错峰入场')}/>}>
    {stagger&&<><div className="dj-grid">
      <NumberField label="间隔" value={stagger.interval} min={0} max={5} step={.05} suffix="s" ops={v=>change({interval:v})}/>
      <NumberField label="单项时长" value={stagger.duration??.6} min={.05} max={10} step={.05} suffix="s" ops={v=>change({duration:v})}/>
      <Field label="顺序"><select className="dj-select" value={stagger.order??'forward'} onChange={e=>commit(change({order:e.target.value as 'forward'}),'错峰顺序')}><option value="forward">依图层顺序</option><option value="reverse">反向</option><option value="center">中心向两侧</option></select></Field>
      <Field label="入场效果"><select className="dj-select" value={stagger.preset??'riseUp'} onChange={e=>commit(change({preset:e.target.value}),'错峰效果')}>{[['riseUp','上浮'],['fadeIn','淡入'],['popIn','弹入'],['springRise','弹簧上浮'],['springIn','弹簧缩放'],['flipInY','侧翻']].map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></Field>
    </div><p className="dj-hint">错峰效果叠加在成员自己的动画上，不修改素材时间；超过组结束时间的成员不会显示。</p></>}
  </Section>;
}

function FollowFields({o,timeline}:{o:Overlay;timeline:Timeline}){
  const {commit}=useEdit();
  const candidates=timeline.overlays.filter(p=>p.id!==o.id&&p.kind!=='camera'&&p.group===o.group);
  const patch=(value:Record<string,unknown>):Op[]=>[{op:'updateOverlay',id:o.id,patch:value}];
  const opts=candidates.map(p=><option key={p.id} value={p.id}>{p.name||p.text.slice(0,24)||p.id}</option>);
  return <Section title="父子跟随">
    <Field label="跟随对象"><select className="dj-select" value={o.follow?.target??''} onChange={e=>commit(patch({follow:e.target.value?{...o.follow,target:e.target.value}:null}),'设置跟随')}><option value="">无</option>{opts}</select></Field>
    {o.follow&&<div className="dj-grid"><Toggle label="继承旋转" checked={o.follow.rotation??false} onChange={v=>commit(patch({follow:{...o.follow,rotation:v}}),'继承旋转')}/><Toggle label="继承缩放" checked={o.follow.scale??false} onChange={v=>commit(patch({follow:{...o.follow,scale:v}}),'继承缩放')}/></div>}
    <p className="dj-hint">默认保持现有排版偏移，只跟随位移。可多级绑定；对象需在同一组或均未分组。</p>
    {o.kind==='shape'&&['line','arrow','doubleArrow'].includes(o.shape?.type??'')&&<>
      <Field label="连接起点"><select className="dj-select" value={o.connector?.from??''} onChange={e=>commit(patch({connector:e.target.value?{from:e.target.value,to:o.connector?.to??candidates.find(p=>p.id!==e.target.value)?.id??e.target.value}:null}),'连接起点')}><option value="">无自动连接</option>{opts}</select></Field>
      {o.connector&&<><Field label="连接终点"><select className="dj-select" value={o.connector.to} onChange={e=>commit(patch({connector:{...o.connector,to:e.target.value}}),'连接终点')}>{opts}</select></Field>
      {(['fromAnchor','toAnchor'] as const).map((key,i)=><Field key={key} label={i?'终点锚点':'起点锚点'}><select className="dj-select" value={o.connector?.[key]??'center'} onChange={e=>commit(patch({connector:{...o.connector,[key]:e.target.value}}),'连接锚点')}>{[['center','中心'],['top','上边'],['bottom','下边'],['left','左边'],['right','右边']].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field>)}</>}
    </>}
  </Section>;
}
