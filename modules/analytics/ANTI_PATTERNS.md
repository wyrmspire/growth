# analytics - Anti-Patterns

## AP-1: Mutating state in projection
Wrong: changing campaign entities while computing metrics.
Why wrong: analytics must be side-effect free.
Right: return derived rows only.

## AP-2: Mixing provider fields directly
Wrong: relying on raw provider metrics schema.
Why wrong: unstable and channel-coupled.
Right: map provider metrics to core event types first.
