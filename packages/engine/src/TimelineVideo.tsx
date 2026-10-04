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
import { clipBox, evalKeyframes, mainTrackStarts, secToFrames } from "./timeline";
import { resolveAnimations } from "./presets";
import { fontById, injectFontFaceStyle, overlayFontFamily } from "./fonts";

// 预览与导出共用的合成组件。素材地址由 assetBase（引擎 HTTP 地址）解析；旧调用可传 directSources。
type Resolver = (src: string) => string;
const AssetResolver = React.createContext<Resolver>(staticFile);
const MediaErrorHandler = React.createContext<((src: string) => void) | undefined>(undefined);

// ---------- 动画求值 ----------
interface AnimState {
  transform?: string;
  opacity?: number;
  filter?: string;
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

export const animState = (a: Animations | undefined, sec: number): AnimState => {
  if (!a) return {};
  const x = evalKeyframes(a.x, sec);
  const y = evalKeyframes(a.y, sec);
  const scale = evalKeyframes(a.scale, sec);
  const sx = evalKeyframes(a.scaleX, sec);
  const sy = evalKeyframes(a.scaleY, sec);
  const rot = evalKeyframes(a.rotation, sec);
  const opacity = evalKeyframes(a.opacity, sec);
  const tf: string[] = [];
  if (x !== undefined || y !== undefined) tf.push("translate(" + (x ?? 0) * 100 + "%, " + (y ?? 0) * 100 + "%)");
  if (scale !== undefined && scale !== 1) tf.push("scale(" + scale + ")");
  if ((sx !== undefined && sx !== 1) || (sy !== undefined && sy !== 1)) tf.push("scale(" + (sx ?? 1) + ", " + (sy ?? 1) + ")");
  if (rot !== undefined && rot !== 0) tf.push("rotate(" + rot + "deg)");
  return {
    ...(tf.length ? { transform: tf.join(" ") } : {}),
    ...(opacity !== undefined ? { opacity: Math.max(0, Math.min(1, opacity)) } : {}),
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
  const anim = animState(anims, local);
  const flip = [clip.flipH ? "scaleX(-1)" : "", clip.flipV ? "scaleY(-1)" : ""].filter(Boolean).join(" ");
  const crop = clip.crop;
  const fit = clip.fit ?? "cover";
  const mediaStyle: React.CSSProperties = crop
    ? { position: "absolute", width: 100 / crop.w + "%", height: 100 / crop.h + "%", left: (-crop.x / crop.w) * 100 + "%", top: (-crop.y / crop.h) * 100 + "%", objectFit: fit }
    : { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: fit };
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
      ...(applyTransform && anim.transform ? { transform: anim.transform } : {}),
    }}>
      {media}
    </AbsoluteFill>
  );
};

// ---------- 转场（居中于剪辑点，不改变总时长） ----------
interface TransitionWindow { start: number; frames: number; spec: TransitionObject }
const presentation = (role: "in" | "out", spec: TransitionObject, p: number): React.CSSProperties => {
  const dir = spec.direction ?? "left";
  const axis = dir === "left" || dir === "right" ? "X" : "Y";
  const sign = dir === "left" || dir === "up" ? 1 : -1;
  switch (spec.type) {
    case "dissolve": return role === "in" ? { opacity: p } : {};
    case "fadeBlack":
    case "fadeWhite": return role === "in" ? { opacity: Math.max(0, (p - 0.5) * 2) } : { opacity: Math.max(0, 1 - p * 2) };
    case "slide": return role === "in" ? { transform: "translate" + axis + "(" + sign * (1 - p) * 100 + "%)" } : {};
    case "push": return role === "in"
      ? { transform: "translate" + axis + "(" + sign * (1 - p) * 100 + "%)" }
      : { transform: "translate" + axis + "(" + -sign * p * 100 + "%)" };
    case "wipe": {
      const r = (1 - p) * 100;
      const inset = dir === "left" ? "0 0 0 " + r + "%" : dir === "right" ? "0 " + r + "% 0 0" : dir === "up" ? r + "% 0 0 0" : "0 0 " + r + "% 0";
      return role === "in" ? { clipPath: "inset(" + inset + ")" } : {};
    }
    case "zoom": return role === "in" ? { opacity: p, transform: "scale(" + (1.25 - 0.25 * p) + ")" } : { transform: "scale(" + (1 + 0.15 * p) + ")" };
    case "blur": return role === "in" ? { opacity: p, filter: "blur(" + (1 - p) * 24 + "px)" } : { filter: "blur(" + p * 24 + "px)" };
    default: return {};
  }
};

const TransitionFrame: React.FC<{ from: number; tin?: TransitionWindow; tout?: TransitionWindow; legacyFadeFrames: number; children: React.ReactNode }> = ({ from, tin, tout, legacyFadeFrames, children }) => {
  const local = useCurrentFrame();
  const abs = from + local;
  let style: React.CSSProperties = {};
  if (tin && abs >= tin.start && abs < tin.start + tin.frames) style = presentation("in", tin.spec, (abs - tin.start) / tin.frames);
  else if (tout && abs >= tout.start && abs < tout.start + tout.frames) style = presentation("out", tout.spec, (abs - tout.start) / tout.frames);
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
            <TransitionFrame from={from} tin={tin} tout={tout} legacyFadeFrames={clip.transition === "fade" ? Math.max(1, Math.round(fps * 0.4)) : 0}>
              {hold > 0 && (
                <Sequence from={0} durationInFrames={hold} layout="none">
                  <MediaLayer clip={{ ...clip, freeze: true }} anims={anims} startFromFrames={0} volume={() => 0} applyTransform offsetFrames={early} />
                </Sequence>
              )}
              <Sequence from={hold} layout="none">
                <MediaLayer clip={clip} anims={anims} startFromFrames={inFrames - Math.round(preroll * speed)} volume={volume} applyTransform offsetFrames={preroll} />
              </Sequence>
            </TransitionFrame>
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
      <PipBox clip={clip} anims={anims} box={box} width={width} height={height}>
        <MediaLayer clip={{ ...clip, opacity: undefined }} anims={anims} startFromFrames={secToFrames(fps, clip.inPoint)} volume={volume} applyTransform={false} />
      </PipBox>
    </Sequence>
  );
};

const PipBox: React.FC<{ clip: Clip; anims: Animations | undefined; box: { x: number; y: number; w: number; h: number }; width: number; height: number; children: React.ReactNode }> = ({ clip, anims, box, width, height, children }) => {
  const { fps } = useVideoConfig();
  const local = useCurrentFrame() / fps;
  const anim = animState(anims, local);
  const radiusPx = (clip.radius ?? 0.03) * Math.min(box.w * width, box.h * height);
  const shadow = clip.shadow === false ? undefined : "0 4px 18px rgba(0,0,0,0.45)";
  return (
    <div style={{
      position: "absolute",
      left: box.x * 100 + "%", top: box.y * 100 + "%", width: box.w * 100 + "%", height: box.h * 100 + "%",
      overflow: "hidden", borderRadius: radiusPx, boxShadow: shadow,
      opacity: (clip.opacity ?? 1) * (anim.opacity ?? 1),
      transform: anim.transform,
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

// ---------- 文字层 ----------
const LEGACY_POS: Record<string, React.CSSProperties> = {
  top: { top: 60, left: 0, right: 0 },
  center: { top: "50%", left: 0, right: 0, transform: "translateY(-50%)" },
  bottom: { bottom: 80, left: 0, right: 0 },
};
const DEFAULT_SHADOW = "0 2px 8px rgba(0,0,0,0.85)";
const justify = (align: string) => (align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center");

export const OverlayView: React.FC<{ ov: Overlay }> = ({ ov }) => {
  const { fps } = useVideoConfig();
  const sec = useCurrentFrame() / fps;
  const anims = resolveAnimations(ov, ov.endSeconds - ov.startSeconds);
  const anim = animState(anims, sec);
  const free = ov.x !== undefined || ov.y !== undefined;
  const align = ov.align ?? "center";
  const width = (ov.maxWidth ?? 0.9) * 100;
  const outer: React.CSSProperties = free
    ? { position: "absolute", left: (ov.x ?? 0.5) * 100 + "%", top: (ov.y ?? 0.85) * 100 + "%", transform: "translate(-50%, -50%)", width: width + "%", textAlign: align, display: "flex", justifyContent: justify(align) }
    : { position: "absolute", ...LEGACY_POS[ov.position], display: "flex", justifyContent: justify(align), paddingInline: (100 - width) / 2 + "%", textAlign: align };
  const shadow = ov.shadow === false ? "none" : ov.shadow ? (ov.shadow.x ?? 0) + "px " + (ov.shadow.y ?? 2) + "px " + ov.shadow.blur + "px " + ov.shadow.color : DEFAULT_SHADOW;
  const bg = ov.background;
  const pad = bg ? bg.padding ?? 12 : 0;
  return (
    <div style={outer}>
      <div style={{
        position: "relative",
        display: "inline-block",
        maxWidth: "100%",
        fontSize: ov.fontSize,
        color: ov.color,
        fontFamily: overlayFontFamily(ov.fontFamily),
        ...(ov.fontWeight ? { fontWeight: ov.fontWeight } : {}),
        fontStyle: ov.italic ? "italic" : undefined,
        textDecoration: ov.underline ? "underline" : undefined,
        letterSpacing: ov.letterSpacing !== undefined ? ov.letterSpacing + "em" : undefined,
        lineHeight: ov.lineHeight ?? 1.3,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        textShadow: shadow,
        ...(ov.stroke && ov.stroke.width > 0 ? { WebkitTextStroke: ov.stroke.width + "px " + ov.stroke.color, paintOrder: "stroke fill" } : {}),
        padding: bg ? pad + "px " + Math.round(pad * 1.4) + "px" : undefined,
        filter: filterCss(undefined, anims, sec),
        ...anim,
      }}>
        {bg && <span aria-hidden style={{ position: "absolute", inset: 0, background: bg.color, opacity: bg.opacity ?? 0.75, borderRadius: bg.radius ?? 8, zIndex: -1 }} />}
        <span style={{ position: "relative" }}>{ov.text}</span>
      </div>
    </div>
  );
};

// ---------- 主合成 ----------
export interface TimelineVideoProps {
  timeline: Timeline;
  /** 素材 HTTP 基址（以 / 结尾），src 会被 URL 编码后拼接 */
  assetBase?: string;
  /** @deprecated src 已是绝对地址时使用；新代码请传 assetBase */
  directSources?: boolean;
  fontsBase?: string;
  onMediaError?: (src: string) => void;
}

const ABSOLUTE_URL = /^(?:[a-z]+:)?\/\//i;

export const TimelineVideo: React.FC<TimelineVideoProps> = ({ timeline, assetBase, directSources = false, fontsBase, onMediaError }) => {
  const { fps } = useVideoConfig();
  const resolver = React.useMemo<Resolver>(() => {
    if (assetBase !== undefined) return (src) => (ABSOLUTE_URL.test(src) || src.startsWith("data:") ? src : assetBase + encodeURIComponent(src));
    return directSources ? (src) => src : staticFile;
  }, [assetBase, directSources]);
  const voice = React.useMemo(() => voiceIntervals(timeline), [timeline]);
  const [mainTrack, ...overlayTracks] = timeline.videoTracks;
  const overlays = React.useMemo(() => [...timeline.overlays].sort((a, b) => (a.track ?? 0) - (b.track ?? 0)), [timeline.overlays]);
  return (
    <MediaErrorHandler.Provider value={onMediaError}>
      <AssetResolver.Provider value={resolver}>
        <AbsoluteFill style={{ backgroundColor: timeline.meta.background ?? "#000" }}>
          <FontGate timeline={timeline} fontsBase={fontsBase} />
          {mainTrack && !mainTrack.hidden && <MainTrack clips={mainTrack.clips} trackMuted={Boolean(mainTrack.muted)} />}
          {overlayTracks.filter((tr) => !tr.hidden).map((tr) => (
            <React.Fragment key={tr.id}>
              {tr.clips.map((clip) => <PipSegment key={clip.id} clip={clip} trackMuted={Boolean(tr.muted)} />)}
            </React.Fragment>
          ))}
          {timeline.audioTracks.map((tr) => tr.clips.map((clip) => <AudioSegment key={clip.id} clip={clip} track={tr} voice={voice} />))}
          {overlays.map((ov) => (
            <Sequence key={ov.id} from={secToFrames(fps, ov.startSeconds)} durationInFrames={Math.max(1, secToFrames(fps, ov.endSeconds) - secToFrames(fps, ov.startSeconds))}>
              <AbsoluteFill><OverlayView ov={ov} /></AbsoluteFill>
            </Sequence>
          ))}
        </AbsoluteFill>
      </AssetResolver.Provider>
    </MediaErrorHandler.Provider>
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
