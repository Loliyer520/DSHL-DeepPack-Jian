import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRenderBrowser, installedMajorVersion } from '../packages/engine/dist/browser.js';

test('rendering picks the newest sufficiently recent Chrome/Edge and supports explicit paths', () => {
  const env = { ProgramFiles: 'C:\\Apps', LOCALAPPDATA: 'C:\\Users\\u\\AppData\\Local' };
  const chrome = 'C:\\Apps\\Google\\Chrome\\Application\\chrome.exe';
  const userChrome = 'C:\\Users\\u\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
  const edge = 'C:\\Apps\\Microsoft\\Edge\\Application\\msedge.exe';
  const versions = { [chrome]: 130, [userChrome]: 103, [edge]: 154 };
  assert.equal(resolveRenderBrowser({ platform: 'win32', env, isFile: () => true, majorOf: (f) => versions[f] }), edge);
  assert.equal(resolveRenderBrowser({ platform: 'win32', env, isFile: (p) => p !== edge, majorOf: (f) => versions[f] }), chrome);
  // 只有过旧的浏览器（文字层会空白）：不用它，交给 Remotion 自带浏览器
  assert.equal(resolveRenderBrowser({ platform: 'win32', env, isFile: (p) => p === userChrome, majorOf: (f) => versions[f] }), undefined);
  assert.equal(resolveRenderBrowser({ platform: 'win32', env, isFile: () => false }), undefined);
  assert.equal(resolveRenderBrowser({ platform: 'linux', env: { DJIAN_BROWSER_EXECUTABLE: '/browser' }, isFile: () => true }), '/browser');
  assert.throws(() => resolveRenderBrowser({ env: { DJIAN_BROWSER_EXECUTABLE: '/missing' }, isFile: () => false }), /指定的浏览器不存在/);
});

test('version folders next to the executable decide the installed major version', () => {
  const list = () => ['103.0.5060.114', '154.0.4258.53', 'SetupMetrics', 'chrome.exe'];
  assert.equal(installedMajorVersion('C:\\x\\chrome.exe', list), 154);
  assert.equal(installedMajorVersion('C:\\x\\chrome.exe', () => ['SetupMetrics']), undefined);
});
