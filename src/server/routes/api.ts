import { Hono } from 'hono';
import { context, redis, reddit } from '@devvit/web/server';
import type { InitResponse, IncrementResponse, DecrementResponse } from '../../shared/api';
import type { SubredditConfig } from '../../shared/dto/modsignal';
import { kvStore } from '../storage/kvStore';
import { createPersistenceService } from '../services/persistenceService';
import { createSettingsService } from '../services/settings';
import { aggregateRisk } from '../scoring/riskAggregator';

type ErrorResponse = { status: 'error'; message: string };

export const api = new Hono();
const persistence = createPersistenceService(kvStore);
const settings = createSettingsService(kvStore);

api.get('/init', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>({ status: 'error', message: 'postId required' }, 400);
  }
  try {
    const [count, username] = await Promise.all([
      redis.get('count'),
      reddit.getCurrentUsername(),
    ]);
    return c.json<InitResponse>({
      type: 'init', postId, count: count ? parseInt(count) : 0, username: username ?? 'anonymous',
    });
  } catch (error) {
    console.error('[API] Init error:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Init failed' }, 400);
  }
});

api.post('/increment', async (c) => {
  const { postId } = context;
  if (!postId) return c.json<ErrorResponse>({ status: 'error', message: 'postId required' }, 400);
  const count = await redis.incrBy('count', 1);
  return c.json<IncrementResponse>({ count, postId, type: 'increment' });
});

api.post('/decrement', async (c) => {
  const { postId } = context;
  if (!postId) return c.json<ErrorResponse>({ status: 'error', message: 'postId required' }, 400);
  const count = await redis.incrBy('count', -1);
  return c.json<DecrementResponse>({ count, postId, type: 'decrement' });
});

api.get('/alerts', async (c) => {
  try {
    const subreddit = context.subredditName;
    const includeDismissed = c.req.query('includeDismissed') === 'true';
    if (!subreddit) return c.json<ErrorResponse>({ status: 'error', message: 'No subreddit' }, 400);
    const alerts = await persistence.listAlerts(subreddit, includeDismissed);
    return c.json({ alerts });
  } catch (error) {
    console.error('[API] alerts error:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Failed' }, 400);
  }
});

api.get('/alerts/:alertId', async (c) => {
  try {
    const alert = await persistence.getAlert(c.req.param('alertId'));
    if (!alert) return c.json<ErrorResponse>({ status: 'error', message: 'Not found' }, 404);
    return c.json(alert);
  } catch (error) {
    console.error('[API] alert detail error:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Failed' }, 400);
  }
});

api.post('/alerts/:alertId/dismiss', async (c) => {
  try {
    const { dismissedBy } = await c.req.json<{ dismissedBy: string }>();
    await persistence.dismissAlert(c.req.param('alertId'), dismissedBy);

    const alert = await persistence.getAlert(c.req.param('alertId'));
    if (alert) {
      const config = await settings.getOrCreateConfig(alert.subreddit);
      await settings.updateConfig(alert.subreddit, settings.autoTune(config, true));
    }

    return c.json({ status: 'dismissed' });
  } catch (error) {
    console.error('[API] dismiss error:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Failed' }, 400);
  }
});

api.get('/config', async (c) => {
  try {
    const subreddit = context.subredditName;
    if (!subreddit) return c.json<ErrorResponse>({ status: 'error', message: 'No subreddit' }, 400);
    const config = await settings.getOrCreateConfig(subreddit);
    return c.json(config);
  } catch (error) {
    console.error('[API] config error:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Failed' }, 400);
  }
});

api.post('/config', async (c) => {
  try {
    const subreddit = context.subredditName;
    if (!subreddit) return c.json<ErrorResponse>({ status: 'error', message: 'No subreddit' }, 400);
    const body = await c.req.json<Partial<SubredditConfig>>();
    const updated = await settings.updateConfig(subreddit, body);
    return c.json(updated);
  } catch (error) {
    console.error('[API] config update error:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Failed' }, 400);
  }
});

api.get('/stats', async (c) => {
  try {
    const subreddit = context.subredditName;
    if (!subreddit) return c.json<ErrorResponse>({ status: 'error', message: 'No subreddit' }, 400);
    const alerts = await persistence.listAlerts(subreddit);
    const risk = aggregateRisk(alerts);
    return c.json(risk);
  } catch (error) {
    console.error('[API] stats error:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Failed' }, 400);
  }
});
