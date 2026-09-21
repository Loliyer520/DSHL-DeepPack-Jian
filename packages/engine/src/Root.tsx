import React from "react";
import { Composition } from "remotion";
import { TimelineVideo } from "./TimelineVideo";
import { parseTimeline, timelineDurationInFrames, type Timeline } from "./schema";

// 唯一 Composition：duration/fps/尺寸全部由时间线 JSON 推导（calculateMetadata），
// 渲染时经 inputProps 动态传入，免逐项目注册 Composition。
const fallback: Timeline = parseTimeline({
  meta: { fps: 30, width: 1280, height: 720 },
  clips: [{ id: "placeholder", type: "video", src: "", inPoint: 0, clipDuration: 1, transition: "none" }],
});

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="TimelineVideo"
      component={TimelineVideo}
      defaultProps={{ timeline: fallback }}
      calculateMetadata={({ props }) => {
        const t = (props as { timeline: Timeline }).timeline;
        return {
          durationInFrames: Math.max(1, timelineDurationInFrames(t)),
          fps: t.meta.fps,
          width: t.meta.width,
          height: t.meta.height,
        };
      }}
    />
  );
};
