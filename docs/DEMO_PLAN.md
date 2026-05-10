# Hackathon Demo Plan (4 Minutes)

## Setup (30s)
- Show test subreddit with ModSignal installed
- Point out existing posts/comments (normal activity)

## Simulation (45s)
- Run `npx tsx tools/simulateBurst.ts` with synthetic burst config
- Explain: "5 new accounts all posting rapidly — looks like a coordinated raid"

## Scoring & Detection (45s)
- Trigger scheduler or wait for cron
- Show Devvit logs with burst detection output
- Explain: "Z-score of 8 — that's 8 standard deviations above normal"

## Alert (45s)
- Navigate to the post where alert was placed
- Show the mod-distinguished, stickied comment
- Explain: "ModSignal automatically alerted with reason codes and severity"

## Dashboard (45s)
- Open ModSignal dashboard (Expanded View)
- Show: alert list, severity color-coding, affected users
- Dismiss an alert
- Explain: "Dashboard gives mods full visibility"

## Auto-Tune (30s)
- Explain: "When a mod dismisses a false positive, ModSignal auto-adjusts"
- Show config panel with burst threshold slider

## Closing (30s)
- Recap: "Fully inside Devvit — no servers, no databases"
- Source: github.com/Hell1213/bot-pew1
- Questions

## Total: 4 minutes

## Talking Points
- "Built for Reddit moderators — detects coordinated inauthentic behaviour"
- "100% Devvit-native — runs entirely on Reddit's infrastructure"
- "Real-time detection every 5 minutes"
- "Self-tuning threshold via mod feedback"
- "Clean dashboard for alert management"
