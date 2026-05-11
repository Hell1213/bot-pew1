import { redis } from '@devvit/web/server';

export interface KVStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  del(key: string): Promise<void>;
  hashSet<T>(key: string, field: string, value: T): Promise<void>;
  hashGet<T>(key: string, field: string): Promise<T | undefined>;
  hashGetAll<T>(key: string): Promise<Record<string, T>>;
  sortedAdd(key: string, score: number, member: string): Promise<void>;
  sortedRange(key: string, start: number | string, stop: number | string, options?: { by?: 'score' | 'lex' }): Promise<{ member: string; score: number }[]>;
  sortedCard(key: string): Promise<number>;
  incrBy(key: string, delta: number): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
}

const serialize = <T>(value: T): string =>
  typeof value === 'string' ? value : JSON.stringify(value);

const deserialize = <T>(raw: string | undefined | null): T | undefined => {
  if (raw === undefined || raw === null) return undefined;
  try { return JSON.parse(raw) as T; } catch { return raw as unknown as T; }
};

export const createKVStore = (): KVStore => ({
  async get<T>(key: string): Promise<T | undefined> {
    const raw = await redis.get(key);
    return deserialize<T>(raw);
  },

  async set<T>(key: string, value: T): Promise<void> {
    await redis.set(key, serialize(value));
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  },

  async hashSet<T>(key: string, field: string, value: T): Promise<void> {
    await redis.hSet(key, { [field]: serialize(value) });
  },

  async hashGet<T>(key: string, field: string): Promise<T | undefined> {
    const raw = await redis.hGet(key, field);
    return deserialize<T>(raw);
  },

  async hashGetAll<T>(key: string): Promise<Record<string, T>> {
    const raw = await redis.hGetAll(key);
    const result: Record<string, T> = {};
    for (const [field, val] of Object.entries(raw)) {
      result[field] = deserialize<T>(val) as T;
    }
    return result;
  },

  async sortedAdd(key: string, score: number, member: string): Promise<void> {
    await redis.zAdd(key, { member, score });
  },

  async sortedRange(key: string, start: number | string, stop: number | string, options?: { by?: 'score' | 'lex' }): Promise<{ member: string; score: number }[]> {
    const opts = options?.by ? { by: options.by } as const : undefined;
    return redis.zRange(key, start, stop, opts);
  },

  async sortedCard(key: string): Promise<number> {
    return redis.zCard(key);
  },

  async incrBy(key: string, delta: number): Promise<number> {
    return redis.incrBy(key, delta);
  },

  async expire(key: string, seconds: number): Promise<void> {
    await redis.expire(key, seconds);
  },
});

export const createInMemoryKVStore = (): KVStore => {
  const data = new Map<string, string>();
  const hashes = new Map<string, Record<string, string>>();
  const sortedSets = new Map<string, Map<string, number>>();
  const ttlMap = new Map<string, number>();

  const purge = (): void => {
    const now = Date.now();
    for (const [key, expiry] of ttlMap) {
      if (now > expiry) {
        data.delete(key);
        hashes.delete(key);
        sortedSets.delete(key);
        ttlMap.delete(key);
      }
    }
  };

  return {
    async get<T>(key: string): Promise<T | undefined> {
      purge();
      const raw = data.get(key);
      return deserialize<T>(raw);
    },

    async set<T>(key: string, value: T): Promise<void> {
      data.set(key, serialize(value));
    },

    async del(key: string): Promise<void> {
      data.delete(key);
      hashes.delete(key);
      sortedSets.delete(key);
      ttlMap.delete(key);
    },

    async hashSet<T>(key: string, field: string, value: T): Promise<void> {
      purge();
      const existing = hashes.get(key) ?? {};
      existing[field] = serialize(value);
      hashes.set(key, existing);
    },

    async hashGet<T>(key: string, field: string): Promise<T | undefined> {
      purge();
      const h = hashes.get(key);
      if (!h) return undefined;
      return deserialize<T>(h[field]);
    },

    async hashGetAll<T>(key: string): Promise<Record<string, T>> {
      purge();
      const h = hashes.get(key);
      if (!h) return {};
      const result: Record<string, T> = {};
      for (const [field, val] of Object.entries(h)) {
        result[field] = deserialize<T>(val) as T;
      }
      return result;
    },

    async sortedAdd(key: string, score: number, member: string): Promise<void> {
      purge();
      let set = sortedSets.get(key);
      if (!set) {
        set = new Map();
        sortedSets.set(key, set);
      }
      set.set(member, score);
    },

    async sortedRange(key: string, start: number | string, stop: number | string, _options?: { by?: 'score' | 'lex' }): Promise<{ member: string; score: number }[]> {
      purge();
      const set = sortedSets.get(key);
      if (!set) return [];
      const entries = [...set.entries()].sort((a, b) => a[1] - b[1]);
      const all = entries.map(([member, score]) => ({ member, score }));

      if (_options?.by === 'score') {
        const minScore = typeof start === 'number' ? start : Number(start);
        const maxScore = typeof stop === 'number' ? stop : Number(stop);
        return all.filter((e) => e.score >= minScore && e.score <= maxScore);
      }

      const s = typeof start === 'number' ? start : 0;
      const e = typeof stop === 'number' && stop >= 0 ? stop + 1 : undefined;
      return all.slice(s, e);
    },

    async sortedCard(key: string): Promise<number> {
      purge();
      return sortedSets.get(key)?.size ?? 0;
    },

    async incrBy(key: string, delta: number): Promise<number> {
      purge();
      const raw = data.get(key);
      const current = raw ? parseInt(raw) || 0 : 0;
      const next = current + delta;
      data.set(key, next.toString());
      return next;
    },

    async expire(key: string, _seconds: number): Promise<void> {
      ttlMap.set(key, Date.now() + _seconds * 1000);
    },
  };
};
