import type { ActivityEvent } from '../../shared/dto/modsignal';
import { bucketKey, getWindowBounds, BUCKET_SIZE_MS } from '../../shared/utils/time';
import { Welford } from '../../shared/utils/stats';
import type { KVStore } from '../storage/kvStore';
import { kvKeys } from '../../shared/constants/kvKeys';

export class WindowManager {
  constructor(
    private readonly kv: KVStore,
    private readonly subreddit: string,
    private readonly windowMinutes: number = 5
  ) {}

  async recordEvent(event: ActivityEvent): Promise<void> {
    const bucket = bucketKey(event.timestamp, BUCKET_SIZE_MS);
    const key = kvKeys.bucketEvents(this.subreddit, bucket);

    await this.kv.sortedAdd(
      key,
      event.timestamp,
      JSON.stringify(event)
    );

    await this.kv.expire(key, this.windowMinutes * 60 * 2);
  }

  async getCurrentWindowEvents(): Promise<readonly ActivityEvent[]> {
    const now = Date.now();
    const { start } = getWindowBounds(now, this.windowMinutes);

    const startBucket = bucketKey(start, BUCKET_SIZE_MS);
    const endBucket = bucketKey(now, BUCKET_SIZE_MS);

    const startNum = parseInt(startBucket);
    const endNum = parseInt(endBucket);
    const results: ActivityEvent[] = [];

    for (let t = startNum; t <= endNum; t += BUCKET_SIZE_MS) {
      const key = kvKeys.bucketEvents(this.subreddit, t.toString());
      const members = await this.kv.sortedRange(key, 0, -1);
      if (members.length > 0) {
        for (const { member } of members) {
          try {
            const event = JSON.parse(member) as ActivityEvent;
            if (event.timestamp >= start) {
              results.push(event);
            }
          } catch {
            // skip malformed event
          }
        }
      }
    }

    return results;
  }

  async getHistoricalCounts(hours: number = 24): Promise<readonly number[]> {
    const now = Date.now();
    const lookback = hours * 60 * 60 * 1000;
    const counts: number[] = [];
    const running = new Welford();
    const startBucket = bucketKey(now - lookback, BUCKET_SIZE_MS);
    const endBucket = bucketKey(now, BUCKET_SIZE_MS);

    const startNum = parseInt(startBucket);
    const endNum = parseInt(endBucket);

    for (let t = startNum; t <= endNum; t += BUCKET_SIZE_MS) {
      const key = kvKeys.bucketEvents(this.subreddit, t.toString());
      const count = await this.kv.sortedCard(key);
      counts.push(count);
      running.update(count);
    }

    return counts;
  }

  async pruneOldBuckets(retentionHours: number = 48): Promise<void> {
    const now = Date.now();
    const cutoff = now - retentionHours * 60 * 60 * 1000;
    const cutoffBucket = bucketKey(cutoff, BUCKET_SIZE_MS);
    const cutoffNum = parseInt(cutoffBucket);

    for (let t = 0; t < cutoffNum; t += BUCKET_SIZE_MS) {
      const key = kvKeys.bucketEvents(this.subreddit, t.toString());
      await this.kv.del(key);
    }
  }
}
