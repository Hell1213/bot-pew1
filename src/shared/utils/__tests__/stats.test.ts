import { describe, it, expect } from 'vitest';
import { zScore, Welford } from '../stats';

describe('zScore', () => {
  it('returns 0 when stddev is 0', () => {
    expect(zScore(5, 5, 0)).toBe(0);
  });

  it('returns correct z-score', () => {
    expect(zScore(10, 5, 2.5)).toBe(2);
    expect(zScore(0, 5, 2.5)).toBe(-2);
  });
});

describe('Welford', () => {
  it('computes correct mean', () => {
    const w = new Welford();
    w.update(1);
    w.update(2);
    w.update(3);
    expect(w.mean).toBe(2);
    expect(w.n).toBe(3);
  });

  it('computes correct stddev', () => {
    const w = new Welford();
    w.update(1);
    w.update(2);
    w.update(3);
    expect(w.stddev).toBeCloseTo(1, 5);
  });

  it('returns 0 for single value', () => {
    const w = new Welford();
    w.update(5);
    expect(w.mean).toBe(5);
    expect(w.variance).toBe(0);
  });
});
