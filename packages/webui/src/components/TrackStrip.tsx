import React, { useEffect, useState } from "react";
import { useStore } from "../store";
import { playerBus, seekToSeconds } from "../playerBus";
import { fmtSec } from "../data";
import { IconNote } from "./icons";
import { timelineDurationInFrames } from "../../../engine/src/schema";

// 轨道视图（v2 多轨）：时间标尺 + 主轨串行块 + 叠加轨/音频轨绝对块
// 点击标尺/泳道空白 → seek；播放头位置 = currentFrame / totalFrames
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

  // 标尺刻度：按总时长取 4~6 段，短片不挤
  const tickCount = total <= 12 ? 4 : 6;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (total / tickCount) * i);

  const main = t.videoTracks[0];
  const overlays = t.videoTracks.slice(1);
  let acc = 0;
  const blocks = main.clips.map((c) => {
    const start = acc;
    acc += c.clipDuration;
    return { clip: c, start, widthPct: (c.clipDuration / total) * 100 };
  });

  const Row: React.FC<{ name: string; dot?: "tv" | "tp" | "ta"; icon?: React.ReactNode; children: React.ReactNode }> = ({
    name,
    dot,
    icon,
    children,
  }) => (
    <div className="track-row" onClick={onSeek}>
      <span className="track-row-name">
        {dot && <span className={`track-row-dot ${dot}`} />}
        {icon}
        {name}
      </span>
      <div className="track-strip track-row-lane">
        {children}
        <div className="playhead" style={{ left: `${(Math.min(playhead, total) / total) * 100}%` }} />
      </div>
    </div>
  );

  return (
    <div className="track-rows">
      {/* 时间标尺：与泳道左对齐（52px 行名 + 6px gap） */}
      <div className="track-ruler" onClick={onSeek}>
        {ticks.map((sec, i) => (
          <span key={i} className="track-tick">
            {fmtSec(sec)}
          </span>
        ))}
      </div>
      <Row name="视频" dot="tv">
        {blocks.map(({ clip, start, widthPct }) => (
          <div
            key={clip.id}
            className={`track-block tb-video ${clip.transition === "fade" ? "has-fade" : ""}`}
            style={{ width: `${widthPct}%` }}
            title={`${clip.src} · ${fmtSec(start)}–${fmtSec(start + clip.clipDuration)}`}
          >
            <span className="track-block-label">{clip.src}</span>
          </div>
        ))}
      </Row>
      {overlays.map((tr) => (
        <Row key={tr.id} name={tr.name ?? "画中画"} dot="tp">
          {tr.clips.map((c) => (
            <div
              key={c.id}
              className="track-block tb-pip"
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
        <Row key={tr.id} name={tr.name ?? "音频"} dot="ta" icon={<IconNote size={12} />}>
          {tr.clips.map((c) => (
            <div
              key={c.id}
              className="track-block tb-audio"
              style={{
                position: "absolute",
                left: `${(c.atSeconds / total) * 100}%`,
                width: `${(c.duration / total) * 100}%`,
              }}
              title={`${c.src} · ${fmtSec(c.atSeconds)}–${fmtSec(c.atSeconds + c.duration)}`}
            >
              <span className="track-block-label">{c.src}</span>
            </div>
          ))}
        </Row>
      ))}
    </div>
  );
};
