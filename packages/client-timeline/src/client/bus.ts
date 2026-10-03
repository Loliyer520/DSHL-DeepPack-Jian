import type { PlayerRef } from '@remotion/player';
import { createContext, useContext } from 'react';

export interface PlayerBus {
  ref: PlayerRef | null;
  seekToSeconds: (seconds: number, fps: number) => void;
}

// Each mounted editor owns its controls. Hidden sibling panels must not replace
// another project's player reference or reset it during unmount.
export function createPlayerBus(): PlayerBus {
  const bus: PlayerBus = {
    ref: null,
    seekToSeconds: (seconds, fps) => bus.ref?.seekTo(Math.round(seconds * fps)),
  };
  return bus;
}

export const PlayerBusContext = createContext<PlayerBus | null>(null);
export function usePlayerBus(): PlayerBus {
  const bus = useContext(PlayerBusContext);
  if (!bus) throw new Error('Player controls must be inside an editor panel');
  return bus;
}
