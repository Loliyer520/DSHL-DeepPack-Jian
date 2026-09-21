import React from "react";
import { useStore } from "../store";
import { fmtSec } from "../data";
import type { Clip } from "../../../engine/src/schema";

// 右下：剪辑面板（片段列表 + 字幕列表）。所有操作经 store，会自动注入系统消息。
const NumberField: React.FC<{
  label: string;
  value: number;
  step?: number;
  min?: number;
  onCommit: (v: number) => void;
}> = ({ label, value, step = 0.5, min = 0, onCommit }) => {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        defaultValue={value}
        key={value}
        step={step}
        min={min}
        onBlur={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v) && v >= min && v !== value) onCommit(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
      />
    </label>
  );
};

const ClipRow: React.FC<{ clip: Clip; index: number }> = ({ clip, index }) => {
  const { updateClip, removeClip } = useStore();
  return (
    <div className="clip-row">
      <div className="clip-head">
        <span className="clip-name">
          #{index + 1} {clip.src}
        </span>
        <select
          value={clip.transition}
          onChange={(e) => updateClip(clip.id, { transition: e.target.value as Clip["transition"] })}
        >
          <option value="none">无转场</option>
          <option value="fade">淡入</option>
        </select>
        <button className="icon-btn danger" title="删除片段" onClick={() => removeClip(clip.id)}>
          ✕
        </button>
      </div>
      <div className="clip-fields">
        <NumberField label="起点(s)" value={clip.inPoint} onCommit={(v) => updateClip(clip.id, { inPoint: v })} />
        <NumberField
          label="时长(s)"
          value={clip.clipDuration}
          min={0.1}
          onCommit={(v) => updateClip(clip.id, { clipDuration: v })}
        />
        <NumberField
          label="音量"
          value={clip.volume}
          step={0.1}
          min={0}
          onCommit={(v) => updateClip(clip.id, { volume: Math.min(1, v) })}
        />
      </div>
    </div>
  );
};

export const TimelineEditor: React.FC = () => {
  const { active, addClip, addOverlay, removeOverlay, updateOverlay } = useStore();
  const t = active.timeline;

  return (
    <div className="editor-box">
      <div className="editor-section">
        <div className="section-head">
          <span>片段 · {t.clips.length}</span>
          <button className="text-btn" onClick={addClip}>
            ＋ 添加
          </button>
        </div>
        {t.clips.length === 0 && <div className="section-empty">空时间线</div>}
        {t.clips.map((c, i) => (
          <ClipRow key={c.id} clip={c} index={i} />
        ))}
      </div>

      <div className="editor-section">
        <div className="section-head">
          <span>字幕 · {t.overlays.length}</span>
          <button className="text-btn" onClick={addOverlay}>
            ＋ 添加
          </button>
        </div>
        {t.overlays.length === 0 && <div className="section-empty">无字幕</div>}
        {t.overlays.map((o, i) => (
          <div className="overlay-row" key={i}>
            <input
              className="overlay-text"
              defaultValue={o.text}
              key={o.text + i}
              onBlur={(e) => {
                if (e.target.value !== o.text) updateOverlay(i, { text: e.target.value });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
            />
            <span className="overlay-range">
              {fmtSec(o.startSeconds)}–{fmtSec(o.endSeconds)}
            </span>
            <button className="icon-btn danger" title="删除字幕" onClick={() => removeOverlay(i)}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
