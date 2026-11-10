import type { SpringSpec } from './schema.js';

/** Analytical damped oscillator. Time is seconds, independent of render FPS. */
export function springResponse(t: number, spec: SpringSpec): number {
  const k = spec.stiffness ?? 170, c = spec.damping ?? 18, m = spec.mass ?? 1, v = spec.velocity ?? 0;
  const w0 = Math.sqrt(k / m), a = c / (2 * m), delta = a * a - w0 * w0;
  if (Math.abs(delta) < 1e-8) return 1 - Math.exp(-a * t) * (1 + (a - v) * t);
  if (delta < 0) {
    const w = Math.sqrt(-delta);
    return 1 - Math.exp(-a * t) * (Math.cos(w * t) + (a - v) / w * Math.sin(w * t));
  }
  const d = Math.sqrt(delta), r1 = -a + d, r2 = -a - d;
  const A = (-v - r2) / (r1 - r2);
  return 1 - A * Math.exp(r1 * t) - (1 - A) * Math.exp(r2 * t);
}

/** Endpoint correction has zero slope at both ends, preventing an end-frame snap. */
export function springEase(f: number, duration: number, spec: SpringSpec): number {
  if (f <= 0) return 0;
  if (f >= 1) return 1;
  const d = Math.max(0.001, duration);
  return springResponse(f * d, spec) + (1 - springResponse(d, spec)) * f * f * (3 - 2 * f);
}
