import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

test('unresponsive timeline reads and saves abort and allow a subsequent request', async () => {
  const source = readFileSync(new URL('../packages/client-timeline/src/client/api.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const controllers = [];
  let responsive = false;
  let requests = 0;
  const context = {
    exports: {},
    AbortSignal: { timeout(ms) {
      assert.equal(ms, 15_000);
      const controller = new AbortController();
      controllers.push(controller);
      return controller.signal;
    } },
    fetch: async (_url, options) => {
      requests++;
      if (responsive) return { ok: true, json: async () => ({ revision: 1 }) };
      return new Promise((_resolve, reject) => {
        options.signal.throwIfAborted();
        options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true });
      });
    },
  };
  vm.runInNewContext(outputText, context);
  for (const invoke of [() => context.exports.getTimeline('test'), () => context.exports.putTimeline({}, 'test')]) {
    const pending = invoke();
    const rejected = assert.rejects(pending, { name: 'TimeoutError' });
    await new Promise(setImmediate);
    controllers.at(-1).abort(new DOMException('Request timed out', 'TimeoutError'));
    await rejected;
  }
  assert.equal(requests, 2, 'timeouts must not trigger an automatic mutation retry');
  responsive = true;
  await context.exports.putTimeline({}, 'test');
  assert.equal((await context.exports.getTimeline('test')).revision, 1);
});
