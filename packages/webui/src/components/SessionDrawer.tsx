import React, { useState } from "react";
import { useStore } from "../store";
import { NewProjectDialog } from "./NewProjectDialog";
import { IconClapper, IconPanel, IconPlus } from "./icons";

// 左侧会话抽屉：照抄 dsh SidebarRoot + WorkspaceBrowser Rows
// 结构：品牌行（60px，wordmark + 右侧收起圆钮）→ 新建项目条（38px/12px 圆角/0.5px 边）
//       → 会话行（32px，8px 圆角，16px 状态槽 + 标题）→ 底部版本脚
const relTime = (ts: number) => {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  return `${Math.floor(h / 24)} 天前`;
};

export const SessionDrawer: React.FC<{ open: boolean; onToggle: () => void }> = ({ onToggle }) => {
  const { sessions, activeId, setActive, createProject } = useStore();
  // 新建项目：先弹初始设置面板（名称/比例/分辨率/帧率），确认才建会话
  const [creating, setCreating] = useState(false);

  return (
    <aside className="drawer">
      <div className="drawer-inner">
        {/* 品牌行：figma I133:7632，wordmark 墨色 + 右侧 panel toggle */}
        <div className="logo-row">
          <div className="brand-identity">
            <span className="brand-mark">
              <IconClapper size={15} />
            </span>
            <span className="brand-name">D剪</span>
          </div>
          <button className="icon-circle" title="收起侧栏" onClick={onToggle}>
            <IconPanel size={16} />
          </button>
        </div>

        {/* 新建项目条：figma 133:7634，38px 高 12px 圆角带边；点击先弹设置面板 */}
        <button className="new-session-bar" onClick={() => setCreating(true)}>
          <IconPlus size={14} />
          <span>新建项目</span>
        </button>

        <NewProjectDialog open={creating} onCancel={() => setCreating(false)} onCreate={(config) => {
          setCreating(false);
          createProject(config);
        }} />

        {/* 会话行：figma session cell——32px 高，16px 状态槽 + 标题，hover/selected 同色 */}
        <div className="session-list">
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`session-row ${s.id === activeId ? "selected" : ""}`}
              onClick={() => setActive(s.id)}
            >
              <span className="row-slot">
                <span className={`status-dot ${s.id === activeId ? "active" : ""}`} />
              </span>
              <span className="row-title">{s.title}</span>
              <span className="row-time">{relTime(s.updatedAt)}</span>
            </div>
          ))}
        </div>

        <div className="drawer-foot">dsh 整合包 · v0.1</div>
      </div>
    </aside>
  );
};
