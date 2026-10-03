// 非 DSHL 启动器（官方桌面端/裸 dsh 命令行）没有服务托管：由宿主插件按需拉起引擎，随插件卸载结束。
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// 安装态 node_modules/@djian/host-bridge/lib → node_modules/@djian/webui；开发态 packages/host-bridge/lib → packages/webui
export const ENGINE_ENTRY = path.resolve(HERE, '../../webui/server/index.mjs');

export async function spawnEngine(client, { port = 5180, log = () => {} } = {}) {
  if (!fs.existsSync(ENGINE_ENTRY)) throw new Error('找不到引擎入口 ' + ENGINE_ENTRY);
  const child = spawn(process.execPath, [ENGINE_ENTRY], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  child.stdout.on('data', (c) => log(String(c).trimEnd()));
  child.stderr.on('data', (c) => log(String(c).trimEnd()));
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('引擎进程提前退出（退出码 ' + child.exitCode + '）');
    try { await client.discover(true); return child; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  child.kill();
  throw new Error('引擎 60 秒内没有就绪');
}
