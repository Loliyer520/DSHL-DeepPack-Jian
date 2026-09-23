import React from 'react';
import { LibraryPanel } from './LibraryPanel';
import { injectStyles } from './styles';

// 资源库 glyph（guide 胶囊图标：云朵下载）
const LibraryGlyph = ({ size = 16, className }: { size?: number; className?: string }) =>
  React.createElement('svg', { width: size, height: size, viewBox: '0 0 16 16', fill: 'none', className },
    React.createElement('path', {
      d: 'M4.5 6.5a3 3 0 0 1 .6-5.9 3.5 3.5 0 0 1 6.7 1A2.75 2.75 0 0 1 11.5 7H5a2.5 2.5 0 0 1-.5-.5z',
      stroke: 'currentColor', strokeWidth: 1.2, strokeLinejoin: 'round',
    }),
    React.createElement('path', {
      d: 'M8 8.5v5m0 0l-2-2m2 2l2-2',
      stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round', strokeLinejoin: 'round',
    }),
  );

// 注意：模块导出的 inject 是 cordis 服务短名（运行时依赖），
// package.json 的 dsh.client.inject 才是包名（加载顺序）。两者不是一回事。
export const inject = [
  'slots',
  'sidebarRightTabs',
];

// 官方模式（对照 client-ui-timeline 的注册实现）：
// 1) sidebarRightTabs.register 注册 tab 类型定义（id/kind/title/guide 胶囊）
// 2) slots.inject("sidebar.right.pane.tab", ...) 里 slots.register 挂该类型的渲染组件（key = 类型 id）
export function apply(ctx: any) {
  injectStyles();

  ctx.effect(
    () =>
      ctx.sidebarRightTabs.register({
        id: 'djian.library',
        kind: 'djian.library',
        priority: 'builtin',
        title: () => '资源库',
        guide: [
          {
            order: 20,
            title: () => '资源库',
            description: () => '在线 CC 素材 · 搜索 · 试听 · 导入',
            icon: LibraryGlyph,
          },
        ],
      }),
    'djian-library: tab type',
  );

  ctx.slots.inject('sidebar.right.pane.tab', () =>
    ctx.slots.register(
      { name: 'sidebar.right.pane.tab', key: 'djian.library' },
      LibraryPanel,
    ),
  );
}
