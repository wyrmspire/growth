# PROJECT_RULES.md — GrowthOps OS

## One Rule
If you cannot name the owning module for a piece of logic, do not implement it yet.

## Dependency Hierarchy

```
core <- (copylab, funnel, approvals, publishing, comments, analytics, adapters)
workflows -> domain modules
ui -> mock-engine -> modules/*/src/mock.ts   [mock mode]
ui -> workflows + read-models                [production mode]
```

## Commandments

1. No circular imports.
2. No direct provider API calls outside adapters.
3. No publish without approval state (`approvals.isApproved()` must return `true`).
4. No reply send without review state (`approvals.isApproved()` must return `true`).
5. All cross-module payloads use core types.
6. Contracts before implementation — update `modules/<name>/CONTRACT.md` before shipping code changes.
7. Every state-changing action emits an event.
8. Read-model logic must be deterministic.
9. No hidden global mutable state.
10. Module owners do not edit other modules directly.
11. Each board task must point to exact files.
12. Every done task includes acceptance evidence.
13. Doc updates are required in same change set for contract changes.
14. Unsafe automation requests are downgraded to review-required actions.
15. Platform policy constraints are treated as hard requirements.
16. Market data collection must be API-first and policy-compliant; browser automation is fallback only for permitted sources.
17. AI recommendations (including Genkit agents) are assistive; human review is required before committing offer strategy, copy, or any outbound action.
18. OAuth tokens and secrets are encrypted at rest; token values never appear in module contracts, UI state, or browser storage.
19. Social-scout sends nothing autonomously; all accepted opportunities must have an `OpportunityDecision` routed through approvals before dispatch.
20. Per-platform daily engagement caps are enforced in settings and cannot be overridden at runtime.
21. Approved copy snippets retrieved for copy-memory context are input only; human must review all generated output before approval.

## Issue Logging Requirements

Every running agent or workflow must record material issues in the board's
**Run Issues Log**. An issue is material if it:
- reveals a contract divergence between `CONTRACT.md` and actual code,
- causes a test failure or build regression,
- uncovers a missing guard, unsafe approval bypass, or missing event emission, or
- blocks a task from reaching DONE.

If a run has **no** material issues, explicitly write `no material issues found`
in the Coordination Log entry for that task. Do not leave the log silent.

## Guard Script Expectations

Three guard scripts exist and must remain runnable from a clean local checkout:

| Script | npm command | Guards |
|---|---|---|
| `scripts/drift-check.ts` | `npm run check:drift` | CONTRACT.md vs code divergence |
| `scripts/lint-boundaries.ts` | `npm run check:boundaries` | disallowed cross-module imports |
| `npm run smoke:mock` | `npm run smoke:mock` | mock-engine round-trip correctness |

Prerequisite: `tsx` must be installed and wired into `package.json` (tracked: `OPS-1`).
Guard scripts are expected to pass before any task is marked DONE.

## Non-Autonomous AI Boundary

GrowthOps OS uses Genkit for offer strategy coaching and copy suggestions.
The following constraints are hard requirements — not guidelines:

1. **No AI output is committed without human approval.** Every Genkit flow result
   must pass through `approvals.createReviewBatch` + `approvals.decideReview`.
2. **No offer strategy is auto-selected.** `strategy.generateOfferHypotheses` and
   `strategy.rankHypotheses` are advisory. The operator chooses.
3. **No autonomous posting.** No content reaches an outbound adapter without an
   explicit `approvals.isApproved()` check returning `true`.
4. **UI must label AI-generated content.** Every AI-assisted output must be
   visually marked as advisory and pending review (tracked: `OPS-4`).
5. **Genkit evaluation gates.** Quality, safety, tone, and factuality checks run
   before any AI output is surfaced to the operator for approval.

## Enforcement Strategy

- Lint: restricted imports to enforce boundaries (`scripts/lint-boundaries.ts`).
- CI: typecheck + tests + boundary checks.
- Board gate: tasks missing file tags or acceptance checks are invalid.
- Refill analysts create drift tasks when contracts and code diverge.
- Market adapter gate: source allowlist and request-rate limits are validated in tests.
- Issue log gate: every run must produce a Coordination Log entry; material issues
  go into the Run Issues Log immediately when discovered.
