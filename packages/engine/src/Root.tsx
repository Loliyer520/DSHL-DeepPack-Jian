import React from "react";
import { Composition } from "remotion";
import { ImageGrid, TimelineVideo, type ImageGridProps, type TimelineVideoProps } from "./TimelineVideo";
import { parseTimeline } from "./schema";
import { timelineDurationInFrames } from "./timeline";

// 时长/帧率/尺寸全部由时间线推导（calculateMetadata），渲染时经 inputProps 传入
const fallback = parseTimeline({ meta: { fps: 30, width: 1280, height: 720 }, overlays: [{ text: "D剪", startSeconds: 0, endSeconds: 1 }] });

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="TimelineVideo"
      component={TimelineVideo as unknown as React.FC<Record<string, unknown>>}
      defaultProps={{ timeline: fallback } as Record<string, unknown>}
      calculateMetadata={({ props }) => {
        const t = (props as unknown as TimelineVideoProps).timeline;
        return { durationInFrames: Math.max(1, timelineDurationInFrames(t)), fps: t.meta.fps, width: t.meta.width, height: t.meta.height };
      }}
    />
    <Composition
      id="ImageGrid"
      component={ImageGrid as unknown as React.FC<Record<string, unknown>>}
      defaultProps={{ images: [], labels: [], cols: 1, cellWidth: 480, cellHeight: 270 } as Record<string, unknown>}
      calculateMetadata={({ props }) => {
        const p = props as unknown as ImageGridProps;
        const rows = Math.max(1, Math.ceil(p.images.length / p.cols));
        return { durationInFrames: 1, fps: 30, width: p.cellWidth * p.cols, height: p.cellHeight * rows };
      }}
    />
  </>
);
