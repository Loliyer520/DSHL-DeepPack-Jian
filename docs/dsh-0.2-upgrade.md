# DSH 0.2.0-rc.2 升级记录

整合包版本：1.3.0。参考目录：`C:\Users\loliyc\.dsh-win\versions\0.2.0-rc.2`。

## 差异与迁移

| 项目 | 原部署 | 新版处理 |
| --- | --- | --- |
| DSH / base / web-app | 0.1.5-rc.3 | 固定 0.2.0-rc.2 |
| SDK | 0.1.5-rc.2 | 固定 0.2.0-rc.2，验证 start / run / close |
| GLM 接入 | dsh-llm-deepseek，OpenAI 协议 | 官方新版适配器转为 Messages；改用 dsh-llm-pi-ai 的 openai-completions |
| 提供方名称 | deepseek-official | 保留，兼容已有会话引用 |
| 预设注册 | agent-presets | agent-preset-registry |
| 侧栏会话参数 | 自定义 inject(sessionId) | 使用新版自动注入的标准 sessionId；注册具备清理函数 |
| 侧栏导航 | 无稳定 guide id | 添加稳定 id，tab 保持挂载 |
| 客户端包入口 | 缺少 lib/index.js | 包含宿主入口，避免安装器 fallback |
| HMR | 旧 cordis-plugin-hmr override | 删除旧 override，使用新版依赖 |
| Zod | 3.23.8 | 3.25.76，满足新版供应商 SDK peer 约束，保持 3.x |

依赖锁由干净目录安装生成，不复用旧 node_modules。实际部署配置保留现有 GLM 地址、环境变量名、模型列表、人格和其它自定义行；项目与会话目录不移动。

## 验证

- TypeScript、客户端 bundle、WebUI 构建通过。
- 28 项单元测试通过。
- MCP 工作流与会话隔离集成测试通过。
- 新 SDK 使用本地模拟上游完成启动、GLM OpenAI 路由、会话请求、响应及关闭；未调用真实收费模型。
- 干净依赖目录与迁移后的实际部署目录分别通过上述 SDK 验证。
- 新 Web 壳在两个目录分别通过启动、访问令牌换 cookie、HTTP 页面加载；未发现模块加载错误。
- 整合包 ZIP CRC、6 个 vendor 包哈希及源码/产物一致性校验通过。
- 部署目录 DSH、SDK、base、web-app 均确认 0.2.0-rc.2；整合包元数据为 1.3.0。

## 部署与回退

部署：`C:\Users\loliyc\.dsh-packs\djian\profiles\djian`

备份：`C:\Users\loliyc\.dsh-packs\djian\profiles\djian-backup-pre-1.3.0-20261002-093411`

备份包含旧 node_modules、配置、锁文件、整合包元数据和旧 djian-edit 技能。回退前关闭 D剪，将当前依赖目录移到其它位置，再恢复备份目录中的 node_modules 及配置文件。不要覆盖 `.djian` 项目素材和会话数据。

正在运行的旧进程没有强制结束；关闭并重新打开 D剪后，新版本正式用于当前工作台。已验证的是独立进程加载新版的兼容性与 HTTP 页面，不等同于完整浏览器交互/视觉验收或 DSHL 导入器端到端验收。

## 1.3.1：启动器 / profile 分离时的设置保存修复

用户实际通过 `.dsh-win/versions/插件演示` 中的 0.2.0-rc.2 CLI 启动，profile 使用另一份依赖安装。与仅从 profile SDK 启动不同，两个 app-boot 模块各有私有 bootstrapIncludes WeakMap。ConfigEditor 从 profile 侧调用配置协调时无法找到由启动器侧登记的根 Include，报 `profile reload requires the root Include entry`。这同时影响预览说明确认与主题持久化。

以相同双安装环境复现，两项设置原先均失败。1.3.1 随包供应 MIT 上游 app-boot 的兼容修复：私有映射没有入口时从共享 Loader 恢复唯一根 Include，无唯一入口仍拒绝。实际部署原模块及 profile patch 已备份。暗色默认值移到 `ui-theme` 插件 Config，避免依赖旧的 manifest.settings 注入流程。

新增 `tests/integration/host-settings.mjs`，使用临时 profile 与独立 CLI 安装验证确认状态写入、浅色/暗色切换、磁盘保存和认证后 HTML 暗色启动配置，全部通过。测试不写用户项目、不调用收费模型。完整浏览器视觉验收仍未完成：本轮浏览器工具初始化报错。运行中的 D剪 需重启加载模块修复。

## 1.3.2：修复导入后被上游依赖覆盖

用户导入 1.3.1 后再次失败。检查发现实际 profile 中 app-boot 已恢复上游原版，私有 WeakMap 修复不存在。因此 1.3.1 的直接覆盖上游包方案不可靠。

1.3.2 改为两个独立 vendor：`@djian/dsh-app-boot-compat` 与 `@djian/config-editor-compat`，保留 MIT 上游代码及 LICENSE。前者提供唯一根 Include 恢复，后者仅改变 app-boot import；关闭原 config-editor 行并显式插入兼容编辑器。配置 patch 的 name 是匹配条件，不能靠改 name 来替换现有插件，因此使用 disabled + insert。

兼容包保留版本号 0.2.0-rc.2，因为 app-boot 自身版本用于运行时兼容检查。上游依赖文件维持原版，避免安装流程覆盖 D剪 命名的兼容插件。

用实际启动器的独立 CLI + 原版上游依赖 + 新的兼容插件运行 host-settings 集成测试：确认状态保存、明暗切换、磁盘持久化、暗色 HTML 引导全部通过。整合包 8 个 vendor 的 CRC、入口和内容校验通过。实际部署同步更新，运行中的旧实例需要退出后重新打开。
