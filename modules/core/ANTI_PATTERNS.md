# core - Anti-Patterns

## AP-1: Domain logic in core
Wrong:
```ts
// core should not own campaign strategy behavior
export function pickWinningAdVariant(...) { ... }
```
Why wrong: core is shared contracts, not optimization logic.
Right:
```ts
// copylab or analytics owns this behavior
```

## AP-2: Re-exporting external SDK types
Wrong:
```ts
export type MetaSdkPost = ProviderSdk.Post
```
Why wrong: leaks provider internals across all modules.
Right:
```ts
export interface PublishReceipt { ... }
```
