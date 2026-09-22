import React, { useEffect, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { TimelineVideo } from "../../../engine/src/TimelineVideo";
import { timelineDurationInFrames } from "../../../engine/src/schema";
import { useStore } from "../store";
import { playerBus } from "../playerBus";
import { TrackStrip } from "./TrackStrip";

type ExportState =
  | { phase: "idle" }
  | { phase: "rendering"; percent: number }
  | { phase: "done"; fileName: string; sizeBytes: number }
  | { phase: "error"; message: string };

const fmtSize = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

// 右上：预览面板（dsh 右栏壳风格——strip 标题行 + 内容体）
export const PreviewPanel: React.FC = () => {
  const { active } = useStore();
  const t = active.timeline;
  const durationInFrames = Math.max(1, timelineDurationInFrames(t));
  const [exp, setExp] = useState<ExportState>({ phase: "idle" });
  const pollRef = useRef<number | null>(null);

  const stopPolling = () => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = () => {
    stopPolling();
    pollRef.current = window.setInterval(async () => {
      try {
        const r = await fetch("/api/export/status");
        const s = await r.json();
        if (s.status === "rendering") {
          setExp({ phase: "rendering", percent: s.progress?.percent ?? 0 });
        } else if (s.status === "done") {
          stopPolling();
          setExp({ phase: "done", fileName: s.result.fileName, sizeBytes: s.result.sizeBytes });
        } else if (s.status === "error") {
          stopPolling();
          setExp({ phase: "error", message: s.error ?? "渲染失败" });
        }
      } catch {
        // 网络抖动：等下一轮
      }
    }, 1000);
  };

  useEffect(() => stopPolling, []);

  const startExport = async () => {
    setExp({ phase: "rendering", percent: 0 });
    try {
      const r = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeline: t }),
      });
      if (r.status !== 202) {
        const d = await r.json().catch(() => ({}) as { error?: string });
        throw new Error(d.error ?? `HTTP ${r.status}`);
      }
      startPolling();
    } catch (e) {
      setExp({ phase: "error", message: e instanceof Error ? e.message : String(e) });
    }
  };

  return (
    <section className="panel-section">
      <div className="panel-strip">
        <span className="panel-strip-title">预览</span>
        <span className="panel-strip-meta">
          {t.meta.width}×{t.meta.height} · {t.meta.fps}fps ·{" "}
          {(durationInFrames / t.meta.fps).toFixed(1)}s
        </span>
        {exp.phase === "idle" && (
          <button className="export-btn" onClick={startExport}>
            导出
          </button>
        )}
        {exp.phase === "rendering" && (
          <button className="export-btn" disabled title="渲染进行中">
            导出中 {exp.percent}%
          </button>
        )}
        {exp.phase === "done" && (
          <a
            className="export-btn export-link"
            href="/api/export/download"
            download={exp.fileName}
            title={`${exp.fileName} · ${fmtSize(exp.sizeBytes)}`}
          >
            下载 mp4
          </a>
        )}
        {exp.phase === "error" && (
          <button className="export-btn export-error" onClick={startExport} title={exp.message}>
            失败重试
          </button>
        )}
      </div>
      <div className="panel-body">
        <div className="preview-stage">
          {t.videoTracks.every((tr) => tr.clips.length === 0) && t.audioTracks.every((tr) => tr.clips.length === 0) ? (
            <div className="preview-empty">还没有片段——在下方剪辑面板添加素材</div>
          ) : (
            <Player
              key={`${t.meta.fps}-${t.meta.width}-${t.meta.height}`}
              ref={(r: PlayerRef | null) => {
                playerBus.ref = r;
              }}
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
        <TrackStrip />
      </div>
    </section>
  );
};
