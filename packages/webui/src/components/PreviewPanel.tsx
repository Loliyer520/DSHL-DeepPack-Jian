import React from "react";
import { Player } from "@remotion/player";
import { TimelineVideo } from "../../../engine/src/TimelineVideo";
import { timelineDurationInFrames } from "../../../engine/src/schema";
import { useStore } from "../store";

// 右上：Remotion Player 预览（浏览器内播，不走渲染管线，时间线改了即时刷新）
export const PreviewPanel: React.FC = () => {
  const { active } = useStore();
  const t = active.timeline;
  const durationInFrames = Math.max(1, timelineDurationInFrames(t));

  return (
    <div className="preview-box">
      <div className="preview-stage">
        {t.clips.length === 0 ? (
          <div className="preview-empty">还没有片段——在下方剪辑面板添加素材</div>
        ) : (
          <Player
            key={`${t.meta.fps}-${t.meta.width}-${t.meta.height}`}
            component={TimelineVideo}
            inputProps={{ timeline: t }}
            durationInFrames={durationInFrames}
            fps={t.meta.fps}
            compositionWidth={t.meta.width}
            compositionHeight={t.meta.height}
            controls
            style={{ width: "100%", aspectRatio: `${t.meta.width} / ${t.meta.height}` }}
          />
        )}
      </div>
      <div className="preview-meta">
        {t.meta.width}×{t.meta.height} · {t.meta.fps}fps · {t.clips.length} 段 ·{" "}
        {(durationInFrames / t.meta.fps).toFixed(1)}s
      </div>
    </div>
  );
};
