# 组合、羽化遮罩与路径运动

D剪 2.3.0，时间线格式 v10。旧项目自动读取；预览和导出使用同一套渲染实现。

## 组合整体动画

在时间线上选中整组，在属性面板的“组合整体动画”中选择淡入、弹入、整体翻入、立体摇摆或三维自转，也可以调整旋转、缩放、不透明度及共同支点。默认支点是画布中心，坐标为画布宽高的比例。

```json
{"op":"updateGroup","group":"card","state":{"pivotX":0.5,"pivotY":0.5,"effects":[{"preset":"flipInY"}],"animations":{"rotation":[{"t":0,"v":-12},{"t":2,"v":12,"e":"inOut"}]}}}
```

状态保存在 `timeline.groups.card`。`state` **整体替换**：编辑时先读取并保留原有字段；`state:null` 清除整体效果。`patch` 仍表示逐成员修改。

- 成员自己的动画、位置、出场时间保留；整体动画的时间从最早可见成员开始，到最晚成员结束。
- 容器支持 `rotate`、`scale`、`opacity`、`transform3d`、`animations`、`effects`、`mask`、`motionPath`。
- 整体按最上层成员的位置参与叠放，组内保留原层序；没有整体状态的旧分组维持原有交错叠放。
- 移动、复制整组、复制粘贴、撤销/恢复会保留状态；解除分组会移除整体效果，不烘焙到各成员。

## 羽化遮罩

在元素“位置”页选择椭圆、矩形或自定义 SVG 路径。遮罩只改变透明度，不模糊文字和图片内容；其羽化会同时影响遮罩范围内的元素阴影。

```json
{"op":"updateOverlay","id":"photo","patch":{"mask":{"type":"ellipse","x":0.5,"y":0.5,"w":0.85,"h":0.85,"feather":24,"invert":false}}}
```

`x/y` 是遮罩中心，`w/h` 是尺寸，相对元素自身宽高；组合遮罩相对画布。`feather` 为画布像素（0–200）。`path` 模式使用局部 0–100 坐标；例如 `M 50 0 L 100 50 L 50 100 L 0 50 Z`。`invert:true` 保留形状外部；元素 `mask:null` 清除遮罩。

## 路径运动

元素“位置”页提供弧线、波浪、环绕预设及 SVG 路径输入。

```json
{"op":"updateOverlay","id":"ball","patch":{"motionPath":{"path":"M 0 0 Q 20 -30 40 0","autoRotate":true,"rotationOffset":0},"animations":{"pathProgress":[{"t":0,"v":0},{"t":2,"v":1,"e":"inOut"},{"t":4,"v":0,"e":"inOut"}]}}}
```

- 单条 SVG 路径，坐标是相对元素原位的偏移；100 单位等于画布宽或高。推荐从 `M 0 0` 开始。
- 缺省在元素全时长内按实际像素弧长匀速走完整条路径，支持曲线及闭环。`autoRotate` 沿切线转向，`rotationOffset` 调整朝向。
- `pathProgress` 为 0–1，可打关键帧控制缓动、停顿、倒放。它与文字/描边用的 `progress` 相互独立。
- 路径位移与已有 x/y 动画叠加；分割和变形操作保留切点进度。`motionPath:null` 清除路径。

遮罩与路径运动适用于原生元素以及组合容器。媒体轨道片段可继续使用现有裁切、3D 和转场；若需路径运动或遮罩，可使用图片元素。

完整示例：[group-mask-path.json](../examples/group-mask-path.json)。
