import { redis } from '@devvit/web/server';

export interface KVStore {
  getJSON<T>(key: string): Promise<T | null>;
  setJSON<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
}

export const kvStore: KVStore = {
  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await redis.get(key);
    if (raw === undefined) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async setJSON<T>(key: string, value: T): Promise<void> {
    await redis.set(key, JSON.stringify(value));
  },

  async delete(key: string): Promise<void> {
    await redis.del(key);
  },
};

export class InMemoryKVStore implements KVStore {
  private store = new Map<string, string>();

  async getJSON<T>(key: string): Promise<T | null> {
    const raw = this.store.get(key);
    if (raw === undefined) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async setJSON<T>(key: string, value: T): Promise<void> {
    this.store.set(key, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  keys(): string[] {
    return Array.from(this.store.keys());
  }
}
