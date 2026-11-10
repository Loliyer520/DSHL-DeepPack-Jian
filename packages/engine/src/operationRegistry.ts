export const OP_NAMES = [
  "addClip", "removeClip", "updateClip", "moveClip", "reorderClips", "splitClip", "duplicateClip",
  "addAudio", "removeAudio", "updateAudioTrack",
  "addTrack", "removeTrack", "updateTrack", "moveTrack",
  "addOverlay", "removeOverlay", "updateOverlay", "splitOverlay", "arrangeOverlay", "transform",
  "addSlide", "updateGroup", "removeGroup",
  "setDesignScene", "removeDesignScene", "putDesignScenes", "setDesign", "bindDesignRole", "applyDesignLayout", "typesetText", "putDesign", "setTheme", "bindStyle", "saveComponent", "instantiateComponent", "setComponentParams", "detachComponent", "removeComponent", "putComponent", "putTheme", "replaceAsset", "adaptCanvas",
  "setMeta", "saveAnimation", "applyAnimation", "removeAnimation", "putAnimation",
  "setKeyframe", "removeKeyframe", "clearKeyframes",
  "addMarker", "updateMarker", "removeMarker",
  "putClip", "putOverlay", "putTrack", "putMarker", "putMeta", "putGroupState", "replaceTimeline",
] as const;
export const SYSTEM_OPS = new Set<string>(["putDesignScenes", "putDesign", "putComponent", "putTheme", "putClip", "putOverlay", "putTrack", "putMarker", "putMeta", "putGroupState", "putAnimation", "replaceTimeline"]);
export const PUBLIC_OP_NAMES=OP_NAMES.filter(name=>!SYSTEM_OPS.has(name));
export const OP_REQUIRED:Partial<Record<typeof OP_NAMES[number],string[]>>={setDesignScene:['id'],removeDesignScene:['id'],addClip:['src'],addAudio:['src'],updateClip:['id','patch'],updateOverlay:['patch'],updateTrack:['id','patch'],reorderClips:['order']};
export const OP_REGISTRY=Object.fromEntries(OP_NAMES.map(name=>[name,{name,visibility:SYSTEM_OPS.has(name)?'system':'public',required:OP_REQUIRED[name]??[]}])) as Record<typeof OP_NAMES[number],{name:string;visibility:string;required:string[]}>;
export function operationError(op:Record<string,unknown>):string|undefined{const entry=OP_REGISTRY[op.op as keyof typeof OP_REGISTRY];if(!entry)return '未知操作：'+op.op;const missing=entry.required.filter(k=>op[k]===undefined);return missing.length?'缺少参数：'+missing.join('、'):undefined;}
const NUM={type:'number'};
export const OPS_PARAMETERS: Record<string,any> = {
  type: 'object',
  properties: {
    ops: {
      type: 'array',
      minItems: 1,
      maxItems: 200,
      description: '操作列表，每项形如 {"op":"操作名", ...参数}',
      items: {
        type: 'object',
        properties: {
          op: { type: 'string', enum: PUBLIC_OP_NAMES },
          id: { type: 'string' }, src: { type: 'string' }, track: { type: 'string' }, index: { type: 'integer' },
          inPoint: NUM, clipDuration: NUM, duration: NUM, atSeconds: NUM, startSeconds: NUM, endSeconds: NUM,
          text: { type: 'string' }, patch: { type: 'object' }, order: { type: 'array', items: { type: 'string' } },
          channel: { type: 'string' }, t: NUM, v: NUM, label: { type: 'string' }, kind: { type: 'string' },
          x: NUM, y: NUM, w: NUM, h: NUM, group: { type: 'string' }, to: { type: 'string' }, template: { type: 'string' }, theme: { type: ['string','object'] }, from: {type:'string'}, width:NUM, height:NUM, mode:{type:'string'}, values:{type:'object'}, component:{type:'object'}, role:{type:['string','null']},
          shape: { type: 'object' }, image: { type: 'object' }, icon: { type: 'object' }, chart: { type: 'object' }, items: { type: 'array', items: { type: 'object' } },
          shadow: { description: '元素原生阴影/发光，优先于复制形状；对象为单层，数组为多层，false 关闭', oneOf: [
            { type: 'boolean', enum: [false] },
            { type: 'object', properties: { color: { type: 'string' }, blur: { type: 'number', minimum: 0, maximum: 200 }, opacity: { type: 'number', minimum: 0, maximum: 1 }, spread: { type: 'number', minimum: -100, maximum: 200 }, inset: { type: 'boolean' }, x: NUM, y: NUM }, required: ['color', 'blur'] },
            { type: 'array', minItems: 1, maxItems: 8, items: { type: 'object', properties: { color: { type: 'string' }, blur: NUM, opacity: NUM, spread: NUM, inset: { type: 'boolean' }, x: NUM, y: NUM }, required: ['color', 'blur'] } },
          ] },
          sceneId:{type:'string'},start:NUM,end:NUM,designLocks:{type:['array','null'],items:{enum:['position','size','fontSize','color','fontFamily','lineBreaks']}},textFit:{type:['object','null']},time:NUM,balance:{type:'boolean'},ids:{type:'array',items:{type:'string'}}, design:{type:'object'}, typography:{type:'object'}, layout:{type:'string'}, preset: {type:'string'}, name: { type: 'string' }, fit: { type: 'string' }, merge: { type: 'boolean' },
          composition:{type:['object','null']}, scene3d:{type:['object','null']}, cues:{type:['array','null'],items:{type:'object'}}, styleRole:{type:['string','null']},
          particles: { type: ['object', 'null'], properties: { preset: {enum:['snow','stars','rain','confetti','sparks']}, count: NUM, seed: NUM, speed: NUM, size: NUM, colors: {type:'array',items:{type:'string'}} } },
          audioReactive: { type: ['object', 'null'], properties: { source: {type:'string'}, src: {type:'string'}, rate: NUM, values:{type:'array',items:NUM}, channel:{enum:['scale','opacity','rotation']}, amount:NUM, smoothing:NUM, waveform:{type:'boolean'} } },
          motionBlur: { type: ['object', 'null'], properties: { samples: { type: 'integer', minimum: 2, maximum: 16 }, shutterAngle: { type: 'number', minimum: 0, maximum: 720 } } },
          autoSize: { type: ['object', 'null'], properties: { maxWidth: NUM, minWidth: NUM, padding: NUM } },
          layoutExclude: { type: 'boolean' },
          trackMatte: { type: ['object', 'null'], properties: { source: { type: 'string' }, mode: { enum: ['alpha','luma'] }, invert: { type: 'boolean' }, hideSource: { type: 'boolean' } } },
          sweep: { type: ['object', 'null'], properties: { color: { type: 'string' }, width: NUM, softness: NUM, angle: NUM, opacity: NUM, position: NUM } },
          glass: { type: ['object', 'null'], properties: { blur: NUM, saturation: NUM, brightness: NUM, tint: { type: 'string' }, opacity: NUM, radius: NUM, borderOpacity: NUM } },
          shared: { type: ['object', 'null'], properties: { key: { type: 'string' }, duration: NUM, ease: {} } },
          state: { type: ['object', 'null'], description: '替换组合整体动画状态；pivotX/pivotY/rotate/scale/opacity/transform3d/effects/animations/motionPath/mask/stagger' },
          mask: { type: ['object', 'null'], properties: { type: { type: 'string', enum: ['ellipse', 'rect', 'path'] }, x: NUM, y: NUM, w: NUM, h: NUM, feather: NUM, invert: { type: 'boolean' }, path: { type: 'string' } } },
          follow: { type: ['object', 'null'], properties: { target: { type: 'string' }, rotation: { type: 'boolean' }, scale: { type: 'boolean' } }, required: ['target'] },
          connector: { type: ['object', 'null'], properties: { from: { type: 'string' }, to: { type: 'string' }, fromAnchor: { type: 'string' }, toAnchor: { type: 'string' } }, required: ['from', 'to'] },
          e: { oneOf: [{ type: 'string' }, { type: 'array', items: NUM, minItems: 4, maxItems: 4 }, { type: 'object', properties: { type: { const: 'spring' }, stiffness: NUM, damping: NUM, mass: NUM, velocity: NUM }, required: ['type'] }] },
          motionPath: { type: ['object', 'null'], properties: { path: { type: 'string' }, autoRotate: { type: 'boolean' }, rotationOffset: NUM } },
          transform3d: { type: 'object', properties: { rotateX: NUM, rotateY: NUM, z: NUM, perspective: NUM, backface: { type: 'string', enum: ['visible', 'hidden'] } }, description: '轻量 3D 透视平面；支持 rotationX/rotationY/z/perspective 关键帧' },
          filter: { type: 'object', properties: { blur: NUM, brightness: NUM, contrast: NUM, saturate: NUM, grayscale: NUM, sepia: NUM, hueRotate: NUM } },
          blendMode: { type: 'string', enum: ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion'] },
          tex: { type: 'string' }, plot: { type: 'object' }, morph: { type: 'object' }, formula: { type: 'string' }, fn: { type: 'string' },
        },
        required: ['op'],
        additionalProperties: true,
      },
    },
    requestId: {type:'string',minLength:1,maxLength:80,description:'同一逻辑请求重试时保持相同；不同请求必须更换'},
    conflictPolicy: {type:'string',enum:['reject','warn'],description:'默认 reject：拒绝覆盖读取后被其他编辑者改过的字段'},
    label: { type: 'string', description: '这批修改的一句话说明（显示在用户的历史记录里），如“按节奏重排开场”' },
  },
  required: ['ops'],
};

OPS_PARAMETERS.properties.ops.items.allOf=Object.entries(OP_REQUIRED).map(([name,required])=>({if:{properties:{op:{const:name}}},then:{required}}));
export const OP_SIGNATURES=PUBLIC_OP_NAMES.map(name=>name+'{'+(OP_REQUIRED[name]??[]).join(',')+'}').join(' · ');
