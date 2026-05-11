import type {
  AccountFingerprint,
  BurstResult,
  AlertType,
  Severity,
} from '../../shared/dto/modsignal';

export type SuspicionResult = {
  readonly score: number;
  readonly confidence: number;
  readonly alertType: AlertType;
  readonly severity: Severity;
  readonly reasonCodes: readonly string[];
};

const WEIGHTS = {
  burst: 0.35,
  newAccount: 0.15,
  fingerprintAnomaly: 0.25,
  clusterSize: 0.25,
} as const;

export const computeSuspicion = (
  burstResult: BurstResult,
  fingerprints: readonly AccountFingerprint[],
  clusters: readonly { memberIds: readonly string[] }[]
): SuspicionResult => {
  const burstScore = burstResult.isBurst
    ? Math.min(burstResult.zScore / 5, 1) * 100
    : 0;

  const newAccountScore = burstResult.newAccountRatio * 100;

  const lowKarmaUsers = fingerprints.filter((f) => f.karmaScore < 100).length;
  const fpAnomalyScore =
    fingerprints.length > 0
      ? (lowKarmaUsers / fingerprints.length) * 100
      : 0;

  const largeClusters = clusters.filter((c) => c.memberIds.length >= 3);
  const clusterScore =
    fingerprints.length > 0
      ? (largeClusters.reduce((s, c) => s + c.memberIds.length, 0) /
          fingerprints.length) *
        100
      : 0;

  const score = Math.round(
    burstScore * WEIGHTS.burst +
      newAccountScore * WEIGHTS.newAccount +
      fpAnomalyScore * WEIGHTS.fingerprintAnomaly +
      clusterScore * WEIGHTS.clusterSize
  );

  const clampedScore = Math.max(0, Math.min(100, score));

  let severity: Severity;
  if (clampedScore >= 80) severity = 'critical';
  else if (clampedScore >= 60) severity = 'high';
  else if (clampedScore >= 35) severity = 'medium';
  else severity = 'low';

  const reasonCodes: string[] = [];
  if (burstResult.isBurst) reasonCodes.push(...burstResult.reasonCodes);
  if (fpAnomalyScore > 50) reasonCodes.push('low_karma_majority');
  if (clusterScore > 50) reasonCodes.push('coordinated_cluster');

  return {
    score: clampedScore,
    confidence: clampedScore / 100,
    alertType: clampedScore >= 60 ? 'brigade' : 'burst',
    severity,
    reasonCodes: reasonCodes.length > 0 ? reasonCodes : ['routine_monitoring'],
  };
};
