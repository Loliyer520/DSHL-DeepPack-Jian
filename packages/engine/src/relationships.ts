import type { ConnectorSpec, Overlay, Timeline } from './schema.js';
import { evalKeyframes, isBoxElement } from './timeline.js';
import { resolveAnimations } from './presets.js';
import { staggerPresentation } from './stagger.js';
import { pathMotion } from './motionPath.js';

export type Matrix = [number, number, number, number, number, number];
export const identityMatrix = (): Matrix => [1, 0, 0, 1, 0, 0];
export function multiplyMatrix(a: Matrix, b: Matrix): Matrix {
  return [a[0]*b[0]+a[2]*b[1], a[1]*b[0]+a[3]*b[1], a[0]*b[2]+a[2]*b[3], a[1]*b[2]+a[3]*b[3], a[0]*b[4]+a[2]*b[5]+a[4], a[1]*b[4]+a[3]*b[5]+a[5]];
}
export const transformPoint = (m: Matrix, x: number, y: number): [number, number] => [m[0]*x+m[2]*y+m[4], m[1]*x+m[3]*y+m[5]];
export function elementAnchor(o: Overlay, W: number, H: number): [number, number] {
  const height = o.h !== undefined ? o.h * H : o.fontSize * (o.lineHeight ?? 1.3);
  return [(o.x ?? .5)*W, o.y !== undefined ? o.y*H : isBoxElement(o) || o.w !== undefined || o.kind === 'math' ? H/2 : o.position === 'top' ? 60+height/2 : o.position === 'center' ? H/2 : H-80-height/2];
}
function ownMatrix(o: Overlay, seconds: number, W: number, H: number, overlays: Overlay[], groups: Timeline["groups"]): Matrix {
  const d = o.endSeconds-o.startSeconds, t = Math.max(0, Math.min(d, seconds-o.startSeconds));
  const anim = resolveAnimations(o,d), ev = (key: keyof NonNullable<typeof anim>, fallback: number) => evalKeyframes(anim?.[key],t) ?? fallback;
  const path = pathMotion(o.motionPath,ev('pathProgress',t/Math.max(.001,d)),W,H);
  const angle=((o.rotate??0)+ev('rotation',0)+path.angle)*Math.PI/180;
  const sx=ev('scale',1)*ev('scaleX',1), sy=ev('scale',1)*ev('scaleY',1);
  const [x,y]=elementAnchor(o,W,H), a=Math.cos(angle)*sx,b=Math.sin(angle)*sx,c=-Math.sin(angle)*sy,e=Math.cos(angle)*sy;
  const own: Matrix = [a,b,c,e,x+ev('x',0)*W+path.x-a*x-c*y,y+ev('y',0)*H+path.y-b*x-e*y];
  const presentation = staggerPresentation(o,overlays,groups,seconds);
  if (!presentation) return own;
  const k = presentation.animations, st = presentation.seconds, val = (ch: keyof typeof k, v: number) => evalKeyframes(k[ch],st) ?? v;
  const ang=val('rotation',0)*Math.PI/180, sx2=val('scale',1)*val('scaleX',1),sy2=val('scale',1)*val('scaleY',1);
  const aa=Math.cos(ang)*sx2,bb=Math.sin(ang)*sx2,cc=-Math.sin(ang)*sy2,dd=Math.cos(ang)*sy2;
  return multiplyMatrix([aa,bb,cc,dd,x+val('x',0)*W-aa*x-cc*y,y+val('y',0)*H-bb*x-dd*y],own);
}
/** Parent transforms are evaluated from the timeline, not DOM state or earlier frames. */
export function followMatrix(o: Overlay, overlays: Overlay[], seconds: number, W: number, H: number, groups: Timeline["groups"] = undefined, seen = new Set<string>()): Matrix {
  if (!o.follow || seen.has(o.id) || seen.size >= 64) return identityMatrix();
  seen.add(o.id);
  const parent=overlays.find(p=>p.id===o.follow!.target);
  if (!parent || parent.kind==='camera' || parent.group!==o.group || seen.has(parent.id)) return identityMatrix();
  const total=multiplyMatrix(followMatrix(parent,overlays,seconds,W,H,groups,seen),ownMatrix(parent,seconds,W,H,overlays,groups));
  const [x,y]=elementAnchor(parent,W,H), [tx,ty]=transformPoint(total,x,y);
  let [a,b,c,d]=total;
  if (!o.follow.scale) { const sx=Math.hypot(a,b)||1,sy=Math.hypot(c,d)||1; a/=sx;b/=sx;c/=sy;d/=sy; }
  if (!o.follow.rotation) { a=o.follow.scale?Math.hypot(a,b):1; d=o.follow.scale?Math.hypot(c,d):1; b=c=0; }
  return [a,b,c,d,tx-a*x-c*y,ty-b*x-d*y];
}
export function overlayMatrix(o: Overlay, overlays: Overlay[], seconds: number, W: number, H: number, groups: Timeline['groups'] = undefined): Matrix {
  return multiplyMatrix(followMatrix(o,overlays,seconds,W,H,groups),ownMatrix(o,seconds,W,H,overlays,groups));
}
export function worldAnchor(o: Overlay, overlays: Overlay[], seconds: number, W: number, H: number, anchor: ConnectorSpec['fromAnchor']='center', groups: Timeline['groups']=undefined): [number,number] {
  let [x,y]=elementAnchor(o,W,H);
  const w=(o.w??(isBoxElement(o)?.2:o.maxWidth??.9))*W;
  const h=o.h!==undefined?o.h*H:isBoxElement(o)?w:o.fontSize*(o.lineHeight??1.3);
  if(anchor==='left')x-=w/2;if(anchor==='right')x+=w/2;if(anchor==='top')y-=h/2;if(anchor==='bottom')y+=h/2;
  return transformPoint(multiplyMatrix(followMatrix(o,overlays,seconds,W,H,groups),ownMatrix(o,seconds,W,H,overlays,groups)),x,y);
}
export function resolveConnector(o: Overlay, overlays: Overlay[], seconds: number, W: number, H: number, groups: Timeline["groups"]=undefined): Overlay {
  if(!o.connector)return o;
  const from=overlays.find(x=>x.id===o.connector!.from),to=overlays.find(x=>x.id===o.connector!.to);
  if(!from||!to||from.group!==o.group||to.group!==o.group)return o;
  const a=worldAnchor(from,overlays,seconds,W,H,o.connector.fromAnchor,groups),b=worldAnchor(to,overlays,seconds,W,H,o.connector.toAnchor,groups);
  return {...o,x:(a[0]+b[0])/2/W,y:(a[1]+b[1])/2/H,w:Math.max(.002,Math.hypot(b[0]-a[0],b[1]-a[1])/W),rotate:Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI};
}
