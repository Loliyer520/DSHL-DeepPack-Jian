import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

// Windows 上杀毒/索引服务会短暂占用目标文件，rename 抛 EPERM/EBUSY：重试几次再放弃
function renameWithRetry(from, to) {
  for (let attempt = 0; ; attempt++) {
    try { fs.renameSync(from, to); return; }
    catch (error) {
      if (!['EPERM', 'EBUSY', 'EACCES'].includes(error.code) || attempt >= 6) throw error;
      const until = Date.now() + 25 * (attempt + 1);
      while (Date.now() < until) { /* 短暂自旋：同步写盘路径里避免引入异步竞态 */ }
    }
  }
}

/** 原子写：临时文件 + fsync + rename；崩溃时要么旧内容要么新内容，不会半截 */
export function atomicWriteFile(file, content) {
  const temporary = path.join(path.dirname(file), `.${path.basename(file)}.${randomUUID()}.tmp`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  let descriptor;
  try {
    descriptor = fs.openSync(temporary, 'wx');
    fs.writeFileSync(descriptor, content);
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor); descriptor = undefined;
    renameWithRetry(temporary, file);
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
    fs.rmSync(temporary, { force: true });
  }
}

export function atomicWriteJson(file, value) {
  atomicWriteFile(file, JSON.stringify(value, null, 2));
}

export function readJsonFile(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
