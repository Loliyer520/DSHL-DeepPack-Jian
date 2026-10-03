export function activeTextLayers(timeline, frame) {
  const fps = timeline.meta.fps;
  return timeline.overlays.flatMap((layer, index) => {
    const start = Math.round(layer.startSeconds * fps);
    const duration = Math.max(1, Math.round((layer.endSeconds - layer.startSeconds) * fps));
    return frame >= start && frame < start + duration ? [{ index, text: layer.text, color: layer.color,
      position: layer.position, startSeconds: layer.startSeconds, endSeconds: layer.endSeconds,
      ...(layer.animations ? { animations: layer.animations } : {}) }] : [];
  });
}

export function bottomRegionStats(raw, width, height) {
  let count = 0, colored = 0;
  const colors = new Map();
  for (let y = Math.floor(height * 2 / 3); y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      const rgb = [raw[i], raw[i + 1], raw[i + 2]];
      const max = Math.max(...rgb), min = Math.min(...rgb);
      if (max >= 160 && max - min >= 32 && .299 * rgb[0] + .587 * rgb[1] + .114 * rgb[2] >= 100) colored++;
      const key = rgb.map(v => v >> 6).join(',');
      colors.set(key, (colors.get(key) || 0) + 1);
      count++;
    }
  }
  return {
    bottomThirdColoredPercent: Math.round(colored / count * 1000) / 10,
    bottomThirdDominantColors: [...colors].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([key, n]) => ({
      rgb: key.split(',').map(v => Number(v) * 64 + 32), percent: Math.round(n / count * 100),
    })),
    interpretation: 'BrightPercent 是亮度>200的像素占比；ColoredPercent 是显著彩色像素占比。背景也会贡献像素，0 不代表没有字幕。activeTextLayers 只表示时间范围命中，不保证实际可见。',
  };
}
