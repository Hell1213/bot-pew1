# ModSignal Architecture

## Overview

ModSignal is a Reddit Devvit-native moderation intelligence bot that detects coordinated inauthentic behaviour and alerts moderators.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Devvit Runtime                           │
│                                                                 │
│  ┌──────────────┐    ┌──────────────────┐    ┌───────────────┐ │
│  │  Triggers     │───▶│  Window Manager  │───▶│  Scoring       │ │
│  │  (PostCreate, │    │  (5-min buckets) │    │  Engine        │ │
│  │   Comment)    │    │                   │    │  (burst, fp,   │ │
│  └──────────────┘    └──────────────────┘    │   similarity)   │ │
│                                              └───────┬───────┘ │
│  ┌──────────────┐    ┌──────────────────┐            │         │
│  │  Scheduler    │───▶│  Orchestrator    │────────────┘         │
│  │  (5-min cron) │    │  (glues scoring) │                      │
│  └──────────────┘    └────────┬─────────┘                      │
│                               │                                  │
│  ┌──────────────┐    ┌────────▼─────────┐                      │
│  │  Dashboard    │◀───│  Persistence     │                      │
│  │  (React UI)   │    │  Service (KV)    │                      │
│  └──────────────┘    └──────────────────┘                      │
│                               │                                  │
│  ┌──────────────┐    ┌────────▼─────────┐                      │
│  │  Alert        │◀───│  Alert           │                      │
│  │  Comment      │    │  Dispatcher      │                      │
│  └──────────────┘    └──────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### Triggers
- `onPostCreate`: Normalises new post events into ActivityEvent
- `onCommentCreate`: Normalises new comment events into ActivityEvent
- `onCronTick`: 5-minute scheduler that kicks off scoring

### Services
- **WindowManager**: Stores events in rolling 5-min time buckets in KV
- **PersistenceService**: CRUD for fingerprints, alerts, config
- **SettingsService**: SubredditConfig management with auto-tune
- **ScoringOrchestrator**: Pipeline that ties all scoring together
- **AlertDispatcher**: Posts mod-distinguished sticky comments

### Scoring Engine
- **burst.ts**: Z-score burst detection
- **fingerprint.ts**: Feature vector builder
- **similarity.ts**: Cosine/Jaccard similarity + clustering
- **suspicion.ts**: Weighted suspicion scoring
- **riskAggregator.ts**: Subreddit-level risk assessment

### Frontend
- React 19 + Tailwind CSS dashboard inside Devvit iFrame
- Reads alerts/config from REST API
- Dismiss actions trigger auto-tune feedback

## Data Flow

1. User creates post/comment → Devvit fires trigger
2. Trigger normalises event → stores in Window Manager (KV)
3. Every 5 min: Scheduler fires → Orchestrator runs
4. Orchestrator: read window → compute baseline → burst check → fingerprint → cluster → score → alert
5. Alert persisted to KV → dispatched as mod comment
6. Dashboard reads alerts from API → renders UI
7. Dismiss → auto-tune adjusts burst threshold

## Storage (Devvit KV)

| Key Pattern | Value |
|------------|-------|
| `window:{sub}:{bucketTs}` | `ActivityEvent[]` |
| `fp:{sub}:{userId}` | `AccountFingerprint` |
| `alert:{sub}:{alertId}` | `AlertPayload` |
| `alert-list:{sub}` | `string[]` (alert IDs) |
| `config:{sub}` | `SubredditConfig` |
