import type {
  SubredditRisk,
  AlertPayload,
} from '../../shared/dto/modsignal';

export const aggregateRisk = (
  alerts: readonly AlertPayload[]
): SubredditRisk | undefined => {
  if (alerts.length === 0) return undefined;

  const uniqueUsers = new Set<string>();
  const reasonCount = new Map<string, number>();
  let totalSeverity = 0;

  for (const alert of alerts) {
    for (const user of alert.affectedUsers) {
      uniqueUsers.add(user.userId);
    }
    for (const code of alert.reasonCodes) {
      reasonCount.set(code, (reasonCount.get(code) ?? 0) + 1);
    }
    const severityVal = alert.severity === 'critical' ? 4
      : alert.severity === 'high' ? 3
      : alert.severity === 'medium' ? 2
      : 1;
    totalSeverity += severityVal;
  }

  const avgSeverity = alerts.length > 0 ? totalSeverity / alerts.length : 0;
  const sortedReasons = [...reasonCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([code]) => code);

  let recommendedAction = 'none';
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const highCount = alerts.filter((a) => a.severity === 'high').length;

  if (criticalCount >= 3) recommendedAction = 'lock';
  else if (criticalCount >= 1 || highCount >= 3) recommendedAction = 'restrict';
  else if (highCount >= 1 || alerts.length >= 5) recommendedAction = 'watch';

  return {
    subreddit: alerts[0]!.subreddit,
    totalAlertCount: alerts.length,
    uniqueUsersFlagged: uniqueUsers.size,
    averageSeverity: Math.round(avgSeverity * 100) / 100,
    topReasonCodes: sortedReasons,
    recommendedAction,
  };
};
