// 长任务质量工具：稳定风格卡、轻量新会话接力、可回退检查点。
import { outline } from './outline.js';

const p = (pid) => '/api/p/' + encodeURIComponent(pid);
const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

const STYLE_TOOL = {
  name: 'djian_style',
  description: '读取或维护当前项目的长期风格卡。action:"show" 查看；action:"set" 更新传入字段（未传字段保持不变）；action:"clear" 清空。风格卡会在每个新对话轮次自动注入，避免长上下文后配色、排版和动效漂移。用户认可一种风格后及时保存；不要每轮重写。',
  parameters: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['show', 'set', 'clear'] },
      designStyle: { type: 'string', description: '从 djian-style 技能选定的 MG 风格名称或 id' },
      brief: { type: 'string', description: '一句话风格定位，最多 240 字' },
      background: { type: 'string', description: '背景色，如 #0B0D12' },
      text: { type: 'string', description: '正文颜色' },
      accent: { type: 'string', description: '主强调色' },
      secondary: { type: 'string', description: '可选辅助强调色' },
      fontFamily: { type: 'string', description: '字体 id，如 sans' },
      titleSize: { type: 'number', minimum: 8, maximum: 400 },
      bodySize: { type: 'number', minimum: 6, maximum: 300 },
      margin: { type: 'number', minimum: 0, maximum: 0.3, description: '安全边距比例，0.08 = 8%' },
      maxColors: { type: 'integer', minimum: 1, maximum: 6 },
      maxAnimations: { type: 'integer', minimum: 0, maximum: 4 },
      rules: { type: 'array', items: { type: 'string' }, maxItems: 8, description: '最多 8 条明确、可检查的规则；整体替换旧 rules' },
    },
  },
  async execute(client, ctx, args) {
    const action = args.action ?? 'show';
    if (action === 'clear') {
      await client.request('DELETE', p(ctx.projectId) + '/style');
      return { value: { style: null }, text: '已清空项目风格卡；接下来以用户当前明确要求为准' };
    }
    if (action === 'set') {
      const { action: _, ...patch } = args;
      if (!Object.keys(patch).length) throw new Error('set 至少需要一项风格字段');
      const r = await client.request('PUT', p(ctx.projectId) + '/style', { body: { patch } });
      return { value: r, text: '已保存项目风格卡，后续每个新对话轮次都会稳定遵循：\n' + r.text };
    }
    if (action !== 'show') throw new Error('action 必须是 show/set/clear');
    const r = await client.get(p(ctx.projectId) + '/style');
    return { value: r, text: r.text ?? '尚未设置项目风格卡。用户认可一种风格后，用 action:"set" 保存核心配色、字号、边距和动效约束，保持简短。' };
  },
};

const HANDOFF_TOOL = {
  name: 'djian_handoff',
  description: '生成可粘贴到新会话的轻量接力摘要：当前任务/范围、长期风格卡、时间线大纲、用户当前选中与播放头、最近检查点。上下文变长或开始新镜头/页面时使用；不要转发整段聊天。task 写下一步，scope 限制只改哪个镜头/页面。',
  parameters: {
    type: 'object',
    properties: {
      task: { type: 'string', description: '新会话要完成的一件事' },
      scope: { type: 'string', description: '允许修改的范围，如“只改第3页，不动其他页面”' },
      includeTimeline: { type: 'boolean', description: '是否附当前时间线大纲，默认 true' },
    },
  },
  async execute(client, ctx, args) {
    const base = p(ctx.projectId);
    const [{ rev, timeline }, style, presence, history] = await Promise.all([
      client.get(base + '/timeline'),
      client.get(base + '/style'),
      client.get(base + '/presence').catch(() => ({ user: null })),
      client.get(base + '/history').catch(() => ({ snapshots: [] })),
    ]);
    const lines = ['--- D剪新会话接力（粘贴为新会话第一条消息）---'];
    lines.push('下一步任务：' + (str(args.task) ?? '延续当前项目，先确认状态再处理用户下一步要求'));
    lines.push('修改范围：' + (str(args.scope) ?? '只处理用户明确要求的对象，不做全项目重做'));
    lines.push('项目会由 djian_* 工具自动绑定。先读取 djian_timeline 核对最新 rev；下面的摘要不是可编辑的 JSON。');
    if (style.text) lines.push(style.text);
    else lines.push('项目尚未设置风格卡；保持现有画面的配色与排版，不擅自换风格。');
    const user = presence?.user;
    if (user) {
      const selected = (user.selection ?? []).map((s) => s.id + (s.label ? '「' + s.label + '」' : '')).join('、');
      lines.push('用户当前：播放头 ' + Number(user.playhead ?? 0).toFixed(2) + 's' + (selected ? '；选中 ' + selected : ''));
    }
    if (history.snapshots?.length) lines.push('最近检查点：' + history.snapshots.slice(0, 3).map((s) => s.id + '「' + s.label + '」rev ' + s.rev).join('；') + '。只有用户明确要求回退时才恢复。');
    if (args.includeTimeline !== false) lines.push('当前时间线大纲（rev ' + rev + '）：\n' + outline(timeline, { name: ctx.projectName, rev }));
    lines.push('协作纪律：一次只完成上述任务；不重做已确认部分；不为了“更丰富”增加颜色、元素或动效；修改后取帧检查溢出、对齐、留白、对比度。满意后保存检查点，长对话再次变长时重新生成本摘要。');
    lines.push('--- 接力结束 ---');
    const handoff = lines.join('\n\n');
    return { value: { rev, style: style.style, handoff }, text: handoff };
  },
};

const CHECKPOINT_TOOL = {
  name: 'djian_checkpoint',
  description: '管理可回退的完整时间线检查点。action:"save" 在用户认可版本或大改前保存；action:"list" 查看；action:"restore" 仅在用户明确要求回退时按 id 恢复（恢复前会自动再留一个快照）。不要因 AI 自己不满意就覆盖或回退用户版本。',
  parameters: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['save', 'list', 'restore'] },
      label: { type: 'string', description: 'save：版本名，如“第3页确认版”' },
      id: { type: 'string', description: 'restore：检查点 id' },
    },
    required: ['action'],
  },
  async execute(client, ctx, args) {
    const base = p(ctx.projectId) + '/history';
    if (args.action === 'save') {
      const label = str(args.label) ?? 'AI 阶段确认版';
      const r = await client.post(base, { label, actor: 'ai' });
      return { value: r, text: '已保存检查点 ' + r.id + '「' + label + '」。后续大改可回到这个版本。' };
    }
    if (args.action === 'restore') {
      if (!str(args.id)) throw new Error('restore 需要检查点 id');
      const r = await client.post(base + '/' + encodeURIComponent(args.id) + '/restore', { actor: 'ai', clientId: ctx.clientId });
      ctx.observe(r.rev, r.changed);
      return { value: { rev: r.rev, changed: r.changed }, text: '已恢复检查点 ' + args.id + '（rev ' + r.rev + '）；恢复前状态也已自动留档' };
    }
    if (args.action !== 'list') throw new Error('action 必须是 save/list/restore');
    const r = await client.get(base);
    return { value: r, text: r.snapshots.length ? r.snapshots.slice(0, 20).map((s) => s.id + ' · ' + s.label + ' · rev ' + s.rev + ' · ' + s.at).join('\n') : '还没有检查点' };
  },
};

export const WORKFLOW_TOOLS = [STYLE_TOOL, HANDOFF_TOOL, CHECKPOINT_TOOL];
