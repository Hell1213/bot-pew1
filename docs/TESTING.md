# Testing Strategy

## Unit Tests (Vitest)

All pure scoring functions have unit tests:

| File | Tests |
|------|-------|
| `burst.test.ts` | Normal activity, burst spike, new account surge, empty events |
| `fingerprint.test.ts` | Feature vector dimensions, normalisation, account differentiation |
| `similarity.test.ts` | Cosine identical/orthogonal/opposite, Jaccard, clustering |
| `suspicion.test.ts` | Low/high scores, 0-100 range, similarity penalty |
| `riskAggregator.test.ts` | None/watch/restrict/lock, unique users, reason codes |
| `stats.test.ts` | zScore, Welford mean/variance/stddev |
| `time.test.ts` | bucketKey rounding |

## Running Tests

```bash
# All tests
npm run test

# Single test file
npm run test -- burst.test
npm run test -- similarity.test
```

## Integration Testing (Manual)

Use the simulation script to inject synthetic events:

```bash
npx tsx tools/simulateBurst.ts \
  --subreddit bot_pew1_dev \
  --new-accounts 5 \
  --existing 2 \
  --posts 3 \
  --comments 5 \
  --duration 2
```

After running, the next scheduler cycle (or manual trigger) should produce an alert.

## Manual Playtest Checklist

1. Install app on test subreddit
2. Create a few posts/comments with test accounts
3. Wait for scheduler (or use simulation script)
4. Check for mod-distinguished comment on related post
5. Open dashboard — verify alerts appear
6. Dismiss an alert — verify dismiss works
7. Check that burst threshold auto-adjusted

## Test Accounts for Burst Simulation

Create 5+ test Reddit accounts (can be new). Have them all post/comment rapidly in a 2-minute window. The scheduler should detect this as a burst.

## KV Inspection

During playtest, check Devvit logs:
```bash
devvit logs
```

Look for `[Scheduler]`, `[WindowManager]`, `[Orchestrator]`, `[API]` prefixed log lines.
