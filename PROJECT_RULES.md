# PROJECT_RULES.md - GrowthOps OS

## One Rule
If you cannot name the owning module for a piece of logic, do not implement it yet.

## Dependency Hierarchy

core <- (copylab, funnel, approvals, publishing, comments, analytics, adapters)
workflows -> domain modules
ui -> workflows + read-models

## Commandments

1. No circular imports.
2. No direct provider API calls outside adapters.
3. No publish without approval state.
4. No reply send without review state.
5. All cross-module payloads use core types.
6. Contracts before implementation.
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
17. AI recommendations (including Genkit agents) are assistive; human review is required before committing offer strategy.

## Enforcement Strategy

- Lint: restricted imports to enforce boundaries.
- CI: typecheck + tests + boundary checks.
- Board gate: tasks missing file tags or acceptance checks are invalid.
- Refill analysts create drift tasks when contracts and code diverge.
- Market adapter gate: source allowlist and request-rate limits are validated in tests.
