// 时间线片段块：胶片（服务端雪碧图切片）、波形（服务端峰值）、关键帧菱形、淡入淡出与转场标记
import React, { memo, useEffect, useRef } from 'react';
import type { Animations } from '../../../../engine/src/schema';
import { evalKeyframes } from '../../../../engine/src/timeline';
import { absolute } from '../engine';
import { loadPeaks, loadSprite, useAsync } from '../media';
import type { Block } from './layout';

export interface BlockProps {
  block: Block;
  pid: string;
  pps: number;
  top: number;
  height: number;
  selected: boolean;
  flash: boolean;
  dim: boolean;
  visibleFrom: number;
  visibleTo: number;
}

function Filmstrip({ pid, src, type, inPoint, speed, width, height, pps, offsetPx, visibleW }: { pid: string; src: string; type: 'video' | 'image'; inPoint: number; speed: number; width: number; height: number; pps: number; offsetPx: number; visibleW: number }) {
  const sprite = useAsync(type === 'video' ? () => loadSprite(pid, src) : null, [pid, src, type]);
  if (height < 20) return null;
  if (type === 'image') {
    return <div className="dj-film" style={{ backgroundImage: 'url("' + absolute('/api/p/' + encodeURIComponent(pid) + '/media/' + encodeURIComponent(src)) + '")', backgroundSize: 'auto 100%', backgroundRepeat: 'repeat-x' }} />;
  }
  if (!sprite?.width) return null;
  const tileW = Math.max(16, (sprite.width / sprite.height) * height);
  // 只渲染可见范围内的格子
  const first = Math.max(0, Math.floor(offsetPx / tileW));
  const last = Math.min(Math.ceil(width / tileW), Math.ceil((offsetPx + visibleW) / tileW) + 1);
  const tiles = [];
  for (let i = first; i < last; i++) {
    const t = inPoint + ((i * tileW + tileW / 2) / pps) * speed;
    const idx = Math.max(0, Math.min(sprite.count - 1, Math.floor(t / sprite.interval)));
    tiles.push(<span key={i} style={{ position: 'absolute', left: i * tileW, width: tileW, height: '100%', backgroundImage: 'url("' + sprite.tile(idx) + '")', backgroundSize: 'cover', backgroundPosition: 'center' }} />);
  }
  return <div className="dj-film">{tiles}</div>;
}

function Waveform({ pid, src, inPoint, duration, speed, width }: { pid: string; src: string; inPoint: number; duration: number; speed: number; width: number }) {
  const peaks = useAsync(() => loadPeaks(pid, src), [pid, src]);
  const ref = useRef<HTMLCanvasElement>(null);
  const w = Math.max(1, Math.min(4096, Math.round(width)));
  useEffect(() => {
    const c = ref.current; if (!c || !peaks) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const h = c.clientHeight || 24;
    c.width = w * dpr; c.height = h * dpr;
    const g = c.getContext('2d'); if (!g) return;
    g.scale(dpr, dpr);
    g.fillStyle = 'rgba(255,255,255,.6)';
    // 按素材自身峰值归一化（安静的素材也看得清起伏），再做轻微压缩
    let top = 24;
    for (let i = 0; i < peaks.values.length; i++) if (peaks.values[i] > top) top = peaks.values[i];
    const from = inPoint * peaks.rate, span = duration * speed * peaks.rate;
    for (let x = 0; x < w; x++) {
      const a = Math.floor(from + (x / w) * span), b = Math.max(a + 1, Math.floor(from + ((x + 1) / w) * span));
      let m = 0;
      for (let i = a; i < b && i < peaks.values.length; i++) if (peaks.values[i] > m) m = peaks.values[i];
      const bar = Math.max(0.5, Math.pow(m / top, 0.8) * h * 0.9);
      g.fillRect(x, h - bar, 1, bar);
    }
  }, [peaks, w, inPoint, duration, speed]);
  if (!peaks) return null;
  return <canvas ref={ref} className="dj-wave" style={{ width: '100%' }} />;
}

const kfTimes = (a: Animations | undefined) => {
  const set = new Set<number>();
  for (const list of Object.values(a ?? {})) for (const k of list ?? []) set.add(Math.round(k.t * 1000) / 1000);
  return [...set];
};

export const ClipBlock = memo(function ClipBlock({ block, pid, pps, top, height, selected, flash, dim, visibleFrom, visibleTo }: BlockProps) {
  const left = block.start * pps;
  const width = Math.max(2, block.duration * pps);
  const c = block.clip, a = block.audio, o = block.overlay;
  const speed = c?.speed ?? a?.speed ?? 1;
  const badges: string[] = [];
  if (speed !== 1) badges.push(speed + '×');
  if (c?.filter) badges.push('调色');
  if (c?.effects?.length || o?.effects?.length) badges.push('动画');
  if (c?.freeze) badges.push('定格');
  if (c?.muted || a?.muted) badges.push('静音');
  const anims = c?.animations ?? a?.animations ?? o?.animations;
  const fadeIn = c?.fadeIn ?? a?.fadeIn, fadeOut = c?.fadeOut ?? a?.fadeOut;
  const visibleOffset = Math.max(0, visibleFrom * pps - left);
  const visibleW = Math.min(width, visibleTo * pps - left) - visibleOffset;
  return (
    <div className={'dj-clip dj-' + block.kind + (selected ? ' dj-sel' : '') + (flash ? ' dj-flash' : '') + (dim ? ' dj-dim' : '')}
      data-block={block.id} data-kind={block.kind} style={{ left, width, top: top + 3, height: height - 6, bottom: 'auto' }}
      title={block.label + ' · ' + block.duration.toFixed(2) + 's'}>
      {c && <Filmstrip pid={pid} src={c.src} type={c.type} inPoint={c.inPoint} speed={c.freeze ? 0 : speed} width={width} height={height - 6} pps={pps} offsetPx={visibleOffset} visibleW={visibleW} />}
      {a && <Waveform pid={pid} src={a.src} inPoint={a.inPoint} duration={a.duration} speed={speed} width={width} />}
      <div className="dj-clip-label">{block.kind === 'text' ? 'T ' : ''}<span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{block.label}</span>{badges.map((b) => <span key={b} className="dj-badge">{b}</span>)}</div>
      {fadeIn ? <div className="dj-ramp" style={{ left: 0, width: fadeIn * pps, background: 'linear-gradient(to right,rgba(0,0,0,.55),transparent)' }} /> : null}
      {fadeOut ? <div className="dj-ramp" style={{ right: 0, width: fadeOut * pps, background: 'linear-gradient(to left,rgba(0,0,0,.55),transparent)' }} /> : null}
      {selected && kfTimes(anims).map((t) => t >= 0 && t <= block.duration ? <i key={t} className="dj-kf" style={{ left: t * pps }} /> : null)}
      {selected && a && height > 30 && <Envelope keyframes={anims?.volume} base={a.volume} duration={a.duration} pps={pps} height={height - 6} />}
      {selected && (c || a) && <><span className="dj-fade" data-handle="fadeIn" style={{ left: Math.max(0, (fadeIn ?? 0) * pps) - 5, top: 2 }} title="拖动设置淡入" /><span className="dj-fade" data-handle="fadeOut" style={{ left: width - Math.max(0, (fadeOut ?? 0) * pps) - 5, top: 2 }} title="拖动设置淡出" /></>}
      <div className="dj-trim dj-l" data-handle="trimL" title="拖动裁剪开头" />
      <div className="dj-trim dj-r" data-handle="trimR" title="拖动裁剪结尾" />
    </div>
  );
});

function Envelope({ keyframes, base, duration, pps, height }: { keyframes?: { t: number; v: number }[]; base: number; duration: number; pps: number; height: number }) {
  const y = (v: number) => (1 - Math.max(0, Math.min(1, v))) * (height - 8) + 4;
  const pts = keyframes?.length ? keyframes.map((k) => ({ t: k.t, v: base * k.v })) : [];
  const line = pts.length
    ? [{ t: 0, v: base * (evalKeyframes(keyframes, 0) ?? 1) }, ...pts, { t: duration, v: base * (evalKeyframes(keyframes, duration) ?? 1) }]
    : [{ t: 0, v: base }, { t: duration, v: base }];
  return (
    <svg className="dj-env" data-handle="envelope" width="100%" height={height}>
      <polyline points={line.map((p) => p.t * pps + ',' + y(p.v)).join(' ')} data-handle="envelope" />
      {pts.map((p, i) => <circle key={i} cx={p.t * pps} cy={y(p.v)} r={4} data-handle="envpoint" data-index={i} />)}
    </svg>
  );
}
