# funnel - Contract

Owner: funnel
Depends on: core
Depended on by: copylab, analytics, workflows

## Exported Types

- FunnelStage
- FunnelPlan
- FunnelStepMessage

## Exported Functions

### createFunnelPlan(brief: CampaignBrief): FunnelPlan
Purpose: Build stage sequence and channel mapping from campaign brief.
Errors: FUNNEL_STAGE_INVALID, CTA_MISSING
Invariants:
- Stage order is deterministic.
- Every stage has at least one CTA.

### validateFunnelPlan(plan: FunnelPlan): ValidationResult
Purpose: Guard stage coverage and transition validity.
Errors: FUNNEL_GAP, FUNNEL_TRANSITION_INVALID

## Module Invariants

1. Funnel owns stage ordering rules.
2. Funnel does not generate final copy text.
3. Funnel outputs feed copylab and publishing.
