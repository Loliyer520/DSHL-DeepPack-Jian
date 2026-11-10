import React from 'react';
import { RenderQuality } from './AmbientEffects';
import { AbsoluteFill, Freeze, useCurrentFrame } from 'remotion';
import type { MotionBlurSpec } from './schema';
import { shutterSamples } from './motionBlur';
export const SampleAnchor = React.createContext(true);
/** Isolated additive compositing averages samples without dimming stationary pixels. */
export function TemporalBlur({spec,min=0,max=Infinity,children}:{spec?:MotionBlurSpec;min?:number;max?:number;children:React.ReactNode}){
  const quality=React.useContext(RenderQuality);
  if(spec&&quality!=='full')spec={...spec,samples:quality==='draft'?2:Math.min(4,spec.samples??8)};
  const frame=useCurrentFrame(),anchor=React.useContext(SampleAnchor);
  if(spec&&(frame<min||frame>max))return null;
  if(!spec||spec.shutterAngle===0)return <>{children}</>;
  const samples=shutterSamples(frame,spec,min,max);
  return <AbsoluteFill style={{isolation:'isolate'}}>{samples.map((time,i)=><AbsoluteFill key={i} style={{opacity:1/samples.length,mixBlendMode:'plus-lighter',pointerEvents:i===samples.length-1?undefined:'none'}}><SampleAnchor.Provider value={anchor&&i===samples.length-1}><Freeze frame={time}>{children}</Freeze></SampleAnchor.Provider></AbsoluteFill>)}</AbsoluteFill>;
}
