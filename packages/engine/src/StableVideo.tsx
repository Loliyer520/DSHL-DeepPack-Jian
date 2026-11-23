import React, {useContext,useEffect,useRef,useState} from 'react';
import {OffthreadVideo,Freeze,useCurrentFrame,useVideoConfig,useBufferState, getRemotionEnvironment,Internals} from 'remotion';

export const VideoClock=React.createContext<{playing:boolean;rate:number;nested:boolean}|null>(null);
export function useRootVideoClock(){
  const inherited=useContext(VideoClock),playing=Internals.Timeline.usePlaying();
  return inherited??{playing,rate:1,nested:false};
}
/** Rendering decodes the requested frame off thread; nested previews play one persistent decoder. */
export function StableVideo({src,inPoint=0,speed=1,freeze=false,muted=false,volume=1,style,onError}:{src:string;inPoint?:number;speed?:number;freeze?:boolean;muted?:boolean;volume?:number|((f:number)=>number);style?:React.CSSProperties;onError?:(error:Error)=>void}){
  const frame=useCurrentFrame(),{fps}=useVideoConfig(),clock=useContext(VideoClock),premount=useContext(Internals.PremountContext);
  if(!getRemotionEnvironment().isRendering&&clock?.nested)return <NestedPreview src={src} seconds={inPoint+(freeze?0:frame/fps*speed)} rate={speed*clock.rate} playing={clock.playing&&!freeze&&premount.premountFramesRemaining===0&&speed*clock.rate<=16} muted={muted} volume={typeof volume==='function'?volume(frame):volume} style={style} onError={onError}/>;
  const video=<OffthreadVideo src={src} trimBefore={Math.round(inPoint*fps)} playbackRate={speed} muted={muted||freeze} volume={volume} style={style} onError={onError} pauseWhenBuffering acceptableTimeShiftInSeconds={.1} delayRenderRetries={2}/>;
  return freeze?<Freeze frame={0}>{video}</Freeze>:video;
}
function NestedPreview({src,seconds,rate,playing,muted,volume,style,onError}:{src:string;seconds:number;rate:number;playing:boolean;muted:boolean;volume:number;style?:React.CSSProperties;onError?:(e:Error)=>void}){
  const ref=useRef<HTMLVideoElement>(null),target=useRef(seconds),play=useRef(playing),buffer=useBufferState(),pending=useRef<ReturnType<typeof buffer.delayPlayback>|null>(null),[visible,setVisible]=useState(true),raf=useRef(0);
  const last=useRef<{seconds:number;src:string}>();
  target.current=seconds;play.current=playing;
  useEffect(()=>{const v=ref.current;if(!v||typeof IntersectionObserver==='undefined')return;const observer=new IntersectionObserver(entries=>setVisible(entries[0]?.isIntersecting??true),{rootMargin:'120px'});observer.observe(v);return()=>observer.disconnect();},[src]);
  useEffect(()=>{
    const v=ref.current!;
    const done=()=>{pending.current?.unblock();pending.current=null;};
    const sync=()=>{
      if(v.readyState<1)return;
      const t=Math.min(target.current,Number.isFinite(v.duration)?Math.max(0,v.duration-.001):target.current);
      if(Math.abs(v.currentTime-t)>.025&&!v.seeking){cancelAnimationFrame(raf.current);raf.current=requestAnimationFrame(()=>{if(!v.seeking&&Math.abs(v.currentTime-target.current)>.025)v.currentTime=Math.min(target.current,Number.isFinite(v.duration)?Math.max(0,v.duration-.001):target.current);});}
    };
    const ready=()=>{if(!play.current)sync();if(v.readyState>=2&&!v.seeking)done();};
    const waiting=()=>{if(play.current&&!pending.current)pending.current=buffer.delayPlayback();};
    const fail=()=>{done();onError?.(new Error('视频解码失败：'+src));};
    v.addEventListener('loadedmetadata',sync);v.addEventListener('seeked',ready);v.addEventListener('canplay',ready);v.addEventListener('waiting',waiting);v.addEventListener('error',fail);
    return()=>{done();cancelAnimationFrame(raf.current);v.pause();v.removeEventListener('loadedmetadata',sync);v.removeEventListener('seeked',ready);v.removeEventListener('canplay',ready);v.removeEventListener('waiting',waiting);v.removeEventListener('error',fail);};
  },[src,buffer.delayPlayback]);
  useEffect(()=>{
    const v=ref.current!;
    v.playbackRate=Math.max(.0625,Math.min(16,rate));v.volume=Math.max(0,Math.min(1,volume));
    const jumped=!last.current||last.current.src!==src||Math.abs(seconds-last.current.seconds)>Math.max(.25,rate/15);
    last.current={seconds,src};
    const drift=Math.abs(v.currentTime-seconds);
    if(v.readyState>=1&&!v.seeking&&(jumped||(!playing&&drift>.025)||drift>.18))v.currentTime=Math.min(seconds,Number.isFinite(v.duration)?Math.max(0,v.duration-.001):seconds);
    if(playing&&visible){if(v.paused)void v.play().catch(e=>{if(e.name!=='AbortError')onError?.(e);});}else v.pause();
  },[seconds,rate,playing,volume,src,visible]);
  return <video ref={ref} src={src} muted={muted} playsInline preload="auto" style={style}/>;
}
