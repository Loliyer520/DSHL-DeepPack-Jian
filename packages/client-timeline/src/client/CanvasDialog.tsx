import React, { useState } from 'react';
import type { Timeline } from '../../../engine/src/schema';
import { CANVAS_PRESETS } from './ProjectBar';

// 画布设置弹层：预设 + 自定义宽/高/fps（宽高服务端会偶数对齐）
export const CanvasDialog: React.FC<{
  t: Timeline;
  onApply: (meta: { width: number; height: number; fps: number }) => void;
  onClose: () => void;
}> = ({ t, onApply, onClose }) => {
  const [width, setWidth] = useState(t.meta.width);
  const [height, setHeight] = useState(t.meta.height);
  const [fps, setFps] = useState(t.meta.fps);

  const applyPreset = (key: string) => {
    const p = CANVAS_PRESETS.find((x) => x.key === key);
    if (!p) return;
    setWidth(p.meta.width);
    setHeight(p.meta.height);
    setFps(p.meta.fps);
  };

  const valid =
    Number.isFinite(width) && Number.isFinite(height) && Number.isFinite(fps) &&
    width >= 16 && height >= 16 && fps >= 1 && fps <= 120;

  return (
    <div className="djp-mask" onClick={onClose}>
      <div className="djp-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="djp-dialog-title">画布设置</div>
        <div className="djp-preset-grid">
          {CANVAS_PRESETS.map((p) => (
            <button
              key={p.key}
              className={`djp-preset ${
                width === p.meta.width && height === p.meta.height && fps === p.meta.fps ? 'djp-on' : ''
              }`}
              onClick={() => applyPreset(p.key)}
            >
              {p.label}
              <span>
                {p.meta.width}×{p.meta.height}@{p.meta.fps}
              </span>
            </button>
          ))}
        </div>
        <div className="djp-fields" style={{ marginTop: 10 }}>
          <label className="djp-field">
            <span>宽</span>
            <input type="number" value={width} min={16} step={2} onChange={(e) => setWidth(Number(e.target.value))} />
          </label>
          <label className="djp-field">
            <span>高</span>
            <input type="number" value={height} min={16} step={2} onChange={(e) => setHeight(Number(e.target.value))} />
          </label>
          <label className="djp-field">
            <span>fps</span>
            <input type="number" value={fps} min={1} max={120} onChange={(e) => setFps(Number(e.target.value))} />
          </label>
        </div>
        <div className="djp-dialog-actions">
          <button className="djp-btn" onClick={onClose}>取消</button>
          <button
            className="djp-export"
            disabled={!valid}
            onClick={() => {
              onApply({ width, height, fps });
              onClose();
            }}
          >
            应用
          </button>
        </div>
        <div className="djp-hint" style={{ marginTop: 8 }}>
          只影响之后：改画布不会改动已有片段内容；宽高会被对齐到偶数。
        </div>
      </div>
    </div>
  );
};
