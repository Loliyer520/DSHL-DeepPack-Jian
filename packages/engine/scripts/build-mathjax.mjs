#!/usr/bin/env node
// 把 MathJax（开发依赖 mathjax-full）连同入口打成 dist/mathjax.cjs：整合包运行时不需要额外依赖。
// 入口与 mathjax-full 版本没变时跳过（npm test 每次都会构建引擎）。
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const engineDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entry = path.join(engineDir, 'mathjax/entry.ts');
const out = path.join(engineDir, 'dist/mathjax.cjs');
const stampFile = path.join(engineDir, 'dist/mathjax.stamp.json');
const require = createRequire(path.join(engineDir, '../../package.json'));
const version = JSON.parse(fs.readFileSync(require.resolve('mathjax-full/package.json'), 'utf8')).version;
const stamp = JSON.stringify({ version, entry: fs.statSync(entry).mtimeMs, types: fs.statSync(path.join(engineDir, 'src/mathData.ts')).mtimeMs });

if (fs.existsSync(out) && fs.existsSync(stampFile) && fs.readFileSync(stampFile, 'utf8') === stamp) process.exit(0);

const { build } = await import('tsdown');
await build({
  entry: { mathjax: entry },
  outDir: path.dirname(out),
  format: ['cjs'],
  platform: 'node',
  target: 'node22',
  clean: false,
  dts: false,
  minify: true,
  logLevel: 'error',
  deps: { alwaysBundle: [/.*/], onlyBundle: false },
  config: false,
  outExtensions: () => ({ js: '.cjs' }),
});
if (!fs.existsSync(out)) { console.error('✗ MathJax 打包没有产出 ' + path.relative(engineDir, out)); process.exit(1); }
fs.writeFileSync(stampFile, stamp);
console.log('MathJax → ' + path.relative(process.cwd(), out) + '（' + (fs.statSync(out).size / 1024).toFixed(0) + ' KB）');
