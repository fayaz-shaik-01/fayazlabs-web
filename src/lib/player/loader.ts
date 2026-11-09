import { decryptBlob } from "./crypto";
import { aadFor, fileUrl, type ContentSource } from "./format";

export class LoadError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "LoadError";
    this.status = status;
  }
}

interface BlobEntry {
  promise: Promise<string>;
  ctl: AbortController;
  url?: string;
}

/**
 * Fetches (and, for paid items, decrypts) content files. Audio becomes blob
 * URLs held in a small map; the player releases them as it moves on. Nothing
 * is written to any persistent storage.
 */
export class ContentLoader {
  private blobs = new Map<string, BlobEntry>();
  private disposed = false;

  constructor(
    private source: () => ContentSource,
    private refresh?: () => Promise<ContentSource>,
  ) {}

  private async fetchRaw(rel: string, signal: AbortSignal, retried = false): Promise<ArrayBuffer> {
    const src = this.source();
    const res = await fetch(fileUrl(src, rel), { signal, credentials: "omit" });
    if ((res.status === 401 || res.status === 403) && this.refresh && !retried) {
      // The signed URL may have expired; get a fresh grant once and retry.
      await this.refresh();
      return this.fetchRaw(rel, signal, true);
    }
    if (!res.ok) throw new LoadError(res.status, `Could not load ${rel} (${res.status})`);
    return res.arrayBuffer();
  }

  async bytes(rel: string, signal: AbortSignal): Promise<ArrayBuffer> {
    const raw = await this.fetchRaw(rel, signal);
    const src = this.source();
    if (!src.encrypted) return raw;
    if (!src.key) throw new LoadError(403, "Missing content key");
    return decryptBlob(raw, src.key, aadFor(src.itemId, rel));
  }

  async text(rel: string, signal: AbortSignal): Promise<string> {
    return new TextDecoder().decode(await this.bytes(rel, signal));
  }

  async json<T = unknown>(rel: string, signal: AbortSignal): Promise<T> {
    return JSON.parse(await this.text(rel, signal)) as T;
  }

  /** Blob URL for an audio file, loaded once and shared until released. */
  blob(rel: string, type = "audio/mpeg"): Promise<string> {
    if (this.disposed) return Promise.reject(new LoadError(0, "Loader disposed"));
    const existing = this.blobs.get(rel);
    if (existing) return existing.promise;
    const ctl = new AbortController();
    const entry: BlobEntry = { ctl, promise: Promise.resolve("") };
    entry.promise = this.bytes(rel, ctl.signal).then((buf) => {
      if (this.disposed || ctl.signal.aborted || this.blobs.get(rel) !== entry) {
        throw new LoadError(0, "Released");
      }
      entry.url = URL.createObjectURL(new Blob([buf], { type }));
      return entry.url;
    });
    entry.promise.catch(() => {
      if (this.blobs.get(rel) === entry) this.blobs.delete(rel);
    });
    this.blobs.set(rel, entry);
    return entry.promise;
  }

  has(rel: string): boolean {
    return this.blobs.has(rel);
  }

  release(rel: string) {
    const e = this.blobs.get(rel);
    if (!e) return;
    this.blobs.delete(rel);
    e.ctl.abort();
    if (e.url) URL.revokeObjectURL(e.url);
  }

  /** Release every held file except those listed. */
  keepOnly(keep: Iterable<string>) {
    const k = new Set(keep);
    for (const rel of [...this.blobs.keys()]) if (!k.has(rel)) this.release(rel);
  }

  /** Number of audio files currently held (loaded or loading). */
  get heldCount(): number {
    return this.blobs.size;
  }

  /** Number of live blob URLs. */
  get liveUrlCount(): number {
    let n = 0;
    for (const e of this.blobs.values()) if (e.url) n++;
    return n;
  }

  dispose() {
    this.disposed = true;
    for (const rel of [...this.blobs.keys()]) this.release(rel);
  }
}
