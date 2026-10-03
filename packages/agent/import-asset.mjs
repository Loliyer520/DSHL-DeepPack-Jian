import fs from 'node:fs';
import path from 'node:path';

export async function importAsset(args, base) {
  if (Boolean(args.path) === Boolean(args.base64)) throw new Error('必须且只能提供 path 或 base64。');
  // Pin the destination before reading/uploading, even if another panel becomes current.
  const listing = await fetch(`${base}/api/assets`, { signal: AbortSignal.timeout(15_000) });
  const target = await listing.json();
  if (!listing.ok || !target.projectId) throw new Error(target.error || '无法确定当前项目，请更新剪辑引擎。');
  let body, size, name;
  if (args.path) {
    if (typeof args.path !== 'string' || !path.isAbsolute(args.path)) throw new Error('path 必须是本地文件的绝对路径。');
    const stat = await fs.promises.stat(args.path);
    if (!stat.isFile()) throw new Error('path 必须指向文件。');
    size = stat.size;
    name = args.name || path.basename(args.path);
  } else {
    if (typeof args.base64 !== 'string' || args.base64.length > 45_000_000) throw new Error('base64 必须是有效的标准编码，小文件最多 32MB。');
    body = Buffer.from(args.base64, 'base64');
    if (body.toString('base64') !== args.base64) throw new Error('base64 编码无效，请使用标准编码。');
    size = body.length;
    if (size > 32 * 1024 * 1024) throw new Error('base64 素材超过 32MB，请改用 path。');
    name = args.name;
  }
  if (!size || size > 512 * 1024 * 1024) throw new Error('文件大小必须在 1 字节到 512MB 之间。');
  if (typeof name !== 'string' || !/\.(mp4|mov|mkv|webm|avi|png|jpe?g|gif|webp|mp3|wav|m4a|aac|ogg|flac)$/i.test(name)) throw new Error('需要支持的视频、图片或音频文件名（带扩展名）。');
  const stream = args.path ? fs.createReadStream(args.path) : null;
  try {
    const response = await fetch(`${base}/api/assets?projectId=${encodeURIComponent(target.projectId)}&name=${encodeURIComponent(name)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: stream || body,
      ...(stream ? { duplex: 'half' } : {}), signal: AbortSignal.timeout(180_000),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
    return { ...result, projectId: target.projectId, assetsDir: target.assetsDir, size, note: '已入库。addClip/addAudio 的 src 使用返回的 name；尚未添加到时间线。' };
  } catch (error) {
    throw new Error(`素材入库失败：${error.message}。若响应中断，请先 asset_list 核对是否已入库，避免重复上传。`);
  } finally { stream?.destroy(); }
}
