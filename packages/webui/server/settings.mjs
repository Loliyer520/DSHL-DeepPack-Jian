// 全局设置（图像模型等）：settings.json 持久化。API Key 只存在内存与本机文件，绝不进 HTTP 响应。
import fs from 'node:fs';
import path from 'node:path';
import { DJIAN_HOME } from './config.mjs';
import { atomicWriteJson, readJsonFile } from './storage.mjs';

const FILE = path.join(DJIAN_HOME, 'settings.json');
const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

export const IMAGE_DEFAULTS = { baseUrl: 'https://api.openai.com/v1', model: 'gpt-image-1', timeoutMs: 300_000 };

class HttpSettingsError extends Error {
  constructor(message) { super(message); this.status = 400; }
}

function validBaseUrl(raw) {
  let url;
  try { url = new URL(raw); } catch { throw new HttpSettingsError('图像接口地址不是有效 URL'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new HttpSettingsError('图像接口地址只支持不带内嵌凭据的 http/https URL');
  return raw.replace(/\/+$/, '');
}

export class Settings {
  constructor() {
    this.data = readJsonFile(FILE, {}) ?? {};
    this.data.image ??= {};
  }

  /** 面板可见的视图：只有脱敏后的密钥提示，绝不返回完整密钥 */
  imageView() {
    const image = this.data.image ?? {};
    const apiKey = str(image.apiKey);
    return {
      configured: Boolean(apiKey),
      apiKeyHint: apiKey ? (apiKey.length > 8 ? '••••' + apiKey.slice(-4) : '已配置') : null,
      baseUrl: str(image.baseUrl) ?? IMAGE_DEFAULTS.baseUrl,
      model: str(image.model) ?? IMAGE_DEFAULTS.model,
      timeoutMs: Number.isFinite(Number(image.timeoutMs)) && Number(image.timeoutMs) > 0 ? Math.round(Number(image.timeoutMs)) : IMAGE_DEFAULTS.timeoutMs,
    };
  }

  /**
   * 更新图像设置。字段缺省 = 保持不变；'' / null = 恢复默认（apiKey 为清除）。
   * 返回脱敏视图；密钥任何情况下都不出现在返回值里。
   */
  updateImage(patch = {}) {
    const image = this.data.image ?? (this.data.image = {});
    if ('apiKey' in patch) {
      const key = str(patch.apiKey);
      if (key) {
        if (key.length > 4096) throw new HttpSettingsError('API Key 过长');
        image.apiKey = key;
      } else delete image.apiKey;
    }
    if ('baseUrl' in patch) {
      const url = str(patch.baseUrl);
      image.baseUrl = url ? validBaseUrl(url) : IMAGE_DEFAULTS.baseUrl;
    }
    if ('model' in patch) {
      const model = str(patch.model);
      if (model && model.length > 200) throw new HttpSettingsError('模型名过长');
      if (model) image.model = model; else delete image.model;
    }
    if ('timeoutMs' in patch && patch.timeoutMs !== null && patch.timeoutMs !== undefined) {
      const n = Number(patch.timeoutMs);
      if (!Number.isFinite(n)) throw new HttpSettingsError('超时必须是数字（毫秒）');
      image.timeoutMs = Math.max(1000, Math.min(600_000, Math.round(n)));
    }
    atomicWriteJson(FILE, this.data);
    try { fs.chmodSync(FILE, 0o600); } catch { /* Windows / 受限文件系统：忽略 */ }
    return this.imageView();
  }
}
