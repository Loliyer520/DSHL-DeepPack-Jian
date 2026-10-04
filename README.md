# D剪

人与 AI 同时剪同一条时间线的视频剪辑工作台。你在 DSH 右侧栏的「D剪」面板里手动剪，AI 在对话里用 `djian_*` 工具剪，两边编辑的是同一份由引擎托管的时间线，彼此的修改实时可见；你的每一次修改、当前选中和播放头位置，都会在下一次调用模型前作为 `<editor-activity>` 事件进入模型上下文。

最终形态是 DSH 整合包（`.dspack`，manifest v5 / 容器 v3），由 DSHL 一键导入。

## 能做什么

- **时间线**：主轨（首尾相接）+ 多层画中画 + 多条音频 + 多层文字，全部同屏，也可专注某一类轨道；拖动移动/换轨/重排、边缘裁剪、淡入淡出手柄、音量包络线、框选、吸附、右键菜单、从素材库或系统直接拖入。
- **属性面板**：画面（位置大小、缩放旋转、不透明度、混合模式、裁切、翻转、填充方式）、动画预设（入场/出场/组合/循环，随片段时长自动伸缩）、关键帧（数值旁 ◆ 在播放头处打帧，有关键帧后改值自动打帧，可设缓动）、调色、变速（保持源素材范围）、定格、转场（8 种，居中于剪辑点）、字幕样式（字体/描边/阴影/底框/对齐/字距）、人声闪避、轨道锁定/静音/隐藏。
- **协作**：撤销只回退你自己的修改，不会吞掉 AI 期间的改动；「动态」里能看到 AI 的每次修改并单独撤销；锁定的轨道 AI 改不了；AI 工作时面板显示状态并高亮它改过的片段。
- **字幕文件**：SRT / WebVTT 导入（UTF-8 / GBK 都能读，重叠时自动放到新字幕层）与导出。
- **导出**：本机渲染 H.264 + AAC，三档分辨率与画质，可后台进行；历史版本可保存与恢复。

## 目录

```
packages/
├── engine           时间线 schema v5、唯一的操作语义（ops）、差异/描述、Remotion 合成与渲染
├── webui/server     引擎服务：项目、素材、协同操作日志（rev + SSE）、取帧、导出、字幕 API
├── host-bridge      DSH 宿主插件：注册 djian_* 原生工具、把用户修改注入模型上下文、同步 AI 状态
├── client-timeline  DSH 右侧栏面板「D剪」（预览、时间线、属性、素材、动态）
├── client-library   DSH 右侧栏面板「资源库」（Openverse CC 素材搜索与导入）
├── agent            MCP 适配器（非 DSH 宿主时使用同一套工具）
└── pack             整合包：manifest、cordis 补丁（D剪 人格与插件）、技能文档、构建脚本
docs/                架构与协议说明
tests/               单元与集成测试
```

架构、协同协议与打包约定见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。

## AI 工具

| 工具 | 作用 |
| --- | --- |
| `djian_timeline` | 时间线大纲（每个对象带 id），可附素材清单 |
| `djian_apply_ops` | 一批编辑操作（加/删/改/移动/分割片段、文字、轨道、关键帧、标记、画布），返回回执与新 id |
| `djian_changes` | 某个版本之后谁改了什么（含用户在面板的修改） |
| `djian_frame` | 抽一帧或多帧画面（模型支持图像时直接给图） |
| `djian_assets` / `djian_import_asset` | 素材清单 / 导入本地文件 |
| `djian_search_media` / `djian_download_media` | 在线 CC 素材搜索与下载 |
| `djian_subtitles` | SRT/VTT 导入与导出 |
| `djian_export` | 导出视频并查询进度 |

## 安装

在 DSHL（≥ 0.5.0.0）中导入 `dist/djian-<版本>.dspack`。整合包声明的启动器兼容性：

| 启动器 | 支持 | 说明 |
| --- | --- | --- |
| DSHL | ✓ | 使用 vendor 直挂安装与 services 本地服务托管 |
| HDSL / PackForge App / 官方桌面版 / dsh CLI | ✗ | 依赖上述 DSHL 扩展 |

整合包内含预构建的渲染包与字体，安装后第一次取帧/导出无需打包；渲染使用本机较新的 Chrome / Edge（≥ 120），没有时由 Remotion 准备。

## 开发

需要 Node.js ≥ 22.18。

```sh
npm ci
npm run check          # 引擎与两个面板的类型检查
npm test               # 单元测试 + 真实引擎进程的接口/协同测试
npm run build:client   # 构建两个面板（lib/ 随仓库提交）
npm run pack           # 构建 → 规范自检 → 叶子依赖检查 → 打包 → 回读校验，输出 dist/*.dspack 与 .sha256
```

联调与真实环境验证（需要本机装好 `@deepseek-ai/dsh` 及其 base/web-app 包，均使用本地假模型，不调用收费模型）：

```sh
npm run test:host -- <@deepseek-ai/dsh 目录>        # 真实 DSH 宿主：工具注册、人格、编辑事件进入模型请求
npm run serve:dsh -- <@deepseek-ai/dsh 目录> 7788   # 启动带 D剪 的 DSH web，浏览器里手动检查面板
npm run test:render                                 # 真实导出回归（需要 PATH 中的 FFmpeg/FFprobe）
npm run test:seek                                   # 媒体跳转只读必要字节（需要 Chrome/Edge 与 FFmpeg）
```

`npm run serve:dsh` 打印的地址后加 `#djian-engine=<引擎端口>`（DSHL 会自动带上），面板据此找到引擎。

## 环境变量

| 变量 | 作用 |
| --- | --- |
| `PORT` / `DJIAN_HOST` | 引擎监听端口（默认 5180）/ 地址（默认 127.0.0.1，只监听本机） |
| `DJIAN_DATA_DIR` | 数据目录（默认 `~/.djian`）：项目、素材、历史、导出 |
| `DJIAN_ALLOWED_ORIGINS` / `DJIAN_ALLOWED_HOSTS` | 额外允许的来源 / Host（默认只允许本机） |
| `DJIAN_ENGINE_URL` | 宿主插件与 MCP 指定引擎地址（DSHL 下由 `DSHL_SERVICE_PORTS` 自动提供） |
| `DJIAN_BROWSER_EXECUTABLE` | 指定渲染用 Chrome / Edge |
| `DJIAN_FFMPEG` / `DJIAN_FFPROBE` | 指定素材探测与缩略图用的 FFmpeg（默认 PATH，其次 Remotion 自带） |
| `DJIAN_RENDER_BINARIES_DIR` | 指定完整的渲染二进制目录（合成器、FFmpeg、FFprobe 与动态库） |
| `DJIAN_NO_WARMUP` | 启动时不预热渲染器 |
