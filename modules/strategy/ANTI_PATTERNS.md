# strategy - Anti-Patterns

## AP-1: Auto-committing offer strategy
Wrong:
```ts
const selected = ranked[0]
saveApprovedOffer(selected)
```
Why wrong: bypasses human strategic ownership.
Right:
```ts
createOfferReviewItem(ranked)
```

## AP-2: Scraping any site by default
Wrong: unrestricted browser automation against unknown sources.
Why wrong: legal, policy, and reliability risk.
Right: enforce allowlist and API-first source plan.

## AP-3: Opaque recommendations
Wrong: outputting hypotheses with no rationale.
Why wrong: operators cannot trust or audit decisions.
Right: every hypothesis includes reasoning, source links, and constraints used.
