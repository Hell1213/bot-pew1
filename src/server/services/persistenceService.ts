import type {
  AccountFingerprint,
  AlertPayload,
  SubredditConfig,
  SubredditRisk,
  ModAction,
  ModActionEntry,
  DashboardStats,
} from '../../shared/dto/modsignal';
import type { KVStore } from '../storage/kvStore';
import { kvKeys } from '../../shared/constants/kvKeys';

export class PersistenceService {
  constructor(
    private readonly kv: KVStore,
    private readonly subreddit: string
  ) {}

  async getConfig(): Promise<SubredditConfig> {
    const key = kvKeys.subredditConfig(this.subreddit);
    const existing = await this.kv.get<SubredditConfig>(key);
    return existing ?? {
      subreddit: this.subreddit,
      enabled: true,
      burstThreshold: 3,
      similarityThreshold: 0.75,
      windowMinutes: 5,
      cooldownMinutes: 15,
      autoTuneEnabled: true,
    };
  }

  async saveConfig(updates: Partial<SubredditConfig>): Promise<SubredditConfig> {
    const current = await this.getConfig();
    const updated: SubredditConfig = {
      ...current,
      ...updates,
      burstThreshold: updates.burstThreshold != null ? Math.max(0.5, Math.min(10, updates.burstThreshold)) : current.burstThreshold,
      similarityThreshold: updates.similarityThreshold != null ? Math.max(0.1, Math.min(1, updates.similarityThreshold)) : current.similarityThreshold,
      windowMinutes: updates.windowMinutes != null ? Math.max(1, Math.min(60, updates.windowMinutes)) : current.windowMinutes,
      cooldownMinutes: updates.cooldownMinutes != null ? Math.max(1, Math.min(120, updates.cooldownMinutes)) : current.cooldownMinutes,
    };
    await this.kv.set(kvKeys.subredditConfig(this.subreddit), updated);
    return updated;
  }

  async getFingerprints(): Promise<readonly AccountFingerprint[]> {
    const indexKey = kvKeys.fingerprintIndex(this.subreddit);
    const all = await this.kv.hashGetAll<string>(indexKey);
    return Object.values(all)
      .map((val) => {
        try { return JSON.parse(val) as AccountFingerprint; } catch { return undefined; }
      })
      .filter((fp): fp is AccountFingerprint => fp !== undefined);
  }

  async saveFingerprint(fp: AccountFingerprint): Promise<void> {
    const indexKey = kvKeys.fingerprintIndex(this.subreddit);
    await this.kv.hashSet(indexKey, fp.userId, JSON.stringify(fp));
    await this.kv.set(kvKeys.fingerprint(this.subreddit, fp.userId), fp);
  }

  async saveFingerprints(fps: readonly AccountFingerprint[]): Promise<void> {
    for (const fp of fps) {
      await this.saveFingerprint(fp);
    }
  }

  async getAlerts(): Promise<readonly AlertPayload[]> {
    const indexKey = kvKeys.alertIndex(this.subreddit);
    const members = await this.kv.sortedRange(indexKey, 0, -1);
    const results: AlertPayload[] = [];
    for (const { member } of members) {
      const alert = await this.getAlert(member);
      if (alert) results.push(alert);
    }
    return results;
  }

  async getAlert(alertId: string): Promise<AlertPayload | undefined> {
    return this.kv.get<AlertPayload>(kvKeys.alert(this.subreddit, alertId));
  }

  async saveAlert(alert: AlertPayload): Promise<void> {
    const alertKey = kvKeys.alert(this.subreddit, alert.id);
    const indexKey = kvKeys.alertIndex(this.subreddit);
    await this.kv.set(alertKey, alert);
    await this.kv.sortedAdd(indexKey, alert.timestamp, alert.id);
  }

  async dismissAlert(alertId: string, dismissedBy: string): Promise<void> {
    const alert = await this.getAlert(alertId);
    if (!alert) return;
    const entry: ModActionEntry = { action: 'dismiss', by: dismissedBy, at: Date.now() };
    const updated: AlertPayload = {
      ...alert,
      actionHistory: [...alert.actionHistory, entry],
    };
    await this.saveAlert(updated);
  }

  async addAction(alertId: string, action: ModAction, by: string): Promise<AlertPayload | undefined> {
    const alert = await this.getAlert(alertId);
    if (!alert) return undefined;
    const entry: ModActionEntry = { action, by, at: Date.now() };
    const updated: AlertPayload = {
      ...alert,
      actionHistory: [...alert.actionHistory, entry],
    };
    await this.saveAlert(updated);
    return updated;
  }

  async getRisk(): Promise<SubredditRisk | undefined> {
    return this.kv.get<SubredditRisk>(kvKeys.subredditRisk(this.subreddit));
  }

  async saveRisk(risk: SubredditRisk): Promise<void> {
    await this.kv.set(kvKeys.subredditRisk(this.subreddit), risk);
  }

  async getStats(): Promise<DashboardStats> {
    const alerts = await this.getAlerts();
    const alertsList = alerts as AlertPayload[];
    const activeAlerts = alertsList.filter((a) => {
      const lastAction = a.actionHistory[a.actionHistory.length - 1];
      return !lastAction || lastAction.action !== 'dismiss';
    });
    const criticalAlerts = activeAlerts.filter((a) => a.severity === 'critical').length;
    const risk = await this.getRisk();
    return {
      activeAlerts: activeAlerts.length,
      criticalAlerts,
      totalUsersFlagged: risk?.uniqueUsersFlagged ?? 0,
      eventsProcessed: 0,
      lastScoredAt: null,
      systemActive: true,
    };
  }

  async clearAlerts(): Promise<void> {
    const indexKey = kvKeys.alertIndex(this.subreddit);
    const members = await this.kv.sortedRange(indexKey, 0, -1);
    for (const { member } of members) {
      await this.kv.del(kvKeys.alert(this.subreddit, member));
    }
    await this.kv.del(indexKey);
  }
}
