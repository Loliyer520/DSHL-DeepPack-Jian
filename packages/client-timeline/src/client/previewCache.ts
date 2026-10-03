type Job = { start: () => void; cancel: () => void; signal: AbortSignal };

// Share two decoder slots across filmstrips and audio waveforms. Jobs which scroll
// out of view leave the queue before loading media; active loaders receive abort.
export class PreviewQueue {
  private jobs: Job[] = [];
  private running = 0;
  private limit: number;
  constructor(limit = 2) { this.limit = Math.max(1, limit); }

  run<T>(load: (signal: AbortSignal) => Promise<T>, signal: AbortSignal, fallback: T): Promise<T> {
    return new Promise((resolve) => {
      const job: Job = {
        signal,
        cancel: () => {
          const index = this.jobs.indexOf(job);
          if (index !== -1) this.jobs.splice(index, 1);
          signal.removeEventListener('abort', job.cancel);
          resolve(fallback);
        },
        start: () => {
          signal.removeEventListener('abort', job.cancel);
          this.running++;
          Promise.resolve().then(() => signal.aborted ? fallback : load(signal)).then(resolve, () => resolve(fallback)).finally(() => {
            this.running--;
            this.drain();
          });
        },
      };
      if (signal.aborted) { resolve(fallback); return; }
      signal.addEventListener('abort', job.cancel, { once: true });
      this.jobs.push(job);
      this.drain();
    });
  }

  private drain() {
    while (this.running < this.limit && this.jobs.length) {
      const job = this.jobs.shift()!;
      if (job.signal.aborted) job.cancel();
      else job.start();
    }
  }
}

type Entry<T> = { promise: Promise<T>; controller: AbortController; users: number; ready: boolean };
export class PreviewCache<T> {
  private entries = new Map<string, Entry<T>>();
  private capacity: number;
  private queue: PreviewQueue;
  private fallback: T;
  constructor(queue: PreviewQueue, capacity: number, fallback: T) {
    this.queue = queue; this.capacity = capacity; this.fallback = fallback;
  }

  acquire(key: string, load: (signal: AbortSignal) => Promise<T>) {
    let entry = this.entries.get(key);
    if (!entry) {
      const controller = new AbortController();
      entry = { controller, users: 0, ready: false, promise: this.queue.run(load, controller.signal, this.fallback) };
      const created = entry;
      entry.promise.then(() => { created.ready = true; this.prune(); });
      this.entries.set(key, entry);
    } else {
      this.entries.delete(key);
      this.entries.set(key, entry);
    }
    entry.users++;
    const acquired = entry;
    let released = false;
    return {
      promise: entry.promise,
      release: () => {
        if (released) return;
        released = true;
        acquired.users--;
        if (!acquired.users && !acquired.ready) {
          acquired.controller.abort();
          if (this.entries.get(key) === acquired) this.entries.delete(key);
        }
        this.prune();
      },
    };
  }

  private prune() {
    for (const [key, entry] of this.entries) {
      if (this.entries.size <= this.capacity) break;
      if (entry.ready && !entry.users) this.entries.delete(key);
    }
  }
}
