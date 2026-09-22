import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  Series,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { clipBox, type AudioClip, type Clip, type Timeline } from "./schema";

const SEC = (fps: number, s: number) => Math.round(s * fps);

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
const ClipSegment: React.FC<{ clip: Clip; pip?: boolean }> = ({ clip, pip }) => {
  const { fps } = useVideoConfig();
  const fade = clip.transition === "fade";

  const inner = clip.type === "image"
    ? <Img src={staticFile(clip.src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    : (
      <OffthreadVideo
        src={staticFile(clip.src)}
        startFrom={SEC(fps, clip.inPoint)}
        volume={clip.volume}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
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

// 音频轨 clip：绝对摆放 + 轨/片段两级音量
const AudioSegment: React.FC<{ clip: AudioClip; trackVolume: number; muted: boolean }> = ({
  clip,
  trackVolume,
  muted,
}) => {
  const { fps } = useVideoConfig();
  if (muted) return null;
  return (
    <Sequence from={SEC(fps, clip.atSeconds)} durationInFrames={SEC(fps, clip.duration)}>
      <Audio
        src={staticFile(clip.src)}
        startFrom={SEC(fps, clip.inPoint)}
        volume={trackVolume * clip.volume}
      />
    </Sequence>
  );
};

// 主组件：吃时间线 JSON（v2，v1 已在 parseTimeline 归一化），出整片
export const TimelineVideo: React.FC<{ timeline: Timeline }> = ({ timeline }) => {
  const { fps } = useVideoConfig();
  const [mainTrack, ...overlayTracks] = timeline.videoTracks;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
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
              <div
                style={{
                  position: "absolute",
                  ...positionStyle[ov.position],
                  width: "100%",
                  textAlign: "center",
                  fontSize: ov.fontSize,
                  color: ov.color,
                  fontFamily: '"Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif',
                  textShadow: "0 2px 8px rgba(0,0,0,0.85)",
                }}
              >
                {ov.text}
              </div>
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
