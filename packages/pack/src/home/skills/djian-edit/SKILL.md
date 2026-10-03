---
name: djian-edit
description: 视频剪辑操作速查——剪段、拼接、画中画、字幕样式、转场、关键帧、配乐与闪避、调色变速、导出；全部通过 djian_* 工具完成。
---

# D剪 剪辑速查

一切剪辑 = 通过 `djian_apply_ops` 修改时间线。引擎是唯一事实源：你和用户（剪辑面板）编辑同一份数据，彼此的修改实时可见。

## 工作流

1. `djian_timeline` 看大纲（每个片段/字幕/轨道都带 id）。需要素材清单时加 `assets:true` 或用 `djian_assets`。
2. 把需求拆成一批 ops，一次 `djian_apply_ops` 提交，并写 `label`（会出现在用户的历史记录里）。
3. 看回执：rejected/ignored 写明原因，只补缺失的操作；`conflicts` 表示对象刚被用户改过，以用户为准。
4. `djian_frame` 抽查关键时间点；传数组可一次得到多帧联络图。
5. 每一步开始时，用户的新修改会以 `<editor-activity>` 自动出现——尊重它们，不要改回去。

## 时间线结构

- 主轨（`videoTracks[0]`）片段首尾相接；转场居中于剪辑点，不改变总时长。
- 叠加轨（画中画/贴图）片段带绝对起点 `atSeconds` 和盒子 `box{x,y,w,h}`（0–1 画布分数）；越靠后的轨越在上层。
- 音频轨片段带 `atSeconds/inPoint/duration/volume`；轨道有 `volume/muted/role/duck`。
- 文字层（字幕/标题）带稳定 id 与起止秒；`x/y` 给出时按中心点自由摆放。

## 常用配方

- 剪掉一段：`splitClip` 两次切出区间，再 `removeClip` 中间那段（主轨会自动补位）。
- 插入片段：`addClip{src, index}` 或 `addClip{src, atSeconds}`（插到最近剪辑点）。
- 叠化转场：`updateClip{id, patch:{transition:{type:"dissolve", duration:0.5}}}`（作用于进入该片段的剪辑点）。
- 画中画：`addClip{src, track:"pip", atSeconds, clipDuration, box:{x:0.62,y:0.06,w:0.34,h:0.34}, animationPreset:"slideInRight"}`。
- 醒目字幕：`addOverlay{text, startSeconds, endSeconds, fontFamily:"sans", fontWeight:700, stroke:{color:"#000000", width:4}}`；底框用 `background:{color:"#000000", opacity:0.55}`。
- 标题自由摆放：`addOverlay{text, startSeconds, endSeconds, kind:"title", x:0.5, y:0.3, fontSize:96, animationPreset:"zoomIn"}`。
- 配乐 + 人声闪避：`addAudio{src, atSeconds:0, track:"配乐", fadeOut:2}`，`updateTrack{id:<人声轨>, patch:{role:"voice"}}`，`updateTrack{id:<配乐轨>, patch:{duck:{level:0.25}}}`。
- 关键帧轨迹：`setKeyframe{id, channel:"x", t:0, v:-0.3}` + `setKeyframe{id, channel:"x", t:1, v:0, e:"out"}`（t 为片段内相对秒）。
- 定格 / 翻转 / 裁切：`updateClip{id, patch:{freeze:true}}`、`{flipH:true}`、`{crop:{x:0.1,y:0,w:0.8,h:1}}`。
- 调色变速：`patch:{filter:{brightness:1.1, saturate:1.2}, speed:2}`（速度改变素材消耗，占时不变）。
- 导出：`djian_export{action:"start", quality:"high"}`，再用 `action:"status"` 查进度。

## 素材

- 本地生成的文件：`djian_import_asset{path:"绝对路径"}`；重名会改名，之后用返回的名字。
- 在线素材：`djian_search_media{query:"英文关键词", type:"image"|"audio"}` → `djian_download_media{url, title, license, creator}`。

## 审美提醒

节奏 1.5–3 秒一切；开头 3 秒放最强画面；转场与动效克制（各不超过两种）；字幕一句不超过 15 字、停留至少 1.5 秒；配乐结尾淡出，不要硬断。
