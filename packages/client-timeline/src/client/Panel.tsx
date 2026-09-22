import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Player } from '@remotion/player';
import {
  timelineDurationInFrames,
  type Clip,
  type Overlay,
  type Timeline,
} from '../../../engine/src/schema';
import { PreviewVideo } from './PreviewVideo';
import { playerBus, seekToSeconds } from './bus';
import { assetUrl, getTimeline, putTimeline, type AssetInfo } from './api';
import { useHistory } from './useHistory';
import { ProjectBar } from './ProjectBar';
import { CanvasDialog } from './CanvasDialog';
import { AssetsSection } from './AssetsSection';
import { ExportControl } from './ExportControl';

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
      clips: [
        ...t.clips,
        {
          id: clipId(),
          type: 'video' as const,
          // 默认沿用末片段素材，空时间线退回 a.mp4
          src: t.clips[t.clips.length - 1]?.src ?? 'a.mp4',
          inPoint: 0,
          clipDuration: 3,
          transition: 'none' as const,
          volume: 1,
        },
      ],
    })),
  removeClip: (id: string) => mutate((t) => ({ ...t, clips: t.clips.filter((c) => c.id !== id) })),
  updateClip: (id: string, patch: Partial<Clip>) =>
    mutate((t) => ({ ...t, clips: t.clips.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
  reorderClips: (order: string[]) =>
    mutate((t) => {
      const map = new Map(t.clips.map((c) => [c.id, c]));
      const next = order.map((id) => map.get(id)).filter((c): c is Clip => Boolean(c));
      return { ...t, clips: [...next, ...t.clips.filter((c) => !order.includes(c.id))] };
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

// 轨道条：片段按比例横排 + 播放头联动 + 点击 seek
const TrackStrip: React.FC<{ t: Timeline; onSeekClip: (start: number) => void }> = ({ t, onSeekClip }) => {
  const total = t.clips.reduce((s, c) => s + c.clipDuration, 0);
  const [playhead, setPlayhead] = useState(0);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = playerBus.ref;
      if (p) setPlayhead(p.getCurrentFrame() / t.meta.fps);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [t.meta.fps]);

  if (t.clips.length === 0 || total <= 0) return null;

  const onSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    seekToSeconds(frac * total, t.meta.fps);
  };

  let acc = 0;
  const blocks = t.clips.map((c) => {
    const start = acc;
    acc += c.clipDuration;
    return { clip: c, start, widthPct: (c.clipDuration / total) * 100 };
  });

  return (
    <div className="djp-track" onClick={onSeek}>
      {blocks.map(({ clip, start, widthPct }) => (
        <div
          key={clip.id}
          className={`djp-track-block ${clip.transition === 'fade' ? 'djp-fade' : ''}`}
          style={{ width: `${widthPct}%` }}
          title={`${clip.src} · ${fmtSec(start)}–${fmtSec(start + clip.clipDuration)}`}
          onClick={(e) => {
            e.stopPropagation();
            onSeekClip(start);
          }}
        >
          <span className="djp-track-label">{clip.src}</span>
        </div>
      ))}
      <div className="djp-playhead" style={{ left: `${(Math.min(playhead, total) / total) * 100}%` }} />
    </div>
  );
};

// ---------- 主面板 ----------
export const Panel: React.FC = () => {
  const { timeline, mutate, reload } = useTimelineSync();
  const hist = useHistory(timeline, mutate);
  const o = ops(hist.commit);
  const [canvasOpen, setCanvasOpen] = useState(false);

  // Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y（输入框聚焦时不抢）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); hist.undo(); }
      else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); hist.redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hist.undo, hist.redo]);

  if (!timeline) {
    return <div className="djp-root"><div className="djp-empty">连接剪辑引擎中…（5180）</div></div>;
  }
  const t = timeline;
  const durationInFrames = Math.max(1, timelineDurationInFrames(t));
  const totalSec = durationInFrames / t.meta.fps;

  // 预览用时间线：素材地址转绝对 URL（不动事实源，导出仍发原始相对路径）
  const previewTimeline: Timeline = {
    ...t,
    clips: t.clips.map((c) => ({ ...c, src: assetUrl(c.src) })),
    audio: t.audio ? { ...t.audio, src: assetUrl(t.audio.src) } : t.audio,
  };

  // 素材库动作：视频/图片加为片段，音频设为配乐
  const addAssetClip = (a: AssetInfo) =>
    hist.commit((cur) => ({
      ...cur,
      clips: [
        ...cur.clips,
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
    }));
  const setBgm = (name: string) =>
    hist.commit((cur) => ({ ...cur, audio: { src: name, volume: 1, startAtSeconds: 0 } }));

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
    const to = target ? Number((target as HTMLElement).dataset.index) : t.clips.length - 1;
    if (!Number.isInteger(to) || from === to) return;
    const order = t.clips.map((c) => c.id);
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
          {t.meta.width}×{t.meta.height} · {t.meta.fps}fps · {totalSec.toFixed(1)}s · {t.clips.length} 段 ·{' '}
          {t.overlays.length} 字幕
        </span>
        <button className="djp-btn" title="画布设置" onClick={() => setCanvasOpen(true)}>画布</button>
        <ExportControl t={t} />
      </div>

      {t.clips.length === 0 ? (
        <div className="djp-empty">还没有片段——让 AI 加素材，或点下方「片段 +」</div>
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

      <TrackStrip t={t} onSeekClip={(start) => seekToSeconds(start, t.meta.fps)} />

      <AssetsSection onAddClip={addAssetClip} onSetBgm={setBgm} />

      <div className="djp-section">
        <div className="djp-section-head">
          <span>片段</span>
          <button className="djp-add" title="添加片段" onClick={o.addClip}>+</button>
        </div>
        {t.clips.length === 0 && <div className="djp-hint">空时间线</div>}
        <div onDragOver={onDragOver} onDrop={onDrop} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {t.clips.map((c, i) => (
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
              </div>
            </div>
          ))}
        </div>
      </div>

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

      <div className="djp-hint">AI 在对话里剪辑（MCP 工具落 5180 事实源）后，这里 2 秒内自动同步。</div>

      {canvasOpen && (
        <CanvasDialog
          t={t}
          onApply={(meta) => hist.commit((cur) => ({ ...cur, meta: { ...cur.meta, ...meta } }))}
          onClose={() => setCanvasOpen(false)}
        />
      )}
    </div>
  );
};
