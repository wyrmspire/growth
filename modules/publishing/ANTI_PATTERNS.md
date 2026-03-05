# publishing - Anti-Patterns

## AP-1: Dispatch without approval check
Wrong: sending job directly to adapter.
Why wrong: violates safety model.
Right: assert approval state first.

## AP-2: Timezone-unsafe scheduling
Wrong: storing local time with no timezone.
Why wrong: inconsistent publish behavior.
Right: store ISO timestamps and normalize.
