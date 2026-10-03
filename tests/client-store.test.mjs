// 面板协同 store 对接真实引擎：乐观更新、与 AI 并发、撤销只回退自己的修改、单独撤销 AI 的修改、刷新后恢复未保存批次
import test from 'node:test';
import assert from 'node:assert/strict';
import { startEngine } from './helpers/engine.mjs';
import { loadTs } from './helpers/ts-load.mjs';

const engine = await startEngine();
const mem = new Map([['djian.enginePort', String(engine.port)]]);
globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
const { TimelineStore } = await loadTs('packages/client-timeline/src/client/store.ts');
const { computeLayout, snap, snapPoints } = await loadTs('packages/client-timeline/src/client/timeline/layout.ts');

const until = async (fn, ms = 8000) => {
  const t0 = Date.now();
  while (!fn()) {
    if (Date.now() - t0 > ms) throw new Error('等待超时');
    await new Promise((r) => setTimeout(r, 20));
  }
};
const texts = (t) => t.overlays.map((o) => o.text).sort();

test.after(() => engine.stop());

test('store: 乐观更新 + AI 并发 + 撤销只回退自己的修改 + 单独撤销 AI 修改', async () => {
  const store = new TimelineStore('sess-store-1');
  const s = () => store.getSnapshot();
  await store.start();
  try {
    assert.equal(s().status, 'live');
    const pid = s().project.id;

    const [receipt] = store.dispatch([{ op: 'addOverlay', text: '用户字幕', startSeconds: 0, endSeconds: 2 }], { label: '添加字幕' });
    assert.deepEqual(texts(s().timeline), ['用户字幕'], '本地立即可见');
    const userId = receipt.id;
    assert.ok(userId);
    await until(() => s().pending === 0 && s().status === 'live');

    // AI 经服务端修改；面板此时还没收到（Node 无 EventSource，靠提交时的追赶）
    const ai = await engine.api('POST', '/api/p/' + pid + '/ops', { actor: 'ai', ops: [{ op: 'addOverlay', text: 'AI 字幕', startSeconds: 3, endSeconds: 5 }], label: 'AI 加字幕' });
    assert.equal(ai.status, 200, JSON.stringify(ai.body));

    store.dispatch([{ op: 'updateOverlay', id: userId, patch: { text: '用户改过' } }], { label: '改字' });
    await until(() => s().pending === 0 && texts(s().timeline).length === 2);
    assert.deepEqual(texts(s().timeline), ['AI 字幕', '用户改过']);
    assert.ok(s().activity.some((a) => a.actor === 'ai'), 'AI 修改进入动态');

    // 撤销两次：只回退面板自己的两步，AI 的字幕保留
    store.undo();
    assert.deepEqual(texts(s().timeline), ['AI 字幕', '用户字幕']);
    store.undo();
    assert.deepEqual(texts(s().timeline), ['AI 字幕']);
    await until(() => s().pending === 0);
    const server = await engine.api('GET', '/api/p/' + pid + '/timeline');
    assert.deepEqual(texts(server.body.timeline), ['AI 字幕'], '服务端与面板一致');

    // 单独撤销 AI 的那次修改
    const item = s().activity.find((a) => a.actor === 'ai');
    assert.ok(item?.inverse?.length, 'AI 事件带反向补丁');
    store.revert(item);
    await until(() => s().pending === 0);
    assert.deepEqual(texts(s().timeline), []);
    assert.deepEqual(texts((await engine.api('GET', '/api/p/' + pid + '/timeline')).body.timeline), []);

    // 撤销 AI 修改本身也能再撤销
    assert.equal(s().undoLabel, '撤销 AI修改「AI 加字幕」');
    store.undo();
    await until(() => s().pending === 0);
    assert.deepEqual(texts(s().timeline), ['AI 字幕']);
  } finally {
    store.stop();
  }
});

test('store: 断网期间的修改落本地，重启后按 batchId 补发且不重复', async () => {
  const store = new TimelineStore('sess-store-2');
  await store.start();
  const pid = store.getSnapshot().project.id;
  // 模拟提交前页面被关掉：直接把批次写进本地草稿
  const key = 'djian.pending.' + pid;
  mem.set(key, JSON.stringify([{ batchId: 'b-offline-1', ops: [{ op: 'addMarker', id: 'm1', t: 1, label: '离线标记' }], label: '离线', undo: false }]));
  store.stop();
  const again = new TimelineStore('sess-store-2');
  await again.start();
  await until(() => again.getSnapshot().pending === 0 && again.getSnapshot().status === 'live');
  // 再补发同一批（例如两个窗口都恢复了草稿）也不会重复
  const dup = await engine.api('POST', '/api/p/' + pid + '/ops', { ops: [{ op: 'addMarker', id: 'm1', t: 1, label: '离线标记' }], batchId: 'b-offline-1', clientId: 'x' });
  assert.equal(dup.status, 200);
  assert.equal(dup.body.duplicate, true);
  const t = (await engine.api('GET', '/api/p/' + pid + '/timeline')).body.timeline;
  assert.equal(t.markers.length, 1);
  assert.equal(mem.has(key), false, '确认后清除本地草稿');
  again.stop();
});

test('layout: 文字在上、画中画上层在上、主轨、音频在下；专注模式折叠其余轨道；吸附', () => {
  const clip = (id, d, extra = {}) => ({ id, type: 'video', src: id + '.mp4', inPoint: 0, clipDuration: d, transition: 'none', volume: 1, speed: 1, ...extra });
  const t = {
    meta: { fps: 30, width: 1920, height: 1080 }, version: 5,
    videoTracks: [
      { id: 'v0', clips: [clip('c1', 3), clip('c2', 2)] },
      { id: 'v1', name: '画中画 A', clips: [clip('p1', 1, { atSeconds: 1 })] },
      { id: 'v2', name: '画中画 B', clips: [clip('p2', 1, { atSeconds: 0.5 }), clip('p3', 1, { atSeconds: 1 })] },
    ],
    audioTracks: [{ id: 'a1', volume: 1, muted: false, clips: [{ id: 'au1', src: 'm.mp3', inPoint: 0, duration: 4, volume: 1, atSeconds: 0, speed: 1 }] }],
    overlays: [
      { id: 'o1', text: '一', startSeconds: 0, endSeconds: 1, position: 'bottom', fontSize: 60, color: '#fff' },
      { id: 'o2', text: '二', startSeconds: 0.5, endSeconds: 1.5, position: 'top', fontSize: 60, color: '#fff', track: 1 },
    ],
    markers: [{ id: 'mk', t: 2.5 }],
  };
  const L = computeLayout(t, 'all', false);
  assert.deepEqual(L.lanes.map((l) => l.key), ['text:1', 'text:0', 'track:v2', 'track:v1', 'track:v0', 'track:a1']);
  assert.equal(L.lanes.find((l) => l.key === 'track:v2').rows, 2, '重叠片段分行');
  assert.deepEqual(L.blocks.filter((b) => b.kind === 'main').map((b) => b.start), [0, 3]);
  assert.equal(L.total, 5);
  const focused = computeLayout(t, 'audio', false);
  assert.ok(focused.lanes.filter((l) => l.kind !== 'audio').every((l) => l.collapsed && l.height === 12));
  assert.ok(focused.height < L.height);
  const pts = snapPoints(t, L, new Set(['p1']), 0.2);
  assert.ok(pts.includes(2.5) && pts.includes(3) && pts.includes(0.2) && !pts.includes(2) === false);
  assert.deepEqual(snap(2.96, pts, 0.1), { value: 3, at: 3 });
  assert.deepEqual(snap(2.7, pts, 0.1), { value: 2.7, at: null });
});
