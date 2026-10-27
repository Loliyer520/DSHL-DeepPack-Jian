// 编辑命令：键盘、右键菜单、按钮共用；每条命令生成一批 ops 并带人类可读的 label
import type { Clip, Overlay, Timeline } from '../../../engine/src/schema';
import { elementLabel, locateClip, mainTrackStarts, srcLabel } from '../../../engine/src/timeline';
import { splitOffset } from '../../../engine/src/ops';
import type { Editor } from './context';
import type { Op, AssetInfo } from './engine';
import type { Selected } from './selection';
import { cuesToOps, type Cue } from '../../../engine/src/srt';
import { SLIDE_SAMPLES } from '../../../engine/src/templates';

const frame = (t: Timeline) => 1 / t.meta.fps;
const snapT = (t: Timeline, s: number) => Math.round(s * t.meta.fps) / t.meta.fps;
/** 复制/粘贴整页时给副本一个新分组，避免和原页合并成一块 */
const newGroupId = () => 'g' + Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 5);

export type ElementKind = 'text' | 'title' | 'counter' | 'shape' | 'icon' | 'image' | 'chart' | 'math' | 'plot';
export const KIND_NAME: Record<string, string> = { subtitle: '字幕', title: '标题', text: '文本框', shape: '形状', image: '图片', icon: '图标', chart: '图表', math: '公式', plot: '坐标系', camera: '镜头' };

/** 完整选中的分组（整页幻灯片）：组 id → 成员 */
export function selectedGroups(t: Timeline, items: Selected[]): Map<string, Overlay[]> {
  const ids = new Set(items.filter((s) => s.kind === 'overlay').map((s) => s.id));
  const out = new Map<string, Overlay[]>();
  for (const o of t.overlays) if (o.group) { if (!out.has(o.group)) out.set(o.group, []); out.get(o.group)!.push(o); }
  for (const [g, members] of out) if (!members.every((o) => ids.has(o.id))) out.delete(g);
  return out;
}

export function itemsAtTime(t: Timeline, at: number, kinds: Selected['kind'][] = ['clip', 'overlay']): Selected[] {
  const out: Selected[] = [];
  const starts = mainTrackStarts(t);
  t.videoTracks.forEach((tr, i) => tr.clips.forEach((c) => {
    const s = i === 0 ? starts.get(c.id) ?? 0 : c.atSeconds ?? 0;
    if (at > s && at < s + c.clipDuration) out.push({ kind: 'clip', id: c.id });
  }));
  t.audioTracks.forEach((tr) => tr.clips.forEach((c) => { if (at > c.atSeconds && at < c.atSeconds + c.duration) out.push({ kind: 'clip', id: c.id }); }));
  if (kinds.includes('overlay')) t.overlays.forEach((o) => { if (at > o.startSeconds && at < o.endSeconds) out.push({ kind: 'overlay', id: o.id }); });
  return out.filter((x) => kinds.includes(x.kind));
}

export function editPoints(t: Timeline): number[] {
  const pts = new Set<number>([0]);
  const starts = mainTrackStarts(t);
  t.videoTracks.forEach((tr, i) => tr.clips.forEach((c) => {
    const s = i === 0 ? starts.get(c.id) ?? 0 : c.atSeconds ?? 0;
    pts.add(s); pts.add(s + c.clipDuration);
  }));
  t.audioTracks.forEach((tr) => tr.clips.forEach((c) => { pts.add(c.atSeconds); pts.add(c.atSeconds + c.duration); }));
  t.overlays.forEach((o) => { pts.add(o.startSeconds); pts.add(o.endSeconds); });
  (t.markers ?? []).forEach((m) => pts.add(m.t));
  return [...pts].map((p) => snapT(t, p)).sort((a, b) => a - b);
}

let clipboard: { clips: { clip: Record<string, unknown>; kind: 'main' | 'pip' | 'audio'; offset: number }[]; overlays: { overlay: Overlay; offset: number }[] } | null = null;

export function createActions(ed: Editor) {
  const t = () => ed.store.current;
  const sel = () => ed.sel.getSnapshot().items;
  const now = () => ed.clock.time();
  const run = (ops: Op[], label: string) => (ops.length ? ed.store.dispatch(ops, { label }) : []);

  /** 插入一个元素（文本框/标题/数字/形状/图标/图片/图表），放在播放头处、画面中央，默认 4 秒 */
  const addElement = (kind: ElementKind, spec: Record<string, unknown> = {}) => {
    const tl = t(); if (!tl) return;
    const at = snapT(tl, now());
    const k = Math.min(tl.meta.width, tl.meta.height) / 1080;
    const px = (v: number) => Math.max(1, Math.round(v * k));
    const shapeType = typeof (spec.shape as { type?: string } | undefined)?.type === 'string' ? (spec.shape as { type: string }).type : 'rect';
    const defaults: Record<ElementKind, Record<string, unknown>> = {
      text: { kind: 'text', text: '双击编辑文字', w: 0.5, fontSize: px(44), fontFamily: 'sans', fontWeight: 500, align: 'left', lineHeight: 1.4, animationPreset: 'riseUp' },
      title: { kind: 'title', text: '标题文字', w: 0.8, fontSize: px(96), fontFamily: 'sans', fontWeight: 800, align: 'center', animationPreset: 'popIn' },
      counter: { kind: 'text', text: '', counter: { from: 0, to: 100, suffix: '%' }, w: 0.35, fontSize: px(140), fontFamily: 'sans', fontWeight: 800, align: 'center', animationPreset: 'countUp' },
      shape: { kind: 'shape', shape: { type: shapeType, ...(shapeType === 'rect' || shapeType === 'callout' ? { radius: px(24) } : {}) }, w: shapeType === 'line' || shapeType === 'arrow' || shapeType === 'doubleArrow' ? 0.3 : 0.2, animationPreset: 'popIn' },
      icon: { kind: 'icon', icon: { name: 'star' }, w: 0.08, animationPreset: 'popIn' },
      image: { kind: 'image', w: 0.4, animationPreset: 'fadeIn' },
      chart: { kind: 'chart', chart: { type: 'column', data: [{ label: '一月', value: 32 }, { label: '二月', value: 48 }, { label: '三月', value: 41 }, { label: '四月', value: 66 }], showValues: true }, w: 0.5, h: 0.45, fontSize: px(26), animationPreset: 'growIn' },
      math: { kind: 'math', text: 'e^{i\\pi} + 1 = 0', fontSize: px(96), animationPreset: 'write' },
      plot: { kind: 'plot', plot: { x: [-5, 5], y: [-3, 3], grid: true, items: [{ type: 'fn', id: 'f', fn: 'sin(x)', label: '$y=\\sin x$' }] }, w: 0.7, h: (0.7 * tl.meta.width) / tl.meta.height / 1.6, fontSize: px(26), animationPreset: 'create' },
    };
    const merged: Record<string, unknown> = { ...defaults[kind], ...spec };
    if (kind === 'shape') merged.shape = { ...(defaults.shape.shape as object), ...(spec.shape as object | undefined) };
    if (kind === 'chart' && spec.chart) merged.chart = { ...(defaults.chart.chart as object), ...(spec.chart as object) };
    const op: Op = { op: 'addOverlay', startSeconds: at, endSeconds: at + 4, x: 0.5, y: 0.5, ...merged };
    const LABEL: Record<ElementKind, string> = { text: '文本框', title: '标题', counter: '数字', shape: '形状', icon: '图标', image: '图片', chart: '图表', math: '公式', plot: '坐标系' };
    const r = run([op], '插入' + LABEL[kind]);
    if (r[0]?.id) ed.sel.select({ kind: 'overlay', id: r[0].id });
  };

  return {
    splitAtPlayhead() {
      const tl = t(); if (!tl) return;
      const at = snapT(tl, now());
      const targets = sel().length ? sel().filter((s) => s.kind === 'clip' || s.kind === 'overlay') : itemsAtTime(tl, at).filter((s) => {
        const loc = s.kind === 'clip' ? locateClip(tl, s.id) : null;
        return s.kind === 'clip' ? loc?.kind === 'video' && loc.trackIndex === 0 : false;
      });
      const ops: Op[] = [];
      for (const s of targets) {
        if (s.kind === 'clip') {
          const loc = locateClip(tl, s.id);
          if (loc && splitOffset(loc.start, loc.duration, at, tl.meta.fps) !== null) ops.push({ op: 'splitClip', id: s.id, atSeconds: at });
        } else {
          const o = tl.overlays.find((x) => x.id === s.id);
          if (o && splitOffset(o.startSeconds, o.endSeconds - o.startSeconds, at, tl.meta.fps) !== null) ops.push({ op: 'splitOverlay', id: s.id, atSeconds: at });
        }
      }
      if (!ops.length) { ed.store.toast('info', '把播放头移到片段内部再分割'); return; }
      run(ops, '分割 ' + ops.length + ' 个片段');
    },
    deleteSelection() {
      const items = sel(); if (!items.length) return;
      const ops: Op[] = items.map((s) => (s.kind === 'clip' ? { op: 'removeClip', id: s.id } : s.kind === 'overlay' ? { op: 'removeOverlay', id: s.id } : s.kind === 'marker' ? { op: 'removeMarker', id: s.id } : { op: 'removeTrack', id: s.id }));
      run(ops, '删除 ' + items.length + ' 项');
      ed.sel.clear();
    },
    duplicateSelection() {
      const tl = t(); if (!tl) return;
      const items = sel().filter((s) => s.kind === 'clip' || s.kind === 'overlay');
      // 整页幻灯片：副本接在原页之后，换新分组
      const groups = selectedGroups(tl, items);
      const inGroup = new Set([...groups.values()].flat().map((o) => o.id));
      const ops: Op[] = [];
      for (const members of groups.values()) {
        const g = newGroupId();
        const span = Math.max(...members.map((o) => o.endSeconds)) - Math.min(...members.map((o) => o.startSeconds));
        for (const { id: _id, ...rest } of members) ops.push({ op: 'addOverlay', ...rest, group: g, startSeconds: rest.startSeconds + span, endSeconds: rest.endSeconds + span });
      }
      for (const s of items) if (!inGroup.has(s.id)) ops.push({ op: 'duplicateClip', id: s.id });
      run(ops, groups.size ? '复制 ' + groups.size + ' 页幻灯片' : '复制 ' + items.length + ' 项');
    },
    copy() {
      const tl = t(); if (!tl) return;
      const items = sel();
      const starts = items.map((s) => (s.kind === 'clip' ? locateClip(tl, s.id)?.start : tl.overlays.find((o) => o.id === s.id)?.startSeconds)).filter((v): v is number => v !== undefined);
      const base = starts.length ? Math.min(...starts) : 0;
      clipboard = { clips: [], overlays: [] };
      for (const s of items) {
        if (s.kind === 'clip') {
          const loc = locateClip(tl, s.id);
          if (!loc) continue;
          clipboard.clips.push({ clip: structuredClone(loc.clip) as unknown as Record<string, unknown>, kind: loc.kind === 'audio' ? 'audio' : loc.trackIndex === 0 ? 'main' : 'pip', offset: loc.start - base });
        } else if (s.kind === 'overlay') {
          const o = tl.overlays.find((x) => x.id === s.id);
          if (o) clipboard.overlays.push({ overlay: structuredClone(o), offset: o.startSeconds - base });
        }
      }
      if (clipboard.clips.length + clipboard.overlays.length) ed.store.toast('info', '已复制 ' + (clipboard.clips.length + clipboard.overlays.length) + ' 项');
    },
    paste() {
      const tl = t(); if (!tl || !clipboard) return;
      const at = snapT(tl, now());
      const ops: Op[] = [];
      for (const { clip, kind, offset } of clipboard.clips) {
        const { id: _id, atSeconds: _a, ...rest } = clip as { id: string; atSeconds?: number };
        if (kind === 'audio') ops.push({ op: 'addAudio', ...rest, atSeconds: at + offset });
        else if (kind === 'pip') ops.push({ op: 'addClip', ...rest, track: 'pip', atSeconds: at + offset });
        else ops.push({ op: 'addClip', ...rest, atSeconds: at + offset });
      }
      const regroup = new Map<string, string>();
      for (const { overlay, offset } of clipboard.overlays) {
        const { id: _id, ...rest } = overlay;
        const len = overlay.endSeconds - overlay.startSeconds;
        if (rest.group) { if (!regroup.has(rest.group)) regroup.set(rest.group, newGroupId()); rest.group = regroup.get(rest.group); }
        ops.push({ op: 'addOverlay', ...rest, startSeconds: at + offset, endSeconds: at + offset + len });
      }
      run(ops, '粘贴 ' + ops.length + ' 项');
    },
    nudge(seconds: number) {
      const tl = t(); if (!tl) return;
      const ops: Op[] = [];
      for (const s of sel()) {
        if (s.kind === 'clip') {
          const loc = locateClip(tl, s.id);
          if (!loc) continue;
          if (loc.kind === 'video' && loc.trackIndex === 0) ops.push({ op: 'moveClip', id: s.id, index: Math.max(0, loc.index + Math.sign(seconds)) });
          else ops.push({ op: 'moveClip', id: s.id, atSeconds: Math.max(0, loc.start + seconds) });
        } else if (s.kind === 'overlay') {
          const o = tl.overlays.find((x) => x.id === s.id);
          if (o) ops.push({ op: 'updateOverlay', id: s.id, patch: { startSeconds: Math.max(0, o.startSeconds + seconds), endSeconds: Math.max(frame(tl), o.endSeconds + seconds) } });
        }
      }
      run(ops, '微移');
    },
    /** 把选中片段的头/尾裁到播放头（剪映 Q/W） */
    trimToPlayhead(side: 'start' | 'end') {
      const tl = t(); if (!tl) return;
      const at = snapT(tl, now());
      const ops: Op[] = [];
      for (const s of sel().length ? sel() : itemsAtTime(tl, at)) {
        if (s.kind === 'clip') {
          const loc = locateClip(tl, s.id);
          if (!loc) continue;
          const off = splitOffset(loc.start, loc.duration, at, tl.meta.fps);
          if (off === null) continue;
          const speed = loc.clip.speed ?? 1;
          if (loc.kind === 'video') {
            ops.push({ op: 'updateClip', id: s.id, patch: side === 'end' ? { clipDuration: off } : { clipDuration: loc.duration - off, inPoint: loc.clip.inPoint + off * speed, ...(loc.trackIndex > 0 ? { atSeconds: loc.start + off } : {}) } });
          } else {
            ops.push({ op: 'updateClip', id: s.id, patch: side === 'end' ? { duration: off } : { duration: loc.duration - off, inPoint: loc.clip.inPoint + off * speed, atSeconds: loc.start + off } });
          }
        } else if (s.kind === 'overlay') {
          const o = tl.overlays.find((x) => x.id === s.id);
          if (o && at > o.startSeconds && at < o.endSeconds) ops.push({ op: 'updateOverlay', id: s.id, patch: side === 'end' ? { endSeconds: at } : { startSeconds: at } });
        }
      }
      run(ops, side === 'end' ? '裁掉播放头之后' : '裁掉播放头之前');
    },
    addMarker() {
      const tl = t(); if (!tl) return;
      const r = run([{ op: 'addMarker', t: snapT(tl, now()) }], '添加标记');
      const id = r[0]?.id;
      if (id) ed.sel.select({ kind: 'marker', id });
    },
    addText(kind: 'subtitle' | 'title' = 'subtitle') {
      const tl = t(); if (!tl) return;
      const at = snapT(tl, now());
      const op: Op = kind === 'title'
        ? { op: 'addOverlay', text: '标题', startSeconds: at, endSeconds: at + 3, kind: 'title', x: 0.5, y: 0.35, fontSize: Math.round(tl.meta.height * 0.1), fontFamily: 'sans', fontWeight: 800, animationPreset: 'zoomIn' }
        : { op: 'addOverlay', text: '新字幕', startSeconds: at, endSeconds: at + 2.5, kind: 'subtitle', fontSize: Math.round(tl.meta.height * 0.065), fontFamily: 'sans', fontWeight: 600, stroke: { color: '#000000', width: 3 } };
      const r = run([op], kind === 'title' ? '添加标题' : '添加字幕');
      if (r[0]?.id) ed.sel.select({ kind: 'overlay', id: r[0].id });
    },
    addElement,
    /** 把图片素材作为可自由摆放的图片元素（按原图比例，最大占画面 80%） */
    addImageElement(asset: Pick<AssetInfo, 'name' | 'width' | 'height'>) {
      const tl = t(); if (!tl) return;
      const W = tl.meta.width, H = tl.meta.height;
      const ratio = asset.width && asset.height ? asset.width / asset.height : 4 / 3;
      let wpx = 0.4 * W, hpx = wpx / ratio;
      if (hpx > 0.8 * H) { hpx = 0.8 * H; wpx = hpx * ratio; }
      addElement('image', { image: { src: asset.name, fit: 'cover' }, w: wpx / W, h: hpx / H, name: srcLabel(asset.name).slice(0, 40) });
    },
    /** 插入一页幻灯片：在播放头处、默认 5 秒，带示例文字，选中整页 */
    addSlide(template: string, theme: string) {
      const tl = t(); if (!tl) return;
      const at = snapT(tl, now());
      const r = run([{ op: 'addSlide', template, theme, ...(SLIDE_SAMPLES[template] ?? {}), startSeconds: at, duration: 5 }], '插入幻灯片');
      const group = r[0]?.id;
      const after = t();
      if (group && after) ed.sel.selectMany(after.overlays.filter((o) => o.group === group).map((o) => ({ kind: 'overlay' as const, id: o.id })));
    },
    /**
     * 加镜头：选中元素所在的那页（或播放头处的那页）加一个覆盖整页的镜头；没有幻灯片时加一个全局镜头。
     * 新镜头取景整个画面，选中后在画布上拖镜头框、在属性里套用推拉平移。
     */
    addCamera() {
      const tl = t(); if (!tl) return;
      const at = snapT(tl, now());
      const picked = sel().map((s) => tl.overlays.find((o) => o.id === s.id)).find((o) => o?.group);
      const group = picked?.group ?? tl.overlays.find((o) => o.group && at >= o.startSeconds && at < o.endSeconds)?.group;
      if (group && tl.overlays.some((o) => o.kind === 'camera' && o.group === group)) { ed.store.toast('info', '这一页已经有镜头了'); return; }
      const r = run([group ? { op: 'addOverlay', kind: 'camera', group, name: '镜头' } : { op: 'addOverlay', kind: 'camera', name: '镜头', startSeconds: at, endSeconds: at + 4 }], '添加镜头');
      if (r[0]?.id) ed.sel.select({ kind: 'overlay', id: r[0].id });
    },
    /** 变形：在播放头处把元素切成“变形前/变形后”两段，选中变形后的那段去改样子 */
    transformAtPlayhead(id: string) {
      const tl = t(); if (!tl) return;
      const o = tl.overlays.find((x) => x.id === id);
      if (!o) return;
      const at = snapT(tl, now());
      if (at <= o.startSeconds || at >= o.endSeconds) { ed.store.toast('info', '把播放头移到元素显示期间再变形'); return; }
      // 变形最多占剩余时长的一半，变完还能停留看清
      const r = run([{ op: 'transform', id, atSeconds: at, duration: Math.max(0.1, Math.min(1, (o.endSeconds - at) / 2)) }], '变形');
      if (r[0]?.id) {
        ed.sel.select({ kind: 'overlay', id: r[0].id });
        ed.store.toast('info', '已在 ' + at.toFixed(2) + 's 切出变形后的元素：现在改它的文字、形状或位置，播放时会从原来的样子平滑变过来');
      }
    },
    /** 叠放顺序（置顶/置底/上移/下移） */
    arrange(id: string, to: 'front' | 'back' | 'forward' | 'backward') {
      const LABEL = { front: '置于顶层', back: '置于底层', forward: '上移一层', backward: '下移一层' };
      run([{ op: 'arrangeOverlay', id, to }], LABEL[to]);
    },
    /** 选中整组（一页幻灯片的所有元素） */
    selectGroup(group: string) {
      const tl = t(); if (!tl) return;
      ed.sel.selectMany(tl.overlays.filter((o) => o.group === group).map((o) => ({ kind: 'overlay' as const, id: o.id })));
    },
    /** 把素材放到时间线：视频/图片→主轨（插到最近剪辑点）或画中画；音频→音频轨 */
    addAsset(asset: Pick<AssetInfo, 'name' | 'type' | 'duration'>, target: 'main' | 'pip' | 'audio' = asset.type === 'audio' ? 'audio' : 'main', at?: number, trackId?: string) {
      const tl = t(); if (!tl) return;
      const time = snapT(tl, at ?? now());
      const dur = asset.type === 'image' ? 3 : asset.duration && asset.duration > 0 ? asset.duration : 3;
      let op: Op;
      if (asset.type === 'audio' || target === 'audio') op = { op: 'addAudio', src: asset.name, atSeconds: time, duration: dur, ...(trackId ? { track: trackId } : {}) };
      else if (target === 'pip') op = { op: 'addClip', src: asset.name, track: trackId ?? 'pip', atSeconds: time, clipDuration: dur, box: { x: 0.62, y: 0.06, w: 0.34, h: 0.34 } };
      else op = { op: 'addClip', src: asset.name, atSeconds: time, clipDuration: dur, ...(asset.type === 'image' ? { animationPreset: 'kenBurns' } : {}) };
      const r = run([op], '添加「' + srcLabel(asset.name) + '」');
      const id = r[0]?.id;
      if (id) ed.sel.select({ kind: 'clip', id });
    },
    setTransition(clipId: string, transition: Clip['transition']) {
      run([{ op: 'updateClip', id: clipId, patch: { transition } }], '设置转场');
    },
    selectAll() {
      const tl = t(); if (!tl) return;
      ed.sel.selectMany([
        ...[...tl.videoTracks, ...tl.audioTracks].flatMap((tr) => tr.clips.map((c) => ({ kind: 'clip' as const, id: c.id }))),
        ...tl.overlays.map((o) => ({ kind: 'overlay' as const, id: o.id })),
      ]);
    },
    jumpEdit(dir: 1 | -1) {
      const tl = t(); if (!tl) return;
      const cur = now();
      const pts = editPoints(tl);
      const next = dir > 0 ? pts.find((p) => p > cur + frame(tl) / 2) : [...pts].reverse().find((p) => p < cur - frame(tl) / 2);
      if (next !== undefined) ed.clock.seek(next);
    },
    keyframeAtPlayhead(target: Selected, channel: string, value: number, remove: boolean, start: number) {
      const tl = t(); if (!tl) return;
      const rel = Math.max(0, snapT(tl, now()) - start);
      run([remove ? { op: 'removeKeyframe', id: target.id, channel, t: rel } : { op: 'setKeyframe', id: target.id, channel, t: rel, v: value }], remove ? '删除关键帧' : '添加关键帧');
    },
    /** 导入 SRT/VTT：与已有字幕重叠时放到新的字幕层；整批一步，可一次撤销 */
    importSubtitles(cues: Cue[]) {
      const tl = t(); if (!tl || !cues.length) return;
      const { ops, truncated } = cuesToOps(tl, cues);
      run(ops as Op[], '导入字幕 ' + ops.length + ' 条');
      if (truncated) ed.store.toast('info', '字幕超过 2000 条，只导入了前 2000 条');
    },
    /** “交给 AI”：把选中对象的描述插进聊天输入框（不自动发送） */
    askAi() {
      const tl = t(); if (!tl) return false;
      const parts = sel().slice(0, 8).map((s) => {
        if (s.kind === 'clip') {
          const loc = locateClip(tl, s.id);
          return loc ? s.id + '「' + srcLabel(loc.clip.src) + '」' + loc.start.toFixed(2) + '–' + (loc.start + loc.duration).toFixed(2) + 's' : s.id;
        }
        const o = tl.overlays.find((x) => x.id === s.id);
        return o ? s.id + ' ' + (KIND_NAME[o.kind ?? 'subtitle'] ?? '元素') + '「' + elementLabel(o).slice(0, 20) + '」' + (o.group ? '（幻灯片 ' + o.group + '）' : '') : s.id;
      });
      const text = parts.length ? '【选中：' + parts.join('、') + '】' : '【播放头 ' + now().toFixed(2) + 's】';
      return ed.host.insertIntoChat?.(text) ?? false;
    },
  };
}
export type Actions = ReturnType<typeof createActions>;
