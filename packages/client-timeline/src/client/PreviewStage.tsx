import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import type { Timeline } from '../../../engine/src/schema';
import { PreviewVideo } from './PreviewVideo';
import { usePlayerBus } from './bus';

function ReportFailure({ error, report }: { error: Error; report: (error: Error) => void }) {
  useEffect(() => report(error), [error, report]);
  return null;
}

export function PreviewStage({ timeline, durationInFrames, onOpenAssets }: {
  timeline: Timeline; durationInFrames: number; onOpenAssets: () => void;
}) {
  const playerBus = usePlayerBus();
  const [failure, setFailure] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const initialFrame = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const player = useRef<PlayerRef | null>(null);
  const attach = useCallback((value: PlayerRef | null) => {
    if (value) playerBus.ref = value;
    else if (playerBus.ref === player.current) playerBus.ref = null;
    player.current = value;
  }, [playerBus]);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const pauseWhenHidden = () => {
      const fullscreen = document.fullscreenElement && stage.contains(document.fullscreenElement);
      if (document.hidden || (!fullscreen && (!stage.getClientRects().length || getComputedStyle(stage).visibility === 'hidden'))) {
        player.current?.pause();
      }
    };
    // Host tabs often keep their inactive editors mounted with display:none.
    // Pause them without resetting position or resuming unexpectedly on return.
    const resize = new ResizeObserver(pauseWhenHidden);
    const intersection = new IntersectionObserver(pauseWhenHidden);
    const attributes = new MutationObserver(pauseWhenHidden);
    for (let ancestor: HTMLElement | null = stage; ancestor; ancestor = ancestor.parentElement) {
      attributes.observe(ancestor, { attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
    }
    resize.observe(stage);
    intersection.observe(stage);
    document.addEventListener('visibilitychange', pauseWhenHidden);
    pauseWhenHidden();
    return () => {
      resize.disconnect();
      intersection.disconnect();
      attributes.disconnect();
      document.removeEventListener('visibilitychange', pauseWhenHidden);
    };
  }, []);
  const report = useCallback((error: Error) => {
    initialFrame.current = player.current?.getCurrentFrame() ?? initialFrame.current;
    player.current?.pause();
    setFailure(error.message);
  }, []);
  const retry = useCallback(() => {
    initialFrame.current = Math.max(0, Math.min(durationInFrames - 1, player.current?.getCurrentFrame() ?? initialFrame.current));
    setFailure(null);
    setAttempt(value => value + 1);
  }, [durationInFrames]);
  // Replacing/removing a bad source should recover without a second explicit retry.
  const sources = JSON.stringify([...timeline.videoTracks, ...timeline.audioTracks].flatMap(track => track.clips.map(clip => clip.src)));
  const previousSources = useRef(sources);
  useEffect(() => {
    if (previousSources.current !== sources && failure) retry();
    previousSources.current = sources;
  }, [sources, failure, retry]);
  return <div className="djp-stage" ref={stageRef}>
    <Player
      key={`${attempt}-${timeline.meta.fps}-${timeline.meta.width}-${timeline.meta.height}`}
      ref={attach}
      component={PreviewVideo}
      inputProps={{ timeline }}
      initialFrame={Math.min(initialFrame.current, durationInFrames - 1)}
      durationInFrames={durationInFrames}
      fps={timeline.meta.fps}
      compositionWidth={timeline.meta.width}
      compositionHeight={timeline.meta.height}
      errorFallback={({ error }: { error: Error }) => <ReportFailure error={error} report={report} />}
      controls={false}
      acknowledgeRemotionLicense
      style={{ width: '100%', height: '100%' }}
    />
    {failure && <div className="djp-preview-error" role="alert">
      <strong>预览暂时不可用</strong>
      <span>{failure.startsWith('无法加载素材「') ? failure : '画面加载失败，请重试。'}</span>
      <small>请检查素材是否存在，以及浏览器是否支持该格式。</small>
      <div><button className="djp-btn" onClick={retry}>重试预览</button><button className="djp-btn" onClick={onOpenAssets}>打开素材库</button></div>
    </div>}
  </div>;
}
