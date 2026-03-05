# copylab - Contract

Owner: copylab
Depends on: core, funnel
Depended on by: approvals, publishing

## Exported Types

- CopyRequest
- CopyPolicy
- ChannelVariantSet

## Exported Functions

### generateVariants(request: CopyRequest): ChannelVariantSet
Purpose: Produce channel-ready copy variants for each funnel step.
Errors: COPY_POLICY_VIOLATION, CHANNEL_UNSUPPORTED
Invariants:
- Returns at least one variant per requested channel.
- Tags output with policy version.

### Temporary mock-engine mismatch note (MCK-A2)
- `src/mock-engine.ts` currently imports `modules/copylab/src/mock.ts` and calls `generateVariants(brief, plan)`.
- Contract and production path support `generateVariants(request: CopyRequest)`; mock translation layer keeps the two-argument form for backward compatibility in UI wiring.

### scoreVariants(set: ChannelVariantSet): VariantScore[]
Purpose: Rank variants by rule-based quality checks.
Errors: SCORE_INPUT_INVALID
Invariants:
- Scoring is deterministic for same inputs.

## Module Invariants

1. Copylab owns prompt/policy and variant generation.
2. Copylab does not approve or publish assets.
3. Every variant must include provenance metadata.
