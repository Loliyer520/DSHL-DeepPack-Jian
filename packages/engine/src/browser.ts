import fs from 'node:fs';
import path from 'node:path';

// DSHL commonly runs on Windows machines with Chrome/Edge already installed.
// Reuse that browser before asking Remotion to download another executable.
export function resolveRenderBrowser({ platform = process.platform, env = process.env, isFile = (file: string) => {
  try { return fs.statSync(file).isFile(); } catch { return false; }
} }: { platform?: string; env?: Record<string, string | undefined>; isFile?: (file: string) => boolean } = {}): string | undefined {
  if (env.DJIAN_BROWSER_EXECUTABLE) {
    if (!isFile(env.DJIAN_BROWSER_EXECUTABLE)) throw new Error('DJIAN_BROWSER_EXECUTABLE 指定的浏览器不存在，请检查路径');
    return env.DJIAN_BROWSER_EXECUTABLE;
  }
  if (platform !== 'win32') return undefined;
  const roots = [env.ProgramFiles, env['ProgramFiles(x86)'], env.LOCALAPPDATA].filter((root): root is string => Boolean(root));
  for (const relative of ['Google/Chrome/Application/chrome.exe', 'Microsoft/Edge/Application/msedge.exe']) {
    for (const root of roots) {
      const candidate = path.win32.join(root, relative);
      if (isFile(candidate)) return candidate;
    }
  }
  return undefined;
}
