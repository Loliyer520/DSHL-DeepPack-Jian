// 编辑器根布局：随面板宽度切换 窄（单列+底部抽屉）/ 中（右侧属性栏）/ 宽（左素材+右属性，时间线通栏）；
// 键盘快捷键只在焦点位于面板内时生效（不抢聊天输入框的按键）。
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { timelineDurationInFrames } from '../../../engine/src/timeline';
import { createActions } from './actions';
import { useEditor, useStore } from './context';
import { PresenceReporter, useSelection } from './selection';
import { Icon } from './Icon';
import { PreviewPane } from './ui/PreviewPane';
import { TransportBar } from './ui/TransportBar';
import { TimelinePane, type TimelineApi } from './timeline/TimelinePane';
import { Inspector } from './ui/inspector/Inspector';
import { AssetsPane } from './ui/AssetsPane';
import { ActivityPane } from './ui/ActivityPane';
import { ExportDialog, HistoryDialog, ShortcutsDialog } from './ui/Dialogs';
import { Toasts, TopBar } from './ui/TopBar';

type Size = 'narrow' | 'medium' | 'wide';
type SideTab = 'inspector' | 'assets' | 'activity';
const SIDE_LABEL: Record<SideTab, string> = { inspector: '属性', assets: '素材', activity: '动态' };

const isTyping = (el: EventTarget | null) => {
  const t = el as HTMLElement | null;
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
};

function SideTabs({ tabs, value, onChange, onClose }: { tabs: SideTab[]; value: SideTab; onChange: (t: SideTab) => void; onClose?: () => void }) {
  const activity = useStore((s) => s.activity);
  const ai = useStore((s) => s.ai);
  const [seen, setSeen] = useState(0);
  const latestAi = activity.find((a) => a.actor === 'ai')?.rev ?? 0;
  useEffect(() => { if (value === 'activity') setSeen(latestAi); }, [value, latestAi]);
  return (
    <div className="dj-tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t} role="tab" aria-selected={value === t} onClick={() => onChange(t)}>
          {SIDE_LABEL[t]}{t === 'activity' && (ai || latestAi > seen) && value !== 'activity' ? <span className="dj-dot" aria-label="有新的 AI 修改" /> : null}
        </button>
      ))}
      {onClose && <button className="dj-icon-btn" aria-label="收起" onClick={onClose}><Icon name="close" /></button>}
    </div>
  );
}

export function Workspace() {
  const ed = useEditor();
  const status = useStore((s) => s.status);
  const error = useStore((s) => s.error);
  const timeline = useStore((s) => s.timeline);
  const project = useStore((s) => s.project);
  const { items } = useSelection(ed.sel);
  const actions = useMemo(() => createActions(ed), [ed]);
  const root = useRef<HTMLDivElement>(null);
  const tlApi = useRef<TimelineApi | null>(null);
  const [size, setSize] = useState<Size>('medium');
  const [side, setSide] = useState<SideTab>('inspector');
  const [left, setLeft] = useState<SideTab>('assets');
  const [sheet, setSheet] = useState<SideTab | null>(null);
  const [dialog, setDialog] = useState<'export' | 'history' | 'shortcuts' | null>(null);
  const [section, setSection] = useState<string | undefined>();

  // 尺寸档位
  useEffect(() => {
    const el = root.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const w = e.contentRect.width;
      setSize(w < 640 ? 'narrow' : w < 1100 ? 'medium' : 'wide');
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 生命周期：连接引擎 / 播放时钟；面板不可见时停掉 rAF 并暂停
  useEffect(() => { void ed.store.start(); return () => ed.store.stop(); }, [ed.store]);
  useEffect(() => {
    if (ed.host.visible) { ed.clock.start(); return () => ed.clock.stop(); }
    ed.clock.pause();
    return undefined;
  }, [ed.host.visible, ed.clock]);
  useEffect(() => { if (timeline) { ed.sel.prune(timeline); ed.clock.fps = timeline.meta.fps; } }, [timeline, ed.sel, ed.clock]);

  // 在场上报：选中/播放头（暂停时）/可见性 → 服务端，AI 下一轮能看到“你正在看哪里”
  const reporter = useMemo(() => new PresenceReporter(() => ed.store.project?.id ?? null, ed.store.clientId), [ed.store]);
  useEffect(() => { reporter.report({ timeline, items, playhead: ed.clock.time(), mode: 'edit', visible: ed.host.visible }); }, [reporter, timeline, items, ed.host.visible, ed.clock]);
  useEffect(() => ed.clock.subscribe((sec, playing) => { if (!playing) reporter.report({ timeline: ed.store.current, items: ed.sel.getSnapshot().items, playhead: sec, mode: 'edit', visible: ed.host.visible }); }), [reporter, ed]);

  const inspect = useCallback((s?: string) => {
    setSection(s);
    if (size === 'narrow') setSheet('inspector'); else setSide('inspector');
  }, [size]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (isTyping(e.target) || dialog) return;
    const mod = e.ctrlKey || e.metaKey;
    const t = ed.store.current;
    const fps = t?.meta.fps ?? 30;
    const total = t ? timelineDurationInFrames(t) / fps : 0;
    const seek = (s: number) => { ed.clock.pause(); ed.clock.seek(Math.max(0, Math.min(total, s))); };
    const k = e.key;
    let handled = true;
    if (k === ' ') ed.clock.toggle();
    else if (mod && (k === 'z' || k === 'Z')) { if (e.shiftKey) ed.store.redo(); else ed.store.undo(); }
    else if (mod && (k === 'y' || k === 'Y')) ed.store.redo();
    else if (mod && (k === 'c' || k === 'C')) actions.copy();
    else if (mod && (k === 'v' || k === 'V')) actions.paste();
    else if (mod && (k === 'd' || k === 'D')) actions.duplicateSelection();
    else if (mod && (k === 'a' || k === 'A')) actions.selectAll();
    else if (mod && (k === 'b' || k === 'B')) actions.splitAtPlayhead();
    else if (mod && k === 'Enter') { if (!actions.askAi()) ed.store.toast('info', '当前宿主不支持插入到对话框'); }
    else if (mod) handled = false;
    else if (e.altKey && (k === 'ArrowLeft' || k === 'ArrowRight')) actions.nudge((k === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 10 : 1) / fps);
    else if (k === 'ArrowLeft' || k === 'ArrowRight') seek(ed.clock.time() + (k === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 1 : 1 / fps));
    else if (k === 'ArrowUp' || k === 'ArrowDown') actions.jumpEdit(k === 'ArrowUp' ? -1 : 1);
    else if (k === 'Home') seek(0);
    else if (k === 'End') seek(total);
    else if (k === 'j' || k === 'J') seek(ed.clock.time() - 1);
    else if (k === 'k' || k === 'K') ed.clock.pause();
    else if (k === 'l' || k === 'L') ed.clock.play();
    else if (k === 's' || k === 'S') actions.splitAtPlayhead();
    else if (k === 'Delete' || k === 'Backspace') actions.deleteSelection();
    else if (k === 'q' || k === 'Q') actions.trimToPlayhead('start');
    else if (k === 'w' || k === 'W') actions.trimToPlayhead('end');
    else if (k === 't' || k === 'T') actions.addText('subtitle');
    else if (k === 'm' || k === 'M') actions.addMarker();
    else if (k === 'n' || k === 'N') tlApi.current?.toggleSnap();
    else if (k === '+' || k === '=') tlApi.current?.zoom(1.4);
    else if (k === '-' || k === '_') tlApi.current?.zoom(1 / 1.4);
    else if (k === 'Z' && e.shiftKey) tlApi.current?.fit();
    else if (k === '?') setDialog('shortcuts');
    else if (k === 'Escape') { if (sheet) setSheet(null); else ed.sel.clear(); }
    else handled = false;
    if (handled) { e.preventDefault(); e.stopPropagation(); }
  };

  const compact = size === 'narrow';
  let body: React.ReactNode;
  if (!project || !timeline) {
    body = (
      <div className="dj-empty-state" style={{ gridArea: 'stage', alignSelf: 'center' }}>
        {status === 'error'
          ? <><p>无法连接 D剪 剪辑引擎：{error}</p><p className="dj-hint">请确认启动器已启动「djian-engine」服务（或在终端运行 npm run start:engine），然后重试。</p><button className="dj-btn dj-primary" onClick={() => void ed.store.start()}>重新连接</button></>
          : <p>正在连接剪辑引擎…</p>}
      </div>
    );
  } else {
    const sideTabs: SideTab[] = size === 'wide' ? ['inspector'] : ['inspector', 'assets', 'activity'];
    const leftTabs: SideTab[] = ['assets', 'activity'];
    const pane = (t: SideTab) => t === 'inspector' ? <div className="dj-pane"><Inspector actions={actions} section={section} onSection={setSection} /></div> : t === 'assets' ? <AssetsPane actions={actions} /> : <ActivityPane />;
    body = (
      <>
        {status === 'readonly' && <div className="dj-banner" style={{ gridArea: 'top', alignSelf: 'end' }}>{error ?? '项目为只读'}</div>}
        <div className="dj-stagewrap"><PreviewPane /></div>
        <TransportBar actions={actions} />
        <TimelinePane actions={actions} compact={compact} onInspect={inspect} apiRef={tlApi} />
        {size === 'wide' && <div className="dj-left"><SideTabs tabs={leftTabs} value={left} onChange={setLeft} />{pane(left)}</div>}
        {size === 'wide' && <div className="dj-side"><div className="dj-side-title">属性</div>{pane('inspector')}</div>}
        {size === 'medium' && <div className="dj-side"><SideTabs tabs={sideTabs} value={side} onChange={setSide} />{pane(side)}</div>}
        {size === 'narrow' && <div className="dj-side" hidden={!sheet}>{sheet && <><SideTabs tabs={sideTabs} value={sheet} onChange={setSheet} onClose={() => setSheet(null)} />{pane(sheet)}</>}</div>}
      </>
    );
  }
  return (
    <div ref={root} className={'dj-root dj-' + size} tabIndex={-1} onKeyDown={onKeyDown}
      onPointerDown={(e) => { if (!isTyping(e.target) && !(e.target as HTMLElement).closest('button,a,[tabindex]')) root.current?.focus({ preventScroll: true }); }}>
      <TopBar actions={actions} onDialog={setDialog} narrowTabs={compact && project ? (['inspector', 'assets', 'activity'] as SideTab[]).map((k) => [k, SIDE_LABEL[k]]) : undefined} sheet={sheet} onSheet={(s) => setSheet(s as SideTab | null)} />
      {body}
      <Toasts />
      {dialog === 'export' && <ExportDialog onClose={() => setDialog(null)} />}
      {dialog === 'history' && <HistoryDialog onClose={() => setDialog(null)} />}
      {dialog === 'shortcuts' && <ShortcutsDialog onClose={() => setDialog(null)} />}
    </div>
  );
}
