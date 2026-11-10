# D剪 架构

## 总览

```
           DSH 宿主（cordis）                                      浏览器（DSH web / DSHL WebView2）
┌──────────────────────────────────────┐                 ┌───────────────────────────────────────┐
│ agent loop ──pre-step──▶ host-bridge │                 │ 「D剪」面板 client-timeline            │
│   ▲   │                   │  ▲       │                 │  TimelineStore（乐观更新 + 变基）      │
│   │   └─ djian_* 工具 ─────┘  │       │                 │  Player 预览（与导出同一组件）         │
│   │                           │       │                 └──────────────▲────────────────────────┘
│   └── <editor-activity> ◀─────┘       │                                │ HTTP + SSE（X-Djian-Client）
└───────────────────┬──────────────────┘                                │
                    │ HTTP（同一协议）                                    │
                    ▼                                                    │
        ┌──────────────────────────────────────────────────────────────┴──┐
        │ 引擎服务 webui/server（DSHL services 托管，只监听 127.0.0.1）      │
        │  项目 / 素材 / 操作日志 rev / SSE / 在场状态 / 取帧 / 导出 / 字幕   │
        │  applyOps（engine/ops）+ validateTimeline（engine/schema）         │
        │  常驻 Chrome + 预构建 Remotion bundle（engine/render）            │
        └─────────────────────────────────────────────────────────────────┘
```

- **唯一事实源**是引擎服务里的时间线。面板与 AI 都只提交「操作」（ops），从不整份覆盖。
- **唯一的操作语义**在 `engine/src/ops.ts`：面板乐观应用、服务端权威应用、AI 工具调用，三方都跑同一个 `applyOps`，所以本地预测与服务端结果一致。
- **会话即项目**：每个 DSH 会话绑定一个项目（`/api/session-project`），AI 工具从调用上下文拿到会话 id，面板从宿主标准 props 拿到会话 id，两边自然落在同一个项目，不同会话互不干扰。

## 时间线 schema v6

v5 在 v4 基础上全部为可选字段（旧数据零改动可读）：稳定的文字/标记 id；以对象表示、居中于剪辑点的转场；动画预设引用（按片段当前时长展开，裁剪/变速后自动对齐）；裁切、翻转、混合模式、填充方式、定格、圆角投影；字幕版式与描边/阴影/底框；音频淡入淡出与按人声闪避；轨道隐藏/锁定/静音；标记。数据的 `version` 高于引擎支持的版本时以只读打开，旧版引擎不会覆盖新数据；损坏的文件隔离备份并从最近的快照恢复。

v6 同样只加可选字段：每条 `overlay` 都是一个**画面元素**，`kind` 为 subtitle / title / text / shape / image / icon / chart。

- **盒子**：`x/y` 是元素中心、`w/h` 是盒子宽高（都按画布比例）；`rotate`、`opacity`、`name`（图层名）、`group`（同组元素，如一页幻灯片）。没有 `w` 的旧字幕照旧按 `position`/`maxWidth` 排版，旧项目位置不变。
- **文字**：富文本标记 `**加粗**`、`==强调色==`、`[#hex]..[/]`（字幕不解析）；`list` 列表、`accent` 强调色、`valign`/`padding`、`counter` 数字滚动、`textEffect` 逐字/逐词/逐行入场。
- **形状/图片/图标/图表**：`shape`（20 种，纯色或线性/径向渐变填充、描边与虚线、圆角、星形角数与内径）、`image`（素材、适应方式、圆角、边框）、`icon`（内置 Lucide 图标名、线宽、填充）、`chart`（8 种，数据、配色、数值/标签、前缀单位、满值、粗细）。
- **叠放**：非字幕元素按（`track`，数组下标）从下到上叠放，字幕始终在最上层；`arrangeOverlay` 调整顺序（只与时间上重叠的元素比较）。
- **动画通道**：新增 `clipL/clipR/clipT/clipB`（擦除，渲染为 `clip-path: inset`）与 `progress`（打字机、描边绘制、数字滚动、图表生长，缺省 1）。**行为变化**：文字的 `x/y` 位移关键帧现在与画中画一致，按画布比例计算（以前按文字自身尺寸），旧项目里文字的位移动画幅度会不同。

## 时间线 schema v7（数学动画）

v7 仍只加可选字段，但旧版引擎读到会丢掉这些字段，所以版本号升到 7（旧版引擎以只读打开新数据，不会覆盖）。

- **公式** `kind:"math"`：`text` 是 LaTeX（自动去掉 `$…$`、`\[…\]` 定界符），按 `fontSize` 自然大小排版，`x/y` 为中心。排版在引擎服务端做：构建时把 `mathjax-full` 连同入口（`engine/mathjax/entry.ts`）打成 `dist/mathjax.cjs`，运行时没有额外依赖；`GET /api/math?tex=` 把 SVG 拍平成「字形片」（每片：匹配键 = Unicode 码位或「rect:mfrac」等、绝对变换矩阵、`\color` 颜色）。面板与导出都从这个接口取数并缓存，导出时用 `delayRender` 等排版就绪；面板包体积不含 MathJax。`progress` 驱动逐笔书写（按字形从左到右错开，先描边后填色）。`applyOps` 的 `checkTex`（服务端提供）把 LaTeX 错误作为警告回给模型。
- **坐标系** `kind:"plot"`：`plot{x, y, xStep?, yStep?, grid?, axes?, ticks?, numbers?, xLabel?, yLabel?, params?, items[]}`。对象类型 fn / param / polar / point / tangent / area / riemann / vector / segment / label；表达式由 `engine/src/expr.ts` 解析成闭包求值（不用 `eval`，支持隐式乘法、`|x|`、`n!`、带 id 的用户函数互相引用）。`params` 里的参数可写成关键帧，表达式引用参数即形成联动。没有 `start` 的对象随 `progress` 依次画出，有 `start/draw/end` 的按元素内时间出现与消失。净化时检查表达式语法与未定义的名字并给出警告。
- **变形** `morph{from, duration?, ease?}`：元素开头 duration 秒从 `from` 元素的最终状态变成自己。`transform{id, atSeconds, patch}` 一步完成「A 在此结束、B=A+patch 接上并带 morph」，关键帧平移到新起点，出场/循环预设移到 B。渲染（`morph.tsx`）：公式→公式先做保序的序列比对（相同字符才配对、仿射间隙罚分让整段尽量连续），剩余字形再按字符配对允许交叉，配对的字形插值变换矩阵与颜色、其余淡入淡出；形状→形状把两条轮廓按弧长各取 120 点、统一方向并找最佳起点后逐点插值（`paths.ts` 解析含圆弧的全部 SVG 命令）；坐标系→坐标系在对象结构相同时把两边的表达式（参数先代入数值）线性混合、坐标范围插值；其他组合用 `Freeze` 冻结 A 的最后一帧与 B 的变形完成帧，位置大小过渡并交叉淡化。删除来源元素时清掉引用。
- **镜头** `kind:"camera"`：不渲染，描述镜头框——`x/y` 中心、`w` 宽度（1 = 全画面），`x/y/scale` 关键帧移动/缩放镜头框。合成时每个元素外包一层 `CameraLayer`，按绝对时刻找到作用于它的镜头（同组优先，其次不分组的全局镜头，字幕不受影响）并施加变换。面板选中镜头时关掉镜头效果、显示镜头框；画布编辑把舞台坐标经镜头逆变换换算回画布比例。
- **自由路径** `shape.type:"path"`：`path`（SVG 路径）或 `vertices`（可 `smooth` Catmull-Rom、`closed`），坐标为盒子 0–100；开放路径可加 `arrow`，末端按切线方向让出箭头长度。

## 时间线 schema v8（元素外观）

`shadow` 保留旧版单层对象 / `false` 写法，另可写最多 8 层的数组；每层 `{color, blur, x?, y?, opacity?, spread?}`。阴影按真实 alpha 轮廓生成：扩展/收缩 → 高斯模糊 → 偏移 → 着色，每层都读取原始 SourceAlpha，最后与 SourceGraphic 合成，避免连续 drop-shadow 造成阴影再次投影。第一层在最上方，透明度与颜色 alpha 相乘。文字阴影只作用一次；未显式设置的字幕/标题仍沿用原来的默认文字阴影。

所有可见元素新增 `filter`（与片段共用校验与净化）和 `blendMode`；同名关键帧优先于静态滤镜，其余静态滤镜仍生效。预览、导出和几何变形复用外观渲染逻辑。属性面板提供多层阴影/发光预设、逐层参数、滤镜和混合模式；渐变支持 2–8 个色标的增删与位置编辑。AI 工具参数、说明与时间线大纲同步展示这些能力。

数组阴影不能被旧版引擎完整读取，因此格式提升至 v8；v1–v7 自动迁移，旧引擎读取 v8 时只读，防止丢失外观数据。

## 时间线 schema v9（2.5D 与高级转场）

片段与元素共享 `transform3d:{rotateX?,rotateY?,z?,perspective?,backface?}`，通过 CSS 透视平面实现 2.5D；`rotationX/rotationY/z/perspective` 动画通道覆盖对应静态值。旋转单位度，纵深与透视单位画布像素，默认透视 1200。正纵深会在渲染时限于透视距离的 90%，避免穿过相机平面。对已有二维变换零影响；背面默认可见，可显式关闭。3D 元素的 `transform` 几何变形采用已有的通用位置/尺寸与交叉淡化路径，避免二维仿射算法丢失透视。

`transition` 新增 flip/cube/iris/diagonal/zoomBlur/whip，以及 `ease`（预设或贝塞尔）和 `intensity`（0.1–2）。转场函数按确定帧号求值，无随机与 CSS 墙钟动画。旧转场默认线性不变，新转场默认 inOut；媒体预滚、声音与总时长逻辑沿用原有实现。`/api/catalog` 与 `djian_catalog{what:"transitions"}` 提供共享转场目录，面板和 AI 使用相同选项。

v1–v8 自动迁移至 v9。格式版本提升防止旧引擎清除新动画通道或不认识的转场。此实现不包含网格模型、物理光照、全局 Z 排序或模型文件导入。

### 幻灯片模板

`addSlide` 把模板（14 种，含 formula、graph）× 主题（7 套，含 math）展开成一组普通元素，共享一个 `group`，元素 id 由分组 id 推出（`<group>e<i>`），面板乐观插入与服务端结果一致。版式按画布横竖自动切换，字号按短边缩放。整页缺省插在最下层（不遮挡已有元素），元素之间按出场先后错开。`updateGroup`（整体移动/改时长/解组/批量改）与 `removeGroup` 操作整页；面板时间线把同组元素合并成一块显示。

## 协同协议

### 操作日志

每个项目维护单调递增的 `rev` 和事件日志（`events.jsonl`，按大小轮转）。`POST /api/p/:pid/ops`：

```
{ ops, baseRev, actor: user|ai, clientId, label, batchId, undo? }
→ { rev, receipts[], changed[], summary[], patch[], conflicts[], duplicate? }
```

- 服务端应用后用完整 schema 校验，失败整批拒绝（422）。
- `patch` 是实体级系统操作（`putClip/putOverlay/putTrack/putMarker/putMeta` 与删除），由前后两份时间线差分得到；同时记录反向补丁 `inverse`。
- `baseRev` 落后时仍按意图应用（操作按 id 寻址，天然可交换），并在 `conflicts` 里报告与他人修改重叠的实体。
- `batchId` 幂等：网络重试、刷新后重放本地草稿都不会重复应用（重复时返回首次结果并带 `duplicate: true`）。
- 锁定的轨道拒绝非系统身份的修改——用户可以用锁保护自己的内容不被 AI 改动。

### 推送

`GET /api/p/:pid/events?since=rev`（SSE）：先补发 `since` 之后的事件（太旧则发 `reset` 整份），之后实时推送 `ops`（含 patch）、`presence`（AI 工作状态）、`assets`（素材增删）、`deleted`。`GET /changes?since=` 是同一数据的拉取形式。

### 面板 store

`confirmed`（服务端已确认，rev）+ 本地未确认批次队列 = `view`。本地修改乐观应用并排队提交；远端事件以补丁叠加到 `confirmed` 后重放本地批次（变基）。拖动、滑动数值时用 `preview` 显示临时结果，松手一次提交。

预览上的画布编辑（`ui/StageCanvas.tsx`）不维护单独的几何模型：点选用 `elementsFromPoint` 命中合成里带 `data-el`/`data-clip` 的节点（天然符合叠放顺序），自动高度的文本框读渲染出的 `offsetHeight`；拖动/缩放/旋转在元素自身（旋转后的）坐标系里计算，同样走 `preview` → 一次提交。

撤销/重做不是时间线快照回滚，而是对「这一步之前/之后」两份时间线做实体级差分，作为系统操作提交——只触及这一步改过的实体，不会吞掉期间 AI 的修改。「动态」里撤销 AI 的某次修改则直接提交那次事件的反向补丁，本身也可再撤销。

### 把用户的操作告诉模型

`host-bridge` 在 `agent/pre-step`（每次调用模型前）读取上次注入之后的事件与面板在场状态，生成一条用户消息：

```
<editor-activity rev="14" since="12">
用户在剪辑面板里做了以下修改（已生效，时间线以此为准）：
- 14:02 用户「删除 1 项」：删除片段「b.mp4」
- 14:03 用户「关键帧：缩放」：为「a.mp4」在 2s 设 scale 关键帧 = 1.2 ← 改动了你之前修改过的对象
用户当前：播放头 0:02.50；选中 c3「a.mp4」主轨 0.00–4.00s；编辑模式 主轨。用户说“这段/这里/这个”时优先指这里。
</editor-activity>
```

- 只注入面板（用户）产生的事件；AI 自己的修改不重复告诉它。
- 第一次接触某个项目只记录基线，不灌历史。
- 注入的消息带 `source: { kind: 'djian-activity', form: 'snapshot' }` 与 `rev` 属性，宿主重启后从会话历史恢复「上次注入到哪个 rev」，不会重复注入。
- AI 的 `agent/status` 同步成在场状态，面板显示「AI 正在剪辑」并高亮它改过的片段。

## 渲染

`TimelineVideo.tsx` 同时用于面板预览（`@remotion/player`）与导出/取帧（`@remotion/renderer`），保证所见即所得。公式排版接口通过 `mathBase` 传入（引擎服务 `/api/math`；命令行导出的临时静态服务也提供同一接口）。引擎服务常驻一个 Chrome 实例并预热（本机 Chrome/Edge 用新版无头模式——Chromium 132 起移除了旧版；本机浏览器起不来时改用 Remotion 自带的无头浏览器）；整合包随附预构建（压缩、无 source map）的 Remotion bundle，按源码哈希校验，不一致时才在临时目录现打包。取帧单帧按比例缩放输出，多帧逐张渲染后拼成联系表；导出走 `renderMedia`，系统编码器只有原生 AAC 时先无损混音再编码。H.264 默认实际试编码选择 NVENC/QSV/AMF/VideoToolbox，GPU 模式优先使用通过自检的系统 FFmpeg；正式导出失败自动回退 libx264，`DJIAN_GPU_ENCODER=off` 可强制 CPU。

Remotion 自带的 FFmpeg 是精简版（没有 `fps`/`tile` 滤镜、没有 `lavfi` 解码与裸 PCM 封装）：胶片缩略图用输出端 `-r` 抽样成一组小图，波形用 WAV 输出并跳过 RIFF 头，编码器自检用 `image2pipe` 喂一张内嵌 PNG。

## 安全

引擎只监听 `127.0.0.1`；校验 `Host`（防 DNS 重绑定）与 `Origin`（只认回环来源，可经环境变量放行）；所有写请求必须带 `X-Djian-Client` 头（浏览器跨站表单无法伪造）；请求体按字节流读取并限长；在线素材下载做 SSRF 防护（拒绝内网地址、手动跟随重定向、流式限长）；同一数据目录只允许一个引擎进程。

## 打包

- **manifest v5**：`launchers` 用完整形式声明各启动器的支持情况；依赖只允许精确版本或 DSHL 方言 `vendor:<file>.tgz`；宿主包（`@deepseek-ai/*`）由 DSH 版本库模板层提供，不写进依赖，避免双装。
- **vendor**：自制包 `npm pack` 成 tgz，sha256 与依赖快照写进 `vendor/vendor.json`，DSHL 验哈希后直挂进 profile `node_modules`。直挂的包不会再解析依赖，所以构建脚本检查每个 vendor 包的依赖都由 manifest 顶层同版本依赖或另一个 vendor 包满足（叶子依赖检查），并拒绝安装脚本。
- **services**：`djian-engine` 由 DSHL 托管，端口冲突自动顺延，真实端口经 `DSHL_SERVICE_PORTS` 给宿主插件、经地址锚点 `#djian-engine=<端口>` 给面板。
- **cordis 补丁**：`preset-djian` 预设（D剪 人格、工具与技能目录）设为默认，挂上两个面板与 `host-bridge`。
- `npm run pack` 依次：构建 → 规范自检 → 叶子依赖检查 → 锁文件一致性 → 预构建渲染包校验 → 打包 → 回读校验 → 写 `.sha256`。

## 非 DSH 环境

`packages/agent/mcp-server.mjs` 是同一套工具的 MCP stdio 适配器（需要显式传 `projectId`），供其他支持 MCP 的客户端使用；`host-bridge` 在没有 DSHL 托管服务时也能自行拉起引擎。

### 2.3.0：组合 / 遮罩 / 路径

Schema v10 增加可选 `groups: Record<string, GroupState>`，通过 `updateGroup.state` 完整替换；系统 `putGroupState` 支持实体级差异、撤销与协作。渲染器只对有状态的分组建立共同变换容器，并放在其最高成员层位。内部 Sequence 保留成员时间，外层按最早可见成员的起点计算整体时间。

`masks.ts` 生成 SVG alpha matte：先模糊蒙版形状，再将亮度转成 alpha，避免模糊内容。`motionPath.ts` 将 SVG 路径映射到画布像素后按弧长取样；缓存有上限；独立 `pathProgress` 通道控制进度。分割时显式保存缺省进度曲线。形变涉及遮罩/路径时走已有交叉淡化，保留新属性。

### 2.4.0：动画编排

Schema v14 新增弹簧 easing 对象、五个遮罩通道、follow/connector 引用、组 stagger。`spring.ts` 解析求解欠阻尼/临界阻尼/过阻尼，`evalKeyframes` 传入区间秒数；分割仅平移原关键帧。`relationships.ts` 用确定性二维仿射变换解析多级跟随和连接锚点，不依赖上一帧或 DOM。解析/操作层拒绝循环与悬空引用，删除目标时清理引用，客户端复制后延迟建立重映射绑定。

`stagger.ts` 提供独立入场包裹层的参数，渲染时叠加在原成员动画之外，关系计算使用相同包裹层变换。`maskState` 用当前通道覆盖静态遮罩，仅生成 alpha matte，不改变内容清晰度。

视觉增强：`appearance.tsx` 合成外/内阴影；`glass.ts` 使用浏览器背景滤镜；`sharedElements.ts` 匹配相邻场景并冻结画布坐标快照，由 TimelineVideo 调用 MorphView。曲线编辑器通过原有关键帧 ops 完成预览、提交与撤销。

2.6.0：`trackMatte.tsx` 将二维遮罩源按绝对时间采样为 SVG Alpha/亮度蒙版，视频与元素共用；`gradient.ts` 对色标/颜色/角度插值。扫光在外观 SVG 滤镜中与原始 Alpha 合成。项目 `animationLibrary` 通过 save/apply/removeAnimation 操作维护，系统 putAnimation 用于逐项撤销。

2.7.0：`layout.ts` 以共享纯函数将 autoSize / 组 layout 解析为元素几何，服务端、面板和加载时一致；`pathEdit.ts` 提供贝塞尔节点操作；`TemporalBlur.tsx` 通过 Freeze 子帧和隔离加法合成实现原生元素/组合运动模糊。组模糊关闭成员重复采样，SampleAnchor 仅为当前帧保留画布命中元素。
