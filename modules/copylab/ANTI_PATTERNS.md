# copylab - Anti-Patterns

## AP-1: Publishing from copylab
Wrong:
```ts
await metaApi.publish(variant)
```
Why wrong: adapters/publishing own provider calls.
Right: return variants to approvals/publishing.

## AP-2: Ignoring brand policy
Wrong: generating copy without policy inputs.
Why wrong: voice drift and compliance risk.
Right: require CopyPolicy for each generation run.
