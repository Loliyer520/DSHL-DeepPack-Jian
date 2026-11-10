import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ElementMask, Overlay, ShadowLayer } from './schema';
import { evalKeyframes } from './timeline';
import { resolveAnimations } from './presets';
import { maskImage } from './masks';

export const shadowLayers = (shadow: Overlay['shadow']): ShadowLayer[] =>
  !shadow ? [] : Array.isArray(shadow) ? shadow : [shadow];

export const SHADOW_PRESETS: { name: string; shadow: Overlay['shadow'] }[] = [
  { name: '无', shadow: false },
  { name: '柔和', shadow: { color: '#000000', opacity: 0.18, blur: 20, y: 6 } },
  { name: '悬浮', shadow: [
    { color: '#000000', opacity: 0.12, blur: 8, y: 3 },
    { color: '#000000', opacity: 0.2, blur: 32, y: 16 },
  ] },
  { name: '内阴影', shadow: { color: '#000000', opacity: .35, blur: 14, x: 4, y: 4, inset: true } },
  { name: '内发光', shadow: { color: '#38bdf8', opacity: .8, blur: 12, inset: true } },
  { name: '硬边', shadow: { color: '#000000', opacity: 0.35, blur: 0, x: 8, y: 8 } },
  { name: '发光', shadow: [
    { color: '#38bdf8', opacity: 0.8, blur: 8, y: 0 },
    { color: '#38bdf8', opacity: 0.4, blur: 24, y: 0, spread: 2 },
  ] },
];

/** Parallel shadows all start from SourceAlpha; chaining CSS drop-shadow would
 * cast additional shadows from previous shadows and darken the result. */
const useMeasureEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function useElementAppearance(ov: Overlay, w: number, h: number, measure = false, mask: ElementMask | undefined = ov.mask, seconds = 0) {
  const animations=resolveAnimations(ov,ov.endSeconds-ov.startSeconds);
  const sweep=ov.sweep;
  const position=evalKeyframes(animations?.sweepProgress,seconds)??sweep?.position??.5;

  const id = 'dj-shadow-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number }>();
  // Legacy inline text and wrapping text boxes have content-dependent bounds.
  // Using the maximum text width here would clip shadows on short labels.
  useMeasureEffect(() => {
    if (!measure || (!ov.shadow && !mask && !ov.glass && !sweep) || !ref.current) return;
    const { offsetWidth: width, offsetHeight: height } = ref.current;
    if (width > 0 && height > 0 && (size?.w !== width || size?.h !== height)) setSize({ w: width, h: height });
  });
  if (measure && size) { w = size.w; h = size.h; }
  const band=sweep ? `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${Math.max(1,w)}" height="${Math.max(1,h)}"><defs><linearGradient id="s"><stop stop-color="${sweep.color??'#ffffff'}" stop-opacity="0"/><stop offset="${(sweep.softness??.65)/2}" stop-color="${sweep.color??'#ffffff'}" stop-opacity="1"/><stop offset="${1-(sweep.softness??.65)/2}" stop-color="${sweep.color??'#ffffff'}" stop-opacity="1"/><stop offset="1" stop-color="${sweep.color??'#ffffff'}" stop-opacity="0"/></linearGradient></defs><g transform="rotate(${sweep.angle??20} ${w/2} ${h/2})"><rect x="${(position*2-.5)*w-(sweep.width??.25)*w/2}" y="${-h*2}" width="${(sweep.width??.25)*w}" height="${h*5}" fill="url(#s)"/></g></svg>`)}")` : undefined;
  const layers = shadowLayers(ov.shadow);
  const text = !ov.kind || ['subtitle', 'title', 'text'].includes(ov.kind);
  const defaultY = text ? 2 : 4;
  // CSS text-shadow uses half the blur radius as sigma; drop-shadow uses sigma.
  const sigma = (s: ShadowLayer) => s.blur * (text ? 0.5 : 1);
  const pad = Math.max(1, ...layers.map((s) => Math.max(Math.abs(s.x ?? 0), Math.abs(s.y ?? defaultY)) + Math.max(0, s.spread ?? 0) + sigma(s) * 4 + 2));
  const defs = layers.length || sweep ? (
    <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
      <defs>
        <filter id={id} x={-pad / Math.max(1, w)} y={-pad / Math.max(1, h)} width={1 + 2 * pad / Math.max(1, w)} height={1 + 2 * pad / Math.max(1, h)} colorInterpolationFilters="sRGB">
          {layers.map((s, i) => <React.Fragment key={i}>
            {!!s.spread && <feMorphology in="SourceAlpha" operator={s.inset ? (s.spread > 0 ? 'erode' : 'dilate') : (s.spread > 0 ? 'dilate' : 'erode')} radius={Math.abs(s.spread)} result={'spread' + i} />}
            {s.inset && <feComponentTransfer in={s.spread ? 'spread' + i : 'SourceAlpha'} result={'inverse' + i}><feFuncA type="table" tableValues="1 0" /></feComponentTransfer>}
            <feGaussianBlur in={s.inset ? 'inverse' + i : s.spread ? 'spread' + i : 'SourceAlpha'} stdDeviation={sigma(s)} result={'blur' + i} />
            <feOffset in={'blur' + i} dx={s.x ?? 0} dy={s.y ?? defaultY} result={'offset' + i} />
            {s.inset && <feComposite in={'offset' + i} in2="SourceAlpha" operator="in" result={'inner' + i} />}
            <feFlood floodColor={s.color} floodOpacity={s.opacity ?? 1} result={'color' + i} />
            <feComposite in={'color' + i} in2={(s.inset ? 'inner' : 'offset') + i} operator="in" result={'shadow' + i} />
          </React.Fragment>)}
          <feMerge result="base">
            {layers.map((_, i) => layers.length-i-1).filter(i => !layers[i].inset).map(i => <feMergeNode key={i} in={'shadow' + i} />)}
            <feMergeNode in="SourceGraphic" />
            {layers.map((_, i) => layers.length-i-1).filter(i => layers[i].inset).map(i => <feMergeNode key={i} in={'shadow' + i} />)}
          </feMerge>
          {sweep && <><feImage href={band!.slice(5,-2)} x="0" y="0" width={w} height={h} result="band"/><feComposite in="band" in2="SourceAlpha" operator="in" result="light"/><feComponentTransfer in="light" result="dim"><feFuncA type="linear" slope={sweep.opacity??.7}/></feComponentTransfer><feBlend in="dim" in2="base" mode="screen"/></>}

        </filter>
      </defs>
    </svg>
  ) : null;
  return { ref, defs, maskImage: maskImage(mask, w, h), filter: layers.length || sweep ? `url(#${id})` : undefined, mixBlendMode: ov.blendMode };
}
