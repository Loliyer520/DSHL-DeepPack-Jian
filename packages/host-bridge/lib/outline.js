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

const KIND = { subtitle: '字幕', title: '标题', text: '文本', shape: '形状', image: '图片', icon: '图标', chart: '图表' };
const short = (v, n = 24) => { const t = String(v ?? '').replace(/\n/g, '⏎'); return t.length > n ? t.slice(0, n) + '…' : t; };
const fillText = (f) => (!f ? '' : typeof f === 'string' ? f : (f.type === 'radial' ? '径向渐变 ' : '渐变 ') + f.stops.map((x) => x.color).join('→'));
function elementLine(o, z) {
  const kind = o.kind ?? 'subtitle';
  const what = kind === 'shape' ? '形状·' + (o.shape?.type ?? 'rect') : kind === 'image' ? '图片·' + name(o.image?.src ?? '') : kind === 'icon' ? '图标·' + (o.icon?.name ?? '?') : kind === 'chart' ? '图表·' + (o.chart?.type ?? '') + ' ' + (o.chart?.data ?? []).map((d) => (d.label ? d.label + '=' : '') + d.value).join(',') : KIND[kind] ?? kind;
  const box = o.w !== undefined ? '(' + pct(o.x ?? 0.5) + ',' + pct(o.y ?? 0.5) + ') ' + pct(o.w) + '×' + (o.h !== undefined ? pct(o.h) : '自动') : o.x !== undefined || o.y !== undefined ? '位置 (' + pct(o.x ?? 0.5) + ',' + pct(o.y ?? 0.85) + ')' : { top: '顶部', center: '居中', bottom: '底部' }[o.position];
  const style = [
    o.text?.trim() ? '「' + short(o.text, 40) + '」' : '',
    box, o.rotate ? '旋转 ' + o.rotate + '°' : '', o.opacity !== undefined ? '不透明 ' + pct(o.opacity) : '',
    o.text?.trim() || kind === 'chart' ? o.fontSize + 'px' : '', o.color !== '#ffffff' ? o.color : '', o.fontFamily ?? '',
    o.shape ? fillText(o.shape.fill) + (o.shape.stroke ? ' 描边' + o.shape.stroke.color : '') + (o.shape.radius ? ' 圆角' + o.shape.radius : '') : '',
    o.list ? '列表 ' + o.list : '', o.counter ? '数字 ' + o.counter.from + '→' + o.counter.to : '', o.textEffect ? '逐' + ({ char: '字', word: '词', line: '行' }[o.textEffect.by ?? 'char']) + ' ' + o.textEffect.type : '',
    o.stroke ? '文字描边' : '', o.background ? '底框' : '', o.effects?.length ? '预设 ' + o.effects.map((e) => e.preset).join('+') : '', o.animations ? '关键帧 ' + Object.keys(o.animations).join('/') : '',
  ].filter(Boolean).join(' ');
  return o.id + ' 层' + z + ' ' + s(o.startSeconds) + '–' + s(o.endSeconds) + ' ' + what + (o.name ? '「' + o.name + '」' : '') + ' ' + style;
}

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
    // 叠放顺序：非字幕元素按 (track, 数组顺序) 自下而上，字幕永远在最上层
    const z = t.overlays.map((o, i) => ({ o, i })).sort((a, b) => ((a.o.kind === 'subtitle') - (b.o.kind === 'subtitle')) || (a.o.track ?? 0) - (b.o.track ?? 0) || a.i - b.i).map((x) => x.o);
    const layer = new Map(z.map((o, i) => [o.id, i + 1]));
    const groups = new Map();
    for (const o of t.overlays) if (o.group) groups.set(o.group, [...(groups.get(o.group) ?? []), o]);
    const loose = t.overlays.filter((o) => !o.group);
    lines.push('元素（' + t.overlays.length + ' 个；“层”越大越靠上，字幕始终在最上层）:');
    for (const [g, els] of [...groups].sort((a, b) => Math.min(...a[1].map((o) => o.startSeconds)) - Math.min(...b[1].map((o) => o.startSeconds)))) {
      const a = Math.min(...els.map((o) => o.startSeconds)), b = Math.max(...els.map((o) => o.endSeconds));
      lines.push('  幻灯片/分组 ' + g + ' ' + s(a) + '–' + s(b) + '（' + els.length + ' 个元素）:');
      for (const o of [...els].sort((x, y) => layer.get(x.id) - layer.get(y.id))) lines.push('    - ' + elementLine(o, layer.get(o.id)));
    }
    for (const o of [...loose].sort((a, b) => a.startSeconds - b.startSeconds)) lines.push('  - ' + elementLine(o, layer.get(o.id)));
  }
  if (t.markers?.length) lines.push('标记: ' + t.markers.map((m) => m.id + ' ' + s(m.t) + (m.label ? '「' + m.label + '」' : '')).join('；'));
  return lines.join('\n');
}
