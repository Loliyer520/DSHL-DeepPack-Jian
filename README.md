# D剪

当前整合包版本 **3.0.1**。补丁修复 DSHL 启动时间线面板时缺少 `react-dom/server` 的错误，浏览器静态 SVG 渲染器现随面板打包。本次集中发布此前完成的画面与动画、设计审片、工程工作流、交付检查及 AI 效率改进。查看 [3.0 发布说明](docs/RELEASE-3.0.md)。

- [AI 工作流](docs/AI-WORKFLOW.md)：按任务提供上下文、参数按需查询、批量预演和局部审片。
- [交付质量](docs/DELIVERY-QUALITY.md)：素材预检、字幕精排、音频实测、导出前检查与低清样片。
- [实测审片](docs/MEASURED-REVIEW.md)：浏览器测量、设计保护、动态抽样和可撤销的修正建议。

人与 AI 同时剪同一条时间线的视频剪辑工作台。你在 DSH 右侧栏的「D剪」面板里手动剪，AI 在对话里用 `djian_*` 工具剪，两边编辑的是同一份由引擎托管的时间线，彼此的修改实时可见；你的每一次修改、当前选中和播放头位置，都会在下一次调用模型前作为 `<editor-activity>` 事件进入模型上下文。

最终形态是 DSH 整合包（`.dspack`，manifest v5 / 容器 v3），由 DSHL 一键导入。

## 能做什么

- **内核与工具（2.11.0）**：写时复制与局部布局、共享索引、持久化事务恢复、AI 幂等请求与字段冲突保护、统一操作契约。参见 [优化说明与基准](docs/KERNEL-OPTIMIZATION.md)。

- **工程工作流（2.10.0）**：嵌套合成与内部音画调速、后台预览代理与取帧缓存、CSV/JSON 批量生成及串行导出队列、便携工程包与缺失素材重链接。参见 [使用说明](docs/PROJECT-WORKFLOW.md)。

- **制作工具（2.9.0）**：可复用组件与实例参数、项目主题、可拖动动画编排、保留动画的素材替换与横竖屏适配、真实轻量 3D、可定位的成片检查。参见 [使用说明](docs/STUDIO-TOOLKIT.md) 和 [示例项目](examples/studio-toolkit.json)。

- **时间线**：主轨（首尾相接）+ 多层画中画 + 多条音频 + 多层文字，全部同屏，也可专注某一类轨道；拖动移动/换轨/重排、边缘裁剪、淡入淡出手柄、音量包络线、框选、吸附、右键菜单、从素材库或系统直接拖入。
- **属性面板**：画面（位置大小、缩放旋转、不透明度、混合模式、裁切、翻转、填充方式）、动画预设（入场/出场/组合/循环，随片段时长自动伸缩）、关键帧（数值旁 ◆ 在播放头处打帧，有关键帧后改值自动打帧，可设缓动）、调色、变速（保持源素材范围）、定格、转场（8 种，居中于剪辑点）、字幕样式（字体/描边/阴影/底框/对齐/字距）、人声闪避、轨道锁定/静音/隐藏。
- **PPT 式画面元素**：文本框（富文本 `**加粗**`、`==强调色==`、`[#色值]..[/]`、列表、数字滚动、逐字/逐词/逐行入场）、20 种形状（纯色/渐变填充、描边、虚线、圆角、箭头连线）、243 个 Lucide 图标、8 种图表（柱/条/折线/面积/饼/环/进度条/进度环，带生长动画）、图片元素（圆角、边框、投影）。都是原生、可单独编辑的元素，不再需要把文字和图案渲染成图片再导入。
- **布局与路径编辑**：元素/组合支持真实时间采样运动模糊；可视化路径节点与贝塞尔控制柄；横排、竖排、网格布局及文字尺寸自动适配、背景随内容伸缩。参见 [2.7.0 说明](docs/LAYOUT-PATH-BLUR.md) 与 [演示项目](examples/layout-path-blur.json)。
- **遮罩与表面动画**：二维元素或视频轨道支持 Alpha/亮度/反向遮罩，渐变颜色与色标可打关键帧，原生轮廓扫光；动画片段可在项目内保存、按目标时长复用。参见 [2.6.0 功能说明](docs/SURFACE-ANIMATION.md) 与 [示例](examples/surface-animation.json)。
- **视觉增强与曲线编辑**：内阴影、渐变描边、背景毛玻璃，相邻场景共享元素过渡，以及可拖拽关键帧和贝塞尔控制点的曲线编辑器。参见 [功能说明](docs/VISUAL-POLISH.md) 与 [示例](examples/visual-polish.json)。
- **动画编排**：遮罩位置/尺寸/羽化关键帧，父子跟随和自动连接箭头，组内错峰入场，以及可调刚度/阻尼/质量的物理弹簧缓动。参见 [说明](docs/ANIMATION-CHOREOGRAPHY.md) 与 [示例](examples/animation-choreography.json)。
- **组合与运动**：组合共享支点进行整体 2D/3D 变换，保留成员动画；椭圆/矩形/自定义路径遮罩支持羽化与反向；SVG 运动路径支持匀速、自动转向与进度关键帧。参见 [组合与路径示例](examples/group-mask-path.json) 和 [功能说明](docs/GROUP-MASK-PATH.md)。
- **元素外观**：所有可见元素支持原生多层阴影（最多 8 层，颜色/透明度/模糊/偏移/轮廓扩展独立可调），内置柔和、悬浮、硬边与发光预设；静态模糊/调色与混合模式；渐变面板可增删、移动 2–8 个色标。AI 直接设置这些属性，无需复制图形模拟。当前时间线格式为 v20，旧项目自动读取，旧引擎只读保护。
- **幻灯片模板**：14 种版式（封面、章节、卡片、要点、数据、引用、对比、时间线、流程、图表、图文、公式、函数图像、结尾）× 7 套主题，横竖屏自动换排布；插入后整页在时间线上是一块（整体移动/改时长/复制/删除），页内每个元素仍可单独编辑。
- **画布直接编辑**：在预览上点选元素（按住即可拖动）、八向缩放、旋转、吸附画布与其他元素、双击就地改字（公式双击改 LaTeX）、右键选中被遮挡的元素、调整叠放顺序、在播放头处变形、编辑镜头；选中镜头时显示镜头框，可拖动取景；有镜头时元素按镜头画面拖动缩放。多选后对齐与均分。「插入」面板（快捷键 I）一键加文字/形状/数学/图标/图表/图片/整页幻灯片。
- **元素动画**：新增擦除、上浮、下落、弹出、模糊、展开等入场/出场，以及「进度」类（打字机、描边绘制、数字滚动、图表生长、公式书写、坐标系依次画出），可与入场动画叠加。
- **轻量 3D 与高级转场**：文字、图形、图片和视频支持透视、X/Y 旋转、Z 轴纵深、背面显示与关键帧，内置翻入/翻出、纵深推进、立体摇摆和自转预设；新增卡片翻转、立方体换面、圆形展开、斜向擦除、变焦模糊、甩镜转场，可调方向、缓动及强度。这是可编辑平面的 2.5D 效果，不包含 3D 模型、几何厚度或场景灯光。
- **数学动画（3Blue1Brown 风格）**：LaTeX 公式元素（MathJax 排版成矢量字形，逐笔书写、局部上色、中文、矩阵、\cancel…）；坐标系元素（坐标轴/网格/刻度，函数、参数曲线、极坐标、点、切线、曲线下面积、黎曼和、向量、标注，表达式求值不用 eval）；参数关键帧驱动联动（点沿曲线走、切线跟着转、面积跟着长）；**变形**——公式推导（相同字符平滑移到新位置，多出的淡入淡出）、形状逐点变形、函数与坐标范围连续变化；**镜头**——整页推近、拉远、平移；自由路径与弧形箭头。都是可编辑的原生元素，导出与预览一致。
- **数学幻灯片**：「公式」「函数图像」两种模板与「数学黑板」主题；插入面板的「数学」页有常用公式（带实时预览）与坐标系示例（切线与导数、曲线下面积、参数曲线、极坐标、向量）。
- **协作**：撤销只回退你自己的修改，不会吞掉 AI 期间的改动；「动态」里能看到 AI 的每次修改并单独撤销；锁定的轨道 AI 改不了；AI 工作时面板显示状态并高亮它改过的片段。
- **字幕文件**：SRT / WebVTT 导入（UTF-8 / GBK 都能读，重叠时自动放到新字幕层）与导出。
- **导出**：本机渲染 H.264 + AAC，三档分辨率与画质，可后台进行；历史版本可保存与恢复。

## 目录

```
packages/
├── engine           时间线 schema v20、唯一的操作语义（ops）、差异/描述、Remotion 合成与渲染、公式排版（构建时打包 MathJax）
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

元素外观示例：[可编辑时间线](examples/element-appearance.json) · [渲染预览](docs/screenshots/30-element-appearance.png)
3D 与转场示例：[可编辑 3D 元素](examples/3d-elements.json) · [转场时间线](examples/advanced-transitions.json) · [3D 预览](docs/screenshots/31-3d-elements.png) · [转场预览](docs/screenshots/32-advanced-transitions.jpg)


## AI 工具

| 工具 | 作用 |
| --- | --- |
| `djian_timeline` | 时间线大纲（每个对象带 id），可附素材清单 |
| `djian_style` / `djian_handoff` | 项目级风格卡 / 轻量新会话接力摘要 |
| `djian_checkpoint` | 保存、列出和按用户要求恢复确认版本 |
| `djian_apply_ops` | 一批编辑操作（加/删/改/移动/分割片段、文字与画面元素、公式/坐标系/镜头、变形、整页幻灯片、叠放顺序、轨道、关键帧、标记、画布），返回回执与新 id；公式有 LaTeX 错误、坐标系表达式写错时回执给出提示 |
| `djian_catalog` | 查可用的图标、形状、图表、幻灯片模板与主题、动画预设、字体 |
| `djian_changes` | 某个版本之后谁改了什么（含用户在面板的修改） |
| `djian_frame` | 抽一帧或多帧画面（模型支持图像时直接给图） |
| `djian_assets` / `djian_import_asset` | 素材清单 / 导入本地文件 |
| `djian_image` | OpenAI 兼容中转站文生图、参考图/蒙版改造，结果自动入库 |
| `djian_search_media` / `djian_download_media` | 在线 CC 素材搜索与下载 |
| `djian_subtitles` | SRT/VTT 导入与导出 |
| `djian_export` | 导出视频并查询进度 |

### 风格库

内置 15 套 MG 视觉风格（扁平矢量、等轴 2.5D、包豪斯、像素、Synthwave、玻璃拟态、综艺花字等，来自 [mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15)，MIT）。AI 做幻灯片 / 封面 / 信息图 / 生图时会先选风格、按可检验特征（色板、版式网格、动效曲线）执行，并用 djian_frame 抽查关键帧迭代，不凭空发挥。

## 安装

在 DSHL（≥ 0.5.0.0）中导入 `dist/djian-<版本>.dspack`。整合包声明的启动器兼容性：

| 启动器 | 支持 | 说明 |
| --- | --- | --- |
| DSHL | ✓ | 使用 vendor 直挂安装与 services 本地服务托管 |
| HDSL / PackForge App / 官方桌面版 / dsh CLI | ✗ | 依赖上述 DSHL 扩展 |

整合包内含预构建的渲染包与字体，安装后第一次取帧/导出无需打包；渲染优先用本机较新的 Chrome / Edge（≥ 120，新版无头模式），本机浏览器启动失败（如 Edge 有待安装的更新）时自动改用 Remotion 自带的无头浏览器。

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
npm run test:spatial                                # 透视、背面、3D 关键帧与高级转场真实像素回归
npm run test:effects                                # 元素阴影、滤镜和混合模式的真实像素回归
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
| `DJIAN_GPU_ENCODER` | H.264 导出编码：`auto`（默认，实际试编码后选择 NVENC/QSV/AMF/VideoToolbox，失败回退 CPU）、`off`、`nvenc`、`qsv`、`amf`、`videotoolbox` |
| `DJIAN_IMAGE_API_KEY` | （备用）AI 生图/改图的中转站密钥；推荐在面板「素材 → AI 生图设置」里配置，面板配置优先 |
| `DJIAN_IMAGE_BASE_URL` | （备用）OpenAI 兼容接口根地址，默认 `https://api.openai.com/v1`；面板配置优先 |
| `DJIAN_IMAGE_MODEL` | （备用）默认图像模型，默认 `gpt-image-1`；单次调用也可用 `djian_image.model` 覆盖 |
| `DJIAN_IMAGE_TIMEOUT_MS` | （备用）图像请求与结果下载超时，默认 300000ms，最大 600000ms |

### 模型配置

整合包使用 DSH 官方 DeepSeek 默认路由与模型，不内置 GLM 或自定义上游地址。请在宿主「设置 → 模型」中配置 DeepSeek 凭据。

### AI 生成 / 改造图片素材

打开 D剪 面板「素材 → AI 生图设置」（齿轮按钮），填写 OpenAI 兼容中转站的地址、密钥与默认模型即可，保存后立即生效、无需重启。密钥只保存在本机引擎数据目录（`settings.json`），不会出现在对话或工具返回里。无人值守部署也可改用上面的 `DJIAN_IMAGE_*` 环境变量（面板配置优先）。之后 AI 可调用 `djian_image`：

- `action:"generate"`：请求 `POST <baseURL>/images/generations` 文生图。
- `action:"edit"`：请求 `POST <baseURL>/images/edits`，以当前项目的一张或多张图片作为参考，可选蒙版。
- 支持 OpenAI 格式的 `b64_json` 或图片 URL 返回；结果自动作为**新素材**导入，不覆盖原图，并给支持图像输入的 AI 返回预览。
- 常用参数：`prompt`、`size`、`quality`、`n`（1–4）、`outputFormat`（png/jpeg/webp）、`name`。生成后 AI 会返回实际素材文件名，再用 `addClip` 或 `addOverlay` 放入时间线。

### 长任务审美稳定

- `djian_style` 把从 15 套 MG 风格中选定的名称、核心配色、字号、边距和动效上限保存到项目 `project.json`，每个新对话轮次自动注入，不依赖越来越长的聊天记录。
- `djian_handoff` 生成包含当前任务、修改范围、风格卡、时间线大纲和最近检查点的轻量摘要；换镜头或上下文变长时粘贴到新会话。
- `djian_checkpoint` 在确认版或大改前留档。恢复只应由用户明确要求触发，避免 AI 因自己的反复判断覆盖用户成果。

### GPU 导出

默认 `DJIAN_GPU_ENCODER=auto`：先用 256×256 测试帧实际试编码，Windows/Linux 按 NVENC → QSV → AMF 选择，macOS 使用 VideoToolbox；正式导出异常时自动用 libx264 重试。锁定某个硬件编码器后若试编码失败会明确报错，不会静默降级。导出结果与任务状态会记录实际使用的 `encoder`。

### 2.8.0：粒子与音频驱动

支持五种可复现粒子效果、音频驱动缩放/透明度/旋转、波形柱、起音标记，以及不影响导出质量的预览档位。详见 [使用说明](docs/AMBIENT-AUDIO.md)。

### 设计与审片（2.12）

新增项目设计规范、四种版式、中文排版、三个真实画面方案对比与 AI 视觉审片建议预览。采用可撤销，旧版本建议拒绝覆盖新编辑。详见 [设计与审片](docs/DESIGN-STUDIO.md)。

### 内容自适应与场景设计（2.13）

新增按内容测量的版式、主副标题层级保护、文本缩字与行数约束、独立场景配色，以及真实渲染视觉回归基准。详见 [使用与测试说明](docs/ADAPTIVE-DESIGN.md)。

### 实测审片与设计保护（2.14）

新增真实字体与浏览器边界测量、手工设计保护、带区域标记的审片建议、忽略/复查，以及动态画面抽样检查。修改先预览，采用后可撤销。详见 [说明与检查边界](docs/MEASURED-REVIEW.md)。
