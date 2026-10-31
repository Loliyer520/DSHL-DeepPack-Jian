---
name: djian-style
description: 15 套 MG 视觉风格库与审美纪律——做画面（幻灯片/元素/生图）时先选风格，按可检验特征执行，用 djian_frame 抽查迭代
---

# D剪 风格库

做任何「要好看」的画面——幻灯片、封面、信息图、AI 生图——**先选风格，再动手**。风格不是形容词，是可检验的参数集：色板、字体气质、构图网格、动效曲线、标志特征。

## 1. 选风格

读 `styles/STYLES-INDEX.md`（速查表：技术路线 / 视觉特征 / 关键技法），15 套：

- **2D 系**：扁平矢量 / 线条动画 / 拼贴剪贴 / 形变动画 / 综艺花字
- **几何与秩序**：等轴 2.5D / 包豪斯 / 像素风 / 粗描边贴纸人科普
- **质感系**：3D 渲染 / 液态流动 / 弥散渐变玻璃拟态
- **氛围系**：Synthwave 复古 / 赛博 HUD

选定后读 `styles/prompts/<id>.md` 拿完整规格（配色色值、缓动曲线、帧数、层结构）。用户指定了风格就按用户的；没指定时根据内容气质选一套并在回复里说一句为什么。

## 2. 映射到 D剪 的三条实现路线

**A. 原生元素路线（首选，文字图表清晰可编辑）**
用 addSlide / shape / text / icon / chart 组合实现风格：色板用风格文档里的具体色值；版式按网格对齐（包豪斯尤其严格）；文字层级用字重+字号对比，留 ~5% 安全边距；动效用 animationPreset / keyframes 按风格的缓动特征选（弹性系→bounce 类；克制系→linear/ease）。静态图元素（纹理、材质感）可用路线 B 生成后 addImageElement 插入。

**B. AI 生图路线（材质与氛围）**
djian_image 的 prompt 从风格文档蒸馏：视觉特征逗号串 + Creative seed 的配色色值 + 画面主体描述。例：扁平矢量风 → "flat vector illustration, solid bold color blocks, geometric shapes, no gradients, high-saturation brand palette (#2B2BFF #FF5A4E #FFC62B), clean negative space"。一次生成后用 djian_frame 看实际效果，不对就改 prompt 重生成（不是原样重发）。

**C. 时间线动效路线**
风格文档的「关键技法」逐条映射：错峰入场（stagger 2–4 帧）→ 相邻元素 keyframes 错开 0.07–0.13s；squash&stretch ~10% → scale 关键帧 1.0→1.1→1.0；同一时刻只让一个主体动 → 检查各元素动效起止时间不重叠堆满。

## 3. 审美纪律（每次都要走）

1. **关键帧抽查**：画面完成后用 djian_frame 抽 3–6 个关键时间点，每张按海报标准看：构图、层级、留白、字距、溢出、重叠。不像默认模板才算过。
2. **自评分**：6=模板级，8=高端代理商，9=获奖入围。首版通常 5–7 分，不通胀。低于 7 且有时间就修一轮：先修影响最大的 2–3 个问题（时间点+可观察问题+具体改法），至少一项提升「记忆点」而不只是抛光。
3. **诚实汇报**：只声称看过的画面合格；没抽查到的部分直说；做不到的（如某风格的实时材质）直说并给替代方案。

## 4. 评审闭环（用户要精修时）

把 `styles/rubric.md` 的评审维度（风格还原 / 概念记忆点 / 动效工艺 / 版式字体 / 质感 / 技术合规）用于自查或另开会话独立评审；修改时先 saveVersion 存档，实现全部 critical 项后重新抽查，不回退被认定是优点的部分。

## 新增风格

按 `styles/template.md` 的四段式写：Style / Output / Creative seed / 可检验的 Signature features。写不出的特征不要写——每条都要能被 djian_frame 看出来。
