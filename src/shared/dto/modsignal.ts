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
  readonly hasVerifiedEmail: boolean;
  readonly isMod: boolean;
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

export type ModAction =
  | 'acknowledge'
  | 'dismiss'
  | 'monitor'
  | 'investigate'
  | 'escalate';

export type ModActionEntry = {
  action: ModAction;
  by: string;
  at: number;
};

export type ExplainabilityData = {
  burstAnomalyScore: number;
  burstZScore: number;
  clusterConfidence: number;
  clusterCount: number;
  suspiciousAccountRatio: number;
  temporalAnomaly: boolean;
  scoringComposition: {
    burstWeight: number;
    newAccountWeight: number;
    fingerprintWeight: number;
    clusterWeight: number;
  };
  summary: string;
};

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
  readonly actionHistory: readonly ModActionEntry[];
  readonly explainability?: ExplainabilityData;
};

export type ConfigPreset = 'conservative' | 'balanced' | 'aggressive';

export const CONFIG_PRESETS: Record<ConfigPreset, {
  burstThreshold: number;
  similarityThreshold: number;
  windowMinutes: number;
  cooldownMinutes: number;
  label: string;
  description: string;
}> = {
  conservative: {
    burstThreshold: 5,
    similarityThreshold: 0.85,
    windowMinutes: 10,
    cooldownMinutes: 30,
    label: 'Conservative',
    description: 'Fewer alerts, higher confidence required. Best for large subreddits.',
  },
  balanced: {
    burstThreshold: 3,
    similarityThreshold: 0.75,
    windowMinutes: 5,
    cooldownMinutes: 15,
    label: 'Balanced',
    description: 'Moderate sensitivity for most communities.',
  },
  aggressive: {
    burstThreshold: 1.5,
    similarityThreshold: 0.6,
    windowMinutes: 3,
    cooldownMinutes: 10,
    label: 'Aggressive',
    description: 'Maximum detection. May produce more false positives.',
  },
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
  readonly recommendedAction: string;
};

export type DemoScenario = 'normal' | 'spam_wave' | 'coordinated_raid' | 'suspicious_swarm' | 'reset';

export type DashboardStats = {
  activeAlerts: number;
  criticalAlerts: number;
  totalUsersFlagged: number;
  eventsProcessed: number;
  lastScoredAt: number | null;
  systemActive: boolean;
};
