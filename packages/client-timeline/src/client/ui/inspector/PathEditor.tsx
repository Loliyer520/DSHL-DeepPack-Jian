import React, { useEffect, useRef, useState } from 'react';
import { parsePath, toPathD, type SubPath, type Pt } from '../../../../../engine/src/paths';
import { appendPathNode, movePathPoint, pathBounds, removePathNode, splitPathSegment, type PathPoint } from '../../../../../engine/src/pathEdit';
import type { Op } from '../../engine';
import { useEdit, Toggle } from './fields';

export function PathEditor({value,ops}:{value:string;ops:(path:string)=>Op[]}){
  const {preview,commit}=useEdit(),paths=parsePath(value);
  const [selected,select]=useState<PathPoint>({sub:0,node:0,part:'anchor'}),[mirror,setMirror]=useState(false);
  const drag=useRef<{point:PathPoint;base:SubPath[];bounds:ReturnType<typeof pathBounds>;ops:Op[]}|null>(null);
  const bounds=drag.current?.bounds??pathBounds(paths);
  const svg=useRef<SVGSVGElement>(null);
  useEffect(()=>()=>{if(drag.current)preview(null);},[]);
  const finish=(cancel=false)=>{const d=drag.current;if(!d)return;drag.current=null;if(cancel)preview(null);else commit(d.ops,'编辑路径节点');};
  const point=(e:{clientX:number;clientY:number}):Pt=>{const matrix=svg.current?.getScreenCTM();if(!matrix)return [0,0];const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());return [Math.round(p.x*100)/100,Math.round(p.y*100)/100];};
  const begin=(e:React.PointerEvent,p:PathPoint)=>{e.preventDefault();e.stopPropagation();select(p);svg.current!.setPointerCapture(e.pointerId);drag.current={point:p,base:paths,bounds,ops:[]};};
  const unit=Math.max(bounds.w,bounds.h)/100;
  const drawPoint=(p:Pt,id:PathPoint)=> <circle key={`${id.sub}-${id.node}-${id.part}`} cx={p[0]} cy={p[1]} r={id.part==='anchor'?unit*1.8:unit*1.2} fill={id.sub===selected.sub&&id.node===selected.node&&id.part===selected.part?'#fbbf24':id.part==='anchor'?'#38bdf8':'#c084fc'} tabIndex={0} role="button" aria-label={`${id.part==='anchor'?'节点':'控制柄'} ${id.node+1}`} onPointerDown={e=>begin(e,id)} onKeyDown={e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const step=e.shiftKey?5:1;const next:Pt=[p[0]+(e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0),p[1]+(e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0)];commit(ops(toPathD(movePathPoint(paths,id,next,mirror))),'微调路径节点');}}/>;
  return <>
    <svg ref={svg} viewBox={`${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}`} style={{width:'100%',height:230,background:'var(--dj-bg,#111827)',borderRadius:8,touchAction:'none'}} aria-label="路径节点编辑器" onPointerMove={e=>{const d=drag.current;if(!d)return;d.ops=ops(toPathD(movePathPoint(d.base,d.point,point(e),mirror)));preview(d.ops);}} onPointerUp={()=>finish()} onPointerCancel={()=>finish(true)} onLostPointerCapture={()=>finish(true)} onDoubleClick={e=>{if((e.target as SVGElement).tagName==='circle')return;commit(ops(toPathD(appendPathNode(paths,point(e)))),'添加路径节点');}}>
      <path d={toPathD(paths)} fill="none" stroke="#38bdf8" strokeWidth={unit*.8}/>
      {paths.map((s,sub)=><g key={sub}>{s.segs.map((seg,i)=>{const from=i?s.segs[i-1].p:s.start;return <g key={i}><path d={`M${from}L${seg.c1} M${seg.p}L${seg.c2}`} fill="none" stroke="#64748b" strokeWidth={unit*.3}/>{drawPoint(seg.c1,{sub,node:i,part:'c1'})}{drawPoint(seg.c2,{sub,node:i,part:'c2'})}</g>;})}{[s.start,...s.segs.map(x=>x.p)].map((p,node)=>drawPoint(p,{sub,node,part:'anchor'}))}</g>)}
    </svg>
    <div className="dj-chips">{!paths.length&&<button className="dj-chip" onClick={()=>commit(ops("M0,50 L100,50"),"新建路径")}>新建路径</button>}<button className="dj-chip" onClick={()=>commit(ops(toPathD(splitPathSegment(paths,selected.sub,selected.part==='anchor'?Math.max(0,selected.node-1):selected.node))),'拆分路径线段')}>在线段中间加点</button><button className="dj-chip" disabled={selected.part!=='anchor'||(paths[selected.sub]?.segs.length??0)<2} onClick={()=>{commit(ops(toPathD(removePathNode(paths,selected.sub,selected.node))),'删除路径节点');select({...selected,node:0});}}>删除节点</button><button className="dj-chip" onClick={()=>commit(ops(toPathD(paths.map((s,i)=>i===selected.sub?{...s,closed:!s.closed}:s))),'路径闭合')}>{paths[selected.sub]?.closed?'断开路径':'闭合路径'}</button></div>
    <Toggle label="镜像相邻控制柄" checked={mirror} onChange={setMirror}/><p className="dj-hint">拖动蓝色节点或紫色控制柄；双击空白在末尾添加节点。方向键微调，Shift 加大步长。圆弧编辑时转换为三次贝塞尔曲线。</p>
  </>;
}
