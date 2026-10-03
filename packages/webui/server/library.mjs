// 在线素材库（Openverse，免 key 的 CC 聚合）：搜索 + 安全下载（防 SSRF、流式限额落盘）。
import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns/promises';
import net from 'node:net';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { HttpError } from './http.mjs';

const UA = 'djian-media-library/0.2 (local video editor)';

export async function searchOpenverse(q, kind, page) {
  const u = 'https://api.openverse.org/v1/' + (kind === 'audio' ? 'audio' : 'images') + '/?q=' + encodeURIComponent(q) + '&page=' + page + '&page_size=20';
  const r = await fetch(u, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15_000) });
  if (!r.ok) throw new HttpError(502, 'Openverse HTTP ' + r.status);
  const d = await r.json();
  return {
    total: d.result_count ?? 0,
    page,
    items: (d.results ?? []).map((x) => ({
      id: x.id, kind, title: x.title ?? x.id, url: x.url, thumb: x.thumbnail ?? null,
      license: x.license ?? 'cc', licenseUrl: x.license_url ?? null, creator: x.creator ?? null, source: x.source ?? '',
      duration: kind === 'audio' && x.duration ? Math.round(x.duration / 100) / 10 : null,
    })),
  };
}

const V4_BLOCKED = [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12],
  ['192.0.0.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['224.0.0.0', 3],
];
const v4ToInt = (ip) => ip.split('.').reduce((n, part) => (n << 8) + Number(part), 0) >>> 0;
export function isPrivateAddress(ip) {
  if (net.isIPv4(ip)) {
    const n = v4ToInt(ip);
    return V4_BLOCKED.some(([base, bits]) => (n >>> (32 - bits)) === (v4ToInt(base) >>> (32 - bits)));
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(lower);
    if (mapped) return isPrivateAddress(mapped[1]);
    return lower === '::' || lower === '::1' || /^f[cd]/.test(lower) || /^fe[89ab]/.test(lower) || /^ff/.test(lower);
  }
  return true;
}

async function assertPublicUrl(u) {
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new HttpError(400, '只支持 http(s) 链接');
  if (u.username || u.password) throw new HttpError(400, '链接不能带账号信息');
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (/^localhost$/i.test(host) || host.endsWith('.localhost')) throw new HttpError(400, '不能下载本机地址');
  const addresses = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true }).catch(() => []);
  if (!addresses.length) throw new HttpError(502, '无法解析域名 ' + host);
  if (addresses.some((a) => isPrivateAddress(a.address))) throw new HttpError(400, '不能下载内网或本机地址');
}

/** 安全下载到目标目录：逐跳校验重定向、流式写临时文件、超限即断；返回临时文件路径 */
export async function safeDownload(rawUrl, dir, { maxBytes, timeoutMs = 60_000 }) {
  let url;
  try { url = new URL(rawUrl); } catch { throw new HttpError(400, 'url 不是合法链接'); }
  const signal = AbortSignal.timeout(timeoutMs);
  let response;
  for (let hop = 0; ; hop++) {
    await assertPublicUrl(url);
    response = await fetch(url, { redirect: 'manual', signal, headers: { 'User-Agent': UA } });
    if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
      if (hop >= 5) throw new HttpError(502, '重定向次数过多');
      await response.body?.cancel();
      url = new URL(response.headers.get('location'), url);
      continue;
    }
    break;
  }
  if (!response.ok || !response.body) throw new HttpError(502, '下载失败 HTTP ' + response.status);
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    await response.body.cancel();
    throw new HttpError(413, '文件超过 ' + Math.round(maxBytes / 1024 / 1024) + 'MB 上限');
  }
  fs.mkdirSync(dir, { recursive: true });
  const temp = path.join(dir, '.dl-' + randomUUID());
  let size = 0;
  const source = Readable.fromWeb(response.body);
  source.on('data', (c) => {
    size += c.length;
    if (size > maxBytes) source.destroy(new HttpError(413, '文件超过 ' + Math.round(maxBytes / 1024 / 1024) + 'MB 上限'));
  });
  try {
    await pipeline(source, fs.createWriteStream(temp));
  } catch (e) {
    fs.rmSync(temp, { force: true });
    throw e instanceof HttpError ? e : new HttpError(502, '下载中断：' + e.message);
  }
  if (!size) { fs.rmSync(temp, { force: true }); throw new HttpError(502, '下载到空文件'); }
  return { temp, size, contentType: response.headers.get('content-type') ?? '', finalUrl: url.toString() };
}
