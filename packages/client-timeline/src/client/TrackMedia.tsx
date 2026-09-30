import React, { useEffect, useState } from 'react';
import { assetUrl } from './api';

// Small, shared previews. The timeline never mounts a playing video per clip.
const frames = new Map<string, Promise<string[]>>();
function filmFrames(src: string, start: number, duration: number) {
  const key = `${src}|${start}|${duration}`;
  let cached = frames.get(key);
  if (cached) return cached;
  cached = new Promise<string[]>((resolve) => {
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
      video.onloadeddata = video.onseeked = video.onerror = null;
      video.removeAttribute('src');
      video.load();
      resolve(results);
    };
    const timer = window.setTimeout(finish, 12000);
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
  frames.set(key, cached);
  if (frames.size > 48) frames.delete(frames.keys().next().value!);
  return cached;
}

export function Filmstrip({ src, type, inPoint, duration, speed = 1 }: {
  src: string; type: 'video' | 'image'; inPoint: number; duration: number; speed?: number;
}) {
  const url = assetUrl(src);
  const [images, setImages] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    setImages([]);
    if (type === 'image') setImages([url]);
    else void filmFrames(url, inPoint, duration * speed).then((value) => { if (active) setImages(value); });
    return () => { active = false; };
  }, [url, type, inPoint, duration, speed]);
  return <div className="djp-filmstrip" aria-hidden="true">{images.map((image, i) => <span key={i} style={{ backgroundImage: `url("${image}")` }} />)}</div>;
}

type Peaks = { values: number[]; duration: number };
const waveforms = new Map<string, Promise<Peaks | null>>();
function loadWaveform(src: string) {
  let cached = waveforms.get(src);
  if (cached) return cached;
  cached = (async () => {
    let context: AudioContext | undefined;
    try {
      const response = await fetch(src, { signal: AbortSignal.timeout(15000) });
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
      const count = Math.min(12000, Math.ceil(audio.duration * 60));
      const values = Array.from({ length: count }, () => 0);
      for (let c = 0; c < audio.numberOfChannels; c++) {
        const channel = audio.getChannelData(c);
        for (let i = 0; i < channel.length; i++) {
          const bin = Math.min(count - 1, Math.floor(i / channel.length * count));
          values[bin] = Math.max(values[bin], Math.abs(channel[i]));
        }
      }
      return { values, duration: audio.duration };
    } catch { return null; }
    finally { if (context) void context.close(); }
  })();
  waveforms.set(src, cached);
  if (waveforms.size > 12) waveforms.delete(waveforms.keys().next().value!);
  return cached;
}

export function Waveform({ src, inPoint, duration, speed = 1 }: { src: string; inPoint: number; duration: number; speed?: number }) {
  const url = assetUrl(src);
  const [peaks, setPeaks] = useState<Peaks | null>(null);
  useEffect(() => {
    let active = true;
    setPeaks(null);
    void loadWaveform(url).then((value) => { if (active) setPeaks(value); });
    return () => { active = false; };
  }, [url]);
  if (!peaks) return <span className="djp-wave-baseline" aria-hidden="true" />;
  const bars = Array.from({ length: 180 }, (_, i) => {
    const from = Math.floor((inPoint + duration * speed * i / 180) / peaks.duration * peaks.values.length);
    const to = Math.ceil((inPoint + duration * speed * (i + 1) / 180) / peaks.duration * peaks.values.length);
    let peak = 0;
    for (let j = Math.max(0, from); j < Math.min(peaks.values.length, to); j++) peak = Math.max(peak, peaks.values[j]);
    const height = Math.max(0.5, peak * 27);
    return `L${i * 3 + 1} ${28 - height}`;
  }).join('');
  return <svg className="djp-waveform" viewBox="0 0 540 28" preserveAspectRatio="none" aria-hidden="true"><path d={`M0 28${bars}L540 28Z`} fill="currentColor" /></svg>;
}
