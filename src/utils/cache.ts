interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private inFlight = new Map<string, Promise<unknown>>();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Periodically sweep expired keys every 60 seconds
    this.cleanupTimer = setInterval(() => this.cleanup(), 60000);
    if (this.cleanupTimer.unref) this.cleanupTimer.unref();
  }

  /** Builds a deterministic cache key from a namespace and query parameters */
  public makeKey(namespace: string, query: Record<string, unknown> = {}): string {
    const sortedEntries = Object.entries(query)
      .filter(([_, v]) => v !== undefined && v !== null && v !== "")
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${String(v)}`);
    return `${namespace}:${sortedEntries.join("|")}`;
  }

  public get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  public set<T>(key: string, value: T, ttlSeconds = 30): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /** Invalidates all cache entries matching a namespace or prefix */
  public invalidate(namespace: string): void {
    const prefix = `${namespace}:`;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix) || key === namespace) {
        this.store.delete(key);
      }
    }
  }

  /** Clears all cache entries */
  public clear(): void {
    this.store.clear();
  }

  /** Executes fetcher and caches result if not already cached (with in-flight deduplication) */
  public async wrap<T>(
    namespace: string,
    queryOrKey: string | Record<string, unknown>,
    fetcher: () => Promise<T>,
    ttlSeconds = 60
  ): Promise<T> {
    const key = typeof queryOrKey === "string" ? `${namespace}:${queryOrKey}` : this.makeKey(namespace, queryOrKey);
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;

    if (this.inFlight.has(key)) {
      return this.inFlight.get(key) as Promise<T>;
    }

    const task = (async () => {
      try {
        const fresh = await fetcher();
        this.set(key, fresh, ttlSeconds);
        return fresh;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, task);
    return task;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

export const cache = new MemoryCache();
export default cache;
