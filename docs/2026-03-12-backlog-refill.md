# Growth backlog refill — 2026-03-12

## Why this refill exists

The roadmap brain dump points toward a manual-first research engine, sidecar-style operator tooling, and a local-first pattern library before heavier automation. `growth` already has a mock-safe `Opportunities Inbox`, a `social-scout` contract, and learning/approval infrastructure, but the board was effectively closed out except for blocked adapter work.

This refill keeps the next work practical:
- stay local-first
- prefer manual research capture before API-heavy ingestion
- reuse the existing opportunities/social-scout shape instead of inventing a parallel system
- keep approvals and human-review boundaries intact

## Repo state observed during refill

- `board.md` had no active READY backlog besides blocked outbound/integration tasks.
- `future.md` already defines social scout, approvals, integrations, and Genkit direction.
- `src/pages/opportunities.ts` is still a mock shell.
- `modules/social-scout/` currently defines scoring and config validation, but not a concrete local capture workflow.

## Proposed next bounded tasks

### RESEARCH-1 — local research capture schema and seed dataset
Create a markdown/JSON capture format for manually collected opportunities/signals and seed it with a few example records.

Why first:
- directly matches the roadmap's "manual first, no infra heroics" rule
- gives the opportunities UI something more honest than hard-coded demo cards
- creates a durable local corpus that can later feed scoring and clustering

### RESEARCH-2 — Opportunities Inbox local data loader
Replace hard-coded in-file mock opportunities with a local loader that reads seed research items and renders them in the existing inbox UI.

Why second:
- keeps the current UX shell useful
- exercises the social-scout contract without needing live platform integrations
- preserves mock-safe/local-only behavior

### RESEARCH-3 — sidecar scoring rubric + dashboard bridge
Define a first scoring rubric for opportunity quality and expose a tiny dashboard/read-model summary for captured opportunities.

Why third:
- matches the roadmap requirement to score ideas by urgency/repeat frequency/buyer clarity/data availability/local-first advantage
- turns captured research into operator-facing signal, not just stored notes
- composes with existing analytics/dashboard patterns

## Suggested execution order

1. RESEARCH-1
2. RESEARCH-2
3. RESEARCH-3

## Guardrails for whoever continues

- Keep the workflow local-only and file-backed for now.
- Do not add real outbound posting or live scraping.
- Reuse `social-scout` naming where possible so the research corpus and opportunity inbox converge instead of splitting.
- Keep approvals as the only path toward any outbound action.
- If a task changes module behavior, update the relevant `CONTRACT.md` in the same changeset.
