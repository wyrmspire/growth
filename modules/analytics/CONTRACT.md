# analytics - Contract

Owner: analytics
Depends on: core
Depended on by: ui, workflows

## Exported Types

- AttributionSnapshot
- ConversionFunnelRow
- VariantPerformanceRow

## Exported Functions

### projectAttribution(events: DomainEvent[]): AttributionSnapshot
Purpose: Derive channel and campaign metrics from event stream.
Errors: METRIC_EVENT_INVALID

### Temporary mock-engine mismatch note (MCK-A2)
- `src/mock-engine.ts` and `modules/analytics/src/mock.ts` use `projectAttribution(events, campaignId)` to force deterministic single-campaign snapshots in local mock flows.
- Contract remains campaign-agnostic for production projection API shape.

### projectFunnelConversion(events: DomainEvent[], planId: EntityId): ConversionFunnelRow[]
Purpose: Produce conversion rates per funnel stage.
Errors: FUNNEL_PLAN_UNKNOWN

### projectVariantPerformance(events: DomainEvent[]): VariantPerformanceRow[]
Purpose: Compare copy variant outcomes.
Errors: VARIANT_METRIC_INVALID

## Module Invariants

1. Analytics is read-only and projection-based.
2. No analytics function mutates campaign state.
3. Same input events produce same outputs.
