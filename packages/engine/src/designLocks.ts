import type {Overlay} from './schema.js';
export const DESIGN_LOCK_FIELDS={position:['x','y'],size:['w','h','maxWidth','padding','autoSize'],fontSize:['fontSize','lineHeight','letterSpacing','textFit'],color:['color','accent','background','shadow'],fontFamily:['fontFamily','fontWeight','italic'],lineBreaks:['text','typography']} as const;
export function protectedDesignFields(o:Overlay):Set<string>{return new Set((o.designLocks??[]).flatMap(lock=>[...DESIGN_LOCK_FIELDS[lock]]));}
/** Only automatic design operations call this. Direct inspector edits remain possible. */
export function protectDesignPatch(o:Overlay,patch:Record<string,unknown>):Record<string,unknown>{const locked=protectedDesignFields(o);return Object.fromEntries(Object.entries(patch).filter(([key])=>!locked.has(key)));}
