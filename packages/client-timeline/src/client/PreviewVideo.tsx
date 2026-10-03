import React from 'react';
import type { Timeline } from '../../../engine/src/schema';
import { TimelineVideo } from '../../../engine/src/TimelineVideo';
import { API_BASE } from './api';

// Preview and export share every visual/audio operation; only asset URLs differ.
export const PreviewVideo: React.FC<{ timeline: Timeline }> = ({ timeline }) => {
  const [error, setError] = React.useState<Error | null>(null);
  const onMediaError = React.useCallback((src: string) => {
    let name = src;
    try { name = decodeURIComponent(new URL(src, window.location.href).pathname.split('/').pop() ?? src); } catch { /* Keep the original name. */ }
    setError(new Error(`无法加载素材「${name}」`));
  }, []);
  if (error) throw error;
  return <TimelineVideo timeline={timeline} directSources fontsBase={API_BASE + '/fonts'} onMediaError={onMediaError} />;
};
