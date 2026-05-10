export const zScore = (value: number, mean: number, stddev: number): number => {
  if (stddev === 0) return 0;
  return (value - mean) / stddev;
};

export class Welford {
  private count = 0;
  private m = 0;
  private s = 0;

  update(value: number): void {
    this.count++;
    const delta = value - this.m;
    this.m += delta / this.count;
    const delta2 = value - this.m;
    this.s += delta * delta2;
  }

  get mean(): number {
    return this.count > 0 ? this.m : 0;
  }

  get variance(): number {
    return this.count > 1 ? this.s / (this.count - 1) : 0;
  }

  get stddev(): number {
    return Math.sqrt(this.variance);
  }

  get n(): number {
    return this.count;
  }
}
