export type ActivityEvent = {
  readonly type: 'post' | 'comment' | 'vote';
  readonly userId: string;
  readonly username: string;
  readonly subreddit: string;
  readonly postId: string;
  readonly commentId?: string;
  readonly timestamp: number;
  readonly accountCreatedAt: number;
  readonly postKarma: number;
  readonly commentKarma: number;
  readonly isNewAccount: boolean;
};

export type AccountFingerprint = {
  readonly userId: string;
  readonly username: string;
  readonly accountAgeDays: number;
  readonly karmaScore: number;
  readonly postFrequency: number;
  readonly commentFrequency: number;
  readonly uniqueSubreddits: number;
  readonly hasVerifiedEmail: boolean;
  readonly isMod: boolean;
  readonly featureVector: readonly number[];
};

export type BurstResult = {
  readonly isBurst: boolean;
  readonly zScore: number;
  readonly eventCount: number;
  readonly newAccountCount: number;
  readonly newAccountRatio: number;
  readonly reasonCodes: readonly string[];
};

export type AlertType = 'burst' | 'brigade' | 'ban_evasion' | 'spam_raid';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type RecommendedAction = 'none' | 'watch' | 'restrict' | 'lock';

export type AlertPayload = {
  readonly id: string;
  readonly subreddit: string;
  readonly type: AlertType;
  readonly severity: Severity;
  readonly reasonCodes: readonly string[];
  readonly affectedUsers: readonly AccountFingerprint[];
  readonly relatedPosts: readonly string[];
  readonly relatedComments: readonly string[];
  readonly score: number;
  readonly timestamp: number;
  readonly dismissed: boolean;
  readonly dismissedAt?: number;
  readonly dismissedBy?: string;
};

export type SubredditConfig = {
  readonly subreddit: string;
  readonly enabled: boolean;
  readonly burstThreshold: number;
  readonly similarityThreshold: number;
  readonly windowMinutes: number;
  readonly cooldownMinutes: number;
  readonly autoTuneEnabled: boolean;
};

export type SubredditRisk = {
  readonly subreddit: string;
  readonly totalAlertCount: number;
  readonly uniqueUsersFlagged: number;
  readonly averageSeverity: number;
  readonly topReasonCodes: readonly string[];
  readonly recommendedAction: RecommendedAction;
};
