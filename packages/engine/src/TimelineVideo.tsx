import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Series,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Video,
  delayRender,
  continueRender,
} from "remotion";
import { clipBox, evalKeyframes, type AudioClip, type Animations, type Clip, type Filter, type Overlay, type Timeline } from "./schema";
import { fontById, injectFontFaceStyle, overlayFontFamily } from "./fonts";

const SEC = (fps: number, s: number) => Math.round(s * fps);

// v3：CSS filter 字符串（省略的通道不出现）
const filterCss = (f: Filter | undefined): string | undefined => {
  if (!f) return undefined;
  const parts: string[] = [];
  if (f.brightness !== undefined) parts.push(`brightness(${f.brightness})`);
  if (f.contrast !== undefined) parts.push(`contrast(${f.contrast})`);
  if (f.saturate !== undefined) parts.push(`saturate(${f.saturate})`);
  if (f.blur !== undefined) parts.push(`blur(${f.blur}px)`);
  if (f.grayscale !== undefined) parts.push(`grayscale(${f.grayscale})`);
  if (f.sepia !== undefined) parts.push(`sepia(${f.sepia})`);
  if (f.hueRotate !== undefined) parts.push(`hue-rotate(${f.hueRotate}deg)`);
  return parts.length ? parts.join(" ") : undefined;
};

// v3：关键帧 → 每帧变换样式/透明度/音量乘数（clip 内相对秒）
const animStyle = (a: Animations | undefined, sec: number): { transform?: string; opacity?: number } => {
  if (!a) return {};
  const x = evalKeyframes(a.x, sec);
  const y = evalKeyframes(a.y, sec);
  const scale = evalKeyframes(a.scale, sec);
  const rot = evalKeyframes(a.rotation, sec);
  const opacity = evalKeyframes(a.opacity, sec);
  const tf: string[] = [];
  if (x !== undefined || y !== undefined) tf.push(`translate(${(x ?? 0) * 100}%, ${(y ?? 0) * 100}%)`);
  if (scale !== undefined && scale !== 1) tf.push(`scale(${scale})`);
  if (rot !== undefined && rot !== 0) tf.push(`rotate(${rot}deg)`);
  return {
    ...(tf.length ? { transform: tf.join(" ") } : {}),
    ...(opacity !== undefined ? { opacity } : {}),
  };
};

const positionStyle: Record<string, React.CSSProperties> = {
  top: { top: 60 },
  center: { top: "50%", transform: "translateY(-50%)" },
  bottom: { bottom: 80 },
};

const FadeIn: React.FC<{ fade: boolean; children: React.ReactNode }> = ({ fade, children }) => {
  const frame = useCurrentFrame();
  const opacity = fade ? Math.min(1, frame / 12) : 1; // 淡入 12 帧
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

// 单段 clip（由 Series.Sequence / Sequence 提供时长与起点）
// v3 变速：成片占时不变（外层序列已定），素材消耗 = 占时 × speed，播放速率 playbackRate 同步
const ClipSegment: React.FC<{ clip: Clip; pip?: boolean }> = ({ clip, pip }) => {
  const { fps } = useVideoConfig();
  const fade = clip.transition === "fade";
  const speed = clip.speed ?? 1;
  const local = useCurrentFrame() / fps; // clip 内相对秒（外层 Sequence 已提供相对时间轴）
  const anim = animStyle(clip.animations, local);

  const inner = clip.type === "image"
    ? <Img src={staticFile(clip.src)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: filterCss(clip.filter), ...anim }} />
    : (
      // <Video> 而非 <OffthreadVideo>：OffthreadVideo 走 Rust 合成器抽帧，在这台 4GB 小机上
      // 随机报 "No frame found at position"（2026-09-23 实测，ffmpeg 同点抽帧全 OK，
      // 密集关键帧/缓存调优均无效）。渲染时浏览器自己 seek 解码，慢一点但稳定。
      <Video
        src={staticFile(clip.src)}
        startFrom={SEC(fps, clip.inPoint)}
        // endAt 是素材源帧绝对位置：占时 × speed 换算成素材消耗（2x 快放 3s → 吃 6s）
        endAt={SEC(fps, clip.inPoint + clip.clipDuration * speed)}
        playbackRate={speed}
        volume={clip.volume * (evalKeyframes(clip.animations?.volume, local) ?? 1)}
        style={{ width: "100%", height: "100%", objectFit: "cover", filter: filterCss(clip.filter), ...anim }}
      />
    );
  return <FadeIn fade={fade}>{inner}</FadeIn>;
};

// 叠加轨 clip：绝对时间 + 画中画盒子（0-1 分数矩形）
const PipSegment: React.FC<{ clip: Clip }> = ({ clip }) => {
  const { fps } = useVideoConfig();
  const box = clipBox(clip);
  return (
    <Sequence from={SEC(fps, clip.atSeconds ?? 0)} durationInFrames={SEC(fps, clip.clipDuration)}>
      <div
        style={{
          position: "absolute",
          left: `${box.x * 100}%`,
          top: `${box.y * 100}%`,
          width: `${box.w * 100}%`,
          height: `${box.h * 100}%`,
          overflow: "hidden",
          boxShadow: "0 4px 18px rgba(0,0,0,0.45)",
          borderRadius: 6,
        }}
      >
        <ClipSegment clip={clip} pip />
      </div>
    </Sequence>
  );
};

// 音频轨 clip：绝对摆放 + 轨/片段两级音量 + v3 变速/音量包络
const AudioSegment: React.FC<{ clip: AudioClip; trackVolume: number; muted: boolean }> = ({
  clip,
  trackVolume,
  muted,
}) => {
  const { fps } = useVideoConfig();
  if (muted) return null;
  const speed = clip.speed ?? 1;
  const env = clip.animations?.volume;
  return (
    <Sequence from={SEC(fps, clip.atSeconds)} durationInFrames={SEC(fps, clip.duration)}>
      <AudioVolumeEnv
        src={staticFile(clip.src)}
        startFrom={SEC(fps, clip.inPoint)}
        endAt={SEC(fps, clip.inPoint + clip.duration * speed)}
        playbackRate={speed}
        baseVolume={trackVolume * clip.volume}
        env={env}
        fps={fps}
      />
    </Sequence>
  );
};

// 音量包络：每帧按 clip 内相对秒求值关键帧（乘在轨/clip 音量上）
const AudioVolumeEnv: React.FC<{
  src: string;
  startFrom: number;
  endAt: number;
  playbackRate: number;
  baseVolume: number;
  env: { t: number; v: number }[] | undefined;
  fps: number;
}> = ({ src, startFrom, endAt, playbackRate, baseVolume, env, fps }) => {
  const frame = useCurrentFrame();
  const local = frame / fps;
  const envV = evalKeyframes(env, local);
  return (
    <Audio
      src={src}
      startFrom={startFrom}
      endAt={endAt}
      playbackRate={playbackRate}
      volume={baseVolume * (envV ?? 1)}
    />
  );
};

// 内置字体：取帧/渲染前等字体真正就位，避免首帧回落系统字体
const FontGate: React.FC<{ timeline: Timeline }> = ({ timeline }) => {
  React.useEffect(() => {
    injectFontFaceStyle();
    const used = [...new Set(timeline.overlays.map((ov) => ov.fontFamily).filter((v): v is string => Boolean(v)))]
      .map((id) => fontById(id))
      .filter((f): f is NonNullable<typeof f> => Boolean(f));
    if (used.length === 0 || !document.fonts) return;
    const handle = delayRender(`djian-fonts:${used.map((f) => f.id).join(",")}`);
    const loads = used.map((f) =>
      document.fonts.load(`400 48px "${f.family}"`).catch(() => {
        /* 字体拉不到就让浏览器走系统回退，不卡渲染 */
      }),
    );
    void Promise.all(loads).then(() => continueRender(handle));
  }, [timeline]);
  return null;
};

// 字幕层：关键帧动画在文本内层应用——外层保留定位 transform（center 的 translateY），互不覆盖
const OverlayView: React.FC<{ ov: Overlay }> = ({ ov }) => {
  const { fps } = useVideoConfig();
  const sec = useCurrentFrame() / fps; // 字幕内相对秒（Sequence 已提供相对时间轴）
  const anim = animStyle(ov.animations, sec);
  return (
    <div style={{ position: "absolute", ...positionStyle[ov.position], width: "100%", textAlign: "center" }}>
      <div
        style={{
          display: "inline-block",
          fontSize: ov.fontSize,
          color: ov.color,
          fontFamily: overlayFontFamily(ov.fontFamily),
          ...(ov.fontWeight ? { fontWeight: ov.fontWeight } : {}),
          textShadow: "0 2px 8px rgba(0,0,0,0.85)",
          ...anim,
        }}
      >
        {ov.text}
      </div>
    </div>
  );
};

// 主组件：吃时间线 JSON（v2，v1 已在 parseTimeline 归一化），出整片
export const TimelineVideo: React.FC<{ timeline: Timeline }> = ({ timeline }) => {
  const { fps } = useVideoConfig();
  const [mainTrack, ...overlayTracks] = timeline.videoTracks;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <FontGate timeline={timeline} />
      {/* 主轨道：串行 */}
      <Series>
        {mainTrack.clips.map((clip) => (
          <Series.Sequence key={clip.id} durationInFrames={SEC(fps, clip.clipDuration)}>
            <ClipSegment clip={clip} />
          </Series.Sequence>
        ))}
      </Series>

      {/* 叠加轨：画中画 */}
      {overlayTracks.map((tr) =>
        tr.clips.map((clip) => <PipSegment key={clip.id} clip={clip} />),
      )}

      {/* 音频轨 */}
      {timeline.audioTracks.map((tr) =>
        tr.clips.map((clip) => (
          <AudioSegment key={clip.id} clip={clip} trackVolume={tr.volume} muted={tr.muted} />
        )),
      )}

      {timeline.overlays.map((ov, i) => {
        const from = SEC(fps, ov.startSeconds);
        const duration = Math.max(1, SEC(fps, ov.endSeconds - ov.startSeconds));
        return (
          <Sequence key={i} from={from} durationInFrames={duration}>
            <AbsoluteFill>
              <OverlayView ov={ov} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
