# Development Guide

## Prerequisites
- Node.js 22+
- Devvit CLI (`npm install -g devvit`)
- Reddit developer account

## Setup

```bash
npm install
npm run login
```

## Project Structure

```
src/
├── client/          # React frontend (iFrame)
│   ├── game.tsx     # Expanded view - ModSignal dashboard
│   ├── splash.tsx   # Inline feed view
│   └── ui/          # Dashboard components
├── server/          # Hono backend
│   ├── index.ts     # App entry point
│   ├── routes/      # API, triggers, menu, forms
│   ├── triggers/    # Event handlers
│   ├── services/    # Business logic
│   ├── scoring/     # Scoring engine
│   │   └── __tests__/ # Unit tests
│   └── storage/     # KV wrapper
├── shared/          # Shared code
│   ├── dto/         # Type definitions
│   ├── utils/       # Pure utility functions
│   └── constants/   # KV key factories
tools/
└── simulateBurst.ts # Test simulation script
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on Reddit |
| `npm run build` | Build client + server |
| `npm run type-check` | TypeScript strict check |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests |
| `npm run deploy` | Full deploy (type-check + lint + test + upload) |

## Adding a New Trigger

1. Create handler in `src/server/triggers/`
2. Add endpoint in `src/server/routes/triggers.ts`
3. Register in `devvit.json` triggers object

## Adding a New Scoring Signal

1. Create pure function in `src/server/scoring/`
2. Write unit tests in `src/server/scoring/__tests__/`
3. Integrate in `src/server/services/scoringOrchestrator.ts`

## Code Style

- Types: `type` alias, `readonly` fields
- Exports: Named exports only
- Casting: Never cast types
- Comments: Minimal, only for non-obvious logic
- Naming: camelCase files, PascalCase components, UPPER_SNAKE_CASE constants
