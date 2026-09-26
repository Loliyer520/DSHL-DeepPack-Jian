import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  Series,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { clipBox, type AudioClip, type Clip, type Timeline } from '../../../engine/src/schema';
import { injectFontFaceStyle, overlayFontFamily } from '../../../engine/src/fonts';

// 与 engine 的 TimelineVideo 同渲染逻辑（v2 多轨），但 src 直接用（面板侧先转绝对 URL），
// 不走 staticFile——官方壳里没有 remotion public 目录概念。

const SEC = (fps: number, s: number) => Math.round(s * fps);

const positionStyle: Record<string, React.CSSProperties> = {
  top: { top: 60 },
  center: { top: '50%', transform: 'translateY(-50%)' },
  bottom: { bottom: 80 },
};

const FadeIn: React.FC<{ fade: boolean; children: React.ReactNode }> = ({ fade, children }) => {
  const frame = useCurrentFrame();
  const opacity = fade ? Math.min(1, frame / 12) : 1;
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

const ClipSegment: React.FC<{ clip: Clip }> = ({ clip }) => {
  const { fps } = useVideoConfig();
  const fade = clip.transition === 'fade';
  const inner =
    clip.type === 'image' ? (
      <Img src={clip.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    ) : (
      <OffthreadVideo
        src={clip.src}
        startFrom={SEC(fps, clip.inPoint)}
        volume={clip.volume}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    );
  return <FadeIn fade={fade}>{inner}</FadeIn>;
};

const PipSegment: React.FC<{ clip: Clip }> = ({ clip }) => {
  const { fps } = useVideoConfig();
  const box = clipBox(clip);
  return (
    <Sequence from={SEC(fps, clip.atSeconds ?? 0)} durationInFrames={SEC(fps, clip.clipDuration)}>
      <div
        style={{
          position: 'absolute',
          left: `${box.x * 100}%`,
          top: `${box.y * 100}%`,
          width: `${box.w * 100}%`,
          height: `${box.h * 100}%`,
          overflow: 'hidden',
          boxShadow: '0 4px 18px rgba(0,0,0,0.45)',
          borderRadius: 6,
        }}
      >
        <ClipSegment clip={clip} />
      </div>
    </Sequence>
  );
};

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
        src={clip.src}
        startFrom={SEC(fps, clip.inPoint)}
        volume={trackVolume * clip.volume}
      />
    </Sequence>
  );
};

export const PreviewVideo: React.FC<{ timeline: Timeline }> = ({ timeline }) => {
  const { fps } = useVideoConfig();
  const [mainTrack, ...overlayTracks] = timeline.videoTracks;
  React.useEffect(() => {
    injectFontFaceStyle();
  }, []);
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Series>
        {mainTrack.clips.map((clip) => (
          <Series.Sequence key={clip.id} durationInFrames={SEC(fps, clip.clipDuration)}>
            <ClipSegment clip={clip} />
          </Series.Sequence>
        ))}
      </Series>
      {overlayTracks.map((tr) =>
        tr.clips.map((clip) => <PipSegment key={clip.id} clip={clip} />),
      )}
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
                  position: 'absolute',
                  ...positionStyle[ov.position],
                  width: '100%',
                  textAlign: 'center',
                  fontSize: ov.fontSize,
                  color: ov.color,
                  fontFamily: overlayFontFamily(ov.fontFamily),
                  ...(ov.fontWeight ? { fontWeight: ov.fontWeight } : {}),
                  textShadow: '0 2px 8px rgba(0,0,0,0.85)',
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
