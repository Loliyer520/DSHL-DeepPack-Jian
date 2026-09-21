# D剪

JSON 时间线驱动的视频剪辑工具：**AI 操作剪辑**与 **WebUI 手动调整/预览**编辑同一份时间线 JSON，渲染层吃 JSON 出 mp4。最终形态为 dsh 整合包（.dspack），可被 DSHL 一键导入。

## 架构

```
packages/
├── engine   @djian/engine  — Remotion 渲染引擎：时间线 schema + 渲染 API + CLI（JSON 进 → mp4 出）
├── webui    @djian/webui   — 浏览器剪辑界面（Remotion Player 预览 + 时间线编辑器，产出/编辑 JSON）
└── pack     — dsh 整合包源（manifest v5 / .dspack v3 + home/ 剪辑技能）→ 构建脚本出 .dspack
examples/    — 示例时间线 JSON（引擎测试与格式文档）
```

设计原则见 [docs 待补]：时间线 JSON 是唯一事实源；整合包做薄壳、代码做 npm 包；一切依赖坐标钉死。

## 快速验证

```sh
npm install
npm run build:engine
node packages/engine/bin/djian-render.mjs examples/timeline-a.json -o out/demo.mp4
```
