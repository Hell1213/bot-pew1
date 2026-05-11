import { Hono } from 'hono';
import { context } from '@devvit/web/server';
import type { SubredditConfig } from '../../shared/dto/modsignal';
import { createKVStore } from '../storage/kvStore';
import { PersistenceService } from '../services/persistenceService';
import { SettingsService } from '../services/settings';
import { WindowManager } from '../services/windowManager';
import { ScoringOrchestrator } from '../services/scoringOrchestrator';

export const api = new Hono();

const getSubreddit = (): string | undefined => context.subredditName;
const getStore = () => {
  const subreddit = getSubreddit();
  if (!subreddit) return undefined;
  const kv = createKVStore();
  return {
    persistence: new PersistenceService(kv, subreddit),
    settings: new SettingsService(kv, subreddit),
  };
};

api.get('/alerts', async (c) => {
  const store = getStore();
  if (!store) return c.json({ error: 'No subreddit' }, 400);
  const alerts = await store.persistence.getAlerts();
  return c.json({ alerts });
});

api.post('/alerts/:id/action', async (c) => {
  const store = getStore();
  if (!store) return c.json({ error: 'No subreddit' }, 400);
  const alertId = c.req.param('id');
  const { action, by } = await c.req.json<{ action: string; by: string }>();
  const validActions = ['acknowledge', 'dismiss', 'monitor', 'investigate', 'escalate'];
  if (!validActions.includes(action)) {
    return c.json({ error: `Invalid action. Must be one of: ${validActions.join(', ')}` }, 400);
  }
  const updated = await store.persistence.addAction(alertId, action as 'acknowledge' | 'dismiss' | 'monitor' | 'investigate' | 'escalate', by ?? 'mod');
  if (!updated) return c.json({ error: 'Alert not found' }, 404);
  return c.json({ alert: updated });
});

api.post('/alerts/:id/dismiss', async (c) => {
  const store = getStore();
  if (!store) return c.json({ error: 'No subreddit' }, 400);
  const alertId = c.req.param('id');
  const { dismissedBy } = await c.req.json<{ dismissedBy: string }>();
  await store.persistence.dismissAlert(alertId, dismissedBy ?? 'mod');
  const alerts = await store.persistence.getAlerts();
  return c.json({ alerts });
});

api.get('/alerts/:id', async (c) => {
  const store = getStore();
  if (!store) return c.json({ error: 'No subreddit' }, 400);
  const alert = await store.persistence.getAlert(c.req.param('id'));
  if (!alert) return c.json({ error: 'Alert not found' }, 404);
  return c.json({ alert });
});

api.get('/config', async (c) => {
  const store = getStore();
  if (!store) return c.json({ error: 'No subreddit' }, 400);
  const config = await store.settings.getConfig();
  return c.json(config);
});

api.post('/config', async (c) => {
  const store = getStore();
  if (!store) return c.json({ error: 'No subreddit' }, 400);
  const updates = await c.req.json<Partial<SubredditConfig>>();
  const config = await store.settings.updateConfig(updates);
  return c.json(config);
});

api.get('/stats', async (c) => {
  const store = getStore();
  if (!store) return c.json({ error: 'No subreddit' }, 400);
  const stats = await store.persistence.getStats();
  return c.json(stats);
});

api.post('/demo', async (c) => {
  const subreddit = getSubreddit();
  if (!subreddit) return c.json({ error: 'No subreddit' }, 400);
  const { scenario } = await c.req.json<{ scenario: string }>();
  const kv = createKVStore();
  const wm = new WindowManager(kv, subreddit, 5);
  const persistence = new PersistenceService(kv, subreddit);

  if (scenario === 'reset') {
    await persistence.clearAlerts();
    return c.json({ status: 'reset', message: 'All alerts cleared' });
  }

  const now = Date.now();
  const eventCount = scenario === 'spam_wave' ? 80 : scenario === 'coordinated_raid' ? 40 : scenario === 'suspicious_swarm' ? 60 : 10;
  const isCoordinated = scenario === 'coordinated_raid' || scenario === 'suspicious_swarm';
  const userIdCount = scenario === 'coordinated_raid' ? 4 : scenario === 'suspicious_swarm' ? 15 : 20;

  for (let i = 0; i < eventCount; i++) {
    const uid = isCoordinated ? `demo_u_${i % userIdCount}` : `demo_normal_${i}`;
    await wm.recordEvent({
      type: i % 3 === 0 ? 'post' : 'comment',
      userId: uid,
      username: uid,
      subreddit,
      postId: `demo_post_${i}`,
      commentId: i % 3 !== 0 ? `demo_comment_${i}` : undefined,
      timestamp: now - i * 2000,
      accountCreatedAt: isCoordinated ? now - 2 * 86400000 : now - Math.random() * 365 * 86400000,
      postKarma: isCoordinated ? 5 : Math.floor(Math.random() * 5000),
      commentKarma: isCoordinated ? 3 : Math.floor(Math.random() * 10000),
      isNewAccount: isCoordinated,
      hasVerifiedEmail: !isCoordinated,
      isMod: false,
    });
  }

  const events = await wm.getCurrentWindowEvents();
  const orchestrator = new ScoringOrchestrator(wm, persistence, subreddit);
  const alerts = await orchestrator.runPipeline(events);

  return c.json({ status: 'simulated', scenario, eventsGenerated: eventCount, alertsCreated: alerts.length });
});
