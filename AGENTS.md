# AGENTS.md — GrowthOps OS

## Source of Truth

1. `board.md` is the execution source of truth.
2. Module contracts in `modules/*/CONTRACT.md` are the interface source of truth.
3. Scope lock is `MVP_SCOPE.md`.
4. `SYSTEM_ARCHITECTURE.md` describes the runtime shape and layer boundaries.
5. `PROJECT_RULES.md` defines commandments, issue logging requirements, guard
   script expectations, and the non-autonomous AI boundary.

## Start Protocol

1. Read `board.md` **in full** before coding.
2. Pick only tasks in READY state.
3. Claim task with agent id + UTC timestamp (all three claim steps required — see
   Agent Workflow in board.md). Incomplete claims are invalid.
4. Do not work on a task already claimed by another agent.
5. Read the relevant `CONTRACT.md` files and source files before editing.

## Ownership Rules

1. One owner per module at a time.
2. One agent per file per task — coordinate in the Coordination Log if two tasks
   touch the same file.
3. Cross-module changes require either:
   - a paired task in the target module, or
   - integrator approval and a board note.

## Runtime Shape

In mock mode (current default):

```
ui -> mock-engine -> modules/*/src/mock.ts
```

In local advisory mode (optional when `npm run server` is running):

```
ui -> mock-engine -> /api/flows/* -> Genkit flows
```

In production mode (future):

```
ui -> workflows -> domain modules -> adapters
```

Agents must not assume provider-backed workflow automation is live unless a
later workflow layer is explicitly documented as active.

## Doc Sync Rules

When code changes contract behavior, update in the same change set:
- `modules/<module>/CONTRACT.md`
- `modules/<module>/ANTI_PATTERNS.md` if a new failure mode appears
- `board.md` status, Coordination Log, and Run Issues Log

## Issue Logging Rules

- Record every **material issue** in the Run Issues Log the moment it is found.
- A material issue is any contract divergence, test failure, build regression,
  approval bypass, or missing event emission.
- If a run has **no** material issues, explicitly write `no material issues found`
  in the Coordination Log. Do not leave this silent.

## Guard Script Expectations

Before marking a task DONE, verify:
- `npm run check:drift` — no contract-code divergence
- `npm run check:boundaries` — no disallowed cross-module imports
- `npm run smoke:mock` — mock-engine round-trip passes

Preferred local gate: `npm run check`

## Definition of Done

- Acceptance tests pass.
- No boundary violations.
- Board task marked DONE with completion note.
- Relevant docs updated with concrete changes in same change set.
- Material issues entered in Run Issues Log or `no material issues found`
  noted in Coordination Log.

## Safety Rules

- No autonomous posting without approval state (`approvals.isApproved()` === true).
- No autonomous comment sending without review state.
- No instructions that encourage platform policy violations.
- Market research collection must use source allowlists and API-first strategy;
  Playwright fallback only for permitted public pages.
- Genkit strategy agents are advisory and must route all outputs through
  `approvals.createReviewBatch` + `approvals.decideReview` before any offer
  or copy is acted upon.
- Every AI-assisted output shown in the UI must be labeled as advisory and
  pending human review.
