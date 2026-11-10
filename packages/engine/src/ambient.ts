import type { Overlay, Timeline } from './schema.js';
import {mainTrackStarts,evalKeyframes} from './timeline.js';
export type Quality = 'draft' | 'standard' | 'full';
export function particleCount(count: number, quality: Quality) { return Math.max(1, Math.ceil(count * (quality === 'draft' ? .25 : quality === 'standard' ? .6 : 1))); }
function rand(seed:number) { const x=Math.sin(seed*127.1+311.7)*43758.5453; return x-Math.floor(x); }
export function particleFrame(spec: NonNullable<Overlay['particles']>, time:number, quality:Quality='full') {
 const colors=spec.colors??(spec.preset==='confetti'?['#fb7185','#38bdf8','#fbbf24','#a78bfa']:['#ffffff']);
 return Array.from({length:particleCount(spec.count??100,quality)},(_,i)=>{
  const k=(spec.seed??1)+i*11, r=rand(k), speed=(spec.speed??1)*(.3+rand(k+1)), t=time*speed, phase=((rand(k+2)+t*.15)%1+1)%1;
  const rising=spec.preset==='sparks';
  return {x:((r+Math.sin(t+rand(k+3)*6)*.04)%1+1)%1,y:rising?1-phase:phase,
   size:(spec.size??4)*(.5+rand(k+4)),opacity:spec.preset==='stars'?.3+.7*(.5+.5*Math.sin(t*3+r*10)):Math.sin(phase*Math.PI),
   rotation:rand(k+5)*360+t*60,color:colors[i%colors.length]};
 });
}
export function audioSample(ov:Overlay,timeline:Timeline,seconds:number) {
 const silent={level:0,position:-1};
 const a=ov.audioReactive;if(!a)return silent;
 let start=0,clip:any,muted=false,volume=1;const starts=mainTrackStarts(timeline);
 for(const track of timeline.videoTracks){let at=0;for(const c of track.clips){if(c.id===a.source){clip=c;start=track===timeline.videoTracks[0]?(starts.get(c.id)??at):(c.atSeconds??0);muted=!!track.muted;}at+=c.clipDuration;}}
 for(const track of timeline.audioTracks)for(const c of track.clips)if(c.id===a.source){clip=c;start=c.atSeconds??0;muted=!!track.muted;volume=track.volume;}
 if(!clip||clip.src!==a.src||clip.muted||muted)return silent;
 const local=seconds-start,duration=clip.clipDuration??clip.duration;
 if(local<0||local>=duration)return silent;
 const end=((clip.inPoint??0)+local*(clip.speed??1))*a.rate;
 const width=Math.max(1,Math.round((a.smoothing??.08)*a.rate*(clip.speed??1)));
 let sum=0;for(let j=0;j<width;j++)sum+=a.values[Math.floor(end)-j]??0;
 const fadeIn=clip.fadeIn?Math.min(1,local/clip.fadeIn):1,fadeOut=clip.fadeOut?Math.min(1,(duration-local)/clip.fadeOut):1;
 return {position:end/a.rate,level:Math.min(1,sum/width*(clip.volume??1)*(evalKeyframes(clip.animations?.volume,local)??1)*volume*fadeIn*fadeOut)};
}

export function audioLevel(ov:Overlay,timeline:Timeline,seconds:number){return audioSample(ov,timeline,seconds).level;}
/** Conservative onset markers, separated by at least 200 ms. */
export function beatTimes(values:number[],rate:number){const out:number[]=[];let last=-Infinity;for(let i=1;i<values.length;i++){let sum=0;const n=Math.min(i,Math.ceil(rate*.15));for(let j=1;j<=n;j++)sum+=values[i-j];if(values[i]>.15&&values[i]>sum/n*1.6&&i/rate-last>=.2){last=i/rate;out.push(last);}}return out;}
