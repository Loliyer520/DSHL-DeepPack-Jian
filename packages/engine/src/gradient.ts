import type { Animations, Fill, Overlay } from './schema.js';
import { easingFn, evalKeyframes } from './timeline.js';

/** Full gradient stops can move and change color, with the same local clock as motion. */
export function gradientAt(fill: Fill | undefined, seconds: number, animations?: Animations): Fill | undefined {
  if(!fill || typeof fill==='string')return fill;
  const frames=[...(fill.keyframes??[])].sort((a,b)=>a.t-b.t);
  let result={...fill};
  if(frames.length){
    let a=frames[0],b=a;
    for(const f of frames){if(f.t<=seconds)a=f;if(f.t>=seconds){b=f;break;}b=f;}
    const p=a.t===b.t?0:Math.max(0,Math.min(1,easingFn(a.e,b.t-a.t)((seconds-a.t)/(b.t-a.t))));
    const n=Math.max(a.stops.length,b.stops.length);
    result={...result,angle:(a.angle??fill.angle??0)*(1-p)+(b.angle??fill.angle??0)*p,
      stops:Array.from({length:n},(_,i)=>{const x=a.stops[Math.min(i,a.stops.length-1)],y=b.stops[Math.min(i,b.stops.length-1)];return {offset:x.offset*(1-p)+y.offset*p,color:p===0?x.color:p===1?y.color:`color-mix(in srgb, ${x.color} ${(1-p)*100}%, ${y.color})`};})};
  }
  const hue=evalKeyframes(animations?.gradientHue,seconds)??0;
  const shift=evalKeyframes(animations?.gradientShift,seconds)??0;
  return {...result,angle:(result.angle??0)+(evalKeyframes(animations?.gradientAngle,seconds)??0),stops:result.stops.map(s=>({...s,color:hue?`hsl(from ${s.color} calc(h + ${hue}) s l)`:s.color,offset:Math.max(0,Math.min(1,s.offset+shift))})).sort((a,b)=>a.offset-b.offset)};
}
export function gradientOverlay(o: Overlay, seconds: number, animations?: Animations): Overlay {
  return {...o,
    textFill: gradientAt(o.textFill,seconds,animations),
    textStrokeFill: gradientAt(o.textStrokeFill,seconds,animations),
    ...(o.icon ? {icon:{...o.icon,fill:gradientAt(o.icon.fill,seconds,animations),strokeFill:gradientAt(o.icon.strokeFill,seconds,animations)}} : {}),
    ...(o.shape ? {shape:{...o.shape,fill:gradientAt(o.shape.fill,seconds,animations),stroke:o.shape.stroke?{...o.shape.stroke,color:gradientAt(o.shape.stroke.color,seconds,animations)!}:undefined}} : {}),
  };
}
