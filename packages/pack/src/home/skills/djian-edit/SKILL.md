---
name: djian-edit
description: 视频剪辑操作时使用——剪段、拼接、画中画、加字幕、配乐、调色变速，全部通过 apply_timeline_ops 编辑 D剪时间线完成。
---

# D剪剪辑操作

一切剪辑 = 通过 `apply_timeline_ops` 编辑时间线 JSON（多轨 schema）。webui 后端是唯一事实源：AI 工具与用户面板操作同一份数据，不要直接读写时间线文件或调 ffmpeg。

## 工作流

1. 看用户消息里附带的时间线，或 `get_timeline` 拉最新；素材清单用 `asset_list`。
2. 把需求拆成一批 ops 一次 `apply_timeline_ops` 提交（ops 按顺序执行；格式错误整批被拒，按返回原因修正重试）。
3. 关键修改后 `get_frame <秒>` 抽帧确认画面再交付。

## 时间线结构

- `meta`: fps / width / height。总时长 = 主轨（videoTracks[0]）各 clipDuration 之和与其余轨末尾的最大值，不手写。
- `videoTracks[0]` 主轨串行；`videoTracks[1+]` 叠加轨：画中画，clip 带 `atSeconds` 绝对秒 + `box` 分数矩形 {x,y,w,h}。
- `audioTracks[]` 音频轨：clip 带 atSeconds/inPoint/duration/volume，轨带 volume/muted。
- `overlays[]` 字幕：text/startSeconds/endSeconds/position(top|center|bottom)/fontSize/color/fontFamily/fontWeight。

## op 速查（apply_timeline_ops）

- 片段：`addClip`(src/inPoint/clipDuration [,track/atSeconds/box/transition/volume/speed/filter/animations])、`removeClip`(id)、`updateClip`(id+patch)、`reorderClips`(order=id数组)、`splitClip`(id+atSeconds 全局秒)
- 音频：`addAudio`(src/duration [,inPoint/atSeconds/volume/track/speed/animations.volume])、`removeAudio`(id)、`updateAudioTrack`(id+patch{volume,muted,name})
- 字幕：`addOverlay`(text/startSeconds/endSeconds [,position/fontSize/color/fontFamily/fontWeight/animationPreset/animations])、`removeOverlay`(index)、`updateOverlay`(index+patch)
- 画布：`setMeta`(patch{fps,width,height})

## 参数要点

- `speed` 恒定变速：占时（clipDuration）不变，素材消耗 = 占时 × speed（2 = 快放一倍）。
- `filter` 调色：{brightness, contrast, saturate, blur(px), grayscale, sepia, hueRotate(deg)}，可叠加，克制使用。
- `animations` 关键帧：{x,y,scale,opacity,rotation,volume} → [{t,v,e?}]，t = 片段/字幕内相对秒，e 缓动 linear|in|out|inOut|bounce|elastic。仅用户要精确轨迹时手排；常规动作用 `animationPreset` 一键预设（fadeIn/slideIn*/zoomIn/bounceIn/spinIn/kenBurns/kenBurnsOut 等，按字幕时长自动展开，'none' 清除）。
- 字幕字体 `fontFamily`：sans 思源黑体 / serif 思源宋体（可变字重，fontWeight 300–900）/ kuaile 快乐体 / qingke 黄油体 / mashan 毛笔楷（后三者仅 400）。整片字幕字体统一。
- 字幕时间不得超出总时长；一句 ≤15 字、停留 ≥1.5 秒；720p 字号 40–50。

## 其他工具

- `get_frame`(seconds)：看合成后那一帧，验证字幕位置/黑场/衔接/动画。
- `get_timeline` / `asset_list`：最新时间线 / 素材库。
- `search_media` + `download_media`（media-library）：Openverse CC 图片/音频搜索与入库，英文关键词更准；下载后按返回的文件名 addClip/addAudio 引用。
