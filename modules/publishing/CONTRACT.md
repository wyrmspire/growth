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

### Mock-engine note (verified current, DOC-4 audit 2026-03-05)
- `src/mock-engine.ts` and `modules/publishing/src/mock.ts` currently call `scheduleAsset(assetId, assetLabel, runAt, channel)`.
- The extra `assetLabel` parameter is mock-layer metadata used for calendar readability in the UI.

### dispatchToChannel(jobId: EntityId, assetId: EntityId, channel: ChannelName, content: string, scheduledAt: string): DispatchResponse
Purpose: Core router mapping a publish job to the target adapter while enforcing the approval gate.
Errors: APPROVAL_MISSING, PUBLISH_FAILED, PUBLISH_ERROR, ADAPTER_NOT_CONFIGURED
Invariants:
- Uses `Registry.getAdapter()` to dispatch.
- Halts with `APPROVAL_MISSING` if `approvals.isApproved(assetId)` fails.

### dispatchDue(now: string): PublishDispatchResult[]
Purpose: Wrapper that scans the calendar and fires `dispatchToChannel` for all due approved jobs.
Errors: DISPATCH_FAILED
Invariants:
- Only approved jobs are dispatched.
- Dispatch is idempotent by job ID.

## Module Invariants

1. Publishing enforces approval gate before any dispatch.
2. Publishing triggers adapter calls but does not own adapter internals.
3. All dispatch outcomes append events for analytics.
