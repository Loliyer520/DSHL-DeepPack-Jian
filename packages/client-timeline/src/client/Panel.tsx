import { TransportBar } from './TransportBar';
import { TrackStrip, type TrackMode } from './TrackStrip';
import { MoreTools } from './MoreTools';
import { InspectorRow, AdvancedSettings } from './InspectorRow';
import { Icon } from './Icon';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import {
  timelineDurationInFrames,
  shiftAnimations,
  type AudioClip,
  type Clip,
  type Overlay,
  type Timeline,
} from '../../../engine/src/schema';
import { ANIMATION_PRESETS, expandAnimationPreset } from '../../../engine/src/presets';
import { PreviewVideo } from './PreviewVideo';
import { playerBus, seekToSeconds } from './bus';
import { assetUrl, listFonts, uploadAsset, type AssetInfo, type DjianFontInfo } from './api';
import { useHistory } from './useHistory';
import { useTimelineSync } from './useTimelineSync';
import { ProjectBar } from './ProjectBar';
import { CanvasDialog } from './CanvasDialog';
import { AssetsSection } from './AssetsSection';
import { ExportControl } from './ExportControl';
import { HistoryDialog } from './HistoryDialog';

const fmtSec = (s: number) => `${s.toFixed(1)}s`;

// ---------- 剪辑原语（语义与 webui store / 服务端 ops 一致） ----------
const clipId = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

type Mutate = (fn: (t: Timeline) => Timeline) => void;

const ops = (mutate: Mutate) => ({
  addClip: () =>
    mutate((t) => ({
      ...t,
      videoTracks: t.videoTracks.map((tr, i) =>
        i === 0
          ? {
              ...tr,
              clips: [
                ...tr.clips,
                {
                  id: clipId(),
                  type: 'video' as const,
                  // 默认沿用末片段素材，空时间线退回 a.mp4
                  src: tr.clips[tr.clips.length - 1]?.src ?? 'a.mp4',
                  inPoint: 0,
                  clipDuration: 3,
                  transition: 'none' as const,
                  volume: 1, speed: 1,
                },
              ],
            }
          : tr,
      ),
    })),
  addPip: () =>
    mutate((t) => {
      const src = t.videoTracks[0]?.clips[t.videoTracks[0].clips.length - 1]?.src ?? 'a.mp4';
      const clip = {
        id: clipId(),
        type: 'video' as const,
        src,
        inPoint: 0,
        clipDuration: 3,
        transition: 'none' as const,
        volume: 1, speed: 1,
        atSeconds: 0,
      };
      if (t.videoTracks[1]) {
        return {
          ...t,
          videoTracks: t.videoTracks.map((tr, i) => (i === 1 ? { ...tr, clips: [...tr.clips, clip] } : tr)),
        };
      }
      return { ...t, videoTracks: [...t.videoTracks, { id: 'v2', name: '画中画', clips: [clip] }] };
    }),
  addAudio: (src: string, duration = 10) =>
    mutate((t) => {
      const clip = { id: clipId(), src, inPoint: 0, duration, volume: 1, speed: 1, atSeconds: 0 };
      if (t.audioTracks[0]) {
        return {
          ...t,
          audioTracks: t.audioTracks.map((tr, i) => (i === 0 ? { ...tr, clips: [...tr.clips, clip] } : tr)),
        };
      }
      return { ...t, audioTracks: [{ id: 'a1', name: '音频', volume: 1, muted: false, clips: [clip] }] };
    }),
  removeClip: (id: string) =>
    mutate((t) => ({
      ...t,
      videoTracks: t.videoTracks
        .map((tr) => ({ ...tr, clips: tr.clips.filter((c) => c.id !== id) }))
        .filter((tr, i) => i === 0 || tr.clips.length > 0),
    })),
  removeAudioClip: (id: string) =>
    mutate((t) => ({
      ...t,
      audioTracks: t.audioTracks
        .map((tr) => ({ ...tr, clips: tr.clips.filter((c) => c.id !== id) }))
        .filter((tr) => tr.clips.length > 0),
    })),
  updateClip: (id: string, patch: Partial<Clip>) =>
    mutate((t) => ({
      ...t,
      videoTracks: t.videoTracks.map((tr) => ({
        ...tr,
        clips: tr.clips.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      })),
    })),
  updateAudioTrack: (id: string, patch: { volume?: number; muted?: boolean }) =>
    mutate((t) => ({
      ...t,
      audioTracks: t.audioTracks.map((tr) => (tr.id === id ? { ...tr, ...patch } : tr)),
    })),
  updateAudioClip: (id: string, patch: Partial<AudioClip>) =>
    mutate((t) => ({
      ...t,
      audioTracks: t.audioTracks.map((tr) => ({
        ...tr,
        clips: tr.clips.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      })),
    })),
  // 分割：全局时间轴切点，主轨/叠加/音频 clip 通用（与 5180 服务端 op 同语义）
  splitClip: (id: string, atSeconds: number) =>
    mutate((t) => {
      for (let ti = 0; ti < t.videoTracks.length; ti++) {
        const tr = t.videoTracks[ti];
        const idx = tr.clips.findIndex((c) => c.id === id);
        if (idx === -1) continue;
        const clip = tr.clips[idx];
        let start = 0;
        if (ti === 0) for (let i = 0; i < idx; i++) start += tr.clips[i].clipDuration;
        else start = clip.atSeconds ?? 0;
        const off = atSeconds - start;
        if (!(off > 0.05) || off >= clip.clipDuration - 0.05) return t;
        const left = { ...clip, clipDuration: off };
        const right: Clip = { ...clip, id: clipId(), inPoint: clip.inPoint + off * (clip.speed ?? 1), clipDuration: clip.clipDuration - off, animations: shiftAnimations(clip.animations, off) };
        if (clip.atSeconds !== undefined) right.atSeconds = clip.atSeconds + off;
        const clips = [...tr.clips];
        clips.splice(idx, 1, left, right);
        return { ...t, videoTracks: t.videoTracks.map((x, i) => (i === ti ? { ...x, clips } : x)) };
      }
      for (let ti = 0; ti < t.audioTracks.length; ti++) {
        const tr = t.audioTracks[ti];
        const idx = tr.clips.findIndex((c) => c.id === id);
        if (idx === -1) continue;
        const clip = tr.clips[idx];
        const off = atSeconds - clip.atSeconds;
        if (!(off > 0.05) || off >= clip.duration - 0.05) return t;
        const left = { ...clip, duration: off };
        const right = { ...clip, id: clipId(), inPoint: clip.inPoint + off * (clip.speed ?? 1), duration: clip.duration - off, atSeconds: clip.atSeconds + off, animations: shiftAnimations(clip.animations, off) };
        const clips = [...tr.clips];
        clips.splice(idx, 1, left, right);
        return { ...t, audioTracks: t.audioTracks.map((x, i) => (i === ti ? { ...x, clips } : x)) };
      }
      return t;
    }),
  reorderClips: (order: string[]) =>
    mutate((t) => {
      const tr0 = t.videoTracks[0];
      const map = new Map(tr0.clips.map((c) => [c.id, c]));
      const next = order.map((id) => map.get(id)).filter((c): c is Clip => Boolean(c));
      const main = { ...tr0, clips: [...next, ...tr0.clips.filter((c) => !order.includes(c.id))] };
      return { ...t, videoTracks: [main, ...t.videoTracks.slice(1)] };
    }),
  addOverlay: () =>
    mutate((t) => ({
      ...t,
      overlays: [
        ...t.overlays,
        { text: '新字幕', startSeconds: 0, endSeconds: 3, position: 'bottom', fontSize: 48, color: '#ffffff' },
      ],
    })),
  removeOverlay: (index: number) =>
    mutate((t) => ({ ...t, overlays: t.overlays.filter((_, i) => i !== index) })),
  updateOverlay: (index: number, patch: Partial<Overlay>) =>
    mutate((t) => ({ ...t, overlays: t.overlays.map((o, i) => (i === index ? { ...o, ...patch } : o)) })),
});

// ---------- 小组件 ----------
const NumberField: React.FC<{
  label: string;
  value: number;
  step?: number;
  min?: number;
  onCommit: (v: number) => void;
}> = ({ label, value, step = 0.5, min = 0, onCommit }) => (
  <label className="djp-field">
    <span>{label}</span>
    <input
      type="number"
      defaultValue={value}
      key={value}
      step={step}
      min={min}
      onBlur={(e) => {
        const v = Number(e.target.value);
        if (Number.isFinite(v) && v >= min && v !== value) onCommit(v);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
    />
  </label>
);

// 滤镜预设（v3）：选即应用，选「无滤镜」清空
const FILTER_PRESETS: { label: string; filter: Exclude<Clip['filter'], undefined> }[] = [
  { label: '提亮', filter: { brightness: 1.15 } },
  { label: '黑白', filter: { grayscale: 1 } },
  { label: '复古', filter: { sepia: 0.6 } },
  { label: '暖调', filter: { sepia: 0.3, saturate: 1.2 } },
  { label: '冷调', filter: { hueRotate: 200, saturate: 1.1 } },
  { label: '高饱和', filter: { saturate: 1.6 } },
  { label: '高对比', filter: { contrast: 1.3 } },
  { label: '柔焦', filter: { blur: 4 } },
];

// 动画预设下拉：展开成关键帧落库（存储层不存预设名）；「无动画」清空 animations
// duration/anims 由调用方给：视频 clip 与字幕 overlay 共用
const ANIM_GROUPS = ['入场', '出场', '组合', '循环'] as const;
const AnimSelect: React.FC<{
  duration: number;
  anims?: Clip['animations'];
  onCommit: (anims: Clip['animations']) => void;
}> = ({ duration, anims, onCommit }) => (
  <select
    className="djp-select"
    value=""
    title={anims ? '动画（已生效，可换或清除）' : '动画'}
    onChange={(e) => {
      const key = e.target.value;
      if (key === '__clear') {
        onCommit({});
        return;
      }
      const expanded = expandAnimationPreset(key, duration ?? 1);
      if (expanded) onCommit(expanded);
      e.target.value = '';
    }}
  >
    <option value="">动画预设</option>
    {anims && Object.keys(anims).length > 0 && <option value="__clear">清除动画</option>}
    {ANIM_GROUPS.map((g) => (
      <optgroup key={g} label={g}>
        {Object.entries(ANIMATION_PRESETS)
          .filter(([, p]) => p.group === g)
          .map(([key, p]) => (
            <option key={key} value={key}>{p.label}</option>
          ))}
      </optgroup>
    ))}
  </select>
);

// 滤镜下拉：值用 JSON 序列化对齐预设，空值 = 无滤镜
const FilterSelect: React.FC<{ value: Clip['filter']; onCommit: (f: Clip['filter']) => void }> = ({ value, onCommit }) => (
  <select
    className="djp-select"
    value={value ? JSON.stringify(value) : ''}
    onChange={(e) => {
      const v = e.target.value;
      if (!v) {
        onCommit(undefined);
        return;
      }
      const p = FILTER_PRESETS.find((x) => JSON.stringify(x.filter) === v);
      if (p) onCommit(p.filter);
    }}
    title="滤镜"
  >
    <option value="">无滤镜</option>
    {FILTER_PRESETS.map((p) => (
      <option key={p.label} value={JSON.stringify(p.filter)}>{p.label}</option>
    ))}
  </select>
);

// ---------- 主面板 ----------
export const Panel: React.FC<{ sessionId?: string }> = ({ sessionId }) => (
  <EditorPanel key={sessionId ?? "default"} sessionId={sessionId} />
);

const EditorPanel: React.FC<{ sessionId?: string }> = ({ sessionId }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const { timeline, mutate, reload, saveState, syncError, retrySave } = useTimelineSync(sessionId, rootRef);
  const hist = useHistory(timeline, mutate);
  const prevSession = useRef(sessionId);
  useEffect(() => {
    // 会话切换（= 换项目）：历史栈按新项目清空重来
    if (sessionId !== prevSession.current) {
      prevSession.current = sessionId;
      hist.clear();
      void reload();
    }
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps
  const o = ops(hist.commit);
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const toggleItem = (id: string) => setSelected((current) => current === id ? null : id);
  const [tab, setTab] = useState<'assets' | 'clips' | 'pip' | 'audio' | 'subs'>('clips');
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [trackMode, setTrackMode] = useState<TrackMode>('main');
  const switchTrackMode = (mode: TrackMode) => {
    setTrackMode(mode);
    setTab(mode === 'main' ? 'clips' : mode);
    setSelected(null);
    setLibraryOpen(false);
  };
  const [uploadError, setUploadError] = useState('');
  const [fonts, setFonts] = useState<DjianFontInfo[]>([]);
  const audioFileRef = useRef<HTMLInputElement>(null);
  const playheadRef = useRef(0);

  // 内置字体列表（字幕下拉用；引擎没起就空列表，走系统字体）
  useEffect(() => {
    let stop = false;
    listFonts()
      .then((f) => {
        if (!stop) setFonts(f);
      })
      .catch(() => {});
    return () => {
      stop = true;
    };
  }, []);

  // 快捷键只作用于当前面板；方向键逐帧，Shift 跳转一秒。
  const splitRef = useRef<() => void>(() => {});
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el || !rootRef.current?.contains(el) || canvasOpen || histOpen) return;
      if (el.closest('button, a, [role="dialog"]')) return;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === 'z' && !e.shiftKey) { e.preventDefault(); hist.undo(); }
        else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); hist.redo(); }
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        playerBus.ref?.toggle();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        splitRef.current();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const dir = e.key === 'ArrowLeft' ? -1 : 1;
        seekToSeconds(Math.max(0, playheadRef.current + dir * (e.shiftKey ? 1 : 1 / (timeline?.meta.fps ?? 30))), timeline?.meta.fps ?? 30);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hist.undo, hist.redo, timeline?.meta.fps, canvasOpen, histOpen]);

  if (!timeline) {
    return <div className="djp-root" ref={rootRef}><div className="djp-empty" role="status">{syncError || '正在连接剪辑引擎…'}{syncError && <p><button className="djp-btn" onClick={() => void reload()}>重新连接</button></p>}</div></div>;
  }
  const t = timeline;
  const durationInFrames = Math.max(1, timelineDurationInFrames(t));
  const totalSec = durationInFrames / t.meta.fps;
  const mainClips = t.videoTracks[0]?.clips ?? [];
  const pipClips = t.videoTracks.slice(1).flatMap((tr) => tr.clips);
  const audioClips = t.audioTracks.flatMap((tr) => tr.clips);
  const hasContent = mainClips.length + pipClips.length + audioClips.length + t.overlays.length > 0;
  const BOX_PRESETS: Array<{ label: string; box: { x: number; y: number; w: number; h: number } }> = [
    { label: '右下', box: { x: 0.66, y: 0.66, w: 0.3, h: 0.3 } },
    { label: '左下', box: { x: 0.03, y: 0.66, w: 0.3, h: 0.3 } },
    { label: '右上', box: { x: 0.66, y: 0.04, w: 0.3, h: 0.3 } },
    { label: '左上', box: { x: 0.03, y: 0.04, w: 0.3, h: 0.3 } },
    { label: '居中', box: { x: 0.35, y: 0.35, w: 0.3, h: 0.3 } },
    { label: '全屏', box: { x: 0, y: 0, w: 1, h: 1 } },
  ];

  // 主轨上被播放头穿过的 clip → 在播放头处分割
  const splitMainAtPlayhead = () => {
    const at = Math.round(playheadRef.current * 100) / 100;
    for (const tr0 of [t.videoTracks[0]]) {
      if (!tr0) return;
      let acc = 0;
      for (const c of tr0.clips) {
        if (at > acc + 0.05 && at < acc + c.clipDuration - 0.05) {
          o.splitClip(c.id, at);
          return;
        }
        acc += c.clipDuration;
      }
    }
  };
  splitRef.current = () => { if (trackMode === 'main') splitMainAtPlayhead(); };

  // 预览用时间线：素材地址转绝对 URL（不动事实源，导出仍发原始相对路径）
  const previewTimeline: Timeline = {
    ...t,
    videoTracks: t.videoTracks.map((tr) => ({
      ...tr,
      clips: tr.clips.map((c) => ({ ...c, src: assetUrl(c.src) })),
    })),
    audioTracks: t.audioTracks.map((tr) => ({
      ...tr,
      clips: tr.clips.map((c) => ({ ...c, src: assetUrl(c.src) })),
    })),
  };

  // 素材库动作：视频/图片加主轨，长按/二次点击进画中画；音频进音频轨
  const addAssetClip = (a: AssetInfo) =>
    hist.commit((cur) => ({
      ...cur,
      videoTracks: cur.videoTracks.map((tr, i) =>
        i === 0
          ? {
              ...tr,
              clips: [
                ...tr.clips,
                {
                  id: clipId(),
                  type: a.type === 'image' ? ('image' as const) : ('video' as const),
                  src: a.name,
                  inPoint: 0,
                  clipDuration: a.type === 'image' ? 3 : a.duration ?? 3,
                  transition: 'none' as const,
                  volume: 1, speed: 1,
                },
              ],
            }
          : tr,
      ),
    }));
  const setBgm = (name: string) =>
    hist.commit((cur) => {
      const clip = { id: clipId(), src: name, inPoint: 0, duration: 10, volume: 1, speed: 1, atSeconds: 0 };
      if (cur.audioTracks[0]) {
        return {
          ...cur,
          audioTracks: cur.audioTracks.map((tr, i) =>
            i === 0 ? { ...tr, clips: [...tr.clips, clip] } : tr,
          ),
        };
      }
      return { ...cur, audioTracks: [{ id: 'a1', name: '配乐', volume: 1, muted: false, clips: [clip] }] };
    });

  const onDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('text/clip-index')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };
  const onDrop = (e: React.DragEvent) => {
    const from = Number(e.dataTransfer.getData('text/clip-index'));
    if (!Number.isInteger(from)) return;
    e.preventDefault();
    const target = (e.target as HTMLElement).closest('.djp-item');
    const to = target ? Number((target as HTMLElement).dataset.index) : (t.videoTracks[0]?.clips.length ?? 1) - 1;
    if (!Number.isInteger(to) || from === to) return;
    const order = (t.videoTracks[0]?.clips ?? []).map((c) => c.id);
    const [moved] = order.splice(from, 1);
    order.splice(to, 0, moved);
    o.reorderClips(order);
  };

  return (
    <div className="djp-root" ref={rootRef} tabIndex={0} aria-label="视频剪辑工作台">
      <div className="djp-head">
        <ProjectBar sessionId={sessionId} meta={t.meta} />
        <MoreTools>
          <button className="djp-btn" disabled={saveState !== 'saved'} onClick={() => setHistOpen(true)}>版本历史</button>
          <button className="djp-btn" onClick={() => setLibraryOpen(true)}>片段列表</button>
        </MoreTools>
        <button className="djp-resolution" title="画布设置" onClick={() => setCanvasOpen(true)}>{Math.min(t.meta.width, t.meta.height)}P <span>⌄</span></button>
        <ExportControl t={t} />
      </div>
      <div className="djp-save-status" role="status" aria-live="polite">
        <span>{saveState === 'saving' ? '正在保存…' : saveState === 'pending' ? '有待保存的修改' : saveState === 'error' ? '保存失败，修改已保留' : '已保存'}</span>
        {saveState === 'error' && <button className="djp-btn" onClick={() => void retrySave()}>重试保存</button>}
      </div>
      {syncError && <div className="djp-notice" role="alert">{syncError}</div>}

      {!hasContent ? (
        <div className="djp-empty">从下方「素材」添加画面，开始剪辑</div>
      ) : (
        <div className="djp-stage">
          <Player
            key={`${t.meta.fps}-${t.meta.width}-${t.meta.height}`}
            ref={(r: PlayerRef | null) => {
              playerBus.ref = r;
            }}
            component={PreviewVideo}
            inputProps={{ timeline: previewTimeline }}
            durationInFrames={durationInFrames}
            fps={t.meta.fps}
            compositionWidth={t.meta.width}
            compositionHeight={t.meta.height}
            controls={false}
            acknowledgeRemotionLicense
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      )}

      <TransportBar fps={t.meta.fps} duration={totalSec} undo={hist.undo} redo={hist.redo} canUndo={hist.canUndo} canRedo={hist.canRedo} />

      <div className="djp-collection" hidden={!libraryOpen} role="region" aria-label="编辑工具" onKeyDown={(e) => {
        if (e.key === 'Escape') { e.stopPropagation(); setLibraryOpen(false); rootRef.current?.querySelector<HTMLElement>('.djp-tool-active')?.focus(); }
      }}>
      <div className="djp-collection-head"><strong>{{ assets: '素材库', clips: '剪辑', pip: '画中画', audio: '音频', subs: '文本' }[tab]}</strong><button className="djp-iconbtn" aria-label="收起编辑工具" onClick={() => setLibraryOpen(false)}><Icon name="close" /></button></div>
      <div className="djp-tabwrap">
        {tab === 'assets' && <AssetsSection onAddClip={addAssetClip} onSetBgm={setBgm} />}

        {tab === 'clips' && (
      <div className="djp-section">
        <div className="djp-section-head">
          <span>片段（主轨道）</span>
          <span style={{ display: 'flex', gap: 6 }}>
            <button className="djp-btn" title="在播放头处分割主轨片段" onClick={splitMainAtPlayhead}><Icon name="split" />分割</button>
            <button className="djp-btn" title="加画中画叠加轨" onClick={o.addPip}>画中画</button>
            <button className="djp-add" title="添加片段" onClick={o.addClip}><Icon name="plus" /></button>
          </span>
        </div>
        {mainClips.length === 0 && <div className="djp-hint">主轨道空</div>}
        <div onDragOver={onDragOver} onDrop={onDrop} className="djp-item-list">
          {mainClips.map((c, i) => (
            <InspectorRow
              title={c.src} summary={fmtSec(c.clipDuration) + ((c.speed ?? 1) !== 1 ? ' · ' + c.speed + '×' : '')}
              index={i} key={c.id} open={selected === c.id} onToggle={() => toggleItem(c.id)}
              onDragStart={(e) => { e.dataTransfer.setData('text/clip-index', String(i)); e.dataTransfer.effectAllowed = 'move'; }}
            >
              <div className="djp-inspector-head"><span>片段设置</span>
                <select
                  className="djp-select"
                  value={c.transition}
                  onChange={(e) => o.updateClip(c.id, { transition: e.target.value as Clip['transition'] })}
                >
                  <option value="none">无转场</option>
                  <option value="fade">淡入</option>
                </select>
                <button className="djp-del" title="删除片段" onClick={() => o.removeClip(c.id)}><Icon name="close" /></button>
              </div>
              <div className="djp-fields">
                <NumberField label="起点" value={c.inPoint} onCommit={(v) => o.updateClip(c.id, { inPoint: v })} />
                <NumberField
                  label="时长"
                  value={c.clipDuration}
                  min={0.1}
                  onCommit={(v) => o.updateClip(c.id, { clipDuration: v })}
                />
                <NumberField
                  label="音量"
                  value={c.volume}
                  step={0.1}
                  onCommit={(v) => o.updateClip(c.id, { volume: Math.min(1, v) })}
                />
                <NumberField
                  label="速度"
                  value={c.speed ?? 1}
                  step={0.25}
                  min={0.1}
                  onCommit={(v) => o.updateClip(c.id, { speed: Math.min(10, Math.max(0.1, v)) })}
                />
              </div>
              <AdvancedSettings>
                <FilterSelect value={c.filter} onCommit={(f) => o.updateClip(c.id, { filter: f })} />
                <AnimSelect duration={c.clipDuration} anims={c.animations} onCommit={(anims) => o.updateClip(c.id, { animations: anims })} />
              </AdvancedSettings>
            </InspectorRow>
          ))}
        </div>
      </div>
        )}

        {tab === 'pip' && (
      <div className="djp-section">
        <div className="djp-section-head">
          <span>画中画</span>
          <button className="djp-add" title="添加画中画" onClick={o.addPip}><Icon name="plus" /></button>
        </div>
        {pipClips.length === 0 && <div className="djp-hint">无叠加片段——「片段」区点「画中画」或让 AI 加</div>}
        {pipClips.map((c) => (
          <InspectorRow key={c.id} title={c.src} summary={fmtSec(c.clipDuration)} open={selected === c.id} onToggle={() => toggleItem(c.id)}>
            <div className="djp-fields">
            <select
              className="djp-select"
              value={c.box ? JSON.stringify(c.box) : ''}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) {
                  o.updateClip(c.id, { box: undefined });
                  return;
                }
                const p = BOX_PRESETS.find((x) => JSON.stringify(x.box) === v);
                if (p) o.updateClip(c.id, { box: p.box });
              }}
            >
              <option value="">默认（右下 30%）</option>
              {BOX_PRESETS.map((p) => (
                <option key={p.label} value={JSON.stringify(p.box)}>{p.label}</option>
              ))}
            </select>
            <NumberField label="从" value={c.atSeconds ?? 0} onCommit={(v) => o.updateClip(c.id, { atSeconds: Math.max(0, v) })} />
            <NumberField label="时长" value={c.clipDuration} min={0.1} onCommit={(v) => o.updateClip(c.id, { clipDuration: v })} />
            <NumberField label="速度" value={c.speed ?? 1} step={0.25} min={0.1} onCommit={(v) => o.updateClip(c.id, { speed: Math.min(10, Math.max(0.1, v)) })} />

            <button className="djp-btn" title="在播放头处分割" onClick={() => o.splitClip(c.id, Math.round(playheadRef.current * 100) / 100)}><Icon name="split" /></button>
            <button className="djp-del" title="删除画中画" onClick={() => o.removeClip(c.id)}><Icon name="close" /></button>
            </div>
            <AdvancedSettings>
              <FilterSelect value={c.filter} onCommit={(f) => o.updateClip(c.id, { filter: f })} />
              <AnimSelect duration={c.clipDuration} anims={c.animations} onCommit={(anims) => o.updateClip(c.id, { animations: anims })} />
            </AdvancedSettings>
          </InspectorRow>
        ))}
      </div>
        )}

        {tab === 'audio' && (
      <div className="djp-section">
        <div className="djp-section-head">
          <span>音频</span>
          <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              ref={audioFileRef}
              type="file"
              accept="audio/*,video/*"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  const up = await uploadAsset(f);
                  o.addAudio(up.name, up.duration ?? 10);
                  setUploadError('');
                } catch (error) {
                  setUploadError(error instanceof Error ? error.message : '上传失败，请重试');
                }
                if (audioFileRef.current) audioFileRef.current.value = '';
              }}
            />
            <button className="djp-btn" title="上传音频并加入音频轨" onClick={() => audioFileRef.current?.click()}>上传</button>
          </span>
        </div>
        {uploadError && <div className="djp-notice" role="alert">{uploadError}</div>}
        {t.audioTracks.length === 0 && <div className="djp-hint">无音频轨——素材库「♪配乐」、上方「上传」或让 AI 加</div>}
        {t.audioTracks.map((tr) => (
          <div className="djp-audio-group" key={tr.id}>
            <div className="djp-card-head">
              <span className="djp-card-title">♪ {tr.name ?? '音频'}</span>
              <button
                className={`djp-btn ${tr.muted ? 'djp-error' : ''}`}
                title={tr.muted ? '取消静音' : '静音'}
                onClick={() => o.updateAudioTrack(tr.id, { muted: !tr.muted })}
              >
                <Icon name={tr.muted ? "muted" : "volume"} />
              </button>
              <details className="djp-track-settings"><summary>轨道音量</summary><label className="djp-field">
                <span>轨音量</span>
                <input
                  type="range" min={0} max={1} step={0.05}
                  value={tr.volume}
                  onChange={(e) => o.updateAudioTrack(tr.id, { volume: Number(e.target.value) })}
                  style={{ width: 70 }}
                />
              </label></details>
            </div>
            {tr.clips.map((c) => (
<InspectorRow key={c.id} title={c.src} summary={fmtSec(c.duration)} open={selected === c.id} onToggle={() => toggleItem(c.id)}><div className="djp-fields">
                <NumberField label="从" value={c.atSeconds} onCommit={(v) => o.updateAudioClip(c.id, { atSeconds: Math.max(0, v) })} />
                <NumberField label="时长" value={c.duration} min={0.1} onCommit={(v) => o.updateAudioClip(c.id, { duration: v })} />
                <NumberField label="音量" value={c.volume} step={0.1} onCommit={(v) => o.updateAudioClip(c.id, { volume: Math.min(1, Math.max(0, v)) })} />
                <NumberField label="速度" value={c.speed ?? 1} step={0.25} min={0.1} onCommit={(v) => o.updateAudioClip(c.id, { speed: Math.min(10, Math.max(0.1, v)) })} />
                <button className="djp-btn" title="在播放头处分割" onClick={() => o.splitClip(c.id, Math.round(playheadRef.current * 100) / 100)}><Icon name="split" /></button>
                <button className="djp-del" title="删除音频片段" onClick={() => o.removeAudioClip(c.id)}><Icon name="close" /></button>
              </div></InspectorRow>
            ))}
          </div>
        ))}
      </div>
        )}

        {tab === 'subs' && (
      <div className="djp-section">
        <div className="djp-section-head">
          <span>字幕</span>
          <button className="djp-add" title="添加字幕" onClick={o.addOverlay}><Icon name="plus" /></button>
        </div>
        {t.overlays.length === 0 && <div className="djp-hint">无字幕——「+」加一条，或让 AI 配字幕</div>}
        {t.overlays.map((ov, i) => (
          <InspectorRow key={i} index={i} title={ov.text || '未填写字幕'} summary={fmtSec(ov.startSeconds) + '–' + fmtSec(ov.endSeconds)} open={selected === 'sub-' + i} onToggle={() => toggleItem('sub-' + i)}>
            <div className="djp-card-head">
              <input
                className="djp-sub-text"
                type="text"
                defaultValue={ov.text}
                key={ov.text + i}
                onBlur={(e) => {
                  if (e.target.value !== ov.text) o.updateOverlay(i, { text: e.target.value });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                }}
              />
              <button className="djp-del" title="删除字幕" onClick={() => o.removeOverlay(i)}><Icon name="close" /></button>
            </div>
            <div className="djp-fields">
              <NumberField label="从" value={ov.startSeconds} onCommit={(v) => o.updateOverlay(i, { startSeconds: v })} />
              <NumberField label="到" value={ov.endSeconds} min={0.1} onCommit={(v) => o.updateOverlay(i, { endSeconds: v })} />
            </div><AdvancedSettings label="文字样式与动画">
              <NumberField label="字号" value={ov.fontSize} min={8} onCommit={(v) => o.updateOverlay(i, { fontSize: v })} />
              <select
                className="djp-select"
                value={ov.position}
                onChange={(e) => o.updateOverlay(i, { position: e.target.value as Overlay['position'] })}
                title="位置"
              >
                <option value="top">顶部</option>
                <option value="center">居中</option>
                <option value="bottom">底部</option>
              </select>
              <select
                className="djp-select djp-fontsel"
                value={ov.fontFamily ?? ''}
                onChange={(e) => o.updateOverlay(i, { fontFamily: e.target.value || undefined })}
                title="字体（清除 = 系统默认）"
              >
                <option value="">系统字体</option>
                {fonts.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
              {(fonts.find((f) => f.id === (ov.fontFamily ?? ''))?.variable) && (
                <select
                  className="djp-select"
                  value={ov.fontWeight ?? 400}
                  onChange={(e) => o.updateOverlay(i, { fontWeight: Number(e.target.value) })}
                  title="字重"
                >
                  {[300, 400, 500, 700, 900].map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              )}
              <label className="djp-color" title="颜色">
                <input
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(ov.color) ? ov.color : '#ffffff'}
                  onChange={(e) => o.updateOverlay(i, { color: e.target.value })}
                />
              </label>
              <AnimSelect
                duration={Math.max(0.1, ov.endSeconds - ov.startSeconds)}
                anims={ov.animations}
                onCommit={(anims) => o.updateOverlay(i, { animations: anims })}
              />
            </AdvancedSettings>
          </InspectorRow>
        ))}
      </div>
        )}
      </div>

      </div>

      <div className="djp-tdock">
        <TrackStrip
          t={t}
          o={o}
          playheadRef={playheadRef}
          mode={trackMode}
          onModeChange={switchTrackMode}
          onAudio={() => { setTrackMode('audio'); setTab('audio'); setLibraryOpen(true); }}
          onAdd={() => { setTab(trackMode === 'main' ? 'assets' : trackMode); setLibraryOpen(true); }}
          onSeekClip={(start, lane, id) => {
            if (id) setSelected(id);
            setLibraryOpen(false);
            if (lane) setTrackMode(lane);
            seekToSeconds(start, t.meta.fps);
            if (lane === 'main') setTab('clips');
            else if (lane === 'pip') setTab('pip');
            else if (lane === 'audio') setTab('audio');
            else if (lane === 'subs') setTab('subs');
          }}
        />
      </div>
      <nav className="djp-tool-dock" aria-label="编辑工具栏">
        {([
          ['clips', '剪辑', 'scissors'], ['audio', '音频', 'music'], ['subs', '文本', 'text'],
          ['pip', '画中画', 'layers'], ['assets', '素材', 'library'],
        ] as const).map(([key, label, icon]) => {
          const mode = key === 'clips' ? 'main' : key;
          const active = key === 'assets' ? tab === key && libraryOpen : trackMode === mode;
          return <button key={key} className={active ? 'djp-tool-active' : ''} aria-pressed={active} aria-expanded={tab === key && libraryOpen}
            title={key === 'assets' ? '打开素材库' : `${label}模式 · 再次点击打开工具`}
            onClick={() => {
              if (mode !== 'assets' && trackMode !== mode) switchTrackMode(mode);
              else { setTab(key); setLibraryOpen(tab === key ? !libraryOpen : true); }
            }}><Icon name={icon} /><span>{label}</span></button>;
        })}
      </nav>

      {canvasOpen && (
        <CanvasDialog
          t={t}
          onApply={(meta) => hist.commit((cur) => ({ ...cur, meta: { ...cur.meta, ...meta } }))}
          onClose={() => setCanvasOpen(false)}
        />
      )}

      {histOpen && (
        <HistoryDialog
          onClose={() => setHistOpen(false)}
          onRestored={() => {
            hist.clear();
            void reload();
          }}
        />
      )}
    </div>
  );
};
