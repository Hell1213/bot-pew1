import { InMemoryKVStore } from '../src/server/storage/kvStore.js';
import { createWindowManager } from '../src/server/services/windowManager.js';
import type { ActivityEvent } from '../src/shared/dto/modsignal.js';

interface SimulationConfig {
  subreddit: string;
  numNewAccounts: number;
  numExistingAccounts: number;
  numPosts: number;
  numComments: number;
  burstDurationMinutes: number;
}

function parseArgs(): SimulationConfig {
  const args = process.argv.slice(2);
  const get = (flag: string, defaultVal: number): number => {
    const idx = args.indexOf(flag);
    return idx >= 0 ? parseInt(args[idx + 1] ?? String(defaultVal)) : defaultVal;
  };

  return {
    subreddit: args[args.indexOf('--subreddit') + 1] ?? 'bot_pew1_dev',
    numNewAccounts: get('--new-accounts', 5),
    numExistingAccounts: get('--existing', 2),
    numPosts: get('--posts', 3),
    numComments: get('--comments', 5),
    burstDurationMinutes: get('--duration', 2),
  };
}

async function simulateBurst(config: SimulationConfig): Promise<void> {
  console.log('=== ModSignal Burst Simulator ===');
  console.log('Config:', JSON.stringify(config, null, 2));

  const store = new InMemoryKVStore();
  const wm = createWindowManager(store);
  const now = Date.now();
  const burstStart = now - config.burstDurationMinutes * 60 * 1000;
  const events: ActivityEvent[] = [];

  const userIds: string[] = [];

  for (let i = 0; i < config.numNewAccounts; i++) {
    const uid = `new_user_${i}`;
    userIds.push(uid);
    const createdAt = now - 1000 * 60 * 60 * 2;
    const ts = burstStart + Math.random() * (now - burstStart);

    for (let p = 0; p < config.numPosts; p++) {
      events.push({
        type: 'post',
        userId: uid,
        username: uid,
        subreddit: config.subreddit,
        postId: `sim_post_${uid}_${p}`,
        timestamp: ts + p * 1000,
        accountCreatedAt: createdAt,
        postKarma: 1,
        commentKarma: 0,
        isNewAccount: true,
      });
    }

    for (let c = 0; c < config.numComments; c++) {
      events.push({
        type: 'comment',
        userId: uid,
        username: uid,
        subreddit: config.subreddit,
        postId: `sim_post_${uid}_0`,
        commentId: `sim_comment_${uid}_${c}`,
        timestamp: ts + c * 1000,
        accountCreatedAt: createdAt,
        postKarma: 0,
        commentKarma: 1,
        isNewAccount: true,
      });
    }
  }

  for (let i = 0; i < config.numExistingAccounts; i++) {
    const uid = `existing_user_${i}`;
    userIds.push(uid);
    const createdAt = now - 1000 * 60 * 60 * 24 * 365;
    const ts = burstStart + Math.random() * (now - burstStart);

    events.push({
      type: 'post',
      userId: uid,
      username: uid,
      subreddit: config.subreddit,
      postId: `sim_post_${uid}_0`,
      timestamp: ts,
      accountCreatedAt: createdAt,
      postKarma: 500,
      commentKarma: 1000,
      isNewAccount: false,
    });
  }

  for (const event of events) {
    await wm.recordEvent(event);
  }

  console.log(`Injected ${events.length} events for ${userIds.length} users`);
  console.log(`  New accounts: ${config.numNewAccounts}`);
  console.log(`  Existing accounts: ${config.numExistingAccounts}`);

  const activeEvents = await wm.getActiveWindowEvents(config.subreddit);
  console.log(`  Active window events: ${activeEvents.length}`);

  const baseline = await wm.computeBaseline(config.subreddit, 30);
  console.log(`  Baseline: mean=${baseline.mean.toFixed(2)}, stddev=${baseline.stddev.toFixed(2)}`);
}

const config = parseArgs();
simulateBurst(config).catch(console.error);
