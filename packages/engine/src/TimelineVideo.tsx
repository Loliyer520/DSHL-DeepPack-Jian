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
import type { Clip, Timeline } from "./schema";

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

// 单段 clip（由 Series.Sequence 提供时长）
const ClipSegment: React.FC<{ clip: Clip }> = ({ clip }) => {
  const { fps } = useVideoConfig();
  const fade = clip.transition === "fade";

  if (clip.type === "image") {
    return (
      <FadeIn fade={fade}>
        <Img src={staticFile(clip.src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </FadeIn>
    );
  }
  return (
    <FadeIn fade={fade}>
      <OffthreadVideo
        src={staticFile(clip.src)}
        startFrom={SEC(fps, clip.inPoint)}
        volume={clip.volume}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </FadeIn>
  );
};

// 主组件：吃时间线 JSON，出整片
export const TimelineVideo: React.FC<{ timeline: Timeline }> = ({ timeline }) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Series>
        {timeline.clips.map((clip) => (
          <Series.Sequence key={clip.id} durationInFrames={SEC(fps, clip.clipDuration)}>
            <ClipSegment clip={clip} />
          </Series.Sequence>
        ))}
      </Series>

      {timeline.audio ? (
        <Audio
          src={staticFile(timeline.audio.src)}
          volume={timeline.audio.volume}
          startFrom={SEC(fps, timeline.audio.startAtSeconds)}
        />
      ) : null}

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
