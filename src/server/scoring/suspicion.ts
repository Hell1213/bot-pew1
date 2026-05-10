import type { AccountFingerprint, BurstResult } from '../../shared/dto/modsignal';

export const computeSuspicionScore = (
  fingerprint: AccountFingerprint,
  burstResult?: BurstResult,
  similarityScore?: number,
): number => {
  let score = 0;

  const ageScore = Math.max(0, 100 - fingerprint.accountAgeDays * 10) * 0.2;
  score += ageScore;

  const lowKarmaPenalty = fingerprint.karmaScore < 100 ? (100 - fingerprint.karmaScore) * 0.25 : 0;
  score += Math.min(lowKarmaPenalty, 25);

  if (burstResult && burstResult.isBurst) {
    const burstParticipation = burstResult.newAccountRatio * 100 * 0.3;
    score += burstParticipation;
  }

  if (similarityScore !== undefined && similarityScore > 0.7) {
    const similarityPenalty = similarityScore * 100 * 0.25;
    score += similarityPenalty;
  }

  return Math.min(Math.max(Math.round(score), 0), 100);
};
