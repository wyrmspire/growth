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

## Current state

There are now two local-first phases before any real platform integration:

### Phase 0 — manual research capture
The repo keeps a file-backed research corpus in `data/research/opportunities.seed.json`.

This is the preferred starting point right now because it:
- matches the roadmap's manual-first research loop
- stays fully local/mock-safe
- creates reusable examples for scoring, clustering, and inbox rendering
- avoids premature scraping/integration work before the signal quality is proven

Each manual record captures:
- where the signal came from
- the pain point observed
- language worth reusing
- operator/workflow fit
- a first scoring pass
- a suggested human next action or draft reply
- risk flags and review requirements

### First scoring rubric

The current local-first rubric is weighted toward compound operator value instead of generic social virality:
- urgency — 30%
- repeat frequency — 25%
- buyer clarity — 20%
- local-first advantage — 15%
- data availability — 10%

`total` is stored as a `0–100` score so the inbox and dashboard can sort and summarize records consistently.

Why this shape:
- it mirrors the roadmap's weekly scoring loop
- it biases toward repeated operator pain and real buyer signal
- it keeps the system advisory instead of pretending one numeric score is strategy by itself

### Phase 1 — mock inbox shell
The Opportunities Inbox page exists and remains mock-safe/offline. It should move toward loading from the local research corpus before any live source scanning is added.

### Later phases
Only after manual capture proves useful should the module grow into source configs, scheduled scans, scoring pipelines, and adapter-backed ingestion.

## Platforms

Current manual-capture corpus may include: Reddit, X, Facebook, Instagram, LinkedIn, YouTube, newsletters, forums, and plain manual notes.

Future scan allowlist for automated social-scout work remains narrower and must be explicitly configured in code/contracts before use.

## Guardrails

See `CONTRACT.md` and `ANTI_PATTERNS.md` for hard limits. The most important: nothing goes out without a human approval decision.
