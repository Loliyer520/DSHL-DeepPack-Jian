import React from 'react';

const paths = {
  play: 'm7 4 14 8-14 8z',
  pause: 'M7 4v16M17 4v16',
  scissors: 'M9 9 20 3M9 15 20 21M4 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0 10a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  music: 'M9 18V5l11-2v13M9 9l11-2M9 18a3 3 0 1 1-3-3c1.7 0 3 1 3 3zm11-2a3 3 0 1 1-3-3c1.7 0 3 1 3 3z',
  text: 'M4 7V4h16v3M12 4v16M8 20h8',
  layers: 'M3 3h15v15H3zM7 21h14V7M6 14l3-4 3 3 2-2 2 3',
  library: 'M3 5h7l2 2h9v13H3zM10 11v6m-3-3h6',
  magnet: 'M5 4v9a7 7 0 0 0 14 0V4h-4v9a3 3 0 0 1-6 0V4zM5 8h4m6 0h4',
  fit: 'M8 5H4v14h4m8-14h4v14h-4M8 12h8m-6-3-3 3 3 3m4-6 3 3-3 3',
  expand: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
  collapse: 'M3 8h5V3m8 0v5h5M8 21v-5H3m18 0h-5v5',
  undo: 'M9 5 4 10l5 5M4 10h10a6 6 0 0 1 6 6v3',
  redo: 'm15 5 5 5-5 5m5-5H10a6 6 0 0 0-6 6v3',
  plus: 'M12 5v14M5 12h14',
  close: 'm6 6 12 12M18 6 6 18',
  split: 'M12 3v18M4 6h4v12H4zm12 0h4v12h-4z',
  volume: 'm11 5-5 4H3v6h3l5 4zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  muted: 'm11 5-5 4H3v6h3l5 4zm5 4 5 6m0-6-5 6',
  grip: 'M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01',
  film: 'M4 4h16v16H4zM8 4v16M16 4v16M4 9h4m-4 6h4m8-6h4m-4 6h4',
};

export function Icon({ name }: { name: keyof typeof paths }) {
  return <svg className="djp-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={name === 'grip' ? 3 : 1.65} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]} /></svg>;
}
