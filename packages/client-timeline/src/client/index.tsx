// D剪 剪辑面板：注册为 DSH 右侧栏标签页类型（第三方 extension 档），渲染体从宿主标准 props 取
// sessionId / useTabInfo / inputActions。每个会话一份编辑器状态（store/选中/时钟），切会话互不干扰。
import React, { useMemo, useRef } from 'react';
import { ALL_CSS } from './styles';
import { EditorProvider, PlayerClock, type Editor, type HostCapabilities } from './context';
import { TimelineStore } from './store';
import { SelectionStore } from './selection';
import { Workspace } from './Workspace';

interface TabInfo { sidebar?: { expanded?: boolean; fullscreen?: boolean }; tab?: { visible?: boolean } }
interface InputActions { captureInsertion: () => unknown; insertText: (text: string, span: unknown) => boolean }
interface PanelProps { sessionId?: string; useTabInfo?: () => TabInfo; inputActions?: InputActions }
interface SidebarRight { commandTarget?: (el?: Element | null) => unknown; toggleFullscreen?: (target: unknown) => void }

const FilmGlyph = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
    <rect x={1.5} y={3} width={13} height={10} rx={2} stroke="currentColor" strokeWidth={1.3} />
    <path d="M5.5 3v10M10.5 3v10M1.5 6.2h4M1.5 9.8h4M10.5 6.2h4M10.5 9.8h4" stroke="currentColor" strokeWidth={1.1} />
  </svg>
);

const useNoTabInfo = (): TabInfo => ({});

function makePanel(sidebarRight: SidebarRight | undefined) {
  return function DjianPanel({ sessionId, useTabInfo, inputActions }: PanelProps) {
    const info = (useTabInfo ?? useNoTabInfo)();
    const rootRef = useRef<HTMLDivElement>(null);
    // 会话级编辑器：sessionId 变化即整套重建（Workspace 以 key 重新挂载）
    const core = useMemo(() => ({ store: new TimelineStore(sessionId), sel: new SelectionStore(), clock: new PlayerClock() }), [sessionId]);
    const visible = info.tab?.visible ?? true;
    const expanded = Boolean(info.sidebar?.fullscreen);
    const editor: Editor = useMemo(() => {
      const host: HostCapabilities = {
        visible,
        expanded,
        insertIntoChat: inputActions ? (text) => {
          try { return inputActions.insertText(text, inputActions.captureInsertion()); } catch { return false; }
        } : undefined,
        toggleExpand: sidebarRight?.toggleFullscreen && sidebarRight.commandTarget ? () => {
          const target = sidebarRight.commandTarget!(rootRef.current);
          if (target) sidebarRight.toggleFullscreen!(target);
        } : undefined,
      };
      return { ...core, sessionId, host };
    }, [core, sessionId, visible, expanded, inputActions]);
    return (
      <div ref={rootRef} style={{ height: '100%', minHeight: 0 }}>
        <EditorProvider value={editor}><Workspace key={sessionId ?? 'default'} /></EditorProvider>
      </div>
    );
  };
}

// 运行时依赖的 cordis 服务短名（package.json 的 dsh.client.inject 是加载顺序用的包名，两者不同）
export const inject = ['slots', 'sidebarRightTabs', 'sidebarRight'];

export function apply(ctx: any) {
  ctx.effect(() => {
    const style = document.createElement('style');
    style.id = 'djian-timeline-css';
    style.textContent = ALL_CSS;
    document.head.appendChild(style);
    return () => style.remove();
  }, 'djian-timeline: styles');

  ctx.effect(() => ctx.sidebarRightTabs.register({
    id: '@djian/client-ui-timeline',
    kind: 'djian.timeline',
    keepMounted: true,
    priority: 'extension',
    title: () => 'D剪',
    guide: [{ id: 'open', order: 10, title: () => 'D剪 剪辑', description: () => '和 AI 一起剪：时间线 · 字幕 · 关键帧 · 导出', icon: FilmGlyph }],
  }), 'djian-timeline: tab type');

  const Panel = makePanel(ctx.sidebarRight as SidebarRight | undefined);
  ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab', () =>
    ctx.slots.register({ name: 'sidebar.right.pane.tab', key: '@djian/client-ui-timeline' }, Panel),
  ), 'djian-timeline: tab body');
}
