import React from "react";
import { Player } from "@remotion/player";
import { TimelineVideo } from "../../../engine/src/TimelineVideo";
import { timelineDurationInFrames } from "../../../engine/src/schema";
import { useStore } from "../store";

// 右上：预览面板（dsh 右栏壳风格——strip 标题行 + 内容体）
export const PreviewPanel: React.FC = () => {
  const { active } = useStore();
  const t = active.timeline;
  const durationInFrames = Math.max(1, timelineDurationInFrames(t));

  return (
    <section className="panel-section">
      <div className="panel-strip">
        <span className="panel-strip-title">预览</span>
        <span className="panel-strip-meta">
          {t.meta.width}×{t.meta.height} · {t.meta.fps}fps ·{" "}
          {(durationInFrames / t.meta.fps).toFixed(1)}s
        </span>
      </div>
      <div className="panel-body">
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
      </div>
    </section>
  );
};
