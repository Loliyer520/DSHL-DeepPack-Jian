import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import vm from 'node:vm';
import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import * as ReactDOM from 'react-dom';

test('published timeline bundle activates using only browser host seeds', () => {
  const seeds = new Map([['react', React], ['react/jsx-runtime', jsxRuntime], ['react-dom', ReactDOM]]);
  const requested = new Set();
  let plugin;
  const styles = [];
  const sandbox = {
    console, setTimeout, clearTimeout,
    document: {
      createElement: () => ({remove() { styles.pop(); }}),
      head: {appendChild(style) { styles.push(style); }},
    },
    window: {__ModuleLoader__: {load({id, factory}) {
      assert.equal(id, '@djian/client-ui-timeline');
      plugin = factory(name => {
        requested.add(name);
        assert.ok(seeds.has(name), `Unavailable host module: ${name}`);
        return seeds.get(name);
      });
    }}},
  };
  vm.runInNewContext(readFileSync(new URL('../packages/client-timeline/lib/client.js', import.meta.url), 'utf8'), sandbox);
  assert.equal(typeof plugin.apply, 'function');
  assert.deepEqual(Array.from(plugin.inject), ['slots', 'sidebarRightTabs', 'sidebarRight']);
  const cleanups = [];
  let tab, panel;
  plugin.apply({
    effect(fn) { cleanups.push(fn()); },
    sidebarRight: {},
    sidebarRightTabs: {register(value) { tab = value; return () => {}; }},
    slots: {
      inject(name, fn) { assert.equal(name, 'sidebar.right.pane.tab'); return fn(); },
      register(options, component) { panel = component; return () => {}; },
    },
  });
  assert.equal(tab.kind, 'djian.timeline');
  assert.equal(typeof panel, 'function');
  assert.equal(styles.length, 1);
  assert.match(styles[0].textContent, /\.dj-root/);
  assert.ok(requested.has('react'));
  assert.ok(!requested.has('react-dom/server'));
  for (const cleanup of cleanups.reverse()) cleanup?.();
  assert.equal(styles.length, 0);
});
