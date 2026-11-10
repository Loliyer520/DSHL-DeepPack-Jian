# 动画编排（2.4.0 / Schema v11）

## 遮罩关键帧

元素“位置”页的遮罩数值旁点 ◆，即可编辑 `maskX`、`maskY`、`maskW`、`maskH`、`maskFeather`。三个按钮提供扩散显现、水平擦入、聚光扫过。位置/尺寸为相对元素自身的比例，羽化为像素；尺寸 0 完全隐藏。遮罩内部内容仍清晰。组合遮罩的坐标相对整个画布。

```json
{"op":"updateOverlay","id":"photo","patch":{"mask":{"type":"ellipse"},"animations":{"maskW":[{"t":0,"v":0},{"t":1,"v":2,"e":"inOut"}],"maskH":[{"t":0,"v":0},{"t":1,"v":2}]}}}
```

动画时间是元素内相对秒。组合可以通过 `setKeyframe{group:"page",channel:"maskW",t:1,v:2}` 编辑，时间相对最早可见成员的开始时间。清除组关键帧同样用 `group` 替代 `id`。

## 父子跟随与连接箭头

元素“位置 → 父子跟随”中选择目标，默认保持当前排版偏移并跟随目标的 2D 位移。可以开启继承旋转和缩放。父子双方须同组或均未分组；支持多级关系，拒绝循环。目标的路径运动和错峰变换也参与跟随。

```json
{"op":"updateOverlay","id":"label","patch":{"follow":{"target":"ball","rotation":false,"scale":false}}}
```

这是一种 2D 布局约束：不继承目标的透明度、遮罩或 3D 投影。需要整体 3D 时，将相关元素放在同一组合中变换。目标未开始或已结束时取其动画端点，子元素按自己的时间显示；解绑用 `follow:null`。无显式尺寸的文字端点使用字号估计，需要精准边缘锚点时建议给文字设置 w/h。

线条/箭头/双箭头形状另有“连接起点/终点”，支持 center/top/bottom/left/right 锚点：

```json
{"op":"updateOverlay","id":"arrow","patch":{"connector":{"from":"nodeA","to":"nodeB","fromAnchor":"right","toAnchor":"left"}}}
```

创建顺序为目标元素在前、绑定在后。连接线的 x/y/w/rotate 由端点位置驱动，适合使用颜色、描边、透明度与描边进度动画。连接线不能再作为绑定目标。复制整组或复制粘贴会将内部引用指向副本；删除目标会清理引用。跟随引用的是指定元素 ID，分割目标后若要跟随右段，应改绑到新 ID。

## 错峰入场

组合属性中开启“错峰入场”，可调整成员间隔、单项动画时长、入场预设及顺序（正序、反序、中心向两侧）。

```json
{"op":"updateGroup","group":"cards","state":{"stagger":{"interval":0.15,"order":"forward","preset":"springRise","duration":0.8}}}
```

state 整体替换，更新前保留原有组状态。错峰是额外的变换/透明度包裹层，成员原有动画保留，也不更改成员的开始和结束时间。实际入场时刻取成员原开始时间与“组开始 + 排序索引 × 间隔”中较晚的一项；超出成员结束时间的部分不会显示。正序依显示图层从下到上。清除时从 state 中删去 stagger。

## 可调物理弹簧

动画页将播放头放在关键帧上，选择“物理弹簧”，即可调整刚度、阻尼、质量和初速度。也可以直接选 `springIn`、`springRise`、`springTurn` 预设。

```json
{"op":"setKeyframe","id":"card","channel":"scale","t":0,"v":0.4,"e":{"type":"spring","stiffness":170,"damping":14,"mass":1,"velocity":0}}
```

再在 t=1 添加 v=1。缓动定义在前一个关键帧上；刚度越大响应越快，阻尼越小回弹越明显，质量越大响应越慢。采用解析解，不受帧率或跳帧影响；关键帧区间时长就是物理时间，区间结束精确到达目标。分割后保留原始区间，因此不会重新启动弹簧。

参数范围：stiffness 1–1000、damping 0.1–100、mass 0.1–20、velocity -20–20。转场和形变也接受相同缓动；透明度、遮罩尺寸等有限范围属性会在渲染时限制到安全范围。
