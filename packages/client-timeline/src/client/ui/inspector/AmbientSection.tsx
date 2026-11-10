import React, {useState} from 'react';
import type {Overlay} from '../../../../../engine/src/schema';
import {useStore} from '../../context';
import {engineBase} from '../../engine';
import {beatTimes} from '../../../../../engine/src/ambient';
import {mainTrackStarts} from '../../../../../engine/src/timeline';
import {Section,NumberField,Toggle,useEdit} from './fields';
export function AmbientSection({o}:{o:Overlay}){
 const timeline=useStore(s=>s.timeline),project=useStore(s=>s.project),{commit}=useEdit();
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const clips=[...(timeline?.audioTracks.flatMap(t=>t.clips)??[]),...(timeline?.videoTracks.flatMap(t=>t.clips.filter(c=>c.type!=='image'))??[])];
 const patch=(p:Record<string,unknown>)=>[{op:'updateOverlay',id:o.id,patch:p}];
 async function bind(id:string){
  if(!id){commit(patch({audioReactive:null}),'关闭音频驱动');return;}
  const clip=clips.find(c=>c.id===id);if(!clip||!project)return;
  setBusy(true);setError('');
  try{const response=await fetch(engineBase()+'/api/p/'+encodeURIComponent(project.id)+'/assets/'+encodeURIComponent(clip.src)+'/peaks');if(!response.ok)throw new Error('无法分析音轨，请检查素材是否有声音');
   const data=new Uint8Array(await response.arrayBuffer());if(data.length>720000)throw new Error('音轨超过两小时，请先使用较短素材');
   commit(patch({audioReactive:{source:id,src:clip.src,rate:Number(response.headers.get('X-Peaks-Rate'))||100,values:Array.from(data,v=>v/255),channel:'scale',amount:.3,smoothing:.08}}),'绑定音频驱动');
  }catch(e){setError(String(e));}finally{setBusy(false);}
 }
 return <><Section title="粒子效果" extra={<Toggle label="" checked={!!o.particles} onChange={v=>commit(patch({particles:v?{preset:'snow',count:100,seed:1}:null}),'粒子效果')}/>}>
 {o.particles&&<><select className="dj-select" value={o.particles.preset} onChange={e=>commit(patch({particles:{...o.particles,preset:e.target.value}}),'粒子预设')}>{[['snow','飘雪'],['stars','星光'],['rain','雨丝'],['confetti','彩纸'],['sparks','火星']].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><div className="dj-grid">{[['count','数量',100,1,600],['seed','随机种子',1,0,2147483647],['speed','速度',1,0,10],['size','尺寸',4,.2,100]].map(([key,label,value,min,max])=><NumberField key={key} label={String(label)} value={(o.particles as any)[key]??value} min={Number(min)} max={Number(max)} step={key==='speed'?.1:1} ops={v=>patch({particles:{...o.particles,[key]:v}})}/>)}</div></>}
 <p className="dj-hint">建议在空白形状上开启；区域跟随元素宽高，固定种子确保预览和导出一致。</p></Section>
 <Section title="音频驱动画面"><select className="dj-select" disabled={busy} value={o.audioReactive?.source??''} onChange={e=>void bind(e.target.value)}><option value="">关闭</option>{clips.map(c=><option key={c.id} value={c.id}>{c.src} · {c.id}</option>)}</select>
 {busy&&<p>正在读取波形…</p>}{error&&<p role="alert">{error}</p>}
 {o.audioReactive&&<><select className="dj-select" value={o.audioReactive.channel??'scale'} onChange={e=>commit(patch({audioReactive:{...o.audioReactive,channel:e.target.value}}),'驱动属性')}><option value="scale">缩放脉冲</option><option value="opacity">透明度</option><option value="rotation">旋转</option></select><NumberField label="强度" value={o.audioReactive.amount??.3} min={-360} max={360} step={.1} ops={v=>patch({audioReactive:{...o.audioReactive,amount:v}})}/><NumberField label="平滑秒数" value={o.audioReactive.smoothing??.08} min={0} max={2} step={.01} ops={v=>patch({audioReactive:{...o.audioReactive,smoothing:v}})}/><button className="dj-chip" onClick={()=>{const a=o.audioReactive!,clip=clips.find(c=>c.id===a.source);if(!clip||!timeline)return;const start='atSeconds' in clip?(clip.atSeconds??0):mainTrackStarts(timeline).get(clip.id)??0,duration='duration' in clip?clip.duration:clip.clipDuration;const times=beatTimes(a.values,a.rate).map(t=>(t-clip.inPoint)/clip.speed).filter(t=>t>=0&&t<duration).slice(0,500);commit(times.map(t=>({op:'addMarker',t:start+t,label:'音频起音'})),'添加起音标记');}}>添加起音标记</button><Toggle label="显示波形柱" checked={!!o.audioReactive.waveform} onChange={v=>commit(patch({audioReactive:{...o.audioReactive,waveform:v}}),'波形柱')}/></>}
 <p className="dj-hint">波形保存在项目中；素材裁剪、变速后仍按音轨位置取样。用于形状的波形柱会替代填充。</p></Section></>;
}
