import {FrameMetrics} from './FrameMetrics';
import {effectiveDesign,activeDesignScene} from './design';
import {modelIndex} from './modelIndex';
import { CompositionRenderer } from './renderContext';
import { nestedAudio } from './compositions';
import { TemporalBlur } from "./TemporalBlur";
import { MatteTimeline, TrackMatteLayer, matteSources } from "./trackMatte";
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Freeze,
  Img,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Video,
  delayRender,
  continueRender,
} from "remotion";
import type { Animations, AudioClip, AudioTrack, Clip, Filter, Overlay, Timeline, TransitionObject } from "./schema";
import { clipBox, elementOrder, evalKeyframes, secToFrames } from "./timeline";
import { resolveAnimations } from "./presets";
import { fontById, injectFontFaceStyle } from "./fonts";
import { AssetResolver, MathBase, MediaErrorHandler, type Resolver } from "./renderContext";
import { sharedPairs, sharedSnapshot } from "./sharedElements";
import { staggerPresentation } from "./stagger";
import { elementAnchor, followMatrix, resolveConnector } from "./relationships";
import { maskImage } from "./masks";
import { ElementView, elementMotion, motionTransform } from "./elements";
import { spatialState } from "./spatial";
import { transitionPresentation } from "./transitions";
import { MorphView } from "./morph";
import { activeCamera, cameraState, cameraTransform } from "./camera";

// 预览与导出共用的合成组件。素材地址由 assetBase（引擎 HTTP 地址）解析；旧调用可传 directSources。

// ---------- 动画求值 ----------
interface AnimState {
  transform?: string;
  opacity?: number;
  filter?: string;
  clipPath?: string;
  backfaceVisibility?: "visible" | "hidden";
}

const FILTER_KEYS: [keyof Filter, string, string][] = [
  ["brightness", "brightness", ""], ["contrast", "contrast", ""], ["saturate", "saturate", ""], ["blur", "blur", "px"],
  ["grayscale", "grayscale", ""], ["sepia", "sepia", ""], ["hueRotate", "hue-rotate", "deg"],
];

/** 静态滤镜 + 关键帧滤镜通道（同名通道关键帧优先） */
export const filterCss = (f: Filter | undefined, a: Animations | undefined, sec: number): string | undefined => {
  const parts: string[] = [];
  for (const [key, css, unit] of FILTER_KEYS) {
    const animated = key === "brightness" || key === "contrast" || key === "saturate" || key === "blur"
      ? evalKeyframes(a?.[key], sec) : undefined;
    const v = animated ?? f?.[key];
    if (v !== undefined) parts.push(css + "(" + v + unit + ")");
  }
  return parts.length ? parts.join(" ") : undefined;
};

export const animState = (a: Animations | undefined, sec: number, transform3d?: Clip["transform3d"]): AnimState => {
  if (!a && !transform3d) return {};
  a ??= {};
  const x = evalKeyframes(a.x, sec);
  const y = evalKeyframes(a.y, sec);
  const scale = evalKeyframes(a.scale, sec);
  const sx = evalKeyframes(a.scaleX, sec);
  const sy = evalKeyframes(a.scaleY, sec);
  const rot = evalKeyframes(a.rotation, sec);
  const opacity = evalKeyframes(a.opacity, sec);
  const tf: string[] = [];
  const spatial = spatialState(transform3d, a, sec);
  if (x !== undefined || y !== undefined) tf.push("translate(" + (x ?? 0) * 100 + "%, " + (y ?? 0) * 100 + "%)");
  if (spatial.transform) tf.push(spatial.transform);
  if (scale !== undefined && scale !== 1) tf.push("scale(" + scale + ")");
  if ((sx !== undefined && sx !== 1) || (sy !== undefined && sy !== 1)) tf.push("scale(" + (sx ?? 1) + ", " + (sy ?? 1) + ")");
  if (rot !== undefined && rot !== 0) tf.push("rotate(" + rot + "deg)");
  const c = (v: number | undefined) => Math.max(0, Math.min(1, v ?? 0)) * 100;
  const cl = c(evalKeyframes(a.clipL, sec)), cr = c(evalKeyframes(a.clipR, sec)), ct = c(evalKeyframes(a.clipT, sec)), cb = c(evalKeyframes(a.clipB, sec));
  return {
    backfaceVisibility: spatial.backfaceVisibility,
    ...(tf.length ? { transform: tf.join(" ") } : {}),
    ...(opacity !== undefined ? { opacity: Math.max(0, Math.min(1, opacity)) } : {}),
    ...(cl || cr || ct || cb ? { clipPath: "inset(" + ct + "% " + cr + "% " + cb + "% " + cl + "%)" } : {}),
  };
};

const fadeGain = (localSec: number, duration: number, fadeIn?: number, fadeOut?: number) => {
  let g = 1;
  if (fadeIn && fadeIn > 0) g *= Math.min(1, Math.max(0, localSec / fadeIn));
  if (fadeOut && fadeOut > 0) g *= Math.min(1, Math.max(0, (duration - localSec) / fadeOut));
  return g;
};

// ---------- 人声闪避 ----------
type Interval = [number, number];
const voiceIntervals = (t: Timeline): Interval[] =>
  t.audioTracks.filter((tr) => tr.role === "voice" && !tr.muted)
    .flatMap((tr) => tr.clips.filter((c) => !c.muted).map((c): Interval => [c.atSeconds, c.atSeconds + c.duration]))
    .sort((a, b) => a[0] - b[0]);

const duckGain = (track: AudioTrack, voice: Interval[], sec: number) => {
  if (!track.duck || track.role === "voice" || !voice.length) return 1;
  const ramp = track.duck.ramp ?? 0.3;
  let proximity = 0;
  for (const [a, b] of voice) {
    if (sec >= a && sec <= b) { proximity = 1; break; }
    const dist = sec < a ? a - sec : sec - b;
    if (ramp > 0 && dist < ramp) proximity = Math.max(proximity, 1 - dist / ramp);
  }
  return 1 - (1 - track.duck.level) * proximity;
};

// ---------- 画面素材层：适配/裁切/翻转/定格/滤镜 ----------
const MediaLayer: React.FC<{
  clip: Clip;
  anims: Animations | undefined;
  startFromFrames: number;
  volume: (f: number) => number;
  applyTransform: boolean;
  /** 片段名义起点相对本层起点的帧偏移（转场预滚时 > 0），动画按名义时间求值 */
  offsetFrames?: number;
}> = ({ clip, anims, startFromFrames, volume, applyTransform, offsetFrames = 0 }) => {
  const resolve = React.useContext(AssetResolver);
  const reportError = React.useContext(MediaErrorHandler);
  const onError = reportError ? () => reportError(clip.src) : undefined;
  const { fps } = useVideoConfig();
  const local = (useCurrentFrame() - offsetFrames) / fps;
  const anim = animState(anims, local, clip.transform3d);
  const flip = [clip.flipH ? "scaleX(-1)" : "", clip.flipV ? "scaleY(-1)" : ""].filter(Boolean).join(" ");
  const crop = clip.crop;
  const fit = clip.fit ?? "cover";
  const mediaStyle: React.CSSProperties = crop
    ? { position: "absolute", width: 100 / crop.w + "%", height: 100 / crop.h + "%", left: (-crop.x / crop.w) * 100 + "%", top: (-crop.y / crop.h) * 100 + "%", objectFit: fit }
    : { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: fit };
  if(clip.focus)mediaStyle.objectPosition=`${clip.focus.x*100}% ${clip.focus.y*100}%`;
  if (flip) mediaStyle.transform = flip;
  const src = resolve(clip.src);
  const media = clip.type === "image"
    ? <Img src={src} onError={onError} style={mediaStyle} />
    : clip.freeze
      ? <Freeze frame={0}><Video src={src} onError={onError} startFrom={startFromFrames} muted style={mediaStyle} /></Freeze>
      : <Video src={src} onError={onError} startFrom={startFromFrames} playbackRate={clip.speed ?? 1} volume={volume} style={mediaStyle} />;
  const layerOpacity = (clip.opacity ?? 1) * (applyTransform ? anim.opacity ?? 1 : 1);
  return (
    <AbsoluteFill style={{
      overflow: "hidden",
      filter: filterCss(clip.filter, anims, local),
      opacity: layerOpacity,
      ...(applyTransform && anim.transform ? { transform: anim.transform, backfaceVisibility: anim.backfaceVisibility } : {}),
      ...(applyTransform && anim.clipPath ? { clipPath: anim.clipPath } : {}),
    }}>
      {media}
    </AbsoluteFill>
  );
};

// ---------- 转场（居中于剪辑点，不改变总时长） ----------
interface TransitionWindow { start: number; frames: number; spec: TransitionObject }
const TransitionFrame: React.FC<{ from: number; tin?: TransitionWindow; tout?: TransitionWindow; legacyFadeFrames: number; children: React.ReactNode }> = ({ from, tin, tout, legacyFadeFrames, children }) => {
  const local = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const abs = from + local;
  let style: React.CSSProperties = {};
  if (tin && abs >= tin.start && abs < tin.start + tin.frames) style = transitionPresentation("in", tin.spec, (abs - tin.start) / tin.frames, width, height);
  else if (tout && abs >= tout.start && abs < tout.start + tout.frames) style = transitionPresentation("out", tout.spec, (abs - tout.start) / tout.frames, width, height);
  if (legacyFadeFrames > 0) style = { ...style, opacity: Number(style.opacity ?? 1) * Math.min(1, local / legacyFadeFrames) };
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

const MainTrack: React.FC<{ clips: Clip[]; trackMuted: boolean }> = ({ clips, trackMuted }) => {
  const { fps } = useVideoConfig();
  const starts: number[] = [];
  let acc = 0;
  for (const c of clips) { starts.push(acc); acc += secToFrames(fps, c.clipDuration); }
  const windows: (TransitionWindow | undefined)[] = clips.map((c, i) => {
    if (i === 0 || typeof c.transition !== "object") return undefined;
    const prevDur = secToFrames(fps, clips[i - 1].clipDuration);
    const curDur = secToFrames(fps, c.clipDuration);
    const frames = Math.max(2, Math.min(secToFrames(fps, c.transition.duration), prevDur, curDur));
    return { start: starts[i] - Math.floor(frames / 2), frames, spec: c.transition };
  });
  return (
    <>
      {clips.map((clip, i) => {
        const speed = clip.speed ?? 1;
        const dur = secToFrames(fps, clip.clipDuration);
        const tin = windows[i];
        const tout = windows[i + 1];
        const early = tin ? Math.floor(tin.frames / 2) : 0;
        const late = tout ? Math.ceil(tout.frames / 2) : 0;
        const from = starts[i] - early;
        const inFrames = secToFrames(fps, clip.inPoint);
        // 预滚需要入点之前的素材；不够时用首帧定格补齐，保证剪辑点之后音画严格对齐
        const preroll = Math.min(early, Math.floor(inFrames / speed));
        const hold = early - preroll;
        const anims = resolveAnimations(clip, clip.clipDuration);
        const volume = (f: number) => {
          if (trackMuted || clip.muted) return 0;
          const local = (f - preroll) / fps;
          return clip.volume * (evalKeyframes(anims?.volume, local) ?? 1) * fadeGain(local, clip.clipDuration, clip.fadeIn, clip.fadeOut);
        };
        return (
          <Sequence key={clip.id} from={from} durationInFrames={Math.max(1, dur + early + late)} premountFor={fps}>
            <TrackMatteLayer spec={clip.trackMatte} from={from}><TransitionFrame from={from} tin={tin} tout={tout} legacyFadeFrames={clip.transition === "fade" ? Math.max(1, Math.round(fps * 0.4)) : 0}>
              {hold > 0 && (
                <Sequence from={0} durationInFrames={hold} layout="none">
                  <MediaLayer clip={{ ...clip, freeze: true }} anims={anims} startFromFrames={0} volume={() => 0} applyTransform offsetFrames={early} />
                </Sequence>
              )}
              <Sequence from={hold} layout="none">
                <MediaLayer clip={clip} anims={anims} startFromFrames={inFrames - Math.round(preroll * speed)} volume={volume} applyTransform offsetFrames={preroll} />
              </Sequence>
            </TransitionFrame></TrackMatteLayer>
          </Sequence>
        );
      })}
    </>
  );
};

// ---------- 叠加轨（画中画/贴图）：动画作用于整个盒子 ----------
const PipSegment: React.FC<{ clip: Clip; trackMuted: boolean }> = ({ clip, trackMuted }) => {
  const { fps, width, height } = useVideoConfig();
  const box = clipBox(clip);
  const anims = resolveAnimations(clip, clip.clipDuration);
  const from = secToFrames(fps, clip.atSeconds ?? 0);
  const dur = Math.max(1, secToFrames(fps, clip.clipDuration));
  const volume = (f: number) => {
    if (trackMuted || clip.muted) return 0;
    const local = f / fps;
    return clip.volume * (evalKeyframes(anims?.volume, local) ?? 1) * fadeGain(local, clip.clipDuration, clip.fadeIn, clip.fadeOut);
  };
  return (
    <Sequence from={from} durationInFrames={dur} premountFor={fps}>
      <TrackMatteLayer spec={clip.trackMatte} from={from}><PipBox clip={clip} anims={anims} box={box} width={width} height={height}>
        <MediaLayer clip={{ ...clip, opacity: undefined }} anims={anims} startFromFrames={secToFrames(fps, clip.inPoint)} volume={volume} applyTransform={false} />
      </PipBox></TrackMatteLayer>
    </Sequence>
  );
};

const PipBox: React.FC<{ clip: Clip; anims: Animations | undefined; box: { x: number; y: number; w: number; h: number }; width: number; height: number; children: React.ReactNode }> = ({ clip, anims, box, width, height, children }) => {
  const { fps } = useVideoConfig();
  const local = useCurrentFrame() / fps;
  const anim = animState(anims, local, clip.transform3d);
  const radiusPx = (clip.radius ?? 0.03) * Math.min(box.w * width, box.h * height);
  const shadow = clip.shadow === false ? undefined : "0 4px 18px rgba(0,0,0,0.45)";
  return (
    <div data-clip={clip.id} style={{
      position: "absolute",
      left: box.x * 100 + "%", top: box.y * 100 + "%", width: box.w * 100 + "%", height: box.h * 100 + "%",
      overflow: "hidden", borderRadius: radiusPx, boxShadow: shadow,
      opacity: (clip.opacity ?? 1) * (anim.opacity ?? 1),
      transform: anim.transform,
      backfaceVisibility: anim.backfaceVisibility,
      clipPath: anim.clipPath,
      mixBlendMode: clip.blendMode as React.CSSProperties["mixBlendMode"],
    }}>
      {children}
    </div>
  );
};

// ---------- 音频 ----------
const AudioSegment: React.FC<{ clip: AudioClip; track: AudioTrack; voice: Interval[] }> = ({ clip, track, voice }) => {
  const { fps } = useVideoConfig();
  const resolve = React.useContext(AssetResolver);
  const reportError = React.useContext(MediaErrorHandler);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const src = resolve(clip.src);
  // 预览音频池不转发 onError：直接监听元素
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !reportError) return;
    const failed = () => reportError(clip.src);
    audio.addEventListener("error", failed);
    if (audio.error && audio.src === src) failed();
    return () => audio.removeEventListener("error", failed);
  }, [src, clip.src, reportError]);
  if (track.muted || clip.muted) return null;
  const env = clip.animations?.volume;
  return (
    <Sequence from={secToFrames(fps, clip.atSeconds)} durationInFrames={Math.max(1, secToFrames(fps, clip.duration))} premountFor={fps}>
      <Audio
        ref={audioRef}
        onError={reportError ? () => reportError(clip.src) : undefined}
        src={src}
        startFrom={secToFrames(fps, clip.inPoint)}
        playbackRate={clip.speed ?? 1}
        volume={(f: number) => {
          const local = f / fps;
          return track.volume * clip.volume * (evalKeyframes(env, local) ?? 1)
            * fadeGain(local, clip.duration, clip.fadeIn, clip.fadeOut) * duckGain(track, voice, clip.atSeconds + local);
        }}
      />
    </Sequence>
  );
};

// ---------- 字体 ----------
const FontGate: React.FC<{ timeline: Timeline; fontsBase?: string }> = ({ timeline, fontsBase }) => {
  React.useEffect(() => {
    injectFontFaceStyle(fontsBase);
    const used = [...new Set(timeline.overlays.map((ov) => ov.fontFamily).filter((v): v is string => Boolean(v)))]
      .map((id) => fontById(id))
      .filter((f): f is NonNullable<typeof f> => Boolean(f));
    if (used.length === 0 || typeof document === "undefined" || !document.fonts) return;
    const handle = delayRender("djian-fonts:" + used.map((f) => f.id).join(","));
    const loads = used.map((f) => document.fonts.load('400 48px "' + f.family + '"').catch(() => undefined));
    void Promise.all(loads).then(() => continueRender(handle));
  }, [timeline, fontsBase]);
  return null;
};

// ---------- 元素层（文字/形状/图片/图标/图表/公式/坐标系）见 elements.tsx ----------
/** @deprecated 旧名，等同 ElementView */
export const OverlayView = ElementView;

/** 镜头：把元素放进镜头画面（from 为元素起点帧，用来换算绝对时刻） */
const CameraLayer: React.FC<{ ov: Overlay; cameras: Overlay[]; from: number; children: React.ReactNode }> = ({ ov, cameras, from, children }) => {
  const { fps, width: W, height: H } = useVideoConfig();
  const t = (from + useCurrentFrame()) / fps;
  const cam = cameras.length ? activeCamera(cameras, ov, t) : undefined;
  if (!cam) return <AbsoluteFill>{children}</AbsoluteFill>;
  const state = cameraState(cam, t - cam.startSeconds, W, H);
  return <AbsoluteFill style={{ transformOrigin: "0 0", transform: cameraTransform(state, W, H) }}>{children}</AbsoluteFill>;
};

// ---------- 主合成 ----------
import { RenderQuality, ReactiveLevel, ReactiveTime } from './AmbientEffects';
import { prepareScheduledTimeline } from './studio';
import { audioSample, type Quality } from './ambient';
export interface TimelineVideoProps {
  quality?: Quality;
  timeline: Timeline;
  /** 素材 HTTP 基址（以 / 结尾），src 会被 URL 编码后拼接 */
  assetBase?: string;
  /** @deprecated src 已是绝对地址时使用；新代码请传 assetBase */
  directSources?: boolean;
  fontsBase?: string;
  /** 公式排版接口（引擎 /api/math） */
  mathBase?: string;
  /** 编辑镜头时关掉镜头效果，看到整个画布 */
  measure?: boolean;
  cameraOff?: boolean;
  silent?: boolean;
  proxies?: Record<string,string>;
  onMediaError?: (src: string) => void;
}

const ABSOLUTE_URL = /^(?:[a-z]+:)?\/\//i;

export const TimelineVideo: React.FC<TimelineVideoProps> = ({ timeline, quality = 'full', assetBase, directSources = false, fontsBase, mathBase, cameraOff = false, measure = false, onMediaError, silent = false, proxies }) => {
  timeline=React.useMemo(()=>prepareScheduledTimeline(timeline),[timeline]);
  const { fps, width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const resolver = React.useMemo<Resolver>(() => {
    if (assetBase !== undefined) return (original) => {const src=proxies?.[original]??original;return (ABSOLUTE_URL.test(src) || src.startsWith("data:") ? src : assetBase + encodeURIComponent(src));};
    return directSources ? (src) => src : staticFile;
  }, [assetBase, directSources, proxies]);
  const voice = React.useMemo(() => voiceIntervals(timeline), [timeline]);
  const nested = React.useMemo(()=>silent?[]:nestedAudio(timeline),[timeline,silent]);
  const nestedRenderer=React.useMemo(()=>function Nested({document,seconds,width:w,height:h}:{document:string;seconds:number;width:number;height:number}){
    const child=React.useMemo(()=>JSON.parse(document) as Timeline,[document]);
    return <div style={{position:'absolute',inset:0,overflow:'hidden'}}><div style={{width:child.meta.width,height:child.meta.height,transformOrigin:'0 0',transform:`scale(${w/child.meta.width},${h/child.meta.height})`}}><Freeze frame={Math.max(0,seconds*fps)}><Sequence from={0} width={child.meta.width} height={child.meta.height}><TimelineVideo timeline={child} quality={quality} assetBase={assetBase} directSources={directSources} fontsBase={fontsBase} mathBase={mathBase} onMediaError={onMediaError} silent proxies={proxies}/></Sequence></Freeze></div></div>;
  },[fps,quality,assetBase,directSources,fontsBase,mathBase,onMediaError,proxies]);
  const [mainTrack, ...overlayTracks] = timeline.videoTracks;
  const overlays = React.useMemo(() => elementOrder(timeline.overlays.filter((o) => o.kind !== "camera")), [timeline.overlays]);
  const cameras = React.useMemo(() => (cameraOff ? [] : timeline.overlays.filter((o) => o.kind === "camera")), [timeline.overlays, cameraOff]);
  const hiddenMattes = React.useMemo(()=>matteSources(timeline),[timeline]);
  const pairs = React.useMemo(() => sharedPairs(timeline), [timeline]);
  const activePairs = pairs.filter(p => frame >= secToFrames(fps,p.start) && frame < secToFrames(fps,p.start+p.duration));
  const byId = React.useMemo(() => new Map(overlays.map((o) => [o.id, o])), [overlays]);
  const groups=React.useMemo(()=>{const result=new Map<string,Overlay[]>(),index=modelIndex(timeline);for(const o of overlays)if(o.group&&index.groups.has(o.group)){if(!result.has(o.group))result.set(o.group,[]);result.get(o.group)!.push(o);}return result;},[timeline,overlays]);
  return (
    <CompositionRenderer.Provider value={nestedRenderer}><RenderQuality.Provider value={quality}><MediaErrorHandler.Provider value={onMediaError}>
      <AssetResolver.Provider value={resolver}>
        <MathBase.Provider value={mathBase}><MatteTimeline.Provider value={timeline}>
          <AbsoluteFill data-djian-stage="true" style={{ backgroundColor: activeDesignScene(timeline,frame/fps) ? effectiveDesign(timeline,frame/fps).background : timeline.meta.background ?? "#000" }}>
            <FontGate timeline={timeline} fontsBase={fontsBase} />
            {measure&&<FrameMetrics key={frame} timeline={timeline}/>}
            {mainTrack && !mainTrack.hidden && <MainTrack clips={mainTrack.clips} trackMuted={silent||Boolean(mainTrack.muted)} />}
            {overlayTracks.filter((tr) => !tr.hidden).map((tr) => (
              <React.Fragment key={tr.id}>
                {tr.clips.map((clip) => <PipSegment key={clip.id} clip={clip} trackMuted={silent||Boolean(tr.muted)} />)}
              </React.Fragment>
            ))}
            {!silent&&timeline.audioTracks.map((tr) => tr.clips.map((clip) => <AudioSegment key={clip.id} clip={clip} track={tr} voice={voice} />))}
            {nested.map((a,i)=><Sequence key={'nested-audio:'+i} from={secToFrames(fps,a.start)} durationInFrames={Math.max(1,secToFrames(fps,a.end)-secToFrames(fps,a.start))}><Audio src={resolver(a.src)} startFrom={secToFrames(fps,a.inPoint)} playbackRate={a.speed} volume={f=>a.gain(f/fps)}/></Sequence>)}
            {overlays.map((ov, index) => {
              const state = ov.group ? timeline.groups?.[ov.group] : undefined;
              const members = state ? groups.get(ov.group!) ?? [ov] : [ov];
              if (state && members[members.length-1] !== ov) return null;
              const render = (ov: Overlay) => {
              if (hiddenMattes.has(ov.id) || activePairs.some(p => p.target.id === ov.id)) return null;
              const from = secToFrames(fps, ov.startSeconds),duration=Math.max(1,secToFrames(fps,ov.endSeconds)-from);
              const source = ov.morph ? byId.get(ov.morph.from) : undefined;
              return <Sequence key={ov.id} from={from} durationInFrames={duration} style={{mixBlendMode:ov.blendMode}}>
                <TemporalBlur spec={state?.motionBlur && state.motionBlur.shutterAngle!==0 ? undefined : ov.motionBlur} max={duration-1}>
                  <SampledElement ov={ov} source={source} timeline={timeline} overlays={overlays} cameras={cameras} from={from}/>
                </TemporalBlur>
              </Sequence>;
              };
              return state ? <TemporalBlur key={'group:'+ov.group} spec={state.motionBlur} min={Math.round(Math.min(...members.map(o=>o.startSeconds))*fps)} max={Math.round(Math.max(...members.map(o=>o.endSeconds))*fps)-1}><GroupLayer state={state} members={members}>{members.map(render)}</GroupLayer></TemporalBlur> : render(ov);
            })}
            {activePairs.map(pair => {
              const A = sharedSnapshot(pair.source,timeline,pair.source.endSeconds-1/fps);
              const B = sharedSnapshot(pair.target,timeline,pair.start+pair.duration);
              B.morph = { from: A.id, duration: pair.duration, ease: pair.target.shared?.ease ?? 'inOut' };
              return <Sequence key={'shared:'+B.id} from={secToFrames(fps,pair.start)} durationInFrames={Math.max(1,secToFrames(fps,pair.duration))}>
                <MorphView A={A} B={B}/>
              </Sequence>;
            })}
          </AbsoluteFill>
        </MatteTimeline.Provider></MathBase.Provider>
      </AssetResolver.Provider>
    </MediaErrorHandler.Provider></RenderQuality.Provider></CompositionRenderer.Provider>
  );
};

// ---------- 联络图：把多张已渲染的单帧拼成带时间标签的网格（给模型一次看多处画面） ----------
export interface ImageGridProps {
  images: string[];
  labels: string[];
  cols: number;
  cellWidth: number;
  cellHeight: number;
}
const SampledElement: React.FC<{ov:Overlay;source?:Overlay;timeline:Timeline;overlays:Overlay[];cameras:Overlay[];from:number}> = ({ov,source,timeline,overlays,cameras,from})=>{
  const {fps,width,height}=useVideoConfig(),seconds=(useCurrentFrame()+from)/fps;
  const presented=resolveConnector(ov,overlays,seconds,width,height,timeline.groups);
  const sample=audioSample(ov,timeline,seconds),level=sample.level,a=ov.audioReactive,amount=(a?.amount??.3)*level;
  const style:React.CSSProperties={position:'absolute',inset:0,transformOrigin:`${(ov.x??.5)*100}% ${(ov.y??.5)*100}%`,transform:a?.channel==='rotation'?`rotate(${amount}deg)`:a&&(!a.channel||a.channel==='scale')?`scale(${Math.max(0,1+amount)})`:undefined,opacity:a?.channel==='opacity'?Math.max(0,Math.min(1,1-amount)):1};
  return <ReactiveTime.Provider value={sample.position}><ReactiveLevel.Provider value={level}><div style={style}><CameraLayer ov={ov} cameras={cameras} from={from}><TrackMatteLayer spec={ov.trackMatte} from={from}><FollowLayer ov={ov} overlays={overlays} groups={timeline.groups}><StaggerLayer ov={presented} overlays={overlays} groups={timeline.groups}>
    {source&&source.id!==ov.id&&source.kind!=='camera'?<MorphView A={source} B={ov}/>:<ElementView ov={presented}/>}
  </StaggerLayer></FollowLayer></TrackMatteLayer></CameraLayer></div></ReactiveLevel.Provider></ReactiveTime.Provider>;
};

const StaggerLayer: React.FC<{ ov: Overlay; overlays: Overlay[]; groups: Timeline['groups']; children: React.ReactNode }> = ({ ov, overlays, groups, children }) => {
  const { fps, width, height } = useVideoConfig();
  const presentation = staggerPresentation(ov, overlays, groups, useCurrentFrame() / fps + ov.startSeconds);
  if (!presentation) return <>{children}</>;
  const shell: Overlay = { id: 'stagger', text: '', position: 'center', fontSize: 48, color: '#fff', startSeconds: 0, endSeconds: 1 };
  const m = elementMotion(shell, presentation.animations, presentation.seconds, width, height);
  const [x,y] = elementAnchor(ov,width,height);
  return <AbsoluteFill style={{ transformOrigin: `${x}px ${y}px`, transform: motionTransform(m), opacity: presentation.seconds < 0 ? 0 : m.opacity, filter: m.filter, clipPath: m.clipPath }}>{children}</AbsoluteFill>;
};

const FollowLayer: React.FC<{ ov: Overlay; overlays: Overlay[]; groups: Timeline["groups"]; children: React.ReactNode }> = ({ ov, overlays, groups, children }) => {
  const { fps, width, height } = useVideoConfig();
  const seconds = useCurrentFrame() / fps + ov.startSeconds;
  if (!ov.follow || ov.connector) return <>{children}</>;
  const matrix = followMatrix(ov, overlays, seconds, width, height, groups);
  return <AbsoluteFill style={{ transformOrigin: '0 0', transform: `matrix(${matrix.join(',')})` }}>{children}</AbsoluteFill>;
};

const GroupLayer: React.FC<{ state: NonNullable<Timeline['groups']>[string]; members: Overlay[]; children: React.ReactNode }> = ({ state, members, children }) => {
  const { fps, width, height } = useVideoConfig();
  const start = Math.min(...members.map(o => o.startSeconds)), end = Math.max(...members.map(o => o.endSeconds));
  const sec = useCurrentFrame() / fps - start;
  const shell: Overlay = { id: 'group', text: '', position: 'center', fontSize: 48, color: '#fff', startSeconds: start, endSeconds: end, ...state };
  const m = elementMotion(shell, resolveAnimations(shell, end - start), sec, width, height);
  m.scale *= state.scale ?? 1;
  return <AbsoluteFill style={{ transformOrigin: `${(state.pivotX ?? 0.5) * 100}% ${(state.pivotY ?? 0.5) * 100}%`,
    transform: motionTransform(m), opacity: m.opacity, filter: m.filter, clipPath: m.clipPath,
    backfaceVisibility: m.backfaceVisibility, maskImage: maskImage(m.mask, width, height), maskSize: '100% 100%' }}>{children}</AbsoluteFill>;
};

export const ImageGrid: React.FC<ImageGridProps> = ({ images, labels, cellWidth, cellHeight }) => (
  <AbsoluteFill style={{ backgroundColor: "#111", flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start" }}>
    {images.map((src, i) => (
      <div key={i} style={{ position: "relative", width: cellWidth, height: cellHeight, overflow: "hidden", boxShadow: "inset 0 0 0 1px #333" }}>
        <Img src={src} style={{ width: "100%", height: "100%" }} />
        <div style={{ position: "absolute", left: 6, top: 4, padding: "1px 6px", font: "600 14px sans-serif", color: "#fff", background: "rgba(0,0,0,.65)", borderRadius: 4 }}>{labels[i]}</div>
      </div>
    ))}
  </AbsoluteFill>
);
