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
