import React from 'react';

// 统一线性图标（24 网格，currentColor）
const paths = {
  play: 'm7 4 14 8-14 8z',
  pause: 'M7 4v16M17 4v16',
  prevFrame: 'M6 5v14M18 6l-8 6 8 6z',
  nextFrame: 'M18 5v14M6 6l8 6-8 6z',
  prevEdit: 'M5 5v14M19 5l-9 7 9 7',
  nextEdit: 'M19 5v14M5 5l9 7-9 7',
  undo: 'M9 5 4 10l5 5M4 10h10a6 6 0 0 1 6 6v3',
  redo: 'm15 5 5 5-5 5m5-5H10a6 6 0 0 0-6 6v3',
  split: 'M12 3v18M4 7h5v10H4zm11 0h5v10h-5z',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
  copy: 'M8 8h12v12H8zM4 16V4h12',
  duplicate: 'M8 8h12v12H8zM4 16V4h12M14 11v6m-3-3h6',
  plus: 'M12 5v14M5 12h14',
  close: 'm6 6 12 12M18 6 6 18',
  magnet: 'M5 4v9a7 7 0 0 0 14 0V4h-4v9a3 3 0 0 1-6 0V4zM5 8h4m6 0h4',
  fit: 'M8 5H4v14h4m8-14h4v14h-4M8 12h8',
  zoomIn: 'M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15zM16 16l5 5M10.5 7v7M7 10.5h7',
  zoomOut: 'M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15zM16 16l5 5M7 10.5h7',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
  unlock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 7.5-2',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  eyeOff: 'M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6C3.8 8.4 2 12 2 12s4 7 10 7a9.8 9.8 0 0 0 5.4-1.6',
  volume: 'm11 5-5 4H3v6h3l5 4zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  muted: 'm11 5-5 4H3v6h3l5 4zm5 4 5 6m0-6-5 6',
  film: 'M4 4h16v16H4zM8 4v16M16 4v16M4 9h4m-4 6h4m8-6h4m-4 6h4',
  layers: 'M12 3 2 8l10 5 10-5zM2 13l10 5 10-5',
  music: 'M9 18V5l11-2v13M9 9l11-2M9 18a3 3 0 1 1-3-3c1.7 0 3 1 3 3zm11-2a3 3 0 1 1-3-3c1.7 0 3 1 3 3z',
  text: 'M4 7V4h16v3M12 4v16M8 20h8',
  image: 'M3 3h18v18H3zM3 16l5-5 5 5 3-3 5 5M15 7h.01',
  marker: 'M6 3h12v13l-6 5-6-5z',
  history: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 3',
  export: 'M12 3v12m0-12-4 4m4-4 4 4M4 15v5h16v-5',
  upload: 'M12 15V3m0 0-4 4m4-4 4 4M4 15v5h16v-5',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  expand: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
  collapse: 'M3 8h5V3m8 0v5h5M8 21v-5H3m18 0h-5v5',
  sliders: 'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4',
  activity: 'M3 12h4l3-8 4 16 3-8h4',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z',
  focus: 'M4 8V4h4m8 0h4v4m0 8v4h-4M8 20H4v-4',
  library: 'M3 5h7l2 2h9v13H3z',
  grip: 'M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01',
  chevron: 'm9 6 6 6-6 6',
  check: 'm5 12 5 5 9-10',
  keyframe: 'M12 3l9 9-9 9-9-9z',
  scissors: 'M9 9 20 3M9 15 20 21M4 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0 10a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  wand: 'M15 4V2m0 8V8m-4-2h2m4 0h2M3 21l12-12M17.5 8.5l1-1',
  keyboard: 'M2 6h20v12H2zM6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10',
  settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z',
} as const;
export type IconName = keyof typeof paths;

export function Icon({ name, className, title }: { name: IconName; className?: string; title?: string }) {
  const filled = name === 'keyframe' || name === 'marker';
  return (
    <svg className={'dj-icon' + (className ? ' ' + className : '')} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor"
      strokeWidth={name === 'more' || name === 'grip' ? 3 : 1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}>
      {title && <title>{title}</title>}
      <path d={paths[name]} />
    </svg>
  );
}
