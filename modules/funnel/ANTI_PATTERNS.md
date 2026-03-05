# funnel - Anti-Patterns

## AP-1: Generating ad copy inside funnel
Wrong:
```ts
plan.steps[0].headline = "Limited offer"
```
Why wrong: copylab owns text generation.
Right:
```ts
const plan = createFunnelPlan(brief)
const variants = generateCopy(plan)
```

## AP-2: Hidden stage transitions
Wrong: implicit transitions not documented in contract.
Why wrong: breaks deterministic flow checks.
Right: all transitions declared and validated.
