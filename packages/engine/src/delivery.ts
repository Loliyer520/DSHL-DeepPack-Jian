import type {Timeline} from './schema.js';
import type {CheckIssue} from './preflight.js';
import {mainTrackStarts,clipBox} from './timeline.js';
import {FONTS} from './fonts.js';
import {protectDesignPatch} from './designLocks.js';
export type DeliveryAsset={name:string;width?:number|null;height?:number|null;hasAlpha?:boolean;error?:string|null};
export type Proposal={id:string;message:string;before?:string;after?:string;ops:Record<string,unknown>[]};
/** Metadata checks describe risks; a contain fit is not proof of black pixels. */
export function checkMediaQuality(t:Timeline,assets:DeliveryAsset[],availableFonts=FONTS.map(f=>f.id),depth=0):CheckIssue[]{
 const issues:CheckIssue[]=[],map=new Map(assets.map(a=>[a.name,a]));
 const add=(code:string,id:string,time:number,message:string,severity:CheckIssue['severity']='warning')=>issues.push({code,id,time,message,severity});
 const inspect=(src:string,id:string,time:number,w:number,h:number,fit='cover',crop?:{w:number;h:number})=>{const a=map.get(src);if(!a)return;if(a.error)add('asset-unreadable',id,time,'素材无法解码：'+src,'error');if(!a.width||!a.height)return;const sw=a.width*(crop?.w??1),sh=a.height*(crop?.h??1);const ratio=fit==='contain'?Math.min(w/sw,h/sh):Math.max(w/sw,h/sh);if(ratio>1.25)add('asset-upscale',id,time,`${src} 的有效分辨率 ${Math.round(sw)}×${Math.round(sh)}，预计放大 ${ratio.toFixed(1)} 倍，建议更换高清素材或缩小显示区域`);if(fit==='contain'&&Math.abs(sw/sh-w/h)>.05)add('asset-letterbox',id,time,`${src} 完整适配后会露出背景；可使用裁切填充或核对背景颜色`);if(fit==='fill'&&Math.abs(sw/sh-w/h)>.05)add('asset-stretch',id,time,`${src} 拉伸比例不一致，可能变形，建议改为完整适配或裁切填充`);};
 const starts=mainTrackStarts(t);
 for(const [i,tr] of t.videoTracks.entries())if(!tr.hidden)for(const c of tr.clips){const b=i?clipBox(c):undefined;inspect(c.src,c.id,i?c.atSeconds??0:starts.get(c.id)??0,t.meta.width*(b?.w??1),t.meta.height*(b?.h??1),c.fit,c.crop);}
 for(const o of t.overlays){if(o.image)inspect(o.image.src,o.id,o.startSeconds,t.meta.width*(o.w??.2),o.h!==undefined?t.meta.height*o.h:t.meta.width*(o.w??.2),o.image.fit);if(o.text.trim()){const font=o.fontFamily??'sans';if(!FONTS.some(f=>f.id===font))add('font-fallback',o.id,o.startSeconds,`字体 ${font} 不在内置字体库，将使用回退字体`);else if(!availableFonts.includes(font))add('font-missing',o.id,o.startSeconds,`字体文件缺失：${font}`,'error');}if(o.composition&&depth<4){try{const c=o.composition;for(const issue of checkMediaQuality(JSON.parse(c.timeline),assets,availableFonts,depth+1))issues.push({...issue,id:o.id,time:Math.max(o.startSeconds,o.startSeconds+(issue.time-c.inPoint)/c.speed),message:'合成内：'+issue.message});}catch{}}}
 return issues;
}
const closing=/^[，。！？、；：）》】”’」』,.!?;:%％]/u,opening=/[（《【“‘「『(]$/u;
/** Keep Latin words and numbers together; choose punctuation/space boundaries before fallback CJK breaks. */
export function subtitleLines(text:string,maxChars=18,keepTogether:string[]=[]):string{
 const limit=Math.max(6,Math.min(40,Math.round(maxChars)));
 return text.split('\n').map(line=>{const words=keepTogether.filter(Boolean).sort((a,b)=>b.length-a.length).map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));const pattern=new RegExp((words.length?words.join('|')+'|':'')+'[A-Za-z0-9]+(?:[.,:/_-][A-Za-z0-9]+)*|\\s+|.','gu');const tokens=line.match(pattern)??[];const n=tokens.length,cost=Array(n+1).fill(Infinity),next=Array(n+1).fill(n);cost[n]=0;
 for(let i=n-1;i>=0;i--){let length=0;for(let j=i+1;j<=n;j++){length+=[...tokens[j-1]].length;if(length>limit&&j>i+1)break;if(j<n&&(closing.test(tokens[j])||opening.test(tokens[j-1])))continue;const punctuation=/[，。！？；：,.!?;:]$/u.test(tokens[j-1]),space=/\s/u.test(tokens[j-1]);const penalty=j===n?0:(limit-length)**2+(punctuation?0:space?3:20);const value=penalty+cost[j];if(value<cost[i]){cost[i]=value;next[i]=j;}}}
 let result:string[]=[];for(let i=0;i<n;){const j=next[i];result.push(tokens.slice(i,j).join('').trim());i=j;}return result.join('\n');}).join('\n');
}
export function subtitleProposals(t:Timeline,{maxChars=18,safeBottom=.12,keywords=[]}:{maxChars?:number;safeBottom?:number;keywords?:string[]}={}):Proposal[]{
 const result:Proposal[]=[];
 for(const o of t.overlays.filter(o=>(o.kind??'subtitle')==='subtitle')){const patch:Record<string,unknown>={},notes:string[]=[];let after=o.text;
 if(!/\*\*|==|\[#[^\]]*\]|\[\/\]/.test(after)){after=subtitleLines(after,maxChars,keywords);const words=[...new Set(keywords.map(s=>s.trim()).filter(Boolean))].sort((a,b)=>b.length-a.length);if(words.length){const re=new RegExp(words.map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'gu');after=after.replace(re,s=>'=='+s+'==');}if(after!==o.text)patch.text=after;}else notes.push('已有富文本标记，保留原文');
 const plain=after.replace(/==/g,''),lineCount=plain.split('\n').length;const h=lineCount*o.fontSize*(o.lineHeight??1.3)/t.meta.height;const bottom=Math.max(.05,Math.min(.3,safeBottom));const y=1-bottom-h/2;if(y>h/2){patch.y=y;patch.x=.5;patch.w=.84;patch.align='center';}else notes.push('字幕高度超过安全区，需要缩短文案或调整字号');
 if(lineCount>2)notes.push(`断行后共 ${lineCount} 行，建议按语义拆分为多条字幕`);
 const safe=protectDesignPatch(o,patch);for(const k of Object.keys(safe))if(safe[k]===o[k as keyof typeof o])delete safe[k];if(Object.keys(safe).length<Object.keys(patch).length)notes.push('已保留受保护字段');
 result.push({id:o.id,before:o.text,after:typeof safe.text==='string'?safe.text:o.text,message:notes.join('；')||'按标点与词边界断行并放入字幕安全区',ops:Object.keys(safe).length?[{op:'updateOverlay',id:o.id,patch:safe}]:[]});
 }return result;
}
export type Loudness={integrated:number|null;truePeak:number|null;range:number|null;duration:number};
export function audioProposals(t:Timeline,measurements:Record<string,Loudness>,target=-16):Proposal[]{
 const out:Proposal[]=[];
 for(const track of t.audioTracks){if(track.muted||track.locked)continue;for(const c of track.clips){if(c.muted)continue;const m=measurements[c.id];if(!m||m.integrated===null)continue;const goal=track.role==='music'?Math.min(target,-23):target;let db=goal-m.integrated;if(m.truePeak!==null)db=Math.min(db,-1-m.truePeak);const desired=Math.min(1,Math.max(0,10**(db/20)));const current=c.volume*track.volume;const volume=track.volume>0?Math.min(1,desired/track.volume):c.volume;const patch:Record<string,unknown>={};if(Math.abs(volume-c.volume)>.01)patch.volume=Math.round(volume*1000)/1000;
 if(!c.fadeIn)patch.fadeIn=Math.min(.15,c.duration/4);if(!c.fadeOut)patch.fadeOut=Math.min(.25,c.duration/4);
 out.push({id:c.id,message:`源片段 ${m.integrated.toFixed(1)} LUFS，峰值 ${m.truePeak?.toFixed(1)??'未知'} dBTP；目标 ${goal} LUFS。${current===0?'当前静音增益会保留。':desired>=1&&db>0?'现有增益上限不足，建议先规范化音源。':'可预览增益与淡入淡出建议。'}${c.animations?.volume?.length?'已存在音量动画，保留增益，只补淡入淡出。':''}`,ops:current===0?[]:[{op:'updateClip',id:c.id,patch:c.animations?.volume?.length?Object.fromEntries(Object.entries(patch).filter(([k])=>k!=='volume')):patch}].filter(o=>Object.keys(o.patch).length)});
 }if(track.role==='music'&&!track.duck&&t.audioTracks.some(v=>v.role==='voice'&&!v.muted&&v.clips.some(c=>!c.muted)))out.push({id:track.id,message:'已标记人声轨，建议配乐在人声期间降到 25%，使用 0.3 秒过渡',ops:[{op:'updateTrack',id:track.id,patch:{duck:{level:.25,ramp:.3}}}]});}
 return out;
}
