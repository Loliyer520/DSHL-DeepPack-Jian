import type { CSSProperties } from 'react';
import type { TransitionObject } from './schema.js';
import { TRANSITION_TYPES, easingFn } from './timeline.js';

export const TRANSITION_LABEL: Record<TransitionObject['type'], string> = {
  dissolve: '叠化', fadeBlack: '闪黑', fadeWhite: '闪白', slide: '滑动', wipe: '擦除', push: '推入', zoom: '缩放', blur: '模糊',
  flip: '3D 翻转', cube: '立方体', iris: '圆形展开', diagonal: '斜向擦除', zoomBlur: '变焦模糊', whip: '甩镜',
};
export const listTransitions = () => TRANSITION_TYPES.map((type) => ({ type, label: TRANSITION_LABEL[type], directional: directionalTransition(type) }));

export const ADVANCED_TRANSITIONS = ['flip', 'cube', 'iris', 'diagonal', 'zoomBlur', 'whip'] as const;
export const directionalTransition = (type: string) => ['slide', 'wipe', 'push', 'flip', 'cube', 'diagonal', 'whip'].includes(type);

/** Both sides use the same deterministic clock; no random or CSS-timed effects. */
export function transitionPresentation(role: 'in' | 'out', spec: TransitionObject, progress: number, width = 1920, height = 1080): CSSProperties {
  const advanced = (ADVANCED_TRANSITIONS as readonly string[]).includes(spec.type);
  const p = Math.max(0, Math.min(1, easingFn(spec.ease ?? (advanced ? 'inOut' : 'linear'), spec.duration)(Math.max(0, Math.min(1, progress)))));
  const dir = spec.direction ?? 'left';
  const axis = dir === 'left' || dir === 'right' ? 'X' : 'Y';
  const sign = dir === 'left' || dir === 'up' ? 1 : -1;
  const strength = spec.intensity ?? 1;
  switch (spec.type) {
    case 'dissolve': return role === 'in' ? { opacity: p } : {};
    case 'fadeBlack':
    case 'fadeWhite': return role === 'in' ? { opacity: Math.max(0, (p - 0.5) * 2) } : { opacity: Math.max(0, 1 - p * 2) };
    case 'slide': return role === 'in' ? { transform: `translate${axis}(${sign * (1 - p) * 100}%)` } : {};
    case 'push': return { transform: `translate${axis}(${sign * (role === 'in' ? 1 - p : -p) * 100}%)` };
    case 'wipe': {
      const r = (1 - p) * 100;
      const inset = dir === 'left' ? `0 0 0 ${r}%` : dir === 'right' ? `0 ${r}% 0 0` : dir === 'up' ? `${r}% 0 0 0` : `0 0 ${r}% 0`;
      return role === 'in' ? { clipPath: `inset(${inset})` } : {};
    }
    case 'zoom': return role === 'in' ? { opacity: p, transform: `scale(${1.25 - 0.25 * p})` } : { transform: `scale(${1 + 0.15 * p})` };
    case 'blur': return role === 'in' ? { opacity: p, filter: `blur(${(1 - p) * 24}px)` } : { filter: `blur(${p * 24}px)` };
    case 'flip': {
      const incoming = role === 'in';
      const angle = incoming ? -sign * 90 * Math.max(0, 1 - 2 * p) : sign * 90 * Math.min(1, 2 * p);
      return {
        transform: `perspective(${Math.max(width, height) * 1.5 / strength}px) rotate${axis === 'X' ? 'Y' : 'X'}(${angle}deg)`,
        backfaceVisibility: 'hidden', opacity: incoming ? (p >= 0.5 ? 1 : 0) : (p < 0.5 ? 1 : 0),
      };
    }
    case 'cube': {
      const half = (axis === 'X' ? width : height) / 2;
      const angle = (axis === 'X' ? sign : -sign) * 90 * (role === 'in' ? 1 - p : -p);
      return {
        transform: `perspective(${Math.max(width, height) * 2 / strength}px) translateZ(${-half}px) rotate${axis === 'X' ? 'Y' : 'X'}(${angle}deg) translateZ(${half}px)`,
        backfaceVisibility: 'hidden', filter: `brightness(${1 - 0.35 * (role === 'in' ? 1 - p : p)})`,
      };
    }
    case 'iris': return role === 'in' ? { clipPath: `circle(${p * 71}% at 50% 50%)` } : {};
    case 'diagonal': {
      if (role === 'out') return {};
      const t = p * 200;
      const points = t <= 100 ? [[0, 0], [t, 0], [0, t]] : [[0, 0], [100, 0], [100, t - 100], [t - 100, 100], [0, 100]];
      return { clipPath: 'polygon(' + points.map(([x, y]) => `${dir === 'right' || dir === 'down' ? 100 - x : x}% ${dir === 'right' || dir === 'up' ? 100 - y : y}%`).join(',') + ')' };
    }
    case 'zoomBlur': return {
      opacity: role === 'in' ? p : 1,
      transform: `scale(${1 + 0.3 * strength * (role === 'in' ? 1 - p : p)})`,
      filter: `blur(${Math.sin(Math.PI * p) * 24 * strength}px)`,
    };
    case 'whip': return {
      transform: `translate${axis}(${sign * (role === 'in' ? 1 - p : -p) * 100}%)`,
      filter: `blur(${Math.sin(Math.PI * p) * 18 * strength}px)`,
    };
    default: return {};
  }
}
