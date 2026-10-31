---
name: djian-edit
description: 视频剪辑操作速查——剪段、拼接、画中画、字幕样式、转场、关键帧、配乐与闪避、调色变速、幻灯片式图文（形状/图标/图表/文本框/模板）、数学动画（LaTeX 公式书写与变形、函数图像与参数联动、镜头推拉）、导出；全部通过 djian_* 工具完成。
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
- 元素层（`overlays`）：字幕/标题/文本框/形状/图片/图标/图表/公式/坐标系/镜头，带稳定 id 与起止秒；`x/y` 是中心点、`w/h` 是盒子大小（画布比例）。字幕永远在最上层，其余按“层”叠放。

## 常用配方

- 剪掉一段：`splitClip` 两次切出区间，再 `removeClip` 中间那段（主轨会自动补位）。
- 插入片段：`addClip{src, index}` 或 `addClip{src, atSeconds}`（插到最近剪辑点）。
- 叠化转场：`updateClip{id, patch:{transition:{type:"dissolve", duration:0.5}}}`（作用于进入该片段的剪辑点）。
- 画中画：`addClip{src, track:"pip", atSeconds, clipDuration, box:{x:0.62,y:0.06,w:0.34,h:0.34}, animationPreset:"slideInRight"}`。
- 醒目字幕：`addOverlay{text, startSeconds, endSeconds, fontFamily:"sans", fontWeight:700, stroke:{color:"#000000", width:4}}`；底框用 `background:{color:"#000000", opacity:0.55}`。
- 字幕文件：已有 SRT/VTT 用 `djian_subtitles{action:"import", path}` 一次导入（与已有字幕重叠会自动放到新字幕层，整批可撤销）；交付字幕用 `djian_subtitles{action:"export"}` 拿 SRT 文本。
- 标题自由摆放：`addOverlay{text, startSeconds, endSeconds, kind:"title", x:0.5, y:0.3, fontSize:96, animationPreset:"zoomIn"}`。
- 配乐 + 人声闪避：`addAudio{src, atSeconds:0, track:"配乐", fadeOut:2}`，`updateTrack{id:<人声轨>, patch:{role:"voice"}}`，`updateTrack{id:<配乐轨>, patch:{duck:{level:0.25}}}`。
- 关键帧轨迹：`setKeyframe{id, channel:"x", t:0, v:-0.3}` + `setKeyframe{id, channel:"x", t:1, v:0, e:"out"}`（t 为片段内相对秒）。
- 定格 / 翻转 / 裁切：`updateClip{id, patch:{freeze:true}}`、`{flipH:true}`、`{crop:{x:0.1,y:0,w:0.8,h:1}}`。
- 调色变速：`patch:{filter:{brightness:1.1, saturate:1.2}, speed:2}`（速度改变素材消耗，占时不变）。
- 导出：`djian_export{action:"start", quality:"high"}`，再用 `action:"status"` 查进度。

## 幻灯片 / 图文画面（PPT 式视频）

用原生元素做画面，**不要**把文字、图形、图表生成成图片再导入——原生元素用户能直接改字、改色、拖动，动画也更细腻。

1. 先 `djian_catalog{what:"templates"}` / `{what:"themes"}` / `{what:"icons", keyword:"数据"}` 看可用资源。
2. 整页：`addSlide{template, theme, startSeconds, duration:5, kicker, title, subtitle, items:[…]}`，一页一个分组（group），元素都能再单独 `updateOverlay`。
   - 封面 `cover`、章节 `section`、卡片 `cards`（2–4 项）、要点 `bullets`、数据 `stats`（数字滚动）、引用 `quote`、对比 `compare`、时间线 `timeline`、流程 `steps`、图表 `chart`、图文 `imageText`、结尾 `ending`。
   - 一个视频统一一个 theme（light dark tech warm fresh bold），accent 可覆盖强调色。
3. 自由搭建：一批 `addOverlay` 组合元素，同一页写同一个 `group`：
   - 背景：`{kind:"shape", shape:{type:"rect", fill:{type:"linear", angle:135, stops:[{offset:0,color:"#0f172a"},{offset:1,color:"#1e293b"}]}}, x:0.5, y:0.5, w:1, h:1}`
   - 卡片：`{kind:"shape", shape:{type:"rect", fill:"#ffffff", stroke:{color:"#e2e8f0", width:2}, radius:18}, x, y, w:0.24, h:0.5, shadow:{color:"rgba(0,0,0,0.1)", blur:24, y:8}}`
   - 文本框：`{kind:"text", text:"**强大**\n一个号主 AI", w:0.2, h:0.2, align:"left", valign:"top", fontSize:40, color:"#0f172a", accent:"#0284c7"}`
   - 图标：`{kind:"icon", icon:{name:"rocket"}, color:"#0284c7", x, y, w:0.04}`；图表：`{kind:"chart", chart:{type:"column", data:[{label:"1月", value:120}…]}, w:0.6, h:0.45, fontSize:28}`
   - 大数字：`{kind:"text", text:"98%", counter:{from:0, to:98, suffix:"%"}, effects:[{preset:"countUp"},{preset:"riseUp"}]}`
4. 动画：入场错开 0.1–0.2 秒（用 startSeconds 错开）；标题 `textEffect:{type:"fadeUp", by:"char"}`，列表 `textEffect:{type:"fadeUp", by:"line"}`，卡片 `riseUp`，线条/形状 `drawIn`，色条 `wipeInLeft`，图表 `growIn`，数字 `countUp`。一页内动画种类不超过三种。
5. 叠放：`arrangeOverlay{id, to:"front"}`；整页挪时间：`updateGroup{group, startSeconds}`；整页删除：`removeGroup{group}`。
6. 做完用 `djian_frame` 在每页动画结束后的时间点抽查（如每页起点 +3s），检查文字溢出、重叠、对比度。

排版要点：四周留 8–10% 安全边距；标题 56–96px、正文 26–40px（1080p）；一页一个重点；配色不超过 3 种（底色 + 文字色 + 一个强调色）；对齐到同一网格线；浅底深字或深底浅字，避免文字压在复杂背景上。

## 数学动画（3Blue1Brown 风格讲解视频）

公式、坐标系、曲线都用原生元素，**不要**用 Python/Manim 渲染成视频或图片再导入。深色底（theme:"math"）+ 蓝 #58C4DD / 黄 #F7D96F / 绿 #83C167 / 红 #FC6255 点缀。

1. 公式：`addOverlay{tex:"\\frac{a}{b}", x, y, fontSize:96, color:"#ffffff", effects:[{preset:"write"}]}`（kind 自动为 math，text 就是 LaTeX）。局部上色写 `{\\color{#58C4DD} x}`；支持 ams、\cancel、\boxed、矩阵、\text{中文}。回执里有 LaTeX 错误时按提示改。
2. 推导变形：`transform{id:<公式>, atSeconds, duration:1.2, patch:{text:"新的 LaTeX"}}`——原元素在 atSeconds 结束，新元素接上，相同字符平滑移动到新位置、其余淡入淡出；回执 id 是新元素，可继续 transform 形成一串推导。形状→形状（圆变星）、坐标系→坐标系（函数变形、坐标缩放）同样可以 transform。
3. 坐标系：`addOverlay{plot:{x:[-4,4], y:[-1,5], grid:true, items:[…], params:{…}}, x, y, w:0.8, h:0.7, fontSize:26, effects:[{preset:"create"}]}`。
   - items：`{type:"fn", id:"f", fn:"x^2/2", label:"$y=\\frac{x^2}{2}$"}`、`{type:"param", fx:"cos(t)", fy:"sin(t)", t:[0,"2*pi"]}`、`{type:"polar", fn:"cos(2t)"}`、`{type:"point", of:"f", x:"a", label:"({x}, {y})", guides:true}`、`{type:"tangent", of:"f", x:"a", length:3}`、`{type:"area", of:"f", from:0, to:"a"}`、`{type:"riemann", of:"f", from:0, to:2, n:8}`、`{type:"vector", x:2, y:1, label:"$\\vec{v}$"}`、`{type:"segment", x0, y0, x, y, dash:true}`、`{type:"label", x, y, label}`。
   - 表达式：数字或字符串，可用 x（函数）/ t（参数、极坐标）、params 里的参数、带 id 的函数（f(a)）、pi、e、sin、sqrt、ln、abs…；隐式乘法 2x 可以。标注 `$…$` 是公式，`{表达式}` 显示实时数值（如 "a = {a}"）。
   - 联动：`params:{a:[{t:1,v:-2,e:"inOut"},{t:4,v:2}]}`（t 为元素内相对秒）→ 用到 a 的点、切线、面积、曲线一起连续变化。
   - 节奏：没设 start 的对象随 `create` 预设按顺序画出；给对象 `start`（相对秒）/`draw`（画出秒数）/`end` 可精确安排每个对象出现与消失。
4. 镜头：`addOverlay{kind:"camera", group:<页的 group>, animations:{scale:[{t:2,v:1,e:"inOut"},{t:3.5,v:0.5}], x:[…], y:[…]}}`——镜头不画东西，只决定看哪里：x/y 是镜头框中心（画布比例，关键帧为偏移量），w 是镜头框宽度（1 = 全画面），scale 关键帧缩放镜头框（0.5 = 放大 2 倍）。不写时间时自动覆盖整页；只作用于同组元素（不分组的镜头作用于全部元素，字幕除外）。
5. 自由曲线 / 弧形箭头：`{kind:"shape", shape:{type:"path", path:"M0,100 C20,10 80,10 100,100", arrow:"end", stroke:{color:"#F7D96F", width:6}}, w, h, effects:[{preset:"drawIn"}]}`，坐标是盒子的 0–100；也可用 `vertices:[[x,y]…], smooth:true, closed:true`。
6. 整页模板：`addSlide{template:"formula", theme:"math", title, formula:"LaTeX", subtitle}`、`addSlide{template:"graph", theme:"math", title, fn:"sin(x); cos(x)"}`，之后再改其中的公式/坐标系元素。
7. 节奏建议：一个公式书写 1.5–2 秒，停留 1 秒再变形；每次只变一处；参数动画 2–4 秒、inOut 缓动；镜头推近前先让观众看清全貌。做完用 `djian_frame` 抽查变形中途和镜头推近后的画面。

## 素材

- AI 文生图 / 改造图片：`djian_image{action:"generate",prompt,size,quality,name}`；改造用 `djian_image{action:"edit",prompt,image:"原图.png",name}`，多图参考用 `images:[…]`，可选 `mask`。结果自动入库且不覆盖原图，之后用返回的素材名 `addClip`/`addOverlay`。工具需要宿主配置 `DJIAN_IMAGE_API_KEY`，中转地址和默认模型分别是 `DJIAN_IMAGE_BASE_URL`、`DJIAN_IMAGE_MODEL`；未配置时按报错提示用户配置，不要索要密钥或尝试其他密钥参数。
- 本地生成的文件：`djian_import_asset{path:"绝对路径"}`；重名会改名，之后用返回的名字。
- 在线素材：`djian_search_media{query:"英文关键词", type:"image"|"audio"}` → `djian_download_media{url, title, license, creator}`。

## 审美提醒

节奏 1.5–3 秒一切；开头 3 秒放最强画面；转场与动效克制（各不超过两种）；字幕一句不超过 15 字、停留至少 1.5 秒；配乐结尾淡出，不要硬断。
