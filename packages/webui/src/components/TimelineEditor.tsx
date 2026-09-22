import React from "react";
import { useStore } from "../store";
import { fmtSec } from "../data";
import type { Clip } from "../../../engine/src/schema";

// 右下：剪辑面板（dsh 风格）——strip 标题行 + 行式编辑卡片
// v2 多轨：片段=主轨道；画中画区（绝对时间+盒子预设）；音频区（轨音量/静音+clip）
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

// 滤镜预设（与面板 FilterSelect 同集）
const FILTER_PRESETS: Array<{ label: string; filter: Exclude<Clip["filter"], undefined> }> = [
  { label: "提亮", filter: { brightness: 1.15 } },
  { label: "黑白", filter: { grayscale: 1 } },
  { label: "复古", filter: { sepia: 0.6 } },
  { label: "暖调", filter: { sepia: 0.3, saturate: 1.2 } },
  { label: "冷调", filter: { hueRotate: 200, saturate: 1.1 } },
  { label: "高饱和", filter: { saturate: 1.6 } },
  { label: "高对比", filter: { contrast: 1.3 } },
  { label: "柔焦", filter: { blur: 4 } },
];

const ClipRow: React.FC<{ clip: Clip; index: number; splitAt?: number }> = ({ clip, index, splitAt }) => {
  const { updateClip, removeClip, splitClip } = useStore();
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
        <button className="icon-circle danger" title="分割片段" onClick={() => splitAt !== undefined && splitClip(clip.id, splitAt)}>✂</button>
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
        <NumberField
          label="速度"
          value={clip.speed ?? 1}
          step={0.25}
          min={0.1}
          onCommit={(v) => updateClip(clip.id, { speed: Math.min(10, Math.max(0.1, v)) })}
        />
        <select
          className="chip-select"
          value={clip.filter ? JSON.stringify(clip.filter) : ""}
          title="滤镜"
          onChange={(e) => {
            const v = e.target.value;
            if (!v) {
              updateClip(clip.id, { filter: undefined });
              return;
            }
            const p = FILTER_PRESETS.find((x) => JSON.stringify(x.filter) === v);
            if (p) updateClip(clip.id, { filter: p.filter });
          }}
        >
          <option value="">无滤镜</option>
          {FILTER_PRESETS.map((p) => (
            <option key={p.label} value={JSON.stringify(p.filter)}>{p.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

const BOX_PRESETS: Array<{ label: string; box: { x: number; y: number; w: number; h: number } }> = [
  { label: "右下 30%", box: { x: 0.66, y: 0.66, w: 0.3, h: 0.3 } },
  { label: "左下 30%", box: { x: 0.03, y: 0.66, w: 0.3, h: 0.3 } },
  { label: "右上 30%", box: { x: 0.66, y: 0.04, w: 0.3, h: 0.3 } },
  { label: "左上 30%", box: { x: 0.03, y: 0.04, w: 0.3, h: 0.3 } },
  { label: "全屏", box: { x: 0, y: 0, w: 1, h: 1 } },
];

const PipRow: React.FC<{ clip: Clip }> = ({ clip }) => {
  const { updateClip, removeClip } = useStore();
  return (
    <div className="edit-card overlay-row">
      <span className="edit-card-title" style={{ maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {clip.src}
      </span>
      <select
        className="chip-select"
        value={clip.box ? JSON.stringify(clip.box) : ""}
        onChange={(e) => {
          const v = e.target.value;
          if (!v) {
            updateClip(clip.id, { box: undefined });
            return;
          }
          const p = BOX_PRESETS.find((x) => JSON.stringify(x.box) === v);
          if (p) updateClip(clip.id, { box: p.box });
        }}
      >
        <option value="">默认（右下）</option>
        {BOX_PRESETS.map((p) => (
          <option key={p.label} value={JSON.stringify(p.box)}>
            {p.label}
          </option>
        ))}
      </select>
      <NumberField label="从(s)" value={clip.atSeconds ?? 0} onCommit={(v) => updateClip(clip.id, { atSeconds: Math.max(0, v) })} />
      <NumberField label="时长(s)" value={clip.clipDuration} min={0.1} onCommit={(v) => updateClip(clip.id, { clipDuration: v })} />
      <button className="icon-circle danger" title="删除画中画" onClick={() => removeClip(clip.id)}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M2.5 2.5l8 8M10.5 2.5l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
};

const AudioRow: React.FC<{ clip: import("../../../engine/src/schema").AudioClip }> = ({ clip }) => {
  const { removeClip, updateClip } = useStore();
  return (
    <div className="edit-card overlay-row">
      <span className="edit-card-title" style={{ maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        ♪ {clip.src}
      </span>
      <NumberField label="从(s)" value={clip.atSeconds} onCommit={(v) => updateClip(clip.id, { atSeconds: Math.max(0, v) })} />
      <NumberField label="时长(s)" value={clip.duration} min={0.1} onCommit={(v) => updateClip(clip.id, { duration: v })} />
      <NumberField
        label="音量"
        value={clip.volume}
        step={0.1}
        min={0}
        onCommit={(v) => updateClip(clip.id, { volume: Math.min(1, Math.max(0, v)) })}
      />
      <button className="icon-circle danger" title="删除音频片段" onClick={() => removeClip(clip.id)}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M2.5 2.5l8 8M10.5 2.5l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
};

export const TimelineEditor: React.FC = () => {
  const { active, addClip, addPip, addAudio, addOverlay, removeOverlay, updateOverlay, reorderClips, updateAudioTrack } = useStore();
  const t = active.timeline;
  const mainClips = t.videoTracks[0]?.clips ?? [];
  const pipClips = t.videoTracks.slice(1).flatMap((tr) => tr.clips);

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
    const to = target ? Number((target as HTMLElement).dataset.index) : mainClips.length - 1;
    if (!Number.isInteger(to) || from === to) return;
    const order = mainClips.map((c) => c.id);
    const [moved] = order.splice(from, 1);
    order.splice(to, 0, moved);
    reorderClips(order);
  };

  return (
    <section className="panel-section editor">
      <div className="panel-strip">
        <span className="panel-strip-title">剪辑</span>
        <span className="panel-strip-meta">
          {mainClips.length} 段{pipClips.length ? ` · 画中画×${pipClips.length}` : ""}
          {t.audioTracks.length ? ` · 音频×${t.audioTracks.reduce((s, tr) => s + tr.clips.length, 0)}` : ""} · {t.overlays.length} 字幕
        </span>
      </div>
      <div className="panel-body editor-body">
        <div className="editor-section">
          <div className="section-head">
            <span>片段（主轨道）</span>
            <span style={{ display: "flex", gap: 6 }}>
              <button className="chip-select" style={{ cursor: "pointer" }} title="加画中画叠加" onClick={addPip}>
                画中画
              </button>
              <button className="icon-circle" title="添加片段" onClick={addClip}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          </div>
          {mainClips.length === 0 && <div className="section-empty">主轨道空</div>}
          <div onDragOver={onDragOver} onDrop={onDrop}>
            {(() => {
              let acc = 0;
              return mainClips.map((c, i) => {
                const mid = acc + c.clipDuration / 2;
                acc += c.clipDuration;
                return <ClipRow key={c.id} clip={c} index={i} splitAt={Math.round(mid * 100) / 100} />;
              });
            })()}
          </div>
        </div>

        <div className="editor-section">
          <div className="section-head">
            <span>画中画</span>
          </div>
          {pipClips.length === 0 && <div className="section-empty">无叠加片段</div>}
          {pipClips.map((c) => (
            <PipRow key={c.id} clip={c} />
          ))}
        </div>

        <div className="editor-section">
          <div className="section-head">
            <span>音频</span>
            <button
              className="chip-select"
              style={{ cursor: "pointer" }}
              title="加一条测试音频（a.mp4 声道）"
              onClick={() => addAudio("a.mp4", 5)}
            >
              + 测试音
            </button>
          </div>
          {t.audioTracks.length === 0 && <div className="section-empty">无音频轨</div>}
          {t.audioTracks.map((tr) => (
            <div key={tr.id}>
              <div className="edit-card-head" style={{ padding: "2px 0" }}>
                <span className="edit-card-title">♪ {tr.name ?? "音频"}</span>
                <button
                  className="chip-select"
                  style={{ cursor: "pointer", opacity: tr.muted ? 0.5 : 1 }}
                  title={tr.muted ? "取消静音" : "静音"}
                  onClick={() => updateAudioTrack(tr.id, { muted: !tr.muted })}
                >
                  {tr.muted ? "🔇 已静音" : "🔊"}
                </button>
              </div>
              {tr.clips.map((c) => (
                <AudioRow key={c.id} clip={c} />
              ))}
            </div>
          ))}
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
