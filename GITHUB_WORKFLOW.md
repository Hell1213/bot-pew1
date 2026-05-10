# GitHub Workflow Guide

> How we use GitHub for the ModSignal project

---

## Issues (Already Created)

21 issues exist on the repository with labels and milestone:

```
https://github.com/Hell1213/bot-pew1/issues
```

### Labels Used
- `backend` — Server/scoring/storage work
- `frontend` — Dashboard/UI work
- `testing` — Tests and tools
- `documentation` — Docs and README
- `epic` — Large feature grouping

### Milestone
- `Hackathon` — All 21 issues are under this milestone

---

## Branches

| Branch | Purpose | Status |
|--------|---------|--------|
| `main` | Production-ready code | Base |
| `issue/5-14-backend-core` | ALL backend code | PR [#36](https://github.com/Hell1213/bot-pew1/pull/36) — open |
| `issue/15-16-dashboard-ui` | Dashboard UI | PR [#37](https://github.com/Hell1213/bot-pew1/pull/37) — open |

---

## Pull Requests (Already Open)

### [#36 — Backend Core](https://github.com/Hell1213/bot-pew1/pull/36)
Contains: DTOs, utilities, KV store, window manager, triggers, scoring engine, all services, API endpoints, tests, simulation script, documentation, README.

**Closes issues:** #11, #27, #12, #28, #13, #14, #15, #29, #16, #17, #18, #19, #20, #30, #23, #24, #25, #26

### [#37 — Dashboard UI](https://github.com/Hell1213/bot-pew1/pull/37)
Contains: ModSignalPost root component, AlertDashboard, AlertRow, AlertDetail, ConfigPanel.

**Closes issues:** #21, #22

---

## What Needs To Happen Next

### 1. Review & Merge PRs
The two open PRs contain all the code. A team member should:
- Review the code
- Approve
- Merge into `main`

### 2. Merge main into any new branches
After PRs are merged, create new branches from `main` for any future work.

### 3. Close the Issues
After PRs are merged, the issues will auto-close (we used `Closes #N` in PR descriptions).

### 4. (Optional) Reopen issues for future enhancements
If there are features to add after the hackathon, reopen specific issues or create new ones.

---

## Creating a New Branch & PR

```bash
# 1. Start from main
git checkout main
git pull origin main

# 2. Create branch
git checkout -b issue/N-description

# 3. Make changes, commit
git add .
git commit -m "feat(#N): description of change"

# 4. Push
git push -u origin issue/N-description

# 5. Create PR (via GitHub UI or CLI)
gh pr create --title "feat(#N): description" --body "Closes #N"
```

---

## Current State

```
✅ 21 issues created on GitHub
✅ All code implemented (~4,000 lines)
✅ 2 PRs open waiting for review/merge
✅ 36 unit tests passing
✅ 8 documentation files created
✅ Simulation tool ready
```

**What you (team) need to do:**
1. Review and merge PRs [#36](https://github.com/Hell1213/bot-pew1/pull/36) and [#37](https://github.com/Hell1213/bot-pew1/pull/37)
2. Run `npm run dev` to test on Reddit
3. Follow `docs/DEMO_PLAN.md` for the hackathon demo
