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

## 时间线 schema v5

在 v4 基础上全部为可选字段（旧数据零改动可读）：稳定的文字/标记 id；以对象表示、居中于剪辑点的转场；动画预设引用（按片段当前时长展开，裁剪/变速后自动对齐）；裁切、翻转、混合模式、填充方式、定格、圆角投影；字幕版式与描边/阴影/底框；音频淡入淡出与按人声闪避；轨道隐藏/锁定/静音；标记。数据的 `version` 高于引擎支持的版本时以只读打开，旧版引擎不会覆盖新数据；损坏的文件隔离备份并从最近的快照恢复。

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

`TimelineVideo.tsx` 同时用于面板预览（`@remotion/player`）与导出/取帧（`@remotion/renderer`），保证所见即所得。引擎服务常驻一个 Chrome 实例并预热；整合包随附预构建（压缩、无 source map）的 Remotion bundle，按源码哈希校验，不一致时才在临时目录现打包。取帧单帧按比例缩放输出，多帧逐张渲染后拼成联系表；导出走 `renderMedia`，系统编码器只有原生 AAC 时先无损混音再编码。

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
