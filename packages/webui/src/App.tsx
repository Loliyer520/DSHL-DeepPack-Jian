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
  // 明暗主题：index.html 引导脚本已在挂载前把 data-theme 落到 <html>，这里只做切换与记忆
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    document.documentElement.dataset.theme === "light" ? "light" : "dark",
  );
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("djian-theme", next);
    } catch {
      /* 隐私模式等场景下存不进就只在本次会话生效 */
    }
    setTheme(next);
  };

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
          <button
            className="icon-btn"
            style={{ marginLeft: "auto" }}
            title={theme === "dark" ? "切换到浅色" : "切换到暗色"}
            onClick={toggleTheme}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
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
