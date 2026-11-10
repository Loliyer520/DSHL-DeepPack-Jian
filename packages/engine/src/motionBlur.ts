import type { MotionBlurSpec } from './schema.js';
/** Trailing shutter, capped at two frames. Sampling has no dependency on playback history. */
export function shutterSamples(frame:number,spec:MotionBlurSpec|undefined,min=0,max=Infinity):number[]{
  const angle=spec?.shutterAngle??180;
  if(!spec||angle===0)return [Math.max(min,Math.min(max,frame))];
  const count=Math.max(2,Math.min(16,Math.round(spec.samples??8))),span=Math.max(0,Math.min(720,angle))/360;
  return Array.from({length:count},(_,i)=>Math.max(min,Math.min(max,frame-span*(1-i/(count-1)))));
}
