import React, { useState } from "react";
import { StoreProvider } from "./store";
import { SessionDrawer } from "./components/SessionDrawer";
import { ChatView } from "./components/ChatView";
import { PreviewPanel } from "./components/PreviewPanel";
import { TimelineEditor } from "./components/TimelineEditor";
import { useStore } from "./store";

// 布局照 dsh 原页面：左抽屉（会话）/ 中对话 / 右栏（预览 + 剪辑），grid 三列
const Shell: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const { active } = useStore();

  return (
    <div className={`frame ${drawerOpen ? "" : "drawer-closed"}`}>
      <SessionDrawer open={drawerOpen} onToggle={() => setDrawerOpen(false)} />
      <main className="center-col">
        <header className="topbar">
          {!drawerOpen && (
            <button className="icon-btn" title="展开侧栏" onClick={() => setDrawerOpen(true)}>
              »
            </button>
          )}
          <span className="topbar-title">{active.title}</span>
        </header>
        <ChatView />
      </main>
      <aside className="right-col">
        <PreviewPanel />
        <TimelineEditor />
      </aside>
    </div>
  );
};

export const App: React.FC = () => (
  <StoreProvider>
    <Shell />
  </StoreProvider>
);
