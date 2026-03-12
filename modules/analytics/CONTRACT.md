# analytics - Contract

Owner: analytics
Depends on: core
Depended on by: ui, workflows

## Exported Types

- AttributionSnapshot
- ConversionFunnelRow
- VariantPerformanceRow
- CampaignDashboardReadModel

## Exported Functions

### projectAttribution(events: DomainEvent[]): AttributionSnapshot
Purpose: Derive channel and campaign metrics from event stream.
Errors: METRIC_EVENT_INVALID
Invariants:
- Pure function — same inputs produce same outputs.
- No mutations or side effects.

Implementation: `modules/analytics/src/attribution.ts` → `projectAttribution`

Mock-engine note: `modules/analytics/src/mock.ts` uses `projectAttribution(events, campaignId)` — the extra `campaignId` argument forces deterministic single-campaign snapshots in local mock flows. The production function is campaign-agnostic and derives campaign identity from the event stream itself.

### projectFunnelConversion(events: DomainEvent[], planId: EntityId): ConversionFunnelRow[]
Purpose: Produce conversion rates per funnel stage for a given plan.
Errors: FUNNEL_PLAN_UNKNOWN
Invariants:
- Pure function — same inputs produce same outputs.
- Returns empty array when no matching funnel events exist for planId.

Implementation: `modules/analytics/src/funnel.ts` → `projectFunnelConversion`

### projectVariantPerformance(events: DomainEvent[]): VariantPerformanceRow[]
Purpose: Compare copy variant outcomes across channels.
Errors: VARIANT_METRIC_INVALID
Invariants:
- Pure function — same inputs produce same outputs.
- Returns empty array when no variant-metric events are present.

Implementation: `modules/analytics/src/variants.ts` → `projectVariantPerformance`

### campaignDashboardReadModel(events: DomainEvent[], planId?: EntityId): CampaignDashboardReadModel
Purpose: Aggregate all analytics projections into a single campaign dashboard read model.
Errors: none (delegates error handling to constituent projections)
Invariants:
- Pure function — same input events produce same output.
- `attribution` is always computed from the full event stream.
- `funnel` is populated when `planId` is provided and matching events exist; otherwise returns an empty array.
- `variants` are populated when variant-metric events are present; otherwise returns an empty array.
- `learning` summarizes `LearningPageViewed` and `LearningActionTracked` events for the guided UI without mutating state.
- Never mutates campaign state.

Return type: `{ attribution: AttributionSnapshot; funnel: ConversionFunnelRow[]; variants: VariantPerformanceRow[]; learning: LearningEngagementSummary }`

### ResearchOpportunityDashboardSummary (local page summary)
Purpose: Summarize the manual research corpus into compact operator-facing signal tiles and a shortlist.
Current source: `data/research/opportunities.seed.json`, rendered directly by the dashboard page while the workflow remains file-backed/local-first.
Current summary fields:
- `totalRecords: number`
- `activeRecords: number` (`new` + `reviewing`)
- `averageScore: number`
- `highestScore: number`
- `platformCounts: Array<{ platform: string; count: number }>`
- `topOpportunities: Array<{ id: string; platform: string; status: string; total: number; painPoint: string; recommendedAction: string }>`

Invariant:
- Advisory only. This summary helps prioritize research follow-up; it does not trigger any outbound action or automatic product decision.

Implementation: `modules/analytics/src/dashboard.ts` → `campaignDashboardReadModel`

## Module Invariants

1. Analytics is read-only and projection-based.
2. No analytics function mutates campaign state.
3. Same input events always produce same outputs (deterministic).
4. `campaignDashboardReadModel` is the primary UI read model for the dashboard page.
