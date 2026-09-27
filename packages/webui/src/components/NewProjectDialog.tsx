import React, { useEffect, useRef, useState } from "react";
import { IconClose } from "./icons";

// 新建项目弹窗：点「新建项目」先落初始设置（项目名/画布比例/分辨率/帧率），
// 确认后才真正创建会话——对齐剪映/PR 的序列预设流程。
// 结构：遮罩 → 卡片（标题行 / 名称输入 / 比例 chips / 分辨率 chips / 帧率 chips / 底部按钮行）

export interface NewProjectConfig {
  title: string;
  fps: number;
  width: number;
  height: number;
}

// 比例 → 候选分辨率（从常用序列预设收敛，首个为默认）
const RATIO_PRESETS: { label: string; hint: string; resolutions: { w: number; h: number }[] }[] = [
  { label: "16:9", hint: "横屏", resolutions: [{ w: 1920, h: 1080 }, { w: 2560, h: 1440 }, { w: 3840, h: 2160 }, { w: 1280, h: 720 }] },
  { label: "9:16", hint: "竖屏", resolutions: [{ w: 1080, h: 1920 }, { w: 720, h: 1280 }] },
  { label: "1:1", hint: "方形", resolutions: [{ w: 1080, h: 1080 }, { w: 720, h: 720 }] },
  { label: "4:3", hint: "传统", resolutions: [{ w: 1440, h: 1080 }, { w: 1024, h: 768 }] },
];

const FPS_OPTIONS = [24, 25, 30, 60];

export const NewProjectDialog: React.FC<{
  open: boolean;
  onCancel: () => void;
  onCreate: (config: NewProjectConfig) => void;
}> = ({ open, onCancel, onCreate }) => {
  const [title, setTitle] = useState("未命名项目");
  const [ratioIdx, setRatioIdx] = useState(0);
  const [resIdx, setResIdx] = useState(0);
  const [fps, setFps] = useState(30);
  const titleRef = useRef<HTMLInputElement>(null);

  // 每次打开都回到出厂值并聚焦名称框
  useEffect(() => {
    if (open) {
      setTitle("未命名项目");
      setRatioIdx(0);
      setResIdx(0);
      setFps(30);
      requestAnimationFrame(() => titleRef.current?.select());
    }
  }, [open]);

  if (!open) return null;

  const ratio = RATIO_PRESETS[ratioIdx];
  const res = ratio.resolutions[Math.min(resIdx, ratio.resolutions.length - 1)];

  const create = () => {
    onCreate({ title: title.trim() || "未命名项目", fps, width: res.w, height: res.h });
  };

  return (
    <div
      className="npd-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="npd-card"
        role="dialog"
        aria-label="新建项目"
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
        }}
      >
        <div className="npd-title-row">
          <span className="npd-title">新建项目</span>
          <button className="icon-btn" title="关闭" onClick={onCancel}>
            <IconClose size={14} />
          </button>
        </div>

        <label className="npd-field">
          <span className="npd-label">项目名</span>
          <span className="input-wrap npd-name-wrap">
            <input
              ref={titleRef}
              className="input-inner"
              value={title}
              maxLength={40}
              placeholder="未命名项目"
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") create();
              }}
            />
          </span>
        </label>

        <div className="npd-field">
          <span className="npd-label">画布比例</span>
          <div className="npd-chip-row">
            {RATIO_PRESETS.map((r, i) => (
              <button
                key={r.label}
                className={`npd-chip ${i === ratioIdx ? "selected" : ""}`}
                onClick={() => {
                  setRatioIdx(i);
                  setResIdx(0);
                }}
              >
                {r.label}
                <span className="npd-chip-hint">{r.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="npd-field">
          <span className="npd-label">分辨率</span>
          <div className="npd-chip-row">
            {ratio.resolutions.map((r, i) => (
              <button key={`${r.w}x${r.h}`} className={`npd-chip ${i === resIdx ? "selected" : ""}`} onClick={() => setResIdx(i)}>
                {r.w}×{r.h}
              </button>
            ))}
          </div>
        </div>

        <div className="npd-field">
          <span className="npd-label">帧率</span>
          <div className="npd-chip-row">
            {FPS_OPTIONS.map((f) => (
              <button key={f} className={`npd-chip ${f === fps ? "selected" : ""}`} onClick={() => setFps(f)}>
                {f} fps
              </button>
            ))}
          </div>
        </div>

        <div className="npd-actions">
          <button className="npd-btn" onClick={onCancel}>
            取消
          </button>
          <button className="npd-btn primary" onClick={create}>
            创建项目
          </button>
        </div>
      </div>
    </div>
  );
};
