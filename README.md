# ModSignal 🤖

**Reddit moderation intelligence bot** — detects coordinated inauthentic behaviour and alerts moderators. Built entirely on Reddit's Devvit platform.

## What ModSignal Detects

- **Burst Activity** — sudden spikes in posting/commenting (z-score analysis)
- **New Account Surges** — coordinated raids from fresh accounts
- **Account Similarity** — fingerprint matching to find ban evasion rings
- **Coordinated Behaviour** — clustering accounts by feature vector similarity

## How It Works

1. **Triggers** capture every PostCreate and CommentCreate event
2. **Window Manager** stores events in rolling 5-minute buckets (Devvit KV)
3. **Scoring Engine** runs every 5 minutes:
   - Computes baseline activity statistics
   - Detects bursts via z-score analysis
   - Builds account fingerprints (7-dimension feature vectors)
   - Clusters similar accounts using cosine similarity
   - Computes suspicion scores (0–100)
4. **Alert Dispatcher** posts mod-distinguished sticky comments
5. **Dashboard** (React UI) shows active alerts with dismiss actions
6. **Auto-Tune** adjusts burst threshold based on false-positive feedback

## Quick Start

```bash
git clone <repo>
cd bot-pew1
npm install
npm run login           # Authenticate with Redlet (one-time)
npm run dev             # Start dev server and preview on Reddit
npx devvit playtest     # Upload to a test subreddit for live testing
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload on Reddit |
| `npm run build` | Build client + server (required before playtest) |
| `npx devvit playtest` | Upload build to test subreddit for live testing |
| `npm run type-check` | TypeScript strict check |
| `npm run lint` | ESLint |
| `npm run test` | Vitest integration suite (45 tests) |
| `npm run test -- my-test-file` | Run a single test file in isolation |
| `npm run deploy` | Full deploy pipeline (type-check → lint → test → upload) |

## Project Structure

```
src/
├── client/             # React frontend (dashboard iFrame)
│   ├── splash.tsx       # Entry: inline feed view shown on Reddit
│   ├── index.css        # Global styles (sliders, toggles, Reddit theme)
│   ├── ui/              # Dashboard components
│   │   ├── ModSignalPost.tsx      # Root: header + 30s polling + tabs
│   │   ├── components/
│   │   │   ├── AlertDashboard.tsx   # Incident queue + filters + empty state
│   │   │   ├── AlertCard.tsx        # Incident card with expandable detail
│   │   │   ├── ExplainabilityPanel.tsx  # Human-readable signal breakdown
│   │   │   ├── ModActions.tsx        # 5-action grid + audit trail
│   │   │   ├── ConfigPanel.tsx       # Presets + advanced tuning
│   │   │   └── DemoControls.tsx      # Developer testing tools
│   │   └── game.html       # Expanded view entry HTML
│   └── splash.html      # Inline feed entry HTML
├── server/             # Hono backend (Devvit serverless)
│   ├── index.ts         # Hono app entry point
│   ├── core/
│   │   └── post.ts      # Creates ModSignal dashboard posts
│   ├── routes/
│   │   ├── api.ts       # REST: /alerts, /config, /stats, /demo
│   │   ├── triggers.ts  # Event handlers: post/comment, cron, install
│   │   └── menu.ts      # Menu actions: create dashboard, dismiss alert
│   ├── scoring/         # Detection engine (pure functions)
│   │   ├── burst.ts         # Z-score burst detection
│   │   ├── fingerprint.ts   # 7-dim account fingerprint builder
│   │   ├── similarity.ts    # Agglomerative clustering (cosine similarity)
│   │   ├── suspicion.ts     # Weighted suspicion score (0-100)
│   │   └── riskAggregator.ts # Subreddit-level risk assessment
│   ├── services/        # Business logic layer
│   │   ├── windowManager.ts       # Atomic sorted-set event storage
│   │   ├── persistenceService.ts  # Alert CRUD, actions, config, stats
│   │   ├── scoringOrchestrator.ts # Pipeline: ties all scoring together
│   │   ├── alertDispatcher.ts     # Posts mod-distinguished comments
│   │   └── settings.ts            # Config management + auto-tune
│   └── storage/
│       └── kvStore.ts   # KV wrapper: sorted sets, atomic ops
├── shared/             # Shared code (runs on both client and server)
│   ├── dto/
│   │   └── modsignal.ts  # All types: AlertPayload, ExplainabilityData, etc.
│   ├── utils/
│   │   ├── stats.ts    # Z-score, mean, stddev calculations
│   │   └── time.ts     # Time window utilities
│   └── constants/
│       └── kvKeys.ts   # KV key pattern factories
tools/
├── integrationTest.ts  # 45-test integration suite
└── simulateBurst.ts    # Burst scenario simulation script
```

## Codebase Walkthrough

### How Data Flows Through the Code

```
PostCreate / CommentCreate (Reddit)
       │
       ▼
  src/server/routes/triggers.ts  ← normalises event → ActivityEvent
       │
       ▼
  src/server/services/windowManager.ts  ← stores in sorted set (KV)
       │
       ▼
  scheduler (5-min cron) → triggers.ts → windowManager.getCurrentWindowEvents()
       │
       ▼
  src/server/services/scoringOrchestrator.ts  ← runs the pipeline:
       │
       ├── 1. src/server/scoring/burst.ts         ← z-score analysis
       ├── 2. src/server/scoring/fingerprint.ts    ← 7-dim vectors
       ├── 3. src/server/scoring/similarity.ts     ← cluster accounts
       ├── 4. src/server/scoring/suspicion.ts      ← score 0-100
       └── 5. src/server/scoring/riskAggregator.ts ← risk level
       │
       ▼
  src/server/services/persistenceService.ts  ← saves alert to KV
       │
       ▼
  src/server/services/alertDispatcher.ts  ← posts mod-distinguished comment
       │
       ▼
  Dashboard polls GET /alerts → renders incidents in React UI
```

### Frontend Component Tree

```
ModSignalPost.tsx (root)
├── Header: "ModSignal — Incident Dashboard"
├── Status strip: "Active" / "Last check" / "Profile"
├── Developer Testing Tools (collapsed by default)
│   └── DemoControls.tsx (4 scenarios + reset)
├── Tab: Incidents
│   └── AlertDashboard.tsx
│       ├── System status strip + scan recency
│       ├── Workflow filter bar: Open / Acknowledged / Investigating / Resolved
│       ├── Severity sub-filters: All / Critical / High / Medium
│       ├── Incident count cards
│       └── For each alert → AlertCard.tsx
│           ├── Title + severity color bar + workflow badge
│           ├── Evidence summary + confidence pill
│           ├── Expandable detail →
│           │   ├── Confidence breakdown bar
│           │   ├── ExplainabilityPanel.tsx (human-readable signals)
│           │   ├── Affected accounts list
│           │   └── ModActions.tsx (5-column action grid + audit trail)
└── Tab: Settings
    └── ConfigPanel.tsx
        ├── Preset cards: Conservative / Balanced / Aggressive
        └── Advanced tuning: sliders for sensitivity, similarity, window, cooldown
```

### Scoring Pipeline (Stages)

Each stage is a pure function in `src/server/scoring/`:

1. **Burst Detection** (`burst.ts`) — compares current activity rate against historical baseline using z-score. Z > 2.5 triggers burst flag.
2. **Fingerprinting** (`fingerprint.ts`) — builds a 7-dimension vector per account: postRatio, avgTitleLength, emojiRatio, questionRatio, avgInterval, activeHoursSpread, accountAgeHours.
3. **Similarity / Clustering** (`similarity.ts`) — computes pairwise cosine similarity between account fingerprints. Agglomerative clustering groups accounts with similarity > 0.85.
4. **Suspicion Scoring** (`suspicion.ts`) — weighted score combining: burst severity (40%), cluster size (25%), account age (20%), account karma (15%).
5. **Risk Aggregation** (`riskAggregator.ts`) — combines all alerts into a subreddit-level severity rating and overall risk score.

### Key Design Decisions

- **Sorted sets for events** — WindowManager uses atomic `zAdd`/`zRange` instead of read-modify-write arrays, eliminating race conditions in concurrent event recording.
- **Workflow states from action history** — The alert state (Open / Acknowledged / Monitoring / Investigating / Escalated / Resolved) is derived from the last entry in `actionHistory`, not a separate field.
- **Explainability attached at creation** — The ScoringOrchestrator generates human-readable signal explanations when creating the alert, stored alongside the payload.
- **Config presets override sliders** — Selecting a profile card (Conservative / Balanced / Aggressive) sets all four thresholds. Changing a slider clears the preset match and shows "Custom".
- **Demo controls collapsed by default** — Keeps production-incident focus. Toggle open via "Developer Testing Tools" details element.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Low-Level Design](docs/LLD.md)
- [Requirements](docs/SRS.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Testing Strategy](docs/TESTING.md)
- [Demo Plan](docs/DEMO_PLAN.md)
- [Submission Checklist](docs/HACKATHON_CHECKLIST.md)

## Tech Stack

- **Runtime:** Devvit (Reddit's serverless platform)
- **Backend:** Hono + TypeScript (strict mode)
- **Frontend:** React 19 + Tailwind CSS 4
- **Storage:** Devvit KV (Redis)
- **Testing:** Vitest (45 integration tests)
- **No external servers or databases**

## Development Notes

- **Auth:** Run `npm run login` before any dev command. It authenticates with your Reddit account via Redlet.
- **Build before playtest:** Always run `npm run build` first, then `npx devvit playtest` to push a fresh build to your test subreddit.
- **Test subreddit:** You need a dedicated test subreddit. Run `npx devvit playtest <subreddit-name>` to install the app there.
- **Full deploy:** `npm run type-check && npm run lint && npm run test && npx devvit upload` — run this before any PR merge to ensure CI passes.
- **Tests:** 45 integration tests covering stats, KV, burst detection, fingerprinting, clustering, suspicion scoring, risk aggregation, persistence, settings, pipeline, and E2E. Run with `npm run test` or isolate a file with `npm run test -- my-test-file`.
- **Type-check and lint must pass before deploy.** One expected lint warning for `splash.tsx` (vite entry, no exports).
- **Logs during dev:** Devvit outputs to stdout. If the dashboard shows no data, check the dev server logs for errors.
- **If the app doesn't appear on Reddit:** Verify the app is installed on your test subreddit (`npx devvit list`), then open the subreddit and check the "ModSignal Dashboard" menu item under Mod Tools.

## License

BSD-3-Clause
