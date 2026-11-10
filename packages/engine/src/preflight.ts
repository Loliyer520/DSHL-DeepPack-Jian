import {nestedAudio} from './compositions.js';
import type {Timeline, Animations} from './schema.js';
import {mainTrackStarts,evalKeyframes} from './timeline.js';
import {resolveCues} from './studio.js';
export interface CheckIssue {code:string;severity:'error'|'warning'|'info';id?:string;time:number;message:string;}
export interface CheckAsset {name:string;duration?:number|null;hasAudio?:boolean;}
const luminance=(s:string)=>{if(!/^#[\da-f]{6}$/i.test(s))return null;const rgb=[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
/** Static, explainable heuristics. Pixel/audio verification remains a separate rendered review. */
export function checkTimeline(t:Timeline,assets?:CheckAsset[],depth=0):CheckIssue[]{
 const out:CheckIssue[]=[],assetMap=assets?new Map(assets.map(a=>[a.name,a])):null;
 const issue=(code:string,severity:CheckIssue['severity'],id:string,time:number,message:string)=>out.push({code,severity,id,time,message});
 const checkSource=(src:string,id:string,time:number)=>{if(assetMap&&!assetMap.has(src)&&!/^https?:|^data:/.test(src))issue('missing-asset','error',id,time,'找不到素材：'+src);};
 for(const [name,def] of Object.entries(t.components??{}))for(const o of def.overlays)if(o.image)checkSource(o.image.src,'component:'+name,0);
 for(const [group,state] of Object.entries(t.groups??{}))if(state.component&&!t.components?.[state.component.name])issue('missing-component','warning',group,0,'组件定义不存在：'+state.component.name);
 const visible=t.overlays.filter(o=>o.kind!=='camera'&&(o.opacity??1)>0);
 for(const o of visible){const text=o.text.replace(/\*\*|==|\[#[\da-f]+\]|\[\/\]/gi,''),duration=o.endSeconds-o.startSeconds;
  if(o.composition&&depth<4){const c=o.composition;try{for(const inner of checkTimeline(JSON.parse(c.timeline),assets,depth+1)){const time=o.startSeconds+(inner.time-c.inPoint)/c.speed;if(time<o.endSeconds)out.push({...inner,id:o.id,time:Math.max(o.startSeconds,time),message:'合成「'+c.name+'」：'+inner.message});}}catch{issue('composition-invalid','error',o.id,o.startSeconds,'合成内部时间线无效');}}
  if(o.image)checkSource(o.image.src,o.id,o.startSeconds);
  if(text.trim()&&o.kind!=='math'){
   const cps=[...text.replace(/\s/g,'')].length/duration;if(cps>12)issue('reading-speed','warning',o.id,o.startSeconds,`文字阅读速度约 ${cps.toFixed(1)} 字/秒，建议延长显示时间`);
   if(duration<.6)issue('short-text','warning',o.id,o.startSeconds,'文字显示少于 0.6 秒');
   const lines=text.split('\n'),capacity=Math.max(1,Math.floor((o.w??o.maxWidth??.9)*t.meta.width/(o.fontSize*.7))),estimated=lines.reduce((n,l)=>n+Math.max(1,Math.ceil([...l].length/capacity)),0)*o.fontSize*(o.lineHeight??1.3);
   if(o.h&&estimated>o.h*t.meta.height)issue('text-overflow','warning',o.id,o.startSeconds,'估算文字高度超过文本框，请检查换行或字号');
   const fg=luminance(o.color),background=typeof o.shape?.fill==='string'?o.shape.fill:o.background?.color??t.meta.background??'#000000',bg=luminance(background);
   if(fg!==null&&bg!==null&&(Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)<3)issue('contrast','warning',o.id,o.startSeconds,'文字与背景的估算对比度低于 3:1');
  }
  const x=o.x??.5,y=o.y??.5,w=o.w??o.maxWidth??.2,h=o.h??o.fontSize*1.3/t.meta.height;
  if(x-w/2<0||x+w/2>1||y-h/2<0||y+h/2>1)issue('off-canvas','warning',o.id,o.startSeconds,'元素静态边界超出画布');
 }
 const texts=visible.filter(o=>o.text.trim()&&!o.group).slice(0,200);
 for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){const a=texts[i],b=texts[j];if(a.endSeconds<=b.startSeconds||b.endSeconds<=a.startSeconds)continue;const dx=Math.abs((a.x??.5)-(b.x??.5)),dy=Math.abs((a.y??.5)-(b.y??.5));if(dx<((a.w??.4)+(b.w??.4))*.35&&dy<((a.h??.06)+(b.h??.06))*.35)issue('text-overlap','warning',b.id,Math.max(a.startSeconds,b.startSeconds),'文本框可能与 '+a.id+' 重叠');}
 const starts=mainTrackStarts(t);
 for(const [ti,tr] of t.videoTracks.entries())for(const c of tr.clips){const at=ti===0?starts.get(c.id)??0:c.atSeconds??0;checkSource(c.src,c.id,at);const a=assetMap?.get(c.src);if(c.type==='video'&&a?.duration&&c.inPoint+c.clipDuration*c.speed>a.duration+.05&&!c.freeze)issue('source-range','error',c.id,at,'片段源范围超过素材时长');}
 for(const tr of t.audioTracks)for(const c of tr.clips){checkSource(c.src,c.id,c.atSeconds);const a=assetMap?.get(c.src);if(a?.duration&&c.inPoint+c.duration*c.speed>a.duration+.05)issue('source-range','error',c.id,c.atSeconds,'音频源范围超过素材时长');if(!tr.muted&&!c.muted&&c.volume*tr.volume>.9)issue('audio-headroom','info',c.id,c.atSeconds,'音轨接近满音量；多轨叠加时建议检查余量');}
 try{for(const cue of resolveCues(t)){const o=t.overlays.find(o=>o.id===cue.target);if(o&&cue.end>o.endSeconds+.001)issue('cue-outside','warning',o.id,cue.start,'动画编排结束时间超过元素显示区间');}}catch(e){out.push({code:'cue-invalid',severity:'error',time:0,message:String(e)});}
 return out.sort((a,b)=>a.time-b.time);
}

export function checkAudioEnvelopes(t:Timeline,envelopes:Record<string,{rate:number;values:ArrayLike<number>}>):CheckIssue[]{
 const issues:CheckIssue[]=[],segments:{id:string;src:string;start:number;duration:number;inPoint:number;speed:number;gain:number;animations?:Animations;fadeIn:number;fadeOut:number;gainAt?:(s:number)=>number}[]=[];
 const starts=mainTrackStarts(t);
 for(const [ti,tr] of t.videoTracks.entries())if(!tr.muted)for(const c of tr.clips)if(c.type==='video'&&!c.muted)segments.push({id:c.id,src:c.src,start:ti===0?starts.get(c.id)??0:c.atSeconds??0,duration:c.clipDuration,inPoint:c.inPoint,speed:c.speed,gain:c.volume,animations:c.animations,fadeIn:c.fadeIn??0,fadeOut:c.fadeOut??0});
 for(const tr of t.audioTracks)if(!tr.muted)for(const c of tr.clips)if(!c.muted)segments.push({id:c.id,src:c.src,start:c.atSeconds,duration:c.duration,inPoint:c.inPoint,speed:c.speed,gain:c.volume*tr.volume,animations:c.animations,fadeIn:c.fadeIn??0,fadeOut:c.fadeOut??0});
 for(const sound of nestedAudio(t))segments.push({id:'composition',src:sound.src,start:sound.start,duration:sound.end-sound.start,inPoint:sound.inPoint,speed:sound.speed,gain:1,fadeIn:0,fadeOut:0,gainAt:sound.gain});
 const end=Math.min(7200,Math.max(0,...segments.map(c=>c.start+c.duration))),rate=50,mix=new Float32Array(Math.ceil(end*rate));
 for(const c of segments){const envelope=envelopes[c.src];if(!envelope||c.gain===0)continue;let peak=0;
  const a=Math.max(0,Math.floor(c.start*rate)),b=Math.min(mix.length,Math.ceil((c.start+c.duration)*rate));
  for(let i=a;i<b;i++){const local=i/rate-c.start;if(local<0)continue;const at=Math.floor((c.inPoint+local*c.speed)*envelope.rate),fade=Math.min(1,c.fadeIn?local/c.fadeIn:1,c.fadeOut?(c.duration-local)/c.fadeOut:1);const v=(envelope.values[at]??0)*(c.gainAt?.(local)??c.gain)*(evalKeyframes(c.animations?.volume,local)??1)*Math.max(0,fade);peak=Math.max(peak,v);mix[i]+=v;}
  if(b>a&&peak<.005)issues.push({code:'audio-silence',severity:'warning',id:c.id,time:c.start,message:'该片段的实测音频包络接近静音，请核对音源和音量'});
 }
 const overload=mix.findIndex(v=>v>1.05);if(overload>=0)issues.push({code:'audio-peak',severity:'warning',time:overload/rate,message:'多音轨峰值包络叠加可能超过满幅，请试听或降低音量（包络估计不含闪避/相位抵消）'});
 if(segments.some(c=>c.start+c.duration>7200))issues.push({code:'audio-limit',severity:'info',time:7200,message:'音频包络检查限于前两小时'});
 return issues;
}
