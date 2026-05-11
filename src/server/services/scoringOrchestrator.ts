import type { ActivityEvent, AlertPayload, ExplainabilityData } from '../../shared/dto/modsignal';
import { detectBurst } from '../scoring/burst';
import { extractFingerprint } from '../scoring/fingerprint';
import { agglomerativeCluster } from '../scoring/similarity';
import { computeSuspicion } from '../scoring/suspicion';
import { aggregateRisk } from '../scoring/riskAggregator';
import { WindowManager } from './windowManager';
import { PersistenceService } from './persistenceService';

export class ScoringOrchestrator {
  constructor(
    private readonly windowManager: WindowManager,
    private readonly persistence: PersistenceService,
    private readonly subreddit: string
  ) {}

  async runPipeline(events: readonly ActivityEvent[]): Promise<readonly AlertPayload[]> {
    if (events.length === 0) return [];

    const config = await this.persistence.getConfig();
    if (!config.enabled) return [];

    const historicalCounts = await this.windowManager.getHistoricalCounts();
    const burstResult = detectBurst(
      events,
      historicalCounts,
      config.burstThreshold
    );

    const userIds = [...new Set(events.map((e) => e.userId))];
    const now = Date.now();
    const fingerprints = userIds
      .map((id) => extractFingerprint(events, id, now))
      .filter((fp): fp is NonNullable<typeof fp> => fp !== undefined);

    if (fingerprints.length > 0) {
      await this.persistence.saveFingerprints(fingerprints);
    }

    const clusters = agglomerativeCluster(
      fingerprints,
      config.similarityThreshold
    );

    const suspicion = computeSuspicion(burstResult, fingerprints, clusters);

    const existingAlerts = await this.persistence.getAlerts();
    const recentAlert = existingAlerts.find((a) => {
      const lastAction = a.actionHistory[a.actionHistory.length - 1];
      const isDismissed = lastAction?.action === 'dismiss';
      return !isDismissed && Date.now() - a.timestamp < config.cooldownMinutes * 60 * 1000;
    });

    if (suspicion.score >= 35 && !recentAlert) {
      const largeClusters = clusters.filter((c) => c.memberIds.length >= 3);
      const suspiciousUsers = fingerprints.filter((f) => f.karmaScore < 100);

      const explainability: ExplainabilityData = {
        burstAnomalyScore: burstResult.isBurst ? Math.min(burstResult.zScore / 5, 1) * 100 : 0,
        burstZScore: burstResult.zScore,
        clusterConfidence: fingerprints.length > 0
          ? largeClusters.reduce((s, c) => s + c.memberIds.length, 0) / fingerprints.length * 100
          : 0,
        clusterCount: largeClusters.length,
        suspiciousAccountRatio: fingerprints.length > 0 ? suspiciousUsers.length / fingerprints.length : 0,
        temporalAnomaly: burstResult.isBurst,
        scoringComposition: {
          burstWeight: 35,
          newAccountWeight: 15,
          fingerprintWeight: 25,
          clusterWeight: 25,
        },
        summary: [
          burstResult.isBurst ? `Detected ${burstResult.eventCount} events in window (z-score: ${burstResult.zScore.toFixed(1)})` : null,
          suspiciousUsers.length > 0 ? `${suspiciousUsers.length} accounts have low karma (<100)` : null,
          largeClusters.length > 0 ? `${largeClusters.length} coordinated cluster(s) detected among ${fingerprints.length} users` : null,
          burstResult.newAccountRatio > 0.3 ? `${(burstResult.newAccountRatio * 100).toFixed(0)}% of activity from new accounts` : null,
        ].filter(Boolean).join('. ') || 'Routine monitoring activity.',
      };

      const alert: AlertPayload = {
        id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        subreddit: this.subreddit,
        type: suspicion.alertType,
        severity: suspicion.severity,
        reasonCodes: suspicion.reasonCodes,
        affectedUsers: fingerprints,
        relatedPosts: [...new Set(events.filter((e) => e.type === 'post').map((e) => e.postId))],
        relatedComments: [...new Set(events.filter((e) => e.commentId).map((e) => e.commentId!))],
        score: suspicion.score,
        timestamp: Date.now(),
        actionHistory: [],
        explainability,
      };
      await this.persistence.saveAlert(alert);

      const allAlerts = await this.persistence.getAlerts();
      const risk = aggregateRisk([...allAlerts, alert]);
      if (risk) await this.persistence.saveRisk(risk);

      return [alert];
    }

    const allAlerts = await this.persistence.getAlerts();
    const risk = aggregateRisk(allAlerts);
    if (risk) await this.persistence.saveRisk(risk);

    return [];
  }
}
