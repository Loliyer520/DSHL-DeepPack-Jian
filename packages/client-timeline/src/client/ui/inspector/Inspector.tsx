// 属性面板：按选中对象切换（视频/图片片段 · 音频 · 文字 · 轨道 · 标记 · 多选 · 无选中=项目设置）
import React, { useEffect, useState } from 'react';
import type { AudioClip, AudioTrack, Marker, Timeline, VideoTrack } from '../../../../../engine/src/schema';
import { locateClip, srcLabel } from '../../../../../engine/src/timeline';
import { useEditor, useStore } from '../../context';
import type { Op } from '../../engine';
import { useSelection } from '../../selection';
import { timecode } from '../../geometry';
import { Icon } from '../../Icon';
import type { Actions } from '../../actions';
import { Field } from '../common';
import { ClipInspector, clipTabs, type ClipTab } from './ClipInspector';
import { TEXT_TABS, TextInspector, type TextTab } from './TextInspector';
import { AnimNumber, ColorField, NumberField, Section, Seg, Toggle, useEdit, useInspectTime, type Target } from './fields';

function Tabs<T extends string>({ tabs, value, onChange }: { tabs: [T, string][]; value: T; onChange: (t: T) => void }) {
  if (tabs.length < 2) return null;
  return (
    <div className="dj-tabs dj-subtabs" role="tablist">
      {tabs.map(([k, label]) => <button key={k} role="tab" aria-selected={value === k} onClick={() => onChange(k)}>{label}</button>)}
    </div>
  );
}

function Header({ icon, title, sub, children }: { icon: Parameters<typeof Icon>[0]['name']; title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="dj-insp-head">
      <Icon name={icon} />
      <div className="dj-insp-title"><b title={title}>{title}</b>{sub && <small>{sub}</small>}</div>
      {children}
    </div>
  );
}

function AudioInspector({ clip, track, start, timeline, now }: { clip: AudioClip; track: AudioTrack; start: number; timeline: Timeline; now: number }) {
  const { commit } = useEdit();
  const fps = timeline.meta.fps;
  const pu = (patch: Record<string, unknown>): Op[] => [{ op: 'updateClip', id: clip.id, patch }];
  const target: Target = { id: clip.id, start, duration: clip.duration, animations: clip.animations };
  const speedOps = (v: number) => pu({ speed: v, duration: Math.max(1 / fps, clip.duration * (clip.speed ?? 1) / v) });
  return (
    <>
      <Section title="声音">
        <div className="dj-grid">
          <AnimNumber target={target} fps={fps} now={now} disabled={track.locked} channel="volume" label="音量" value={clip.volume} scale={100} suffix="%" step={0.01} min={0} max={1} digits={0} staticOps={(v) => pu({ volume: v })} />
          <Toggle label="静音" checked={Boolean(clip.muted)} onChange={(v) => commit(pu({ muted: v }), v ? '片段静音' : '取消静音')} />
          <NumberField label="淡入" value={clip.fadeIn ?? 0} step={0.05} min={0} max={Math.min(30, clip.duration / 2)} suffix="s" ops={(v) => pu({ fadeIn: v })} editLabel="设置淡入" />
          <NumberField label="淡出" value={clip.fadeOut ?? 0} step={0.05} min={0} max={Math.min(30, clip.duration / 2)} suffix="s" ops={(v) => pu({ fadeOut: v })} editLabel="设置淡出" />
        </div>
        <p className="dj-hint">音量线可在时间线上直接拖动；双击音量线添加关键帧。</p>
      </Section>
      <Section title="时间与变速">
        <div className="dj-grid">
          <NumberField label="开始" value={clip.atSeconds} step={1 / fps} min={0} suffix="s" ops={(v) => [{ op: 'moveClip', id: clip.id, atSeconds: v }]} editLabel="移动音频" />
          <NumberField label="时长" value={clip.duration} step={1 / fps} min={1 / fps} suffix="s" ops={(v) => pu({ duration: v })} editLabel="调整时长" />
          <NumberField label="源入点" value={clip.inPoint} step={1 / fps} min={0} suffix="s" ops={(v) => pu({ inPoint: v })} editLabel="调整入点" />
          <NumberField label="倍速" value={clip.speed ?? 1} step={0.05} min={0.1} max={10} suffix="x" ops={speedOps} editLabel="变速" />
        </div>
      </Section>
      <TrackSection track={track} kind="audio" />
    </>
  );
}

const ROLE: [NonNullable<AudioTrack['role']> | 'none', string][] = [['none', '未分类'], ['music', '音乐'], ['voice', '人声'], ['sfx', '音效']];

function TrackSection({ track, kind }: { track: VideoTrack | AudioTrack; kind: 'main' | 'pip' | 'audio' }) {
  const { commit } = useEdit();
  const [name, setName] = useState(track.name ?? '');
  useEffect(() => setName(track.name ?? ''), [track.id, track.name]);
  const tu = (patch: Record<string, unknown>): Op[] => [{ op: 'updateTrack', id: track.id, patch }];
  const audio = kind === 'audio' ? (track as AudioTrack) : null;
  return (
    <Section title={'轨道 · ' + (track.name ?? track.id)}>
      <Field label="名称">
        <input className="dj-input" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') e.currentTarget.blur(); }}
          onBlur={() => { if (name.trim() && name !== track.name) commit(tu({ name: name.trim() }), '重命名轨道'); }} />
      </Field>
      <div className="dj-grid" style={{ marginTop: 8 }}>
        <Toggle label="锁定" checked={Boolean(track.locked)} onChange={(v) => commit(tu({ locked: v }), v ? '锁定轨道' : '解锁轨道')} />
        <Toggle label="静音" checked={Boolean(track.muted)} onChange={(v) => commit(tu({ muted: v }), v ? '轨道静音' : '取消静音')} />
        {kind !== 'audio' && <Toggle label="隐藏" checked={Boolean((track as VideoTrack).hidden)} onChange={(v) => commit(tu({ hidden: v }), v ? '隐藏轨道' : '显示轨道')} />}
        {audio && <NumberField label="轨道音量" value={audio.volume} scale={100} suffix="%" step={0.01} min={0} max={1} digits={0} ops={(v) => tu({ volume: v })} />}
      </div>
      {audio && <>
        <Field label="用途（人声轨会让音乐自动闪避）"><Seg label="用途" value={audio.role ?? 'none'} options={ROLE} onChange={(v) => commit(tu({ role: v === 'none' ? null : v }), '轨道用途')} /></Field>
        {audio.role !== 'voice' && (
          <div className="dj-grid" style={{ marginTop: 8 }}>
            <Toggle label="人声闪避" checked={Boolean(audio.duck)} onChange={(v) => commit(tu({ duck: v ? { level: 0.3, ramp: 0.3 } : null }), v ? '开启闪避' : '关闭闪避')} />
            {audio.duck && <NumberField label="闪避到" value={audio.duck.level} scale={100} suffix="%" step={0.01} min={0} max={1} digits={0} ops={(v) => tu({ duck: { ...audio.duck, level: v } })} editLabel="闪避音量" />}
          </div>
        )}
      </>}
      {kind === 'main' && <p className="dj-hint">主轨片段首尾相接；锁定后 AI 也不能修改此轨。</p>}
    </Section>
  );
}

function MarkerInspector({ m, fps }: { m: Marker; fps: number }) {
  const { commit } = useEdit();
  const ed = useEditor();
  const [label, setLabel] = useState(m.label ?? '');
  useEffect(() => setLabel(m.label ?? ''), [m.id, m.label]);
  const mu = (patch: Record<string, unknown>): Op[] => [{ op: 'updateMarker', id: m.id, patch }];
  return (
    <>
      <Header icon="marker" title={m.label || '标记'} sub={timecode(m.t, fps)}>
        <button className="dj-icon-btn" title="删除标记" aria-label="删除标记" onClick={() => { commit([{ op: 'removeMarker', id: m.id }], '删除标记'); ed.sel.clear(); }}><Icon name="trash" /></button>
      </Header>
      <Section title="标记">
        <Field label="备注（AI 也能看到）">
          <input className="dj-input" value={label} maxLength={80} placeholder="例如：这里换音乐" onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') e.currentTarget.blur(); }}
            onBlur={() => { if (label !== (m.label ?? '')) commit(mu({ label }), '标记备注'); }} />
        </Field>
        <div className="dj-grid" style={{ marginTop: 8 }}>
          <NumberField label="时间" value={m.t} step={1 / fps} min={0} suffix="s" ops={(v) => mu({ t: v })} editLabel="移动标记" />
          <ColorField label="颜色" value={m.color ?? '#ef4444'} onChange={(v) => commit(mu({ color: v }), '标记颜色')} />
        </div>
        <button className="dj-btn" style={{ marginTop: 8 }} onClick={() => ed.clock.seek(m.t)}>定位到此标记</button>
      </Section>
    </>
  );
}

const RATIOS: [string, number, number][] = [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080], ['4:3', 1440, 1080], ['3:4', 1080, 1440], ['21:9', 2560, 1080]];

function ProjectInspector({ timeline }: { timeline: Timeline }) {
  const { commit } = useEdit();
  const project = useStore((s) => s.project);
  const { meta } = timeline;
  const total = timeline.videoTracks[0].clips.reduce((n, c) => n + c.clipDuration, 0);
  const counts = [
    timeline.videoTracks.reduce((n, t) => n + t.clips.length, 0) + ' 段画面',
    timeline.audioTracks.reduce((n, t) => n + t.clips.length, 0) + ' 段音频',
    timeline.overlays.length + ' 条文字',
    (timeline.markers ?? []).length + ' 个标记',
  ];
  const setMeta = (patch: Record<string, unknown>, label: string) => commit([{ op: 'setMeta', patch }], label);
  return (
    <>
      <Header icon="settings" title={project?.name ?? '项目'} sub={meta.width + '×' + meta.height + ' · ' + meta.fps + 'fps · ' + timecode(total, meta.fps, false)} />
      <Section title="画布比例">
        <div className="dj-chips">
          {RATIOS.map(([label, w, h]) => <button key={label} type="button" className="dj-chip" aria-pressed={meta.width * h === meta.height * w} onClick={() => setMeta({ width: w, height: h }, '画布 ' + label)}>{label}</button>)}
        </div>
        <div className="dj-grid" style={{ marginTop: 8 }}>
          <NumberField label="宽" value={meta.width} step={2} min={16} max={7680} digits={0} suffix="px" ops={(v) => [{ op: 'setMeta', patch: { width: Math.round(v / 2) * 2 } }]} editLabel="画布宽度" />
          <NumberField label="高" value={meta.height} step={2} min={16} max={7680} digits={0} suffix="px" ops={(v) => [{ op: 'setMeta', patch: { height: Math.round(v / 2) * 2 } }]} editLabel="画布高度" />
        </div>
      </Section>
      <Section title="帧率">
        <Seg label="帧率" value={String(meta.fps)} options={[['24', '24'], ['25', '25'], ['30', '30'], ['50', '50'], ['60', '60']]} onChange={(v) => setMeta({ fps: Number(v) }, '帧率 ' + v)} />
      </Section>
      <Section title="背景">
        <ColorField label="画布背景色（画面没铺满时可见）" value={meta.background ?? '#000000'} onChange={(v) => setMeta({ background: v }, '背景色')} />
      </Section>
      <Section title="概况"><p className="dj-hint">{counts.join(' · ')}</p><p className="dj-hint">选中时间线上的片段、文字或标记即可编辑它的属性；Ctrl/Shift 点击可多选。</p></Section>
    </>
  );
}

function MultiInspector({ timeline, actions }: { timeline: Timeline; actions: Actions }) {
  const ed = useEditor();
  const { commit } = useEdit();
  const { items } = useSelection(ed.sel);
  const clips = items.filter((s) => s.kind === 'clip').map((s) => locateClip(timeline, s.id)).filter((l): l is NonNullable<typeof l> => Boolean(l));
  const overlays = items.filter((s) => s.kind === 'overlay').map((s) => timeline.overlays.find((o) => o.id === s.id)).filter((o): o is NonNullable<typeof o> => Boolean(o));
  const audible = clips.filter((l) => l.kind === 'audio' || l.clip.type === 'video');
  const fadeOps = (key: 'fadeIn' | 'fadeOut', v: number): Op[] => audible.map((l) => ({ op: 'updateClip', id: l.clip.id, patch: { [key]: Math.min(v, l.duration / 2) } }));
  return (
    <>
      <Header icon="layers" title={'已选 ' + items.length + ' 项'} sub={[clips.length && clips.length + ' 个片段', overlays.length && overlays.length + ' 条文字'].filter(Boolean).join(' · ')} />
      <Section title="批量操作">
        <div className="dj-chips">
          <button className="dj-chip" onClick={actions.duplicateSelection}>创建副本</button>
          <button className="dj-chip" onClick={actions.copy}>复制</button>
          <button className="dj-chip" onClick={() => actions.askAi() || ed.store.toast('info', '当前宿主不支持插入到对话框')}>交给 AI</button>
          <button className="dj-chip" style={{ color: 'var(--dj-danger)' }} onClick={actions.deleteSelection}>删除</button>
        </div>
      </Section>
      {audible.length > 0 && (
        <Section title={'声音（' + audible.length + ' 段）'}>
          <div className="dj-grid">
            <NumberField label="统一音量" value={audible[0].clip.volume} scale={100} suffix="%" step={0.01} min={0} max={1} digits={0} ops={(v) => audible.map((l) => ({ op: 'updateClip', id: l.clip.id, patch: { volume: v } }))} editLabel="批量音量" />
            <NumberField label="统一淡入" value={audible[0].clip.fadeIn ?? 0} step={0.05} min={0} max={10} suffix="s" ops={(v) => fadeOps('fadeIn', v)} editLabel="批量淡入" />
            <NumberField label="统一淡出" value={audible[0].clip.fadeOut ?? 0} step={0.05} min={0} max={10} suffix="s" ops={(v) => fadeOps('fadeOut', v)} editLabel="批量淡出" />
          </div>
        </Section>
      )}
      {overlays.length > 1 && (
        <Section title={'文字（' + overlays.length + ' 条）'}>
          <div className="dj-grid">
            <NumberField label="统一字号" value={overlays[0].fontSize} step={1} min={4} max={2000} digits={0} suffix="px" ops={(v) => overlays.map((o) => ({ op: 'updateOverlay', id: o.id, patch: { fontSize: Math.round(v) } }))} editLabel="批量字号" />
            <ColorField label="统一颜色" value={overlays[0].color} onChange={(v) => commit(overlays.map((o) => ({ op: 'updateOverlay', id: o.id, patch: { color: v } })), '批量颜色')} />
          </div>
        </Section>
      )}
    </>
  );
}

export function Inspector({ actions, section, onSection }: { actions: Actions; section?: string; onSection: (s?: string) => void }) {
  const ed = useEditor();
  const timeline = useStore((s) => s.timeline);
  const { items, primary } = useSelection(ed.sel);
  const now = useInspectTime();
  const [clipTab, setClipTab] = useState<ClipTab>('picture');
  const [textTab, setTextTab] = useState<TextTab>('text');
  // 外部（时间线双击/右键“转场…”）指定要打开的分页
  useEffect(() => {
    if (!section) return;
    if (section === 'transition' || section === 'animation' || section === 'color' || section === 'speed' || section === 'audio' || section === 'picture') setClipTab(section as ClipTab);
    if (section === 'text' || section === 'layout') setTextTab(section as TextTab);
    onSection(undefined);
  }, [section, onSection]);
  if (!timeline) return <div className="dj-empty-state">正在加载…</div>;
  const fps = timeline.meta.fps;
  let body: React.ReactNode;
  if (items.length > 1) body = <MultiInspector timeline={timeline} actions={actions} />;
  else if (!primary) body = <ProjectInspector timeline={timeline} />;
  else if (primary.kind === 'clip') {
    const loc = locateClip(timeline, primary.id);
    if (!loc) body = <div className="dj-empty-state">该片段已被删除</div>;
    else if (loc.kind === 'audio') {
      const track = timeline.audioTracks[loc.trackIndex];
      body = <>
        <Header icon="music" title={srcLabel(loc.clip.src)} sub={'音频 · ' + timecode(loc.start, fps) + ' – ' + timecode(loc.start + loc.duration, fps)} />
        <AudioInspector clip={loc.clip} track={track} start={loc.start} timeline={timeline} now={now} />
      </>;
    } else {
      const track = timeline.videoTracks[loc.trackIndex];
      const ctx = { clip: loc.clip, start: loc.start, isMain: loc.trackIndex === 0, index: loc.index, locked: Boolean(track.locked) };
      const tabs = clipTabs(ctx);
      const tab = tabs.some(([k]) => k === clipTab) ? clipTab : tabs[0][0];
      body = <>
        <Header icon={loc.clip.type === 'image' ? 'image' : 'film'} title={srcLabel(loc.clip.src)} sub={(ctx.isMain ? '主轨' : '画中画') + ' · ' + timecode(loc.start, fps) + ' – ' + timecode(loc.start + loc.duration, fps)}>
          <button className="dj-icon-btn" title="交给 AI" aria-label="交给 AI" onClick={() => actions.askAi() || ed.store.toast('info', '当前宿主不支持插入到对话框')}><Icon name="sparkle" /></button>
        </Header>
        {track.locked && <p className="dj-banner" style={{ margin: '0 0 8px' }}>此轨道已锁定，解锁后才能修改。</p>}
        <Tabs tabs={tabs} value={tab} onChange={setClipTab} />
        <ClipInspector c={ctx} tab={tab} timeline={timeline} now={now} />
        {tab === 'picture' && <TrackSection track={track} kind={ctx.isMain ? 'main' : 'pip'} />}
      </>;
    }
  } else if (primary.kind === 'overlay') {
    const o = timeline.overlays.find((x) => x.id === primary.id);
    body = !o ? <div className="dj-empty-state">该文字已被删除</div> : <>
      <Header icon="text" title={o.text.slice(0, 24) || '（空文字）'} sub={(o.kind === 'title' ? '标题' : '字幕') + ' · ' + timecode(o.startSeconds, fps) + ' – ' + timecode(o.endSeconds, fps)}>
        <button className="dj-icon-btn" title="交给 AI" aria-label="交给 AI" onClick={() => actions.askAi() || ed.store.toast('info', '当前宿主不支持插入到对话框')}><Icon name="sparkle" /></button>
      </Header>
      <Tabs tabs={TEXT_TABS} value={textTab} onChange={setTextTab} />
      <TextInspector o={o} tab={textTab} timeline={timeline} now={now} />
    </>;
  } else if (primary.kind === 'marker') {
    const m = (timeline.markers ?? []).find((x) => x.id === primary.id);
    body = m ? <MarkerInspector m={m} fps={fps} /> : <div className="dj-empty-state">该标记已被删除</div>;
  } else {
    const vi = timeline.videoTracks.findIndex((t) => t.id === primary.id);
    const at = timeline.audioTracks.find((t) => t.id === primary.id);
    body = vi >= 0 ? <><Header icon="layers" title={timeline.videoTracks[vi].name ?? (vi === 0 ? '主轨' : '画中画')} /><TrackSection track={timeline.videoTracks[vi]} kind={vi === 0 ? 'main' : 'pip'} /></>
      : at ? <><Header icon="music" title={at.name ?? '音频'} /><TrackSection track={at} kind="audio" /></>
      : <div className="dj-empty-state">该轨道已被删除</div>;
  }
  return <div className="dj-inspector">{body}</div>;
}
