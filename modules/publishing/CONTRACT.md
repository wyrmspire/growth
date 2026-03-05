# publishing - Contract

Owner: publishing
Depends on: core, approvals, adapters
Depended on by: ui, analytics

## Exported Types

- PublishCalendarEntry
- PublishDispatchResult

## Exported Functions

### scheduleAsset(assetId: EntityId, runAt: string, channel: string): PublishCalendarEntry
Purpose: Create scheduled publish record.
Errors: APPROVAL_REQUIRED, SCHEDULE_TIME_INVALID

### dispatchDue(now: string): PublishDispatchResult[]
Purpose: Dispatch all due approved jobs.
Errors: DISPATCH_FAILED
Invariants:
- Only approved jobs are dispatched.
- Dispatch is idempotent by job ID.

## Module Invariants

1. Publishing enforces approval gate before any dispatch.
2. Publishing triggers adapter calls but does not own adapter internals.
3. All dispatch outcomes append events for analytics.
