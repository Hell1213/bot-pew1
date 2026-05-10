# ModSignal — Implementation Plan

> Original plan document. See [PROGRESS.md](./PROGRESS.md) for current status.

---

## Project Mission

Build **ModSignal** — a Reddit Devvit-native moderation intelligence bot that detects coordinated inauthentic behaviour (brigading, spam raids, ban evasion, burst posting) and alerts moderators via native mod-queue comments and a custom dashboard. The bot runs entirely inside the Reddit Devvit runtime. No external servers, no external databases.

---

## Architecture

```
Devvit Runtime
├── Triggers (PostCreate, CommentCreate) → Window Manager (5-min buckets in KV)
├── Scheduler (5-min cron) → Scoring Orchestrator
│   ├── Burst Detection (z-score)
│   ├── Account Fingerprinting (7-dim vectors)
│   ├── Similarity Clustering (cosine + Jaccard)
│   ├── Suspicion Scoring (weighted 0-100)
│   └── Risk Aggregation
├── Alert Dispatcher → Mod-distinguished sticky comment
└── Dashboard (React iFrame) → REST API ← Persistence Service (KV)
```

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Devvit Web (serverless) |
| Backend | Hono + TypeScript (strict) |
| Frontend | React 19 + Tailwind CSS 4 |
| Storage | Devvit KV (Redis) |
| Testing | Vitest (36 tests) |
| Communication | REST API via `fetch` |

---

## Epics & Issues (21 total)

### Epic 1: Shared Contracts & Utilities
- **#1:** Core DTOs (`ActivityEvent`, `AccountFingerprint`, `AlertPayload`, `SubredditConfig`)
- **#2:** Pure utilities (`zScore`, `Welford`, `bucketKey`, KV key factories)

### Epic 2: Storage Layer
- **#3:** Typed KV wrapper (+ in-memory mock for testing)
- **#4:** Window Manager (rolling buckets, baseline stats, pruning)

### Epic 3: Event Ingestion
- **#5:** PostCreate + CommentCreate triggers

### Epic 4: Scoring Engine
- **#6:** Burst detection (z-score + new account ratio)
- **#7:** Account fingerprinting (feature vectors)
- **#8:** Similarity clustering (cosine, Jaccard, agglomerative)
- **#9:** Suspicion scoring + risk aggregation

### Epic 5: Scoring Orchestrator & Alerting
- **#10:** Persistence Service (CRUD for fingerprints, alerts, config)
- **#11:** Scoring Orchestrator (pipeline)
- **#12:** Alert Dispatcher (mod-distinguished comment)

### Epic 6: Scheduler & Integration
- **#13:** 5-minute cron trigger
- **#14:** Settings service + auto-tune feedback

### Epic 7: Moderator Dashboard
- **#15:** ModSignalPost root component
- **#16:** Dashboard components (AlertDashboard, AlertRow, AlertDetail, ConfigPanel)
- **#17:** Dashboard API endpoints + dismiss integration

### Epic 8: Testing
- **#18:** Unit tests (36 tests across 7 files)
- **#19:** Burst simulation script

### Epic 9: Documentation & Submission
- **#20:** Architecture + design docs (8 files)
- **#21:** README polish + final checks

---

## Key Design Decisions

1. **Devvit Web over Blocks** — Using Hono + React instead of `@devvit/public-api` blocks because the existing project was already set up this way
2. **KV over Redis** — Devvit KV is the only persistence option; no external databases
3. **REST API over tRPC** — The existing project already uses `fetch` calls; tRPC was listed in AGENTS.md but not actually set up
4. **Pure scoring functions** — All detection logic is pure TypeScript (no side effects), making it testable and portable
5. **Agglomerative clustering** — Simple, deterministic clustering that works well for small numbers of accounts in a 5-min window
6. **Auto-tune via dismiss feedback** — False-positive dismissals increase burst threshold; this is persisted in KV

---

## Repository Structure

```
bot-pew1/
├── src/
│   ├── client/           # React frontend
│   ├── server/           # Hono backend
│   │   ├── routes/       # API endpoints
│   │   ├── triggers/     # Event handlers
│   │   ├── services/     # Business logic
│   │   ├── scoring/      # Detection engine
│   │   └── storage/      # KV wrapper
│   ├── shared/           # Shared code
├── tools/                # CLI tools
├── docs/                 # Documentation
├── devvit.json           # App config
└── package.json          # Dependencies
```
