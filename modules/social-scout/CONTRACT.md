# social-scout — Contract

Owner: social-scout
Depends on: core
Depended on by: approvals (receives opportunity → engagement decisions)

## Purpose

This module owns the data model and business logic for slow-batch social opportunity discovery. It surfaces scored conversation threads from approved platforms for human review and optional reply drafting.

**It does not send anything autonomously.** Every accepted opportunity routes to the approval workflow before any outbound action.

## Exported Types

- `ScoutSourceConfig`
  - `id: EntityId`
  - `platform: 'reddit' | 'x' | 'facebook' | 'instagram' | 'linkedin'`
  - `sourceId: string`
  - `query: string`
  - `enabled: boolean`
  - `scanIntervalMinutes: number`

- `ScoutRun`
  - `id: EntityId`
  - `startedAt: string` (ISO 8601 UTC)
  - `completedAt?: string`
  - `platform: ScoutPlatform`
  - `status: 'running' | 'completed' | 'failed'`
  - `itemsFound: number`

- `OpportunityScoreBreakdown`
  - `keywordRelevance: number`
  - `engagementPotential: number`
  - `recency: number`
  - `riskPenalty: number`

- `OpportunityItem`
  - `id: EntityId`
  - `platform: ScoutPlatform`
  - `sourceUrl: string`
  - `author: string`
  - `contentSnippet: string`
  - `score: number` (0–100)
  - `scoreBreakdown: OpportunityScoreBreakdown`
  - `riskFlags: string[]`
  - `discoveredAt: string`

- `SuggestedEngagement`
  - `id: EntityId`
  - `opportunityId: EntityId`
  - `draftComment: string`
  - `toneProfile: TonePreset`
  - `confidence: number` (0–1)
  - `policyChecks: string[]`

- `OpportunityDecision`
  - `opportunityId: EntityId`
  - `decision: 'approved' | 'skipped' | 'muted'`
  - `reviewerId: string`
  - `timestamp: string`
  - `notes?: string`

## Exported Functions

### scoreOpportunity(input: ScoreInput): OpportunityItem
Purpose: Create a scored opportunity record from raw discovery input.
Errors: none directly; callers must validate persisted records separately.
Invariants:
- Deterministic for the same `contentSnippet`, `keywords`, `riskPhrases`, and `discoveredAt` window.
- Returns a composite score bounded to `0–100`.
- Maps matched risk phrases into human-readable `riskFlags`.

### filterByRelevance(items: OpportunityItem[], minScore = 30): OpportunityItem[]
Purpose: Remove low-value opportunities before review or draft generation.
Errors: none.
Invariants:
- Preserves original item shape.
- Only returns items where `score >= minScore`.

### topOpportunities(items: OpportunityItem[], limit = 5): OpportunityItem[]
Purpose: Sort and trim opportunities for compact review surfaces.
Errors: none.
Invariants:
- Returns highest-score items first.
- Does not mutate the source array.

### validateSourceConfig(config: ScoutSourceConfig): ScoutValidationResult
Purpose: Confirm platform allowlist, required ids/queries, and minimum scan intervals before enabling a source.
Errors surfaced in result: `MISSING_ID`, `INVALID_PLATFORM`, `EMPTY_QUERY`, `INTERVAL_TOO_SHORT`
Invariants:
- Minimum scan interval is currently 5 minutes in code.
- Platform must be in the explicit allowlist.

### validateOpportunityItem(item: OpportunityItem): ScoutValidationResult
Purpose: Confirm required fields before scoring, persistence, or display.
Errors surfaced in result: `MISSING_ID`, `INVALID_PLATFORM`, `SCORE_OUT_OF_RANGE`, `EMPTY_CONTENT`
Invariants:
- Score must stay in the `0–100` range.
- Platform must be in the explicit allowlist.

## File-backed capture format (RESEARCH-1)

The repo now also defines a **manual-first local research capture format** in `data/research/opportunities.seed.json`.

This is intentionally file-backed before live source ingestion. It gives the product a durable local corpus for:
- opportunity examples
- language/pain-point capture
- first-pass scoring
- future inbox loading and dashboard summaries

Current top-level file shape:
- `version: number`
- `capturedAt: string` (ISO 8601 UTC)
- `records: ResearchOpportunityRecord[]`

Current `ResearchOpportunityRecord` shape for local capture:
- `id: string`
- `status: 'new' | 'reviewing' | 'approved' | 'parked'`
- `source`
  - `platform: 'reddit' | 'x' | 'facebook' | 'instagram' | 'linkedin' | 'youtube' | 'newsletter' | 'forum' | 'manual-note'`
  - `sourceType: 'thread' | 'post' | 'comment' | 'video' | 'article' | 'newsletter' | 'note'`
  - `community: string`
  - `author: string`
  - `url: string`
  - `capturedBy: 'manual'`
- `observedAt: string` (ISO 8601 UTC)
- `summary: string`
- `painPoint: string`
- `languageSignals: string[]`
- `operatorFit`
  - `audience: string`
  - `workflow: string`
  - `whyNow: string`
- `scoring`
  - `urgency: number` (0–10)
  - `repeatFrequency: number` (0–10)
  - `buyerClarity: number` (0–10)
  - `dataAvailability: number` (0–10)
  - `localFirstAdvantage: number` (0–10)
  - `total: number`
  - `notes: string`
- `opportunity`
  - `recommendedAction: string`
  - `suggestedReply: string`
  - `riskFlags: string[]`
  - `approvalRequired: boolean`
- `tags: string[]`
- `notes: string`

This file format is **not yet a runtime export**. It is the agreed local storage contract for the manual research loop and should remain backward-compatible unless a migration note is added in the same change set.

## Guardrails (non-negotiable)

1. No autonomous bulk commenting — ever.
2. No auto-send without an `OpportunityDecision` routed through approvals.
3. No evasion behavior for platform anti-spam controls.
4. Per-platform daily engagement caps must be enforced before any outbound action.
5. High-risk opportunities (`riskFlags.length > 0`) auto-route to manual review only; they cannot be bulk-approved.
6. Manual research capture is preferred over live ingestion until the workflow proves repeatable value.

## Module Invariants

1. Social-scout produces recommendations. It does not send.
2. All outbound actions require an approval decision before dispatch.
3. Platform source allowlist is a hard requirement enforced in `validateSourceConfig`.
4. Scoring is deterministic and explainable per opportunity.
5. The local research corpus must stay usable offline and without external credentials.
