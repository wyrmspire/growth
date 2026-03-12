# Research data

This folder is the **local-first research corpus** for GrowthOps OS.

For now, the preferred workflow is **manual capture first**:
- collect a small number of promising signals by hand
- normalize them into one durable repo format
- review and score them locally
- only consider heavier ingestion after clear repeatable value shows up

Why this comes first:
- it matches the roadmap's "manual first, no infra heroics" rule
- it keeps the research loop fully offline/mock-safe
- it gives the Opportunities Inbox honest local data instead of hard-coded demo cards
- it creates a reusable seed corpus for future scoring, clustering, and dashboard summaries

## Capture file

Current seed file: `opportunities.seed.json`

Top-level shape:

```json
{
  "version": 1,
  "capturedAt": "ISO-8601 UTC",
  "records": []
}
```

Each record shape:

```json
{
  "id": "research-001",
  "status": "new | reviewing | approved | parked",
  "source": {
    "platform": "reddit | x | facebook | instagram | linkedin | youtube | newsletter | forum | manual-note",
    "sourceType": "thread | post | comment | video | article | newsletter | note",
    "community": "string",
    "author": "string",
    "url": "string",
    "capturedBy": "manual"
  },
  "observedAt": "ISO-8601 UTC",
  "summary": "short normalized summary",
  "painPoint": "what problem showed up",
  "languageSignals": ["exact words or framing worth reusing"],
  "operatorFit": {
    "audience": "who this is for",
    "workflow": "where the pain lives",
    "whyNow": "why this seems timely"
  },
  "scoring": {
    "urgency": 0,
    "repeatFrequency": 0,
    "buyerClarity": 0,
    "dataAvailability": 0,
    "localFirstAdvantage": 0,
    "total": 0,
    "notes": "why it scored this way"
  },
  "opportunity": {
    "recommendedAction": "what a human could do next",
    "suggestedReply": "draft starting point",
    "riskFlags": ["manual-review-only reasons"],
    "approvalRequired": true
  },
  "tags": ["topic or lane tags"],
  "notes": "extra context"
}
```

## Current guardrails

- Keep this corpus local and file-backed for now.
- Prefer fewer better records over noisy bulk collection.
- Do not add live scraping or outbound posting here.
- Any suggested reply is advisory only and still needs human review/approval.
