import type { AlertPayload, AccountFingerprint } from '../../shared/dto/modsignal';
import { now } from '../../shared/utils/time';
import type { WindowManager } from './windowManager';
import type { PersistenceService } from './persistenceService';
import type { SettingsService } from './settings';
import { detectBurst } from '../scoring/burst';
import { computeAccountFingerprint } from '../scoring/fingerprint';
import { findClusters } from '../scoring/similarity';
import { computeSuspicionScore } from '../scoring/suspicion';

export interface ScoringOrchestrator {
  runScoringCycle(subreddit: string): Promise<AlertPayload[]>;
}

export const createScoringOrchestrator = (
  wm: WindowManager,
  persistence: PersistenceService,
  settings: SettingsService,
): ScoringOrchestrator => ({
  async runScoringCycle(subreddit: string): Promise<AlertPayload[]> {
    const config = await settings.getOrCreateConfig(subreddit);
    if (!config.enabled) return [];

    const windowEvents = await wm.getActiveWindowEvents(subreddit, config.windowMinutes);
    if (windowEvents.length === 0) return [];

    const baseline = await wm.computeBaseline(subreddit, 30, config.windowMinutes);

    const burstResult = detectBurst(
      windowEvents,
      baseline.mean,
      baseline.stddev,
      config.burstThreshold,
    );

    if (!burstResult.isBurst) return [];

    const userEventMap = new Map<string, typeof windowEvents>();
    for (const event of windowEvents) {
      const existing = userEventMap.get(event.userId) ?? [];
      existing.push(event);
      userEventMap.set(event.userId, existing);
    }

    const fingerprints: AccountFingerprint[] = [];
    for (const [userId, events] of userEventMap) {
      const fp = computeAccountFingerprint(userId, events);
      await persistence.saveFingerprint(fp);
      fingerprints.push(fp);
    }

    const clusters = findClusters(fingerprints, config.similarityThreshold);

    const alerts: AlertPayload[] = [];
    const severityOptions = ['low', 'medium', 'high', 'critical'] as const;

    for (const cluster of clusters) {
      const suspicionScores = cluster.map((fp) => computeSuspicionScore(fp, burstResult, 0.8));
      const maxScore = Math.max(...suspicionScores);
      if (maxScore < 50) continue;

      const severityIndex = Math.min(Math.floor(maxScore / 25), 3);
      const alert: AlertPayload = {
        id: `alert-${now()}-${cluster[0]!.userId}`,
        subreddit,
        type: 'burst',
        severity: severityOptions[severityIndex]!,
        reasonCodes: burstResult.reasonCodes as unknown as string[],
        affectedUsers: cluster,
        relatedPosts: [],
        relatedComments: [],
        score: maxScore,
        timestamp: now(),
        dismissed: false,
      };

      await persistence.saveAlert(alert);
      alerts.push(alert);
    }

    return alerts;
  },
});
