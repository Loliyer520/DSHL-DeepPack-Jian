// @djian/host-bridge —— DSH 宿主侧桥接插件
//  1. 原生剪辑工具 djian_*：从 exec.agent.session.id 取会话，工具永远作用于该会话绑定的项目
//  2. agent/pre-step：每次调用模型前，把用户在剪辑面板的新修改与当前选中/播放头注入为一条上下文
//  3. agent/status：把 AI 的工作状态同步给剪辑面板（显示“AI 正在编辑”）
// 运行时不 import 任何 @deepseek-ai 包（只用 ctx 服务），避免把宿主再装进 profile。
import { randomUUID } from 'node:crypto';
import { EngineClient } from './lib/engine-client.js';
import { TOOLS } from './lib/tools.js';
import { SessionState, buildActivity, parseInjectedRev } from './lib/activity.js';
import { spawnEngine } from './lib/spawn.js';

export const name = 'djian-host-bridge';
export const inject = ['tools'];

const deepFreeze = (o) => {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) deepFreeze(v); }
  return o;
};
export const activityMessage = (text) => deepFreeze({
  id: randomUUID(),
  role: 'user',
  content: [{ type: 'text', text }],
  source: { kind: 'djian-activity', form: 'snapshot', sections: [{ name: 'djian-activity', text }] },
});
const jsonSafe = (v) => JSON.parse(JSON.stringify(v ?? null));

export function apply(ctx, config = {}) {
  const log = (msg) => { if (config.debug) console.log('[djian-host-bridge] ' + msg); };
  const client = new EngineClient({ clientId: 'djian-host-bridge' });
  const sessions = new Map();
  const images = new WeakMap();

  const stateFor = (sid) => {
    let s = sessions.get(sid);
    if (!s) { s = new SessionState(sid); sessions.set(sid, s); }
    return s;
  };
  async function resolve(sid) {
    const state = stateFor(sid);
    if (!state.projectId) {
      const project = await client.projectFor(sid);
      state.projectId = project.id;
      state.projectName = project.name ?? null;
    }
    return state;
  }
  const presence = (state, status, label) => {
    if (!state?.projectId) return;
    client.post('/api/p/' + encodeURIComponent(state.projectId) + '/presence', { clientId: state.clientId, actor: 'ai', status, label: label ?? null }, { timeoutMs: 1500 }).catch(() => {});
  };

  // 引擎：DSHL 托管时直接发现；其他启动器下按需拉起，插件卸载时结束
  if (config.spawnEngine !== false && !process.env.DSHL_SERVICE_PORTS) {
    let child = null;
    ctx.effect(() => {
      client.discover().catch(async () => {
        try { child = await spawnEngine(client, { port: config.port ?? 5180, log }); log('引擎已由宿主插件拉起'); }
        catch (e) { log('拉起引擎失败：' + e.message); }
      });
      return () => { child?.kill(); child = null; };
    }, 'djian: engine supervisor');
  }

  registerTools(ctx, { client, resolve, presence, images, log });
  registerActivity(ctx, { client, resolve, sessions, presence, config, log });
}

function registerTools(ctx, { client, resolve, presence, images, log }) {
  async function prepareImage(exec, value, image) {
    try {
      const attachments = ctx.get('attachments');
      const llm = ctx.get('llm');
      if (!attachments || !llm) return;
      const routed = exec.agent?.session?.requestHeader?.()?.config;
      const provider = routed?.provider ?? exec.agent?.options?.provider;
      const model = routed?.model ?? exec.agent?.options?.model;
      if (!provider || !model) return;
      const info = await llm.resolveModelInfo(provider, model, exec.signal);
      if (!info?.inputModalities?.includes('image')) return;
      const [ref] = await attachments.saveImages([{ data: new Uint8Array(image.data), mediaType: image.mediaType, name: 'djian-frame' }]);
      if (ref) images.set(exec, [{ type: 'text', text: value.message }, { type: 'image', attachment: ref }]);
    } catch (e) {
      log('画面附件保存失败，只返回文字：' + e.message);
    }
  }
  for (const tool of TOOLS) {
    ctx.effect(() => ctx.tools.register({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      timeoutMs: tool.name === 'djian_frame' ? 200_000 : 130_000,
      output: {
        schema: { description: 'D剪工具结果；message 为给模型的摘要' },
        render: (_args, value) => [{ type: 'text', text: String(value?.message ?? JSON.stringify(value)) }],
      },
      async execute(args, exec) {
        const sid = exec.agent?.session?.id;
        if (!sid) throw new Error('D剪工具需要在会话中调用');
        const state = await resolve(sid);
        presence(state, 'editing', tool.name);
        const result = await tool.execute(client, state, args && typeof args === 'object' ? args : {});
        const value = jsonSafe({ message: result.text, ...result.value });
        if (result.image) await prepareImage(exec, value, result.image);
        return value;
      },
      projectContent(exec, result) {
        const prepared = images.get(exec);
        if (!prepared) return undefined;
        images.delete(exec);
        return result.isError ? undefined : prepared;
      },
    }), 'djian: tool ' + tool.name);
  }
}

function registerActivity(ctx, { client, resolve, sessions, presence, config, log }) {
  // 宿主重启后从会话历史恢复上次注入到的修订号，避免把旧修改重复告诉模型
  const recoverInjectedRev = (agent) => {
    try {
      const session = agent.session;
      for (let seq = session.seq - 1, scanned = 0; seq >= 0 && scanned < 3000; seq--, scanned++) {
        const ev = session.eventAt(seq);
        if (ev?.type === 'user/message' && ev.data?.source?.kind === 'djian-activity') return parseInjectedRev(ev.data.content?.[0]?.text);
      }
    } catch {}
    return undefined;
  };
  ctx.on('agent/pre-step', async (payload, next) => {
    const decision = await next();
    if (decision.kind === 'reject' || payload.signal?.aborted || config.injectActivity === false) return decision;
    const sid = payload.agent?.session?.id;
    if (!sid) return decision;
    try {
      const state = await Promise.race([resolve(sid), new Promise((_, rej) => setTimeout(() => rej(new Error('项目解析超时')), 1500))]);
      if (state.lastInjectedRev === undefined) state.lastInjectedRev = recoverInjectedRev(payload.agent);
      const text = await buildActivity(client, state, { step: payload.step, signal: payload.signal });
      if (!text) return decision;
      return { ...decision, messages: [...decision.messages, activityMessage(text)] };
    } catch (e) {
      log('编辑事件注入跳过：' + e.message);
      return decision;
    }
  }, { prepend: true });

  ctx.on('agent/status', ({ agent, status }) => {
    presence(sessions.get(agent?.session?.id), status === 'running' ? 'running' : 'idle');
  });
}
