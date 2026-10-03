import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Exercise the real sync hook with controlled storage/network and inert React rendering.
// A recovered local draft provides the pending edit; timers never auto-flush it here.
function mount(putTimeline) {
  const effects = [];
  const storage = new Map([['djian.unsaved.test', JSON.stringify({
    format: 'djian-draft-v1', timeline: { revision: 2 }, baseTimeline: '{"revision":1}',
  })]]);
  class TimelineConflictError extends Error {}
  const source = readFileSync(new URL('../packages/client-timeline/src/client/useTimelineSync.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const context = {
    exports: {},
    require(name) {
      if (name === 'react') return {
        useRef: (current) => ({ current }), useState: (value) => [value, () => {}],
        useCallback: (fn) => fn, useEffect: (fn) => effects.push(fn),
      };
      if (name.endsWith('/schema')) return { parseTimeline: (value) => value };
      if (name === './api') return { getTimeline: async () => ({ revision: 1 }), putTimeline, TimelineConflictError };
      throw new Error(`Unexpected import: ${name}`);
    },
    localStorage: { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) },
    document: { hidden: false }, window: { addEventListener() {}, removeEventListener() {} },
    setTimeout: () => 1, clearTimeout() {},
  };
  vm.runInNewContext(outputText, context);
  const hook = context.exports.useTimelineSync('test');
  effects.forEach((effect) => effect());
  return { hook, storage, TimelineConflictError };
}

test('history preparation drains an in-flight save and newer edits before permitting restore', async () => {
  const requests = [];
  const { hook, storage } = mount((value) => new Promise((resolve) => requests.push({ value, resolve })));
  let ready = false;
  const preparation = hook.saveBeforeRestore().then(() => { ready = true; });
  assert.equal(requests[0].value.revision, 2);
  hook.mutate(() => ({ revision: 3 }));
  assert.equal(ready, false);
  requests[0].resolve();
  await new Promise(setImmediate);
  assert.equal(requests[1].value.revision, 3);
  assert.equal(ready, false);
  requests[1].resolve();
  await preparation;
  assert.equal(ready, true);
  assert.equal(storage.has('djian.unsaved.test'), false);
});

test('history preparation refuses failed saves and retains the draft for retry', async () => {
  let offline = true;
  const { hook, storage } = mount(async () => { if (offline) throw new Error('offline'); });
  await assert.rejects(hook.saveBeforeRestore(), /当前修改尚未保存/);
  assert.equal(storage.has('djian.unsaved.test'), true);
  offline = false;
  await hook.saveBeforeRestore();
  assert.equal(storage.has('djian.unsaved.test'), false);
});

test('history preparation refuses unresolved conflicts without retrying an overwrite', async () => {
  let requests = 0;
  const mounted = mount(async () => { requests++; throw new mounted.TimelineConflictError('conflict'); });
  await assert.rejects(mounted.hook.saveBeforeRestore(), /先处理版本冲突/);
  await assert.rejects(mounted.hook.saveBeforeRestore(), /先处理版本冲突/);
  assert.equal(requests, 1);
  assert.equal(mounted.storage.has('djian.unsaved.test'), true);
});
