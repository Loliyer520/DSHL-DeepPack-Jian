import React from 'react';
import { Panel } from './Panel';
import { injectStyles } from './styles';

// 胶片 glyph（guide 胶囊图标）
const FilmGlyph = ({ size = 16, className }: { size?: number; className?: string }) =>
  React.createElement('svg', { width: size, height: size, viewBox: '0 0 16 16', fill: 'none', className },
    React.createElement('rect', { x: 1.5, y: 3, width: 13, height: 10, rx: 2, stroke: 'currentColor', strokeWidth: 1.3 }),
    React.createElement('path', {
      d: 'M5.5 3v10M10.5 3v10M1.5 6.2h4M1.5 9.8h4M10.5 6.2h4M10.5 9.8h4',
      stroke: 'currentColor', strokeWidth: 1.1,
    }),
  );

// 注意：模块导出的 inject 是 cordis 服务短名（运行时依赖），
// package.json 的 dsh.client.inject 才是包名（加载顺序）。两者不是一回事。
export const inject = [
  'slots',
  'sidebarRightTabs',
];

// 官方模式（对照 dsh-client-ui-sidebar-files/documentpreview 的 bundle 实现）：
// 1) sidebarRightTabs.register 注册 tab 类型定义（id/kind/title/guide 胶囊）
// 2) slots.inject("sidebar.right.pane.tab", ...) 里 slots.register 挂该类型的渲染组件（key = 类型 id）
export function apply(ctx: any) {
  injectStyles();

  ctx.effect(
    () =>
      ctx.sidebarRightTabs.register({
        id: 'djian.timeline',
        kind: 'djian.timeline',
        priority: 'builtin',
        title: () => '剪辑面板',
        guide: [
          {
            order: 10,
            title: () => '剪辑面板',
            description: () => '预览 · 片段 · 字幕 · 导出',
            icon: FilmGlyph,
          },
        ],
      }),
    'djian-timeline: tab type',
  );

  ctx.slots.inject('sidebar.right.pane.tab', () =>
    ctx.slots.register(
      { name: 'sidebar.right.pane.tab', key: 'djian.timeline' },
      Panel,
    ),
  );
}
