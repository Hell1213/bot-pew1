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
npm install
npm run login
npm run dev          # Start development on Reddit
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on Reddit |
| `npm run build` | Build client + server |
| `npm run type-check` | TypeScript strict check |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests (36 tests) |
| `npm run deploy` | Full deploy pipeline |

## Project Structure

```
src/
├── client/          # React frontend (dashboard)
├── server/          # Hono backend
│   ├── routes/      # API and trigger endpoints
│   ├── triggers/    # Event handlers (PostCreate, CommentCreate)
│   ├── services/    # Business logic
│   ├── scoring/     # Detection engine
│   └── storage/     # KV wrapper
├── shared/          # Types, utilities, constants
tools/               # Burst simulation script
docs/                # Documentation
```

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
- **Testing:** Vitest (36 unit tests)
- **No external servers or databases**

## License

BSD-3-Clause
