import type { ActivityEvent, AccountFingerprint } from '../../shared/dto/modsignal';

const FEATURE_COUNT = 7;

const normalize = (value: number, min: number, max: number): number => {
  if (max === min) return 0;
  return (value - min) / (max - min);
};

export const buildFeatureVector = (events: readonly ActivityEvent[]): number[] => {
  if (events.length === 0) {
    return new Array(FEATURE_COUNT).fill(0);
  }

  const now = Date.now();
  const accountAgeDays = (now - events[0]!.accountCreatedAt) / (1000 * 60 * 60 * 24);

  const maxKarma = Math.max(...events.map((e) => Math.max(e.postKarma, e.commentKarma)), 1);
  const avgPostKarma = events.reduce((s, e) => s + e.postKarma, 0) / events.length;
  const avgCommentKarma = events.reduce((s, e) => s + e.commentKarma, 0) / events.length;

  const uniqueSubreddits = new Set(events.map((e) => e.subreddit)).size;
  const newAccountCount = events.filter((e) => e.isNewAccount).length;

  return [
    normalize(accountAgeDays, 0, 3650),
    normalize(avgPostKarma, 0, maxKarma),
    normalize(avgCommentKarma, 0, maxKarma),
    normalize(events.filter((e) => e.type === 'post').length, 0, events.length),
    normalize(events.filter((e) => e.type === 'comment').length, 0, events.length),
    normalize(uniqueSubreddits, 0, 50),
    normalize(newAccountCount, 0, events.length),
  ];
};

export const computeAccountFingerprint = (
  userId: string,
  events: readonly ActivityEvent[],
): AccountFingerprint => {
  if (events.length === 0) {
    return {
      userId,
      username: 'unknown',
      accountAgeDays: 0,
      karmaScore: 0,
      postFrequency: 0,
      commentFrequency: 0,
      uniqueSubreddits: 0,
      hasVerifiedEmail: false,
      isMod: false,
      featureVector: new Array(FEATURE_COUNT).fill(0),
    };
  }

  const now = Date.now();
  const accountAgeDays = (now - events[0]!.accountCreatedAt) / (1000 * 60 * 60 * 24);

  const totalKarma = events.reduce((s, e) => s + e.postKarma + e.commentKarma, 0);
  const postCount = events.filter((e) => e.type === 'post').length;
  const commentCount = events.filter((e) => e.type === 'comment').length;
  const uniqueSubreddits = new Set(events.map((e) => e.subreddit)).size;

  return {
    userId,
    username: events[0]!.username,
    accountAgeDays,
    karmaScore: totalKarma,
    postFrequency: postCount,
    commentFrequency: commentCount,
    uniqueSubreddits,
    hasVerifiedEmail: false,
    isMod: false,
    featureVector: buildFeatureVector(events),
  };
};
