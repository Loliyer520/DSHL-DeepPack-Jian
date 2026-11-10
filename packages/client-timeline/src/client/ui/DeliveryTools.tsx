import React,{useState} from 'react';
import {useEditor,useStore} from '../context';
import {request,type Op} from '../engine';
import {Section} from './inspector/fields';
import type {CheckIssue} from '../../../../engine/src/preflight';
import type {Proposal} from '../../../../engine/src/delivery';
type Report={rev:number;issues?:CheckIssue[];proposals:Proposal[];scope?:string;measurements?:Record<string,{integrated:number|null;truePeak:number|null}>};
export function DeliveryTools(){
 const ed=useEditor(),project=useStore(s=>s.project),rev=useStore(s=>s.rev),pending=useStore(s=>s.pending),[busy,setBusy]=useState(false),[error,setError]=useState(''),[report,setReport]=useState<Report|null>(null),[selected,setSelected]=useState<number[]>([]),[maxChars,setMaxChars]=useState(18),[keywords,setKeywords]=useState(''),[safeBottom,setSafeBottom]=useState(.12),[mode,setMode]=useState<'media'|'subtitles'|'audio'>('media');
 const path='/api/p/'+encodeURIComponent(project?.id??'');
 async function run(kind:typeof mode){setBusy(true);setError('');setMode(kind);setSelected([]);try{setReport(await request<Report>('POST',path+'/delivery/'+(kind==='subtitles'?'subtitles':'inspect'),{body:kind==='subtitles'?{maxChars,safeBottom,keywords:keywords.split(/[,，]/).map(s=>s.trim()).filter(Boolean)}:{audio:kind==='audio'},timeoutMs:300000}));}catch(e){setError(String(e));}finally{setBusy(false);}}
 const stale=!!report&&(report.rev!==rev||pending>0);
 async function apply(){if(!report||stale)return;setBusy(true);setError('');try{const ops=selected.flatMap(i=>report.proposals[i]?.ops??[]) as Op[];const r=await request<any>('POST',path+'/delivery/apply',{body:{ops,actor:'user',clientId:ed.store.clientId,baseRev:report.rev,conflictPolicy:'reject',label:mode==='subtitles'?'字幕精排':'音频质量修正'}});ed.store.recordExternalEdit(r.patch,r.inverse,mode==='subtitles'?'字幕精排':'音频质量修正');setSelected([]);}catch(e){setError(String(e));}finally{setBusy(false);}}
 return <Section title="交付质量工具"><div className="dj-chips"><button className="dj-chip" disabled={busy||pending>0} onClick={()=>void run('media')}>检查素材质量</button><button className="dj-chip" disabled={busy||pending>0} onClick={()=>void run('audio')}>实测音频响度</button></div>
 <p className="dj-hint">检查低清放大、留边、拉伸、字体及图片白底。音频测量源片段的 LUFS 和真峰值；目标人声 -16 LUFS、配乐 -23 LUFS，增益上限保留为 1，建议采用前请试听。</p>
 <div className="dj-grid"><label>每行字数<input aria-label="字幕每行字数" className="dj-input" type="number" min={6} max={40} value={maxChars} onChange={e=>setMaxChars(Number(e.target.value))}/></label><label>底部安全区<input aria-label="字幕底部安全区" className="dj-input" type="number" min={.05} max={.3} step={.01} value={safeBottom} onChange={e=>setSafeBottom(Number(e.target.value))}/></label></div>
 <label>强调关键词（逗号分隔）<input aria-label="字幕强调关键词" className="dj-input" value={keywords} onChange={e=>setKeywords(e.target.value)}/></label><button className="dj-chip" disabled={busy||pending>0} onClick={()=>void run('subtitles')}>预览字幕精排</button><p className="dj-hint">优先按标点、空格与词边界断行，避免标点落在行首；保留已有换行和富文本。超过两行时提示人工拆句。保护字段不会被修改。</p>
 {busy&&<p role="status">正在检查…</p>}{error&&<p role="alert">{error}</p>}{report&&<><p>{report.scope}</p>{stale&&<p role="status">项目已变化，请重新检查后采用建议。</p>}{report.issues?.map((i,n)=><button key={n} className="dj-chip" style={{display:'block',whiteSpace:'normal',textAlign:'left'}} onClick={()=>{ed.clock.seek(i.time);if(i.id&&ed.store.getSnapshot().timeline?.overlays.some(o=>o.id===i.id))ed.sel.select({kind:'overlay',id:i.id});}}>{i.severity==='error'?'错误':'提示'} · {i.id??'项目'}：{i.message}</button>)}
 {report.measurements&&Object.entries(report.measurements).map(([id,m])=><p key={id}>{id}：{m.integrated??'静音'} LUFS · {m.truePeak??'未知'} dBTP</p>)}
 {report.proposals?.map((p,i)=><div key={i} style={{borderTop:'1px solid #64748b44',padding:'10px 0'}}><label><input type="checkbox" disabled={busy||stale||!p.ops.length} checked={selected.includes(i)} onChange={e=>setSelected(e.target.checked?[...selected,i]:selected.filter(n=>n!==i))}/>{p.id}：{p.message}</label>{p.before!==undefined&&<div style={{display:'flex',gap:12}}><pre style={{whiteSpace:'pre-wrap',flex:1}}>原文：{p.before}</pre><pre style={{whiteSpace:'pre-wrap',flex:1}}>建议：{p.after}</pre></div>}{p.ops.length>0&&<details><summary>查看修改字段</summary><pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(p.ops,null,2)}</pre></details>}</div>)}
 {!report.proposals?.length&&!report.issues?.length&&<p>未发现对应问题或没有可处理的对象。</p>}{!!report.proposals?.length&&<button className="dj-btn" disabled={busy||stale||!selected.length} onClick={()=>void apply()}>采用所选质量建议</button>}</>}
 </Section>;
}
