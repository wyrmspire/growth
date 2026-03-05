# lanes (D).results.md — Comments Send Flow

Sprint: 2026-03-05
Lane: D
Board task: COM-B1

## Completed Work

### modules/comments/src/send.ts

Implemented `sendApprovedReply()` with approval gate + adapter dispatch:

- **Approval Gate**: Uses `@approvals/gate.isApproved(replyId)` to verify approval status before sending
- **Fail Closed**: Returns `APPROVAL_REQUIRED` error if reply is not approved (never auto-sends unapproved replies)
- **Adapter Dispatch**: Routes through `@adapters/reply.sendReply()` for channel-specific delivery
- **Error Handling**: Translates adapter failures to `SEND_FAILED` with original error message

### modules/comments/src/__tests__/send.test.ts

Added 6 focused tests covering:

| Test | Coverage |
|------|----------|
| sends reply when approval exists | Happy path — approved reply dispatches successfully |
| returns APPROVAL_REQUIRED when reply is not approved | Pending state blocks send |
| returns APPROVAL_REQUIRED when reply was rejected | Rejected state blocks send |
| returns APPROVAL_REQUIRED for empty replyId | Input validation |
| includes externalId in successful result | Response mapping |
| maps reply id and approval outcome correctly | Audit data preservation |

## Validation

```
npm run test
# 422 tests passing (6 new)

npm run build
# Build successful
```

## Contract Compliance

- Implements `sendApprovedReply(replyId: EntityId): SendResult` per `modules/comments/CONTRACT.md`
- Errors: `APPROVAL_REQUIRED`, `SEND_FAILED` as specified
- Honors module invariant: "Comments module never auto-sends replies without approval"
- Reply id, approval outcome, and adapter receipt mapping are all testable

## Files Changed

| File | Change |
|------|--------|
| modules/comments/src/send.ts | Created — sendApprovedReply implementation |
| modules/comments/src/__tests__/send.test.ts | Created — 6 focused tests |
| board.md | COM-B1 marked DONE, coordination log updated |

## Next Steps

Lane D scope is complete. COM-B1 is marked DONE in board.md.

Note: The contract specifies `sendApprovedReply(replyId: EntityId): SendResult`, but the implementation takes an additional `context: ReplyDraftContext` parameter to provide the reply body and channel information needed for adapter dispatch. This is a practical necessity since the reply store is not yet implemented. The context parameter may be removed once a persistent reply store is added.
