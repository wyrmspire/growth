# lanes.md — Next Sprint: 5 Parallel Lanes

Sprint start: 2026-03-05
Source: `board.md` remaining READY tasks + newly unblocked tasks
All lanes are independent — zero cross-lane blockers.

---

## Lane A — Copylab: Variant Generation + Scoring

**Modules:** copylab, (reads from funnel)
**Docs to read first:** `modules/copylab/CONTRACT.md`, `modules/funnel/CONTRACT.md`, `DATA_FLOW.md`, `PRODUCT_DESIGN.md`
**Why this lane:** FUN-A1 is DONE, so COPY-A1 is unblocked. All 4 copylab tasks can run sequentially.

### Tasks

| ID | Task | File | Test | Status |
|---|---|---|---|---|
| COPY-A1 | Implement `generateVariants()` using funnel stage inputs and channel policy | `modules/copylab/src/generate.ts` | `modules/copylab/src/__tests__/generate.test.ts` | READY |
| COPY-A2 | Create policy schema and default policy set versioning | `modules/copylab/src/policy.ts` | `modules/copylab/src/__tests__/policy.test.ts` | READY |
| COPY-B1 | Implement deterministic `scoreVariants()` rule scoring | `modules/copylab/src/score.ts` | `modules/copylab/src/__tests__/score.test.ts` | READY |
| COPY-B2 | Build channel formatter for Meta, LinkedIn, X text constraints | `modules/copylab/src/format.ts` | `modules/copylab/src/__tests__/format.test.ts` | READY |

### Acceptance

- `npm run test -- modules/copylab` — all tests pass
- `generateVariants()` accepts a `CampaignBrief` + `FunnelPlan` and returns `ChannelVariantSet`
- `scoreVariants()` returns deterministic scores based on policy rules
- No imports from outside `core` and `funnel`

---

## Lane B — Gate Integration + Publishing Pipeline

**Modules:** approvals (gate), publishing (gate + dispatch), adapters (comments IO)
**Docs to read first:** `modules/approvals/CONTRACT.md`, `modules/publishing/CONTRACT.md`, `modules/adapters/CONTRACT.md`, `DATA_FLOW.md` (Flow B: Approval → Publish)
**Why this lane:** APP-A2 is DONE → APP-B1 is unblocked → PUB-A2 unblocked. ADP-A2 is DONE → PUB-B1 unblocked.

### Tasks (sequential — dependency chain)

| ID | Task | File | Test | Status |
|---|---|---|---|---|
| APP-B1 | Expose `isApproved(itemId)` read helper | `modules/approvals/src/gate.ts` | `modules/approvals/src/__tests__/gate.test.ts` | READY (was blocked by APP-A2, now unblocked) |
| PUB-A2 | Add approval gate check before calendar write | `modules/publishing/src/schedule.ts` | `modules/publishing/src/__tests__/approval-check.test.ts` | READY after APP-B1 |
| PUB-B1 | Implement `dispatchDue(now)` idempotent dispatch | `modules/publishing/src/dispatch.ts` | `modules/publishing/src/__tests__/dispatch.test.ts` | READY (was blocked by ADP-A2, now unblocked) |
| PUB-B2 | Emit dispatch outcome events for analytics | `modules/publishing/src/dispatch-events.ts` | `modules/publishing/src/__tests__/dispatch-events.test.ts` | READY after PUB-B1 |
| ADP-B1 | Implement `ingestComments()` mock pull stream | `modules/adapters/src/comments-ingest.ts` | `modules/adapters/src/__tests__/ingest.test.ts` | READY |
| ADP-B2 | Implement `sendReply()` normalized receipt mapping | `modules/adapters/src/reply.ts` | `modules/adapters/src/__tests__/reply.test.ts` | READY |

### Acceptance

- `npm run test -- modules/approvals modules/publishing modules/adapters` — all tests pass
- `isApproved()` returns boolean from review store
- `scheduleAsset()` rejects unapproved items
- `dispatchDue()` is idempotent — calling twice with same `now` dispatches once
- Dispatch events conform to `DomainEvent` envelope from core

---

## Lane C — Comments Module: Triage, Draft, Send

**Modules:** comments
**Docs to read first:** `modules/comments/CONTRACT.md`, `DATA_FLOW.md` (Flow C: Comment Ops), `PRODUCT_DESIGN.md` (signature moment: comment handling)
**Why this lane:** COM-A1 and COM-A2 are READY. COM-B1 becomes READY once Lane B completes APP-B1 and ADP-B2 — start with A tasks, then B.

### Tasks

| ID | Task | File | Test | Status |
|---|---|---|---|---|
| COM-A1 | Implement `triageComment()` intent buckets (lead, objection, support, spam) | `modules/comments/src/triage.ts` | `modules/comments/src/__tests__/triage.test.ts` | READY |
| COM-A2 | Implement `draftReply()` with reply policy application | `modules/comments/src/draft.ts` | `modules/comments/src/__tests__/draft.test.ts` | READY |
| COM-B1 | Implement `sendApprovedReply()` approval gate + adapter dispatch | `modules/comments/src/send.ts` | `modules/comments/src/__tests__/send.test.ts` | READY after APP-B1 + ADP-B2 from Lane B |

### Acceptance

- `npm run test -- modules/comments` — all tests pass
- `triageComment()` returns one of: `lead`, `support`, `objection`, `spam`
- `draftReply()` respects policy (max length, tone, no spam replies)
- `sendApprovedReply()` asserts approval gate AND dispatches through adapter
- No imports from outside `core`, `approvals`, `adapters`

---

## Lane D — Analytics: Projections + Dashboard

**Modules:** analytics
**Docs to read first:** `modules/analytics/CONTRACT.md`, `DATA_FLOW.md` (Flow D: Attribution), `modules/core/CONTRACT.md` (DomainEvent shape)
**Why this lane:** AN-A1 is READY. FUN-A1 DONE → AN-A2 unblocked. COPY-B1 (Lane A) unblocks AN-A3. Start with AN-A1 + AN-A2, then AN-A3 after Lane A, then AN-B1.

### Tasks (partial dependency on Lane A for AN-A3)

| ID | Task | File | Test | Status |
|---|---|---|---|---|
| AN-A1 | Implement `projectAttribution(events)` campaign/channel rollups | `modules/analytics/src/attribution.ts` | `modules/analytics/src/__tests__/attribution.test.ts` | READY |
| AN-A2 | Implement funnel conversion projection by stage | `modules/analytics/src/funnel.ts` | `modules/analytics/src/__tests__/funnel.test.ts` | READY (FUN-A1 done) |
| AN-A3 | Implement variant performance projection | `modules/analytics/src/variants.ts` | `modules/analytics/src/__tests__/variants.test.ts` | READY after COPY-B1 (Lane A) |
| AN-B1 | Build `campaignDashboardReadModel()` aggregator | `modules/analytics/src/dashboard.ts` | `modules/analytics/src/__tests__/dashboard.test.ts` | READY after AN-A1 + AN-A2 |

### Acceptance

- `npm run test -- modules/analytics` — all tests pass
- Attribution rollup groups events by campaign and channel
- Funnel projection returns conversion rates per stage
- Dashboard read model merges attribution + funnel + variant data
- All projections are pure functions over `DomainEvent[]` — no side effects

---

## Lane E — Funnel Validation + Strategy Signals + Integration Infra

**Modules:** funnel (validation), strategy (market signals), backlog infra
**Docs to read first:** `modules/funnel/CONTRACT.md`, `modules/strategy/CONTRACT.md`, `board.md` (Backlog section), `PROJECT_RULES.md`
**Why this lane:** FUN-B1 is unblocked (FUN-A1 done). STR-B1 is READY. Backlog infra tasks are independent.

### Tasks

| ID | Task | File | Test | Status |
|---|---|---|---|---|
| FUN-B1 | Implement `validateFunnelPlan()` coverage and transition checks | `modules/funnel/src/validate.ts` | `modules/funnel/src/__tests__/validate.test.ts` | READY |
| FUN-B2 | Add funnel plan serializer for workflow handoff payloads | `modules/funnel/src/serialize.ts` | `modules/funnel/src/__tests__/serialize.test.ts` | READY |
| STR-B1 | Implement source allowlist and rate-limit policy for market signals | `modules/strategy/src/sources.ts` | `modules/strategy/src/__tests__/sources.test.ts` | READY |
| BACK-1 | Add integration workflow tests for launch flow (brief → copy → approval → schedule) | `scripts/integration/launch-flow.test.ts` | — | READY |
| BACK-2 | Add board drift checker script (CI fails when contract functions missing impl) | `scripts/drift-check.ts` | — | READY |
| BACK-3 | Add import-boundary lint rules mapped to module ownership | `scripts/lint-boundaries.ts` | — | READY |

### Acceptance

- `npm run test -- modules/funnel modules/strategy` — all tests pass
- `validateFunnelPlan()` catches missing stages and invalid transitions
- Source allowlist limits which URLs can be scraped
- Integration test exercises the full brief → copy → approval → schedule flow
- Drift checker exits non-zero when a CONTRACT.md function has no matching export
- Boundary lint exits non-zero when a module imports from a disallowed peer

---

## Cross-Lane Dependencies

```
Lane A (copylab) ──COPY-B1──▶ Lane D (AN-A3)
Lane B (APP-B1 + ADP-B2) ──▶ Lane C (COM-B1)
```

All other tasks within each lane are fully independent.

## How to Run All Tests

```bash
npm install
npm run test
```
