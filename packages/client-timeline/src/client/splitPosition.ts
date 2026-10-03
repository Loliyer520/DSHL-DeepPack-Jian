/** Resolve a playhead cut onto the frame grid, retaining at least one frame on each side. */
export function splitOffset(start: number, duration: number, atSeconds: number, fps: number): number | null {
  if (![start, duration, atSeconds, fps].every(Number.isFinite) || fps <= 0) return null;
  const offset = Math.round(atSeconds * fps) / fps - start;
  const frame = 1 / fps;
  const epsilon = frame * 1e-7;
  return offset >= frame - epsilon && duration - offset >= frame - epsilon ? offset : null;
}
