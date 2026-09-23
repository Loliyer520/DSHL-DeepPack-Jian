import { defineConfig } from 'tsdown';

// 产出 dsh 模块加载器格式：window.__ModuleLoader__.load({id, factory(require)})
// 外部依赖（react、cordis、其他 dsh 客户端包）一律 external，由壳的基座模块表解析
export default defineConfig([
  {
    entry: { client: 'src/client/index.tsx' },
    outDir: 'lib',
    format: ['cjs'],
    target: 'es2020',
    clean: false,
    external: [/^react($|\/)/, /^react-dom($|\/)/, /^@deepseek-ai\//],
    define: { 'process.env.NODE_ENV': '"production"' },
    dts: false,
    outputOptions: {
      entryFileNames: '[name].js',
      banner: `window.__ModuleLoader__.load({
	id: "@djian/client-ui-library",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;`,
      footer: `		return module.exports;
	}
});`,
    },
  },
  {
    // 宿主侧占位入口（ESM）
    entry: { index: 'src/index.ts' },
    outDir: 'lib',
    format: ['esm'],
    clean: false,
    dts: false,
    outputOptions: { entryFileNames: '[name].js' },
  },
]);
