import { context } from '@devvit/web/server';
import type { ScoringOrchestrator } from '../services/scoringOrchestrator';
import type { AlertDispatcher } from '../services/alertDispatcher';
import type { WindowManager } from '../services/windowManager';

export const handleSchedulerTick = async (
  orchestrator: ScoringOrchestrator,
  dispatcher: AlertDispatcher,
  wm: WindowManager,
): Promise<void> => {
  try {
    const subreddit = context.subredditName;
    if (!subreddit) return;

    console.log('[Scheduler] Running scoring cycle for', subreddit);
    const alerts = await orchestrator.runScoringCycle(subreddit);

    for (const alert of alerts) {
      await dispatcher.dispatchAlert(alert);
    }

    await wm.pruneOldBuckets(subreddit, 60);
    console.log('[Scheduler] Cycle complete, alerts:', alerts.length);
  } catch (error) {
    console.error('[Scheduler]', error);
  }
};
