import type { Animations, Transform3d } from './schema.js';
import { evalKeyframes } from './timeline.js';

/** CSS plane transforms: no meshes, lights or external WebGL runtime. */
export function spatialState(spec: Transform3d | undefined, anims: Animations | undefined, sec: number) {
  const x = evalKeyframes(anims?.rotationX, sec) ?? spec?.rotateX ?? 0;
  const y = evalKeyframes(anims?.rotationY, sec) ?? spec?.rotateY ?? 0;
  const perspective = Math.max(200, Math.min(5000, evalKeyframes(anims?.perspective, sec) ?? spec?.perspective ?? 1200));
  // Keep the plane in front of the camera to avoid singular projections.
  const z = Math.max(-2000, Math.min(perspective * 0.9, evalKeyframes(anims?.z, sec) ?? spec?.z ?? 0));
  return {
    transform: x || y || z ? `perspective(${perspective}px) translateZ(${z}px) rotateX(${x}deg) rotateY(${y}deg)` : undefined,
    backfaceVisibility: spec?.backface ?? 'visible' as 'visible' | 'hidden',
    active: Boolean(x || y || z),
  };
}
