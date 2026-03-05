# lanes.md — Next Sprint: 6 Parallel Lanes

Sprint start: 2026-03-05
Source: `board.md` remaining READY tasks + newly unblocked tasks

---

## Setup (every agent must do this first)

```bash
npm install
cp .env.local.example .env.local   # then add your GEMINI_API_KEY
npm run test                        # verify 223+ tests pass
npm run dev                         # starts Vite UI at localhost:5173
```

### Env vars (`.env.local`)

| Var | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | For live AI | Get from https://aistudio.google.com/apikey — without it, flows run in mock-safe mode (hardcoded responses) |
| `GEMINI_MODEL` | No | Defaults to `gemini-2.5-flash`. Override to use a different Gemini model. |

### Key files to understand before starting any lane

| File | What it tells you |
|---|---|
| `board.md` | All tasks, statuses, agent workflow rules, coordination log |
| `SYSTEM_ARCHITECTURE.md` | Layer diagram: `ui → workflows → domain modules → adapters` |
| `DATA_FLOW.md` | 4 data flows: Campaign Launch, Approval→Publish, Comment Ops, Attribution |
| `PRODUCT_DESIGN.md` | What the user sees, product language rules |
| `PROJECT_RULES.md` | Hard constraints (no auto-publish, human gates, etc.) |
| `modules/*/CONTRACT.md` | Each module's exported functions, types, and error contracts |

---

## ⚠ Lane 0 — Wire Genkit Flows to UI (CRITICAL — do this first)

**Why this lane exists:** The 3 Genkit flows (`offerStrategistFlow`, `copyCoachFlow`, `replyCoachFlow`) exist in `modules/*/src/flows/` and work standalone, but **nothing in the running app calls them yet**. The UI runs entirely on `src/mock-engine.ts` (hardcoded data). This lane connects them.

**Docs to read first:** `SYSTEM_ARCHITECTURE.md` (layer diagram), `DATA_FLOW.md` (all 4 flows), `modules/genkit-shared/src/genkit-init.ts` (env var handling), `src/mock-engine.ts` (current mock functions)

### How it works today (broken)

```
Browser (Vite) → src/pages/*.ts → src/mock-engine.ts → hardcoded data
                                                        ↑ flows are never called
modules/*/src/flows/*.ts → exist but are unreachable from the browser
```

### How it should work after this lane

```
Browser (Vite) → src/pages/*.ts → fetch('/api/flows/...') → server.ts
                                                                ↓
                                            Genkit flows (offerStrategist, copyCoach, replyCoach)
                                                                ↓
                                            if GEMINI_API_KEY set → real Gemini responses
                                            if no key            → mock-safe deterministic responses
```

### Tasks

| # | Task | Files to create/modify | Details |
|---|---|---|---|
| L0-1 | **Create API server** that exposes Genkit flows as HTTP endpoints | `server.ts` (new, project root) | Use `@genkit-ai/express` (`startFlowServer`) OR plain Express. Endpoints: `POST /api/flows/offerStrategist`, `POST /api/flows/copyCoach`, `POST /api/flows/replyCoach`. Import flows from `modules/*/src/flows/`. Load `.env.local` with `dotenv`. |
| L0-2 | **Add Vite proxy** so the UI can call `/api/*` during dev without CORS issues | `vite.config.ts` | Add `server.proxy: { '/api': 'http://localhost:3400' }` (or whatever port server.ts uses). |
| L0-3 | **Update mock-engine** to call the real API when available, fall back to hardcoded data when offline | `src/mock-engine.ts` | For each product action (e.g. `submitInterview`, `createCampaign`), try `fetch('/api/flows/...')` first. If it fails (server not running), fall back to current mock data. This keeps the app working with or without the server. |
| L0-4 | **Wire Discovery page** → `offerStrategistFlow` | `src/pages/discovery.ts`, `src/mock-engine.ts` | When user submits the business interview form, send data to `/api/flows/offerStrategist`. Display the AI's coaching message and offer hypotheses. Keep the current mock fallback. |
| L0-5 | **Wire Launcher page** → `copyCoachFlow` | `src/pages/launcher.ts`, `src/mock-engine.ts` | When user clicks "Generate Launch Pack", send brief data to `/api/flows/copyCoach`. Display the AI-generated variants with "whyItWorks" explanations. |
| L0-6 | **Wire Comments page** → `replyCoachFlow` | `src/pages/comments.ts`, `src/mock-engine.ts` | When a comment is triaged, send it to `/api/flows/replyCoach`. Display the AI's draft reply with strategy explanation and coaching note. |
| L0-7 | **Add `npm run server` script** and update package.json | `package.json` | Add: `"server": "npx tsx server.ts"`, `"dev:full": "concurrently \"npm run server\" \"npm run dev\""`. Install `dotenv`, `@genkit-ai/express` (or `express`), `concurrently` as dev deps. |
| L0-8 | **Test end-to-end** with a real API key | — | Set `GEMINI_API_KEY` in `.env.local`, run `npm run dev:full`, fill out Business Discovery form, verify real AI coaching responses appear in the UI. Verify mock fallback still works when server is stopped. |

### Acceptance

- `npm run dev:full` starts both the Vite UI and the Genkit API server
- Business Discovery → submitting the interview form triggers real AI coaching (with key) or mock responses (without)
- Campaign Launcher → "Generate Launch Pack" returns AI-written copy with explanations
- Comment Ops → triaged comments get AI-drafted replies with coaching notes
- Everything still works with `npm run dev` alone (no server = mock fallback)
- No AI output reaches the user without the `humanReviewRequired: true` flag visible

### Dependencies

- Requires `dotenv` and either `@genkit-ai/express` or `express` as new deps
- Must install `concurrently` for `dev:full` script
- No dependency on Lanes A–E (this lane is independent)

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

## Lane E — Funnel Validation + Strategy Signals + Integration Infra ✅ DONE

**Modules:** funnel (validation), strategy (market signals), backlog infra
**Docs to read first:** `modules/funnel/CONTRACT.md`, `modules/strategy/CONTRACT.md`, `board.md` (Backlog section), `PROJECT_RULES.md`
**Why this lane:** FUN-B1 is unblocked (FUN-A1 done). STR-B1 is READY. Backlog infra tasks are independent.

### Tasks

| ID | Task | File | Test | Status |
|---|---|---|---|---|
| FUN-B1 | Implement `validateFunnelPlan()` coverage and transition checks | `modules/funnel/src/validate.ts` | `modules/funnel/src/__tests__/validate.test.ts` | DONE |
| FUN-B2 | Add funnel plan serializer for workflow handoff payloads | `modules/funnel/src/serialize.ts` | `modules/funnel/src/__tests__/serialize.test.ts` | DONE |
| STR-B1 | Implement source allowlist and rate-limit policy for market signals | `modules/strategy/src/sources.ts` | `modules/strategy/src/__tests__/sources.test.ts` | DONE |
| BACK-1 | Add integration workflow tests for launch flow (brief → copy → approval → schedule) | `scripts/integration/launch-flow.test.ts` | — | DONE |
| BACK-2 | Add board drift checker script (CI fails when contract functions missing impl) | `scripts/drift-check.ts` | — | DONE |
| BACK-3 | Add import-boundary lint rules mapped to module ownership | `scripts/lint-boundaries.ts` | — | DONE |

### Acceptance

- ✅ `npm run test -- modules/funnel modules/strategy` — all tests pass (380/380)
- ✅ `validateFunnelPlan()` catches missing stages and invalid transitions
- ✅ Source allowlist limits which URLs can be scraped (`SIGNAL_SOURCE_DENIED` on unlisted domain)
- ✅ Integration test exercises the full brief → copy → approval → schedule flow (`scripts/integration/launch-flow.test.ts`)
- ✅ Drift checker exits non-zero when a CONTRACT.md function has no matching export (`npx tsx scripts/drift-check.ts`)
- ✅ Boundary lint exits non-zero when a module imports from a disallowed peer (`npx tsx scripts/lint-boundaries.ts`)

---

## Cross-Lane Dependencies

```
Lane 0 (server + UI wiring) — independent, do first or in parallel
Lane A (copylab) ──COPY-B1──▶ Lane D (AN-A3)
Lane B (APP-B1 + ADP-B2) ──▶ Lane C (COM-B1)
```

All other tasks within each lane are fully independent.

## How to Run

```bash
npm install                  # install deps
npm run test                 # run all tests (223+ should pass)
npm run dev                  # UI only (mock mode)
npm run server               # API server only (after Lane 0)
npm run dev:full             # both UI + server (after Lane 0)
```
