import React from "react";
import { useStore } from "../store";
import { fmtSec } from "../data";
import type { Clip } from "../../../engine/src/schema";

// 右下：剪辑面板（dsh 风格）——strip 标题行 + 行式编辑卡片
// 输入框照 dsh ui-primitives Input：32px 高、0.5px border-l4、8px 圆角、聚焦墨色边
const NumberField: React.FC<{
  label: string;
  value: number;
  step?: number;
  min?: number;
  onCommit: (v: number) => void;
}> = ({ label, value, step = 0.5, min = 0, onCommit }) => {
  return (
    <label className="num-field">
      <span className="num-label">{label}</span>
      <span className="input-wrap">
        <input
          className="input-inner"
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
      </span>
    </label>
  );
};

const ClipRow: React.FC<{ clip: Clip; index: number }> = ({ clip, index }) => {
  const { updateClip, removeClip } = useStore();
  return (
    <div className="edit-card clip-card" data-index={index} draggable onDragStart={(e) => {
      e.dataTransfer.setData("text/clip-index", String(index));
      e.dataTransfer.effectAllowed = "move";
    }}>
      <div className="edit-card-head">
        <span className="drag-handle" title="拖拽排序">⋮⋮</span>
        <span className="edit-card-title">
          #{index + 1} {clip.src}
        </span>
        <select
          className="chip-select"
          value={clip.transition}
          onChange={(e) => updateClip(clip.id, { transition: e.target.value as Clip["transition"] })}
        >
          <option value="none">无转场</option>
          <option value="fade">淡入</option>
        </select>
        <button className="icon-circle danger" title="删除片段" onClick={() => removeClip(clip.id)}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2.5 2.5l8 8M10.5 2.5l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="edit-card-fields">
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
  const { active, addClip, addOverlay, removeOverlay, updateOverlay, reorderClips } = useStore();
  const t = active.timeline;

  // 拖拽排序：dragover 高亮目标，drop 后计算新顺序走 store（会注入系统消息）
  const onDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("text/clip-index")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    }
  };
  const onDrop = (e: React.DragEvent) => {
    const from = Number(e.dataTransfer.getData("text/clip-index"));
    if (!Number.isInteger(from)) return;
    e.preventDefault();
    const target = (e.target as HTMLElement).closest(".clip-card");
    const to = target ? Number((target as HTMLElement).dataset.index) : t.clips.length - 1;
    if (!Number.isInteger(to) || from === to) return;
    const order = t.clips.map((c) => c.id);
    const [moved] = order.splice(from, 1);
    order.splice(to, 0, moved);
    reorderClips(order);
  };

  return (
    <section className="panel-section editor">
      <div className="panel-strip">
        <span className="panel-strip-title">剪辑</span>
        <span className="panel-strip-meta">{t.clips.length} 段 · {t.overlays.length} 字幕</span>
      </div>
      <div className="panel-body editor-body">
        <div className="editor-section">
          <div className="section-head">
            <span>片段</span>
            <button className="icon-circle" title="添加片段" onClick={addClip}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          {t.clips.length === 0 && <div className="section-empty">空时间线</div>}
          <div onDragOver={onDragOver} onDrop={onDrop}>
            {t.clips.map((c, i) => (
              <ClipRow key={c.id} clip={c} index={i} />
            ))}
          </div>
        </div>

        <div className="editor-section">
          <div className="section-head">
            <span>字幕</span>
            <button className="icon-circle" title="添加字幕" onClick={addOverlay}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          {t.overlays.length === 0 && <div className="section-empty">无字幕</div>}
          {t.overlays.map((o, i) => (
            <div className="edit-card overlay-row" key={i}>
              <span className="input-wrap overlay-text-wrap">
                <input
                  className="input-inner"
                  defaultValue={o.text}
                  key={o.text + i}
                  onBlur={(e) => {
                    if (e.target.value !== o.text) updateOverlay(i, { text: e.target.value });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  }}
                />
              </span>
              <span className="overlay-range">
                {fmtSec(o.startSeconds)}–{fmtSec(o.endSeconds)}
              </span>
              <button className="icon-circle danger" title="删除字幕" onClick={() => removeOverlay(i)}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2.5 2.5l8 8M10.5 2.5l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
