// 给模型看的操作说明（工具描述）。与 engine/src/ops.ts 的语义一一对应。
export const OPS_DOC = [
  '对当前会话绑定的剪辑项目应用一批操作（按顺序执行，每条独立回执）。时间单位一律为秒；所有实体用稳定 id 寻址（先用 djian_timeline 看 id）。',
  '【片段】',
  'addClip{src, inPoint?, clipDuration?, track?, index?, atSeconds?, box?, transition?, volume?, speed?, filter?, animationPreset?, effects?, animations?, crop?, flipH?, flipV?, opacity?, blendMode?, fit?, freeze?, fadeIn?, fadeOut?, id?}',
  '  · track 省略/"main" 加到主轨（串行）：index 指定插入位置，或给 atSeconds 插到最近的剪辑点，都不给则追加到末尾',
  '  · track:"pip"（或叠加轨 id、"new"）加到画中画叠加轨：atSeconds 为绝对起点，box{x,y,w,h} 为 0–1 画布分数矩形（默认右下 30%）',
  'removeClip{id}（视频/音频片段通用） · updateClip{id, patch}（patch 字段同 addClip，值写 null 表示清除；画中画可 patch.track 换轨） · moveClip{id, index}（主轨换位）或 moveClip{id, atSeconds}（画中画/音频移动）',
  'reorderClips{order:[主轨 id…]}（未列出的片段保持原顺序接在后面） · splitClip{id, atSeconds}（全局时间切点） · duplicateClip{id, atSeconds?}',
  '【音频】addAudio{src, duration?, inPoint?, atSeconds?, volume?, speed?, track?, fadeIn?, fadeOut?, animations?{volume:[…]}} · removeAudio{id}',
  '【轨道】addTrack{kind:"video"|"audio", name?, role?} · updateTrack{id, patch:{name?, volume?, muted?, hidden?, locked?, role?:"music"|"voice"|"sfx", duck?:{level, ramp?}}} · moveTrack{id, index} · removeTrack{id}',
  '  · 给配乐轨设 duck:{level:0.25} 并把人声轨 role 设为 "voice"，人声出现时配乐自动压低（闪避）',
  '  · 被用户锁定(locked)的轨道不能修改；尊重锁定，不要擅自解锁',
  '【文字/字幕】addOverlay{text, startSeconds, endSeconds, position?, fontSize?, color?, fontFamily?, fontWeight?, x?, y?, align?, maxWidth?, stroke?{color,width}, shadow?{color,blur,x?,y?}|false, background?{color,opacity?,padding?,radius?}, animationPreset?, kind?:"subtitle"|"title"}',
  '  · removeOverlay{id} · updateOverlay{id, patch} · splitOverlay{id, atSeconds}；x/y 为文字中心的画布分数位置（给出后覆盖 position）',
  '  · fontFamily：sans 思源黑体 / serif 思源宋体（两者可变字重 fontWeight 100–900）/ kuaile 快乐体 / qingke 黄油体 / mashan 毛笔楷',
  '【效果】transition（作用于“进入本片段”的剪辑点，居中于剪辑点、不改变总时长）："none" | "fade"(从黑场淡入) | {type:"dissolve"|"fadeBlack"|"fadeWhite"|"slide"|"wipe"|"push"|"zoom"|"blur", duration:0.05–3, direction?:"left"|"right"|"up"|"down"}',
  '  · animationPreset：fadeIn slideInLeft slideInRight slideInUp zoomIn bounceIn spinIn（入场）/ fadeOut slideOutLeft slideOutRight zoomOut（出场）/ kenBurns kenBurnsOut pop tilt（组合）/ pulse wobble float（循环）/ "none" 清除。预设以引用保存，裁剪后自动对齐首尾；同组替换，入场+出场可并存',
  '  · filter{brightness,contrast,saturate(0–3,1=原),blur(px),grayscale,sepia(0–1),hueRotate(度)}；speed 0.1–10（占时不变，素材按倍速消耗）；fadeIn/fadeOut 为声音淡入淡出秒数',
  '  · 关键帧：setKeyframe{id, channel, t, v, e?} / removeKeyframe{id, channel, t} / clearKeyframes{id, channel?}；t 为片段/字幕内相对秒；channel：x y（画布分数偏移）scale scaleX scaleY opacity rotation(度) volume brightness contrast saturate blur；e 缓动：linear in out inOut bounce elastic hold 或贝塞尔 [x1,y1,x2,y2]',
  '【画布与标记】setMeta{patch:{fps?, width?, height?, background?}} · addMarker{t, label?} · removeMarker{id}',
  '回执 receipts 逐条给出 applied/partial/ignored/rejected 与原因；conflicts 列出你修改的对象自上次读取后被用户改过的情况——此时以用户的修改为准，必要时先 djian_timeline 再调整。',
].join('\n');

const NUM = { type: 'number' };
export const OPS_PARAMETERS = {
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
          op: { type: 'string', enum: ['addClip', 'removeClip', 'updateClip', 'moveClip', 'reorderClips', 'splitClip', 'duplicateClip', 'addAudio', 'removeAudio', 'addTrack', 'updateTrack', 'moveTrack', 'removeTrack', 'addOverlay', 'removeOverlay', 'updateOverlay', 'splitOverlay', 'setMeta', 'setKeyframe', 'removeKeyframe', 'clearKeyframes', 'addMarker', 'updateMarker', 'removeMarker'] },
          id: { type: 'string' }, src: { type: 'string' }, track: { type: 'string' }, index: { type: 'integer' },
          inPoint: NUM, clipDuration: NUM, duration: NUM, atSeconds: NUM, startSeconds: NUM, endSeconds: NUM,
          text: { type: 'string' }, patch: { type: 'object' }, order: { type: 'array', items: { type: 'string' } },
          channel: { type: 'string' }, t: NUM, v: NUM, label: { type: 'string' }, kind: { type: 'string' },
        },
        required: ['op'],
        additionalProperties: true,
      },
    },
    label: { type: 'string', description: '这批修改的一句话说明（显示在用户的历史记录里），如“按节奏重排开场”' },
  },
  required: ['ops'],
};
