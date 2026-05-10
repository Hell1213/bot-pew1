import type { AccountFingerprint } from '../../shared/dto/modsignal';

export const computeCosineSimilarity = (
  a: readonly number[],
  b: readonly number[],
): number => {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const ai = a[i]!;
    const bi = b[i]!;
    dotProduct += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
};

export const computeJaccardSimilarity = (
  setA: Set<string>,
  setB: Set<string>,
): number => {
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  if (union.size === 0) return 1;

  return intersection.size / union.size;
};

export const findClusters = (
  users: readonly AccountFingerprint[],
  similarityThreshold: number,
): AccountFingerprint[][] => {
  const userList = [...users];
  if (userList.length === 0) return [];
  if (userList.length === 1) return [[userList[0]!]];

  const clusters: AccountFingerprint[][] = [[userList[0]!]];

  for (let i = 1; i < userList.length; i++) {
    const user = userList[i]!;
    let merged = false;

    for (const cluster of clusters) {
      const hasSimilar = cluster.some(
        (c) => computeCosineSimilarity(user.featureVector, c.featureVector) > similarityThreshold,
      );

      if (hasSimilar) {
        cluster.push(user);
        merged = true;
        break;
      }
    }

    if (!merged) {
      clusters.push([user]);
    }
  }

  return clusters.filter((c) => c.length > 1);
};
