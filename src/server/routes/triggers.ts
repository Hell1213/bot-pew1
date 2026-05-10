import { Hono } from 'hono';
import type { OnAppInstallRequest, OnPostCreateRequest, OnCommentCreateRequest, TriggerResponse } from '@devvit/web/shared';
import { context } from '@devvit/web/server';
import { createPost } from '../core/post';
import { kvStore } from '../storage/kvStore';
import { createWindowManager } from '../services/windowManager';
import { createPersistenceService } from '../services/persistenceService';
import { createSettingsService } from '../services/settings';
import { createScoringOrchestrator } from '../services/scoringOrchestrator';
import { createAlertDispatcher } from '../services/alertDispatcher';
import { handlePostCreate } from '../triggers/onPostCreate';
import { handleCommentCreate } from '../triggers/onCommentCreate';
import { handleSchedulerTick } from '../triggers/scheduler';

export const triggers = new Hono();
const wm = createWindowManager(kvStore);
const persistence = createPersistenceService(kvStore);
const settings = createSettingsService(kvStore);
const orchestrator = createScoringOrchestrator(wm, persistence, settings);
const dispatcher = createAlertDispatcher();

triggers.post('/on-app-install', async (c) => {
  try {
    const post = await createPost();
    const input = await c.req.json<OnAppInstallRequest>();
    return c.json<TriggerResponse>({
      status: 'success',
      message: `Post created in ${context.subredditName} with id ${post.id} (trigger: ${input.type})`,
    }, 200);
  } catch (error) {
    console.error('[Trigger] onAppInstall', error);
    return c.json<TriggerResponse>({ status: 'error', message: 'Failed' }, 400);
  }
});

triggers.post('/on-post-create', async (c) => {
  try {
    const input = await c.req.json<OnPostCreateRequest>();
    await handlePostCreate(input, wm);
    return c.json<TriggerResponse>({ status: 'success', message: 'Event recorded' }, 200);
  } catch (error) {
    console.error('[Trigger] onPostCreate', error);
    return c.json<TriggerResponse>({ status: 'error', message: 'Failed' }, 400);
  }
});

triggers.post('/on-comment-create', async (c) => {
  try {
    const input = await c.req.json<OnCommentCreateRequest>();
    await handleCommentCreate(input, wm);
    return c.json<TriggerResponse>({ status: 'success', message: 'Event recorded' }, 200);
  } catch (error) {
    console.error('[Trigger] onCommentCreate', error);
    return c.json<TriggerResponse>({ status: 'error', message: 'Failed' }, 400);
  }
});

triggers.post('/on-cron-tick', async (c) => {
  try {
    await handleSchedulerTick(orchestrator, dispatcher, wm);
    return c.json<TriggerResponse>({ status: 'success', message: 'Cycle complete' }, 200);
  } catch (error) {
    console.error('[Trigger] onCronTick', error);
    return c.json<TriggerResponse>({ status: 'error', message: 'Failed' }, 400);
  }
});
