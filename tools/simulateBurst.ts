import { extractFingerprint, cosineSimilarity } from '../src/server/scoring/fingerprint';
import { agglomerativeCluster } from '../src/server/scoring/similarity';
import { detectBurst } from '../src/server/scoring/burst';
import { computeSuspicion } from '../src/server/scoring/suspicion';
import { aggregateRisk } from '../src/server/scoring/riskAggregator';
import type { ActivityEvent } from '../src/shared/dto/modsignal';

const simulateBurstEvents = (count: number, isCoordinated: boolean): ActivityEvent[] => {
  const now = Date.now();
  const events: ActivityEvent[] = [];
  const baseTimestamp = now - 5 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    const userId = isCoordinated
      ? `coord_user_${Math.floor(i / 3)}`
      : `normal_user_${i}`;

    events.push({
      type: i % 3 === 0 ? 'post' : 'comment',
      userId,
      username: userId,
      subreddit: 'bot_pew1_dev',
      postId: `post_${i}`,
      commentId: i % 3 !== 0 ? `comment_${i}` : undefined,
      timestamp: baseTimestamp + i * 1000,
      accountCreatedAt: isCoordinated
        ? now - 2 * 24 * 60 * 60 * 1000
        : now - Math.random() * 365 * 24 * 60 * 60 * 1000,
      postKarma: isCoordinated ? Math.floor(Math.random() * 50) : Math.floor(Math.random() * 5000),
      commentKarma: isCoordinated ? Math.floor(Math.random() * 100) : Math.floor(Math.random() * 10000),
      isNewAccount: isCoordinated,
      hasVerifiedEmail: !isCoordinated,
      isMod: false,
    });
  }

  return events;
};

const main = async () => {
  console.log('=== ModSignal Burst Simulation ===\n');

  console.log('Generating normal activity (50 events, random users)...');
  const normalEvents = simulateBurstEvents(50, false);
  const allEvents = [...normalEvents];

  console.log('Generating coordinated burst (30 events, few users)...');
  const burstEvents = simulateBurstEvents(30, true);
  allEvents.push(...burstEvents);

  console.log(`Total events: ${allEvents.length}\n`);

  const baselineCounts = [10, 12, 8, 15, 9, 11, 7, 13, 10, 14, 8, 12];
  const burstResult = detectBurst(allEvents, baselineCounts, 3);
  console.log('=== Burst Detection ===');
  console.log(`Is burst: ${burstResult.isBurst}`);
  console.log(`Z-score: ${burstResult.zScore.toFixed(2)}`);
  console.log(`Event count: ${burstResult.eventCount}`);
  console.log(`New account ratio: ${(burstResult.newAccountRatio * 100).toFixed(1)}%`);
  console.log(`Reason codes: ${burstResult.reasonCodes.join(', ')}\n`);

  const userIds = [...new Set(allEvents.map((e) => e.userId))];
  const now = Date.now();
  const fingerprints = userIds
    .map((id) => extractFingerprint(allEvents, id, now))
    .filter((fp): fp is NonNullable<typeof fp> => fp !== undefined);

  console.log(`=== Fingerprints (${fingerprints.length} users) ===`);
  for (const fp of fingerprints.slice(0, 5)) {
    console.log(`  u/${fp.username}: age=${fp.accountAgeDays.toFixed(1)}d, karma=${fp.karmaScore}, subs=${fp.uniqueSubreddits}, vector=[${fp.featureVector.map((v) => v.toFixed(2)).join(', ')}]`);
  }

  if (fingerprints.length >= 2) {
    console.log(`\nSample cosine similarity:`);
    const sim = cosineSimilarity(fingerprints[0]!.featureVector, fingerprints[1]!.featureVector);
    console.log(`  ${fingerprints[0]!.username} <-> ${fingerprints[1]!.username}: ${sim.toFixed(3)}`);
  }

  console.log(`\n=== Clustering ===`);
  const clusters = agglomerativeCluster(fingerprints, 0.75);
  console.log(`Clusters found: ${clusters.length}`);
  for (const c of clusters) {
    if (c.memberIds.length > 1) {
      console.log(`  Cluster (${c.memberIds.length} members): ${c.memberIds.join(', ')}`);
    }
  }

  console.log(`\n=== Suspicion Scoring ===`);
  const suspicion = computeSuspicion(burstResult, fingerprints, clusters);
  console.log(`Score: ${suspicion.score}/100`);
  console.log(`Severity: ${suspicion.severity}`);
  console.log(`Type: ${suspicion.alertType}`);
  console.log(`Reasons: ${suspicion.reasonCodes.join(', ')}`);

  console.log(`\n=== Risk Aggregation ===`);
  const risk = aggregateRisk([{
    id: 'test_alert',
    subreddit: 'bot_pew1_dev',
    type: suspicion.alertType,
    severity: suspicion.severity,
    reasonCodes: suspicion.reasonCodes,
    affectedUsers: fingerprints,
    relatedPosts: [],
    relatedComments: [],
    score: suspicion.score,
    timestamp: Date.now(),
    dismissed: false,
  }]);
  console.log(`Recommended action: ${risk?.recommendedAction}`);
  console.log(`Unique users flagged: ${risk?.uniqueUsersFlagged}`);

  console.log('\n=== Simulation Complete ===');
};

main().catch(console.error);
