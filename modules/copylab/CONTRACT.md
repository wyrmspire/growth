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
- Enforces platform-specific character limits configured via `CopyPolicy` or `ChannelStyleOverride`.
- Truncates oversized copy with an ellipsis string ('...') resulting in a maximum length less than or equal to the channel's allowed limit.
- Pushes string explanations of any truncation to the `warnings` array of the respective `CopyVariant`.

### Mock-engine note (verified current, DOC-4 audit 2026-03-05)
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

## Future functions (staged in FUT-1, FUT-4 — not yet implemented)

### buildInstructionPack(brief: CampaignBrief, styleProfileId: string): CampaignInstructionPack
Purpose: Compile style profile + channel overrides + compliance rules into a single instruction pack for the copy generation pipeline.
Invariants:
- Only approved style profiles may be used.
- Instruction packs are versioned for audit.

### validateAgainstStylePack(variant: CopyVariant, pack: CampaignInstructionPack): GeneratedCopyAudit
Purpose: Check a generated variant against the instruction pack and return a scored audit with any violations.
Invariants:
- Hard policy violations block approval.
- Soft violations are surfaced as warnings only.
- Deterministic for same inputs.

### retrieveApprovedSnippets(campaignId: string, channel: string): ApprovedCopySnippet[] (FUT-4 — copy-memory)
Purpose: Retrieve previously-approved copy snippets for a campaign and channel to provide context before generating new variants.
Invariants:
- Only approved-state snippets are returned.
- Used as input context to generation, not as final output.
- Human still reviews all generated output before approval.
