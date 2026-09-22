import type { PlayerRef } from "@remotion/player";

// Preview 与轨道条共享的 Player 引用总线（PreviewPanel 挂载时注册）
export const playerBus: { ref: PlayerRef | null } = { ref: null };

export const seekToSeconds = (seconds: number, fps: number) => {
  playerBus.ref?.seekTo(Math.round(seconds * fps));
};
