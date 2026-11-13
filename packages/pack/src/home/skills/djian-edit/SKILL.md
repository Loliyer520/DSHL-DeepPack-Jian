---
name: djian-edit
description: 视频剪辑操作速查——剪段、拼接、画中画、字幕样式、转场、关键帧、配乐与闪避、调色变速、幻灯片式图文（形状/图标/图表/文本框/模板）、数学动画（LaTeX 公式书写与变形、函数图像与参数联动、镜头推拉）、导出；全部通过 djian_* 工具完成。
---

# D剪 剪辑速查

一切剪辑 = 通过 `djian_apply_ops` 修改时间线。引擎是唯一事实源：你和用户（剪辑面板）编辑同一份数据，彼此的修改实时可见。

## 工作流

1. `djian_context{task:"text"|"layout"|"motion"|"audio"}` 读取当前选中或播放头范围；可指定 ids/time/start/end。返回相关对象、依赖、素材、设计锁和审美简报；不要每步重新读全项目。只有字段被截断或需要工程全貌时读 `djian_timeline`。
2. 参数不明时用 `djian_operation{names:["updateOverlay"]}` 按需查询；完整速查仍可读本技能。
3. 较大修改先 `djian_rehearse{action:"preview",ops:[…],ids:[…],label:"…"}`：在独立快照校验并生成前后画面。返回失败回执时只修复失败原因；局部范围外的修改会阻断采用。
4. 观察预演画面（默认修改后；`show` + `view:"before"` 看修改前），检查可读性、焦点、留白和风格。通过后 `djian_rehearse{action:"apply",id}` 采用。简单明确的局部修改仍可直接 `djian_apply_ops`。
5. 预演根据改动字段只抽查受影响范围；音量修改不渲染画面。几何检查不等于审美评价；必要时再 `djian_design_review` 动态检查。
6. `<editor-activity>` 里的用户新修改优先，不要改回去。项目、素材或审美规范改变后重新预演，不要复用旧方案。

项目审美简报使用 `djian_style` 保存 audience/platform/mood/density/focalPoint/typeHierarchy/motionRules 及既有配色、字号和动效约束。只有用户明确的偏好或任务已有依据才写入；不把一次临时选择视为永久偏好。优先使用当前任务的明确要求。

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

### 阴影、发光、滤镜与混合

所有可见元素都支持以下原生外观属性，使用 `addOverlay` 或 `updateOverlay{patch:{…}}`。不要复制多层半透明形状来模拟阴影；一件元素即可实现，并能在属性面板逐层修改。

- 单层投影：`shadow:{color:"#000000",opacity:0.2,blur:24,x:0,y:8,spread:0}`。数值单位为画布像素；透明度与颜色自身 alpha 相乘。`spread` 正值扩展轮廓，负值收缩。
- 悬浮卡片：`shadow:[{color:"#000000",opacity:0.12,blur:8,y:3},{color:"#000000",opacity:0.2,blur:32,y:16}]`。最多 8 层，第一层在上方，每层独立基于原元素轮廓，不会相互投影。
- 蓝色光晕：`shadow:{color:"#38bdf8",opacity:0.6,blur:24,x:0,y:0,spread:2}`。发光要显式设 `y:0`，可用同色的近光与远光两层。`shadow:false` 关闭（包括默认字幕阴影），`shadow:null` 恢复默认。
- 静态滤镜：`filter:{blur:6,brightness:1.1,contrast:1.05,saturate:0.8,grayscale:0,sepia:0,hueRotate:0}`。亮度/对比度/饱和度默认 1，其他默认 0；同名动画通道覆盖静态值，清除关键帧后恢复静态值。
- 混合：`blendMode:"multiply"` 正片叠底、`"screen"` 滤色、`"overlay"` 叠加、`"soft-light"` 柔光，默认 `"normal"`。`filter:null` / `blendMode:null` 清除。
- 文字/图标渐变：文字字面用 `textFill`，文字描边用 `textStrokeFill`（同时设 `stroke:{color,width}` 开启描边）；图标描边用 `icon.strokeFill`，内部用 `icon.fill`。都支持纯色或 2–8 色标的线性/径向渐变及渐变关键帧；不需要复制文字模拟渐变。字面渐变统一覆盖整段文字，包括强调色。
- 渐变已有原生支持：`shape.fill:{type:"linear",angle:90,stops:[{offset:0,color:"#0f172a"},{offset:0.4,color:"#2563eb"},{offset:1,color:"#38bdf8"}]}`，2–8 个色标。不要用多条矩形拼渐变。

阴影跟随元素的不透明度、移动、缩放和旋转，基于真实透明轮廓；不改变盒子尺寸。文字与形状属于同一元素时整体投影，不额外给内部文字叠一次阴影。滤镜模糊作用于元素自身，不是玻璃背景模糊。

### 轻量 3D 与高级转场

- 原生文字、图形、图片、图标、图表及媒体片段都可设置 `transform3d:{rotateX:12,rotateY:-25,z:0,perspective:1200,backface:"visible"}`，无需生成新素材。`z` 正值接近镜头；`perspective` 越小近大远小越明显。数值单位为画布像素和角度。
- 关键帧用 `rotationX/rotationY/z/perspective`。例如 `setKeyframe{id,channel:"rotationY",t:0,v:75,e:"out"}` → `t:0.8,v:0`，卡片侧翻进入；显式关键帧优先于静态值与动画预设。
- 预设：`flipInX/flipInY/flipOutX/flipOutY` 翻转进出、`depthIn/depthOut` 纵深推进/退场、`tilt3d` 立体摇摆、`spin3d` 平面自转。背面关闭时转过背面的平面会消失；需完整自转展示可保持 `backface:"visible"`。
- 转场目录：`djian_catalog{what:"transitions"}`。在进入片段上设 `transition:{type:"cube",duration:0.8,direction:"left",ease:"inOut",intensity:1}`；新类型还有 `flip`、`iris`、`diagonal`、`zoomBlur`、`whip`。方向对 flip/cube/diagonal/whip 生效，强度控制 flip/cube 透视及 zoomBlur/whip 模糊程度；iris 从中心展开。总时长不变。
- 以上是平面的 2.5D 透视效果，不是真实模型或带厚度的物体，没有光照与物理投影。需要真实产品三维模型时说明这个范围，不要把平面自转称为模型渲染。带 3D 效果的元素使用 `transform` 时会做交叉淡化，二维公式字形/轮廓匹配仅用于二维元素。

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

- AI 文生图 / 改造图片：`djian_image{action:"generate",prompt,size,quality,name}`；改造用 `djian_image{action:"edit",prompt,image:"原图.png",name}`，多图参考用 `images:[…]`，可选 `mask`。结果自动入库且不覆盖原图，之后用返回的素材名 `addClip`/`addOverlay`。用户在面板「素材 → AI 生图设置」里配置中转站地址、密钥与默认模型（也可用 DJIAN_IMAGE_* 环境变量）；未配置时按报错引导用户打开该设置，不要索要密钥或尝试其他密钥参数。
- 本地生成的文件：`djian_import_asset{path:"绝对路径"}`；重名会改名，之后用返回的名字。
- 在线素材：`djian_search_media{query:"英文关键词", type:"image"|"audio"}` → `djian_download_media{url, title, license, creator}`。

## 长任务：固定风格、小范围修改、轻量接力

- 从 `djian-style` 技能选定一套 MG 风格后，用 `djian_style{action:"set",designStyle:"风格名",…}` 保存名称和核心参数；`action:"show"` 查看。风格卡每轮自动注入，不要每轮重写，也不要被历史聊天里的临时风格尝试带偏。
- 一次只改当前镜头/页面或用户点名的对象。已确认的部分不重做；不要笼统“整体再优化”，不要为丰富而加颜色、装饰、动画。
- 用户满意或大改之前：`djian_checkpoint{action:"save",label:"…确认版"}`；`action:"list"` 查看。只有用户明确要求回退时才 `restore`。
- 上下文变长、换镜头或换页面：`djian_handoff{task:"下一件事",scope:"只改…"}`，把返回的轻量摘要粘贴到新会话。不要转发整段聊天。
- 验收只说可检查的问题：溢出、对齐、留白、对比度、视觉层级。连续变差不继续叠加修改，向用户建议恢复最近确认的检查点。

## 审美提醒

节奏 1.5–3 秒一切；开头 3 秒放最强画面；转场与动效克制（各不超过两种）；字幕一句不超过 15 字、停留至少 1.5 秒；配乐结尾淡出，不要硬断。

## 风格与好看

做幻灯片、封面、信息图、AI 生图等「要好看」的画面时，先按 `djian-style` 技能选一套 MG 风格（15 套速查 + 完整规格），把风格的色板/字体气质/动效特征落到具体参数，再用 djian_frame 抽查关键帧迭代；不要凭空自由发挥。审美纪律与评审闭环见 `djian-style` 技能。

### 组合、遮罩与路径运动（2.3.0）

- 整组动画用 `updateGroup{group,state:{pivotX:0.5,pivotY:0.5,effects:[{preset:"flipInY"}]}}`，不要给每个成员复制旋转来冒充共享支点。`state` 整体替换，先读取并保留旧状态。
- `mask:{type:"ellipse",w:0.8,h:0.8,feather:20,invert:false}` 只羽化可见边缘；自定义 `path` 用局部 0–100 坐标。
- `motionPath:{path:"M 0 0 Q 20 -30 40 0",autoRotate:true}` 沿 SVG 单条路径移动，100 单位为画布宽/高，默认全时长匀速；用 `animations.pathProgress` 控制进度。`mask`/`motionPath` 支持元素和组合状态，清除字段写 null（组合 state 内删除字段）。

### 动画编排（2.4.0）

- 遮罩动画用 maskX/maskY/maskW/maskH/maskFeather 关键帧；0 尺寸可完全隐藏。组关键帧用 group 替代 id。
- 父子绑定用 follow:{target,rotation?,scale?}；目标须先存在，双方同组或均未分组，禁止循环。保留排版偏移，默认仅跟随 2D 位移。
- 自动箭头用 line/arrow/doubleArrow + connector:{from,to,fromAnchor?,toAnchor?}，锚点 center/top/bottom/left/right。
- 错峰用 updateGroup 的 state.stagger:{interval:0.15,order:"forward",preset:"springRise",duration:0.6}，与成员动画组合，不改原时间。
- 物理弹簧用 e:{type:"spring",stiffness:170,damping:18,mass:1,velocity:0}；也可用 springIn/springRise/springTurn 入场预设。

### 内阴影、玻璃与共享元素（v12）

使用原生效果：内阴影 `shadow:{color:'#000',blur:12,opacity:.4,inset:true}`；形状 `shape.stroke.color` 可为与 fill 相同的渐变对象。毛玻璃 `glass:{blur:18,saturation:1.3,tint:'#ffffff',opacity:.12,radius:16,borderOpacity:.25}`，形状用透明填充，保留清晰前景文字。
相邻场景的对应元素设置 `shared:{key:'card',duration:.6,ease:'inOut'}`；源结束必须与目标开始相接，目标决定时长。用唯一 key 和显式宽高的平面元素；3D、连接器、组合遮罩/错峰跳过匹配，手动 morph 优先，过渡层位于普通元素之上。
曲线缓动 `e:[.25,.1,.25,1]` 用于关键帧，也可用于 shared.ease；用户可在动画面板拖动关键帧及贝塞尔控制点。glass/shared 设 null 可清除。

### 轨道遮罩、表面动画与动画复用（v13）

- 先添加二维遮罩源，再给同组元素或视频设置 `trackMatte:{source:'maskId',mode:'alpha',invert:false,hideSource:true}`；视频的遮罩源不分组。形状、纯文字、图片、图标均可作为源，默认隐藏但仍按绝对时间和位置动画采样。`mode:'luma'` 表示黑隐藏、白显示。不可嵌套；来源不在时间区间时普通遮罩隐藏全画面，反向显示全画面。解除设 null。
- 渐变填充/描边可带 `keyframes:[{t:0,angle:0,stops:[{offset:0,color:'#f00'},{offset:1,color:'#00f'}],e:'linear'},…]`，颜色/色标/角度插值。通道 `gradientAngle`、`gradientShift`、`gradientHue` 提供相对角度/色标/色相动画。
- `sweep:{color:'#fff',width:.25,softness:.65,angle:20,opacity:.7}` 配合 `animations.sweepProgress:[{t:0,v:0},{t:2,v:1}]` 原生扫光，无需复制元素。可用于文字与图片。
- `saveAnimation{id|group,name}` 保存动画，`applyAnimation{id|group,name,fit:'stretch'|'original',merge:false}` 复用，`removeAnimation{name}` 删除。默认按目标时长缩放；只复制动画，不复制源的扫光/渐变等外观配置。已保存内容在 timeline.animationLibrary 中。

### 布局、路径节点与运动模糊（v14）

- 原生元素 `motionBlur:{samples:8,shutterAngle:180}` 或组 `state.motionBlur` 使用真实时间采样。2–16 个采样，0–720 度快门；0 度关闭，180 度覆盖前半帧，360 度覆盖前一帧。组开启后不重复采样成员。该功能不用于视频和音频，不建议用于毛玻璃。
- `autoSize:{maxWidth:.6,minWidth:.04,padding:16}` 让文字/带字形状按内容重算 w/h，支持自动换行。宽度为画布分数，内边距为像素。使用保守字宽估计，特殊字体可增加留白或手动尺寸。
- `state.layout:{direction:'row'|'column'|'grid',x:.5,y:.5,width?,height?,gap:16,padding:16,align:'center',justify:'start',columns:3,background:'背景id'}` 自动排组内成员。缺省宽高包裹内容，背景引用要在同组。`layoutExclude:true` 可排除成员；连接器、跟随对象默认不参与流式排列。state 更新需保留旧动画等字段。
- 可视化路径编辑器支持形状、运动路径和自定义遮罩。仍写回标准 SVG path；编辑圆弧时转为三次贝塞尔。节点移动连带平移相邻控制柄，可镜像控制柄并细分曲线，支持撤销。
