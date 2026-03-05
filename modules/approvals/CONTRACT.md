# approvals - Contract

Owner: approvals
Depends on: core
Depended on by: publishing, comments, ui

## Exported Types

- ReviewItem
- ReviewDecision
- ReviewBatch
- ApprovalState
- DecideReviewOutcome (union: DecideReviewResult | DecideReviewError)
- CreateReviewBatchOutcome (union: CreateReviewBatchResult | CreateReviewBatchError)
- ReviewItemInput

## Exported Functions

### createReviewBatch(items: ReviewItemInput[]): CreateReviewBatchOutcome
Purpose: Create a review queue for assets or replies. All items start in `pending` state.
Errors: REVIEW_ITEM_INVALID
Invariants:
- Batch must contain at least one item.
- Every item must have a non-empty label.
- Every item `kind` must be `asset`, `reply`, or `offer`.
- On success, returns `{ ok: true, batch: ReviewBatch }`.
- On error, returns `{ ok: false, error: AppError }`.

Implementation: `modules/approvals/src/queue.ts` → `createReviewBatch`

### decideReview(decision: ReviewDecision): DecideReviewOutcome
Purpose: Store a review decision and return the resulting ApprovalState.
Errors: REVIEW_ITEM_NOT_FOUND, REVIEW_DECISION_INVALID
Invariants:
- Approval state transitions are one-way: `pending → approved | rejected`.
- `reopened → approved | rejected` is also permitted.
- `approved` and `rejected` are terminal unless explicitly reopened via `reopenItem`.
- Decision requires non-empty `reviewerId` and `timestamp` (auditable).
- On success, returns `{ ok: true, state, itemId, reviewerId, timestamp }`.
- On error, returns `{ ok: false, error: AppError }`.

Implementation: `modules/approvals/src/decision.ts` → `decideReview`

Signature note: The production function takes a single `ReviewDecision` object (not `(itemId, decision)` as previously documented). The `ReviewDecision` type contains `itemId`, `decision`, `reviewerId`, and `timestamp` fields. The mock layer in `modules/approvals/src/mock.ts` shares the same `ReviewDecision` signature.

### isApproved(itemId: EntityId): boolean
Purpose: Gate check — returns `true` if the item's current approval state is `approved`.
Errors: none (returns `false` for unknown ids)
Invariants:
- Pure read; never mutates state.
- Resolves item from both the queue store and the decision module's local store.
- Used by `publishing` and `comments` to enforce the no-send-without-approval invariant.

Implementation: `modules/approvals/src/gate.ts` → `isApproved`

### reopenItem(itemId: EntityId, reviewerId: string): ReopenResult | ReopenError
Purpose: Explicitly reopen a terminal (approved | rejected) item so it can be re-decided.
Errors: REVIEW_ITEM_NOT_FOUND
Invariants:
- Reviewer identity is required for auditability.
- Sets state to `reopened`; subsequent `decideReview` transitions apply as normal.

Implementation: `modules/approvals/src/decision.ts` → `reopenItem`

## Module Invariants

1. Approvals owns all review state transitions.
2. No send or publish action bypasses an approval check (enforced via `isApproved`).
3. Every decision records reviewer identity and timestamp.
4. State transitions are one-way unless explicitly reopened.
