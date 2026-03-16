# adapters - Anti-Patterns

## AP-1: Business logic in adapter
Wrong: deciding which variant wins inside adapter.
Why wrong: leaks domain decisions into infrastructure.
Right: accept a fully-decided request and execute.

## AP-2: Raw provider payload leakage
Wrong: returning provider-specific schema to UI.
Why wrong: creates lock-in and cross-module coupling.
Right: map to core response types.

## AP-3: Credential value leakage  _(ADAPT-2)_
Wrong: returning `PlatformCredential.value` from any function that leaves `modules/adapters/src/`.
Why wrong: exposes tokens to UI, domain modules, or mock-engine — violates the secrets boundary.
Right: return `PlatformAvailability` (boolean + reason string) for any cross-boundary communication about credential state.
