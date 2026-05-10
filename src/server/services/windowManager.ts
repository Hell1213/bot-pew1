import type { ActivityEvent } from '../../shared/dto/modsignal';
import { bucketKey, now } from '../../shared/utils/time';
import { Welford } from '../../shared/utils/stats';
import { KEY_WINDOW } from '../../shared/constants/kvKeys';
import type { KVStore } from '../storage/kvStore';

export interface WindowManager {
  recordEvent(event: ActivityEvent): Promise<void>;
  getWindow(subreddit: string, bucketTimestamp: number): Promise<ActivityEvent[]>;
  getActiveWindowEvents(subreddit: string, windowMinutes?: number): Promise<ActivityEvent[]>;
  computeBaseline(subreddit: string, lookbackMinutes: number, windowMinutes?: number): Promise<{ mean: number; stddev: number; count: number }>;
  pruneOldBuckets(subreddit: string, retentionMinutes: number, windowMinutes?: number): Promise<void>;
}

export const createWindowManager = (store: KVStore): WindowManager => ({
  async recordEvent(event: ActivityEvent): Promise<void> {
    const bk = bucketKey(event.timestamp, 5);
    const key = KEY_WINDOW(event.subreddit, bk);
    const existing = await store.getJSON<ActivityEvent[]>(key);
    const events = existing ?? [];
    events.push(event);
    await store.setJSON(key, events);
  },

  async getWindow(subreddit: string, bucketTimestamp: number): Promise<ActivityEvent[]> {
    const key = KEY_WINDOW(subreddit, bucketTimestamp);
    const events = await store.getJSON<ActivityEvent[]>(key);
    return events ?? [];
  },

  async getActiveWindowEvents(subreddit: string, windowMinutes = 5): Promise<ActivityEvent[]> {
    const nowBucket = bucketKey(now(), windowMinutes);
    const prevBucket = bucketKey(nowBucket - 1, windowMinutes);
    const [current, previous] = await Promise.all([
      store.getJSON<ActivityEvent[]>(KEY_WINDOW(subreddit, nowBucket)),
      store.getJSON<ActivityEvent[]>(KEY_WINDOW(subreddit, prevBucket)),
    ]);
    return [...(previous ?? []), ...(current ?? [])];
  },

  async computeBaseline(
    subreddit: string,
    lookbackMinutes: number,
    windowMinutes = 5,
  ): Promise<{ mean: number; stddev: number; count: number }> {
    const cutoff = now() - lookbackMinutes * 60 * 1000;
    const welford = new Welford();
    let earliest = bucketKey(now(), windowMinutes);

    while (earliest > cutoff) {
      const key = KEY_WINDOW(subreddit, earliest);
      const events = await store.getJSON<ActivityEvent[]>(key);
      if (events) {
        welford.update(events.length);
      }
      earliest -= windowMinutes * 60 * 1000;
    }

    return { mean: welford.mean, stddev: welford.stddev, count: welford.n };
  },

  async pruneOldBuckets(subreddit: string, retentionMinutes: number, windowMinutes = 5): Promise<void> {
    const cutoff = now() - retentionMinutes * 60 * 1000;
    const oldestPossible = bucketKey(now(), windowMinutes);
    let bucket = bucketKey(cutoff, windowMinutes);

    while (bucket < oldestPossible) {
      await store.delete(KEY_WINDOW(subreddit, bucket));
      bucket += windowMinutes * 60 * 1000;
    }
  },
});
