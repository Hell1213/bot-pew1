export const BUCKET_SIZE_MS = 5 * 60 * 1000;

export const bucketKey = (timestamp: number, windowSizeMs: number = BUCKET_SIZE_MS): string => {
  const bucket = Math.floor(timestamp / windowSizeMs) * windowSizeMs;
  return bucket.toString();
};

export const getWindowBounds = (
  now: number,
  windowMinutes: number
): { start: number; end: number } => {
  const windowMs = windowMinutes * 60 * 1000;
  return { start: now - windowMs, end: now };
};

export const isExpired = (timestamp: number, ttlMs: number): boolean => {
  return Date.now() - timestamp > ttlMs;
};

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
