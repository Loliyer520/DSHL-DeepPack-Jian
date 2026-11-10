import type { Animations, GroupState, Overlay } from './schema.js';
import { expandAnimationPreset } from './presets.js';

/** Render-time envelope, composed around the member's own animations. */
export function staggerPresentation(o: Overlay, overlays: Overlay[], groups: Record<string, GroupState> | undefined, seconds: number): { animations: Animations; seconds: number } | undefined {
  const spec = o.group ? groups?.[o.group]?.stagger : undefined;
  if (!spec || o.kind === 'camera') return;
  const members = overlays.filter(x => x.group === o.group && x.kind !== 'camera');
  const ordered = [...members];
  if (spec.order === 'reverse') ordered.reverse();
  if (spec.order === 'center') ordered.sort((a,b) => Math.abs(members.indexOf(a)-(members.length-1)/2)-Math.abs(members.indexOf(b)-(members.length-1)/2));
  const rank = ordered.findIndex(x => x.id === o.id);
  const start = Math.max(o.startSeconds, Math.min(...members.map(x=>x.startSeconds)) + rank*spec.interval);
  const duration = Math.min(spec.duration ?? .6, Math.max(.05,o.endSeconds-start));
  return { seconds: seconds-start, animations: expandAnimationPreset(spec.preset ?? 'riseUp',duration) ?? {} };
}
