// 字幕文件：SRT/VTT 解析、导出往返、导入时的字幕层选择，以及服务端导入导出接口
import test from 'node:test';
import assert from 'node:assert/strict';
import { cuesToOps, parseSubtitles, toSrt, toVtt } from '../packages/engine/dist/srt.js';
import { startEngine } from './helpers/engine.mjs';

const SRT = '﻿1\r\n00:00:01,000 --> 00:00:02,500\r\n<i>第一句</i>\r\n\r\n2\r\n00:00:03,000 --> 00:00:05,000 X1:0\r\n第二句\r\n第二行\r\n\r\n3\r\n00:00:06,000 --> 00:00:05,000\r\n时间倒置的无效块\r\n';
const VTT = 'WEBVTT\n\nNOTE 注释\n\nintro\n00:01.000 --> 00:02.000 align:center\n{\\an8}你好\n\n01:00:00.250 --> 01:00:01.000\n一小时后\n';

test('parse SRT/VTT: 去掉样式标签、保留换行、跳过无效块、支持省略小时', () => {
  assert.deepEqual(parseSubtitles(SRT), [
    { start: 1, end: 2.5, text: '第一句' },
    { start: 3, end: 5, text: '第二句\n第二行' },
  ]);
  assert.deepEqual(parseSubtitles(VTT), [
    { start: 1, end: 2, text: '你好' },
    { start: 3600.25, end: 3601, text: '一小时后' },
  ]);
  assert.deepEqual(parseSubtitles('乱七八糟'), []);
});

test('export: 只导出字幕类，按时间排序，SRT/VTT 往返一致', () => {
  const overlays = [
    { startSeconds: 4, endSeconds: 6.04, text: '后', kind: 'subtitle' },
    { startSeconds: 0, endSeconds: 1.5, text: '标题', kind: 'title' },
    { startSeconds: 1.5, endSeconds: 3, text: '前\n两行' },
  ];
  const srt = toSrt(overlays);
  assert.equal(srt, '1\n00:00:01,500 --> 00:00:03,000\n前\n两行\n\n2\n00:00:04,000 --> 00:00:06,040\n后\n');
  assert.deepEqual(parseSubtitles(srt).map((c) => c.text), ['前\n两行', '后']);
  assert.equal(parseSubtitles(toSrt(overlays, { includeTitles: true })).length, 3);
  assert.ok(toVtt(overlays).startsWith('WEBVTT\n\n1\n00:00:01.500 --> 00:00:03.000'));
});

test('cuesToOps: 与已有字幕重叠时放到新的字幕层', () => {
  const base = { meta: { fps: 30, width: 1920, height: 1080 }, version: 5, videoTracks: [{ id: 'v', clips: [] }], audioTracks: [], markers: [] };
  const cues = [{ start: 1, end: 2, text: 'a' }, { start: 3, end: 4, text: 'b' }];
  const empty = cuesToOps({ ...base, overlays: [] }, cues);
  assert.equal(empty.track, 0);
  assert.equal(empty.ops.length, 2);
  assert.equal(empty.ops[0].fontSize, 65);
  assert.equal('track' in empty.ops[0], false);
  const busy = cuesToOps({ ...base, overlays: [{ id: 'o', text: 'x', startSeconds: 1.5, endSeconds: 1.8, track: 0 }, { id: 'p', text: 'y', startSeconds: 3.5, endSeconds: 3.6, track: 1 }] }, cues);
  assert.equal(busy.track, 2);
  assert.equal(busy.ops[1].track, 2);
  assert.equal(cuesToOps({ ...base, overlays: [] }, cues, 1).truncated, true);
});

test('server: 导入字幕文本成为一批可撤销的修改，导出带 BOM 的 SRT 下载', async () => {
  const engine = await startEngine();
  try {
    const { body: created } = await engine.api('POST', '/api/projects', { name: '字幕' });
    const pid = created.project?.id ?? created.id;
    const r = await engine.api('POST', '/api/p/' + pid + '/subtitles', { text: SRT, actor: 'ai' });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.imported, 2);
    const { body: ch } = await engine.api('GET', '/api/p/' + pid + '/changes?since=0');
    assert.equal(ch.events.at(-1).actor, 'ai');
    assert.equal(ch.events.at(-1).label, '导入字幕 2 条');
    const res = await fetch(engine.base + '/api/p/' + pid + '/subtitles');
    assert.match(res.headers.get('content-disposition'), /attachment; filename\*=UTF-8''.+\.srt/);
    // 带 UTF-8 BOM，Windows 记事本/播放器不会误判编码（fetch 的 text() 会吞掉 BOM，所以看原始字节）
    const bytes = Buffer.from(await res.arrayBuffer());
    assert.deepEqual([...bytes.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
    const text = bytes.toString('utf8');
    assert.deepEqual(parseSubtitles(text).map((c) => c.text), ['第一句', '第二句\n第二行']);
    const bad = await engine.api('POST', '/api/p/' + pid + '/subtitles', { text: 'nothing' });
    assert.equal(bad.status, 400);
  } finally {
    await engine.stop();
  }
});
