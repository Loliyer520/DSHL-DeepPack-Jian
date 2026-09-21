---
name: djian-edit
description: 视频剪辑操作时使用——剪段、拼接、加字幕、配音乐、改分辨率帧率，通过编辑 D剪时间线 JSON 完成，渲染交给 djian-render CLI。
---

# D剪剪辑操作

D剪的一切剪辑 = 编辑一份**时间线 JSON**（schema 见 `@djian/engine` 的 `timelineSchema`）。不要直接调 ffmpeg 剪片——先改 JSON，再用 `djian-render` 出片。

## 工作流

1. 读当前时间线（用户项目目录下的 `timeline.json`，没有就按需求新建）。
2. 按需求改 JSON：调 `clips`（增删段、改 `inPoint`/`clipDuration`）、`overlays`（字幕）、`audio`（配乐）。
3. 用 `node packages/engine/bin/djian-render.mjs <timeline.json> -o <out.mp4> --assets <素材目录>` 渲染。
4. 渲染后用 ffprobe 核对时长/分辨率/fps 与 JSON 预期一致，再交付。

## 时间线字段速查

- `meta`: fps / width / height；**总时长由 clips 求和推导，不要手写 duration**
- `clips[]`: id、type(video|image)、src（相对素材目录）、inPoint(秒)、clipDuration(秒)、transition(none|fade)、volume
- `audio`: src + volume + startAtSeconds，null 表示无配乐
- `overlays[]`: text、startSeconds/endSeconds、position(top|center|bottom)、fontSize、color

## 规则

- 改 JSON 前先跑一遍 schema 校验（parseTimeline），坏了先修不硬渲染。
- 字幕时间不得超出 clips 总时长。
- 低配机器渲染加 `--concurrency 2`。
