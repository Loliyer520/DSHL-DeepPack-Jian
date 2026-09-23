import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Player } from '@remotion/player';
import {
  timelineDurationInFrames,
  type AudioClip,
  type Clip,
  type Overlay,
  type Timeline,
} from '../../../engine/src/schema';
import { ANIMATION_PRESETS, expandAnimationPreset } from '../../../engine/src/presets';
import { PreviewVideo } from './PreviewVideo';
import { playerBus, seekToSeconds } from './bus';
import { assetUrl, getTimeline, putTimeline, uploadAsset, type AssetInfo } from './api';
import { useHistory } from './useHistory';
import { ProjectBar } from './ProjectBar';
import { CanvasDialog } from './CanvasDialog';
import { AssetsSection } from './AssetsSection';
import { ExportControl } from './ExportControl';
import { HistoryDialog } from './HistoryDialog';

const fmtSec = (s: number) => `${s.toFixed(1)}s`;

// ---------- 时间线同步：2s 轮询服务端（干净时），本地编辑防抖 600ms 写回 ----------
function useTimelineSync() {
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const serverJson = useRef('');
  const dirty = useRef(false);
  const pushTimer = useRef<number | null>(null);
  const pendingPush = useRef<Timeline | null>(null);

  useEffect(() => {
    let stop = false;
    let timer = 0;
    const tick = async () => {
      if (!dirty.current) {
        try {
          const t = await getTimeline<Timeline>();
          const j = JSON.stringify(t);
          if (!stop && j !== serverJson.current) {
            serverJson.current = j;
            setTimeline(t);
          }
        } catch {
          // 服务没起来就静默等下一轮
        }
      }
      if (!stop) timer = window.setTimeout(tick, 2000);
    };
    void tick();
    return () => {
      stop = true;
      window.clearTimeout(timer);
    };
  }, []);

  const mutate = useCallback((fn: (t: Timeline) => Timeline) => {
    setTimeline((cur) => {
      if (!cur) return cur;
      const next = fn(cur);
      dirty.current = true;
      pendingPush.current = next;
      if (pushTimer.current) window.clearTimeout(pushTimer.current);
      pushTimer.current = window.setTimeout(() => {
        const t = pendingPush.current;
        if (!t) return;
        putTimeline(t)
          .then(() => {
            serverJson.current = JSON.stringify(t);
          })
          .catch(() => {
            // 写失败：标记回干净，让下一轮轮询拉回服务端版本
          })
          .finally(() => {
            dirty.current = false;
          });
      }, 600);
      return next;
    });
  }, []);

  // 项目切换后强制重拉（绕过 dirty 与缓存比较）
  const reload = useCallback(async () => {
    try {
      const t = await getTimeline<Timeline>();
      serverJson.current = JSON.stringify(t);
      dirty.current = false;
      setTimeline(t);
    } catch {
      // 静默
    }
  }, []);

  return { timeline, mutate, reload };
}

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
                  volume: 1,
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
        volume: 1,
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
      const clip = { id: clipId(), src, inPoint: 0, duration, volume: 1, atSeconds: 0 };
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
  updateAudioClip: (id: string, patch: Partial<{ atSeconds: number; duration: number; volume: number; inPoint: number }>) =>
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
        const right: Clip = { ...clip, id: clipId(), inPoint: clip.inPoint + off, clipDuration: clip.clipDuration - off };
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
        const right = { ...clip, id: clipId(), inPoint: clip.inPoint + off, duration: clip.duration - off, atSeconds: clip.atSeconds + off };
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
const ANIM_GROUPS = ['入场', '出场', '组合', '循环'] as const;
const AnimSelect: React.FC<{ clip: Clip; onCommit: (anims: Clip['animations']) => void }> = ({ clip, onCommit }) => (
  <select
    className="djp-select"
    value=""
    title={clip.animations ? '动画（已生效，可换或清除）' : '动画'}
    onChange={(e) => {
      const key = e.target.value;
      if (key === '__clear') {
        onCommit({});
        return;
      }
      const anims = expandAnimationPreset(key, clip.clipDuration ?? 1);
      if (anims) onCommit(anims);
      e.target.value = '';
    }}
  >
    <option value="">✨ 动画…</option>
    {clip.animations && Object.keys(clip.animations).length > 0 && <option value="__clear">✕ 清除动画</option>}
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

// 播放头 DOM 注册表：rAF 统一直改样式，不进 React 状态
const playheadEls = new Set<HTMLDivElement>();
const Playhead: React.FC = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    playheadEls.add(el);
    return () => {
      playheadEls.delete(el);
    };
  }, []);
  return <div ref={ref} className="djp-playhead" style={{ left: '0%' }} />;
};

// 秒标尺刻度：按总时长自适应步长
const rulerTicks = (total: number): number[] => {
  const step = total > 30 ? 5 : total > 12 ? 2 : 1;
  const out: number[] = [];
  for (let s = 0; s <= total; s += step) out.push(Math.round(s * 100) / 100);
  return out;
};

// 多轨轨道条（交互版）：主轨块裁剪拖柄；叠加/音频块拖拽移动 + 裁剪；吸附到 0/播放头/同轨邻块边缘
// 拖拽过程只改本地预览，松手才 commit（一次进历史栈，不刷屏）
interface DragState {
  kind: 'move' | 'trimL' | 'trimR';
  lane: 'main' | 'pip' | 'audio';
  id: string;
  startX: number;
  secPerPx: number;
  origAt: number;
  origDur: number;
  origIn?: number;
  previewAt: number;
  previewDur: number;
}

const TrackStrip: React.FC<{
  t: Timeline;
  o: ReturnType<typeof ops>;
  playheadRef: React.MutableRefObject<number>;
  onSeekClip: (start: number, lane?: 'main' | 'pip' | 'audio') => void;
}> = ({ t, o, playheadRef, onSeekClip }) => {
  const total = Math.max(0.1, timelineDurationInFrames(t) / t.meta.fps);
  const dragRef = useRef<DragState | null>(null);
  const justDragged = useRef(false);
  const [, forceRender] = useState(0);
  const ctxRef = useRef({ t, o, total });
  ctxRef.current = { t, o, total };

  // 播放头走 rAF 直改 DOM（注册表），不再进 React 状态——60fps 不重渲染轨道树
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = playerBus.ref;
      if (p) {
        const sec = p.getCurrentFrame() / ctxRef.current.t.meta.fps;
        playheadRef.current = sec;
        const tt = ctxRef.current.total;
        const left = `${(Math.min(sec, tt) / tt) * 100}%`;
        for (const el of playheadEls) el.style.left = left;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playheadRef]);

  // 拖拽生命周期：监听器只挂一次，闭包经 ctxRef 拿最新 t/o
  useEffect(() => {
    const snapV = (cur: DragState, v: number): number => {
      const SNAP = 0.12;
      const tt = ctxRef.current.t;
      const pts: number[] = [0, playheadRef.current];
      if (cur.lane === 'main') {
        let a = 0;
        for (const c of tt.videoTracks[0]?.clips ?? []) {
          if (c.id !== cur.id) pts.push(a, a + c.clipDuration);
          a += c.clipDuration;
        }
      } else if (cur.lane === 'pip') {
        for (const tr of tt.videoTracks.slice(1))
          for (const c of tr.clips) {
            if (c.id !== cur.id) pts.push(c.atSeconds ?? 0, (c.atSeconds ?? 0) + c.clipDuration);
          }
      } else {
        for (const tr of tt.audioTracks)
          for (const c of tr.clips) {
            if (c.id !== cur.id) pts.push(c.atSeconds, c.atSeconds + c.duration);
          }
      }
      let best = v;
      let bd = SNAP;
      for (const p of pts) {
        const dd = Math.abs(p - v);
        if (dd < bd) {
          bd = dd;
          best = p;
        }
      }
      return Math.round(best * 100) / 100;
    };

    const onMove = (e: PointerEvent) => {
      const cur = dragRef.current;
      if (!cur) return;
      const dsec = (e.clientX - cur.startX) * cur.secPerPx;
      if (cur.kind === 'move') {
        cur.previewAt = Math.max(0, snapV(cur, cur.origAt + dsec));
      } else if (cur.kind === 'trimL') {
        let at = snapV(cur, cur.origAt + dsec);
        at = Math.min(Math.max(0, at), cur.origAt + cur.origDur - 0.1);
        cur.previewAt = at;
        cur.previewDur = cur.origDur - (at - cur.origAt);
      } else {
        const end = Math.max(cur.origAt + 0.1, snapV(cur, cur.origAt + cur.origDur + dsec));
        cur.previewDur = end - cur.origAt;
      }
      forceRender((x) => x + 1);
    };

    const onUp = () => {
      const cur = dragRef.current;
      dragRef.current = null;
      if (cur) {
        const moved = Math.abs(cur.previewAt - cur.origAt) > 0.001 || Math.abs(cur.previewDur - cur.origDur) > 0.001;
        if (moved) {
          justDragged.current = true;
          window.setTimeout(() => {
            justDragged.current = false;
          }, 0);
        }
        const { o: oo } = ctxRef.current;
        const at = cur.previewAt;
        const dur = Math.max(0.1, cur.previewDur);
        if (cur.kind === 'move') {
          if (cur.lane === 'pip') oo.updateClip(cur.id, { atSeconds: at });
          else oo.updateAudioClip(cur.id, { atSeconds: at });
        } else if (cur.lane === 'main') {
          const patch: Partial<Clip> = { clipDuration: dur };
          if (cur.kind === 'trimL' && cur.origIn !== undefined) patch.inPoint = Math.max(0, cur.origIn + (at - cur.origAt));
          oo.updateClip(cur.id, patch);
        } else if (cur.lane === 'pip') {
          const patch: Partial<Clip> = { clipDuration: dur };
          if (cur.kind === 'trimL') {
            patch.atSeconds = at;
            if (cur.origIn !== undefined) patch.inPoint = Math.max(0, cur.origIn + (at - cur.origAt));
          }
          oo.updateClip(cur.id, patch);
        } else {
          const patch: Partial<AudioClip> = { duration: dur };
          if (cur.kind === 'trimL') {
            patch.atSeconds = at;
            if (cur.origIn !== undefined) patch.inPoint = Math.max(0, cur.origIn + (at - cur.origAt));
          }
          oo.updateAudioClip(cur.id, patch);
        }
      }
      forceRender((x) => x + 1);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [playheadRef]);

  const beginDrag = (
    e: React.PointerEvent,
    init: { kind: DragState['kind']; lane: DragState['lane']; id: string; origAt: number; origDur: number; origIn?: number },
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const laneEl = (e.currentTarget as HTMLElement).closest('.djp-trow-lane') as HTMLElement | null;
    if (!laneEl) return;
    const rect = laneEl.getBoundingClientRect();
    dragRef.current = {
      ...init,
      startX: e.clientX,
      secPerPx: total / Math.max(1, rect.width),
      previewAt: init.origAt,
      previewDur: init.origDur,
    };
    forceRender((x) => x + 1);
  };

  const onSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    seekToSeconds(frac * total, t.meta.fps);
  };

  const drag = dragRef.current;
  const pct = (v: number) => `${(Math.max(0, v) / total) * 100}%`;

  const main = t.videoTracks[0];
  const overlays = t.videoTracks.slice(1);

  const Row: React.FC<{ name: string; children: React.ReactNode }> = ({ name, children }) => (
    <div className="djp-trow" onClick={onSeek}>
      <span className="djp-trow-name">{name}</span>
      <div className="djp-track djp-trow-lane">
        {children}
        <Playhead />
      </div>
    </div>
  );

  // 主轨：串行布局；被裁剪的块用预览时长，后续块跟着移动（串行语义）
  let acc = 0;
  const mainBlocks = (main?.clips ?? []).map((c) => {
    const isD = drag?.lane === 'main' && drag.id === c.id;
    const dur = drag && isD ? Math.max(0.1, drag.previewDur) : c.clipDuration;
    const start = acc;
    acc += dur;
    return { clip: c, start, dur, isD };
  });

  return (
    <div className="djp-tstrip">
      <div className="djp-trow" onClick={onSeek}>
        <span className="djp-trow-name" />
        <div className="djp-ruler">
          {rulerTicks(total).map((s) => (
            <div key={s} className="djp-tick" style={{ left: pct(s) }}>
              <span>{fmtSec(s)}</span>
            </div>
          ))}
          <Playhead />
        </div>
      </div>
      <Row name="视频">
        {mainBlocks.map(({ clip, start, dur, isD }) => (
          <div
            key={clip.id}
            className={`djp-track-block ${clip.transition === 'fade' ? 'djp-fade' : ''} ${isD ? 'djp-dragging' : ''}`}
            style={drag && isD ? { position: 'absolute', left: pct(start), width: pct(dur) } : { width: pct(dur) }}
            title={`${clip.src} · ${fmtSec(start)}–${fmtSec(start + dur)}`}
            onClick={(e) => {
              e.stopPropagation();
              if (justDragged.current) return;
              onSeekClip(start, 'main');
            }}
          >
            <span className="djp-track-label">{clip.src}</span>
            <div
              className="djp-handle djp-hl"
              title="裁剪头部"
              onPointerDown={(e) =>
                beginDrag(e, { kind: 'trimL', lane: 'main', id: clip.id, origAt: start, origDur: clip.clipDuration, origIn: clip.inPoint })
              }
            />
            <div
              className="djp-handle djp-hr"
              title="裁剪尾部"
              onPointerDown={(e) =>
                beginDrag(e, { kind: 'trimR', lane: 'main', id: clip.id, origAt: start, origDur: clip.clipDuration, origIn: clip.inPoint })
              }
            />
          </div>
        ))}
        {(main?.clips.length ?? 0) === 0 && <span className="djp-trow-empty">空</span>}
      </Row>
      {overlays.map((tr) => (
        <Row key={tr.id} name={tr.name ?? '画中画'}>
          {tr.clips.map((c) => {
            const isD = drag?.lane === 'pip' && drag.id === c.id;
            const at = drag && isD ? drag.previewAt : c.atSeconds ?? 0;
            const dur = drag && isD ? drag.previewDur : c.clipDuration;
            return (
              <div
                key={c.id}
                className={`djp-track-block djp-pip-block ${isD ? 'djp-dragging' : ''}`}
                style={{ position: 'absolute', left: pct(at), width: pct(dur) }}
                title={`${c.src} · ${fmtSec(at)}–${fmtSec(at + dur)}`}
                onPointerDown={(e) =>
                  beginDrag(e, { kind: 'move', lane: 'pip', id: c.id, origAt: c.atSeconds ?? 0, origDur: c.clipDuration, origIn: c.inPoint })
                }
                onClick={(e) => {
                  e.stopPropagation();
                  if (justDragged.current) return;
                  onSeekClip(c.atSeconds ?? 0, 'pip');
                }}
              >
                <span className="djp-track-label">{c.src}</span>
                <div
                  className="djp-handle djp-hl"
                  title="裁剪头部"
                  onPointerDown={(e) =>
                    beginDrag(e, { kind: 'trimL', lane: 'pip', id: c.id, origAt: c.atSeconds ?? 0, origDur: c.clipDuration, origIn: c.inPoint })
                  }
                />
                <div
                  className="djp-handle djp-hr"
                  title="裁剪尾部"
                  onPointerDown={(e) =>
                    beginDrag(e, { kind: 'trimR', lane: 'pip', id: c.id, origAt: c.atSeconds ?? 0, origDur: c.clipDuration, origIn: c.inPoint })
                  }
                />
              </div>
            );
          })}
        </Row>
      ))}
      {t.audioTracks.map((tr) => (
        <Row key={tr.id} name={`♪ ${tr.name ?? '音频'}`}>
          {tr.clips.map((c) => {
            const isD = drag?.lane === 'audio' && drag.id === c.id;
            const at = drag && isD ? drag.previewAt : c.atSeconds;
            const dur = drag && isD ? drag.previewDur : c.duration;
            return (
              <div
                key={c.id}
                className={`djp-track-block djp-audio-block ${isD ? 'djp-dragging' : ''}`}
                style={{ position: 'absolute', left: pct(at), width: pct(dur) }}
                title={`${c.src} · ${fmtSec(at)}–${fmtSec(at + dur)}`}
                onPointerDown={(e) =>
                  beginDrag(e, { kind: 'move', lane: 'audio', id: c.id, origAt: c.atSeconds, origDur: c.duration, origIn: c.inPoint })
                }
                onClick={(e) => {
                  e.stopPropagation();
                  if (justDragged.current) return;
                  onSeekClip(c.atSeconds, 'audio');
                }}
              >
                <span className="djp-track-label">♪ {c.src}</span>
                <div
                  className="djp-handle djp-hl"
                  title="裁剪头部"
                  onPointerDown={(e) =>
                    beginDrag(e, { kind: 'trimL', lane: 'audio', id: c.id, origAt: c.atSeconds, origDur: c.duration, origIn: c.inPoint })
                  }
                />
                <div
                  className="djp-handle djp-hr"
                  title="裁剪尾部"
                  onPointerDown={(e) =>
                    beginDrag(e, { kind: 'trimR', lane: 'audio', id: c.id, origAt: c.atSeconds, origDur: c.duration, origIn: c.inPoint })
                  }
                />
              </div>
            );
          })}
        </Row>
      ))}
    </div>
  );
};

// ---------- 主面板 ----------
export const Panel: React.FC = () => {
  const { timeline, mutate, reload } = useTimelineSync();
  const hist = useHistory(timeline, mutate);
  const o = ops(hist.commit);
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  const [tab, setTab] = useState<'assets' | 'clips' | 'pip' | 'audio' | 'subs'>('clips');
  const audioFileRef = useRef<HTMLInputElement>(null);
  const playheadRef = useRef(0);

  // 快捷键：Ctrl+Z/Shift+Z/Y 撤销重做；空格 播放/暂停；S 分割；←/→ ±1s（Shift ±0.1s）（输入框聚焦时不抢）
  const splitRef = useRef<() => void>(() => {});
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
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
        seekToSeconds(Math.max(0, playheadRef.current + dir * (e.shiftKey ? 0.1 : 1)), timeline?.meta.fps ?? 30);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hist.undo, hist.redo, timeline?.meta.fps]);

  if (!timeline) {
    return <div className="djp-root"><div className="djp-empty">连接剪辑引擎中…（5180）</div></div>;
  }
  const t = timeline;
  const durationInFrames = Math.max(1, timelineDurationInFrames(t));
  const totalSec = durationInFrames / t.meta.fps;
  const mainClips = t.videoTracks[0]?.clips ?? [];
  const pipClips = t.videoTracks.slice(1).flatMap((tr) => tr.clips);
  const audioClips = t.audioTracks.flatMap((tr) => tr.clips);
  const hasContent = mainClips.length + pipClips.length + audioClips.length > 0;
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
  splitRef.current = splitMainAtPlayhead;

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
                  volume: 1,
                },
              ],
            }
          : tr,
      ),
    }));
  const setBgm = (name: string) =>
    hist.commit((cur) => {
      const clip = { id: clipId(), src: name, inPoint: 0, duration: 10, volume: 1, atSeconds: 0 };
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
    const target = (e.target as HTMLElement).closest('.djp-card');
    const to = target ? Number((target as HTMLElement).dataset.index) : (t.videoTracks[0]?.clips.length ?? 1) - 1;
    if (!Number.isInteger(to) || from === to) return;
    const order = (t.videoTracks[0]?.clips ?? []).map((c) => c.id);
    const [moved] = order.splice(from, 1);
    order.splice(to, 0, moved);
    o.reorderClips(order);
  };

  return (
    <div className="djp-root">
      <ProjectBar onSwitched={() => { hist.clear(); void reload(); }} />
      <div className="djp-head">
        <span className="djp-title">剪辑</span>
        <button className="djp-iconbtn" title="撤销（Ctrl+Z）" disabled={!hist.canUndo} onClick={hist.undo}>↺</button>
        <button className="djp-iconbtn" title="重做（Ctrl+Shift+Z）" disabled={!hist.canRedo} onClick={hist.redo}>↻</button>
        <span className="djp-meta">
          {t.meta.width}×{t.meta.height} · {t.meta.fps}fps · {totalSec.toFixed(1)}s · {mainClips.length} 段
          {pipClips.length ? ` · 画中画×${pipClips.length}` : ''}
          {audioClips.length ? ` · 音频×${audioClips.length}` : ''} · {t.overlays.length} 字幕
        </span>
        <button className="djp-btn" title="版本历史（AI 修改自动存档，可恢复）" onClick={() => setHistOpen(true)}>历史</button>
        <button className="djp-btn" title="画布设置" onClick={() => setCanvasOpen(true)}>画布</button>
        <ExportControl t={t} />
      </div>

      {!hasContent ? (
        <div className="djp-empty">还没有片段——让 AI 加素材，从素材库加，或点下方「片段 +」</div>
      ) : (
        <div className="djp-stage">
          <Player
            key={`${t.meta.fps}-${t.meta.width}-${t.meta.height}`}
            ref={(r) => {
              playerBus.ref = r;
            }}
            component={PreviewVideo}
            inputProps={{ timeline: previewTimeline }}
            durationInFrames={durationInFrames}
            fps={t.meta.fps}
            compositionWidth={t.meta.width}
            compositionHeight={t.meta.height}
            controls
            acknowledgeRemotionLicense
            style={{ width: '100%', aspectRatio: `${t.meta.width} / ${t.meta.height}` }}
          />
        </div>
      )}

      <div className="djp-tabs">
        {([
          ['assets', '素材'],
          ['clips', `片段${mainClips.length ? ` ${mainClips.length}` : ''}`],
          ['pip', `画中画${pipClips.length ? ` ${pipClips.length}` : ''}`],
          ['audio', `音频${audioClips.length ? ` ${audioClips.length}` : ''}`],
          ['subs', `字幕${t.overlays.length ? ` ${t.overlays.length}` : ''}`],
        ] as const).map(([key, label]) => (
          <button key={key} className={`djp-tab ${tab === key ? 'djp-on' : ''}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      <div className="djp-tabwrap">
        {tab === 'assets' && <AssetsSection onAddClip={addAssetClip} onSetBgm={setBgm} />}

        {tab === 'clips' && (
      <div className="djp-section">
        <div className="djp-section-head">
          <span>片段（主轨道）</span>
          <span style={{ display: 'flex', gap: 6 }}>
            <button className="djp-btn" title="在播放头处分割主轨片段" onClick={splitMainAtPlayhead}>✂ 分割</button>
            <button className="djp-btn" title="加画中画叠加轨" onClick={o.addPip}>画中画</button>
            <button className="djp-add" title="添加片段" onClick={o.addClip}>+</button>
          </span>
        </div>
        {mainClips.length === 0 && <div className="djp-hint">主轨道空</div>}
        <div onDragOver={onDragOver} onDrop={onDrop} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {mainClips.map((c, i) => (
            <div
              className="djp-card"
              data-index={i}
              key={c.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/clip-index', String(i));
                e.dataTransfer.effectAllowed = 'move';
              }}
            >
              <div className="djp-card-head">
                <span className="djp-drag" title="拖拽排序">⋮⋮</span>
                <span className="djp-card-title">#{i + 1} {c.src}</span>
                <select
                  className="djp-select"
                  value={c.transition}
                  onChange={(e) => o.updateClip(c.id, { transition: e.target.value as Clip['transition'] })}
                >
                  <option value="none">无转场</option>
                  <option value="fade">淡入</option>
                </select>
                <button className="djp-del" title="删除片段" onClick={() => o.removeClip(c.id)}>✕</button>
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
                <FilterSelect value={c.filter} onCommit={(f) => o.updateClip(c.id, { filter: f })} />
                <AnimSelect clip={c} onCommit={(anims) => o.updateClip(c.id, { animations: anims })} />
              </div>
            </div>
          ))}
        </div>
      </div>
        )}

        {tab === 'pip' && (
      <div className="djp-section">
        <div className="djp-section-head">
          <span>画中画</span>
        </div>
        {pipClips.length === 0 && <div className="djp-hint">无叠加片段——「片段」区点「画中画」或让 AI 加</div>}
        {pipClips.map((c) => (
          <div className="djp-card djp-overlay-row" key={c.id}>
            <span className="djp-card-title" style={{ maxWidth: 90 }}>{c.src}</span>
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
            <FilterSelect value={c.filter} onCommit={(f) => o.updateClip(c.id, { filter: f })} />
            <AnimSelect clip={c} onCommit={(anims) => o.updateClip(c.id, { animations: anims })} />
            <button className="djp-btn" title="在播放头处分割" onClick={() => o.splitClip(c.id, Math.round(playheadRef.current * 100) / 100)}>✂</button>
            <button className="djp-del" title="删除画中画" onClick={() => o.removeClip(c.id)}>✕</button>
          </div>
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
                } catch {
                  // 上传失败静默
                }
                if (audioFileRef.current) audioFileRef.current.value = '';
              }}
            />
            <button className="djp-btn" title="上传音频并加入音频轨" onClick={() => audioFileRef.current?.click()}>上传</button>
          </span>
        </div>
        {t.audioTracks.length === 0 && <div className="djp-hint">无音频轨——素材库「♪配乐」、上方「上传」或让 AI 加</div>}
        {t.audioTracks.map((tr) => (
          <div className="djp-card" key={tr.id}>
            <div className="djp-card-head">
              <span className="djp-card-title">♪ {tr.name ?? '音频'}</span>
              <button
                className={`djp-btn ${tr.muted ? 'djp-error' : ''}`}
                title={tr.muted ? '取消静音' : '静音'}
                onClick={() => o.updateAudioTrack(tr.id, { muted: !tr.muted })}
              >
                {tr.muted ? '🔇' : '🔊'}
              </button>
              <label className="djp-field">
                <span>轨音量</span>
                <input
                  type="range" min={0} max={1} step={0.05}
                  value={tr.volume}
                  onChange={(e) => o.updateAudioTrack(tr.id, { volume: Number(e.target.value) })}
                  style={{ width: 70 }}
                />
              </label>
            </div>
            {tr.clips.map((c) => (
              <div className="djp-fields" key={c.id} style={{ alignItems: 'center' }}>
                <span className="djp-card-title" style={{ maxWidth: 80 }}>{c.src}</span>
                <NumberField label="从" value={c.atSeconds} onCommit={(v) => o.updateAudioClip(c.id, { atSeconds: Math.max(0, v) })} />
                <NumberField label="时长" value={c.duration} min={0.1} onCommit={(v) => o.updateAudioClip(c.id, { duration: v })} />
                <NumberField label="音量" value={c.volume} step={0.1} onCommit={(v) => o.updateAudioClip(c.id, { volume: Math.min(1, Math.max(0, v)) })} />
                <NumberField label="速度" value={c.speed ?? 1} step={0.25} min={0.1} onCommit={(v) => o.updateAudioClip(c.id, { speed: Math.min(10, Math.max(0.1, v)) })} />
                <button className="djp-btn" title="在播放头处分割" onClick={() => o.splitClip(c.id, Math.round(playheadRef.current * 100) / 100)}>✂</button>
                <button className="djp-del" title="删除音频片段" onClick={() => o.removeAudioClip(c.id)}>✕</button>
              </div>
            ))}
          </div>
        ))}
      </div>
        )}

        {tab === 'subs' && (
      <div className="djp-section">
        <div className="djp-section-head">
          <span>字幕</span>
          <button className="djp-add" title="添加字幕" onClick={o.addOverlay}>+</button>
        </div>
        {t.overlays.length === 0 && <div className="djp-hint">无字幕</div>}
        {t.overlays.map((ov, i) => (
          <div className="djp-card djp-overlay-row" key={i}>
            <input
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
            <NumberField label="从" value={ov.startSeconds} onCommit={(v) => o.updateOverlay(i, { startSeconds: v })} />
            <NumberField
              label="到"
              value={ov.endSeconds}
              min={0.1}
              onCommit={(v) => o.updateOverlay(i, { endSeconds: v })}
            />
            <button className="djp-del" title="删除字幕" onClick={() => o.removeOverlay(i)}>✕</button>
          </div>
        ))}
      </div>
        )}
      </div>

      <div className="djp-tdock">
        <TrackStrip
          t={t}
          o={o}
          playheadRef={playheadRef}
          onSeekClip={(start, lane) => {
            seekToSeconds(start, t.meta.fps);
            if (lane === 'main') setTab('clips');
            else if (lane === 'pip') setTab('pip');
            else if (lane === 'audio') setTab('audio');
          }}
        />
        <div className="djp-hint">AI 在对话里剪辑（MCP 工具落 5180 事实源）后，这里 2 秒内自动同步。</div>
      </div>

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
