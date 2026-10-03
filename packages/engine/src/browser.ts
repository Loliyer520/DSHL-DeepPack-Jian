import fs from 'node:fs';
import path from 'node:path';

// Remotion 4.0.5xx 需要较新的 Chromium：老版本（如 Chrome 103）能解码视频但文字层整片空白。
export const MIN_BROWSER_MAJOR = 120;

/** Windows 版 Chrome/Edge 在 exe 同级放版本号目录（如 154.0.4258.37），取其中最高的主版本 */
export function installedMajorVersion(executable: string, readdir: (dir: string) => string[] = (dir) => fs.readdirSync(dir)): number | undefined {
  try {
    const majors = readdir(path.win32.dirname(executable))
      .map((name) => /^(\d+)\.\d+\.\d+\.\d+$/.exec(name))
      .filter((m): m is RegExpExecArray => Boolean(m))
      .map((m) => Number(m[1]));
    return majors.length ? Math.max(...majors) : undefined;
  } catch { return undefined; }
}

// DSHL 常跑在已装 Chrome/Edge 的 Windows 上：优先复用其中版本最新且足够新的一个，
// 都不满足时返回 undefined，交给 Remotion 准备自带的 headless shell。
export function resolveRenderBrowser({ platform = process.platform, env = process.env, isFile = (file: string) => {
  try { return fs.statSync(file).isFile(); } catch { return false; }
}, majorOf = (file: string) => installedMajorVersion(file) }: {
  platform?: string;
  env?: Record<string, string | undefined>;
  isFile?: (file: string) => boolean;
  majorOf?: (file: string) => number | undefined;
} = {}): string | undefined {
  if (env.DJIAN_BROWSER_EXECUTABLE) {
    if (!isFile(env.DJIAN_BROWSER_EXECUTABLE)) throw new Error('DJIAN_BROWSER_EXECUTABLE 指定的浏览器不存在，请检查路径');
    return env.DJIAN_BROWSER_EXECUTABLE;
  }
  if (platform !== 'win32') return undefined;
  const roots = [env.ProgramFiles, env['ProgramFiles(x86)'], env.LOCALAPPDATA].filter((root): root is string => Boolean(root));
  let best: { file: string; major: number } | undefined;
  for (const relative of ['Google/Chrome/Application/chrome.exe', 'Microsoft/Edge/Application/msedge.exe']) {
    for (const root of roots) {
      const file = path.win32.join(root, relative);
      if (!isFile(file)) continue;
      const major = majorOf(file) ?? 0;
      if (major >= MIN_BROWSER_MAJOR && (!best || major > best.major)) best = { file, major };
    }
  }
  return best?.file;
}
