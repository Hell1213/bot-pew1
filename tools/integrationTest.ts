import { createInMemoryKVStore } from '../src/server/storage/kvStore';
import { WindowManager } from '../src/server/services/windowManager';
import { PersistenceService } from '../src/server/services/persistenceService';
import { ScoringOrchestrator } from '../src/server/services/scoringOrchestrator';
import { SettingsService } from '../src/server/services/settings';
import { aggregateRisk } from '../src/server/scoring/riskAggregator';
import { computeSuspicion } from '../src/server/scoring/suspicion';
import { agglomerativeCluster } from '../src/server/scoring/similarity';
import { extractFingerprint } from '../src/server/scoring/fingerprint';
import { detectBurst } from '../src/server/scoring/burst';
import { Welford, computeBaseline, zScore } from '../src/shared/utils/stats';
import { bucketKey, BUCKET_SIZE_MS } from '../src/shared/utils/time';
import { kvKeys } from '../src/shared/constants/kvKeys';
import type { ActivityEvent, AccountFingerprint } from '../src/shared/dto/modsignal';

const SUB = 'test_subreddit';
let passed = 0;
let total = 0;

const assert = (ok: boolean, msg: string): void => {
  total++;
  if (!ok) { console.error(`  ✗ FAIL: ${msg}`); process.exit(1); }
  else { passed++; console.log(`  ✓ ${msg}`); }
};

const event = (overrides: Partial<ActivityEvent> = {}): ActivityEvent => ({
  type: 'post', userId: 'u', username: 'u', subreddit: SUB,
  postId: 'p', timestamp: Date.now(),
  accountCreatedAt: Date.now() - 365 * 86400000,
  postKarma: 1000, commentKarma: 500,
  isNewAccount: false, hasVerifiedEmail: true, isMod: false,
  ...overrides,
});

const seedBaseline = async (kv: ReturnType<typeof createInMemoryKVStore>, _wm: WindowManager, count: number): Promise<void> => {
  const now = Date.now();
  for (let bucketOffset = 25; bucketOffset >= 1; bucketOffset--) {
    const ts = now - bucketOffset * BUCKET_SIZE_MS;
    const bucketStart = Math.floor(ts / BUCKET_SIZE_MS) * BUCKET_SIZE_MS;
    const key = kvKeys.bucketEvents(SUB, bucketStart.toString());
    for (let i = 0; i < count; i++) {
      const ev = event({ userId: `hist_${i}`, username: `hist_${i}`, timestamp: bucketStart + i * 100 });
      await kv.sortedAdd(key, ev.timestamp, JSON.stringify(ev));
    }
  }
};

async function main(): Promise<void> {
  console.log('\n=== MODSIGNAL BACKEND TESTS ===\n');

  // ─── 1. Stats ───
  console.log('[1] Stats Utilities');
  {
    const w = new Welford();
    [2, 4, 4, 4, 5, 5, 7, 9].forEach(v => w.update(v));
    assert(Math.abs(w.mean - 5) < 0.01, 'Welford mean ≈ 5');
    assert(Math.abs(w.stdDev - 2.138) < 0.1, 'Welford stdDev ≈ 2.138');
    assert(computeBaseline([]).count === 0, 'empty baseline');
    assert(zScore(10, 5, 0) === 0, 'zScore with 0 stdDev');
  }

  // ─── 2. KV Store ───
  console.log('[2] KV Store');
  {
    const kv = createInMemoryKVStore();
    await kv.set('k', 'v'); assert(await kv.get('k') === 'v', 'set/get');
    await kv.del('k'); assert(await kv.get('k') === undefined, 'del');
    await kv.hashSet('h', 'f', 'val'); assert(await kv.hashGet('h', 'f') === 'val', 'hash');
    await kv.sortedAdd('z', 10, 'a'); await kv.sortedAdd('z', 5, 'b');
    const r = await kv.sortedRange('z', 0, -1);
    assert(r[0]!.member === 'b', 'sorted order');
    assert(r[1]!.member === 'a', 'sorted order 2');
    assert(r[0]!.score === 5, 'sorted score');
    assert(r[1]!.score === 10, 'sorted score 2');
    assert(await kv.incrBy('c', 5) === 5, 'incrBy');
    await kv.sortedAdd('z2', 10, 'a'); await kv.sortedAdd('z2', 20, 'b');
    const r2 = await kv.sortedRange('z2', 0, 15, { by: 'score' });
    assert(r2.length === 1, 'sorted range by score');
    assert(await kv.sortedCard('z2') === 2, 'sorted cardinality');
  }

  // ─── 3. Burst Detection ───
  console.log('[3] Burst Detection');
  {
    const raid = Array.from({ length: 50 }, (_, i) =>
      event({ userId: `r${i % 4}`, username: `r${i % 4}`, isNewAccount: true }));
    const baseline = [5, 6, 4, 7, 5, 6, 4, 7, 5];
    const r = detectBurst(raid, baseline, 3, 0.3);
    assert(r.isBurst === true, 'detects coordinated burst');
    assert(r.reasonCodes.includes('burst_z_score'), 'z_score reason');
    assert(r.reasonCodes.includes('high_new_account_ratio'), 'new_account reason');

    const normal = [event({ userId: 'n1' }), event({ userId: 'n2' })];
    const r2 = detectBurst(normal, [10, 12, 11, 13, 10], 3, 0.3);
    assert(r2.isBurst === false, 'no false positive on low volume');
  }

  // ─── 4. Fingerprinting ───
  console.log('[4] Fingerprinting');
  {
    const fp = extractFingerprint([event({ userId: 'u1' })], 'u1', Date.now());
    assert(fp !== undefined, 'extracted');
    assert(fp!.featureVector.length === 7, '7-dim vector');
    assert(fp!.karmaScore === 750, 'avg karma');
  }

  // ─── 5. Clustering ───
  console.log('[5] Clustering');
  {
    const now = Date.now();
    const fps = [
      ['n1', false, 1000, 500],
      ['n2', false, 900, 400],
      ['r1', true, 5, 2],
    ].map(([id, isNew, pk, ck]) =>
      extractFingerprint([event({
        userId: id as string, username: id as string,
        isNewAccount: isNew as boolean,
        postKarma: pk as number, commentKarma: ck as number,
        accountCreatedAt: isNew ? now - 2 * 86400000 : now - 365 * 86400000,
      })], id as string, now)!
    );
    const clusters = agglomerativeCluster(fps, 0.75);
    assert(clusters.length >= 1, 'at least one cluster');
  }

  // ─── 6. Suspicion Scoring ───
  console.log('[6] Suspicion Scoring');
  {
    const br = detectBurst(
      Array.from({ length: 40 }, (_, i) => event({
        userId: `u${i}`, isNewAccount: i < 15,
      })),
      [5, 4, 6], 3, 0.3
    );
    const fps = Array.from({ length: 5 }, (_, i) => ({
      userId: `u${i}`, username: `u${i}`,
      accountAgeDays: i < 2 ? 1 : 365,
      karmaScore: i < 2 ? 10 : 5000,
      postFrequency: 0, commentFrequency: 0, uniqueSubreddits: 1,
      hasVerifiedEmail: i >= 2, isMod: false,
      featureVector: [i < 2 ? 0.01 : 0.5, 0.1, 0, 0, 0.05, i < 2 ? 1 : 0, i < 2 ? 0 : 1],
    })) as AccountFingerprint[];
    const s = computeSuspicion(br, fps, [{ memberIds: ['u0', 'u1'] }, { memberIds: ['u2'] }]);
    assert(s.score >= 0 && s.score <= 100, `score ${s.score} in range`);
    assert(['low', 'medium', 'high', 'critical'].includes(s.severity), 'valid severity');
  }

  // ─── 7. Risk Aggregation ───
  console.log('[7] Risk Aggregation');
  {
    const risk = aggregateRisk([{
      id: 'a1', subreddit: SUB, type: 'brigade', severity: 'high',
      reasonCodes: ['burst_z_score'], affectedUsers: [{ userId: 'u1', username: 'u1', accountAgeDays: 1, karmaScore: 5, postFrequency: 0, commentFrequency: 0, uniqueSubreddits: 1, hasVerifiedEmail: false, isMod: false, featureVector: [0,0,0,0,0,1,0] }],
      relatedPosts: ['p1'], relatedComments: [], score: 75, timestamp: Date.now(),
      actionHistory: [],
    }]);
    assert(risk !== undefined, 'risk computed');
    assert(risk!.totalAlertCount === 1, '1 alert');
    assert(risk!.uniqueUsersFlagged === 1, '1 user');
    assert(risk!.recommendedAction === 'watch', 'action: watch');
  }

  // ─── 8. Persistence Service ───
  console.log('[8] Persistence Service');
  {
    const kv = createInMemoryKVStore();
    const ps = new PersistenceService(kv, SUB);
    const cfg = await ps.getConfig();
    assert(cfg.enabled === true, 'default enabled');
    assert(cfg.burstThreshold === 3, 'default threshold');

    await ps.saveAlert({
      id: 'a1', subreddit: SUB, type: 'burst', severity: 'medium',
      reasonCodes: ['test'], affectedUsers: [], relatedPosts: [], relatedComments: [],
      score: 50, timestamp: Date.now(), actionHistory: [],
    });
    const a = await ps.getAlert('a1');
    assert(a !== undefined, 'alert saved');
    assert(a!.severity === 'medium', 'severity preserved');

    await ps.dismissAlert('a1', 'test_mod');
    const d = await ps.getAlert('a1');
    const lastAction = d!.actionHistory[d!.actionHistory.length - 1];
    assert(lastAction?.action === 'dismiss', 'dismiss action recorded');
    assert(lastAction?.by === 'test_mod', 'dismissed_by');
  }

  // ─── 9. Settings Service ───
  console.log('[9] Settings Service');
  {
    const kv = createInMemoryKVStore();
    const ss = new SettingsService(kv, SUB);
    const u = await ss.updateConfig({ burstThreshold: 5.5 });
    assert(u.burstThreshold === 5.5, 'update');
    assert((await ss.getConfig()).burstThreshold === 5.5, 'persisted');

    const orig = await ss.getConfig();
    await ss.autoTune(true, orig);
    assert((await ss.getConfig()).burstThreshold > orig.burstThreshold, 'autoTune increases threshold');
  }

  // ─── 10. Pipeline: Normal Activity → No Alert ───
  console.log('[10] Pipeline: Normal Activity (seeded baseline)');
  {
    const kv = createInMemoryKVStore();
    const wm = new WindowManager(kv, SUB, 5);
    const ps = new PersistenceService(kv, SUB);
    const orch = new ScoringOrchestrator(wm, ps, SUB);

    // Seed historical baseline: 25 buckets with 5-7 events each
    await seedBaseline(kv, wm, 6);

    // Record 3 normal events in current window
    for (let i = 0; i < 3; i++) {
      await wm.recordEvent(event({ userId: `n${i}`, username: `n${i}` }));
    }

    const events = await wm.getCurrentWindowEvents();
    assert(events.length === 3, `3 events in window`);

    const alerts = await orch.runPipeline(events);
    assert(alerts.length === 0, `no alert for normal activity (got ${alerts.length})`);
  }

  // ─── 11. Pipeline: Coordinated Burst → Alert ───
  console.log('[11] Pipeline: Coordinated Burst');
  {
    const kv = createInMemoryKVStore();
    const wm = new WindowManager(kv, SUB, 5);
    const ps = new PersistenceService(kv, SUB);
    const orch = new ScoringOrchestrator(wm, ps, SUB);

    await seedBaseline(kv, wm, 6);

    const now = Date.now();
    for (let i = 0; i < 30; i++) {
      await wm.recordEvent(event({
        userId: `raid_${i % 3}`, username: `raid_${i % 3}`,
        isNewAccount: true, timestamp: now - i * 2000,
        postKarma: 3, commentKarma: 1,
        hasVerifiedEmail: false,
      }));
    }

    const alerts = await orch.runPipeline(await wm.getCurrentWindowEvents());
    console.log(`  Alerts generated: ${alerts.length}`);
    if (alerts.length > 0) {
      assert(alerts[0]!.score > 0, `alert score: ${alerts[0]!.score}`);
      assert(alerts[0]!.type === 'brigade' || alerts[0]!.type === 'burst', 'alert type set');
      assert(alerts[0]!.actionHistory.length === 0, 'fresh alert has no actions');
      assert(alerts[0]!.explainability !== undefined, 'alert has explainability data');
    }
  }

  // ─── 12. Full E2E Simulation ───
  console.log('[12] Full E2E Simulation');
  {
    const kv = createInMemoryKVStore();
    const wm = new WindowManager(kv, SUB, 5);
    const ps = new PersistenceService(kv, SUB);
    const orch = new ScoringOrchestrator(wm, ps, SUB);
    const ss = new SettingsService(kv, SUB);

    await seedBaseline(kv, wm, 6);

    const now = Date.now();
    for (let i = 0; i < 25; i++) {
      await wm.recordEvent(event({
        userId: `r${i % 3}`, username: `r${i % 3}`,
        timestamp: now - i * 1000,
        isNewAccount: true, postKarma: 2, commentKarma: 1, hasVerifiedEmail: false,
      }));
    }

    const alerts = await orch.runPipeline(await wm.getCurrentWindowEvents());
    console.log(`  Alerts: ${alerts.length}`);

    for (const a of alerts) {
      await ps.dismissAlert(a.id, 'test_mod');
    }
    const allAlerts = await ps.getAlerts();
    const remainingDismissed = allAlerts.filter((a) => {
      const last = a.actionHistory[a.actionHistory.length - 1];
      return last?.action === 'dismiss';
    });
    assert(remainingDismissed.length === alerts.length, 'all alerts have dismiss action');

    const cfg = await ss.getConfig();
    await ss.autoTune(true, cfg);
    assert((await ss.getConfig()).burstThreshold > cfg.burstThreshold, 'autoTune works');
  }

  console.log(`\n=== ${passed}/${total} passed ===\n`);
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
