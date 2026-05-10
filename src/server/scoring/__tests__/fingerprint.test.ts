import { describe, it, expect } from 'vitest';
import { buildFeatureVector, computeAccountFingerprint } from '../fingerprint';
import type { ActivityEvent } from '../../../shared/dto/modsignal';

const makeEvent = (overrides: Partial<ActivityEvent> = {}): ActivityEvent => ({
  type: 'post',
  userId: 'u1',
  username: 'user1',
  subreddit: 'test',
  postId: 'p1',
  timestamp: Date.now(),
  accountCreatedAt: Date.now() - 86400000 * 30,
  postKarma: 100,
  commentKarma: 50,
  isNewAccount: false,
  ...overrides,
});

describe('buildFeatureVector', () => {
  it('returns zero vector for empty events', () => {
    const vec = buildFeatureVector([]);
    expect(vec).toHaveLength(7);
    expect(vec.every((v) => v === 0)).toBe(true);
  });

  it('returns normalised values in [0, 1]', () => {
    const events = [makeEvent(), makeEvent({ postKarma: 200, commentKarma: 100 })];
    const vec = buildFeatureVector(events);
    expect(vec).toHaveLength(7);
    vec.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    });
  });

  it('differentiates new vs old accounts', () => {
    const oldEvents = [makeEvent({ accountCreatedAt: Date.now() - 86400000 * 365, isNewAccount: false })];
    const newEvents = [makeEvent({ accountCreatedAt: Date.now(), isNewAccount: true })];
    const oldVec = buildFeatureVector(oldEvents);
    const newVec = buildFeatureVector(newEvents);
    expect(oldVec[0]!).toBeGreaterThan(newVec[0]!);
  });
});

describe('computeAccountFingerprint', () => {
  it('builds fingerprint from events', () => {
    const events = [makeEvent()];
    const fp = computeAccountFingerprint('u1', events);
    expect(fp.userId).toBe('u1');
    expect(fp.featureVector).toHaveLength(7);
    expect(fp.karmaScore).toBe(150);
  });
});
