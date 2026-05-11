import type { ActivityEvent, AccountFingerprint } from '../../shared/dto/modsignal';

const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

export const extractFingerprint = (
  events: readonly ActivityEvent[],
  userId: string,
  now: number
): AccountFingerprint | undefined => {
  const userEvents = events.filter((e) => e.userId === userId);
  if (userEvents.length === 0) return undefined;

  const first = userEvents[0]!;
  const accountAgeDays = (now - first.accountCreatedAt) / (1000 * 60 * 60 * 24);
  const avgKarma = (first.postKarma + first.commentKarma) / 2;
  const posts = userEvents.filter((e) => e.type === 'post').length;
  const comments = userEvents.filter((e) => e.type === 'comment').length;
  const uniqueSubs = new Set(userEvents.map((e) => e.subreddit)).size;

  const vector: number[] = [
    clamp(accountAgeDays / 365, 0, 1),
    clamp(avgKarma / 10000, 0, 1),
    clamp(posts / 50, 0, 1),
    clamp(comments / 100, 0, 1),
    clamp(uniqueSubs / 20, 0, 1),
    first.isNewAccount ? 1 : 0,
    first.hasVerifiedEmail ? 1 : 0,
  ];

  return {
    userId,
    username: first.username,
    accountAgeDays: Math.round(accountAgeDays * 100) / 100,
    karmaScore: Math.round(avgKarma),
    postFrequency: posts,
    commentFrequency: comments,
    uniqueSubreddits: uniqueSubs,
    hasVerifiedEmail: first.hasVerifiedEmail ?? true,
    isMod: first.isMod ?? false,
    featureVector: vector,
  };
};

export const cosineSimilarity = (
  a: readonly number[],
  b: readonly number[]
): number => {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
};

export const jaccardSimilarity = (
  a: readonly string[],
  b: readonly string[]
): number => {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
};
