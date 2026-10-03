import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';

// Browsers use single byte ranges when seeking media. Unsupported/malformed
// range sets fall back to the complete representation (RFC 9110 §14.2).
function byteRange(value, size) {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(value?.trim() ?? '');
  if (!match || (!match[1] && !match[2])) return null;
  const length = BigInt(size);
  if (!match[1]) {
    const suffix = BigInt(match[2]);
    if (suffix === 0n || length === 0n) return 'unsatisfiable';
    return { start: Number(suffix >= length ? 0n : length - suffix), end: size - 1 };
  }
  const first = BigInt(match[1]);
  const last = match[2] ? BigInt(match[2]) : length - 1n;
  if (match[2] && last < first) return null;
  if (first >= length) return 'unsatisfiable';
  return { start: Number(first), end: Number(last >= length ? length - 1n : last) };
}

export async function serveMedia(req, res, file, contentType) {
  let handle;
  try {
    handle = await fs.promises.open(file, 'r');
    // Use the same open file for metadata and bytes, even if the path is replaced.
    const stat = await handle.stat();
    if (!stat.isFile()) { res.writeHead(404).end(); return; }
    if (res.destroyed) return;
    const headers = {
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache',
      Vary: 'Origin',
      ...(res._aco ? {
        'Access-Control-Allow-Origin': res._aco,
        'Access-Control-Expose-Headers': 'Accept-Ranges, Content-Range, Content-Length',
      } : {}),
    };
    // We don't publish a strong validator for mutable project assets. A
    // conditional range cannot be proven current, so send the complete file.
    const range = req.method === 'GET' && !req.headers['if-range']
      ? byteRange(req.headers.range, stat.size) : null;
    if (range === 'unsatisfiable') {
      res.writeHead(416, { ...headers, 'Content-Range': `bytes */${stat.size}`, 'Content-Length': 0 }).end();
      return;
    }
    res.writeHead(range ? 206 : 200, {
      ...headers,
      'Content-Length': range ? range.end - range.start + 1 : stat.size,
      ...(range ? { 'Content-Range': `bytes ${range.start}-${range.end}/${stat.size}` } : {}),
    });
    if (req.method === 'HEAD' || stat.size === 0) { res.end(); return; }
    // pipeline stops the disk read when scrubbing cancels a browser request.
    await pipeline(handle.createReadStream({ ...(range ?? {}) }), res);
  } catch (error) {
    if (res.destroyed) return;
    if (res.headersSent) { res.destroy(); return; }
    if (['ENOENT', 'ENOTDIR', 'EISDIR'].includes(error.code)) { res.writeHead(404).end(); return; }
    throw error;
  } finally {
    await handle?.close();
  }
}
