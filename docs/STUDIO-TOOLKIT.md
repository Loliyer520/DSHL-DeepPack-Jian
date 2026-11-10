# 制作工具（2.9.0）

顶栏「制作工具」集中提供组件、统一主题、动画编排、素材适配、轻量 3D 和成片检查。全部修改写入同一份时间线，可撤销，也可由 AI 使用 `djian_apply_ops` 操作。

## 组件与实例参数

把标题卡、数据卡、片尾等元素分组，在「组件」选择来源分组并保存名称。插入实例后，各实例可独立修改文字、文字颜色、形状填充和图片。重新保存同名组件会更新已有实例，同时保留实例参数、实例起点与整体变换。删除定义或解除关联时保留现有画面。

- `saveComponent {name,group}`：保存或更新定义；也可传 `component:{duration,overlays,state?}`。
- `instantiateComponent {name,id?,startSeconds?,values?}`：`id` 是新分组 ID。
- `setComponentParams {group,values}`：按插槽更新实例参数。
- `detachComponent {group}`、`removeComponent {name}`。

插槽为源元素的 `componentSlot`，未设置时使用源元素 ID。`values` 示例：`{"title":{"text":"新品发布","color":"#ffffff"},"background":{"fill":"#2563eb"},"photo":{"imageSrc":"product.png"}}`。参数按插槽独立保存；普通手动修改的实例成员会在下次同步定义时被替换。组件定义保存在 `timeline.components`，实例关联保存在 `timeline.groups[group].component`。定义内的内部跟随、遮罩和动画编排引用会重映射为实例 ID。

## 统一主题

内置午夜蓝、纸白、霓虹。先选择元素，再在主题页选择 `heading/body/accent/card` 角色并关联；后续主题变化会同步这些元素。未关联元素保持原样，解除关联保留当前外观。

`setTheme {preset:"midnight"|"paper"|"neon"}` 或 `setTheme {theme:{name,background?,gap?,roles}}`。角色支持 `color/fill/fontFamily/fontSize/radius/padding/shadow`；填充和圆角用于形状。`gap` 同步现有自动布局组合的间距。`bindStyle {id,role}` 绑定，`role:null` 解除。

主题不是覆盖整片的调色滤镜：只控制关联元素的指定属性。修改这些属性后，下一次应用主题会再次以主题值为准。

## 动画时间编排

选择元素或组合，添加入场、出场、循环或停留段。拖动时间条改变开始时间，拖右边缘改变时长；右边缘聚焦后也可用左右键调整时长。可设置「接在另一动画之后」及偏移，前段时长改变时后段自动跟随。循环依赖会被拒绝。

元素 `cues`、组合 `state.cues` 格式：

```json
[
  {"id":"enter","preset":"fadeIn","start":0,"duration":0.8},
  {"id":"pause","preset":"hold","start":0,"duration":2,"after":"enter"},
  {"id":"leave","preset":"fadeOut","start":0,"duration":0.6,"after":"pause"}
]
```

`id` 全项目唯一。独立段的 `start` 是对象内秒数，关联段从前段的绝对结束时间加 `offset` 开始。`hold` 只占用时间，其他预设使用现有动画库；预设实际变化范围被伸缩到该段时长。同通道后段覆盖交叠部分；原关键帧继续保留，渲染时计算编排。编排不会自动延长元素显示区间，成片检查会提示超出部分。

## 素材替换与横竖屏适配

「素材与比例」中选择同类型素材批量替换。`replaceAsset {from,to}` 保留画面布局、遮罩、关键帧与成片时长；同步组件定义和实例图片参数。短音视频会调整源入点与倍速；无法在 0.1–10 倍范围内容纳原时长时拒绝替换。引用旧音频的波形缓存被清除，需要重新绑定音频驱动。

`adaptCanvas {width,height,mode:"reflow"|"contain"}`：

- `contain`：按像素等比缩放整个构图并居中，缩放字号与内边距。
- `reflow`：保留相对中心位置并限制元素宽高；竖屏下自动布局组合改为纵排，结合已有自动文字尺寸重新排版。

复杂自由排版仍应预览并调整。不会自动识别照片主体；可设置图片 `image.focus:{x,y}` 或视频片段 `focus:{x,y}`（0–1）控制 cover 裁切焦点。图片焦点在制作工具中设置，视频焦点在画面属性中设置。

## 轻量 3D

在「3D 场景」创建场景，增加立方体、球体或平面，设置位置、三个轴的角度与自转速度、颜色、透明度和线框。相机支持方位、俯仰、距离、视野与连续环绕；方向光和环境光可独立调节。

形状元素的 `scene3d` 使用真实三角网格、透视投影、Lambert 明暗和深度排序，按时间确定性计算，预览和导出共用。示例：

```json
{
  "camera":{"yaw":35,"pitch":25,"distance":6,"fov":45,"orbit":15},
  "light":{"direction":[-1,2,3],"ambient":0.25,"intensity":0.8},
  "objects":[
    {"id":"cube","geometry":"cube","color":"#38bdf8","spin":[10,30,0]},
    {"id":"sphere","geometry":"sphere","color":"#fb7185","position":[1.5,0,0]},
    {"id":"floor","geometry":"plane","color":"#334155","position":[0,-0.7,0]}
  ]
}
```

世界坐标为相对单位，角度为度，`spin/orbit` 为度/秒。最多 32 个对象。标准/流畅预览降低球体细分，导出使用完整细分。不支持外部模型、纹理、投影阴影或物理模拟；透明物体相交时受三角面排序限制。

## 成片检查

点击「检查当前已保存项目」，或让 AI 调用 `djian_check`。返回严重程度、对象 ID、时间点和原因；点击结果跳到对应时间并选中元素。

检查缺失素材（含组件定义）、超出源时长、静态元素越界、估算文字溢出、阅读速度、低对比度、文本重叠、动画结束超出对象区间和缺失组件。音频读取实际峰值包络，提示近静音片段和多轨叠加可能过高的峰值。

文字与布局结果是静态估算，不包含每个动画时刻、特殊字体和复杂遮罩。音频峰值叠加为保守估计，不等同于最终响度/削波测量，不计算闪避与相位抵消；包络检查最多覆盖前两小时。检查只给出定位建议，不自动改片，也不会阻止导出。

## 验证与示例

时间线版本升级到 v16，旧项目自动迁移。系统撤销使用 `putTheme/putComponent` 分别恢复主题和各组件定义。

- 示例时间线：[studio-toolkit.json](../examples/studio-toolkit.json)
- 效果截图：[3D 与组件](screenshots/39-studio-toolkit.png)、[制作面板](screenshots/40-studio-panel.png)
- `npm test`：引擎、组件联动、主题、编排、素材替换、适配与检查 API。
- `npm run test:studio`：生成示例，验证确定性渲染并导出 MP4。
- `npm run test:studio-ui`：真实浏览器验证面板操作及动画时间条拖动。
