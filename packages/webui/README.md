# @djian/webui

D剪 引擎服务（`server/index.mjs`）：项目与会话绑定、素材（上传/导入/探测/缩略图/波形）、协同操作日志（`rev` + SSE + 反向补丁）、在场状态、历史版本、取帧、导出、字幕文件。由 DSHL 作为 `djian-engine` 服务托管，也可单独运行：

```sh
npm run start:engine   # 根目录；默认 http://127.0.0.1:5180，数据在 ~/.djian
```

接口约定、协同协议与安全模型见 [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)。改动后在根目录运行 `npm test`（会启动真实引擎进程做接口与协同测试）。
