// 测试辅助：把面板的 TS 模块（及其相对依赖）即时转译到 node_modules/.cache 后导入。
// 面板源码用 bundler 风格的无扩展名导入，Node 不能直接加载；这里逐个转译并把相对导入改写成文件 URL。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'node_modules/.cache/djian-ts', String(process.pid));
fs.mkdirSync(OUT, { recursive: true });
process.on('exit', () => { try { fs.rmSync(OUT, { recursive: true, force: true }); } catch {} });

const compiled = new Map();

function resolveSpec(from, spec) {
  const abs = path.resolve(path.dirname(from), spec);
  const stem = abs.endsWith('.js') ? abs.slice(0, -3) : abs;
  return [stem + '.ts', stem + '.tsx', path.join(stem, 'index.ts'), abs].find((f) => fs.existsSync(f) && fs.statSync(f).isFile());
}

function compile(file) {
  if (compiled.has(file)) return compiled.get(file);
  const target = path.join(OUT, path.relative(ROOT, file).replace(/[\\/]/g, '__').replace(/\.tsx?$/, '.mjs'));
  compiled.set(file, target);
  const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName: file,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
  });
  const code = outputText.replace(/((?:from|import)\s*\(?\s*)(['"])(\.{1,2}\/[^'"]+)\2/g, (m, pre, q, spec) => {
    const dep = resolveSpec(file, spec);
    return dep ? pre + q + pathToFileURL(compile(dep)).href + q : m;
  });
  fs.writeFileSync(target, code);
  return target;
}

/** 以仓库根为基准导入一个 TS 模块 */
export const loadTs = (rel) => import(pathToFileURL(compile(path.join(ROOT, rel))).href);
