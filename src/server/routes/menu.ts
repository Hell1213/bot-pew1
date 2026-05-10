import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';
import { context } from '@devvit/web/server';
import { createPost } from '../core/post';
import { kvStore } from '../storage/kvStore';
import { createPersistenceService } from '../services/persistenceService';
import { createSettingsService } from '../services/settings';

export const menu = new Hono();
const persistence = createPersistenceService(kvStore);
const settings = createSettingsService(kvStore);

menu.post('/post-create', async (c) => {
  try {
    const post = await createPost();
    return c.json<UiResponse>({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    }, 200);
  } catch (error) {
    console.error('[Menu] create post error:', error);
    return c.json<UiResponse>({ showToast: 'Failed to create post' }, 400);
  }
});

menu.post('/dismiss-alert', async (c) => {
  try {
    const { alertId } = await c.req.json<{ alertId: string }>();
    const username = await context.username;
    await persistence.dismissAlert(alertId, username ?? 'unknown');

    const alert = await persistence.getAlert(alertId);
    if (alert) {
      const config = await settings.getOrCreateConfig(alert.subreddit);
      await settings.updateConfig(alert.subreddit, settings.autoTune(config, true));
    }

    return c.json<UiResponse>({ showToast: 'Alert dismissed' }, 200);
  } catch (error) {
    console.error('[Menu] dismiss error:', error);
    return c.json<UiResponse>({ showToast: 'Failed to dismiss' }, 400);
  }
});
