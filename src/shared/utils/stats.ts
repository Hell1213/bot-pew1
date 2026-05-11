export const zScore = (value: number, mean: number, stdDev: number): number => {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
};

export class Welford {
  private _count = 0;
  private _mean = 0;
  private _m2 = 0;

  get count(): number {
    return this._count;
  }

  get mean(): number {
    return this._mean;
  }

  get variance(): number {
    if (this._count < 2) return 0;
    return this._m2 / (this._count - 1);
  }

  get stdDev(): number {
    return Math.sqrt(this.variance);
  }

  update(value: number): void {
    this._count++;
    const delta = value - this._mean;
    this._mean += delta / this._count;
    const delta2 = value - this._mean;
    this._m2 += delta * delta2;
  }

  reset(): void {
    this._count = 0;
    this._mean = 0;
    this._m2 = 0;
  }
}

export const computeBaseline = (
  values: readonly number[]
): { mean: number; stdDev: number; count: number } => {
  if (values.length === 0) return { mean: 0, stdDev: 0, count: 0 };
  const running = new Welford();
  for (const v of values) running.update(v);
  return { mean: running.mean, stdDev: running.stdDev, count: running.count };
};
