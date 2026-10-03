import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRenderBrowser } from '../packages/engine/dist/browser.js';

test('rendering reuses installed Chrome, then Edge, and supports explicit paths', () => {
  const env = { ProgramFiles: 'C:\\Apps' };
  const chrome = 'C:\\Apps\\Google\\Chrome\\Application\\chrome.exe';
  const edge = 'C:\\Apps\\Microsoft\\Edge\\Application\\msedge.exe';
  assert.equal(resolveRenderBrowser({ platform: 'win32', env, isFile: () => true }), chrome);
  assert.equal(resolveRenderBrowser({ platform: 'win32', env, isFile: (p) => p === edge }), edge);
  assert.equal(resolveRenderBrowser({ platform: 'win32', env, isFile: () => false }), undefined);
  assert.equal(resolveRenderBrowser({ platform: 'linux', env: { DJIAN_BROWSER_EXECUTABLE: '/browser' }, isFile: () => true }), '/browser');
  assert.throws(() => resolveRenderBrowser({ env: { DJIAN_BROWSER_EXECUTABLE: '/missing' }, isFile: () => false }), /指定的浏览器不存在/);
});
