# adapters - Anti-Patterns

## AP-1: Business logic in adapter
Wrong: deciding which variant wins inside adapter.
Why wrong: leaks domain decisions into infrastructure.
Right: accept a fully-decided request and execute.

## AP-2: Raw provider payload leakage
Wrong: returning provider-specific schema to UI.
Why wrong: creates lock-in and cross-module coupling.
Right: map to core response types.
