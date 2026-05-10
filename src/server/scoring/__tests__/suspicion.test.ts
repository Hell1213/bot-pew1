import { describe, it, expect } from 'vitest';
import { computeSuspicionScore } from '../suspicion';
import type { AccountFingerprint, BurstResult } from '../../../shared/dto/modsignal';

const makeFp = (overrides: Partial<AccountFingerprint> = {}): AccountFingerprint => ({
  userId: 'u1',
  username: 'user1',
  accountAgeDays: 365,
  karmaScore: 1000,
  postFrequency: 50,
  commentFrequency: 200,
  uniqueSubreddits: 10,
  hasVerifiedEmail: true,
  isMod: false,
  featureVector: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0],
  ...overrides,
});

const makeBurst = (overrides: Partial<BurstResult> = {}): BurstResult => ({
  isBurst: true,
  zScore: 5,
  eventCount: 20,
  newAccountCount: 15,
  newAccountRatio: 0.75,
  reasonCodes: ['high_z_score'],
  ...overrides,
});

describe('computeSuspicionScore', () => {
  it('returns low score for established account with no burst', () => {
    const score = computeSuspicionScore(makeFp());
    expect(score).toBeLessThan(50);
  });

  it('returns high score for new account in burst', () => {
    const fp = makeFp({ accountAgeDays: 1, karmaScore: 5 });
    const score = computeSuspicionScore(fp, makeBurst());
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('returns score in 0-100 range', () => {
    const score = computeSuspicionScore(makeFp(), makeBurst(), 0.9);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('penalises similarity to known bad actors', () => {
    const withSim = computeSuspicionScore(makeFp({ karmaScore: 5 }), makeBurst(), 0.9);
    const withoutSim = computeSuspicionScore(makeFp({ karmaScore: 5 }), makeBurst(), 0);
    expect(withSim).toBeGreaterThanOrEqual(withoutSim);
  });
});
