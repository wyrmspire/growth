# social-scout — Contract

Owner: social-scout
Depends on: core
Depended on by: approvals (receives opportunity → engagement decisions)

## Purpose

This module owns the data model and business logic for slow-batch social opportunity discovery. It surfaces scored conversation threads from approved platforms for human review and optional reply drafting.

**It does not send anything autonomously.** Every accepted opportunity routes to the approval workflow before any outbound action.

## Exported Types

- `ScoutSourceConfig`
  - `platform: 'reddit' | 'x' | 'facebook' | 'instagram'`
  - `sourceId: string`
  - `query: string`
  - `enabled: boolean`
  - `scanIntervalMinutes: number`

- `ScoutRun`
  - `id: string`
  - `startedAt: string` (ISO 8601 UTC)
  - `completedAt?: string`
  - `platform: string`
  - `status: 'running' | 'completed' | 'failed'`
  - `itemsFound: number`

- `OpportunityItem`
  - `id: string`
  - `platform: string`
  - `sourceUrl: string`
  - `author: string`
  - `contentSnippet: string`
  - `score: number` (0–100)
  - `scoreBreakdown: { relevance: number; engagementPotential: number; recency: number }`
  - `riskFlags: string[]`

- `SuggestedEngagement`
  - `opportunityId: string`
  - `draftComment: string`
  - `toneProfile: string`
  - `confidence: number` (0–1)
  - `policyChecks: string[]`

- `OpportunityDecision`
  - `opportunityId: string`
  - `decision: 'approved_for_reply' | 'skipped' | 'muted_source'`
  - `reviewerId: string`
  - `timestamp: string`
  - `notes?: string`

## Exported Functions

### scoreOpportunity(item: OpportunityItem): number
Purpose: Return a composite score (0–100) from relevance, engagement potential, and recency sub-scores.
Errors: SCORE_INPUT_INVALID
Invariants:
- Deterministic for same inputs.
- High-risk items (riskFlags.length > 0) are capped at 50 regardless of sub-scores.

### validateSourceConfig(config: ScoutSourceConfig): ValidationResult
Purpose: Confirm scan intervals, platform allowlist, and query safety before enabling a source.
Errors: SOURCE_PLATFORM_NOT_ALLOWED, SCAN_INTERVAL_TOO_SHORT, QUERY_INVALID
Invariants:
- Minimum scan interval is 15 minutes.
- Platform must be in the explicit allowlist.

## Guardrails (non-negotiable)

1. No autonomous bulk commenting — ever.
2. No auto-send without an `OpportunityDecision` with `decision: 'approved_for_reply'` routed through approvals.
3. No evasion behavior for platform anti-spam controls.
4. Per-platform daily engagement caps must be enforced before any outbound action.
5. High-risk opportunities (`riskFlags.length > 0`) auto-route to manual review only; they cannot be bulk-approved.

## Module Invariants

1. Social-scout produces recommendations. It does not send.
2. All outbound actions require an approval decision before dispatch.
3. Platform source allowlist is a hard requirement enforced in `validateSourceConfig`.
4. Scoring is deterministic and explainable per opportunity.
