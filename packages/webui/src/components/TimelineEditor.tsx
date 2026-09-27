import React from "react";
import { useStore } from "../store";
import { fmtSec } from "../data";
import type { Clip } from "../../../engine/src/schema";
import { ANIMATION_PRESETS, expandAnimationPreset } from "../../../engine/src/presets";
import { IconClose, IconGrip, IconNote, IconPlus, IconScissors, IconVolume } from "./icons";

// 右下：剪辑面板——strip 标题行 + 行式编辑卡片
// v2 多轨：片段=主轨道；画中画区（绝对时间+盒子预设）；音频区（轨静音+clip）
// 卡片类别色轨：片段蓝 / 画中画紫 / 音频青 / 字幕琥珀，与轨道视图一一对应
const NumberField: React.FC<{
  label: string;
  value: number;
  unit?: string;
  step?: number;
  min?: number;
  onCommit: (v: number) => void;
}> = ({ label, value, unit, step = 0.5, min = 0, onCommit }) => {
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
        {unit && <span className="input-unit">{unit}</span>}
      </span>
    </label>
  );
};

// 删除钮：24px 幽灵钮，hover 才转危险色
const DeleteBtn: React.FC<{ title: string; onClick: () => void }> = ({ title, onClick }) => (
  <button className="icon-btn-ghost danger" title={title} onClick={onClick}>
    <IconClose size={13} />
  </button>
);

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

// 动画预设下拉（与面板 AnimSelect 同集）：展开成关键帧落库
const ANIM_GROUPS = ["入场", "出场", "组合", "循环"] as const;
const AnimSelect: React.FC<{ clip: Clip }> = ({ clip }) => {
  const { updateClip } = useStore();
  return (
    <select
      className="chip-select"
      value=""
      title={clip.animations && Object.keys(clip.animations).length > 0 ? "动画（已生效，可换或清除）" : "动画"}
      onChange={(e) => {
        const key = e.target.value;
        if (key === "__clear") {
          updateClip(clip.id, { animations: {} });
          return;
        }
        const anims = expandAnimationPreset(key, clip.clipDuration ?? 1);
        if (anims) updateClip(clip.id, { animations: anims });
        e.target.value = "";
      }}
    >
      <option value="">动画…</option>
      {clip.animations && Object.keys(clip.animations).length > 0 && <option value="__clear">清除动画</option>}
      {ANIM_GROUPS.map((g) => (
        <optgroup key={g} label={g}>
          {Object.entries(ANIMATION_PRESETS)
            .filter(([, p]) => p.group === g)
            .map(([key, p]) => (
              <option key={key} value={key}>{p.label}</option>
            ))}
        </optgroup>
      ))}
    </select>
  );
};

const ClipRow: React.FC<{ clip: Clip; index: number; splitAt?: number }> = ({ clip, index, splitAt }) => {
  const { updateClip, removeClip, splitClip } = useStore();
  return (
    <div className="edit-card cat-video clip-card" data-index={index} draggable onDragStart={(e) => {
      e.dataTransfer.setData("text/clip-index", String(index));
      e.dataTransfer.effectAllowed = "move";
    }}>
      <div className="edit-card-head">
        <span className="drag-handle" title="拖拽排序">
          <IconGrip />
        </span>
        <span className="clip-index">{index + 1}</span>
        <span className="edit-card-title" title={clip.src}>{clip.src}</span>
        <select
          className="chip-select"
          style={{ width: "auto", flex: "none" }}
          value={clip.transition}
          onChange={(e) => updateClip(clip.id, { transition: e.target.value as Clip["transition"] })}
        >
          <option value="none">无转场</option>
          <option value="fade">淡入</option>
        </select>
        <button className="icon-btn-ghost" title="分割片段" onClick={() => splitAt !== undefined && splitClip(clip.id, splitAt)}>
          <IconScissors size={14} />
        </button>
        <DeleteBtn title="删除片段" onClick={() => removeClip(clip.id)} />
      </div>
      <div className="edit-card-fields">
        <NumberField label="起点" unit="s" value={clip.inPoint} onCommit={(v) => updateClip(clip.id, { inPoint: v })} />
        <NumberField
          label="时长"
          unit="s"
          value={clip.clipDuration}
          min={0.1}
          onCommit={(v) => updateClip(clip.id, { clipDuration: v })}
        />
        <NumberField
          label="音量"
          unit="×"
          value={clip.volume}
          step={0.1}
          min={0}
          onCommit={(v) => updateClip(clip.id, { volume: Math.min(1, v) })}
        />
        <NumberField
          label="速度"
          unit="×"
          value={clip.speed ?? 1}
          step={0.25}
          min={0.1}
          onCommit={(v) => updateClip(clip.id, { speed: Math.min(10, Math.max(0.1, v)) })}
        />
      </div>
      <div className="edit-card-selects">
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
        <AnimSelect clip={clip} />
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
    <div className="edit-card cat-pip overlay-row">
      <span className="edit-card-title" style={{ maxWidth: 110, flexBasis: 110 }} title={clip.src}>
        {clip.src}
      </span>
      <select
        className="chip-select"
        style={{ width: 128, flex: "none" }}
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
      <NumberField label="从" unit="s" value={clip.atSeconds ?? 0} onCommit={(v) => updateClip(clip.id, { atSeconds: Math.max(0, v) })} />
      <NumberField label="时长" unit="s" value={clip.clipDuration} min={0.1} onCommit={(v) => updateClip(clip.id, { clipDuration: v })} />
      <DeleteBtn title="删除画中画" onClick={() => removeClip(clip.id)} />
    </div>
  );
};

const AudioRow: React.FC<{ clip: import("../../../engine/src/schema").AudioClip }> = ({ clip }) => {
  const { removeClip, updateClip } = useStore();
  return (
    <div className="edit-card cat-audio overlay-row">
      <span className="edit-card-title" style={{ maxWidth: 90, flexBasis: 90 }} title={clip.src}>
        {clip.src}
      </span>
      <NumberField label="从" unit="s" value={clip.atSeconds} onCommit={(v) => updateClip(clip.id, { atSeconds: Math.max(0, v) })} />
      <NumberField label="时长" unit="s" value={clip.duration} min={0.1} onCommit={(v) => updateClip(clip.id, { duration: v })} />
      <NumberField
        label="音量"
        unit="×"
        value={clip.volume}
        step={0.1}
        min={0}
        onCommit={(v) => updateClip(clip.id, { volume: Math.min(1, Math.max(0, v)) })}
      />
      <DeleteBtn title="删除音频片段" onClick={() => removeClip(clip.id)} />
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
          {mainClips.length} 段{pipClips.length ? ` · 画中画 ${pipClips.length}` : ""}
          {t.audioTracks.length ? ` · 音频 ${t.audioTracks.reduce((s, tr) => s + tr.clips.length, 0)}` : ""} · 字幕 {t.overlays.length}
        </span>
      </div>
      <div className="panel-body editor-body">
        <div className="editor-section">
          <div className="section-head">
            <span>片段 · 主轨道</span>
            <span style={{ display: "flex", gap: 4 }}>
              <button className="chip-select chip-btn" style={{ cursor: "pointer" }} title="加画中画叠加" onClick={addPip}>
                画中画
              </button>
              <button className="icon-btn-ghost" title="添加片段" onClick={addClip}>
                <IconPlus size={15} />
              </button>
            </span>
          </div>
          {mainClips.length === 0 && <div className="section-empty">主轨道还没有片段 · 点右上角 + 添加</div>}
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
          {pipClips.length === 0 && <div className="section-empty">暂无叠加片段</div>}
          {pipClips.map((c) => (
            <PipRow key={c.id} clip={c} />
          ))}
        </div>

        <div className="editor-section">
          <div className="section-head">
            <span>音频</span>
            <button
              className="chip-select chip-btn"
              style={{ cursor: "pointer" }}
              title="加一条测试音频（a.mp4 声道）"
              onClick={() => addAudio("a.mp4", 5)}
            >
              测试音
            </button>
          </div>
          {t.audioTracks.length === 0 && <div className="section-empty">暂无音频轨</div>}
          {t.audioTracks.map((tr) => (
            <div key={tr.id}>
              <div className="edit-card-head" style={{ padding: "2px 0" }}>
                <IconNote size={13} />
                <span className="edit-card-title">{tr.name ?? "音频"}</span>
                <button
                  className="icon-btn-ghost"
                  style={tr.muted ? { color: "var(--c-danger)" } : undefined}
                  title={tr.muted ? "取消静音" : "静音"}
                  onClick={() => updateAudioTrack(tr.id, { muted: !tr.muted })}
                >
                  <IconVolume size={14} off={tr.muted} />
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
            <button className="icon-btn-ghost" title="添加字幕" onClick={addOverlay}>
              <IconPlus size={15} />
            </button>
          </div>
          {t.overlays.length === 0 && <div className="section-empty">暂无字幕</div>}
          {t.overlays.map((o, i) => (
            <div className="edit-card cat-sub overlay-row" key={i}>
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
              <DeleteBtn title="删除字幕" onClick={() => removeOverlay(i)} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
