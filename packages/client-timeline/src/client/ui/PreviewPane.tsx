// 预览区：Remotion Player（与导出同一合成）+ 画布直接操作（见 StageCanvas：点选、拖动、缩放、旋转、就地改字）
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { TimelineVideo } from '../../../../engine/src/TimelineVideo';
import { timelineDurationInFrames, timelineHasContent } from '../../../../engine/src/timeline';
import { assetBaseUrl, fontsBaseUrl, mediaUrl } from '../engine';
import { useEditor, useStore } from '../context';
import type { Actions } from '../actions';
import { StageCanvas, type Rect } from './StageCanvas';

function ErrorCatcher({ error, onError }: { error: Error; onError: (e: Error) => void }) {
  useEffect(() => onError(error), [error, onError]);
  return null;
}

export function PreviewPane({ actions }: { actions: Actions }) {
  const ed = useEditor();
  const timeline = useStore((s) => s.timeline);
  const project = useStore((s) => s.project);
  const playerRef = useRef<PlayerRef | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [failure, setFailure] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const attach = useCallback((ref: PlayerRef | null) => { playerRef.current = ref; ed.clock.attach(ref); }, [ed.clock]);
  useEffect(() => { if (!ed.host.visible) ed.clock.pause(); }, [ed.host.visible, ed.clock]);
  // 浏览器在 Range 请求被中断时也会报媒体错误（数据其实已缓冲好、仍可播放）：先确认素材确实读不到再提示
  const pid = project?.id;
  const onMediaError = useCallback((src: string) => {
    const name = decodeURIComponent(String(src).split('/').pop() ?? src);
    const show = () => setFailure('无法加载素材「' + name + '」');
    if (!pid) { show(); return; }
    fetch(mediaUrl(pid, name), { method: 'HEAD', signal: AbortSignal.timeout(8000) })
      .then((r) => { if (!r.ok) show(); })
      .catch(show);
  }, [pid]);
  const inputProps = useMemo(() => (timeline && project ? { timeline, assetBase: assetBaseUrl(project.id), fontsBase: fontsBaseUrl(), onMediaError } : null), [timeline, project, onMediaError]);
  if (!timeline || !inputProps) return <div className="dj-stage-empty">正在连接剪辑引擎…</div>;
  ed.clock.fps = timeline.meta.fps;
  const duration = Math.max(1, timelineDurationInFrames(timeline));
  const ar = timeline.meta.width / timeline.meta.height;
  const dw = Math.min(size.w, size.h * ar), dh = dw / ar;
  const rect: Rect = { left: (size.w - dw) / 2, top: (size.h - dh) / 2, width: dw, height: dh };
  return (
    <div className="dj-stage" ref={wrap}>
      <Player
        key={attempt + '-' + timeline.meta.fps + '-' + timeline.meta.width + 'x' + timeline.meta.height}
        ref={attach}
        component={TimelineVideo as unknown as React.FC<Record<string, unknown>>}
        inputProps={inputProps as unknown as Record<string, unknown>}
        durationInFrames={duration}
        initialFrame={Math.min(ed.clock.frame, duration - 1)}
        fps={timeline.meta.fps}
        compositionWidth={timeline.meta.width}
        compositionHeight={timeline.meta.height}
        controls={false}
        clickToPlay={false}
        doubleClickToFullscreen={false}
        spaceKeyToPlayOrPause={false}
        errorFallback={({ error }: { error: Error }) => <ErrorCatcher error={error} onError={(e) => setFailure(e.message)} />}
        acknowledgeRemotionLicense
        style={{ width: '100%', height: '100%' }}
      />
      {!timelineHasContent(timeline) && <div className="dj-stage-empty"><b>从素材库拖入视频、图片或音频开始剪辑</b><span>也可以直接在对话里让 AI 帮你剪</span></div>}
      {rect.width > 0 && <StageCanvas rect={rect} timeline={timeline} stage={wrap} actions={actions} />}
      {failure && (
        <div className="dj-stage-error" role="alert">
          <b>预览暂时不可用</b><span>{failure}</span>
          <button className="dj-btn" onClick={() => { setFailure(null); setAttempt((a) => a + 1); }}>重试预览</button>
        </div>
      )}
    </div>
  );
}
