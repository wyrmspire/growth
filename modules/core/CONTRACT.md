# core - Contract

Owner: core
Depends on: none
Depended on by: all modules

## Exported Types

- EntityId
- CampaignBrief
- CopyVariant
- ApprovalState
- PublishJob
- CommentRecord
- CommentIntent
- CampaignMetricRow
- AppError

### Future types (staged in FUT-1, FUT-4 — not yet implemented)

- `StyleProfile` — `{ id, name, tone, formality, clarity, ctaIntensity, readingLevel, bannedTerms[], requiredPhrases[], allowedClaims[] }`
- `ChannelStyleOverride` — `{ channel, maxLength, emojiPolicy, hashtagPolicy, lineBreakPolicy }`
- `CampaignInstructionPack` — `{ campaignId, styleProfileId, channelOverrides[], complianceRules[] }`
- `GeneratedCopyAudit` — `{ variantId, styleProfileId, policyVersion, violations[], score }`
- `ApprovedCopySnippet` — `{ id, variantId, campaignId, channel, text, approvedAt, styleProfileId }` (copy-memory, FUT-4)
- `ScoutSourceConfig`, `ScoutRun`, `OpportunityItem`, `SuggestedEngagement`, `OpportunityDecision` — see `modules/social-scout/CONTRACT.md` (FUT-3)

## Exported Functions

### validateCampaignBrief(input: CampaignBriefInput): ValidationResult
Purpose: Validate canonical campaign brief shape.
Errors: BRIEF_INVALID_FIELDS, BRIEF_MISSING_CHANNEL
Invariants:
- Returns normalized brief on success.
- Never mutates caller input.

### newEntityId(prefix: string): EntityId
Purpose: Create stable typed IDs for domain entities.
Errors: ID_PREFIX_INVALID
Invariants:
- Prefix must be known type.
- Returned ID is globally unique within project scope.

### assertApprovalState(state: ApprovalState, required: ApprovalState): Result
Purpose: Gate actions behind required review state.
Errors: APPROVAL_STATE_MISMATCH
Invariants:
- Used by publishing and comments before send actions.

## Module Invariants

1. Core owns shared cross-module types.
2. Core has no dependency on domain modules.
3. All domain boundary payloads map to core types.
