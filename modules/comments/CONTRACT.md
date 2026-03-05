# comments - Contract

Owner: comments
Depends on: core, approvals, adapters
Depended on by: ui, analytics

## Exported Types

- CommentQueueItem
- ReplyDraft
- ReplyPolicy

## Exported Functions

### triageComment(comment: CommentRecord): CommentQueueItem
Purpose: Classify comment intent and priority.
Errors: COMMENT_INVALID

### draftReply(item: CommentQueueItem, policy: ReplyPolicy): ReplyDraft
Purpose: Create response candidates with policy constraints.
Errors: REPLY_POLICY_INVALID

### sendApprovedReply(replyId: EntityId): SendResult
Purpose: Send only approved replies through adapters.
Errors: APPROVAL_REQUIRED, SEND_FAILED

## Module Invariants

1. Comments module never auto-sends replies without approval.
2. Draft replies include confidence/explanation metadata.
3. Triage classification is auditable for later tuning.
