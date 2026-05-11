import { describe, it, expect } from 'vitest';
import { computeCosineSimilarity, computeJaccardSimilarity, findClusters } from '../similarity';
import type { AccountFingerprint } from '../../../shared/dto/modsignal';

describe('computeCosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    const sim = computeCosineSimilarity([1, 2, 3], [1, 2, 3]);
    expect(sim).toBeCloseTo(1, 5);
  });

  it('returns 0 for orthogonal vectors', () => {
    const sim = computeCosineSimilarity([1, 0], [0, 1]);
    expect(sim).toBe(0);
  });

  it('returns negative for opposite vectors', () => {
    const sim = computeCosineSimilarity([1, 0], [-1, 0]);
    expect(sim).toBeCloseTo(-1, 5);
  });

  it('throws for different lengths', () => {
    expect(() => computeCosineSimilarity([1], [1, 2])).toThrow();
  });
});

describe('computeJaccardSimilarity', () => {
  it('returns 1 for identical sets', () => {
    const sim = computeJaccardSimilarity(new Set(['a', 'b']), new Set(['a', 'b']));
    expect(sim).toBe(1);
  });

  it('returns 0 for disjoint sets', () => {
    const sim = computeJaccardSimilarity(new Set(['a']), new Set(['b']));
    expect(sim).toBe(0);
  });

  it('returns correct ratio for overlapping sets', () => {
    const sim = computeJaccardSimilarity(new Set(['a', 'b']), new Set(['a', 'c']));
    expect(sim).toBeCloseTo(1 / 3, 5);
  });
});

describe('findClusters', () => {
  const makeFp = (userId: string, vector: number[]): AccountFingerprint => ({
    userId,
    username: `user${userId}`,
    accountAgeDays: 30,
    karmaScore: 100,
    postFrequency: 5,
    commentFrequency: 10,
    uniqueSubreddits: 3,
    hasVerifiedEmail: false,
    isMod: false,
    featureVector: vector,
  });

  it('returns empty for no users', () => {
    expect(findClusters([], 0.7)).toEqual([]);
  });

  it('clusters similar accounts together', () => {
    const users = [
      makeFp('1', [1, 0, 0, 0, 0, 0, 0]),
      makeFp('2', [0.9, 0, 0, 0, 0, 0, 0]),
      makeFp('3', [0, 1, 1, 1, 1, 1, 1]),
      makeFp('4', [0, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9]),
    ];
    const clusters = findClusters(users, 0.7);
    expect(clusters.length).toBeGreaterThanOrEqual(1);
  });
});
