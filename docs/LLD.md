# Low-Level Design

## Module: `src/shared/dto/modsignal.ts`

Core types shared between server and client:
- `ActivityEvent`, `AccountFingerprint`, `BurstResult`
- `AlertPayload`, `SubredditConfig`, `SubredditRisk`
- Enums: `AlertType`, `Severity`, `RecommendedAction`

All types use `readonly` modifiers. No runtime dependencies.

## Module: `src/shared/utils/stats.ts`

- `zScore(value, mean, stddev)`: Computes standard score. Returns 0 if stddev is 0.
- `class Welford`: Online algorithm for mean/variance/stddev.
  - `update(value)`: O(1) per sample.
  - Getters: `mean`, `variance`, `stddev`, `n`.

## Module: `src/shared/utils/time.ts`

- `now()`: Returns `Date.now()`.
- `minutesAgo(n)`: Returns epoch ms for N minutes ago.
- `bucketKey(timestamp, windowMinutes)`: Rounds timestamp down to nearest window boundary.

## Module: `src/shared/constants/kvKeys.ts`

Key factory functions:
- `KEY_FINGERPRINT(sub, userId)` → `fp:{sub}:{userId}`
- `KEY_ALERT(sub, id)` → `alert:{sub}:{id}`
- `KEY_ALERT_LIST(sub)` → `alert-list:{sub}`
- `KEY_CONFIG(sub)` → `config:{sub}`
- `KEY_WINDOW(sub, bucket)` → `window:{sub}:{bucket}`

## Module: `src/server/storage/kvStore.ts`

- Interface `KVStore`: `getJSON<T>`, `setJSON<T>`, `delete`
- `kvStore`: Implementation using Devvit `redis` from `@devvit/web/server`
- `InMemoryKVStore`: Mock implementation using `Map<string, string>`

## Module: `src/server/services/windowManager.ts`

Interface `WindowManager`:
- `recordEvent(event)`: Stores in current 5-min bucket
- `getWindow(sub, bucketTs)`: Gets events for a specific bucket
- `getActiveWindowEvents(sub)`: Current + previous bucket merged
- `computeBaseline(sub, lookbackMin)`: Welford across historic buckets
- `pruneOldBuckets(sub, retentionMin)`: Deletes buckets before cutoff

Implementation: `createWindowManager(kvStore)`.

## Module: `src/server/scoring/burst.ts`

`detectBurst(events, mean, stddev, threshold?)`: BurstResult
- Pure function. Computes z-score, new account ratio.
- Reason codes: `high_z_score`, `new_account_surge`, `volume_spike`.

## Module: `src/server/scoring/fingerprint.ts`

- `buildFeatureVector(events)`: 7-dim normalised vector
- `computeAccountFingerprint(userId, events)`: Aggregates events

## Module: `src/server/scoring/similarity.ts`

- `computeCosineSimilarity(a, b)`: Dot product / magnitude
- `computeJaccardSimilarity(setA, setB)`: Intersection / union
- `findClusters(users, threshold)`: Agglomerative clustering

## Module: `src/server/scoring/suspicion.ts`

`computeSuspicionScore(fp, burst?, similarity?)`: 0-100 weighted score
- Age (20%), Karma (25%), Burst (30%), Similarity (25%)

## Module: `src/server/scoring/riskAggregator.ts`

`aggregateRisk(alerts)`: SubredditRisk with recommendedAction
- Rules: none → watch → restrict → lock

## Module: `src/server/services/persistenceService.ts`

Interface `PersistenceService`:
- CRUD for fingerprints, alerts (with dismiss)
- Uses KVStore for storage

## Module: `src/server/services/scoringOrchestrator.ts`

`runScoringCycle(sub)`: Pipeline execution
1. Get config → 2. Get window → 3. Baseline → 4. Burst check → 5. Fingerprint → 6. Cluster → 7. Score → 8. Save alerts

## Module: `src/server/services/alertDispatcher.ts`

`dispatchAlert(alert)`: Creates mod-distinguished sticky comment

## Module: `src/server/triggers/scheduler.ts`

`handleSchedulerTick(orchestrator, dispatcher, wm)`: 5-min cron handler

## Module: `src/server/triggers/onPostCreate.ts`

`handlePostCreate(input, wm)`: Normalises PostCreate to ActivityEvent

## Module: `src/server/triggers/onCommentCreate.ts`

`handleCommentCreate(input, wm)`: Normalises CommentCreate to ActivityEvent
