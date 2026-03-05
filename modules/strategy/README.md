# strategy

Strategy module handles business discovery, offer hypotheses, and market-signal-assisted ranking.

Depends on: core, analytics, adapters

Key files:
- CONTRACT.md
- src/interview.ts
- src/hypothesis.ts
- src/market-signals.ts

Tests:
- src/__tests__/interview.test.ts
- src/__tests__/hypothesis.test.ts
- src/__tests__/market-signals.test.ts

## NOTE: Future Genkit Integration — Offer Strategist Agent

A Genkit-powered **Offer Strategist** agent is planned to augment `generateOfferHypotheses()` with
higher-quality, AI-assisted hypothesis generation and improved ranking inputs.

**Constraint (non-negotiable):** The agent's output is **assistive only**. It surfaces recommendations
and confidence rationale but does **not** make autonomous decisions. Every hypothesis produced with
AI assistance must pass through human review in the approvals module before it can influence
offer selection or any downstream campaign action.

This integration will use Genkit's flow primitives with a `humanReviewGate()` check before any
agent output is accepted, consistent with the evaluation checklist requirements in `board.md` (BACK-8).

See `CONTRACT.md` for the `generateOfferHypotheses()` invariant: _"Hypotheses are recommendations,
not auto-decisions."_
