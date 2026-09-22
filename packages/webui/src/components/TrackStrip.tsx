import React, { useEffect, useState } from "react";
import { useStore } from "../store";
import { playerBus, seekToSeconds } from "../playerBus";
import { fmtSec } from "../data";
import { timelineDurationInFrames } from "../../../engine/src/schema";

// 轨道视图（v2 多轨）：主轨串行块 + 叠加轨/音频轨绝对块，共用一条时间轴
// 点击片段块或轨道空白 → seek；播放头位置 = currentFrame / totalFrames
export const TrackStrip: React.FC = () => {
  const { active } = useStore();
  const t = active.timeline;
  const total = Math.max(0.1, timelineDurationInFrames(t) / t.meta.fps);
  const [playhead, setPlayhead] = useState(0); // 秒

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = playerBus.ref;
      if (p) setPlayhead(p.getCurrentFrame() / t.meta.fps);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [t.meta.fps]);

  const hasContent =
    t.videoTracks.some((tr) => tr.clips.length > 0) || t.audioTracks.some((tr) => tr.clips.length > 0);
  if (!hasContent) return null;

  const onSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    seekToSeconds(frac * total, t.meta.fps);
  };

  const main = t.videoTracks[0];
  const overlays = t.videoTracks.slice(1);
  let acc = 0;
  const blocks = main.clips.map((c) => {
    const start = acc;
    acc += c.clipDuration;
    return { clip: c, start, widthPct: (c.clipDuration / total) * 100 };
  });

  const Row: React.FC<{ name: string; children: React.ReactNode }> = ({ name, children }) => (
    <div className="track-row" onClick={onSeek}>
      <span className="track-row-name">{name}</span>
      <div className="track-strip track-row-lane">
        {children}
        <div className="playhead" style={{ left: `${(Math.min(playhead, total) / total) * 100}%` }} />
      </div>
    </div>
  );

  return (
    <div className="track-rows">
      <Row name="视频">
        {blocks.map(({ clip, start, widthPct }) => (
          <div
            key={clip.id}
            className={`track-block ${clip.transition === "fade" ? "has-fade" : ""}`}
            style={{ width: `${widthPct}%` }}
            title={`${clip.src} · ${fmtSec(start)}–${fmtSec(start + clip.clipDuration)}`}
          >
            <span className="track-block-label">{clip.src}</span>
          </div>
        ))}
      </Row>
      {overlays.map((tr) => (
        <Row key={tr.id} name={tr.name ?? "画中画"}>
          {tr.clips.map((c) => (
            <div
              key={c.id}
              className="track-block track-pip-block"
              style={{
                position: "absolute",
                left: `${((c.atSeconds ?? 0) / total) * 100}%`,
                width: `${(c.clipDuration / total) * 100}%`,
              }}
              title={`${c.src} · ${fmtSec(c.atSeconds ?? 0)}–${fmtSec((c.atSeconds ?? 0) + c.clipDuration)}`}
            >
              <span className="track-block-label">{c.src}</span>
            </div>
          ))}
        </Row>
      ))}
      {t.audioTracks.map((tr) => (
        <Row key={tr.id} name={`♪ ${tr.name ?? "音频"}`}>
          {tr.clips.map((c) => (
            <div
              key={c.id}
              className="track-block track-audio-block"
              style={{
                position: "absolute",
                left: `${(c.atSeconds / total) * 100}%`,
                width: `${(c.duration / total) * 100}%`,
              }}
              title={`${c.src} · ${fmtSec(c.atSeconds)}–${fmtSec(c.atSeconds + c.duration)}`}
            >
              <span className="track-block-label">♪ {c.src}</span>
            </div>
          ))}
        </Row>
      ))}
    </div>
  );
};
