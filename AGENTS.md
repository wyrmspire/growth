# AGENTS.md - GrowthOps OS

## Source of Truth

1. `board.md` is the execution source of truth.
2. Module contracts in `modules/*/CONTRACT.md` are interface source of truth.
3. Scope lock is `MVP_SCOPE.md`.

## Start Protocol

1. Read `board.md` before coding.
2. Pick only tasks in READY state.
3. Claim task with agent id + UTC timestamp.
4. Do not work on task already claimed by another agent.

## Ownership Rules

1. One owner per module at a time.
2. Cross-module changes require either:
   - paired task in target module, or
   - integrator approval and board note.

## Doc Sync Rules

When code changes contract behavior, update in same change set:
- `modules/<module>/CONTRACT.md`
- `modules/<module>/ANTI_PATTERNS.md` if new failure mode appears
- `board.md` status and coordination entry

## Definition of Done

- Acceptance tests pass.
- No boundary violations.
- Board task marked DONE with note.
- Relevant docs updated with concrete changes.

## Safety Rules

- No autonomous posting without approval state.
- No autonomous comment sending without review.
- No instructions that encourage platform policy violations.
- Market research collection must use source allowlists and API-first strategy; Playwright fallback only for permitted public pages.
- Genkit strategy agents are advisory and must route through human approval before offer selection.
