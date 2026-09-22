import React, { useEffect, useState } from "react";
import { useStore } from "../store";
import { playerBus, seekToSeconds } from "../playerBus";
import { fmtSec } from "../data";

// 轨道视图：片段按比例横排 + 播放头与 Player 联动（rAF 读 getCurrentFrame）
// 点击片段块或轨道空白 → seek；播放头位置 = currentFrame / totalFrames
export const TrackStrip: React.FC = () => {
  const { active } = useStore();
  const t = active.timeline;
  const total = t.clips.reduce((s, c) => s + c.clipDuration, 0);
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

  if (t.clips.length === 0 || total <= 0) return null;

  const onSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    seekToSeconds(frac * total, t.meta.fps);
  };

  let acc = 0;
  const blocks = t.clips.map((c) => {
    const start = acc;
    acc += c.clipDuration;
    return { clip: c, start, widthPct: (c.clipDuration / total) * 100 };
  });

  return (
    <div className="track-strip" onClick={onSeek}>
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
      <div className="playhead" style={{ left: `${(Math.min(playhead, total) / total) * 100}%` }} />
    </div>
  );
};
