import React from 'react';
import type { Timeline } from '../../../engine/src/schema';
import { TimelineVideo } from '../../../engine/src/TimelineVideo';
import { API_BASE } from './api';

// Preview and export share every visual/audio operation; only asset URLs differ.
export const PreviewVideo: React.FC<{ timeline: Timeline }> = ({ timeline }) => (
  <TimelineVideo timeline={timeline} directSources fontsBase={API_BASE + '/fonts'} />
);
