# approvals - Contract

Owner: approvals
Depends on: core
Depended on by: publishing, comments, ui

## Exported Types

- ReviewItem
- ReviewDecision
- ReviewBatch

## Exported Functions

### createReviewBatch(items: ReviewItem[]): ReviewBatch
Purpose: Create review queue for assets or replies.
Errors: REVIEW_ITEM_INVALID

### decideReview(itemId: EntityId, decision: ReviewDecision): ApprovalState
Purpose: Store review decision and resulting state.
Errors: REVIEW_ITEM_NOT_FOUND, REVIEW_DECISION_INVALID
Invariants:
- Decision is auditable.
- Approval state transitions are one-way unless reopened explicitly.

### Temporary mock-engine mismatch note (MCK-A2)
- `src/mock-engine.ts` and `modules/approvals/src/mock.ts` use `decideReview(decision: ReviewDecision): ApprovalState`.
- Contract keeps the legacy `(itemId, decision)` shape for now to avoid breaking downstream in-progress lane docs.

## Module Invariants

1. Approvals owns review state transitions.
2. No send/publish action bypasses approval checks.
3. Every decision records reviewer identity and timestamp.
