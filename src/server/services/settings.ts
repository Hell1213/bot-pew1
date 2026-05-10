import type { SubredditConfig } from '../../shared/dto/modsignal';
import { KEY_CONFIG } from '../../shared/constants/kvKeys';
import type { KVStore } from '../storage/kvStore';

const DEFAULT_CONFIG: SubredditConfig = {
  subreddit: '',
  enabled: true,
  burstThreshold: 3.0,
  similarityThreshold: 0.7,
  windowMinutes: 5,
  cooldownMinutes: 15,
  autoTuneEnabled: true,
};

export interface SettingsService {
  getOrCreateConfig(subreddit: string): Promise<SubredditConfig>;
  updateConfig(subreddit: string, updates: Partial<SubredditConfig>): Promise<SubredditConfig>;
  autoTune(config: SubredditConfig, wasFalsePositive: boolean): SubredditConfig;
}

export const createSettingsService = (store: KVStore): SettingsService => ({
  async getOrCreateConfig(subreddit: string): Promise<SubredditConfig> {
    const existing = await store.getJSON<SubredditConfig>(KEY_CONFIG(subreddit));
    if (existing) return existing;
    const config: SubredditConfig = { ...DEFAULT_CONFIG, subreddit };
    await store.setJSON(KEY_CONFIG(subreddit), config);
    return config;
  },

  async updateConfig(subreddit: string, updates: Partial<SubredditConfig>): Promise<SubredditConfig> {
    const current = await this.getOrCreateConfig(subreddit);
    const updated: SubredditConfig = { ...current, ...updates, subreddit };
    await store.setJSON(KEY_CONFIG(subreddit), updated);
    return updated;
  },

  autoTune(config: SubredditConfig, wasFalsePositive: boolean): SubredditConfig {
    if (!config.autoTuneEnabled) return config;

    let { burstThreshold } = config;

    if (wasFalsePositive) {
      burstThreshold = Math.min(burstThreshold + 0.5, 10.0);
    } else {
      burstThreshold = Math.max(burstThreshold - 0.3, 1.0);
    }

    return { ...config, burstThreshold };
  },
});
