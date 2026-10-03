// D剪 剪辑工具：名称、说明、参数 schema 与执行逻辑（不依赖宿主，宿主插件与 MCP 适配器共用）。
// execute(client, ctx, args) → { value: JSON, text: 给模型的文字, image?: { data: Buffer, mediaType } }
import { outline } from './outline.js';
import { OPS_DOC, OPS_PARAMETERS } from './ops-doc.js';

const str = (v) => (typeof v === 'string' ? v : undefined);
const p = (pid) => '/api/p/' + encodeURIComponent(pid);

function receiptLines(result) {
  const lines = [];
  for (const r of result.receipts ?? []) {
    if (r.status === 'applied') continue;
    const what = '#' + (r.index + 1) + ' ' + r.op;
    if (r.status === 'rejected') lines.push('✗ ' + what + ' 被拒绝：' + r.reason);
    else if (r.status === 'ignored') lines.push('· ' + what + ' 未生效：' + (r.warnings ?? [r.reason]).join('；'));
    else lines.push('△ ' + what + ' 部分生效：' + (r.warnings ?? []).join('；'));
  }
  return lines;
}

export const TOOLS = [
  {
    name: 'djian_timeline',
    description: '读取当前会话剪辑项目的时间线。默认返回精简大纲（含每个片段/字幕/轨道的 id、时间区间与效果），detail:"full" 返回完整 JSON。修改前、或事件提示用户改过之后调用；id 一律以这里为准。',
    parameters: { type: 'object', properties: { detail: { type: 'string', enum: ['outline', 'full'] }, assets: { type: 'boolean', description: '同时列出素材库' } } },
    async execute(client, ctx, args) {
      const [{ rev, timeline, readOnly }, assets] = await Promise.all([
        client.get(p(ctx.projectId) + '/timeline'),
        args.assets ? client.get(p(ctx.projectId) + '/assets') : Promise.resolve(null),
      ]);
      ctx.observe(rev);
      const text = [
        readOnly ? '⚠ 项目只读：' + readOnly : '',
        args.detail === 'full' ? JSON.stringify(timeline) : outline(timeline, { name: ctx.projectName, rev }),
        assets ? '素材库：' + (assets.assets.map((a) => a.name + '(' + a.type + (a.duration ? ' ' + a.duration + 's' : '') + (a.width ? ' ' + a.width + '×' + a.height : '') + ')').join('、') || '空') : '',
      ].filter(Boolean).join('\n\n');
      return { value: { rev, canvas: timeline.meta, ...(args.detail === 'full' ? { timeline } : {}), ...(assets ? { assets: assets.assets.map(({ name, type, duration, width, height }) => ({ name, type, duration, width, height })) } : {}) }, text };
    },
  },
  {
    name: 'djian_apply_ops',
    description: OPS_DOC,
    parameters: OPS_PARAMETERS,
    async execute(client, ctx, args) {
      if (!Array.isArray(args.ops) || !args.ops.length) throw new Error('ops 必须是非空数组');
      const result = await client.post(p(ctx.projectId) + '/ops', { ops: args.ops, actor: 'ai', clientId: ctx.clientId, baseRev: ctx.lastSeenRev, label: str(args.label) ?? null });
      ctx.observe(result.rev, result.changed);
      const lines = [
        (result.summary?.length ? '已完成（rev ' + result.rev + '）：\n- ' + result.summary.join('\n- ') : '没有产生任何变化（rev ' + result.rev + '）'),
        ...receiptLines(result),
        ...(result.conflicts?.length ? ['⚠ 以下对象在你上次读取后被用户改过（已按最新状态应用，请确认没有覆盖用户的意图）：' + [...new Set(result.conflicts.map((c) => c.summary ?? c.key))].join('；')] : []),
      ];
      const created = (result.receipts ?? []).filter((r) => r.id && /^add|^split|^duplicate/.test(r.op)).map((r) => r.op + '→' + (r.ids ?? [r.id]).join(','));
      if (created.length) lines.push('新 id：' + created.join('；'));
      return { value: { rev: result.rev, receipts: result.receipts, conflicts: result.conflicts }, text: lines.join('\n') };
    },
  },
  {
    name: 'djian_changes',
    description: '查看自某个修订号以来用户（及撤销/恢复）对项目做的修改。通常无需主动调用：每一步开始时系统会自动把新修改以 <editor-activity> 告诉你；当提示「另有 N 项修改」时用它查全。',
    parameters: { type: 'object', properties: { since: { type: 'integer', minimum: 0 }, include_ai: { type: 'boolean' } } },
    async execute(client, ctx, args) {
      const since = Number.isInteger(args.since) ? args.since : 0;
      const r = await client.get(p(ctx.projectId) + '/changes?since=' + since + '&limit=200' + (args.include_ai ? '' : '&actor=user,system'));
      const lines = r.events.map((e) => 'rev ' + e.rev + ' ' + e.at.slice(11, 19) + ' ' + (e.actor === 'ai' ? 'AI' : e.actor === 'user' ? '用户' : '系统') + (e.label ? '「' + e.label + '」' : '') + '：' + (e.summary ?? []).join('；'));
      return { value: { rev: r.rev, events: r.events }, text: lines.length ? lines.join('\n') : 'rev ' + since + ' 之后没有' + (args.include_ai ? '' : '用户') + '修改（当前 rev ' + r.rev + '）' };
    },
  },
  {
    name: 'djian_frame',
    description: '查看合成后的实际画面（与导出一致：含字幕、转场、动画、画中画）。seconds 可传一个时间点，或 2–12 个时间点拼成一张带时间标签的联络图（一次核对多处）。analyze:true 附带亮度/主色/底部字幕区统计，适合无法看图的模型；activeTextLayers 只表示时间命中，不保证像素可见。',
    parameters: { type: 'object', properties: { seconds: { oneOf: [{ type: 'number', minimum: 0 }, { type: 'array', items: { type: 'number', minimum: 0 }, minItems: 1, maxItems: 12 }] }, analyze: { type: 'boolean' } }, required: ['seconds'] },
    async execute(client, ctx, args) {
      const r = await client.post(p(ctx.projectId) + '/frame', { seconds: args.seconds, analyze: Boolean(args.analyze), maxSize: 768 }, { timeoutMs: 180_000 });
      const frames = r.frames.map((f) => '#' + f.frame + ' @' + f.seconds + 's 文字层：' + (f.activeTextLayers.map((l) => l.id + '「' + l.text + '」').join('、') || '无'));
      const text = [(r.sheet ? '联络图 ' : '画面 ') + r.width + '×' + r.height, ...frames, r.stats ? '画面统计：' + JSON.stringify(r.stats) : ''].filter(Boolean).join('\n');
      return { value: { width: r.width, height: r.height, sheet: r.sheet, frames: r.frames, stats: r.stats }, text, image: { data: Buffer.from(r.imageBase64, 'base64'), mediaType: r.mime } };
    },
  },
  {
    name: 'djian_assets',
    description: '列出当前项目素材库（文件名/类型/时长/分辨率/被引用次数）。addClip/addAudio 的 src 只能用这里的文件名。',
    parameters: { type: 'object', properties: {} },
    async execute(client, ctx) {
      const r = await client.get(p(ctx.projectId) + '/assets');
      const text = r.assets.length ? r.assets.map((a) => a.name + ' · ' + a.type + (a.duration ? ' · ' + a.duration + 's' : '') + (a.width ? ' · ' + a.width + '×' + a.height : '') + (a.usage ? ' · 已用 ' + a.usage + ' 处' : '')).join('\n') : '素材库是空的';
      return { value: { assetsDir: r.assetsDir, assets: r.assets.map(({ name, type, duration, width, height, usage }) => ({ name, type, duration, width, height, usage })) }, text: text + '\n素材目录：' + r.assetsDir };
    },
  },
  {
    name: 'djian_import_asset',
    description: '把本地文件（你生成或用户提供的视频/图片/音频）导入当前项目素材库。优先传本地绝对路径 path；小文件也可传 base64+name。重名会自动改名——之后一律使用返回的实际文件名。不要自己复制文件到素材目录。',
    parameters: { type: 'object', properties: { path: { type: 'string', description: '本地文件绝对路径' }, base64: { type: 'string' }, name: { type: 'string', description: '保存的文件名（base64 时必填，需带扩展名）' } } },
    async execute(client, ctx, args) {
      const r = args.path
        ? await client.post(p(ctx.projectId) + '/assets/import', { path: args.path, name: str(args.name) }, { timeoutMs: 120_000 })
        : await client.post(p(ctx.projectId) + '/assets/base64', { base64: args.base64, name: args.name }, { timeoutMs: 120_000 });
      return { value: r, text: '已导入「' + r.name + '」（' + r.type + (r.duration ? '，' + r.duration + 's' : '') + (r.width ? '，' + r.width + '×' + r.height : '') + '）' };
    },
  },
  {
    name: 'djian_search_media',
    description: '在 Openverse（CC 授权的图片/音频聚合库，可商用需看具体许可）搜索素材。英文关键词效果更好。结果用 djian_download_media 下载进素材库。',
    parameters: { type: 'object', properties: { query: { type: 'string' }, type: { type: 'string', enum: ['image', 'audio'] }, page: { type: 'integer', minimum: 1 } }, required: ['query'] },
    async execute(client, ctx, args) {
      const r = await client.get('/api/library/search?q=' + encodeURIComponent(args.query) + '&type=' + (args.type === 'audio' ? 'audio' : 'image') + '&page=' + (args.page ?? 1), { timeoutMs: 20_000 });
      const text = r.items.length ? r.items.map((x, i) => (i + 1) + '. ' + x.title + ' · ' + x.license + (x.duration ? ' · ' + x.duration + 's' : '') + (x.creator ? ' · by ' + x.creator : '') + '\n   ' + x.url).join('\n') : '没有结果，换个关键词试试';
      return { value: r, text: '共 ' + r.total + ' 条，第 ' + r.page + ' 页：\n' + text };
    },
  },
  {
    name: 'djian_download_media',
    description: '把 djian_search_media 找到的素材下载进当前项目素材库（会记录作者与许可）。返回实际文件名。',
    parameters: { type: 'object', properties: { url: { type: 'string' }, name: { type: 'string' }, kind: { type: 'string', enum: ['image', 'audio'] }, title: { type: 'string' }, license: { type: 'string' }, creator: { type: 'string' } }, required: ['url'] },
    async execute(client, ctx, args) {
      const r = await client.post(p(ctx.projectId) + '/library/import', args, { timeoutMs: 120_000 });
      return { value: r, text: '已下载为「' + r.name + '」（' + r.type + (r.duration ? '，' + r.duration + 's' : '') + '）' };
    },
  },
  {
    name: 'djian_export',
    description: '导出成片 mp4。action:"start" 开始导出（scale 0.5/1/2，quality draft/standard/high），返回 jobId；action:"status" 查询进度。导出完成后提醒用户在剪辑面板下载。',
    parameters: { type: 'object', properties: { action: { type: 'string', enum: ['start', 'status'] }, jobId: { type: 'string' }, scale: { type: 'number', enum: [0.5, 1, 2] }, quality: { type: 'string', enum: ['draft', 'standard', 'high'] } }, required: ['action'] },
    async execute(client, ctx, args) {
      if (args.action === 'status') {
        const r = await client.get('/api/export/' + encodeURIComponent(args.jobId ?? ''));
        return { value: r, text: r.status === 'done' ? '导出完成：' + r.result.fileName + '（' + Math.round(r.result.sizeBytes / 1024 / 1024 * 10) / 10 + 'MB），可在剪辑面板下载' : r.status === 'rendering' ? '导出中 ' + r.progress.percent + '%（' + r.progress.stage + '）' : '导出' + (r.status === 'cancelled' ? '已取消' : '失败：' + r.error) };
      }
      const r = await client.post(p(ctx.projectId) + '/export', { scale: args.scale ?? 1, quality: args.quality ?? 'standard' });
      return { value: r, text: '已开始导出，jobId=' + r.jobId + '；可用 action:"status" 查询进度' };
    },
  },
];

export const toolByName = new Map(TOOLS.map((t) => [t.name, t]));
