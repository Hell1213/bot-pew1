import { describe, it, expect } from 'vitest';
import { detectBurst } from '../burst';
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

describe('detectBurst', () => {
  it('returns no burst for normal activity', () => {
    const events = Array.from({ length: 5 }, () => makeEvent());
    const result = detectBurst(events, 5, 1);
    expect(result.isBurst).toBe(false);
    expect(result.zScore).toBe(0);
  });

  it('detects burst when z-score exceeds threshold', () => {
    const events = Array.from({ length: 20 }, () => makeEvent());
    const result = detectBurst(events, 5, 1, 3.0);
    expect(result.isBurst).toBe(true);
    expect(result.zScore).toBe(15);
    expect(result.reasonCodes).toContain('high_z_score');
  });

  it('flags new account surge', () => {
    const events = Array.from({ length: 10 }, () => makeEvent({ isNewAccount: true }));
    const result = detectBurst(events, 5, 2);
    expect(result.isBurst).toBe(true);
    expect(result.newAccountRatio).toBe(1);
    expect(result.reasonCodes).toContain('new_account_surge');
  });

  it('handles empty events', () => {
    const result = detectBurst([], 5, 2);
    expect(result.isBurst).toBe(false);
    expect(result.eventCount).toBe(0);
  });

  it('returns volume spike reason', () => {
    const events = Array.from({ length: 15 }, () => makeEvent());
    const result = detectBurst(events, 5, 2);
    expect(result.reasonCodes).toContain('volume_spike');
  });
});
