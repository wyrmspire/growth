# board.md - GrowthOps OS Execution Board

Last refill: 2026-03-04
Initial active tasks: 36 (recovery pass added 10 learning-mode tasks)
Capacity: 100%
Global waterline: 13 ready tasks remaining
Per-lane reserve: ready tasks in each active lane must stay >= (active agents in lane * 2)

## Product Intent Lock

This board builds an internal beginner-friendly marketing coach and execution system.
Primary use: run campaigns for your own business or client businesses while learning the process.
Not in scope: positioning this as a product sold to marketers.

## Claim State Machine

Task status values:
- READY
- CLAIMED
- IN_PROGRESS
- REVIEW
- DONE
- BLOCKED

Valid claim requires all three:
1. Task marked CLAIMED with agent id and UTC timestamp
2. Owner field updated for that task
3. Short claim note in Coordination Log

If any part is missing, claim is invalid and coding must not start.

## Agent Workflow

When picking up a task:
1. Change `[ ]` to `[/]` and status tag to `[CLAIMED]`. Add your agent id and UTC timestamp.
2. Update the module Owner field if unassigned.
3. Add a one-line claim note to the Coordination Log.

When starting work:
4. Change status tag to `[IN_PROGRESS]`.

When hitting a blocker:
5. Change status tag to `[BLOCKED by <reason>]`. Add a note to the Coordination Log explaining the issue and what you tried.

When finished:
6. Change `[/]` to `[x]` and status tag to `[DONE]`.
7. Add a completion note to the Coordination Log including any issues encountered, contract mismatches found, or deviations from the original task spec.

## Definition of Ready

A task is READY only if:
- It points to exact file paths.
- It has acceptance criteria.
- Contract section reference is included.
- Dependencies are satisfied.

## Definition of Done

A task is DONE only if:
- Acceptance test passes.
- Module contract remains accurate or updated in same change set.
- Board status and Coordination Log are updated.

## Agent Roster

| Agent | Role | Current Module | Status |
|---|---|---|---|
| agent-1 | Builder | core | Active |
| agent-2 | Builder | funnel | Active |
| agent-3 | Builder | copylab | Active |
| agent-4 | Refill Analyst | - | Standby |
| agent-5 | Integrator | - | Periodic checks |

---

## Active Sprint

### Module: learning-ui
Owner: agent-5 (Lane 5, 2026-03-05T05:53:00Z)
Layer: ui
Depends on: mock-engine, glossary

#### Lane A - Foundations [IN_PROGRESS]
- [x] LUI-A1 [DONE] Create marketing glossary with plain-language tooltips. -> `src/glossary.ts`
- [x] LUI-A2 [DONE] Create tooltip component with hover behavior and helper wrapper. -> `src/components/tooltip.ts`
- [x] LUI-A3 [DONE] Create initial design system CSS for learning mode UI. -> `src/index.css`

#### Lane B - Guided Pages [IN_PROGRESS]
- [x] LUI-B1 [DONE] Create 6 guided pages (discovery, launcher, review, calendar, comments, dashboard). -> `src/pages/discovery.ts`, `src/pages/launcher.ts`, `src/pages/review.ts`, `src/pages/calendar.ts`, `src/pages/comments.ts`, `src/pages/dashboard.ts`
- [x] LUI-B2 [DONE] Create main entry and page router/navigation shell. -> `src/main.ts`, `index.html`
- [x] LUI-B3 [DONE] Add persistent page-level note: "You are creating campaigns for your business/client, not selling this software." -> `src/main.ts`, `src/pages/*.ts`

#### Lane C - Beginner Coaching UX [DONE]
- [x] LUI-C1 [DONE] Add first-run checklist showing 6-step journey and current step progress. -> `src/main.ts`, `src/index.css`
- [x] LUI-C2 [DONE] Add "What does this mean?" quick-help drawer linked to glossary keys on each page. -> `src/components/help-drawer.ts`, `src/main.ts`
- [x] LUI-C3 [DONE] Fix mobile tooltip behavior so tooltips are hover-only on pointer-fine devices. Tests: `src/components/__tests__/tooltip.test.ts` -> `src/components/tooltip.ts` | owner: copilot | done: 2026-03-05T17:34:00Z

---

### Module: mock-engine
Owner: copilot (Lane A, 2026-03-05T19:55:00Z)
Layer: workflows
Depends on: core, strategy, funnel, copylab, approvals, adapters, publishing, comments, analytics

#### Lane A - Translation Layer [DONE]
- [x] MCK-A1 [DONE] Create local translation layer connecting UI flows to module mock functions. -> `src/mock-engine.ts`
- [x] MCK-A2 [DONE] Reconcile function signatures against module CONTRACT docs and record temporary mismatches. -> `src/mock-engine.ts`, `modules/*/CONTRACT.md`
- [x] MCK-A3 [DONE] Add local smoke script for end-to-end mock flow (discovery -> launch -> review -> calendar -> comments -> dashboard). -> `scripts/smoke-mock.ts` | owner: copilot | done: 2026-03-05T20:00:00Z

---

### Module: core
Owner: agent-1
Layer: core
Depends on: none

#### Lane A - Types and Validation [DONE]
- [x] CORE-A1 [DONE] Define canonical entities and errors from core contract section Exported Types. Tests: `modules/core/src/__tests__/types.test.ts` -> `modules/core/src/types.ts` | 2026-03-05T06:00Z
- [x] CORE-A2 [DONE] Implement `validateCampaignBrief()` from core contract function list. Tests: `modules/core/src/__tests__/validation.test.ts` -> `modules/core/src/validation.ts` | 2026-03-05T06:00Z
- [x] CORE-A3 [DONE] Implement `assertApprovalState()` gate helper. Tests: `modules/core/src/__tests__/approval-gate.test.ts` -> `modules/core/src/approval-gate.ts` | 2026-03-05T06:00Z

#### Lane B - Events and IDs [DONE]
- [x] CORE-B1 [DONE] Implement typed `newEntityId()` and prefix guards. Tests: `modules/core/src/__tests__/id.test.ts` -> `modules/core/src/id.ts` | 2026-03-05T06:00Z
- [x] CORE-B2 [DONE] Define shared domain event envelope and event names used by all modules. Tests: `modules/core/src/__tests__/events.test.ts` -> `modules/core/src/events.ts` | 2026-03-05T06:00Z

---

### Module: funnel
Owner: agent-2
Layer: domain
Depends on: core

#### Lane A - Plan Builder [IN_PROGRESS]
- [x] FUN-A1 [DONE] Implement `createFunnelPlan()` for awareness -> consideration -> decision sequence. See `modules/funnel/CONTRACT.md`. Tests: `modules/funnel/src/__tests__/plan.test.ts` -> `modules/funnel/src/plan.ts`
- [x] FUN-A2 [DONE] Add CTA mapping by channel for each stage. Tests: `modules/funnel/src/__tests__/cta-map.test.ts` -> `modules/funnel/src/cta-map.ts`

#### Lane B - Validation [DONE]
- [x] FUN-B1 [DONE] Implement `validateFunnelPlan()` coverage and transition checks. Tests: `modules/funnel/src/__tests__/validate.test.ts` -> `modules/funnel/src/validate.ts`
- [x] FUN-B2 [DONE] Add funnel plan serializer for workflow handoff payloads. Tests: `modules/funnel/src/__tests__/serialize.test.ts` -> `modules/funnel/src/serialize.ts`

---

### Module: strategy
Owner: antigravity
Layer: domain
Depends on: core, analytics, adapters

#### Lane A - Discovery and Hypotheses [IN_PROGRESS]
- [x] STR-A1 [DONE] Implement `captureInterview()` normalization and versioned save format. Tests: `modules/strategy/src/__tests__/interview.test.ts` -> `modules/strategy/src/interview.ts`
- [x] STR-A2 [DONE] Implement `generateOfferHypotheses()` with rationale/confidence fields. Tests: `modules/strategy/src/__tests__/hypothesis.test.ts` -> `modules/strategy/src/hypothesis.ts`
- [x] STR-A3 [DONE] Add NOTE in module docs: integrate Genkit Offer Strategist agent for higher-quality hypotheses (assistive only, not autonomous decisions). Docs: `modules/strategy/README.md` -> `modules/strategy/README.md`

#### Lane B - Market Signals [DONE]
- [x] STR-B1 [DONE] Implement source allowlist and rate-limit policy for market signal collection. Tests: `modules/strategy/src/__tests__/sources.test.ts` -> `modules/strategy/src/sources.ts`
- [x] STR-B2 [DONE] Implement Playwright fallback collector for allowed public pages after API-first attempts fail. Tests: `modules/strategy/src/__tests__/collector.test.ts` -> `modules/strategy/src/collector-playwright.ts` | owner: copilot | done: 2026-03-05T20:03:00Z

---

### Module: copylab
Owner: copilot (Lane A, 2026-03-05T15:24:00Z)
Layer: domain
Depends on: core, funnel

#### Lane A - Variant Generation [DONE]
- [x] COPY-A1 [DONE] Implement `generateVariants()` using funnel stage inputs and channel policy. Tests: `modules/copylab/src/__tests__/generate.test.ts` -> `modules/copylab/src/generate.ts` | owner: copilot | done: 2026-03-05T15:27:00Z
- [x] COPY-A2 [DONE] Create policy schema and default policy set versioning. Tests: `modules/copylab/src/__tests__/policy.test.ts` -> `modules/copylab/src/policy.ts` | owner: copilot | done: 2026-03-05T15:27:00Z

#### Lane B - Scoring and Formatting [DONE]
- [x] COPY-B1 [DONE] Implement deterministic `scoreVariants()` rule scoring. Tests: `modules/copylab/src/__tests__/score.test.ts` -> `modules/copylab/src/score.ts` | owner: copilot | done: 2026-03-05T15:27:00Z
- [x] COPY-B2 [DONE] Build channel formatter for Meta, LinkedIn, X text constraints. Tests: `modules/copylab/src/__tests__/format.test.ts` -> `modules/copylab/src/format.ts` | owner: copilot | done: 2026-03-05T15:27:00Z

---

### Module: approvals
Owner: antigravity
Layer: domain
Depends on: core

#### Lane A - Review Queue [DONE]
- [x] APP-A1 [DONE] Implement `createReviewBatch()` with pending initial state. Tests: `modules/approvals/src/__tests__/queue.test.ts` -> `modules/approvals/src/queue.ts` | owner: antigravity | 2026-03-05T05:57:48Z
- [x] APP-A2 [DONE] Implement `decideReview()` transition rules and audit fields (reviewer, timestamp). Tests: `modules/approvals/src/__tests__/decision.test.ts` -> `modules/approvals/src/decision.ts` | owner: antigravity | 2026-03-05T05:57:48Z

#### Lane B - Gate Integration [READY]
- [ ] APP-B1 [BLOCKED by APP-A2] Expose `isApproved(itemId)` read helper for publishing/comments checks. Tests: `modules/approvals/src/__tests__/gate.test.ts` -> `modules/approvals/src/gate.ts`

---

### Module: adapters
Owner: antigravity
Layer: infra
Depends on: core

#### Lane A - Mock Providers [DONE]
- [x] ADP-A1 [DONE] Implement provider registry with mock adapters (meta, linkedin, x, email). Tests: `modules/adapters/src/__tests__/registry.test.ts` -> `modules/adapters/src/registry.ts` | owner: antigravity | 2026-03-05T05:57:48Z
- [x] ADP-A2 [DONE] Implement `enqueuePublish()` normalized response mapping. Tests: `modules/adapters/src/__tests__/publish.test.ts` -> `modules/adapters/src/publish.ts` | owner: antigravity | 2026-03-05T05:57:48Z

#### Lane B - Comments IO [READY]
- [ ] ADP-B1 [READY] Implement `ingestComments()` mock pull stream for campaign scope. Tests: `modules/adapters/src/__tests__/ingest.test.ts` -> `modules/adapters/src/comments-ingest.ts`
- [ ] ADP-B2 [READY] Implement `sendReply()` with normalized receipt mapping. Tests: `modules/adapters/src/__tests__/reply.test.ts` -> `modules/adapters/src/reply.ts`

---

### Module: publishing
Owner: antigravity
Layer: domain
Depends on: core, approvals, adapters

#### Lane A - Scheduler [DONE]
- [x] PUB-A1 [DONE] Implement `scheduleAsset()` with timezone-safe ISO validation. Tests: `modules/publishing/src/__tests__/schedule.test.ts` -> `modules/publishing/src/schedule.ts` | owner: antigravity | 2026-03-05T05:57:48Z
- [ ] PUB-A2 [BLOCKED by APP-B1] Add approval gate check before calendar write. Tests: `modules/publishing/src/__tests__/approval-check.test.ts` -> `modules/publishing/src/schedule.ts`

#### Lane B - Dispatcher [READY]
- [ ] PUB-B1 [BLOCKED by ADP-A2] Implement `dispatchDue(now)` idempotent due-job dispatch. Tests: `modules/publishing/src/__tests__/dispatch.test.ts` -> `modules/publishing/src/dispatch.ts`
- [ ] PUB-B2 [BLOCKED by PUB-B1] Emit dispatch outcome events for analytics consumption. Tests: `modules/publishing/src/__tests__/dispatch-events.test.ts` -> `modules/publishing/src/dispatch-events.ts`

---

### Module: comments
Owner: unassigned
Layer: domain
Depends on: core, approvals, adapters

#### Lane A - Triage and Draft [READY]
- [ ] COM-A1 [READY] Implement `triageComment()` intent buckets (lead, objection, support, spam). Tests: `modules/comments/src/__tests__/triage.test.ts` -> `modules/comments/src/triage.ts`
- [ ] COM-A2 [READY] Implement `draftReply()` with reply policy application. Tests: `modules/comments/src/__tests__/draft.test.ts` -> `modules/comments/src/draft.ts`

#### Lane B - Send Flow [READY]
- [ ] COM-B1 [BLOCKED by APP-B1, ADP-B2] Implement `sendApprovedReply()` approval gate + adapter dispatch. Tests: `modules/comments/src/__tests__/send.test.ts` -> `modules/comments/src/send.ts`

---

### Module: analytics
Owner: unassigned
Layer: read-models
Depends on: core

#### Lane A - Projections [READY]
- [ ] AN-A1 [READY] Implement `projectAttribution(events)` campaign and channel rollups. Tests: `modules/analytics/src/__tests__/attribution.test.ts` -> `modules/analytics/src/attribution.ts`
- [ ] AN-A2 [BLOCKED by FUN-A1] Implement funnel conversion projection by stage. Tests: `modules/analytics/src/__tests__/funnel.test.ts` -> `modules/analytics/src/funnel.ts`
- [ ] AN-A3 [BLOCKED by COPY-B1] Implement variant performance projection. Tests: `modules/analytics/src/__tests__/variants.test.ts` -> `modules/analytics/src/variants.ts`

#### Lane B - Dashboard Read Model [READY]
- [ ] AN-B1 [BLOCKED by AN-A1, AN-A2] Build `campaignDashboardReadModel()` aggregator. Tests: `modules/analytics/src/__tests__/dashboard.test.ts` -> `modules/analytics/src/dashboard.ts`

---

## Backlog

- [x] BACK-1 [DONE] Add integration workflow tests for launch flow (brief -> copy -> approval -> schedule). -> `scripts/integration/launch-flow.test.ts`
- [x] BACK-2 [DONE] Add board drift checker script that fails CI when contract functions are missing implementation. -> `scripts/drift-check.ts`
- [x] BACK-3 [DONE] Add import-boundary lint rules mapped to module ownership. -> `scripts/lint-boundaries.ts`
- [ ] BACK-4 [BLOCKED by first real provider] Add real provider adapter for one channel.
- [ ] BACK-5 [READY] Add strategy workspace UI shell for business detail capture and offer review.
- [x] BACK-6 [DONE] Install Genkit base and add flow scaffolds (`offerStrategistFlow`, `copyCoachFlow`, `replyCoachFlow`) in mock-safe mode. -> `modules/strategy/src/flows/offerStrategistFlow.ts`, `modules/copylab/src/flows/copyCoachFlow.ts`, `modules/comments/src/flows/replyCoachFlow.ts`, `modules/genkit-shared/src/`
- [x] BACK-7 [DONE] Review coaching copy across all pages for beginner clarity and non-sales framing.
- [x] BACK-8 [DONE] Add Genkit evaluation checklist (quality, safety, tone, factuality) and human-review gates before any action output is accepted. -> `modules/genkit-shared/src/evaluator.ts`, `modules/genkit-shared/src/human-review-gate.ts`

## Icebox

- [ ] ICE-1 Adaptive variant experimentation suggestions.
- [ ] ICE-2 Multi-workspace permissions and audit viewer.
- [ ] ICE-3 CRM webhook handoff.

## Refill Log

| Date | Analyst | Tasks Added | Source | Notes |
|---|---|---|---|---|
| 2026-03-04 | agent-4 | 36 | Initial fill from MVP scope + module contracts | Board created |
| 2026-03-05 | agent-4 | 10 | Recovery pass from actual workspace state | Added learning-ui and mock-engine lanes |

## Coordination Log

| UTC Timestamp | Agent | Note |
|---|---|---|
| 2026-03-04T00:00:00Z | system | Initial board seeded from docs stack. |
| 2026-03-04T00:10:00Z | system | Added strategy module lanes for business discovery, offer ranking, and controlled Playwright market-signal fallback. |
| 2026-03-05T05:45:00Z | system | Re-aligned project intent to beginner coaching + internal campaign execution. Captured existing UI and mock-engine work into board lanes. |
| 2026-03-05T05:54:42Z | agent-1 | CLAIMED BACK-6 + BACK-8. Installed genkit + @genkit-ai/google-genai. Creating three flow scaffolds and shared evaluation infrastructure. |
| 2026-03-05T05:55:00Z | agent-1 | DONE BACK-6: offerStrategistFlow (strategy/src/flows/), copyCoachFlow (copylab/src/flows/), replyCoachFlow (comments/src/flows/) — all mock-safe (no API key required). Shared genkit-init, mock-model helpers in modules/genkit-shared/src/. |
| 2026-03-05T05:55:00Z | agent-1 | DONE BACK-8: evaluator.ts (quality/safety/tone/factuality rule-based checks), human-review-gate.ts (createReviewItem/assertHumanApproved gate). All three flows return pending ReviewItem — no AI output reaches downstream without explicit operator approval. |
| 2026-03-05T05:53:00Z | agent-5 | Claimed LUI-B3, LUI-C1, LUI-C2, BACK-7. Building: coaching intent banner, 6-step journey progress bar, quick-help glossary drawer, and copy audit across all pages. |
| 2026-03-05T06:10:00Z | agent-5 | DONE LUI-B3: intent banner in src/main.ts — contextual text updates as user progresses through journey. DONE LUI-C1: 6-step journey tracker in sidebar (Discover→Launch→Review→Schedule→Respond→Measure), green dots for completed steps, purple for current. DONE LUI-C2: help-drawer.ts component — slides in from right, shows page-specific glossary terms with plain-English definitions, Escape/overlay/✕ to close. DONE BACK-7: copy audit complete — all page labels use coaching/beginner framing, no product-sales language. |
| 2026-03-05T05:55:05Z | antigravity | CLAIMED + DONE STR-A1: interview.ts + interview.test.ts — captureInterview() with validation, normalization (trim, lowercase industry, filter empty arrays), versioned save, and amendInterview(). |
| 2026-03-05T05:55:05Z | antigravity | CLAIMED + DONE STR-A2: hypothesis.ts + hypothesis.test.ts — generateOfferHypotheses() with 5 template-derived hypotheses, rationale strings referencing interview data, and confidence range 0–1. |
| 2026-03-05T05:55:05Z | antigravity | CLAIMED + DONE STR-A3: Updated strategy/README.md with formal NOTE section on Genkit Offer Strategist agent integration (assistive-only, human-review gate required). |
| 2026-03-05T05:55:05Z | antigravity | CLAIMED + DONE FUN-A1: plan.ts + plan.test.ts — createFunnelPlan() with deterministic awareness→consideration→decision stage order, channel-specific CTAs from cta-map, and FUNNEL_STAGE_INVALID guard. |
| 2026-03-05T05:55:05Z | antigravity | CLAIMED + DONE FUN-A2: cta-map.ts + cta-map.test.ts — CTA_MAP with 4 channels × 3 stages, platform-appropriate CTAs, getCtasForChannel() with CTA_MISSING error, getDefaultCtas() with de-duplication. FUN-B1 unblocked. |
| 2026-03-05T05:57:48Z | antigravity | Claimed APP-A1, APP-A2, ADP-A1, ADP-A2, PUB-A1. Implementing approvals queue/decision, adapter registry/enqueue, and publishing scheduler. PUB-A2 skipped — blocked by APP-B1. |
| 2026-03-05T06:08:00Z | antigravity | DONE: APP-A1, APP-A2, ADP-A1, ADP-A2, PUB-A1. 85/85 tests passing. Also installed vitest as dev dependency and enabled globals:true in vite.config.ts (was pre-existing infra gap affecting all test suites). No contract mismatches found. Note: decision.ts exports additional helpers (registerItem, registerBatchItems, reopenItem, getItemState, resetStore) required by pre-existing test contract. |

| 2026-03-05T06:15:00Z | antigravity | DONE CORE-A1/A2/A3/B1/B2: 87 tests pass. Full CONTRACT.md alignment confirmed, no gaps. |
| 2026-03-05T06:15:00Z | antigravity | DONE STR-A1/A2 (production impls): 28 tests pass. DONE FUN-A1/A2: 23 tests pass. FUN-B1 + COPY-A1 unblocked. |
| 2026-03-05T06:15:00Z | antigravity | DONE ADP-A1/A2(31) + PUB-A1(27). DONE BACK-6: offerStrategistFlow, copyCoachFlow, replyCoachFlow (mock-safe, Genkit 1.29). DONE BACK-8: genkit-gate.ts in core/src. Total: 223/223 tests pass. |
| 2026-03-05T15:24:00Z | copilot | CLAIMED COPY-A1/COPY-A2/COPY-B1/COPY-B2 in Lane A. Implementing copylab generation, policy versioning, scoring, and channel formatter with focused tests. |
| 2026-03-05T15:27:00Z | copilot | DONE COPY-A1/A2/B1/B2: added copylab generate/policy/score/format implementations and 15 focused tests. Full suite passing (238/238). |
| 2026-03-05T16:28:00Z | copilot | DONE Lane E: FUN-B1 (validateFunnelPlan — FUNNEL_GAP/FUNNEL_TRANSITION_INVALID checks), FUN-B2 (serializeFunnelPlan/deserializeFunnelPlan for workflow handoff), STR-B1 (SOURCE_ALLOWLIST + DEFAULT_RATE_LIMIT_POLICY + collectMarketSignals with SIGNAL_SOURCE_DENIED guard), BACK-1 (scripts/integration/launch-flow.test.ts — full brief→funnel→copy→approval→schedule integration), BACK-2 (scripts/drift-check.ts — exits non-zero on CONTRACT.md drift), BACK-3 (scripts/lint-boundaries.ts — exits non-zero on disallowed peer imports). All 380 tests pass. STR-B2 now unblocked. |
| 2026-03-05T17:31:00Z | copilot | CLAIMED LUI-C3 for mobile tooltip hotfix + sprint-lane planning doc refresh requested in issue. |
| 2026-03-05T17:34:00Z | copilot | DONE LUI-C3: tooltips now attach only on hover-capable pointer-fine devices; added tooltip support tests. Also refreshed `lanes.md` with next sprint lanes, explicit non-overlap file ownership, and required per-lane `lanes (x).results.md` outputs. |
| 2026-03-05T19:55:00Z | copilot | CLAIMED + DONE MCK-A2: reconciled `src/mock-engine.ts` signatures against module contracts, switched copy generation call to canonical request-object form, and added explicit temporary mismatch notes in strategy/approvals/publishing/analytics/comments contracts for mock-only signature differences. |
| 2026-03-05T20:03:00Z | copilot | CLAIMED + DONE MCK-A3 + STR-B2: (1) Added `scripts/smoke-mock.ts` end-to-end smoke script exercising discovery→launch→review→calendar→comments→dashboard with assertions per step. (2) Added `modules/strategy/src/collector-playwright.ts` with API-first then browser fallback strategy, enforcing SOURCE_ALLOWLIST and rate policy; added 32 tests in collector.test.ts. 416/416 tests pass. |

## Refill Protocol

1. Trigger refill when global waterline or any lane reserve is breached.
2. Scan actual code for contract gaps, missing tests, and blocked flows.
3. Compare against MVP exit criteria and DATA_FLOW diagrams.
4. Add atomic tasks with file tags and acceptance checks.
5. Update Last refill, Capacity, and Refill Log.
