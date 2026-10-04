#!/usr/bin/env node
// D剪 MCP 适配器（stdio）：给 DSH 之外的 agent（Claude Code、Codex、其他 MCP 客户端）调用剪辑引擎。
// 与宿主插件共用同一套工具定义（../host-bridge/lib/tools.js）；MCP 协议不携带会话，
// 所以每个工具都要求显式传 projectId（用 djian_projects 列出或新建）。
import readline from 'node:readline';
import { EngineClient } from '../host-bridge/lib/engine-client.js';
import { TOOLS, toolByName } from '../host-bridge/lib/tools.js';
import { SessionState } from '../host-bridge/lib/activity.js';

const client = new EngineClient({ clientId: 'djian-mcp' });
const states = new Map();
const stateFor = async (projectId) => {
  if (typeof projectId !== 'string' || !projectId) throw new Error('缺少 projectId：先调用 djian_projects 列出或新建项目');
  let s = states.get(projectId);
  if (!s) {
    s = new SessionState('mcp-' + projectId);
    s.projectId = projectId;
    const list = await client.get('/api/projects');
    const p = list.projects.find((x) => x.id === projectId);
    if (!p) throw new Error('项目 ' + projectId + ' 不存在');
    s.projectName = p.name;
    states.set(projectId, s);
  }
  return s;
};

const withProject = (schema) => ({
  ...schema,
  properties: { projectId: { type: 'string', description: '剪辑项目 id（djian_projects 返回）' }, ...(schema.properties ?? {}) },
  required: ['projectId', ...(schema.required ?? [])],
});

const PROJECTS_TOOL = {
  name: 'djian_projects',
  description: '列出 D剪 剪辑项目；传 create:{name, width?, height?, fps?} 新建项目。其他 djian_* 工具都需要 projectId。',
  inputSchema: { type: 'object', properties: { create: { type: 'object', properties: { name: { type: 'string' }, width: { type: 'number' }, height: { type: 'number' }, fps: { type: 'number' } } } } },
};

const listTools = () => [PROJECTS_TOOL, ...TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: withProject(t.parameters) }))];

async function callTool(name, args = {}) {
  if (name === 'djian_projects') {
    if (args.create) {
      const r = await client.post('/api/projects', { name: args.create.name, meta: { width: args.create.width, height: args.create.height, fps: args.create.fps } });
      return { content: [{ type: 'text', text: '已新建项目 ' + r.id + '「' + r.project?.name + '」' }], structuredContent: r };
    }
    const r = await client.get('/api/projects');
    return { content: [{ type: 'text', text: r.projects.map((p) => p.id + ' 「' + p.name + '」 ' + (p.meta ? p.meta.width + '×' + p.meta.height + '@' + p.meta.fps : '')).join('\n') || '还没有项目' }], structuredContent: r };
  }
  const tool = toolByName.get(name);
  if (!tool) throw new Error('未知工具 ' + name);
  const { projectId, ...rest } = args;
  const state = await stateFor(projectId);
  const result = await tool.execute(client, state, rest);
  const content = [{ type: 'text', text: result.text }];
  if (result.image) content.push({ type: 'image', data: result.image.data.toString('base64'), mimeType: result.image.mediaType });
  return { content, structuredContent: JSON.parse(JSON.stringify(result.value ?? {})) };
}

const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
  let msg;
  try { msg = JSON.parse(line); } catch { return; }
  const { id, method, params } = msg;
  const reply = (result) => id !== undefined && send({ jsonrpc: '2.0', id, result });
  const fail = (code, message) => id !== undefined && send({ jsonrpc: '2.0', id, error: { code, message } });
  switch (method) {
    case 'initialize':
      reply({ protocolVersion: params?.protocolVersion ?? '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: 'djian', version: '0.2.0' } });
      break;
    case 'notifications/initialized':
    case 'initialized':
      break;
    case 'ping':
      reply({});
      break;
    case 'tools/list':
      reply({ tools: listTools() });
      break;
    case 'tools/call':
      callTool(params?.name, params?.arguments ?? {})
        .then(reply)
        .catch((e) => reply({ isError: true, content: [{ type: 'text', text: '错误：' + (e?.message ?? e) }] }));
      break;
    default:
      fail(-32601, '未知方法 ' + method);
  }
});
