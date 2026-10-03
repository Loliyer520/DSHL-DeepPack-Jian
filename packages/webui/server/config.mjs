// 引擎服务配置：路径、端口、限额。所有模块从这里取值，避免散落的魔法常量。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
// 开发态 packages/webui/server → packages/engine；安装态 node_modules/@djian/webui/server → node_modules/@djian/engine
export const ENGINE_DIR = path.resolve(SERVER_DIR, '../../engine');
export const VERSION = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(SERVER_DIR, '../package.json'), 'utf8')).version ?? '0.0.0'; } catch { return '0.0.0'; }
})();

export const PORT = Number(process.env.PORT || 5180);
// 默认只监听本机回环；需要局域网访问时显式设置 DJIAN_HOST=0.0.0.0 并配置 DJIAN_ALLOWED_ORIGINS
export const HOST = process.env.DJIAN_HOST || '127.0.0.1';
// 开发态为仓库根；整合包安装态为 DSHL 传入的 profile 根（服务 cwd）
export const WORK_DIR = process.env.DJIAN_WORK || process.cwd();
// 数据目录：显式配置 > $HOME/.djian > <profile>/.djian（Windows 原生常无 HOME，保持旧版落点不搬家）
export const DJIAN_HOME = process.env.DJIAN_DATA_DIR
  || (process.env.HOME ? path.join(process.env.HOME, '.djian') : path.join(WORK_DIR, '.djian'));
export const PROJECTS_DIR = path.join(DJIAN_HOME, 'projects');
export const TRASH_DIR = path.join(DJIAN_HOME, '.trash');
export const EXPORTS_DIR = path.join(DJIAN_HOME, 'exports');
export const SESSIONS_FILE = path.join(DJIAN_HOME, 'sessions.json');
export const LEGACY_CURRENT_FILE = path.join(DJIAN_HOME, 'current');
export const LEGACY_TIMELINE = path.join(DJIAN_HOME, 'timeline.json');
export const PORT_FILE = path.join(DJIAN_HOME, 'engine-port.json');
export const LOCK_FILE = path.join(DJIAN_HOME, 'engine.lock');
export const FONTS_DIR = path.join(ENGINE_DIR, 'fonts');

const list = (v) => (v ?? '').split(',').map((s) => s.trim()).filter(Boolean);
export const EXTRA_ORIGINS = list(process.env.DJIAN_ALLOWED_ORIGINS);
export const EXTRA_HOSTS = list(process.env.DJIAN_ALLOWED_HOSTS);

export const LIMITS = {
  json: 8 * 1024 * 1024,
  upload: 512 * 1024 * 1024,
  libraryDownload: 200 * 1024 * 1024,
  exportsKept: 20,
  historyKept: 60,
  journalBytes: 4 * 1024 * 1024,
  journalKeepLines: 2000,
  eventRing: 500,
};

export const ASSET_KINDS = {
  video: /\.(mp4|mov|webm|mkv|avi|m4v)$/i,
  image: /\.(png|jpe?g|webp|gif|bmp|avif)$/i,
  audio: /\.(mp3|wav|aac|ogg|m4a|flac|opus)$/i,
};
export const assetKind = (name) =>
  ASSET_KINDS.video.test(name) ? 'video' : ASSET_KINDS.image.test(name) ? 'image' : ASSET_KINDS.audio.test(name) ? 'audio' : null;

export const MIME = {
  '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.mkv': 'video/x-matroska', '.avi': 'video/x-msvideo',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.bmp': 'image/bmp', '.avif': 'image/avif',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.aac': 'audio/aac', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.flac': 'audio/flac', '.opus': 'audio/ogg',
  '.woff2': 'font/woff2', '.json': 'application/json', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
};
