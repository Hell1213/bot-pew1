import type { ActivityEvent } from '../../shared/dto/modsignal';
import { zScore, computeBaseline } from '../../shared/utils/stats';

export type BurstDetectionResult = {
  readonly isBurst: boolean;
  readonly zScore: number;
  readonly eventCount: number;
  readonly newAccountCount: number;
  readonly newAccountRatio: number;
  readonly reasonCodes: readonly string[];
};

export const detectBurst = (
  events: readonly ActivityEvent[],
  baselineCounts: readonly number[],
  threshold: number,
  newAccountRatioThreshold: number = 0.3
): BurstDetectionResult => {
  const eventCount = events.length;
  const newAccounts = events.filter((e) => e.isNewAccount);
  const newAccountCount = newAccounts.length;
  const newAccountRatio = eventCount > 0 ? newAccountCount / eventCount : 0;

  const { mean, stdDev } = computeBaseline(baselineCounts);
  const z = zScore(eventCount, mean, stdDev);

  const reasonCodes: string[] = [];
  if (z > threshold) reasonCodes.push('burst_z_score');
  if (newAccountRatio > newAccountRatioThreshold) reasonCodes.push('high_new_account_ratio');

  return {
    isBurst: reasonCodes.length > 0,
    zScore: z,
    eventCount,
    newAccountCount,
    newAccountRatio,
    reasonCodes,
  };
};
