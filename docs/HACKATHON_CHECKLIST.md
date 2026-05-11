# Hackathon Submission Checklist

## Code Quality
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` succeeds
- [ ] No `any` types (except where unavoidable)
- [ ] All types use `readonly` where applicable
- [ ] No console.log statements left in production code

## Features
- [ ] PostCreate trigger ingests events
- [ ] CommentCreate trigger ingests events
- [ ] Window Manager stores rolling 5-min buckets
- [ ] Burst detection computes z-score
- [ ] Account fingerprinting builds feature vectors
- [ ] Similarity clustering groups suspicious accounts
- [ ] Suspicion scoring produces 0-100 score
- [ ] Risk aggregator produces subreddit-level assessment
- [ ] Alerts persisted to KV
- [ ] Alert comment posted with distinguish + sticky
- [ ] Dismiss action works from dashboard
- [ ] Dismiss action works from mod menu
- [ ] Auto-tune adjusts burst threshold
- [ ] Dashboard displays alerts
- [ ] Config panel is functional
- [ ] Scheduler runs every 5 minutes

## Documentation
- [ ] `docs/ARCHITECTURE.md` complete
- [ ] `docs/LLD.md` matches code
- [ ] `docs/SRS.md` covers requirements
- [ ] `docs/DEVELOPMENT.md` has setup instructions
- [ ] `docs/DEPLOYMENT.md` has deploy steps
- [ ] `docs/TESTING.md` has test strategy
- [ ] `docs/DEMO_PLAN.md` has 4-min script
- [ ] `docs/HACKATHON_CHECKLIST.md` (this file)

## Demo Readiness
- [ ] Demo video recorded (≤ 4 minutes)
- [ ] Test accounts created for burst simulation
- [ ] Test subreddit ready with app installed
- [ ] Simulation script tested and working
- [ ] Dashboard loads correctly in Expanded View
- [ ] Alert comments render properly

## Repository
- [ ] README.md updated with project info
- [ ] License file present
- [ ] .gitignore configured
- [ ] All secrets/environment files excluded
- [ ] Commit messages follow conventional format
