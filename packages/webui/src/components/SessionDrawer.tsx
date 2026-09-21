import React from "react";
import { useStore } from "../store";
import { fmtTime } from "../data";

// 左侧会话抽屉：dsh 原页面同款侧栏（fill 背景 + 0.5px 右边框 + hover 圆角项）
export const SessionDrawer: React.FC<{ open: boolean; onToggle: () => void }> = ({ open, onToggle }) => {
  const { sessions, activeId, setActive, newSession } = useStore();

  return (
    <aside className={`drawer ${open ? "open" : "closed"}`}>
      <div className="drawer-inner">
        <div className="drawer-head">
          <button className="new-session-btn" onClick={newSession}>
            <span className="plus">＋</span> 新会话
          </button>
          <button className="icon-btn" title="收起侧栏" onClick={onToggle}>
            «
          </button>
        </div>
        <div className="session-list">
          {sessions.map((s) => (
            <button
              key={s.id}
              className={`session-item ${s.id === activeId ? "active" : ""}`}
              onClick={() => setActive(s.id)}
            >
              <span className="session-title">{s.title}</span>
              <span className="session-time">{fmtTime(s.updatedAt)}</span>
            </button>
          ))}
        </div>
        <div className="drawer-foot">D剪 · dsh 整合包 v0.1</div>
      </div>
    </aside>
  );
};
