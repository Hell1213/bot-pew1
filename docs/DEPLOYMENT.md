# Deployment Guide

## Prerequisites
- Devvit CLI installed and logged in
- Node.js 22+
- Access to a test subreddit

## Step 1: Build

```bash
npm run build
```

This compiles:
- Client (React) to `dist/client/`
- Server (Hono) to `dist/server/`

## Step 2: Upload to Devvit

```bash
devvit upload
```

You'll be prompted to confirm. The app version is uploaded to Devvit's infrastructure.

## Step 3: Install on Subreddit

```bash
devvit install <subreddit-name>
```

Example:
```bash
devvit install bot_pew1_dev
```

## Step 4: Playtest

```bash
npm run dev
# or
devvit playtest <subreddit-name>
```

This opens a live preview on the test subreddit.

## Full Deploy Pipeline

```bash
npm run deploy
```

This runs: `type-check` → `lint` → `test` → `devvit upload`

## Updating

1. Make changes
2. `npm run deploy`
3. `devvit install <subreddit>` (re-install to update)

## Publishing (for hackathon submission)

```bash
npm run launch
```

This runs the deploy pipeline then submits for review.

## Environment

- `devvit.json` specifies the test subreddit (`bot_pew1_dev`)
- Triggers are registered in `devvit.json`
- No environment variables needed — everything runs inside Devvit
