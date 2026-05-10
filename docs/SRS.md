# Software Requirements Specification — ModSignal

## Functional Requirements

### FR1: Event Ingestion
- FR1.1: System SHALL capture PostCreate events via Devvit trigger
- FR1.2: System SHALL capture CommentCreate events via Devvit trigger
- FR1.3: Events SHALL be normalised to ActivityEvent type
- FR1.4: Events SHALL be stored in rolling 5-minute time buckets

### FR2: Burst Detection
- FR2.1: System SHALL compute baseline activity statistics (mean, stddev)
- FR2.2: System SHALL compute z-score for current window
- FR2.3: System SHALL flag burst when z-score exceeds configurable threshold
- FR2.4: System SHALL track new-account ratio in burst detection

### FR3: Account Fingerprinting
- FR3.1: System SHALL build 7-dimension feature vectors per account
- FR3.2: System SHALL normalise features to [0, 1] range
- FR3.3: System SHALL persist fingerprints to KV storage

### FR4: Similarity Analysis
- FR4.1: System SHALL compute cosine similarity between feature vectors
- FR4.2: System SHALL cluster accounts with similarity > threshold
- FR4.3: System SHALL compute suspicion scores for clustered accounts

### FR5: Alerting
- FR5.1: System SHALL create AlertPayload when suspicion score > 50
- FR5.2: System SHALL persist alerts to KV storage
- FR5.3: System SHALL post mod-distinguished sticky comment
- FR5.4: System SHALL support dismiss action from UI and menu

### FR6: Dashboard
- FR6.1: System SHALL display active alerts with severity color-coding
- FR6.2: System SHALL show subreddit config panel
- FR6.3: System SHALL support alert dismissal from UI
- FR6.4: System SHALL show summary stats

### FR7: Auto-Tune
- FR7.1: System SHALL increase burst threshold on false positive dismiss
- FR7.2: System SHALL decrease burst threshold on missed detection
- FR7.3: Threshold SHALL be clamped between 1.0 and 10.0

## Non-Functional Requirements

### NFR1: Performance
- NFR1.1: Trigger handlers SHALL complete in < 1 second
- NFR1.2: Scoring cycle SHALL complete in < 10 seconds
- NFR1.3: Dashboard SHALL load in < 3 seconds

### NFR2: Reliability
- NFR2.1: All trigger handlers SHALL catch and log errors
- NFR2.2: KV operations SHALL handle missing keys gracefully
- NFR2.3: System SHALL not crash on malformed events

### NFR3: Security
- NFR3.1: Only moderators SHALL access dashboard
- NFR3.2: Only moderators SHALL dismiss alerts
- NFR3.3: No external API endpoints SHALL be exposed

### NFR4: Compatibility
- NFR4.1: System SHALL run entirely inside Devvit runtime
- NFR4.2: No external databases or servers
- NFR4.3: TypeScript strict mode enforced

## Constraints
- C1: Must use Devvit KV for all persistence
- C2: Must use Devvit Web (React + Hono) architecture
- C3: No external dependencies beyond Devvit packages
- C4: Must fit in Devvit's serverless execution model
