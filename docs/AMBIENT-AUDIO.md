# 粒子、音频驱动与预览质量（2.8.0）

选中元素，在「样式」（文字在「文字」）面板中使用「粒子效果」和「音频驱动画面」。建议用单独的空白形状作为粒子区域。

- 粒子预设：飘雪、星光、雨丝、彩纸、火星；支持数量、尺寸、速度、种子，以及 JSON 中的自定义颜色数组。
- 音频驱动：选择已有音频或视频片段，读取其原始波形；可以驱动缩放、透明度或旋转，并控制强度、平滑时间。可在形状内显示波形柱。
- 「添加起音标记」按音量突增添加时间线标记，最多 500 个；这是起音检测，不是 BPM 或音乐节拍识别。
- 预览右上角：完整、标准、流畅。标准/流畅减少粒子数量和运动模糊采样，不改变项目数据，导出始终完整质量。

所有动画都通过当前时间计算，没有随机播放状态；拖动时间轴、重复渲染保持一致。波形存入项目，导出不依赖浏览器实时音频分析。音源支持裁剪、变速、时间偏移、静音、音量关键帧和淡入淡出。波形是原素材的振幅包络，不包含混音后的闪避或多音轨叠加结果。替换素材文件内容后重新绑定以更新波形；音源被删、素材名改变或超出片段时间时停止驱动。片段拆分后要把后半段效果重新绑定到新片段。

## JSON / AI 调用

用 `addOverlay` / `updateOverlay` 写入以下可选字段，`null` 清除；现有阴影、遮罩、关键帧、组合和 2.5D 能力可继续组合使用。

```json
{
  "kind": "shape",
  "shape": {"type": "rect", "fill": "none"},
  "particles": {
    "preset": "confetti", "count": 100, "seed": 42,
    "speed": 1, "size": 5, "colors": ["#38bdf8", "#fb7185"]
  }
}
```

`audioReactive` 格式：`{source:片段ID, src:素材名, rate:100, values:[0..1], channel:"scale", amount:0.3, smoothing:0.08, waveform:false}`。`channel` 支持 `scale|opacity|rotation`，分别在原动画上追加 `1+强度×包络` 的缩放、`1-强度×包络` 的透明度乘数、`强度×包络` 度旋转。

从 `GET /api/p/:pid/assets/:name/peaks` 获取原始素材 Uint8 波形，以响应头 `X-Peaks-Rate` 为采样率，各值除以 255。最多存储 720000 个采样点（100 Hz 时两小时）。面板自动完成读取与绑定。字段 schema 版本为 15，旧项目自动迁移。

示例：[时间线](../examples/ambient-audio.json)、[原创测试音频](../examples/assets/ambient-pulse.wav)、[效果截图](screenshots/38-ambient-audio.png)。在项目根目录执行 `node tests/integration/ambient.mjs` 可重新导出示例视频并验证同一时刻的画面一致性。
