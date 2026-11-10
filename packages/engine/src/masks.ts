import { evalKeyframes } from './timeline.js';
import type { Animations, ElementMask } from './schema.js';

/** Mask keyframes share the element/group clock and override only their own property. */
export function maskState(mask: ElementMask | undefined, anims: Animations | undefined, seconds: number): ElementMask | undefined {
  if (!mask) return undefined;
  const ev = (key: keyof Animations, fallback: number) => evalKeyframes(anims?.[key], seconds) ?? fallback;
  return { ...mask, x: ev('maskX', mask.x ?? .5), y: ev('maskY', mask.y ?? .5),
    w: Math.max(0, ev('maskW', mask.w ?? 1)), h: Math.max(0, ev('maskH', mask.h ?? 1)),
    feather: Math.max(0, Math.min(200, ev('maskFeather', mask.feather ?? 0))) };
}

/** A luminance mask: blur the matte, never the element's text/image. */
export function maskImage(mask: ElementMask | undefined, width: number, height: number): string | undefined {
  if (!mask) return undefined;
  const w = Math.max(1, width), h = Math.max(1, height);
  const x = (mask.x ?? 0.5) * w, y = (mask.y ?? 0.5) * h;
  const mw = (mask.w ?? 1) * w, mh = (mask.h ?? 1) * h;
  const fill = mask.invert ? 'black' : 'white';
  const shape = mask.type === 'ellipse' ? `<ellipse cx="${x}" cy="${y}" rx="${mw / 2}" ry="${mh / 2}"/>`
    : mask.type === 'path' ? `<path d="${(mask.path ?? '').replace(/[^MmLlHhVvCcSsQqTtAaZz0-9eE+.,\s-]/g, '')}" transform="translate(${x - mw / 2} ${y - mh / 2}) scale(${mw / 100} ${mh / 100})"/>`
    : `<rect x="${x - mw / 2}" y="${y - mh / 2}" width="${mw}" height="${mh}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><filter id="f" x="-100%" y="-100%" width="300%" height="300%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${(mask.feather ?? 0) / 2}"/></filter><filter id="a" x="0" y="0" width="100%" height="100%"><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 .2126 .7152 .0722 0 0"/></filter></defs><g filter="url(#a)"><rect width="100%" height="100%" fill="${mask.invert ? 'white' : 'black'}"/><g fill="${fill}" filter="url(#f)">${shape}</g></g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
