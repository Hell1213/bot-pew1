export const now = (): number => Date.now();

export const minutesAgo = (n: number): number => now() - n * 60 * 1000;

export const bucketKey = (timestamp: number, windowMinutes: number): number => {
  const windowMs = windowMinutes * 60 * 1000;
  return Math.floor(timestamp / windowMs) * windowMs;
};
