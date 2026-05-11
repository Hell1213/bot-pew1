import type { SubredditConfig } from '../../shared/dto/modsignal';
import type { KVStore } from '../storage/kvStore';
import { kvKeys } from '../../shared/constants/kvKeys';

export class SettingsService {
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

  async updateConfig(updates: Partial<SubredditConfig>): Promise<SubredditConfig> {
    const current = await this.getConfig();
    const updated = { ...current, ...updates };
    await this.kv.set(kvKeys.subredditConfig(this.subreddit), updated);
    return updated;
  }

  async autoTune(
    wasFalsePositive: boolean,
    currentConfig: SubredditConfig
  ): Promise<SubredditConfig> {
    if (!currentConfig.autoTuneEnabled) return currentConfig;

    const adjustment = wasFalsePositive ? 0.5 : -0.25;
    const newThreshold = Math.max(
      1,
      Math.min(10, currentConfig.burstThreshold + adjustment)
    );

    return this.updateConfig({ burstThreshold: Math.round(newThreshold * 10) / 10 });
  }
}
