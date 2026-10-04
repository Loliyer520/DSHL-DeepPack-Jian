// 视频/图片片段属性：画面 · 动画 · 调色 · 音频 · 变速 · 转场
import React from 'react';
import type { Animations, Clip, Easing, Timeline } from '../../../../../engine/src/schema';
import { BLEND_MODES, DIRECTIONS, EASING_NAMES, TRANSITION_TYPES, clipBox } from '../../../../../engine/src/timeline';
import { listAnimationPresets } from '../../../../../engine/src/presets';
import { useEditor } from '../../context';
import type { Op } from '../../engine';
import { Field } from '../common';
import { AnimNumber, NumberField, Section, Seg, Toggle, channelState, useEdit, type Target } from './fields';

export interface ClipCtx { clip: Clip; start: number; isMain: boolean; index: number; locked: boolean }
export type ClipTab = 'picture' | 'animation' | 'color' | 'audio' | 'speed' | 'transition';
export function clipTabs(c: ClipCtx): [ClipTab, string][] {
  const tabs: [ClipTab, string][] = [['picture', '画面'], ['animation', '动画'], ['color', '调色']];
  if (c.clip.type === 'video') tabs.push(['audio', '音频'], ['speed', '变速']);
  if (c.isMain && c.index > 0) tabs.push(['transition', '转场']);
  return tabs;
}

const BLEND_LABEL: Record<string, string> = { normal: '正常', multiply: '正片叠底', screen: '滤色', overlay: '叠加', darken: '变暗', lighten: '变亮', 'color-dodge': '颜色减淡', 'color-burn': '颜色加深', 'hard-light': '强光', 'soft-light': '柔光', difference: '差值', exclusion: '排除' };
export const TRANSITION_NAMES: Record<string, string> = { dissolve: '叠化', fadeBlack: '闪黑', fadeWhite: '闪白', slide: '滑动', wipe: '擦除', push: '推入', zoom: '缩放', blur: '模糊' };
const DIR_LABEL: Record<string, string> = { left: '向左', right: '向右', up: '向上', down: '向下' };
const EASE_LABEL: Record<string, string> = { linear: '匀速', in: '缓入', out: '缓出', inOut: '缓入缓出', bounce: '弹跳', elastic: '弹性', hold: '定格' };
export const CHANNEL_LABEL: Record<string, string> = { x: '位移 X', y: '位移 Y', scale: '缩放', scaleX: '横向缩放', scaleY: '纵向缩放', opacity: '不透明度', rotation: '旋转', volume: '音量', brightness: '亮度', contrast: '对比度', saturate: '饱和度', blur: '模糊' };

/** 动画页：预设（入场/出场/组合/循环）+ 关键帧概览，片段与字幕共用 */
export function AnimationTab({ target, kind, effects, fps, now }: { target: Target; kind: 'clip' | 'overlay'; effects: { preset: string }[] | undefined; fps: number; now: number }) {
  const ed = useEditor();
  const { commit } = useEdit();
  const op = kind === 'clip' ? 'updateClip' : 'updateOverlay';
  const groups = new Map<string, { key: string; label: string }[]>();
  for (const p of listAnimationPresets()) { if (!groups.has(p.group)) groups.set(p.group, []); groups.get(p.group)!.push(p); }
  const active = new Set((effects ?? []).map((e) => e.preset));
  const channels = Object.entries(target.animations ?? {}).filter(([, k]) => k && k.length && !(k.length === 1 && k[0].e === 'hold')) as [string, NonNullable<Animations['x']>][];
  const atHead = channels.filter(([ch]) => channelState(target, ch, now, fps).state === 'on');
  const rel = Math.round((now - target.start) * fps) / fps;
  const headEase = atHead.length ? atHead[0][1].find((k) => Math.abs(k.t - rel) < 0.5 / fps)?.e : undefined;
  return (
    <>
      {[...groups].map(([group, list]) => (
        <Section key={group} title={group}>
          <div className="dj-chips">
            {list.map((p) => (
              <button key={p.key} type="button" className="dj-chip" aria-pressed={active.has(p.key)}
                onClick={() => commit([{ op, id: target.id, patch: active.has(p.key) ? { effects: (effects ?? []).filter((e) => e.preset !== p.key) } : { animationPreset: p.key } }], (active.has(p.key) ? '移除动画「' : '动画「') + p.label + '」')}>{p.label}</button>
            ))}
          </div>
        </Section>
      ))}
      <Section title="关键帧" extra={(channels.length > 0 || active.size > 0) && <button className="dj-btn dj-danger" onClick={() => commit([{ op, id: target.id, patch: { animationPreset: 'none' } }], '清除动画与关键帧')}>全部清除</button>}>
        {!channels.length && <p className="dj-hint">在“画面/调色”里点数值旁的 ◆ 在播放头处打关键帧；动画预设会随片段时长自动伸缩。</p>}
        <div className="dj-list">
          {channels.map(([ch, kfs]) => (
            <div key={ch}>
              <span style={{ flex: 1 }}>{CHANNEL_LABEL[ch] ?? ch} <small>{kfs.length} 帧</small></span>
              <button className="dj-icon-btn" title="上一帧" aria-label="跳到上一关键帧" onClick={() => { const k = [...kfs].reverse().find((x) => x.t < rel - 0.5 / fps); if (k) ed.clock.seek(target.start + Math.max(0, k.t)); }}>‹</button>
              <button className="dj-icon-btn" title="下一帧" aria-label="跳到下一关键帧" onClick={() => { const k = kfs.find((x) => x.t > rel + 0.5 / fps); if (k) ed.clock.seek(target.start + k.t); }}>›</button>
              <button className="dj-btn" onClick={() => commit([{ op: 'clearKeyframes', id: target.id, channel: ch }], '清除' + (CHANNEL_LABEL[ch] ?? ch) + '关键帧')}>清除</button>
            </div>
          ))}
        </div>
        {atHead.length > 0 && (
          <Field label="播放头处关键帧的缓动">
            <select className="dj-select" value={typeof headEase === 'string' ? headEase : Array.isArray(headEase) ? 'custom' : 'linear'}
              onChange={(e) => commit(atHead.map(([ch, kfs]) => { const k = kfs.find((x) => Math.abs(x.t - rel) < 0.5 / fps)!; return { op: 'setKeyframe', id: target.id, channel: ch, t: k.t, v: k.v, e: e.target.value as Easing }; }), '设置缓动')}>
              {EASING_NAMES.map((n) => <option key={n} value={n}>{EASE_LABEL[n] ?? n}</option>)}
              {Array.isArray(headEase) && <option value="custom" disabled>自定义曲线</option>}
            </select>
          </Field>
        )}
      </Section>
    </>
  );
}

export function ClipInspector({ c, tab, timeline, now }: { c: ClipCtx; tab: ClipTab; timeline: Timeline; now: number }) {
  const { commit } = useEdit();
  const { clip } = c;
  const fps = timeline.meta.fps;
  const target: Target = { id: clip.id, start: c.start, duration: clip.clipDuration, animations: clip.animations };
  const pu = (patch: Record<string, unknown>): Op[] => [{ op: 'updateClip', id: clip.id, patch }];
  const set = (patch: Record<string, unknown>, label: string) => commit(pu(patch), label);
  const box = clipBox(clip);
  const filter = clip.filter ?? {};
  const anim = { target, fps, now, disabled: c.locked };
  if (tab === 'animation') return <AnimationTab target={target} kind="clip" effects={clip.effects} fps={fps} now={now} />;
  if (tab === 'color') return (
    <>
      <Section title="基础调节" extra={clip.filter && <button className="dj-btn" onClick={() => set({ filter: null }, '重置调色')}>重置</button>}>
        <div className="dj-grid">
          {(['brightness', 'contrast', 'saturate'] as const).map((ch) => (
            <AnimNumber key={ch} {...anim} channel={ch} label={{ brightness: '亮度', contrast: '对比度', saturate: '饱和度' }[ch]} value={filter[ch] ?? 1} scale={100} suffix="%" step={0.01} min={0} max={3} digits={0}
              staticOps={(v) => pu({ filter: { ...filter, [ch]: v } })} />
          ))}
          <AnimNumber {...anim} channel="blur" label="模糊" value={filter.blur ?? 0} step={0.1} min={0} max={20} digits={1} suffix="px" staticOps={(v) => pu({ filter: { ...filter, blur: v } })} />
        </div>
      </Section>
      <Section title="风格">
        <div className="dj-grid">
          <NumberField label="黑白" value={filter.grayscale ?? 0} scale={100} suffix="%" step={0.01} min={0} max={1} digits={0} ops={(v) => pu({ filter: { ...filter, grayscale: v } })} />
          <NumberField label="怀旧" value={filter.sepia ?? 0} scale={100} suffix="%" step={0.01} min={0} max={1} digits={0} ops={(v) => pu({ filter: { ...filter, sepia: v } })} />
          <NumberField label="色相" value={filter.hueRotate ?? 0} step={1} min={0} max={360} digits={0} suffix="°" ops={(v) => pu({ filter: { ...filter, hueRotate: v } })} />
        </div>
      </Section>
    </>
  );
  if (tab === 'audio') return (
    <Section title="声音">
      <div className="dj-grid">
        <AnimNumber {...anim} channel="volume" label="音量" value={clip.volume} scale={100} suffix="%" step={0.01} min={0} max={1} digits={0} staticOps={(v) => pu({ volume: v })} />
        <Toggle label="静音" checked={Boolean(clip.muted)} onChange={(v) => set({ muted: v }, v ? '片段静音' : '取消静音')} />
        <NumberField label="淡入" value={clip.fadeIn ?? 0} step={0.05} min={0} max={Math.min(30, clip.clipDuration / 2)} suffix="s" ops={(v) => pu({ fadeIn: v })} editLabel="设置淡入" />
        <NumberField label="淡出" value={clip.fadeOut ?? 0} step={0.05} min={0} max={Math.min(30, clip.clipDuration / 2)} suffix="s" ops={(v) => pu({ fadeOut: v })} editLabel="设置淡出" />
      </div>
    </Section>
  );
  if (tab === 'speed') {
    // 剪映式变速：保持所用源素材范围不变，时长随速度伸缩
    const speedOps = (v: number) => pu({ speed: v, clipDuration: Math.max(1 / fps, clip.clipDuration * (clip.speed ?? 1) / v) });
    return (
      <Section title="常规变速">
        <div className="dj-chips" style={{ marginBottom: 10 }}>
          {[0.25, 0.5, 1, 1.5, 2, 3, 5].map((v) => <button key={v} type="button" className="dj-chip" aria-pressed={(clip.speed ?? 1) === v} onClick={() => commit(speedOps(v), '变速 ' + v + 'x')}>{v}x</button>)}
        </div>
        <div className="dj-grid">
          <NumberField label="倍速" value={clip.speed ?? 1} step={0.05} min={0.1} max={10} suffix="x" ops={speedOps} editLabel="变速" />
          <NumberField label="时长" value={clip.clipDuration} step={1 / fps} min={1 / fps} suffix="s" ops={(v) => pu({ clipDuration: v })} editLabel="调整时长" />
          <NumberField label="源入点" value={clip.inPoint} step={1 / fps} min={0} suffix="s" ops={(v) => pu({ inPoint: v })} editLabel="调整入点" />
          <Toggle label="定格画面" checked={Boolean(clip.freeze)} onChange={(v) => set({ freeze: v }, v ? '定格' : '取消定格')} />
        </div>
      </Section>
    );
  }
  if (tab === 'transition') {
    const tr = clip.transition;
    const cur = typeof tr === 'object' ? tr : tr === 'fade' ? { type: 'dissolve' as const, duration: 0.4 } : null;
    const applyAll = () => {
      const main = timeline.videoTracks[0].clips;
      commit(main.slice(1).map((k) => ({ op: 'updateClip', id: k.id, patch: { transition: cur ?? 'none' } })), '转场应用到全部');
    };
    const directional = (t: string) => t === 'slide' || t === 'wipe' || t === 'push';
    return (
      <Section title="与上一段之间的转场" extra={<button className="dj-btn" onClick={applyAll}>应用到全部</button>}>
        <div className="dj-chips" style={{ marginBottom: 10 }}>
          <button type="button" className="dj-chip" aria-pressed={!cur} onClick={() => set({ transition: 'none' }, '移除转场')}>无</button>
          {TRANSITION_TYPES.map((t) => (
            <button key={t} type="button" className="dj-chip" aria-pressed={cur?.type === t}
              onClick={() => set({ transition: { type: t, duration: cur?.duration ?? 0.5, ...(directional(t) ? { direction: cur?.direction ?? 'left' } : {}) } }, '转场「' + TRANSITION_NAMES[t] + '」')}>{TRANSITION_NAMES[t]}</button>
          ))}
        </div>
        {cur && <div className="dj-grid">
          <NumberField label="时长" value={cur.duration} step={0.05} min={0.05} max={3} suffix="s" ops={(v) => pu({ transition: { ...cur, duration: v } })} editLabel="转场时长" />
          {directional(cur.type) && (
            <Field label="方向"><Seg label="方向" value={cur.direction ?? 'left'} options={DIRECTIONS.map((d) => [d, DIR_LABEL[d]] as [typeof d, string])} onChange={(d) => set({ transition: { ...cur, direction: d } }, '转场方向')} /></Field>
          )}
        </div>}
      </Section>
    );
  }
  return <PictureTab c={c} anim={anim} pu={pu} set={set} box={box} />;
}

function PictureTab({ c, anim, pu, set, box }: { c: ClipCtx; anim: { target: Target; fps: number; now: number; disabled: boolean }; pu: (p: Record<string, unknown>) => Op[]; set: (p: Record<string, unknown>, label: string) => void; box: { x: number; y: number; w: number; h: number } }) {
  const { clip } = c;
  const SIDE = { x: '左', y: '上', w: '宽', h: '高' } as const;
  const cr = clip.crop ?? { x: 0, y: 0, w: 1, h: 1 };
  return (
    <>
      {!c.isMain && (
        <Section title="位置与大小">
          <div className="dj-grid">
            {(['x', 'y', 'w', 'h'] as const).map((k) => (
              <NumberField key={k} label={SIDE[k]} value={box[k]} scale={100} suffix="%" step={0.005} min={k === 'w' || k === 'h' ? 0.01 : 0} max={1} digits={1} ops={(v) => pu({ box: { ...box, [k]: v } })} editLabel="调整画中画" />
            ))}
            <NumberField label="圆角" value={clip.radius ?? 0} scale={200} suffix="%" step={0.005} min={0} max={0.5} digits={0} ops={(v) => pu({ radius: v })} />
            <Toggle label="投影" checked={clip.shadow !== false} onChange={(v) => set({ shadow: v }, v ? '开启投影' : '关闭投影')} />
          </div>
          <Field label="混合模式">
            <select className="dj-select" value={clip.blendMode ?? 'normal'} onChange={(e) => set({ blendMode: e.target.value }, '混合模式')}>
              {BLEND_MODES.map((m) => <option key={m} value={m}>{BLEND_LABEL[m]}</option>)}
            </select>
          </Field>
        </Section>
      )}
      <Section title="变换">
        <div className="dj-grid">
          <AnimNumber {...anim} channel="scale" label="缩放" scale={100} suffix="%" step={0.01} min={0.05} max={10} digits={0} />
          <AnimNumber {...anim} channel="rotation" label="旋转" step={1} min={-3600} max={3600} digits={1} suffix="°" />
          <AnimNumber {...anim} channel="x" label="位移 X" scale={100} suffix="%" step={0.005} min={-2} max={2} digits={1} />
          <AnimNumber {...anim} channel="y" label="位移 Y" scale={100} suffix="%" step={0.005} min={-2} max={2} digits={1} />
          <AnimNumber {...anim} channel="opacity" label="不透明度" value={clip.opacity ?? 1} scale={100} suffix="%" step={0.01} min={0} max={1} digits={0} staticOps={(v) => pu({ opacity: v })} />
        </div>
      </Section>
      <Section title="画面">
        <Field label="填充方式"><Seg label="填充方式" value={clip.fit ?? 'cover'} options={[['cover', '裁剪填满'], ['contain', '完整显示'], ['fill', '拉伸']]} onChange={(v) => set({ fit: v }, '填充方式')} /></Field>
        <div className="dj-grid" style={{ marginTop: 8 }}>
          <Toggle label="水平翻转" checked={Boolean(clip.flipH)} onChange={(v) => set({ flipH: v }, '水平翻转')} />
          <Toggle label="垂直翻转" checked={Boolean(clip.flipV)} onChange={(v) => set({ flipV: v }, '垂直翻转')} />
        </div>
      </Section>
      <Section title="裁切" extra={clip.crop && <button className="dj-btn" onClick={() => set({ crop: null }, '取消裁切')}>重置</button>}>
        <div className="dj-grid">
          {(['x', 'y', 'w', 'h'] as const).map((k) => (
            <NumberField key={k} label={SIDE[k]} value={cr[k]} scale={100} suffix="%" step={0.005} min={k === 'w' || k === 'h' ? 0.05 : 0} max={1} digits={1} ops={(v) => pu({ crop: { ...cr, [k]: v } })} editLabel="裁切" />
          ))}
        </div>
      </Section>
    </>
  );
}
