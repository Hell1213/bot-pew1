import type { AccountFingerprint, AlertPayload } from '../../shared/dto/modsignal';
import { KEY_FINGERPRINT, KEY_ALERT, KEY_ALERT_LIST } from '../../shared/constants/kvKeys';
import type { KVStore } from '../storage/kvStore';

export interface PersistenceService {
  saveFingerprint(fp: AccountFingerprint): Promise<void>;
  getFingerprint(userId: string): Promise<AccountFingerprint | null>;
  listFingerprints(subreddit: string): Promise<AccountFingerprint[]>;
  saveAlert(alert: AlertPayload): Promise<void>;
  getAlert(alertId: string): Promise<AlertPayload | null>;
  listAlerts(subreddit: string, includeDismissed?: boolean): Promise<AlertPayload[]>;
  dismissAlert(alertId: string, dismissedBy: string): Promise<void>;
}

export const createPersistenceService = (store: KVStore): PersistenceService => {
  const getAlertList = async (subreddit: string): Promise<string[]> => {
    return (await store.getJSON<string[]>(KEY_ALERT_LIST(subreddit))) ?? [];
  };

  const setAlertList = async (subreddit: string, ids: string[]): Promise<void> => {
    await store.setJSON(KEY_ALERT_LIST(subreddit), ids);
  };

  return {
    async saveFingerprint(fp: AccountFingerprint): Promise<void> {
      await store.setJSON(KEY_FINGERPRINT(fp.userId, fp.userId), fp);
    },

    async getFingerprint(userId: string): Promise<AccountFingerprint | null> {
      return store.getJSON<AccountFingerprint>(KEY_FINGERPRINT(userId, userId));
    },

    async listFingerprints(): Promise<AccountFingerprint[]> {
      return [];
    },

    async saveAlert(alert: AlertPayload): Promise<void> {
      await store.setJSON(KEY_ALERT(alert.subreddit, alert.id), alert);
      const list = await getAlertList(alert.subreddit);
      if (!list.includes(alert.id)) {
        list.push(alert.id);
        await setAlertList(alert.subreddit, list);
      }
    },

    async getAlert(alertId: string): Promise<AlertPayload | null> {
      return store.getJSON<AlertPayload>(alertId);
    },

    async listAlerts(subreddit: string, includeDismissed = false): Promise<AlertPayload[]> {
      const ids = await getAlertList(subreddit);
      const alerts = await Promise.all(
        ids.map((id) => store.getJSON<AlertPayload>(KEY_ALERT(subreddit, id))),
      );
      const valid = alerts.filter((a): a is AlertPayload => a !== null);
      return includeDismissed ? valid : valid.filter((a) => !a.dismissed);
    },

    async dismissAlert(alertId: string, dismissedBy: string): Promise<void> {
      for (const sub of ['']) {
        const alert = await store.getJSON<AlertPayload>(KEY_ALERT(sub, alertId));
        if (alert) {
          const updated: AlertPayload = {
            ...alert,
            dismissed: true,
            dismissedAt: Date.now(),
            dismissedBy,
          };
          await store.setJSON(KEY_ALERT(alert.subreddit, alertId), updated);
          return;
        }
      }
    },
  };
};
