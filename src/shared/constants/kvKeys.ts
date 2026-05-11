const PREFIX = 'modsignal';

export const kvKeys = {
  subredditConfig: (subreddit: string) => `${PREFIX}:config:${subreddit}`,
  bucketEvents: (subreddit: string, bucket: string) =>
    `${PREFIX}:events:${subreddit}:${bucket}`,
  alert: (subreddit: string, alertId: string) =>
    `${PREFIX}:alert:${subreddit}:${alertId}`,
  alertIndex: (subreddit: string) => `${PREFIX}:alerts:${subreddit}`,
  fingerprint: (subreddit: string, userId: string) =>
    `${PREFIX}:fp:${subreddit}:${userId}`,
  fingerprintIndex: (subreddit: string) => `${PREFIX}:fps:${subreddit}`,
  dismissedAlertIds: (subreddit: string) =>
    `${PREFIX}:dismissed:${subreddit}`,
  subredditRisk: (subreddit: string) => `${PREFIX}:risk:${subreddit}`,
  schedulerState: (subreddit: string) => `${PREFIX}:sched:${subreddit}`,
} as const;
