export const KEY_FINGERPRINT = (sub: string, userId: string): string =>
  `fp:${sub}:${userId}`;

export const KEY_ALERT = (sub: string, id: string): string =>
  `alert:${sub}:${id}`;

export const KEY_ALERT_LIST = (sub: string): string => `alert-list:${sub}`;

export const KEY_CONFIG = (sub: string): string => `config:${sub}`;

export const KEY_WINDOW = (sub: string, bucket: number): string =>
  `window:${sub}:${bucket}`;
