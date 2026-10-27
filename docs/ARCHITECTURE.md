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

### 幻灯片模板

`addSlide` 把模板（12 种）× 主题（6 套）展开成一组普通元素，共享一个 `group`，元素 id 由分组 id 推出（`<group>e<i>`），面板乐观插入与服务端结果一致。版式按画布横竖自动切换，字号按短边缩放。整页缺省插在最下层（不遮挡已有元素），元素之间按出场先后错开。`updateGroup`（整体移动/改时长/解组/批量改）与 `removeGroup` 操作整页；面板时间线把同组元素合并成一块显示。

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

`TimelineVideo.tsx` 同时用于面板预览（`@remotion/player`）与导出/取帧（`@remotion/renderer`），保证所见即所得。引擎服务常驻一个 Chrome 实例并预热（本机 Chrome/Edge 用新版无头模式——Chromium 132 起移除了旧版；本机浏览器起不来时改用 Remotion 自带的无头浏览器）；整合包随附预构建（压缩、无 source map）的 Remotion bundle，按源码哈希校验，不一致时才在临时目录现打包。取帧单帧按比例缩放输出，多帧逐张渲染后拼成联系表；导出走 `renderMedia`，系统编码器只有原生 AAC 时先无损混音再编码。

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
