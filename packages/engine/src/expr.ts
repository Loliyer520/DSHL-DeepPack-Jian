// 数学表达式：解析成闭包求值（不用 eval）。坐标系里的函数、参数、点坐标、标注里的 {…} 都走这里。
// 语法：+ - * / ^（右结合）、括号、|x| 绝对值、n! 阶乘、隐式乘法（2x、2(x+1)、x(x+1)、2sin(x)）。
// 名字：变量（x/t/参数）、常量 pi e tau、内置函数、用户函数（坐标系里带 id 的函数，如 f(a)）。

export class ExprError extends Error {}

export interface ExprEnv {
  vars: Record<string, number>;
  fns?: Record<string, (x: number) => number>;
}
export type Compiled = (env: ExprEnv) => number;

const CONSTANTS: Record<string, number> = { pi: Math.PI, e: Math.E, tau: Math.PI * 2 };
const factorial = (n: number) => {
  if (n < 0 || !Number.isFinite(n)) return NaN;
  if (n > 170) return Infinity;
  // 非整数用 Γ(n+1) 的 Stirling 近似（够画图用）
  if (!Number.isInteger(n)) return Math.sqrt(2 * Math.PI / (n + 1)) * Math.pow((n + 1 + 1 / (12 * (n + 1) - 1 / (10 * (n + 1)))) / Math.E, n + 1);
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
};
const FUNCS: Record<string, (...a: number[]) => number> = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  cot: (x) => 1 / Math.tan(x), sec: (x) => 1 / Math.cos(x), csc: (x) => 1 / Math.sin(x),
  asin: Math.asin, acos: Math.acos, atan: Math.atan, arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan,
  atan2: (y, x) => Math.atan2(y, x),
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
  exp: Math.exp, ln: Math.log, log: Math.log, log10: Math.log10, log2: Math.log2,
  sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, sign: Math.sign,
  floor: Math.floor, ceil: Math.ceil, round: Math.round,
  min: (...a) => Math.min(...a), max: (...a) => Math.max(...a), pow: (a, b) => Math.pow(a, b),
  mod: (a, b) => ((a % b) + b) % b,
};
/** 参数/函数 id 不能和这些名字重名 */
export const RESERVED_NAMES = new Set([...Object.keys(CONSTANTS), ...Object.keys(FUNCS)]);

type Tok = { k: "num"; v: number } | { k: "id"; v: string } | { k: "op"; v: string };
const ALIASES: Record<string, string> = { "π": "pi", "τ": "tau", "θ": "t", "×": "*", "·": "*", "÷": "/", "−": "-", "–": "-", "²": "^2", "³": "^3" };

function tokenize(src: string): Tok[] {
  let s = "";
  for (const ch of src) s += ALIASES[ch] ?? ch;
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    const num = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(s.slice(i));
    if (num) { out.push({ k: "num", v: Number(num[0]) }); i += num[0].length; continue; }
    const id = /^[A-Za-z_][A-Za-z0-9_]*/.exec(s.slice(i));
    if (id) { out.push({ k: "id", v: id[0] }); i += id[0].length; continue; }
    if (s.startsWith("**", i)) { out.push({ k: "op", v: "^" }); i += 2; continue; }
    if ("+-*/^(),|!".includes(c)) { out.push({ k: "op", v: c }); i++; continue; }
    throw new ExprError("表达式里有无法识别的字符「" + c + "」");
  }
  return out;
}

type Node =
  | { t: "n"; v: number }
  | { t: "v"; name: string }
  | { t: "u"; op: string; a: Node }
  | { t: "b"; op: string; a: Node; b: Node }
  | { t: "f"; name: string; args: Node[] };

function parse(src: string, userFns: ReadonlySet<string>): Node {
  const toks = tokenize(src);
  if (!toks.length) throw new ExprError("表达式为空");
  let p = 0;
  const peek = () => toks[p];
  const isOp = (v: string) => peek()?.k === "op" && peek()!.v === v;
  const expect = (v: string) => {
    if (!isOp(v)) throw new ExprError("表达式缺少「" + v + "」");
    p++;
  };
  const isFn = (name: string) => name in FUNCS || userFns.has(name);
  // 能开始一个因子的记号（用于隐式乘法）
  const startsFactor = () => {
    const t = peek();
    return Boolean(t && (t.k === "num" || t.k === "id" || (t.k === "op" && t.v === "(")));
  };

  function sum(): Node {
    let a = product();
    while (isOp("+") || isOp("-")) {
      const op = String(toks[p++].v);
      a = { t: "b", op, a, b: product() };
    }
    return a;
  }
  function product(): Node {
    let a = unary();
    for (;;) {
      if (isOp("*") || isOp("/")) {
        const op = String(toks[p++].v);
        a = { t: "b", op, a, b: unary() };
      } else if (startsFactor()) {
        a = { t: "b", op: "*", a, b: power() };
      } else return a;
    }
  }
  function unary(): Node {
    if (isOp("-")) { p++; return { t: "u", op: "-", a: unary() }; }
    if (isOp("+")) { p++; return unary(); }
    return power();
  }
  function power(): Node {
    const base = postfix();
    if (isOp("^")) { p++; return { t: "b", op: "^", a: base, b: unary() }; }
    return base;
  }
  function postfix(): Node {
    let a = primary();
    while (isOp("!")) { p++; a = { t: "f", name: "!", args: [a] }; }
    return a;
  }
  function primary(): Node {
    const tok = peek();
    if (!tok) throw new ExprError("表达式不完整");
    if (tok.k === "num") { p++; return { t: "n", v: tok.v }; }
    if (tok.k === "op" && tok.v === "(") { p++; const e = sum(); expect(")"); return e; }
    if (tok.k === "op" && tok.v === "|") { p++; const e = sum(); expect("|"); return { t: "f", name: "abs", args: [e] }; }
    if (tok.k === "id") {
      p++;
      if (isFn(tok.v) && isOp("(")) {
        p++;
        const args: Node[] = [];
        if (!isOp(")")) {
          args.push(sum());
          while (isOp(",")) { p++; args.push(sum()); }
        }
        expect(")");
        return { t: "f", name: tok.v, args };
      }
      if (isFn(tok.v) && tok.v in FUNCS) throw new ExprError("函数 " + tok.v + " 后面要加括号，如 " + tok.v + "(x)");
      return { t: "v", name: tok.v };
    }
    throw new ExprError("表达式里多了「" + tok.v + "」");
  }

  const root = sum();
  if (p < toks.length) throw new ExprError("表达式里多了「" + toks[p].v + "」");
  return root;
}

// 用户函数互相调用的深度上限（防止 f(x)=f(x) 这类递归卡死）
let depth = 0;
function build(n: Node): Compiled {
  switch (n.t) {
    case "n": { const v = n.v; return () => v; }
    case "v": {
      const name = n.name;
      if (name in CONSTANTS) { const v = CONSTANTS[name]; return () => v; }
      return (env) => env.vars[name] ?? NaN;
    }
    case "u": { const a = build(n.a); return (env) => -a(env); }
    case "b": {
      const a = build(n.a), b = build(n.b);
      switch (n.op) {
        case "+": return (env) => a(env) + b(env);
        case "-": return (env) => a(env) - b(env);
        case "*": return (env) => a(env) * b(env);
        case "/": return (env) => a(env) / b(env);
        default: return (env) => Math.pow(a(env), b(env));
      }
    }
    case "f": {
      const args = n.args.map(build);
      if (n.name === "!") return (env) => factorial(args[0](env));
      const builtin = FUNCS[n.name];
      if (builtin) return (env) => builtin(...args.map((f) => f(env)));
      const name = n.name;
      return (env) => {
        const user = env.fns?.[name];
        if (!user || depth > 16) return NaN;
        depth++;
        try { return user(args[0]?.(env) ?? NaN); } finally { depth--; }
      };
    }
  }
}

function collect(n: Node, vars: Set<string>, calls: Set<string>) {
  if (n.t === "v" && !(n.name in CONSTANTS)) vars.add(n.name);
  else if (n.t === "u") collect(n.a, vars, calls);
  else if (n.t === "b") { collect(n.a, vars, calls); collect(n.b, vars, calls); }
  else if (n.t === "f") { if (!(n.name in FUNCS) && n.name !== "!") calls.add(n.name); n.args.forEach((a) => collect(a, vars, calls)); }
}

const cache = new Map<string, { fn: Compiled; vars: Set<string>; calls: Set<string> }>();
/** 编译表达式（按源码+用户函数名缓存）；语法错误抛 ExprError */
export function compileExpr(src: string, userFns: ReadonlySet<string> = new Set()): Compiled {
  return analyzeExpr(src, userFns).fn;
}
/** 编译并给出用到的变量名与用户函数名（净化时用来检查拼写） */
export function analyzeExpr(src: string, userFns: ReadonlySet<string> = new Set()) {
  const key = [...userFns].sort().join(",") + "|" + src;
  let hit = cache.get(key);
  if (!hit) {
    const root = parse(src, userFns);
    const vars = new Set<string>(), calls = new Set<string>();
    collect(root, vars, calls);
    hit = { fn: build(root), vars, calls };
    if (cache.size > 2000) cache.clear();
    cache.set(key, hit);
  }
  return hit;
}

/** 数值或表达式求值；失败返回 NaN */
export function evalValue(v: number | string | undefined, env: ExprEnv, userFns?: ReadonlySet<string>, fallback = NaN): number {
  if (typeof v === "number") return v;
  if (typeof v !== "string" || !v.trim()) return fallback;
  try {
    const r = compileExpr(v, userFns)(env);
    return Number.isFinite(r) ? r : fallback;
  } catch { return fallback; }
}

/** 标注里的数值显示：最多两位小数，去掉末尾 0 */
export function formatValue(v: number, decimals = 2): string {
  if (!Number.isFinite(v)) return "—";
  const s = v.toFixed(decimals).replace(/\.?0+$/, "");
  return s === "-0" ? "0" : s;
}

/**
 * 文字模板：{表达式} 代入当前数值，如 "a = {a}"、"({x}, {f(x)})"、"{a:1}"（一位小数）。
 * $…$ 里是 LaTeX（花括号是分组），不做代入。
 */
export function fillTemplate(text: string, env: ExprEnv, userFns?: ReadonlySet<string>): string {
  return text.split(/(\$[^$]*\$)/).map((part) => (part.startsWith("$") && part.endsWith("$") && part.length > 1 ? part : part.replace(/\{([^{}]+)\}/g, (m, body: string) => {
    const [expr, dec] = body.split(":");
    const v = evalValue(expr, env, userFns);
    return Number.isNaN(v) ? m : formatValue(v, dec !== undefined && /^\d$/.test(dec) ? Number(dec) : 2);
  }))).join("");
}
