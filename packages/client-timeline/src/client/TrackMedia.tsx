import React, { memo, useEffect, useMemo, useState } from 'react';
import { assetUrl } from './api';
import { PreviewCache, PreviewQueue } from './previewCache';
import { useProjectSession } from './ProjectSession';

// Small, shared previews. The timeline never mounts a playing video per clip.
const queue = new PreviewQueue(2);
const frames = new PreviewCache<string[]>(queue, 48, []);
function filmFrames(src: string, start: number, duration: number, signal: AbortSignal) {
  return new Promise<string[]>((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'auto';
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 72;
    const results: string[] = [];
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', finish);
      video.onloadeddata = video.onseeked = video.onerror = null;
      video.removeAttribute('src');
      video.load();
      resolve(results);
    };
    const timer = window.setTimeout(finish, 12000);
    signal.addEventListener('abort', finish, { once: true });
    if (signal.aborted) { finish(); return; }
    const seek = () => {
      const target = Math.min(Math.max(0, video.duration - 0.05), start + duration * results.length / 3);
      if (Math.abs(video.currentTime - target) < 0.001 && video.readyState >= 2) capture();
      else video.currentTime = target;
    };
    const capture = () => {
      if (done) return;
      try {
        canvas.getContext('2d')?.drawImage(video, 0, 0, 128, 72);
        results.push(canvas.toDataURL('image/jpeg', 0.65));
        if (results.length === 3) finish();
        else seek();
      } catch { finish(); }
    };
    video.onloadeddata = seek;
    video.onseeked = capture;
    video.onerror = finish;
    video.src = src;
  });
}

export const Filmstrip = memo(function Filmstrip({ src, type, inPoint, duration, speed = 1 }: {
  src: string; type: 'video' | 'image'; inPoint: number; duration: number; speed?: number;
}) {
  const url = assetUrl(src, useProjectSession());
  const [images, setImages] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    setImages([]);
    if (type === 'image') { setImages([url]); return; }
    const preview = frames.acquire(`${url}|${inPoint}|${duration * speed}`, (signal) => filmFrames(url, inPoint, duration * speed, signal));
    void preview.promise.then((value) => { if (active) setImages(value); });
    return () => { active = false; preview.release(); };
  }, [url, type, inPoint, duration, speed]);
  return <div className="djp-filmstrip" aria-hidden="true">{images.map((image, i) => <span key={i} style={{ backgroundImage: `url("${image}")` }} />)}</div>;
});

type Peaks = { values: number[]; duration: number };
const waveforms = new PreviewCache<Peaks | null>(queue, 12, null);
async function loadWaveform(src: string, signal: AbortSignal) {
    let context: AudioContext | undefined;
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal.addEventListener('abort', abort, { once: true });
    const timeout = window.setTimeout(abort, 15000);
    try {
      if (signal.aborted) return null;
      const response = await fetch(src, { signal: controller.signal });
      if (!response.ok || Number(response.headers.get('content-length')) > 20_000_000) { await response.body?.cancel(); return null; }
      // Bound the download even when Content-Length is missing.
      const reader = response.body?.getReader();
      if (!reader) return null;
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 20_000_000) { await reader.cancel(); return null; }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      context = new AudioContext({ sampleRate: 8000 });
      const audio = await context.decodeAudioData(bytes.buffer);
      if (controller.signal.aborted) return null;
      const count = Math.min(12000, Math.ceil(audio.duration * 60));
      const values = Array.from({ length: count }, () => 0);
      for (let c = 0; c < audio.numberOfChannels; c++) {
        const channel = audio.getChannelData(c);
        for (let i = 0; i < channel.length; i++) {
          if (i > 0 && i % 128000 === 0) {
            await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
            if (controller.signal.aborted) return null;
          }
          const bin = Math.min(count - 1, Math.floor(i / channel.length * count));
          values[bin] = Math.max(values[bin], Math.abs(channel[i]));
        }
      }
      return { values, duration: audio.duration };
    } catch { return null; }
    finally {
      clearTimeout(timeout);
      signal.removeEventListener('abort', abort);
      if (context) void context.close();
    }
}

export const Waveform = memo(function Waveform({ src, inPoint, duration, speed = 1 }: { src: string; inPoint: number; duration: number; speed?: number }) {
  const url = assetUrl(src, useProjectSession());
  const [peaks, setPeaks] = useState<Peaks | null>(null);
  useEffect(() => {
    let active = true;
    setPeaks(null);
    const preview = waveforms.acquire(url, (signal) => loadWaveform(url, signal));
    void preview.promise.then((value) => { if (active) setPeaks(value); });
    return () => { active = false; preview.release(); };
  }, [url]);
  const bars = useMemo(() => {
    if (!peaks) return '';
    return Array.from({ length: 180 }, (_, i) => {
    const from = Math.floor((inPoint + duration * speed * i / 180) / peaks.duration * peaks.values.length);
    const to = Math.ceil((inPoint + duration * speed * (i + 1) / 180) / peaks.duration * peaks.values.length);
    let peak = 0;
    for (let j = Math.max(0, from); j < Math.min(peaks.values.length, to); j++) peak = Math.max(peak, peaks.values[j]);
    const height = Math.max(0.5, peak * 27);
    return `L${i * 3 + 1} ${28 - height}`;
    }).join('');
  }, [peaks, inPoint, duration, speed]);
  if (!peaks) return <span className="djp-wave-baseline" aria-hidden="true" />;
  return <svg className="djp-waveform" viewBox="0 0 540 28" preserveAspectRatio="none" aria-hidden="true"><path d={`M0 28${bars}L540 28Z`} fill="currentColor" /></svg>;
});
