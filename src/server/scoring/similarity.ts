import type { AccountFingerprint } from '../../shared/dto/modsignal';
import { cosineSimilarity } from './fingerprint';

export type Cluster = {
  readonly centroid: readonly number[];
  readonly memberIds: readonly string[];
};

const AGGLOMERATIVE_THRESHOLD = 0.75;

export const agglomerativeCluster = (
  fingerprints: readonly AccountFingerprint[],
  similarityThreshold: number = AGGLOMERATIVE_THRESHOLD
): readonly Cluster[] => {
  if (fingerprints.length === 0) return [];
  if (fingerprints.length === 1) {
    return [{
      centroid: fingerprints[0]!.featureVector,
      memberIds: [fingerprints[0]!.userId],
    }];
  }

  const remaining = fingerprints.map((f) => ({
    centroid: [...f.featureVector],
    memberIds: [f.userId],
  }));

  let merged = true;
  while (merged) {
    merged = false;
    let bestI = -1, bestJ = -1;
    let bestSim = -1;

    for (let i = 0; i < remaining.length; i++) {
      for (let j = i + 1; j < remaining.length; j++) {
        const sim = cosineSimilarity(remaining[i]!.centroid, remaining[j]!.centroid);
        if (sim > bestSim) {
          bestSim = sim;
          bestI = i;
          bestJ = j;
        }
      }
    }

    if (bestSim >= similarityThreshold && bestI >= 0 && bestJ >= 0) {
      const a = remaining[bestI]!;
      const b = remaining[bestJ]!;
      const mergedMembers = [...a.memberIds, ...b.memberIds];
      const mergedCentroid = a.centroid.map(
        (v, i) => (v + b.centroid[i]!) / 2
      );
      remaining.splice(Math.max(bestI, bestJ), 1);
      remaining.splice(Math.min(bestI, bestJ), 1);
      remaining.push({ centroid: mergedCentroid, memberIds: mergedMembers });
      merged = true;
    }
  }

  return remaining;
};
