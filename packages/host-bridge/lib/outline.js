// 时间线精简大纲：给模型看的“剪辑台视图”（带 id，可直接用于操作），比整份 JSON 省 token
const s = (v) => (Math.round(v * 100) / 100).toString() + 's';
const pct = (v) => Math.round(v * 100) + '%';
const name = (src) => String(src).split(/[\\/]/).pop();
const tr = (t) => (!t || t === 'none' ? '' : t === 'fade' ? '黑场淡入' : t.type + ' ' + s(t.duration) + (t.direction ? ' ' + t.direction : ''));
const fx = (c) => [
  c.speed && c.speed !== 1 ? '速度 ' + c.speed + '×' : '',
  c.volume !== undefined && c.volume !== 1 ? '音量 ' + pct(c.volume) : '',
  c.muted ? '静音' : '',
  c.filter ? '滤镜 ' + Object.entries(c.filter).map(([k, v]) => k + '=' + v).join(',') : '',
  c.effects?.length ? '预设 ' + c.effects.map((e) => e.preset).join('+') : '',
  c.animations ? '关键帧 ' + Object.keys(c.animations).join('/') : '',
  c.fadeIn ? '淡入 ' + s(c.fadeIn) : '', c.fadeOut ? '淡出 ' + s(c.fadeOut) : '',
  c.crop ? '裁切' : '', c.flipH ? '水平翻转' : '', c.freeze ? '定格' : '', c.opacity !== undefined ? '不透明 ' + pct(c.opacity) : '',
].filter(Boolean).join('，');

export function outline(timeline, { name: projectName, rev } = {}) {
  const t = timeline;
  const fps = t.meta.fps;
  const lines = [];
  let total = 0;
  const main = t.videoTracks[0];
  const starts = [];
  let frames = 0;
  for (const c of main.clips) { starts.push(frames / fps); frames += Math.round(c.clipDuration * fps); }
  total = frames / fps;
  for (const track of t.videoTracks.slice(1)) for (const c of track.clips) total = Math.max(total, (c.atSeconds ?? 0) + c.clipDuration);
  for (const track of t.audioTracks) for (const c of track.clips) total = Math.max(total, c.atSeconds + c.duration);
  for (const o of t.overlays) total = Math.max(total, o.endSeconds);
  lines.push((projectName ? '项目「' + projectName + '」' : '时间线') + (rev !== undefined ? ' rev ' + rev : '') + ' · 画布 ' + t.meta.width + '×' + t.meta.height + ' @' + fps + 'fps · 总长 ' + s(total));
  lines.push('主轨 ' + main.id + (main.locked ? '（已锁定）' : '') + '（' + main.clips.length + ' 段，首尾相接）:');
  main.clips.forEach((c, i) => {
    const extra = [c.inPoint ? '入点 ' + s(c.inPoint) : '', tr(c.transition) ? '转场 ' + tr(c.transition) : '', fx(c)].filter(Boolean).join('，');
    lines.push('  ' + (i + 1) + '. ' + c.id + ' ' + name(c.src) + (c.type === 'image' ? '[图]' : '') + ' ' + s(starts[i]) + '–' + s(starts[i] + c.clipDuration) + (extra ? '（' + extra + '）' : ''));
  });
  t.videoTracks.slice(1).forEach((track, i) => {
    lines.push('叠加轨 ' + track.id + '「' + (track.name ?? '画中画') + '」第 ' + (i + 2) + ' 层' + (track.hidden ? '（隐藏）' : '') + (track.locked ? '（已锁定）' : '') + ':');
    for (const c of track.clips) {
      const b = c.box ?? { x: 0.66, y: 0.66, w: 0.3, h: 0.3 };
      const extra = [c.inPoint ? '入点 ' + s(c.inPoint) : '', fx(c)].filter(Boolean).join('，');
      lines.push('  - ' + c.id + ' ' + name(c.src) + ' ' + s(c.atSeconds ?? 0) + '–' + s((c.atSeconds ?? 0) + c.clipDuration) + ' 盒子 x' + pct(b.x) + ' y' + pct(b.y) + ' ' + pct(b.w) + '×' + pct(b.h) + (extra ? '（' + extra + '）' : ''));
    }
  });
  for (const track of t.audioTracks) {
    lines.push('音频轨 ' + track.id + '「' + (track.name ?? '音频') + '」音量 ' + pct(track.volume) + (track.muted ? '（静音）' : '') + (track.role ? ' 用途 ' + track.role : '') + (track.duck ? ' 闪避→' + pct(track.duck.level) : '') + (track.locked ? '（已锁定）' : '') + ':');
    for (const c of track.clips) {
      const extra = [c.inPoint ? '入点 ' + s(c.inPoint) : '', fx(c)].filter(Boolean).join('，');
      lines.push('  - ' + c.id + ' ' + name(c.src) + ' ' + s(c.atSeconds) + '–' + s(c.atSeconds + c.duration) + (extra ? '（' + extra + '）' : ''));
    }
  }
  if (t.overlays.length) {
    lines.push('文字/字幕（' + t.overlays.length + ' 条）:');
    for (const o of [...t.overlays].sort((a, b) => a.startSeconds - b.startSeconds)) {
      const pos = o.x !== undefined || o.y !== undefined ? '位置 (' + pct(o.x ?? 0.5) + ',' + pct(o.y ?? 0.85) + ')' : { top: '顶部', center: '居中', bottom: '底部' }[o.position];
      const style = [pos, o.fontSize + 'px', o.color !== '#ffffff' ? o.color : '', o.fontFamily ?? '', o.stroke ? '描边' : '', o.background ? '底框' : '', o.effects?.length ? '预设 ' + o.effects.map((e) => e.preset).join('+') : '', o.animations ? '关键帧' : ''].filter(Boolean).join(' ');
      lines.push('  - ' + o.id + ' ' + s(o.startSeconds) + '–' + s(o.endSeconds) + ' 「' + o.text + '」 ' + style);
    }
  }
  if (t.markers?.length) lines.push('标记: ' + t.markers.map((m) => m.id + ' ' + s(m.t) + (m.label ? '「' + m.label + '」' : '')).join('；'));
  return lines.join('\n');
}
