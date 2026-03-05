# social-scout

## What this module does

Scans approved social platforms on a slow schedule (15–30 minute cadence) for high-value conversation threads where the operator could productively engage. Returns scored opportunity cards with draft comment suggestions for human review.

## What it does NOT do

- It does not send comments automatically.
- It does not scrape aggressively or bypass rate limits.
- It does not create approvals — that is `approvals`' job.
- It does not contain platform API credentials — those belong to `adapters`.

## The slow-scout workflow

```
ScoutSourceConfig (what to watch)
  → ScoutRun (scheduled batch scan)
    → OpportunityItem[] (scored results)
      → SuggestedEngagement (draft comment per item)
        → Human review in Opportunities Inbox
          → OpportunityDecision (approve / skip / mute)
            → approved items enter approvals workflow
              → adapter sends reply
```

## Current state (board.md FUT-3)

Phase 1 is doc and contract only. The UI shell (Opportunities Inbox page) exists but uses mock data. No live API calls are made yet.

## Platforms

Phase 1 allowlist: Reddit, X (formerly Twitter), Facebook, Instagram
All platforms require explicit `ScoutSourceConfig` with `enabled: true` before scanning.

## Guardrails

See `CONTRACT.md` and `ANTI_PATTERNS.md` for hard limits. The most important: nothing goes out without a human approval decision.
