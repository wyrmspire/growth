# analytics

Analytics projects campaign performance from event streams. All functions are
pure read-only projections — no mutations, no side effects.

Depends on: core

## Key Files

- `CONTRACT.md` — exported API surface and invariants
- `src/attribution.ts` — `projectAttribution`
- `src/funnel.ts` — `projectFunnelConversion`
- `src/variants.ts` — `projectVariantPerformance`
- `src/dashboard.ts` — `campaignDashboardReadModel` (primary UI read model)
- `src/mock.ts` — mock-engine translation layer for offline/learning mode
- `src/index.ts` — re-exports all public functions and the `CampaignDashboardReadModel` type

## Tests

- `src/__tests__/attribution.test.ts`
- `src/__tests__/funnel.test.ts`
- `src/__tests__/dashboard.test.ts`
- `src/__tests__/variants.test.ts`
