# ModSignal — Team Guide

Welcome to the ModSignal team! This guide explains how we're building this together, what's already done, and how to contribute.

---

## How We Work

### GitHub Flow

```
main  ←  feature/issue branches  →  Pull Requests  →  merge to main
```

1. **Pick an issue** from the GitHub Issues tab
2. **Create a branch**: `git checkout -b issue/N-short-name main`
3. **Implement** the feature
4. **Push**: `git push -u origin your-branch-name`
5. **Open a PR** against `main` with `Closes #N` in the description
6. **Request review** from another team member
7. **Merge** once approved and CI passes

### What's Already Built

Everything is implemented. See [PROGRESS.md](./PROGRESS.md) for the full list. The two open PRs contain **all** the code:

| PR | What's Inside | Who Should Review |
|----|--------------|-------------------|
| [#36](https://github.com/Hell1213/bot-pew1/pull/36) | Backend: triggers, scoring engine, services, API, tests, docs | Backend folks |
| [#37](https://github.com/Hell1213/bot-pew1/pull/37) | Frontend: React dashboard, components, config panel | Frontend folks |

---

## Development Setup

### Prerequisites
- Node.js 22+
- Devvit CLI: `npm install -g devvit`
- Reddit developer account (login with `npm run login`)

### Quick Start

```bash
git clone git@github.com:Hell1213/bot-pew1.git
cd bot-pew1
npm install
npm run type-check   # Verify everything compiles
npm run test         # Run 36 unit tests
npm run dev          # Start live preview on Reddit
```

### Testing Your Changes

```bash
npm run type-check   # TypeScript strict check
npm run lint         # ESLint
npm run test         # Unit tests
```

---

## Project Structure Guide

```
src/
├── client/           # React frontend (inside Devvit iFrame)
│   ├── game.tsx      # Expanded view — renders ModSignal dashboard
│   ├── splash.tsx    # Inline feed view
│   └── ui/           # Dashboard React components
├── server/           # Hono backend (Devvit serverless)
│   ├── index.ts      # App entry — don't modify unless adding routes
│   ├── routes/       # API, menu, trigger, form endpoints
│   ├── triggers/     # Event handlers (PostCreate, CommentCreate, scheduler)
│   ├── services/     # Business logic layer
│   ├── scoring/      # Detection engine (pure functions)
│   │   └── __tests__/ # Unit tests
│   └── storage/      # KV wrapper
└── shared/           # Shared between client & server
    ├── dto/          # Type definitions
    ├── utils/        # Pure utility functions
    └── constants/    # KV key factories
tools/                # CLI tools (burst simulator)
docs/                 # Documentation
```

### Key Files to Know

| File | Purpose |
|------|---------|
| `devvit.json` | App config — triggers, menu items, entrypoints |
| `src/server/routes/triggers.ts` | All trigger endpoints wired to handlers |
| `src/server/routes/api.ts` | REST API for dashboard |
| `src/server/services/scoringOrchestrator.ts` | Central pipeline — how detection works |
| `src/server/scoring/burst.ts` | Z-score burst detection logic |
| `src/client/ui/ModSignalPost.tsx` | Main dashboard component |

---

## Adding a New Feature

Example: Adding a new scoring signal

1. Create pure function in `src/server/scoring/mySignal.ts`
2. Write tests in `src/server/scoring/__tests__/mySignal.test.ts`
3. Add to the orchestrator pipeline in `src/server/services/scoringOrchestrator.ts`
4. Add `console.log('[MySignal]', ...)` for debug logging
5. Run `npm run type-check && npm run test`
6. Commit and open PR

---

## Devvit-Specific Notes

- **No `@devvit/public-api`** — we use `@devvit/web/server` (Hono-based, not blocks)
- **KV storage** uses `redis` from `@devvit/web/server`
- **Triggers** are HTTP endpoints registered in `devvit.json`, not `Devvit.addTrigger()`
- **UI** is React + Tailwind, not Devvit blocks
- **Logs** appear via `devvit logs` CLI command
- **No external servers or databases** — everything runs inside Reddit

---

## Communication

- **Issues** for tracking work
- **PRs** for code review
- **Docs/** for reference
- `console.log('[ModuleName]', ...)` for runtime debugging
