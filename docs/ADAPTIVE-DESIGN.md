# 内容自适应与场景设计（2.13）

制作工具 → 设计与审片新增：

- **层级保护**：优先保留已绑定角色，未绑定时依据标题类型、原始字号与同时出现的内容识别主标题、副标题、正文和注释。反复切换设计方向不会把角色全部改成正文。
- **内容自适应版式**：按中文、英文单词、数字单位及手动换行估算文字高度，再分配段落空间；卡片使用一致的行高，横竖屏分别安排列数；多图获得独立区域并保持原框比例。默认完整显示图片，已指定的裁切方式保留。
- **文本约束**：选中文字设置最小字号、最多行数和是否允许缩字。更换文案、修改文本框后重新适配；文案缩短后恢复期望字号。到达限制仍放不下时，规则检查提示溢出，绝不通过省略号或裁切静默删除原文。
- **场景覆盖**：用开始/结束时间创建不重叠的场景，选择该范围后切换配色、字体和版式。背景只在 `[开始,结束)` 生效，区间外使用项目背景。局部参数未覆盖时继承项目规范；移除覆盖恢复项目样式。场景定义不改变影片时长。

跨越场景边界的文字保留原样，不隐式拆分；需要不同样式时先拆分元素。场景背景位于视频、图片、元素后面，不覆盖不透明的全屏素材。文字尺寸采用保守估算，复杂富文本、装饰字体、关键帧和遮罩仍需结合真实预览核对。

示例工程：`examples/adaptive-design.json`（两个独立场景）与 `examples/adaptive-cards.json`（竖屏卡片）。

## AI 操作

```json
{"op":"setDesignScene","id":"opening","name":"开场","start":0,"end":5,"design":{"background":"#182438","accent":"#55d9ca"}}
{"op":"setDesign","sceneId":"opening","preset":"brand"}
{"op":"applyDesignLayout","sceneId":"opening","layout":"split"}
{"op":"bindDesignRole","id":"subtitle","role":"subheading"}
{"op":"updateOverlay","id":"title","patch":{"textFit":{"minFontSize":24,"maxLines":3,"autoShrink":true,"preferredFontSize":64}}}
{"op":"removeDesignScene","id":"opening"}
```

场景变更和文字自适应都进入正常历史记录，支持撤销与并发字段校验。选择局部场景生成三个方案时，源工程及其他场景保持不变，采用前仍检查版本。

## 视觉回归

- `npm run test:visual`：真实 Chromium 渲染并对比已提交基准。
- `npm run visual:update`：显式更新基准；更新后必须查看 PNG，不能仅因测试失败就接受新图。
- `node tests/integration/adaptive-design-ui.mjs`：真实界面验证场景隔离、文本约束、方案采用和撤销。

基准在 `tests/visual-baselines/`，覆盖横屏文字、竖屏卡片、两个场景背景、中文/数字换行和原生阴影。失败时 `dist/visual-regression/` 输出实际图、粉色差异图及 `report.json`，命令返回非零状态。没有基准时不会自动创建或通过。

比较容忍极小抗锯齿差异，同时限制显著变化像素占比与平均颜色偏差。环境和字体信息写入基准清单；不同 Chromium、字体或操作系统可能产生差异，须看图判断原因。规则和像素比较不能代替审美判断。CI 在 Ubuntu 上执行这组视觉检查，并保存失败的差异产物。
