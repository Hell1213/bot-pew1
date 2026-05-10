import type { ActivityEvent, BurstResult } from '../../shared/dto/modsignal';
import { zScore } from '../../shared/utils/stats';

export const detectBurst = (
  events: readonly ActivityEvent[],
  baselineMean: number,
  baselineStddev: number,
  threshold = 3.0,
): BurstResult => {
  const eventCount = events.length;
  const newAccountEvents = events.filter((e) => e.isNewAccount);
  const newAccountCount = newAccountEvents.length;
  const newAccountRatio = eventCount > 0 ? newAccountCount / eventCount : 0;

  const score = zScore(eventCount, baselineMean, baselineStddev);
  const reasonCodes: string[] = [];

  if (score > threshold) {
    reasonCodes.push('high_z_score');
  }

  if (newAccountRatio > 0.5) {
    reasonCodes.push('new_account_surge');
  }

  if (eventCount > baselineMean + baselineStddev * 2) {
    reasonCodes.push('volume_spike');
  }

  return {
    isBurst: reasonCodes.length > 0,
    zScore: score,
    eventCount,
    newAccountCount,
    newAccountRatio,
    reasonCodes,
  };
};
