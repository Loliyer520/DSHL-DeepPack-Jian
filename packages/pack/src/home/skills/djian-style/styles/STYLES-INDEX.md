# 15 套 MG 风格速查表

> 由 `prompts/*.md` 自动提取，便于横向对比「哪种风格用什么技术、标志特征是什么」。
> 完整提示词见 `prompts/<id>.md`。

## 技术路线与标志特征

| ID | 风格 | 技术路线 | 视觉特征（一眼辨认的依据） | 上游自评 |
| --- | --- | --- | --- | --- |
| `01-flat-vector` | 扁平矢量动画 Flat / Vector 2D Motion Graphics | HTML: SVG + GSAP (CustomEase/CustomBounce/MorphSVG); motion blur mb=4 for fast moves | 纯色大色块, 几何化角色, 无渐变或极少渐变, 干净留白, 高饱和品牌色板, 元素弹性入退场 | 7.64 |
| `02-line-art` | 线条动画 Line Art / Line Animation | HTML: SVG paths + stroke-dashoffset (getTotalLength) + GSAP; a virtual camera that follows the pen tip | 等宽细线, 单色或双色, 大量负空间, 线条连续生长, 线面转换瞬间 | 7.64 |
| `03-isometric` | 等轴 2.5D Isometric / 2.5D | HTML: Three.js OrthographicCamera at true isometric angle + soft shadows + AO (three/addons postprocessing), or SVG with SSR matrix faces | 30°等角投影, 无透视灭点, 微缩场景, 楼房生长动画, 平行滑轨式运镜 | 8.00 |
| `04-3d-render` | 3D 渲染系（C4D/Blender 质感） 3D Render / CGI Motion Design | Blender 5.1.2 CLI (bpy script → Cycles on Metal GPU with OIDN denoise, or EEVEE if it holds quality) → PNG sequence → ffmpeg; optional HTML overlay pass for typography | PBR真实材质, 浅景深, 柔和棚拍布光, 克隆器阵列, 软体碰撞, 糖果色软胶质感 | 7.71 |
| `05-cel-boil` | 逐帧手绘 / 线条沸腾 Cel Animation / Frame-by-Frame & Line Boil | HTML Canvas2D: custom variable-width brush renderer (centreline + pressure → outline polygon), boil = 3–4 jitter variants cycled every 2 frames; paper texture multiply | 线条持续微抖(boil), 一拍二/一拍三节奏, smear拖影帧, 手绘烟火水花点缀, 纸纹底 | 8.07 |
| `06-collage` | 拼贴剪贴 Collage / Cutout Animation | HTML: DOM/Canvas with PNG cutouts from /assets/images (rembg), SVG/CSS white-edge + halftone filters; stepped 12 fps (render 30 fps, hold motion on 12 fps grid) | 照片剪影白描边, 半调网点, 报纸纹理, 比例失衡的超现实拼装, 定格式抽帧运动 | 8.14 |
| `07-liquid` | 液态流动 Liquid Motion | HTML WebGL2 fragment shader: 2D SDF metaballs (smooth-min) + fake 3D lighting from field gradient normals, text SDF for the logo | 波浪边缘转场, 拉丝与滴落, metaball融合, 次级液滴跟随, 有机曲线永不直线 | 7.57 |
| `08-morph` | 形变动画 Morphing / Shape Morph | HTML: SVG + flubber or GSAP MorphSVGPlugin (tune shapeIndex), color-field wipes | 轮廓连续过渡无跳变, 中介形状桥接, 形变伴随位移旋转, 变形瞬间的挤压拉伸 | 7.64 |
| `09-bauhaus` | 几何构成 / 包豪斯 Geometric / Bauhaus Motion | HTML: SVG/Canvas + GSAP on a strict modular grid, beat grid at 120 BPM | 基础几何形, 红黄蓝黑限定色, 严格网格对齐, 旋转以几何中心为轴, 节拍驱动的模块化运动 | 7.71 |
| `10-synthwave` | 复古系（80s Synthwave / Y2K 千禧） Retro: 80s Synthwave / VHS / Y2K | HTML WebGL (perspective grid, sun, mountains shader) + canvas chrome text + CSS/SVG glow; VHS pass | 霓虹辉光, 透视网格地平线, 扫描线与RGB色偏, 镀铬金属字, 酸性配色, 拟物窗口UI | 8.21 |
| `12-aurora-glass` | 弥散渐变 / 玻璃拟态 Gradient Blur (Aurora) & Glassmorphism | HTML WebGL: aurora mesh-gradient shader + glass refraction (SDF lens, chromatic dispersion) + DOM/CSS backdrop-filter glass cards | 大色斑高斯模糊漂移, 磨砂玻璃卡片, 1px高光描边, 邻近色低对比配色, 缓慢呼吸感节奏 | 8.07 |
| `18-hanazi` | 综艺花字 Variety Show Kinetic Captions (Hanazi) | HTML DOM/SVG: multi-layer text-stroke 花字 components + spring pops + SVG burst/sweat/sparkle decorations over a pet-vlog footage layer (CC0 photos with Ken Burns + handheld shake + punch-ins) | 多层描边圆体/胖体字, 高饱和撞色+白边+投影, 弹性 pop 入场, 配合音效出现, 手绘装饰符号（爆炸框/汗滴/闪光） | 7.64 |
| `19-paperclip` | 粗描边贴纸人科普 MG（回形针/林超风格） Bold-outline Sticker Explainer MG (PaperClip / Lin Chao style) | HTML: one huge canvas (e.g. 6000×3000 px) with a camera transform (long eases), SVG charts, photo stickers with 10px white outline | 照片贴纸化（粗白描边）, 蓝灰/米白冷静底色, 扁平图标+精确数据图表, 大画布镜头平移缩放, 信息密度极高的节拍化叙事 | 7.71 |
| `20-pixel` | 像素风 Pixel Art / 8-bit | HTML Canvas at 320×180 internal resolution, integer-scaled ×6 with nearest-neighbour; sprites authored as pixel arrays in code; limited palette | 大颗粒像素与硬边缘, 有限色板(8~32色), 8~12fps 精灵帧动画, 抖动渐变 dithering, CRT 扫描线滤镜 | 8.07 |
| `22-hud` | 赛博朋克 HUD / FUI Cyberpunk HUD / FUI (Fictional UI) | HTML: SVG/Canvas FUI layers + Three.js wireframe hologram; seeded random data; glow/scanline post pass | 青色/橙色霓虹线框, 目标锁定框与十字准星, 雷达/环形扫描 loop, 等宽小字数据流与打字机文字, 六边形网格与辉光 | 7.93 |

## 可检验的关键技法（原文摘录）

### 01-flat-vector · 扁平矢量动画 Flat / Vector 2D Motion Graphics

- AE Shape Layer + 父子级 null 控制层级，人物四肢用锚点旋转做 rig
- 弹性缓动是灵魂：overshoot 用 cubic-bezier(0.34,1.56,0.64,1) 或 AE 里 70~85% influence 的贝塞尔手柄；入场'预备-冲出-回弹'三段式
- 元素错峰入场（stagger 2~4 帧），同一时刻只让一个主体动
- 30fps 居多；位移动画带 10% 左右 squash&stretch 增加弹性
- 转场常用色块擦除（shape wipe）或元素飞出带动整场切换

### 02-line-art · 线条动画 Line Art / Line Animation

- 核心是 stroke 描绘：AE 用 Trim Paths 0→100%，Web 端用 SVG stroke-dasharray/dashoffset
- 线宽全片恒定（2~4px），转角处让描绘速度略减速，用 easeInOut cubic-bezier(0.65,0,0.35,1)
- '一笔画'叙事：上一图形的尾线即下一图形的起线，路径提前在 Illustrator 里连好
- 线转面：描完轮廓后用同路径的 fill 从锚点扩展填充
- 配合微小的端点圆头（round cap）与路径抖动可增加手绘感

### 03-isometric · 等轴 2.5D Isometric / 2.5D

- SSR 公式造等轴面：Scale 纵向 86.6% → Shear/skew ±30° → Rotate ∓30°，三个面分别做后拼合
- 假 3D 靠图层排序：Z 序=画面 y 坐标，物体沿等轴网格移动时保持 2:1 像素斜率
- 楼房'生长'：底面先落位，立面用 scaleY 从 0 拉起 + 顶面延迟 2~3 帧盖上
- 运镜是整组平移（无旋转），配合前中后景 1:0.8:0.6 的视差速度
- AE 里可用真 3D 图层+正交相机（无透视）偷懒，Motion Design School 的 Isometric Camera 技巧即此路

### 04-3d-render · 3D 渲染系（C4D/Blender 质感） 3D Render / CGI Motion Design

- MoGraph 核心：Cloner 克隆器 + Random/Plain Effector 做群体波浪式动画
- 质感三件套：SSS 次表面散射（软胶感）+ AO + HDRI 三点布光
- 运动多用长尾 ease：位移曲线前 20% 完成 80% 路程，收尾极慢，配 motion blur
- 24/25fps 电影帧率 + 浅景深（f/1.8 感）区别于 2D 系的 30fps 利落感
- 常见结构：产品为轴心，粒子/流体/布料围绕它做物理模拟编排

### 05-cel-boil · 逐帧手绘 / 线条沸腾 Cel Animation / Frame-by-Frame & Line Boil

- 打帧节奏：24fps 下'一拍二'（实际12fps）为主，快动作切'一拍一'，静止镜头'一拍三'
- line boil 伪造法：AE 用 Turbulent Displace（数量2~5、大小50）+ 每 2 帧随机化 evolution + Posterize Time 12fps；真 boil 则画 3~4 张微差线稿循环
- smear frame：快速位移的中间帧把物体拉长 150%~300% 只保留 1 帧
- cel FX 点缀层：烟/水花/闪电用纯手绘逐帧叠在矢量主体上（Buck 式 hybrid）
- 整体叠纸纹（multiply 10~15%）统一手作气质

### 06-collage · 拼贴剪贴 Collage / Cutout Animation

- 素材处理：人物/物件抠图后加 2~4px 白描边（剪刀剪出来的感觉）+ 半调 halftone 滤镜
- 关节动画：锚点设在肩/肘/颌，做 puppet 式分段旋转，嘴巴用两三张替换帧开合
- 刻意降帧：主体运动 12fps 甚至 6fps（stop-motion 感），位置加 ±2px 随机抖动模拟手摆
- 图层结构：背景纸纹 → 大形色块 → 照片剪影 → 手写涂鸦/胶带贴纸 → 颗粒调整层
- 转场用'手把元素拍上来'或整页翻纸

### 07-liquid · 液态流动 Liquid Motion

- 液态转场：遮罩路径手 K 波浪形前沿扫过画面，前沿加 3~5 个错相位的凸起
- metaball 融合的通用伪造法：高斯模糊(20px+) → 提高对比度阈值（AE 用 Levels 收紧、Web 用 feColorMatrix alpha 阈值），两球靠近即自动'粘连'
- 拉丝-断裂-回弹：主形离开时留一条细颈，断裂瞬间两端各回弹 2~3 帧
- 缓动前快后慢 cubic-bezier(0.22,1,0.36,1)，液体只会被'甩'出去不会匀速
- 次级液滴延迟主体 2~3 帧跟随（follow-through），落地做扁平化 squash

### 08-morph · 形变动画 Morphing / Shape Morph

- 路径对齐是前提：两形状顶点数一致、首顶点方位对应（AE 里重设 first vertex），否则会打结
- 复杂 A→B 不直接变：先收敛为中介简形（圆/胶囊）再展开，'A→圆→B'两段各 8~12 帧
- 形变全程叠加 10~15% squash & stretch 与轻微旋转，掩盖插值的机械感
- 速度曲线中段最快 cubic-bezier(0.7,0,0.3,1)：起止各留 3 帧缓冲
- Web 端用 flubber/polymorph 库做最优顶点匹配插值，效果远好于朴素 SMIL

### 09-bauhaus · 几何构成 / 包豪斯 Geometric / Bauhaus Motion

- 一切运动锚定网格：位移距离=网格模数整数倍，落点必在网格线上
- 缓动克制：easeInOutQuad 或干脆匀速，禁用 overshoot——机械感是特征不是缺陷
- 节拍驱动：每个几何元素在节拍点瞬时出现/翻转，一拍一个动作，类似我们已做的卡点逻辑
- 旋转轴心玩法：绕自身中心、绕边缘顶点、绕画面中心三种交替制造韵律
- 生成式变体：Processing/p5.js 用三角函数相位差批量驱动几何阵列（国内动态海报圈主流做法）

### 10-synthwave · 复古系（80s Synthwave / Y2K 千禧） Retro: 80s Synthwave / VHS / Y2K

- synthwave 三件套：透视网格滚动（一点透视 grid + 纵向位移循环）、日落多层渐变球、双层辉光（内层紧 4px 高亮+外层散 30px 低透明）
- VHS 做旧链：RGB split（红蓝通道各偏 1~2px）→ 扫描线（2px 间隔 10% 黑条）→ 波浪扭曲抖动（每秒 1~2 次随机 glitch 抽帧）→ 4:3 圆角遮罩
- Y2K 镀铬字：极高对比的多段金属渐变 + bevel 高光 + 环境映射感反光，配 lens flare
- Y2K 运动语言：弹窗式 pop 出现、光标点击、窗口拖拽，界面拟物即动画叙事
- 帧率故意不稳：关键段落抽帧到 15fps 或倒放 2 帧制造磁带卡顿

### 12-aurora-glass · 弥散渐变 / 玻璃拟态 Gradient Blur (Aurora) & Glassmorphism

- 底层 aurora：3~5 个纯色大圆 blur 80~150px，各自沿贝塞尔路径 20~40 秒漂移循环，彼此 blend 出 mesh gradient 感
- 玻璃卡片配方：backdrop-filter blur(20~40px) + 白色 5~10% 填充 + 1px 白色 30% 内描边 + 大半径圆角
- 配色用邻近色 2~3 色（紫蓝青/橙粉红），撞色会脏；暗底亮斑比亮底更出效果
- 全局叠 3~5% 噪点防 banding（与颗粒质感技法交叉）
- 缓动接近 linear 或 sine 呼吸曲线，一切都慢——快动作会立刻破坏气质；文字入场也只用 opacity+8px 位移

### 18-hanazi · 综艺花字 Variety Show Kinetic Captions (Hanazi)

- 字体三层结构：填充色+粗白描边+彩色外描边/投影（CSS 可用多层 text-shadow 或 SVG stroke 模拟）
- 入场 overshoot：scale 0→1.15→1.0（约 8 帧），或逐字弹跳错帧 2 帧
- 情绪匹配：吐槽用歪斜手写体、惊讶用放射线爆炸框、尴尬用汗滴符号
- 出现时机对齐笑点/音效，比语音晚 2~3 帧更自然
- 长时间驻留花字加轻微 wiggle 保持活性

### 19-paperclip · 粗描边贴纸人科普 MG（回形针/林超风格） Bold-outline Sticker Explainer MG (PaperClip / Lin Chao style)

- 素材照片抠图 + 8~12px 白描边统一质感，消除图片来源差异
- 超宽大画布布局，摄像机层做平移/缩放（ease 长曲线），一镜串多个信息点
- 图表动效：柱状图生长、数字滚动计数、路径描边生长
- 解说词逐句驱动画面元素入场，语速快、每句必有新视觉元素
- 克制配色（2~3 色）+ 等线字体，保持『严肃感』

### 20-pixel · 像素风 Pixel Art / 8-bit

- Aseprite 绘制精灵表（sprite sheet）+ 序列帧循环（走路 6~8 帧、呼吸 2~4 帧）
- 缩放必须最近邻插值（CSS image-rendering: pixelated），杜绝抗锯齿糊边
- 动画用 steps() 阶梯时序而非平滑缓动，保持逐帧感
- 视差卷轴背景：远中近三层不同速度整像素平移
- 可选 CRT 后处理：扫描线+桶形畸变+磷光辉光

### 22-hud · 赛博朋克 HUD / FUI Cyberpunk HUD / FUI (Fictional UI)

- 线框生长：SVG stroke-dasharray/dashoffset 描边动画，元素按层级错帧展开
- 环形雷达：conic-gradient 扫描扇区旋转 loop + 目标点闪烁
- 数字滚动：随机数快速跳变 3~5 帧后落定真实值；文字打字机 + 光标闪烁
- 锁定框：四角括号从大到小收缩吸附目标（scale 1.4→1.0 + 快出缓入）
- 全局外发光（glow）+ 轻微色差 + 扫描线叠加统一质感

