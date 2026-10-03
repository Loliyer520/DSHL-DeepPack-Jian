export type PositionMode = 'time' | 'frame';

export function formatTimePosition(frame: number, fps: number): string {
  const ms = Math.max(0, Math.round(frame / fps * 1000));
  const seconds = Math.floor(ms / 1000);
  const pad = (value: number) => String(value).padStart(2, '0');
  const clock = `${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}.${String(ms % 1000).padStart(3, '0')}`;
  return seconds >= 3600 ? `${pad(Math.floor(seconds / 3600))}:${clock}` : clock;
}

export function parseTimePosition(value: string, mode: PositionMode, fps: number, maxFrame: number): { frame: number } | { error: string } {
  const input = value.trim();
  let frame: number;
  if (mode === 'frame') {
    if (!/^\d+$/.test(input)) return { error: '请输入从 0 开始的整数帧位置' };
    frame = Number(input);
  } else {
    const parts = input.split(':');
    if (parts.length > 3 || !/^\d+(?:\.\d+)?$/.test(parts[parts.length - 1] ?? '') || parts.slice(0, -1).some(part => !/^\d+$/.test(part))) {
      return { error: '请输入秒数、分:秒或时:分:秒，可带小数' };
    }
    const values = parts.map(Number);
    if (values.length > 1 && (values[values.length - 1] >= 60 || (values.length === 3 && values[1] >= 60))) {
      return { error: '冒号后的分、秒必须小于 60' };
    }
    const seconds = values.reduce((total, part) => total * 60 + part, 0);
    frame = Math.round(seconds * fps);
  }
  if (!Number.isFinite(fps) || fps <= 0 || !Number.isSafeInteger(frame) || frame < 0 || frame > maxFrame) {
    return { error: mode === 'frame' ? `帧位置范围为 0–${maxFrame}` : `时间范围为 0–${formatTimePosition(maxFrame, fps)}` };
  }
  return { frame };
}
