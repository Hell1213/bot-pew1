import { Hono } from 'hono';
import type { TriggerResponse, OnAppInstallRequest } from '@devvit/web/shared';
import type { TaskRequest, TaskResponse } from '@devvit/web/server';
import { context, reddit } from '@devvit/web/server';
import { createKVStore } from '../storage/kvStore';
import { WindowManager } from '../services/windowManager';
import { PersistenceService } from '../services/persistenceService';
import { ScoringOrchestrator } from '../services/scoringOrchestrator';
import { AlertDispatcher } from '../services/alertDispatcher';
import type { ActivityEvent } from '../../shared/dto/modsignal';

export const triggers = new Hono();

const runScoring = async (subreddit: string): Promise<void> => {
  const kv = createKVStore();
  const windowManager = new WindowManager(kv, subreddit);
  const persistence = new PersistenceService(kv, subreddit);
  const orchestrator = new ScoringOrchestrator(windowManager, persistence, subreddit);
  const dispatcher = new AlertDispatcher();

  const events = await windowManager.getCurrentWindowEvents();
  const alerts = await orchestrator.runPipeline(events);

  for (const alert of alerts) {
    await dispatcher.dispatch(alert);
  }
};

const toActivityEvent = (
  type: 'post' | 'comment',
  postId: string,
  username: string,
): ActivityEvent => {
  const subreddit = context.subredditName ?? 'unknown';

  return {
    type,
    userId: username,
    username,
    subreddit,
    postId,
    commentId: type === 'comment' ? postId : undefined,
    timestamp: Date.now(),
    accountCreatedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    postKarma: 0,
    commentKarma: 0,
    isNewAccount: false,
    hasVerifiedEmail: true,
    isMod: false,
  };
};

triggers.post('/on-app-install', async (c) => {
  try {
    await c.req.json<OnAppInstallRequest>();
    const post = await reddit.submitCustomPost({
      title: 'ModSignal Dashboard',
      subredditName: context.subredditName,
    });

    return c.json<TriggerResponse>({
      status: 'success',
      message: `ModSignal installed. Post created: ${post.id}`,
    }, 200);
  } catch (error) {
    console.error('on-app-install error:', error);
    return c.json<TriggerResponse>({
      status: 'error',
      message: 'Failed to install ModSignal',
    }, 400);
  }
});

triggers.post('/on-post-create', async (c) => {
  try {
    const subreddit = context.subredditName;
    if (!subreddit) {
      return c.json({ status: 'error', message: 'No subreddit' }, 400);
    }

    const username = await reddit.getCurrentUsername();
    const event = toActivityEvent('post', context.postId ?? '', username ?? 'unknown');
    const kv = createKVStore();
    const wm = new WindowManager(kv, subreddit);
    await wm.recordEvent(event);

    return c.json({ status: 'success', message: 'Post recorded' }, 200);
  } catch (error) {
    console.error('on-post-create error:', error);
    return c.json({ status: 'error', message: 'Failed' }, 400);
  }
});

triggers.post('/on-comment-create', async (c) => {
  try {
    const subreddit = context.subredditName;
    if (!subreddit) {
      return c.json({ status: 'error', message: 'No subreddit' }, 400);
    }

    const username = await reddit.getCurrentUsername();
    const event = toActivityEvent('comment', context.postId ?? '', username ?? 'unknown');
    const kv = createKVStore();
    const wm = new WindowManager(kv, subreddit);
    await wm.recordEvent(event);

    return c.json({ status: 'success', message: 'Comment recorded' }, 200);
  } catch (error) {
    console.error('on-comment-create error:', error);
    return c.json({ status: 'error', message: 'Failed' }, 400);
  }
});

triggers.post('/scheduler', async (c) => {
  try {
    await c.req.json<TaskRequest>();
    const subreddit = context.subredditName;
    if (!subreddit) {
      return c.json<TaskResponse>({ status: 'error', message: 'No subreddit' }, 400);
    }

    await runScoring(subreddit);

    return c.json<TaskResponse>({ status: 'success' }, 200);
  } catch (error) {
    console.error('scheduler error:', error);
    return c.json<TaskResponse>({ status: 'error' }, 400);
  }
});
