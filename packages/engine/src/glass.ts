import type { GlassSpec } from './schema.js';

/** Blur only the sampled backdrop; foreground text and icons stay sharp. */
export function glassStyle(spec: GlassSpec | undefined) {
  if (!spec) return {};
  const filter = `blur(${spec.blur ?? 18}px) saturate(${spec.saturation ?? 1.3}) brightness(${spec.brightness ?? 1})`;
  return {
    backdropFilter: filter, WebkitBackdropFilter: filter,
    backgroundColor: `color-mix(in srgb, ${spec.tint ?? '#ffffff'} ${(spec.opacity ?? .12) * 100}%, transparent)`,
    borderRadius: spec.radius ?? 16,
    border: `1px solid rgba(255,255,255,${spec.borderOpacity ?? .25})`,
    boxSizing: 'border-box' as const,
  };
}
