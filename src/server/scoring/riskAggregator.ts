import type { AlertPayload, SubredditRisk } from '../../shared/dto/modsignal';

export const aggregateRisk = (alerts: readonly AlertPayload[]): SubredditRisk => {
  if (alerts.length === 0) {
    return {
      subreddit: '',
      totalAlertCount: 0,
      uniqueUsersFlagged: 0,
      averageSeverity: 0,
      topReasonCodes: [],
      recommendedAction: 'none',
    };
  }

  const subreddit = alerts[0]!.subreddit;
  const uniqueUsersFlagged = new Set(
    alerts.flatMap((a) => a.affectedUsers.map((u) => u.userId)),
  ).size;

  const severityMap: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
  const totalSeverity = alerts.reduce((s, a) => s + (severityMap[a.severity] ?? 0), 0);
  const averageSeverity = totalSeverity / alerts.length;

  const reasonCount = new Map<string, number>();
  for (const alert of alerts) {
    for (const code of alert.reasonCodes) {
      reasonCount.set(code, (reasonCount.get(code) ?? 0) + 1);
    }
  }
  const topReasonCodes = [...reasonCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([code]) => code);

  let recommendedAction: SubredditRisk['recommendedAction'] = 'none';

  if (alerts.some((a) => a.severity === 'critical')) {
    recommendedAction = 'lock';
  } else if (alerts.some((a) => a.severity === 'high') || alerts.length >= 3) {
    recommendedAction = 'restrict';
  } else if (alerts.length >= 1) {
    recommendedAction = 'watch';
  }

  return {
    subreddit,
    totalAlertCount: alerts.length,
    uniqueUsersFlagged,
    averageSeverity,
    topReasonCodes,
    recommendedAction,
  };
};
