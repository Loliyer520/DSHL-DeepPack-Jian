# @djian/webui

D剪的项目、素材、时间线、AI 操作及导出 API 服务。

当前产品界面在 `packages/client-timeline`，以 DSHL 右侧栏插件运行。此目录的 `src/` 保留旧独立界面；`server/index.mjs` 不再托管该界面。

修改剪辑面板后运行根目录的 `npm run check:timeline` 和 `npm run bundle -w @djian/client-ui-timeline`。修改引擎时先运行 `npm run build:engine`，相关时间线回归检查运行 `npm test`。
