# strategy - Contract

Owner: strategy
Depends on: core, analytics, adapters
Depended on by: funnel, copylab, ui

## Exported Types

- DiscoveryInterview
- OfferHypothesis
- OfferProfile
- MarketSignal
- ResearchSourcePlan

## Exported Functions

### captureInterview(input: DiscoveryInterviewInput): DiscoveryInterview
Purpose: Normalize and validate business discovery responses.
Errors: DISCOVERY_INPUT_INVALID
Invariants:
- Interview record is immutable after save; updates create new version.

### generateOfferHypotheses(interview: DiscoveryInterview, constraints: OfferConstraints): OfferHypothesis[]
Purpose: Propose candidate offers, angles, and ICP match options.
Errors: HYPOTHESIS_GENERATION_FAILED
Invariants:
- Each hypothesis includes rationale and confidence score.
- Hypotheses are recommendations, not auto-decisions.

### collectMarketSignals(plan: ResearchSourcePlan): MarketSignal[]
Purpose: Gather comparative market data from allowed sources.
Errors: SIGNAL_SOURCE_DENIED, SIGNAL_COLLECTION_FAILED
Invariants:
- API sources are used before browser automation fallback.
- Signals include source metadata and timestamp.

### rankHypotheses(hypotheses: OfferHypothesis[], signals: MarketSignal[]): OfferHypothesis[]
Purpose: Apply deterministic scoring and ranking.
Errors: HYPOTHESIS_RANKING_INVALID
Invariants:
- Same inputs produce same ranking output.

### Mock-engine note (verified current, DOC-4 audit 2026-03-05)
- `src/mock-engine.ts` currently uses `buildOfferProfile(hypothesis, signals): OfferProfile` from `modules/strategy/src/mock.ts`.
- This helper is intentionally mock-only for the workflow translation layer and is not yet promoted to the formal module contract.

## Module Invariants

1. Strategy owns offer discovery and recommendation logic.
2. Strategy never auto-approves or publishes campaigns.
3. Strategic decisions require explicit human approval.
