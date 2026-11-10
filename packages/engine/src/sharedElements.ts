import type { Animations, Overlay, Timeline } from './schema.js';
import { evalKeyframes } from './timeline.js';
import { resolveAnimations } from './presets.js';
import { elementAnchor, multiplyMatrix, overlayMatrix, transformPoint, type Matrix } from './relationships.js';
import { pathMotion } from './motionPath.js';
import { maskState } from './masks.js';

export interface SharedPair { source: Overlay; target: Overlay; start: number; duration: number }
function planar(o: Overlay, t: Timeline, seen = new Set<string>()): boolean {
  if (seen.has(o.id)) return false;
  seen.add(o.id);
  const g = o.group ? t.groups?.[o.group] : undefined;
  for (const item of [o, g]) {
    if (!item) continue;
    const a = resolveAnimations(item, o.endSeconds-o.startSeconds);
    if (item.transform3d?.rotateX || item.transform3d?.rotateY || item.transform3d?.z || ['rotationX','rotationY','z'].some(k=>a?.[k as keyof Animations]?.some(f=>f.v!==0))) return false;
  }
  if (g?.mask || g?.stagger || o.connector || o.trackMatte || o.sweep || o.motionBlur || g?.motionBlur) return false;
  const parent = o.follow && t.overlays.find(p=>p.id===o.follow!.target);
  return !parent || planar(parent,t,seen);
}
/** Match a unique key only at a touching scene boundary, never across a gap. */
export function sharedPairs(t: Timeline): SharedPair[] {
  const byKey = new Map<string, Overlay[]>();
  for (const o of t.overlays) if (o.shared && o.kind !== 'camera') byKey.set(o.shared.key,[...(byKey.get(o.shared.key)??[]),o]);
  const out: SharedPair[]=[];
  for (const list of byKey.values()) for (const target of list) {
    if (target.morph || t.overlays.some(o=>o.trackMatte?.source===target.id) || t.videoTracks.some(tr=>tr.clips.some(c=>c.trackMatte?.source===target.id)) || !planar(target,t)) continue;
    const candidates=list.filter(o=>o.id!==target.id&&o.startSeconds<target.startSeconds&&Math.abs(o.endSeconds-target.startSeconds)<.5/t.meta.fps);
    if(candidates.length!==1||list.some(o=>o.id!==target.id&&Math.abs(o.startSeconds-target.startSeconds)<.5/t.meta.fps))continue;
    const source=candidates[0];if(!planar(source,t))continue;
    // Camera transforms are evaluated per scene; avoid flattening them incorrectly.
    if(t.overlays.some(o=>o.kind==='camera'&&o.startSeconds<target.endSeconds&&o.endSeconds>source.startSeconds))continue;
    const duration=Math.min(target.endSeconds-target.startSeconds,Math.max(1,Math.round((target.shared?.duration??.6)*t.meta.fps))/t.meta.fps);
    out.push({source,target,start:target.startSeconds,duration});
  }
  return out;
}
function groupPose(o: Overlay,t:Timeline,seconds:number):{matrix:Matrix;opacity:number}{
  const g=o.group?t.groups?.[o.group]:undefined;
  if(!g)return {matrix:[1,0,0,1,0,0],opacity:1};
  const members=t.overlays.filter(x=>x.group===o.group&&x.kind!=='camera');
  const start=Math.min(...members.map(x=>x.startSeconds)),end=Math.max(...members.map(x=>x.endSeconds));
  const sec=seconds-start,anim=resolveAnimations(g,end-start),ev=(key:keyof Animations,fallback:number)=>evalKeyframes(anim?.[key],sec)??fallback;
  const path=pathMotion(g.motionPath,ev('pathProgress',sec/Math.max(.001,end-start)),t.meta.width,t.meta.height);
  const r=((g.rotate??0)+ev('rotation',0)+path.angle)*Math.PI/180,s=(g.scale??1)*ev('scale',1);
  const sx=s*ev('scaleX',1),sy=s*ev('scaleY',1),a=Math.cos(r)*sx,b=Math.sin(r)*sx,c=-Math.sin(r)*sy,d=Math.cos(r)*sy;
  const x=(g.pivotX??.5)*t.meta.width,y=(g.pivotY??.5)*t.meta.height;
  return {matrix:[a,b,c,d,x+ev('x',0)*t.meta.width+path.x-a*x-c*y,y+ev('y',0)*t.meta.height+path.y-b*x-d*y],opacity:(g.opacity??1)*ev('opacity',1)};
}
/** Freeze a planar scene element in canvas coordinates for a cross-scene morph. */
export function sharedSnapshot(o: Overlay,t:Timeline,seconds:number):Overlay{
  const W=t.meta.width,H=t.meta.height,sec=seconds-o.startSeconds;
  const anim=resolveAnimations(o,o.endSeconds-o.startSeconds),g=groupPose(o,t,seconds);
  const matrix=multiplyMatrix(g.matrix,overlayMatrix(o,t.overlays,seconds,W,H,t.groups));
  const anchor=elementAnchor(o,W,H),p=transformPoint(matrix,...anchor),sx=Math.hypot(matrix[0],matrix[1]),sy=Math.hypot(matrix[2],matrix[3]);
  const frozen:Animations={};
  for(const [key,frames] of Object.entries(anim??{})) if(!['x','y','scale','scaleX','scaleY','rotation','opacity','pathProgress'].includes(key)) {
    const v=evalKeyframes(frames,sec);if(v!==undefined)frozen[key as keyof Animations]=[{t:0,v}];
  }
  const snapshot:Overlay={...o,x:p[0]/W,y:p[1]/H,rotate:Math.atan2(matrix[1],matrix[0])*180/Math.PI,
    w:o.w!==undefined?o.w*sx:undefined,h:o.h!==undefined?o.h*sy:undefined,fontSize:o.fontSize*sy,
    opacity:Math.max(0,Math.min(1,(o.opacity??1)*(evalKeyframes(anim?.opacity,sec)??1)*g.opacity)),
    mask:maskState(o.mask,anim,sec),animations:frozen};
  delete snapshot.group;delete snapshot.follow;delete snapshot.motionPath;delete snapshot.effects;delete snapshot.shared;delete snapshot.morph;
  return snapshot;
}
