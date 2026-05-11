import { describe, it, expect } from 'vitest';
import { bucketKey } from '../time';

describe('bucketKey', () => {
  it('rounds to nearest 5-minute boundary', () => {
    const result = bucketKey(0, 5);
    expect(result).toBe(0);
  });

  it('rounds down to window boundary', () => {
    const ts = 5 * 60 * 1000 + 1000;
    const result = bucketKey(ts, 5);
    expect(result).toBe(5 * 60 * 1000);
  });

  it('works with 1-minute window', () => {
    const result = bucketKey(123456, 1);
    expect(result).toBe(120000);
  });
});
