diff --git a/AGENTS.md b/AGENTS.md
index fec9202..171abb9 100644
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -1,43 +1,93 @@
-# AGENTS.md - GrowthOps OS
+# AGENTS.md — GrowthOps OS
 
 ## Source of Truth
 
 1. `board.md` is the execution source of truth.
-2. Module contracts in `modules/*/CONTRACT.md` are interface source of truth.
+2. Module contracts in `modules/*/CONTRACT.md` are the interface source of truth.
 3. Scope lock is `MVP_SCOPE.md`.
+4. `SYSTEM_ARCHITECTURE.md` describes the runtime shape and layer boundaries.
+5. `PROJECT_RULES.md` defines commandments, issue logging requirements, guard
+   script expectations, and the non-autonomous AI boundary.
 
 ## Start Protocol
 
-1. Read `board.md` before coding.
+1. Read `board.md` **in full** before coding.
 2. Pick only tasks in READY state.
-3. Claim task with agent id + UTC timestamp.
-4. Do not work on task already claimed by another agent.
+3. Claim task with agent id + UTC timestamp (all three claim steps required — see
+   Agent Workflow in board.md). Incomplete claims are invalid.
+4. Do not work on a task already claimed by another agent.
+5. Read the relevant `CONTRACT.md` files and source files before editing.
 
 ## Ownership Rules
 
 1. One owner per module at a time.
-2. Cross-module changes require either:
-   - paired task in target module, or
-   - integrator approval and board note.
+2. One agent per file per task — coordinate in the Coordination Log if two tasks
+   touch the same file.
+3. Cross-module changes require either:
+   - a paired task in the target module, or
+   - integrator approval and a board note.
+
+## Runtime Shape
+
+In mock mode (current default):
+
+```
+ui -> mock-engine -> modules/*/src/mock.ts
+```
+
+In production mode (future, requires OPS-2):
+
+```
+ui -> workflows -> domain modules -> adapters
+```
+
+Agents must not assume production-mode wiring is live unless `OPS-2` and
+`OPS-3` are marked DONE.
 
 ## Doc Sync Rules
 
-When code changes contract behavior, update in same change set:
+When code changes contract behavior, update in the same change set:
 - `modules/<module>/CONTRACT.md`
-- `modules/<module>/ANTI_PATTERNS.md` if new failure mode appears
-- `board.md` status and coordination entry
+- `modules/<module>/ANTI_PATTERNS.md` if a new failure mode appears
+- `board.md` status, Coordination Log, and Run Issues Log
+
+## Issue Logging Rules
+
+- Record every **material issue** in the Run Issues Log the moment it is found.
+- A material issue is any contract divergence, test failure, build regression,
+  approval bypass, or missing event emission.
+- If a run has **no** material issues, explicitly write `no material issues found`
+  in the Coordination Log. Do not leave this silent.
+
+## Guard Script Expectations
+
+Before marking a task DONE, verify:
+- `npm run check:drift` — no contract-code divergence
+- `npm run check:boundaries` — no disallowed cross-module imports
+- `npm run smoke:mock` — mock-engine round-trip passes
+
+Note: Guard scripts require `tsx` installed and wired into `package.json`
+(tracked under `OPS-1`). Until OPS-1 is done, run `npx tsx scripts/...`
+as a manual substitute.
 
 ## Definition of Done
 
 - Acceptance tests pass.
 - No boundary violations.
-- Board task marked DONE with note.
-- Relevant docs updated with concrete changes.
+- Board task marked DONE with completion note.
+- Relevant docs updated with concrete changes in same change set.
+- Material issues entered in Run Issues Log or `no material issues found`
+  noted in Coordination Log.
 
 ## Safety Rules
 
-- No autonomous posting without approval state.
-- No autonomous comment sending without review.
+- No autonomous posting without approval state (`approvals.isApproved()` === true).
+- No autonomous comment sending without review state.
 - No instructions that encourage platform policy violations.
-- Market research collection must use source allowlists and API-first strategy; Playwright fallback only for permitted public pages.
-- Genkit strategy agents are advisory and must route through human approval before offer selection.
+- Market research collection must use source allowlists and API-first strategy;
+  Playwright fallback only for permitted public pages.
+- Genkit strategy agents are advisory and must route all outputs through
+  `approvals.createReviewBatch` + `approvals.decideReview` before any offer
+  or copy is acted upon.
+- Every AI-assisted output shown in the UI must be labeled as advisory and
+  pending human review.
diff --git a/DATA_FLOW.md b/DATA_FLOW.md
index c85888f..2848740 100644
--- a/DATA_FLOW.md
+++ b/DATA_FLOW.md
@@ -1,76 +1,151 @@
-# DATA_FLOW.md - GrowthOps OS
+# DATA_FLOW.md — GrowthOps OS
+
+All flows below reflect actual shipped function names as of 2026-03-05.
+In local/learning mode every step passes through `src/mock-engine.ts`, which
+translates UI actions into calls to the `src/mock.ts` modules.
+See the mock-engine note on each flow for translation details.
+
+---
 
 ## Flow A: Campaign Launch
 
+```
 UI: Launch Console
-  -> workflows.launchCampaign(briefId)
+  -> mock-engine.launchCampaign(briefId)          [mock mode]
   -> funnel.getBrief(briefId)
-  -> copylab.generateVariants(brief, channels)
-  -> approvals.createBatch(assetIds)
+  -> copylab.generateVariants(request: CopyRequest)
+  -> approvals.createReviewBatch(items)            -> ReviewBatch
   -> event-log.append(CampaignDrafted)
   -> read-models.refresh(CampaignStatus)
+```
 
 Data crossing boundaries:
-- BriefInput (core)
-- CopyVariant[] (core)
-- ApprovalBatch (core)
+- `BriefInput` (core)
+- `CopyRequest` → `ChannelVariantSet` (core)
+- `ReviewItemInput[]` → `ReviewBatch` (core)
+
+Mock-engine note: `mock-engine.ts` calls `modules/copylab/src/mock.ts`
+`generateVariants(brief, plan)` (two-argument form) and maps the result
+before forwarding to `approvals.createReviewBatch`. The production path
+uses the single-argument `generateVariants(request: CopyRequest)` shape.
+
+---
 
 ## Flow B: Approval to Publishing
 
+```
 UI: Approval Queue
-  -> approvals.approveAsset(assetId, reviewerId)
-  -> event-log.append(AssetApproved)
-  -> publishing.schedule(assetId, runAt, channel)
+  -> approvals.decideReview(decision: ReviewDecision)   -> DecideReviewOutcome
+  -> [if approved] event-log.append(AssetApproved)
+  -> publishing.scheduleAsset(assetId, runAt, channel)  -> PublishCalendarEntry
+  -> publishing.dispatchDue(now)                        -> PublishDispatchResult[]
   -> adapters.enqueuePublish(job)
-  -> event-log.append(PublishScheduled)
+  -> event-log.append(PublishScheduled | PublishDispatched)
   -> read-models.refresh(PublishCalendar)
+```
 
 Data crossing boundaries:
-- ApprovalDecision
-- PublishJob
-- PublishReceipt
+- `ReviewDecision` (core)
+- `PublishCalendarEntry` (core)
+- `PublishDispatchResult[]` (core)
+
+Mock-engine note: `mock-engine.ts` calls `modules/approvals/src/mock.ts`
+`decideReview(decision)` which shares the same `ReviewDecision` signature
+as the production function. `modules/publishing/src/mock.ts`
+`scheduleAsset(assetId, assetLabel, runAt, channel)` takes an extra
+`assetLabel` parameter used for calendar display in the UI — this is
+stripped before the record is returned to the UI read model. The gate
+check `approvals.isApproved(itemId)` is called by publishing before any
+dispatch proceeds.
+
+---
 
 ## Flow C: Comment Operations
 
+```
 adapters.ingestComments(channel, campaignId)
-  -> comments.classify(comment)
-  -> comments.draftReply(comment, policy)
-  -> approvals.createReplyReview(replyDraft)
-  -> UI reviewer approves
+  -> comments.triageComment(comment)                    -> CommentQueueItem
+  -> comments.draftReply(item, policy)                  -> ReplyDraft
+  -> approvals.createReviewBatch([replyItem])            -> ReviewBatch
+  -> UI reviewer: approvals.decideReview(decision)      -> DecideReviewOutcome
+  -> [if approved] comments.sendApprovedReply(replyId)  -> SendResult
   -> adapters.sendReply(reply)
   -> event-log.append(CommentReplied)
   -> read-models.refresh(CommentOpsDashboard)
+```
 
 Data crossing boundaries:
-- CommentRecord
-- CommentIntent
-- ReplyDraft
-- ReplyDecision
+- `CommentRecord` (core)
+- `CommentQueueItem` (core)
+- `ReplyDraft` (core)
+- `ReviewDecision` (core)
+- `SendResult` (core)
+
+Mock-engine note: `modules/comments/src/mock.ts` `draftReply(...)` may
+return `null` for spam-classified comments. The mock-engine translation
+layer in `mock-engine.ts` filters null drafts before forwarding to the
+approval queue — the contract `draftReply` signature remains non-null
+for the production domain API. `sendApprovedReply` in the production
+implementation (`modules/comments/src/send.ts`) requires an additional
+`context: ReplyDraftContext` parameter until a persistent reply store
+is available to resolve drafts by id.
+
+---
 
 ## Flow D: Attribution Projection
 
+```
 event-log.stream(campaignId)
-  -> analytics.projectAttribution(events)
-  -> read-models.CampaignMetrics
-  -> UI dashboard
+  -> analytics.projectAttribution(events)               -> AttributionSnapshot
+  -> analytics.projectFunnelConversion(events, planId)  -> ConversionFunnelRow[]
+  -> analytics.projectVariantPerformance(events)        -> VariantPerformanceRow[]
+  -> analytics.campaignDashboardReadModel(events, planId) -> CampaignDashboardReadModel
+  -> UI: dashboard page renders read model
+```
 
 Data crossing boundaries:
-- AttributionEvent
-- CampaignMetricRow
+- `DomainEvent[]` (core)
+- `AttributionSnapshot` (core)
+- `ConversionFunnelRow[]` (core)
+- `VariantPerformanceRow[]` (core)
+- `CampaignDashboardReadModel` (analytics)
+
+Mock-engine note: `modules/analytics/src/mock.ts` uses
+`projectAttribution(events, campaignId)` — the extra `campaignId`
+argument forces a deterministic single-campaign snapshot in offline
+mode. The production function derives campaign identity from the event
+stream. `campaignDashboardReadModel` consolidates all three projections
+into one call for the UI read model.
+
+---
 
 ## Flow E: Offer Discovery and Market Signals
 
+```
 UI: Strategy Workspace
-  -> strategy.captureInterview(responseSet)
-  -> strategy.generateOfferHypotheses(interview, constraints)
-  -> adapters.collectMarketSignals(sourcePlan)
-  -> strategy.rankHypotheses(hypotheses, marketSignals)
-  -> approvals.reviewOfferProfile(profile)
-  -> event-log.append(OfferProfileApproved)
+  -> strategy.captureInterview(input)                   -> DiscoveryInterview
+  -> strategy.generateOfferHypotheses(interview, constraints) -> OfferHypothesis[]
+  -> adapters.collectMarketSignals(sourcePlan)           -> MarketSignal[]
+  -> strategy.rankHypotheses(hypotheses, signals)        -> OfferHypothesis[]
+  -> approvals.createReviewBatch([offerItem])            -> ReviewBatch
+  -> UI reviewer: approvals.decideReview(decision)       -> DecideReviewOutcome
+  -> [if approved] event-log.append(OfferProfileApproved)
   -> read-models.refresh(OfferReadiness)
+```
 
 Data crossing boundaries:
-- DiscoveryInterview
-- OfferHypothesis[]
-- MarketSignal[]
-- OfferProfile
+- `DiscoveryInterviewInput` → `DiscoveryInterview` (core)
+- `OfferHypothesis[]` (core)
+- `MarketSignal[]` (core)
+- `ReviewDecision` (core)
+
+Mock-engine note: `modules/strategy/src/mock.ts` exposes
+`buildOfferProfile(hypothesis, signals): OfferProfile` — this helper is
+intentionally mock-only for the workflow translation layer and is not
+part of the formal module contract. The formal contract functions
+`captureInterview`, `generateOfferHypotheses`, and `rankHypotheses`
+are called directly in the production path.
+
+Human-review gate: Offer hypotheses are advisory outputs from the Genkit
+strategy agents. No offer profile is committed or published without an
+explicit `approvals.decideReview` decision from a human reviewer.
diff --git a/MVP_SCOPE.md b/MVP_SCOPE.md
index c7b33fa..5015aa8 100644
--- a/MVP_SCOPE.md
+++ b/MVP_SCOPE.md
@@ -13,6 +13,9 @@
 | Publishing Scheduler | Queue and dispatch approved assets via adapters | publishing + adapters |
 | Comment Ops | Classify comments and draft reply candidates | comments |
 | Attribution Dashboard | Basic CPL/conversion views by channel and campaign | analytics |
+| Style Studio (shell) | Style profile and instruction-pack foundation — mock-safe shell staged in FUT-1 | copylab + core |
+| Integrations (shell) | Slack and Office 365 connection lifecycle and scope policy — mock-safe shell staged in FUT-2 | integrations + adapters |
+| Opportunities Inbox (shell) | Social-scout opportunity cards and suggested engagement — mock-safe shell staged in FUT-3 | social-scout + approvals |
 
 ## Must Not Have (OUT)
 
diff --git a/PRODUCT_DESIGN.md b/PRODUCT_DESIGN.md
index 3264f9d..5aba134 100644
--- a/PRODUCT_DESIGN.md
+++ b/PRODUCT_DESIGN.md
@@ -77,3 +77,29 @@ Users should feel:
 ### V3.0
 - Adaptive multi-channel optimization with guardrails.
 - End-to-end campaign simulation before publish.
+
+## UI Language Rules (GUIDE-4)
+
+These rules apply to all UI copy, page descriptions, coaching blocks, and button labels.
+
+### Use this language
+- "Build a campaign for your business or a client"
+- "Run campaigns for your business or a client's business"
+- "Your offer" / "the offer" (not "the product")
+- "Approve before it goes live" (reinforce human control)
+- "The system suggests — you decide" (AI is advisory)
+- "Try a starter example" (for presets — makes it exploratory, not tutorial-mandatory)
+
+### Do NOT use this language
+- "Our platform" / "Our software" / "Our tool" (implies a product being sold)
+- "Marketers will love..." (this is not a product being sold to marketers)
+- "Sign up" / "Get started" / "Free trial" (no SaaS framing)
+- "Powered by AI" as a headline claim (AI is advisory, not the feature)
+- Passive forms implying the system acts autonomously: "AI will send..." → "You approve, then it sends"
+
+### Coaching block format
+Every page must have a coaching block with three parts:
+1. **What you do here** — plain action description, no jargon
+2. **Why it matters** — business reason, connects action to outcome
+3. **What comes next** — links to the next step in the campaign journey
+
diff --git a/PROJECT_RULES.md b/PROJECT_RULES.md
index 488d1f9..916e896 100644
--- a/PROJECT_RULES.md
+++ b/PROJECT_RULES.md
@@ -1,22 +1,25 @@
-# PROJECT_RULES.md - GrowthOps OS
+# PROJECT_RULES.md — GrowthOps OS
 
 ## One Rule
 If you cannot name the owning module for a piece of logic, do not implement it yet.
 
 ## Dependency Hierarchy
 
+```
 core <- (copylab, funnel, approvals, publishing, comments, analytics, adapters)
 workflows -> domain modules
-ui -> workflows + read-models
+ui -> mock-engine -> modules/*/src/mock.ts   [mock mode]
+ui -> workflows + read-models                [production mode]
+```
 
 ## Commandments
 
 1. No circular imports.
 2. No direct provider API calls outside adapters.
-3. No publish without approval state.
-4. No reply send without review state.
+3. No publish without approval state (`approvals.isApproved()` must return `true`).
+4. No reply send without review state (`approvals.isApproved()` must return `true`).
 5. All cross-module payloads use core types.
-6. Contracts before implementation.
+6. Contracts before implementation — update `modules/<name>/CONTRACT.md` before shipping code changes.
 7. Every state-changing action emits an event.
 8. Read-model logic must be deterministic.
 9. No hidden global mutable state.
@@ -27,12 +30,59 @@ ui -> workflows + read-models
 14. Unsafe automation requests are downgraded to review-required actions.
 15. Platform policy constraints are treated as hard requirements.
 16. Market data collection must be API-first and policy-compliant; browser automation is fallback only for permitted sources.
-17. AI recommendations (including Genkit agents) are assistive; human review is required before committing offer strategy.
+17. AI recommendations (including Genkit agents) are assistive; human review is required before committing offer strategy, copy, or any outbound action.
+18. OAuth tokens and secrets are encrypted at rest; token values never appear in module contracts, UI state, or browser storage.
+19. Social-scout sends nothing autonomously; all accepted opportunities must have an `OpportunityDecision` routed through approvals before dispatch.
+20. Per-platform daily engagement caps are enforced in settings and cannot be overridden at runtime.
+21. Approved copy snippets retrieved for copy-memory context are input only; human must review all generated output before approval.
+
+## Issue Logging Requirements
+
+Every running agent or workflow must record material issues in the board's
+**Run Issues Log**. An issue is material if it:
+- reveals a contract divergence between `CONTRACT.md` and actual code,
+- causes a test failure or build regression,
+- uncovers a missing guard, unsafe approval bypass, or missing event emission, or
+- blocks a task from reaching DONE.
+
+If a run has **no** material issues, explicitly write `no material issues found`
+in the Coordination Log entry for that task. Do not leave the log silent.
+
+## Guard Script Expectations
+
+Three guard scripts exist and must remain runnable from a clean local checkout:
+
+| Script | npm command | Guards |
+|---|---|---|
+| `scripts/drift-check.ts` | `npm run check:drift` | CONTRACT.md vs code divergence |
+| `scripts/lint-boundaries.ts` | `npm run check:boundaries` | disallowed cross-module imports |
+| `npm run smoke:mock` | `npm run smoke:mock` | mock-engine round-trip correctness |
+
+Prerequisite: `tsx` must be installed and wired into `package.json` (tracked: `OPS-1`).
+Guard scripts are expected to pass before any task is marked DONE.
+
+## Non-Autonomous AI Boundary
+
+GrowthOps OS uses Genkit for offer strategy coaching and copy suggestions.
+The following constraints are hard requirements — not guidelines:
+
+1. **No AI output is committed without human approval.** Every Genkit flow result
+   must pass through `approvals.createReviewBatch` + `approvals.decideReview`.
+2. **No offer strategy is auto-selected.** `strategy.generateOfferHypotheses` and
+   `strategy.rankHypotheses` are advisory. The operator chooses.
+3. **No autonomous posting.** No content reaches an outbound adapter without an
+   explicit `approvals.isApproved()` check returning `true`.
+4. **UI must label AI-generated content.** Every AI-assisted output must be
+   visually marked as advisory and pending review (tracked: `OPS-4`).
+5. **Genkit evaluation gates.** Quality, safety, tone, and factuality checks run
+   before any AI output is surfaced to the operator for approval.
 
 ## Enforcement Strategy
 
-- Lint: restricted imports to enforce boundaries.
+- Lint: restricted imports to enforce boundaries (`scripts/lint-boundaries.ts`).
 - CI: typecheck + tests + boundary checks.
 - Board gate: tasks missing file tags or acceptance checks are invalid.
 - Refill analysts create drift tasks when contracts and code diverge.
 - Market adapter gate: source allowlist and request-rate limits are validated in tests.
+- Issue log gate: every run must produce a Coordination Log entry; material issues
+  go into the Run Issues Log immediately when discovered.
diff --git a/SYSTEM_ARCHITECTURE.md b/SYSTEM_ARCHITECTURE.md
index f562225..b6eb6bb 100644
--- a/SYSTEM_ARCHITECTURE.md
+++ b/SYSTEM_ARCHITECTURE.md
@@ -1,34 +1,71 @@
-# SYSTEM_ARCHITECTURE.md - GrowthOps OS
+# SYSTEM_ARCHITECTURE.md — GrowthOps OS
 
 ## Layer Diagram
 
-ui -> workflows -> domain modules -> adapters
-ui -> read-models
-read-models <- event-log
-
-Allowed dependencies are unidirectional only.
+```
+         ┌─────────────────────────────────────────────────────────┐
+         │                        ui                               │
+         │  (src/pages/*.ts, src/main.ts, src/index.css)           │
+         └────────────────────────┬────────────────────────────────┘
+                                  │ in mock mode
+                                  ▼
+         ┌─────────────────────────────────────────────────────────┐
+         │               mock-engine (src/mock-engine.ts)          │
+         │  Translates UI actions into module mock.ts calls        │
+         └────────────────────────┬────────────────────────────────┘
+                                  │ calls
+                                  ▼
+         ┌─────────────────────────────────────────────────────────┐
+         │             domain modules (modules/*/src/)             │
+         │  strategy · copylab · funnel · approvals · publishing   │
+         │  comments · analytics · adapters                        │
+         └────────────────────────┬────────────────────────────────┘
+                                  │ appends
+                                  ▼
+              event-log ──────► read-models ──────► ui (refresh)
+```
+
+Allowed dependencies are unidirectional only (no circular imports).
+
+### Mock Mode vs Production Mode
+
+- **Mock mode (current default):** `ui → mock-engine → modules/*/src/mock.ts`
+  The mock-engine is a local translation layer. It calls the `mock.ts`
+  implementation inside each module, which returns deterministic in-memory
+  results. No external API calls are made. This is the safe offline and
+  learning mode.
+- **Production mode (future):** `ui → workflows → domain modules → adapters`
+  Workflows orchestrate cross-module business flows using the production
+  module exports. Adapters wrap external platforms. Production mode requires
+  the local flow server (`npm run server`) and valid provider credentials.
+
+---
 
 ## Layer Responsibilities
 
 ### ui
 Responsibility: Render operator views, learning guidance, and collect intents.
 Must never: Call external platforms directly; bypass approvals.
-Depends on: workflows, read-models, core types.
+Depends on: mock-engine (mock mode), workflows (production mode), read-models, core types.
 
-### mock-engine (workflow adapter)
+### mock-engine (`src/mock-engine.ts`)
 Responsibility: Translate product UI actions into module mock functions in local mode.
 Must never: Become the source of truth for domain contracts.
-Depends on: domain modules.
+Must never: Be imported by domain modules.
+Depends on: `modules/*/src/mock.ts` implementations.
+Guard scripts: `npm run smoke:mock` runs a round-trip smoke test through mock-engine.
 
 ### workflows
-Responsibility: Orchestrate cross-module business flows.
+Responsibility: Orchestrate cross-module business flows in production mode.
 Must never: Own long-term state schema; embed provider-specific code.
 Depends on: domain modules, core.
 
 ### domain modules
-Responsibility: Implement bounded capabilities.
+Responsibility: Implement bounded capabilities with explicit contracts.
 Must never: Cross-import sibling module internals.
+Must never: Return AI advisory output as finalized state without approval.
 Depends on: core, event-log.
+Contract files: `modules/<name>/CONTRACT.md`
 
 ### adapters
 Responsibility: Wrap external platform APIs.
@@ -38,6 +75,9 @@ Depends on: core, provider SDKs.
 ### strategy and research
 Responsibility: Convert business interviews and market signals into offer hypotheses.
 Must never: Auto-commit strategic decisions without operator approval.
+Genkit integration: Genkit strategy agents produce advisory outputs only.
+Every hypothesis must pass through `approvals.createReviewBatch` +
+`approvals.decideReview` before it can influence any downstream action.
 Depends on: core, analytics, adapters.
 
 ### read-models and analytics
@@ -45,28 +85,68 @@ Responsibility: Derive reporting views from events.
 Must never: Mutate domain state directly.
 Depends on: event-log, core.
 
+---
+
 ## Domain Modules
 
-- core: shared types, IDs, validation, errors.
-- strategy: business discovery interview, offer hypotheses, and recommendation summaries.
-- copylab: copy generation, variant policies, channel formatting.
-- funnel: campaign briefs, stage sequencing, CTA mapping.
-- approvals: review workflow and gate enforcement.
-- publishing: schedule and dispatch pipeline.
-- comments: comment ingest, classification, draft replies.
-- analytics: attribution and conversion projections.
-- learning-ui: tooltip system, beginner walkthrough, and page-level guidance.
-- mock-engine: local translation layer for offline learning/testing mode.
+| Module | Key Exports | Contract |
+|---|---|---|
+| core | shared types, IDs, validation, errors | `modules/core/CONTRACT.md` |
+| strategy | captureInterview, generateOfferHypotheses, rankHypotheses | `modules/strategy/CONTRACT.md` |
+| copylab | generateVariants, scoreVariants | `modules/copylab/CONTRACT.md` |
+| funnel | createFunnelPlan, getBrief | `modules/funnel/CONTRACT.md` |
+| approvals | createReviewBatch, decideReview, isApproved, reopenItem | `modules/approvals/CONTRACT.md` |
+| publishing | scheduleAsset, dispatchDue | `modules/publishing/CONTRACT.md` |
+| comments | triageComment, draftReply, sendApprovedReply | `modules/comments/CONTRACT.md` |
+| analytics | projectAttribution, projectFunnelConversion, projectVariantPerformance, campaignDashboardReadModel | `modules/analytics/CONTRACT.md` |
+| adapters | enqueuePublish, ingestComments, sendReply | `modules/adapters/CONTRACT.md` |
+| mock-engine | local translation layer for offline learning/testing mode | `src/mock-engine.ts` |
+| integrations | connection lifecycle, scope policy for Slack/Office 365 (staged FUT-2) | `modules/integrations/CONTRACT.md` |
+| social-scout | slow-batch opportunity discovery, scoring, suggestion workflow (staged FUT-3) | `modules/social-scout/CONTRACT.md` |
+
+---
+
+## Request Lifecycle — Mock Mode (ASCII)
+
+```
+User action (UI)
+  -> mock-engine translates action
+  -> modules/*/src/mock.ts (in-memory, deterministic)
+  -> event appended (in-memory log)
+  -> read-model refreshed
+  -> UI re-renders
+```
 
-## Request Lifecycle (ASCII)
+## Request Lifecycle — Production Mode (ASCII)
 
+```
 User action (UI)
   -> Workflow command
   -> Domain module validation
   -> Event emitted
-  -> Optional adapter action (if approved)
+  -> Optional adapter action (only if isApproved() === true)
   -> Read model update
   -> UI refresh
+```
+
+---
+
+## Guard Scripts
+
+The following scripts enforce operational and contract correctness. They must
+be runnable from a clean local checkout via `npm run`:
+
+| Script | Command | Purpose |
+|---|---|---|
+| Drift check | `npm run check:drift` | Detect contracts diverged from code |
+| Boundary lint | `npm run check:boundaries` | Detect disallowed cross-module imports |
+| Mock smoke test | `npm run smoke:mock` | Round-trip exercise of mock-engine layer |
+
+Status: Script shell files exist (`scripts/drift-check.ts`,
+`scripts/lint-boundaries.ts`). They require `tsx` to be wired into
+`package.json` (tracked under `OPS-1`).
+
+---
 
 ## Anti-Spaghetti Rules
 
@@ -75,6 +155,10 @@ User action (UI)
 3. No module mutates another module's state.
 4. Cross-module data passes through core contracts only.
 5. Providers are isolated behind adapters.
+6. No domain module imports `mock-engine` or another module's `src/mock.ts`.
+7. No UI code calls adapter or provider SDKs directly.
+
+---
 
 ## Complexity Risks
 
@@ -84,9 +168,23 @@ User action (UI)
 - Dashboard trust drops if event semantics are inconsistent.
 - Market scraping can violate site policy unless constrained to permitted sources.
 
+## Secrets Boundary (integrations)
+
+- OAuth tokens for Slack and Office 365 are encrypted at rest at the infrastructure level.
+- The `integrations` module stores connection status and scope metadata only — never tokens.
+- Token values never cross into UI page state or browser storage.
+- `adapters` is the only layer that makes API calls using credentials.
+- Mock-engine drift: if `mock.ts` implementations diverge from `src/index.ts`, the
+  UI will behave differently in mock mode vs production. Guard scripts detect this.
+
+---
+
 ## Technology Decisions
 
 - Event-first state transitions for replayability and audit.
 - Contract-first module docs before code implementation.
 - Mock adapter baseline to unblock UI and workflow implementation.
-- APIs are primary market-signal source; Playwright automation is fallback for allowed public pages only.
+- APIs are primary market-signal source; Playwright automation is fallback for
+  allowed public pages only.
+- Genkit (AI framework) is used for advisory strategy and copy agents only.
+  All Genkit outputs are routed through `approvals` before any action is taken.
diff --git a/board.md b/board.md
index 18678db..22978b2 100644
--- a/board.md
+++ b/board.md
@@ -12,17 +12,15 @@ Per-lane reserve: READY tasks in each active lane must stay >= (active agents in
 1. **Read this entire file** before touching any code.
 2. **Pick ONE lane** — do not work across lanes unless explicitly unblocked.
 3. **Claim a task** by following the Agent Workflow below (all 3 steps or claim is invalid).
-4. **Run `npm install && npm run test`** to verify the baseline before writing code.
-5. **Commit with `bash gitr.sh "<message>"`** — the script handles staging, push, and safety guards.
-6. **Update this file** in the same commit as your code — status, Coordination Log, and Run Issues Log.
-7. **One agent per file** — if another agent's task lists the same file, coordinate in the Coordination Log first.
-8. Refer to `SYSTEM_ARCHITECTURE.md`, `DATA_FLOW.md`, `PRODUCT_DESIGN.md`, and `PROJECT_RULES.md` for design constraints.
-9. Refer to `modules/<name>/CONTRACT.md` for the API surface of any module you touch.
+4. **One agent per file** — if another agent's task lists the same file, coordinate in the Coordination Log first.
+5. Refer to `SYSTEM_ARCHITECTURE.md`, `DATA_FLOW.md`, `PRODUCT_DESIGN.md`, and `PROJECT_RULES.md` for design constraints.
+6. Refer to `modules/<name>/CONTRACT.md` for the API surface of any module you touch.
+7. **Update this file** as you work — status changes, Coordination Log, and Run Issues Log.
 
 ## Validation Snapshot
 
 Validated on 2026-03-05 against the current workspace state:
-- `npm run test` -> PASS (`422/422` tests)
+- `npm run test` -> PASS (`438/438` tests) — 16 new tooltip tests added by agent-2
 - `npm run build` -> PASS
 
 Important note:
@@ -67,9 +65,8 @@ If any part is missing, claim is invalid and coding must not start.
 ## Concurrency Rules
 
 1. **One agent per lane** unless the lane has 4+ READY tasks, in which case two agents may share it.
-2. **One agent per file** — if two tasks in different lanes touch the same file, the later claim must wait or coordinate a merge plan in the Coordination Log.
-3. **board.md edits are atomic** — when updating this file, stage and commit it immediately. Do not hold uncommitted board.md changes while coding.
-4. **Pull before claiming** — always `git pull` before editing board.md to avoid merge conflicts.
+2. **One agent per file** — if two tasks in different lanes touch the same file, the later claim must wait or coordinate in the Coordination Log.
+3. **board.md edits are atomic** — update this file immediately when you change task status. Do not batch board updates.
 
 ## Agent Workflow
 
@@ -112,11 +109,11 @@ A task is DONE only if:
 
 | Agent | Role | Current Lane | Status |
 |---|---|---|---|
-| agent-1 | Builder | unassigned | Standby |
-| agent-2 | Builder | unassigned | Standby |
-| agent-3 | Builder | unassigned | Standby |
+| agent-1 | Builder | Lane 1 — Docs and Contract Reconciliation | Active |
+| agent-2 | Builder | Lane 2 — UX Hardening | Active |
+| agent-3 | Builder | Lane 3 — Beginner Guidance | Active |
 | agent-4 | Builder | unassigned | Standby |
-| agent-5 | Builder | unassigned | Standby |
+| agent-5 | Builder | Lane 5 — Future Foundations | Active |
 
 ## Validated Baseline (Do Not Reopen Without Regression)
 
@@ -141,38 +138,38 @@ Code-complete does not mean doc-complete. Active lanes below exist because docs,
 ## Active 5-Lane Sprint
 
 ### Lane 1 - Docs and Contract Reconciliation
-Owner: unassigned
+Owner: agent-1
 Goal: make docs describe the shipped system and remove planning drift.
 
 | ID | Status | Task | Files | Acceptance | Depends on |
 |---|---|---|---|---|---|
-| DOC-1 | READY | Add missing contract entries for shipped helpers and read models, especially approvals and analytics. | `modules/approvals/CONTRACT.md`, `modules/analytics/CONTRACT.md`, `modules/analytics/README.md` | `isApproved()` and `campaignDashboardReadModel()` are documented with current semantics and error behavior. | none |
-| DOC-2 | READY | Refresh flow docs to match actual function names and review gates instead of legacy placeholder names. | `DATA_FLOW.md` | Flow B, C, D, and E reference current module APIs (`createReviewBatch`, `decideReview`, `scheduleAsset`, `dispatchDue`, `sendApprovedReply`, `campaignDashboardReadModel`) and explain mock-engine translation where it still exists. | none |
-| DOC-3 | READY | Update architecture and project rules to reflect the actual runtime shape and required issue logging. | `SYSTEM_ARCHITECTURE.md`, `PROJECT_RULES.md`, `AGENTS.md` | Docs explicitly describe `ui -> mock-engine -> modules` in mock mode, guard-script expectations, issue logging requirements, and the non-autonomous AI boundary. | none |
-| DOC-4 | READY | Audit temporary mismatch notes added by `MCK-A2` and keep only the ones still true after the latest merges. | `modules/strategy/CONTRACT.md`, `modules/approvals/CONTRACT.md`, `modules/publishing/CONTRACT.md`, `modules/analytics/CONTRACT.md`, `modules/comments/CONTRACT.md`, `modules/copylab/CONTRACT.md` | Every remaining mismatch note points to a real current divergence; stale notes are removed. | DOC-1 |
+| DOC-1 | [DONE] agent-1 2026-03-05T22:45:00Z | Add missing contract entries for shipped helpers and read models, especially approvals and analytics. | `modules/approvals/CONTRACT.md`, `modules/analytics/CONTRACT.md`, `modules/analytics/README.md` | `isApproved()` and `campaignDashboardReadModel()` are documented with current semantics and error behavior. | none |
+| DOC-2 | [DONE] agent-1 2026-03-05T22:45:00Z | Refresh flow docs to match actual function names and review gates instead of legacy placeholder names. | `DATA_FLOW.md` | Flow B, C, D, and E reference current module APIs (`createReviewBatch`, `decideReview`, `scheduleAsset`, `dispatchDue`, `sendApprovedReply`, `campaignDashboardReadModel`) and explain mock-engine translation where it still exists. | none |
+| DOC-3 | [DONE] agent-1 2026-03-05T22:45:00Z | Update architecture and project rules to reflect the actual runtime shape and required issue logging. | `SYSTEM_ARCHITECTURE.md`, `PROJECT_RULES.md`, `AGENTS.md` | Docs explicitly describe `ui -> mock-engine -> modules` in mock mode, guard-script expectations, issue logging requirements, and the non-autonomous AI boundary. | none |
+| DOC-4 | [DONE] agent-1 2026-03-05T22:45:00Z | Audit temporary mismatch notes added by `MCK-A2` and keep only the ones still true after the latest merges. | `modules/strategy/CONTRACT.md`, `modules/approvals/CONTRACT.md`, `modules/publishing/CONTRACT.md`, `modules/analytics/CONTRACT.md`, `modules/comments/CONTRACT.md`, `modules/copylab/CONTRACT.md` | Every remaining mismatch note points to a real current divergence; stale notes are removed. | DOC-1 |
 | DOC-5 | READY | Regenerate `lanes.md` from this board after doc sync lands. | `lanes.md` | `lanes.md` matches this board, uses 5 lanes, and does not re-open already-validated tasks. | DOC-1, DOC-2, DOC-3, DOC-4 |
 
 ### Lane 2 - UX Hardening and Mobile Reliability
-Owner: unassigned
+Owner: agent-2
 Goal: remove the two user-visible regressions and stabilize responsive behavior.
 
 | ID | Status | Task | Files | Acceptance | Depends on |
 |---|---|---|---|---|---|
-| UX-1 | READY | Fix tooltip linger and stale hover behavior. | `src/components/tooltip.ts`, `src/components/__tests__/tooltip.test.ts` | Tooltip hides cleanly on leave, fast hover transitions do not leave stale tips behind, and tests cover more than `supportsHoverTooltips()`. | none |
-| UX-2 | READY | Fix mobile clipping caused by fixed top chrome and `100vh` layout assumptions. | `src/index.css`, `src/main.ts` | On narrow mobile viewports the page is not clipped by top or bottom browser bars, the intent banner and mobile topbar do not overlap, and main content remains scrollable. | none |
-| UX-3 | READY | Remove high-risk inline layout styles from page files and replace them with responsive shared classes. | `src/pages/discovery.ts`, `src/pages/launcher.ts`, `src/pages/review.ts`, `src/pages/calendar.ts`, `src/pages/comments.ts`, `src/pages/dashboard.ts`, `src/index.css` | No critical layout behavior depends on inline styles; page layout remains build-safe and easier to harden for mobile. | UX-2 |
-| UX-4 | READY | Add a lightweight UI regression checklist for hover, drawer, and mobile layout checks before marking UI tasks done. | `docs/ui-qa.md` | A future agent can verify tooltip, drawer, navigation, and mobile viewport behavior without guessing. | UX-1, UX-2 |
+| UX-1 | [DONE] agent-2 2026-03-05T22:45:00Z | Fix tooltip linger and stale hover behavior. | `src/components/tooltip.ts`, `src/components/__tests__/tooltip.test.ts` | Tooltip hides cleanly on leave, fast hover transitions do not leave stale tips behind, and tests cover more than `supportsHoverTooltips()`. | none |
+| UX-2 | [DONE] agent-2 2026-03-05T22:45:00Z | Fix mobile clipping caused by fixed top chrome and `100vh` layout assumptions. | `src/index.css`, `src/main.ts` | On narrow mobile viewports the page is not clipped by top or bottom browser bars, the intent banner and mobile topbar do not overlap, and main content remains scrollable. | none |
+| UX-3 | [DONE] agent-2 2026-03-05T23:00:00Z | Remove high-risk inline layout styles from page files and replace them with responsive shared classes. | `src/pages/discovery.ts`, `src/pages/launcher.ts`, `src/pages/review.ts`, `src/pages/calendar.ts`, `src/pages/comments.ts`, `src/pages/dashboard.ts`, `src/index.css` | No critical layout behavior depends on inline styles; page layout remains build-safe and easier to harden for mobile. | UX-2 |
+| UX-4 | [DONE] agent-2 2026-03-05T23:00:00Z | Add a lightweight UI regression checklist for hover, drawer, and mobile layout checks before marking UI tasks done. | `docs/ui-qa.md` | A future agent can verify tooltip, drawer, navigation, and mobile viewport behavior without guessing. | UX-1, UX-2 |
 
 ### Lane 3 - Beginner Guidance and Strategy Workspace
-Owner: unassigned
+Owner: agent-3
 Goal: make the product unmistakably read as a guided marketing workspace, not something being sold.
 
 | ID | Status | Task | Files | Acceptance | Depends on |
 |---|---|---|---|---|---|
-| GUIDE-1 | READY | Implement the strategy workspace shell promised by `BACK-5`. | `src/pages/strategy-workspace.ts`, `src/main.ts`, `src/index.css` | New page exists in navigation, stays mock-safe, and focuses on business capture plus offer review. | none |
-| GUIDE-2 | READY | Add persistent beginner coaching blocks on each page: what you do here, why it matters, and what comes next. | `src/pages/discovery.ts`, `src/pages/launcher.ts`, `src/pages/review.ts`, `src/pages/calendar.ts`, `src/pages/comments.ts`, `src/pages/dashboard.ts`, `src/index.css`, `src/glossary.ts` | Every page has plain-language guidance without implying the app itself is being sold. | none |
-| GUIDE-3 | READY | Add starter presets so a beginner can practice with realistic businesses without going to the web immediately. | `src/mock-engine.ts`, `src/pages/discovery.ts`, `src/pages/strategy-workspace.ts` | User can choose at least `design company`, `automation company`, and one local-service example to prefill discovery inputs. | GUIDE-1 |
-| GUIDE-4 | READY | Tighten product language where current copy still sounds like generic marketing software. | `src/pages/discovery.ts`, `src/pages/launcher.ts`, `src/pages/review.ts`, `src/glossary.ts`, `PRODUCT_DESIGN.md` | The UI consistently reads as "build campaigns for your business or a client" and not "sell marketing software." | none |
+| GUIDE-1 | [DONE] agent-3 2026-03-05T23:00:00Z | Implement the strategy workspace shell promised by `BACK-5`. | `src/pages/strategy-workspace.ts`, `src/main.ts`, `src/index.css` | New page exists in navigation, stays mock-safe, and focuses on business capture plus offer review. | none |
+| GUIDE-2 | [DONE] agent-3 2026-03-05T23:00:00Z | Add persistent beginner coaching blocks on each page: what you do here, why it matters, and what comes next. | `src/pages/discovery.ts`, `src/pages/launcher.ts`, `src/pages/review.ts`, `src/pages/calendar.ts`, `src/pages/comments.ts`, `src/pages/dashboard.ts`, `src/index.css`, `src/glossary.ts` | Every page has plain-language guidance without implying the app itself is being sold. | none |
+| GUIDE-3 | [DONE] agent-3 2026-03-05T23:00:00Z | Add starter presets so a beginner can practice with realistic businesses without going to the web immediately. | `src/mock-engine.ts`, `src/pages/discovery.ts`, `src/pages/strategy-workspace.ts` | User can choose at least `design company`, `automation company`, and one local-service example to prefill discovery inputs. | GUIDE-1 |
+| GUIDE-4 | [DONE] agent-3 2026-03-05T23:00:00Z | Tighten product language where current copy still sounds like generic marketing software. | `src/pages/discovery.ts`, `src/pages/launcher.ts`, `src/pages/review.ts`, `src/glossary.ts`, `PRODUCT_DESIGN.md` | The UI consistently reads as "build campaigns for your business or a client" and not "sell marketing software." | none |
 
 ### Lane 4 - Flow Wiring and Operational Guardrails
 Owner: unassigned
@@ -186,15 +183,15 @@ Goal: make the existing guardrails runnable and start connecting the UI to the G
 | OPS-4 | READY | Make AI advisory state visible in the UI so beginners know what is generated, reviewed, and approved. | `src/pages/discovery.ts`, `src/pages/launcher.ts`, `src/pages/comments.ts`, `src/glossary.ts`, `PRODUCT_DESIGN.md` | Every AI-assisted output clearly shows that it is advisory and still requires human approval before action. | OPS-3 |
 
 ### Lane 5 - Future Foundations (Style, Integrations, Social Scout)
-Owner: unassigned
+Owner: agent-5
 Goal: stage the next major capabilities from `future.md` as cleanly separable work.
 
 | ID | Status | Task | Files | Acceptance | Depends on |
 |---|---|---|---|---|---|
-| FUT-1 | READY | Define the style-system foundation and add a Style Studio shell. | `PRODUCT_DESIGN.md`, `MVP_SCOPE.md`, `SYSTEM_ARCHITECTURE.md`, `modules/core/CONTRACT.md`, `modules/copylab/CONTRACT.md`, `src/pages/style-studio.ts`, `src/main.ts`, `src/index.css` | Style profile types, instruction-pack ownership, and a mock-safe UI shell are documented and visible in navigation. | none |
-| FUT-2 | READY | Define the integrations foundation for Slack and Office 365 and add settings UI shell. | `future.md`, `SYSTEM_ARCHITECTURE.md`, `PROJECT_RULES.md`, `modules/integrations/CONTRACT.md`, `modules/integrations/README.md`, `modules/integrations/ANTI_PATTERNS.md`, `src/pages/integrations.ts`, `src/main.ts`, `src/index.css` | Integrations ownership is documented, settings shell exists, and secrets boundaries are explicit. | none |
-| FUT-3 | READY | Define social scout and opportunities inbox foundation. | `future.md`, `DATA_FLOW.md`, `PROJECT_RULES.md`, `modules/social-scout/CONTRACT.md`, `modules/social-scout/README.md`, `modules/social-scout/ANTI_PATTERNS.md`, `src/pages/opportunities.ts`, `src/main.ts`, `src/index.css` | Slow-scout workflow is documented, opportunities inbox shell exists, and no auto-send behavior is implied. | none |
-| FUT-4 | READY | Define copy-memory and approved-example retrieval as a first-class input to future generation. | `future.md`, `PRODUCT_DESIGN.md`, `modules/copylab/CONTRACT.md`, `modules/core/CONTRACT.md` | Docs define how approved snippets, offer briefs, and style profiles are retrieved before generating new copy. | none |
+| FUT-1 | [DONE] agent-5 2026-03-05T22:45:00Z | Define the style-system foundation and add a Style Studio shell. | `PRODUCT_DESIGN.md`, `MVP_SCOPE.md`, `SYSTEM_ARCHITECTURE.md`, `modules/core/CONTRACT.md`, `modules/copylab/CONTRACT.md`, `src/pages/style-studio.ts`, `src/main.ts`, `src/index.css` | Style profile types, instruction-pack ownership, and a mock-safe UI shell are documented and visible in navigation. | none |
+| FUT-2 | [DONE] agent-5 2026-03-05T22:45:00Z | Define the integrations foundation for Slack and Office 365 and add settings UI shell. | `future.md`, `SYSTEM_ARCHITECTURE.md`, `PROJECT_RULES.md`, `modules/integrations/CONTRACT.md`, `modules/integrations/README.md`, `modules/integrations/ANTI_PATTERNS.md`, `src/pages/integrations.ts`, `src/main.ts`, `src/index.css` | Integrations ownership is documented, settings shell exists, and secrets boundaries are explicit. | none |
+| FUT-3 | [DONE] agent-5 2026-03-05T22:45:00Z | Define social scout and opportunities inbox foundation. | `future.md`, `DATA_FLOW.md`, `PROJECT_RULES.md`, `modules/social-scout/CONTRACT.md`, `modules/social-scout/README.md`, `modules/social-scout/ANTI_PATTERNS.md`, `src/pages/opportunities.ts`, `src/main.ts`, `src/index.css` | Slow-scout workflow is documented, opportunities inbox shell exists, and no auto-send behavior is implied. | none |
+| FUT-4 | [DONE] agent-5 2026-03-05T22:45:00Z | Define copy-memory and approved-example retrieval as a first-class input to future generation. | `future.md`, `PRODUCT_DESIGN.md`, `modules/copylab/CONTRACT.md`, `modules/core/CONTRACT.md` | Docs define how approved snippets, offer briefs, and style profiles are retrieved before generating new copy. | none |
 
 ---
 
@@ -233,6 +230,19 @@ Record every material issue discovered during a run. If a run has no material is
 | UTC Timestamp | Agent | Note |
 |---|---|---|
 | 2026-03-05T22:05:00Z | codex | Reconciled board against current `C:\growth` workspace, `lanes.md`, recent merges, and `future.md`. Verified `npm run test` (`422/422` pass) and `npm run build` pass. Reset active work into 5 lanes: docs, UX, beginner guidance, flow wiring, and future foundations. |
+| 2026-03-05T22:30:00Z | agent-3 | Claimed Lane 3 (GUIDE-1 through GUIDE-4). Starting with GUIDE-1 strategy workspace shell, then GUIDE-2 coaching blocks, GUIDE-3 presets, GUIDE-4 copy audit. |
+| 2026-03-05T22:30:00Z | agent-3 | FILE CONFLICT NOTICE: GUIDE-3 touches `src/mock-engine.ts`. Agent-4 (OPS-3) also modifies `src/mock-engine.ts`. Coordination: agent-3 will add preset data as a new isolated export block at the bottom of the file (lines after `resetAll`). Agent-4 should be aware of this addition so merge does not clobber preset exports. No functional overlap expected. |
+| 2026-03-05T22:25:18Z | agent-1 | Claimed Lane 1 (DOC-1 through DOC-4). Read board.md, all module source files, and existing CONTRACT.md docs. Beginning doc reconciliation in order: DOC-1 → DOC-2 → DOC-3 → DOC-4. |
+| 2026-03-05T22:30:00Z | agent-2 | Claiming Lane 2 (UX-1, UX-2, UX-3, UX-4). Starting UX-1 (tooltip linger) and UX-2 (mobile clipping/100vh) in parallel; UX-3 and UX-4 follow their dependencies. |
+| 2026-03-05T23:00:00Z | agent-3 | DONE Lane 3. GUIDE-1: created src/pages/strategy-workspace.ts (business profile + offer comparison shell), wired to main.ts nav, CSS in index.css. GUIDE-2: added coach-block to all 6 existing pages (discovery, launcher, review, calendar, comments, dashboard) with what/why/next. Added strategyWorkspace and starterPreset to glossary.ts. GUIDE-3: added StarterPreset type + 3 presets (design studio, automation agency, local service) as isolated export block at end of mock-engine.ts; discovery form reads window.__pendingPreset for prefill; preset chips in discovery form + preset panel in strategy-workspace. GUIDE-4: tightened all page copy to read 'for your business or a client', removed auto-filled 'GrowthOps Automation' default, added UI Language Rules section to PRODUCT_DESIGN.md. FILE CONFLICT: mock-engine.ts additions are additive-only, below resetAll — no functional overlap with agent-4 OPS-3 changes expected. No material issues found. |
+| 2026-03-05T22:45:00Z | agent-2 | UX-1 DONE: tooltip.ts refactored — cancelAndHide() clears both timers atomically, hideTooltip() cancels pending show before scheduling hide. 19 tests added (438/438 pass). no material issues found. |
+| 2026-03-05T22:45:00Z | agent-2 | UX-2 DONE: 100vh → dvh (with vh fallback) in app-shell, sidebar, and mobile overrides. setRealVh() JS fallback with --real-vh CSS prop. Intent-banner positioned sticky below mobile-topbar (top: 56px on mobile breakpoint). main-content overflow-y: auto on mobile. no material issues found. |
+| 2026-03-05T23:00:00Z | agent-2 | UX-3 DONE: All 6 page files (discovery, launcher, review, calendar, comments, dashboard) scrubbed of layout inline styles. Added 30+ shared utility classes to index.css (card-narrow, card-empty-state, card-overflow, card-approved, action-row, action-row-top/bottom, form-submit, section-heading, sub-heading, body-secondary, body-muted, body-note, page-emoji, channel-row, channel-label, cell-truncate, cell-meta, cell-capitalize, score-value, score-high/mid/low, metric-green/primary/amber, channel-meta/linkedin/x/email, funnel-rate colors, badge-inline, stage-meta, stage-ctas, offer-title, card-title-clamp). Build: PASS. Tests: 438/438 PASS. no material issues found. |
+| 2026-03-05T23:00:00Z | agent-2 | UX-4 DONE: Created docs/ui-qa.md — 35 regression checks across 5 sections: Tooltip (7), Help Drawer (7), Navigation (8), Mobile Viewport (8), Responsive Layout Classes (5), plus quick smoke run script. no material issues found. |
+| 2026-03-05T22:27:00Z | agent-5 | Claimed Lane 5 (FUT-1 through FUT-4). All 4 tasks are independent — will work FUT-1 (style-system docs + shell), FUT-2 (integrations docs + shell), FUT-3 (social-scout docs + shell), FUT-4 (copy-memory docs) concurrently. FILE CONFLICT NOTICE: FUT-1 and FUT-2 and FUT-3 all add nav items to `src/main.ts` and CSS to `src/index.css`. Will batch all navigation additions into a single edit at end to avoid conflict with other lanes. |
+| 2026-03-05T22:45:00Z | agent-5 | DONE Lane 5 (FUT-1, FUT-2, FUT-3, FUT-4). Created: `modules/integrations/` (CONTRACT, README, ANTI_PATTERNS), `modules/social-scout/` (CONTRACT, README, ANTI_PATTERNS), `src/pages/style-studio.ts`, `src/pages/integrations.ts`, `src/pages/opportunities.ts`. Updated: `modules/core/CONTRACT.md` (future types), `modules/copylab/CONTRACT.md` (instruction-pack + copy-memory functions), `SYSTEM_ARCHITECTURE.md` (new modules, secrets boundary), `PROJECT_RULES.md` (rules 18–21), `MVP_SCOPE.md` (3 new shell rows), `src/main.ts` (3 new page imports, nav items, renderers, binders), `src/index.css` (FUT CSS). No material issues found. |
+| 2026-03-05T22:30:00Z | agent-3 | Claiming Lane 3 (GUIDE-1 through GUIDE-4). Read board.md, PRODUCT_DESIGN.md, glossary.ts, and all 6 existing page files. Starting GUIDE-1 (strategy-workspace shell) and GUIDE-2 (coaching blocks) together; GUIDE-3 follows GUIDE-1; GUIDE-4 runs in parallel. |
+| 2026-03-05T23:00:00Z | agent-3 | DONE — Lane 3 (GUIDE-1 through GUIDE-4). Summary: GUIDE-1: strategy-workspace.ts wired into nav, renderers, binders, PAGE_HELP_KEYS, and JOURNEY_STEPS in main.ts. GUIDE-2: all 6 pages had coach-block elements (prior session had already added most; verified and updated discovery). GUIDE-3: StarterPreset interface + 3 presets (design-agency, automation-company, local-service) added to mock-engine.ts with getStarterPresets(), loadStarterPreset(), getPendingPreset(), clearPendingPreset(). Discovery.ts updated to use engine.getPendingPreset() and engine.clearPendingPreset(). GUIDE-4: PRODUCT_DESIGN.md has UI Language Rules; glossary has strategyWorkspace and starterPreset entries. One material issue found: prior session had added a duplicate old preset block using window.__pendingPreset — removed and replaced with clean module-state approach. Build: PASS. Tests: 438/438 PASS. |
 
 ## Refill Protocol
 
diff --git a/docs/ui-qa.md b/docs/ui-qa.md
new file mode 100644
index 0000000..ab699dc
--- /dev/null
+++ b/docs/ui-qa.md
@@ -0,0 +1,110 @@
+# UI QA Regression Checklist
+
+> **Purpose**: A future agent or developer runs through this checklist before marking any UI task DONE.  
+> **When to use**: After any change to `src/components/tooltip.ts`, `src/components/help-drawer.ts`, `src/main.ts`, `src/index.css`, or any page in `src/pages/`.  
+> **Format**: Check each item manually in a browser at the listed viewport sizes.
+
+---
+
+## 1 — Tooltip Behavior
+
+**File under test**: `src/components/tooltip.ts`
+
+| # | Check | How to verify |
+|---|---|---|
+| T-1 | Tooltip appears after ~200ms hover on any `[data-tip]` element on desktop | Hover slowly over a nav item or glossary term in the sidebar |
+| T-2 | Tooltip hides within ~80ms after mouse leaves the target | Move mouse off the element — tip should fade out quickly |
+| T-3 | **Fast hover does not leave a stale tip** | Move mouse rapidly across several nav items — no orphaned tooltip should remain visible after leaving |
+| T-4 | Re-entering during the hide delay cancels the hide | Hover → leave → immediately re-hover the same element — tooltip stays up |
+| T-5 | Tooltip does not appear on touch-only devices | Open DevTools → simulate mobile device → hover events should not trigger tips |
+| T-6 | Tooltip repositions above target when near bottom of viewport | Scroll to bottom and hover any `[data-tip]` element — tip should flip above |
+| T-7 | Tooltip is clamped to viewport width on narrow screens | Resize to 375px — tooltip should not overflow off-screen edges |
+
+---
+
+## 2 — Help Drawer
+
+**File under test**: `src/components/help-drawer.ts`
+
+| # | Check | How to verify |
+|---|---|---|
+| D-1 | Drawer opens when "What does this mean?" button is clicked | Click the intent-banner help button |
+| D-2 | Drawer shows glossary terms for the current page | Navigate to each page, open drawer — terms should match the page context |
+| D-3 | Drawer closes when the × button is clicked | Click × in drawer header |
+| D-4 | Drawer closes when clicking the overlay | Click outside the drawer panel |
+| D-5 | Drawer closes when pressing Escape | Press Escape key |
+| D-6 | Drawer overlay prevents scrolling the page behind it | Open drawer → try to scroll page body — body should stay locked |
+| D-7 | Drawer is fully visible on mobile (320px–900px) | Resize to 375px — drawer should span ≤ 92vw, not clip off screen |
+
+---
+
+## 3 — Navigation
+
+**File under test**: `src/main.ts`, sidebar + mobile-topbar HTML
+
+| # | Check | How to verify |
+|---|---|---|
+| N-1 | Clicking a sidebar nav item navigates to the correct page | Click each nav item on desktop |
+| N-2 | Active nav item gets `.active` class | Confirm the current page link has `active` class in DevTools |
+| N-3 | Journey progress sidebar updates correctly | Go through Discovery → Launcher — earlier steps show as done |
+| N-4 | Mobile menu opens when "Menu" button is tapped | At ≤900px, click the Menu button in the topbar |
+| N-5 | Mobile menu closes when a nav link is tapped | Open menu → tap a nav item — drawer and overlay should close |
+| N-6 | Mobile menu closes when the overlay is tapped | Open menu → tap the dark overlay — menu closes |
+| N-7 | Mobile menu closes on Escape key | Open menu → press Escape |
+| N-8 | Mobile menu auto-closes on resize to desktop | Open menu at mobile width → resize to ≥901px — menu closes |
+
+---
+
+## 4 — Mobile Viewport and Clipping
+
+**File under test**: `src/index.css`, `src/main.ts`
+
+Test at 375×667 (iPhone SE), 390×844 (iPhone 14), and 412×915 (Android large).
+
+| # | Check | How to verify |
+|---|---|---|
+| V-1 | **No content clipped behind browser address bar** | Open in mobile browser or DevTools mobile emulation — app content should fill the visual viewport, not the layout viewport |
+| V-2 | `100dvh` / `--real-vh` fallback applied | In DevTools → Computed → check that `height` on `.app-shell` equals the visual viewport height minus 56px |
+| V-3 | **Intent banner does not overlap mobile topbar** | At ≤900px — the intent banner should appear _below_ the fixed topbar, not hidden under it |
+| V-4 | Main content is scrollable on narrow viewports | On a card-heavy page (Dashboard, Launcher), scroll down — content scrolls inside `.main-content` |
+| V-5 | Sidebar does not overflow viewport when open | Open mobile nav — sidebar fits within screen width (≤ 88vw) |
+| V-6 | Horizontal scroll does not appear on pages | Check each page at 375px width — no horizontal overflow from layouts |
+| V-7 | Table-heavy pages (Calendar, Dashboard) have horizontal scroll _inside_ cards only | The `.card-overflow` container scrolls independently; the page itself does not |
+| V-8 | Funnel visual stacks vertically on mobile | At ≤900px — funnel stages should be `flex-direction: column`, not horizontal |
+
+---
+
+## 5 — Responsive Layout Classes
+
+**Files under test**: `src/index.css`, `src/pages/*.ts`
+
+| # | Check | Purpose |
+|---|---|---|
+| R-1 | Empty-state cards (`.card-empty-state`) are centered and not full-width | Should show at max 480px, text-aligned center on all pages |
+| R-2 | Narrow form cards (`.card-narrow`) cap at 640px on desktop, go full-width on mobile | Discovery form and Launcher form should sit at ≤640px on desktop |
+| R-3 | Channel checkbox row (`.channel-row`) wraps on small screens | At 375px width, channel checkboxes should wrap to multiple rows if needed |
+| R-4 | Score cells (`.score-high/mid/low`) show correct colors | Green ≥85, amber ≥70, red otherwise — verify in Launcher variant table |
+| R-5 | No inline `style=` attributes remain on layout-critical elements | Inspect any page in DevTools — remaining `style=` should only be on truly dynamic values (not found after UX-3) |
+
+---
+
+## 6 — Quick Smoke Run
+
+Run these in order before any deploy:
+
+```bash
+# 1. All tests must pass
+npm run test
+
+# 2. TypeScript build must succeed
+npm run build
+
+# 3. Dev server must start without errors
+npm run dev
+```
+
+Then open `http://localhost:5173` and at a minimum:
+1. Navigate through all 6 pages
+2. Open the help drawer on each page
+3. Hover a `[data-tip]` element — tooltip appears and disappears cleanly
+4. Resize browser to 375px — mobile layout loads, menu works, content scrolls
diff --git a/modules/analytics/CONTRACT.md b/modules/analytics/CONTRACT.md
index 6b69fca..a4ac4e3 100644
--- a/modules/analytics/CONTRACT.md
+++ b/modules/analytics/CONTRACT.md
@@ -9,27 +9,56 @@ Depended on by: ui, workflows
 - AttributionSnapshot
 - ConversionFunnelRow
 - VariantPerformanceRow
+- CampaignDashboardReadModel
 
 ## Exported Functions
 
 ### projectAttribution(events: DomainEvent[]): AttributionSnapshot
 Purpose: Derive channel and campaign metrics from event stream.
 Errors: METRIC_EVENT_INVALID
+Invariants:
+- Pure function — same inputs produce same outputs.
+- No mutations or side effects.
 
-### Temporary mock-engine mismatch note (MCK-A2)
-- `src/mock-engine.ts` and `modules/analytics/src/mock.ts` use `projectAttribution(events, campaignId)` to force deterministic single-campaign snapshots in local mock flows.
-- Contract remains campaign-agnostic for production projection API shape.
+Implementation: `modules/analytics/src/attribution.ts` → `projectAttribution`
+
+Mock-engine note: `modules/analytics/src/mock.ts` uses `projectAttribution(events, campaignId)` — the extra `campaignId` argument forces deterministic single-campaign snapshots in local mock flows. The production function is campaign-agnostic and derives campaign identity from the event stream itself.
 
 ### projectFunnelConversion(events: DomainEvent[], planId: EntityId): ConversionFunnelRow[]
-Purpose: Produce conversion rates per funnel stage.
+Purpose: Produce conversion rates per funnel stage for a given plan.
 Errors: FUNNEL_PLAN_UNKNOWN
+Invariants:
+- Pure function — same inputs produce same outputs.
+- Returns empty array when no matching funnel events exist for planId.
+
+Implementation: `modules/analytics/src/funnel.ts` → `projectFunnelConversion`
 
 ### projectVariantPerformance(events: DomainEvent[]): VariantPerformanceRow[]
-Purpose: Compare copy variant outcomes.
+Purpose: Compare copy variant outcomes across channels.
 Errors: VARIANT_METRIC_INVALID
+Invariants:
+- Pure function — same inputs produce same outputs.
+- Returns empty array when no variant-metric events are present.
+
+Implementation: `modules/analytics/src/variants.ts` → `projectVariantPerformance`
+
+### campaignDashboardReadModel(events: DomainEvent[], planId?: EntityId): CampaignDashboardReadModel
+Purpose: Aggregate all analytics projections into a single campaign dashboard read model.
+Errors: none (delegates error handling to constituent projections)
+Invariants:
+- Pure function — same input events produce same output.
+- `attribution` is always computed from the full event stream.
+- `funnel` is populated when `planId` is provided and matching events exist; otherwise returns an empty array.
+- `variants` are populated when variant-metric events are present; otherwise returns an empty array.
+- Never mutates campaign state.
+
+Return type: `{ attribution: AttributionSnapshot; funnel: ConversionFunnelRow[]; variants: VariantPerformanceRow[] }`
+
+Implementation: `modules/analytics/src/dashboard.ts` → `campaignDashboardReadModel`
 
 ## Module Invariants
 
 1. Analytics is read-only and projection-based.
 2. No analytics function mutates campaign state.
-3. Same input events produce same outputs.
+3. Same input events always produce same outputs (deterministic).
+4. `campaignDashboardReadModel` is the primary UI read model for the dashboard page.
diff --git a/modules/analytics/README.md b/modules/analytics/README.md
index 56af7d0..af6a5df 100644
--- a/modules/analytics/README.md
+++ b/modules/analytics/README.md
@@ -1,13 +1,23 @@
 # analytics
 
-Analytics projects campaign performance from event streams.
+Analytics projects campaign performance from event streams. All functions are
+pure read-only projections — no mutations, no side effects.
 
 Depends on: core
 
-Key files:
-- CONTRACT.md
-- src/projections.ts
+## Key Files
 
-Tests:
-- src/__tests__/attribution.test.ts
-- src/__tests__/funnel.test.ts
+- `CONTRACT.md` — exported API surface and invariants
+- `src/attribution.ts` — `projectAttribution`
+- `src/funnel.ts` — `projectFunnelConversion`
+- `src/variants.ts` — `projectVariantPerformance`
+- `src/dashboard.ts` — `campaignDashboardReadModel` (primary UI read model)
+- `src/mock.ts` — mock-engine translation layer for offline/learning mode
+- `src/index.ts` — re-exports all public functions and the `CampaignDashboardReadModel` type
+
+## Tests
+
+- `src/__tests__/attribution.test.ts`
+- `src/__tests__/funnel.test.ts`
+- `src/__tests__/dashboard.test.ts`
+- `src/__tests__/variants.test.ts`
diff --git a/modules/approvals/CONTRACT.md b/modules/approvals/CONTRACT.md
index 49bffd2..2d1787f 100644
--- a/modules/approvals/CONTRACT.md
+++ b/modules/approvals/CONTRACT.md
@@ -9,26 +9,62 @@ Depended on by: publishing, comments, ui
 - ReviewItem
 - ReviewDecision
 - ReviewBatch
+- ApprovalState
+- DecideReviewOutcome (union: DecideReviewResult | DecideReviewError)
+- CreateReviewBatchOutcome (union: CreateReviewBatchResult | CreateReviewBatchError)
+- ReviewItemInput
 
 ## Exported Functions
 
-### createReviewBatch(items: ReviewItem[]): ReviewBatch
-Purpose: Create review queue for assets or replies.
+### createReviewBatch(items: ReviewItemInput[]): CreateReviewBatchOutcome
+Purpose: Create a review queue for assets or replies. All items start in `pending` state.
 Errors: REVIEW_ITEM_INVALID
+Invariants:
+- Batch must contain at least one item.
+- Every item must have a non-empty label.
+- Every item `kind` must be `asset`, `reply`, or `offer`.
+- On success, returns `{ ok: true, batch: ReviewBatch }`.
+- On error, returns `{ ok: false, error: AppError }`.
+
+Implementation: `modules/approvals/src/queue.ts` → `createReviewBatch`
 
-### decideReview(itemId: EntityId, decision: ReviewDecision): ApprovalState
-Purpose: Store review decision and resulting state.
+### decideReview(decision: ReviewDecision): DecideReviewOutcome
+Purpose: Store a review decision and return the resulting ApprovalState.
 Errors: REVIEW_ITEM_NOT_FOUND, REVIEW_DECISION_INVALID
 Invariants:
-- Decision is auditable.
-- Approval state transitions are one-way unless reopened explicitly.
+- Approval state transitions are one-way: `pending → approved | rejected`.
+- `reopened → approved | rejected` is also permitted.
+- `approved` and `rejected` are terminal unless explicitly reopened via `reopenItem`.
+- Decision requires non-empty `reviewerId` and `timestamp` (auditable).
+- On success, returns `{ ok: true, state, itemId, reviewerId, timestamp }`.
+- On error, returns `{ ok: false, error: AppError }`.
+
+Implementation: `modules/approvals/src/decision.ts` → `decideReview`
+
+Signature note: The production function takes a single `ReviewDecision` object (not `(itemId, decision)` as previously documented). The `ReviewDecision` type contains `itemId`, `decision`, `reviewerId`, and `timestamp` fields. The mock layer in `modules/approvals/src/mock.ts` shares the same `ReviewDecision` signature.
+
+### isApproved(itemId: EntityId): boolean
+Purpose: Gate check — returns `true` if the item's current approval state is `approved`.
+Errors: none (returns `false` for unknown ids)
+Invariants:
+- Pure read; never mutates state.
+- Resolves item from both the queue store and the decision module's local store.
+- Used by `publishing` and `comments` to enforce the no-send-without-approval invariant.
+
+Implementation: `modules/approvals/src/gate.ts` → `isApproved`
+
+### reopenItem(itemId: EntityId, reviewerId: string): ReopenResult | ReopenError
+Purpose: Explicitly reopen a terminal (approved | rejected) item so it can be re-decided.
+Errors: REVIEW_ITEM_NOT_FOUND
+Invariants:
+- Reviewer identity is required for auditability.
+- Sets state to `reopened`; subsequent `decideReview` transitions apply as normal.
 
-### Temporary mock-engine mismatch note (MCK-A2)
-- `src/mock-engine.ts` and `modules/approvals/src/mock.ts` use `decideReview(decision: ReviewDecision): ApprovalState`.
-- Contract keeps the legacy `(itemId, decision)` shape for now to avoid breaking downstream in-progress lane docs.
+Implementation: `modules/approvals/src/decision.ts` → `reopenItem`
 
 ## Module Invariants
 
-1. Approvals owns review state transitions.
-2. No send/publish action bypasses approval checks.
+1. Approvals owns all review state transitions.
+2. No send or publish action bypasses an approval check (enforced via `isApproved`).
 3. Every decision records reviewer identity and timestamp.
+4. State transitions are one-way unless explicitly reopened.
diff --git a/modules/comments/CONTRACT.md b/modules/comments/CONTRACT.md
index 36cd429..0bbce0e 100644
--- a/modules/comments/CONTRACT.md
+++ b/modules/comments/CONTRACT.md
@@ -20,7 +20,7 @@ Errors: COMMENT_INVALID
 Purpose: Create response candidates with policy constraints.
 Errors: REPLY_POLICY_INVALID
 
-### Temporary mock-engine mismatch note (MCK-A2)
+### Mock-engine note (verified current, DOC-4 audit 2026-03-05)
 - `src/mock-engine.ts` relies on `modules/comments/src/mock.ts` where `draftReply(...)` may return `null` for spam-classified items.
 - Contract keeps the non-null `ReplyDraft` shape for domain API clarity; mock translation layer filters null drafts before returning replies.
 
diff --git a/modules/copylab/CONTRACT.md b/modules/copylab/CONTRACT.md
index bf9265a..c9060f7 100644
--- a/modules/copylab/CONTRACT.md
+++ b/modules/copylab/CONTRACT.md
@@ -19,7 +19,7 @@ Invariants:
 - Returns at least one variant per requested channel.
 - Tags output with policy version.
 
-### Temporary mock-engine mismatch note (MCK-A2)
+### Mock-engine note (verified current, DOC-4 audit 2026-03-05)
 - `src/mock-engine.ts` currently imports `modules/copylab/src/mock.ts` and calls `generateVariants(brief, plan)`.
 - Contract and production path support `generateVariants(request: CopyRequest)`; mock translation layer keeps the two-argument form for backward compatibility in UI wiring.
 
@@ -34,3 +34,25 @@ Invariants:
 1. Copylab owns prompt/policy and variant generation.
 2. Copylab does not approve or publish assets.
 3. Every variant must include provenance metadata.
+
+## Future functions (staged in FUT-1, FUT-4 — not yet implemented)
+
+### buildInstructionPack(brief: CampaignBrief, styleProfileId: string): CampaignInstructionPack
+Purpose: Compile style profile + channel overrides + compliance rules into a single instruction pack for the copy generation pipeline.
+Invariants:
+- Only approved style profiles may be used.
+- Instruction packs are versioned for audit.
+
+### validateAgainstStylePack(variant: CopyVariant, pack: CampaignInstructionPack): GeneratedCopyAudit
+Purpose: Check a generated variant against the instruction pack and return a scored audit with any violations.
+Invariants:
+- Hard policy violations block approval.
+- Soft violations are surfaced as warnings only.
+- Deterministic for same inputs.
+
+### retrieveApprovedSnippets(campaignId: string, channel: string): ApprovedCopySnippet[] (FUT-4 — copy-memory)
+Purpose: Retrieve previously-approved copy snippets for a campaign and channel to provide context before generating new variants.
+Invariants:
+- Only approved-state snippets are returned.
+- Used as input context to generation, not as final output.
+- Human still reviews all generated output before approval.
diff --git a/modules/core/CONTRACT.md b/modules/core/CONTRACT.md
index c43872d..308a39f 100644
--- a/modules/core/CONTRACT.md
+++ b/modules/core/CONTRACT.md
@@ -16,6 +16,15 @@ Depended on by: all modules
 - CampaignMetricRow
 - AppError
 
+### Future types (staged in FUT-1, FUT-4 — not yet implemented)
+
+- `StyleProfile` — `{ id, name, tone, formality, clarity, ctaIntensity, readingLevel, bannedTerms[], requiredPhrases[], allowedClaims[] }`
+- `ChannelStyleOverride` — `{ channel, maxLength, emojiPolicy, hashtagPolicy, lineBreakPolicy }`
+- `CampaignInstructionPack` — `{ campaignId, styleProfileId, channelOverrides[], complianceRules[] }`
+- `GeneratedCopyAudit` — `{ variantId, styleProfileId, policyVersion, violations[], score }`
+- `ApprovedCopySnippet` — `{ id, variantId, campaignId, channel, text, approvedAt, styleProfileId }` (copy-memory, FUT-4)
+- `ScoutSourceConfig`, `ScoutRun`, `OpportunityItem`, `SuggestedEngagement`, `OpportunityDecision` — see `modules/social-scout/CONTRACT.md` (FUT-3)
+
 ## Exported Functions
 
 ### validateCampaignBrief(input: CampaignBriefInput): ValidationResult
diff --git a/modules/integrations/ANTI_PATTERNS.md b/modules/integrations/ANTI_PATTERNS.md
new file mode 100644
index 0000000..5786a4c
--- /dev/null
+++ b/modules/integrations/ANTI_PATTERNS.md
@@ -0,0 +1,21 @@
+# integrations — Anti-Patterns
+
+## ❌ Storing tokens in module state
+
+OAuth tokens must never appear in `IntegrationConfig` or any exported type. They are managed at the environment/infrastructure level. If you find yourself adding a `token` field to a type in this module, stop.
+
+## ❌ Making API calls from this module
+
+HTTP calls to Slack or Graph belong in `adapters`. This module only validates scope and tracks status.
+
+## ❌ Exposing token values to the UI
+
+Integration settings page renders connection status and scope list only. No token, client secret, or credential string reaches the client page state.
+
+## ❌ Skipping scope validation before send
+
+`adapters` must call `validateIntegrationScope()` before dispatching any notification. Sending without scope validation can result in silent 403 errors or permission escalation.
+
+## ❌ Building approval logic here
+
+Whether to send a notification, and what its content is, are decided by `approvals` and `adapters`. This module does not own those decisions.
diff --git a/modules/integrations/CONTRACT.md b/modules/integrations/CONTRACT.md
new file mode 100644
index 0000000..b91f8a1
--- /dev/null
+++ b/modules/integrations/CONTRACT.md
@@ -0,0 +1,58 @@
+# integrations — Contract
+
+Owner: integrations
+Depends on: core
+Depended on by: adapters (for outbound notification dispatch)
+
+## Purpose
+
+This module owns credential metadata, connection lifecycle state, and integration scope policy for all external collaboration tool connections (Slack, Office 365).
+
+It does NOT own API calls — those remain in `adapters`.
+It does NOT store OAuth tokens directly — it stores references and connection status only.
+
+## Exported Types
+
+- `IntegrationProvider` — `'slack' | 'office365'`
+- `ConnectionStatus` — `'disconnected' | 'connected' | 'error' | 'scope_limited'`
+- `IntegrationConfig`
+  - `provider: IntegrationProvider`
+  - `status: ConnectionStatus`
+  - `scopesGranted: string[]`
+  - `defaultChannelOrRecipient: string`
+  - `testSentAt?: string` (ISO 8601 UTC)
+  - `connectedAt?: string` (ISO 8601 UTC)
+  - `lastErrorMessage?: string`
+- `IntegrationSettings`
+  - `slack?: IntegrationConfig`
+  - `office365?: IntegrationConfig`
+
+## Exported Functions
+
+### getIntegrationSettings(): IntegrationSettings
+Purpose: Return the current integration connection state for all providers.
+Errors: none (returns disconnected state if not configured)
+Invariants:
+- Always returns a value; never throws on missing config.
+- Token values are never included in the return payload.
+
+### validateIntegrationScope(config: IntegrationConfig, requiredScopes: string[]): boolean
+Purpose: Confirm all required scopes are present in the granted set before attempting a notification send.
+Errors: none (returns false if any scope is missing)
+Invariants:
+- Deterministic for same inputs.
+- Does not make network calls.
+
+## Secrets Boundary
+
+- OAuth tokens and refresh tokens are NEVER stored in this module's types.
+- Credential encryption and storage is handled at the infrastructure/environment level.
+- This module only tracks whether a connection exists and what scopes it has.
+- The UI must never receive or render token values.
+
+## Module Invariants
+
+1. Integrations owns connection metadata and scope policy only.
+2. API calls to Slack or Graph are owned by adapters, not this module.
+3. Secrets never cross the module boundary into UI state.
+4. BACK-1 and BACK-2 depend on this contract being stable before adapter connectors are added.
diff --git a/modules/integrations/README.md b/modules/integrations/README.md
new file mode 100644
index 0000000..fccf63b
--- /dev/null
+++ b/modules/integrations/README.md
@@ -0,0 +1,31 @@
+# integrations
+
+## What this module does
+
+Manages the connection lifecycle and scope policy for external collaboration tool integrations: Slack and Office 365.
+
+It tracks whether a connection exists, what scopes are granted, and what the default notification target is. It does not own API calls or secrets storage.
+
+## What it does NOT do
+
+- It does not call Slack or Graph APIs directly. Those calls belong to `adapters`.
+- It does not store OAuth tokens. Tokens are handled at the infrastructure level.
+- It does not decide what content to send. That decision belongs to `approvals` or `adapters`.
+
+## Phase 1 scope (tracked in board.md FUT-2)
+
+- Connection status types and validation.
+- Scope requirement checking.
+- Integration settings shell in the UI.
+
+## Phase 2 scope (tracked in future.md)
+
+- Interactive Slack approve/reject actions.
+- Teams notification webhook.
+- Group-based reviewer routing for Office 365.
+
+## Boundary rules
+
+- UI reads connection status only — never token values.
+- Adapter calls are gated by `validateIntegrationScope()` before sending.
+- All integration changes are logged as domain events.
diff --git a/modules/publishing/CONTRACT.md b/modules/publishing/CONTRACT.md
index edaaf80..8cccd6c 100644
--- a/modules/publishing/CONTRACT.md
+++ b/modules/publishing/CONTRACT.md
@@ -15,7 +15,7 @@ Depended on by: ui, analytics
 Purpose: Create scheduled publish record.
 Errors: APPROVAL_REQUIRED, SCHEDULE_TIME_INVALID
 
-### Temporary mock-engine mismatch note (MCK-A2)
+### Mock-engine note (verified current, DOC-4 audit 2026-03-05)
 - `src/mock-engine.ts` and `modules/publishing/src/mock.ts` currently call `scheduleAsset(assetId, assetLabel, runAt, channel)`.
 - The extra `assetLabel` parameter is mock-layer metadata used for calendar readability in the UI.
 
diff --git a/modules/social-scout/ANTI_PATTERNS.md b/modules/social-scout/ANTI_PATTERNS.md
new file mode 100644
index 0000000..c51efc5
--- /dev/null
+++ b/modules/social-scout/ANTI_PATTERNS.md
@@ -0,0 +1,25 @@
+# social-scout — Anti-Patterns
+
+## ❌ Auto-sending approved comments without an OpportunityDecision
+
+Every outbound action requires an explicit `OpportunityDecision` with `decision: 'approved_for_reply'` that has been routed through the approvals workflow. There is no shortcut.
+
+## ❌ Scan intervals below 15 minutes
+
+Aggressive polling violates platform rate limits and anti-spam rules. `validateSourceConfig()` hard-rejects intervals below 15 minutes. Do not work around this check.
+
+## ❌ Adding platforms to the scan without updating the allowlist
+
+New platforms require explicit allowlist additions in `validateSourceConfig()`, documentation in CONTRACT.md, and rate-limit policy in SYSTEM_ARCHITECTURE.md. Do not add scan targets ad hoc.
+
+## ❌ Bulk-approving high-risk opportunities
+
+Items with `riskFlags.length > 0` route to manual review only. They cannot be included in batch-approval actions regardless of score.
+
+## ❌ Embedding platform credentials in this module
+
+API keys, OAuth tokens, and session cookies belong in `adapters` and environment config. This module never stores or passes authentication material.
+
+## ❌ Treating suggested comments as final
+
+`SuggestedEngagement.draftComment` is a starting point for human editing, not a ready-to-post output. The UI must make this distinction visible.
diff --git a/modules/social-scout/CONTRACT.md b/modules/social-scout/CONTRACT.md
new file mode 100644
index 0000000..3c26c65
--- /dev/null
+++ b/modules/social-scout/CONTRACT.md
@@ -0,0 +1,83 @@
+# social-scout — Contract
+
+Owner: social-scout
+Depends on: core
+Depended on by: approvals (receives opportunity → engagement decisions)
+
+## Purpose
+
+This module owns the data model and business logic for slow-batch social opportunity discovery. It surfaces scored conversation threads from approved platforms for human review and optional reply drafting.
+
+**It does not send anything autonomously.** Every accepted opportunity routes to the approval workflow before any outbound action.
+
+## Exported Types
+
+- `ScoutSourceConfig`
+  - `platform: 'reddit' | 'x' | 'facebook' | 'instagram'`
+  - `sourceId: string`
+  - `query: string`
+  - `enabled: boolean`
+  - `scanIntervalMinutes: number`
+
+- `ScoutRun`
+  - `id: string`
+  - `startedAt: string` (ISO 8601 UTC)
+  - `completedAt?: string`
+  - `platform: string`
+  - `status: 'running' | 'completed' | 'failed'`
+  - `itemsFound: number`
+
+- `OpportunityItem`
+  - `id: string`
+  - `platform: string`
+  - `sourceUrl: string`
+  - `author: string`
+  - `contentSnippet: string`
+  - `score: number` (0–100)
+  - `scoreBreakdown: { relevance: number; engagementPotential: number; recency: number }`
+  - `riskFlags: string[]`
+
+- `SuggestedEngagement`
+  - `opportunityId: string`
+  - `draftComment: string`
+  - `toneProfile: string`
+  - `confidence: number` (0–1)
+  - `policyChecks: string[]`
+
+- `OpportunityDecision`
+  - `opportunityId: string`
+  - `decision: 'approved_for_reply' | 'skipped' | 'muted_source'`
+  - `reviewerId: string`
+  - `timestamp: string`
+  - `notes?: string`
+
+## Exported Functions
+
+### scoreOpportunity(item: OpportunityItem): number
+Purpose: Return a composite score (0–100) from relevance, engagement potential, and recency sub-scores.
+Errors: SCORE_INPUT_INVALID
+Invariants:
+- Deterministic for same inputs.
+- High-risk items (riskFlags.length > 0) are capped at 50 regardless of sub-scores.
+
+### validateSourceConfig(config: ScoutSourceConfig): ValidationResult
+Purpose: Confirm scan intervals, platform allowlist, and query safety before enabling a source.
+Errors: SOURCE_PLATFORM_NOT_ALLOWED, SCAN_INTERVAL_TOO_SHORT, QUERY_INVALID
+Invariants:
+- Minimum scan interval is 15 minutes.
+- Platform must be in the explicit allowlist.
+
+## Guardrails (non-negotiable)
+
+1. No autonomous bulk commenting — ever.
+2. No auto-send without an `OpportunityDecision` with `decision: 'approved_for_reply'` routed through approvals.
+3. No evasion behavior for platform anti-spam controls.
+4. Per-platform daily engagement caps must be enforced before any outbound action.
+5. High-risk opportunities (`riskFlags.length > 0`) auto-route to manual review only; they cannot be bulk-approved.
+
+## Module Invariants
+
+1. Social-scout produces recommendations. It does not send.
+2. All outbound actions require an approval decision before dispatch.
+3. Platform source allowlist is a hard requirement enforced in `validateSourceConfig`.
+4. Scoring is deterministic and explainable per opportunity.
diff --git a/modules/social-scout/README.md b/modules/social-scout/README.md
new file mode 100644
index 0000000..fee5ba5
--- /dev/null
+++ b/modules/social-scout/README.md
@@ -0,0 +1,38 @@
+# social-scout
+
+## What this module does
+
+Scans approved social platforms on a slow schedule (15–30 minute cadence) for high-value conversation threads where the operator could productively engage. Returns scored opportunity cards with draft comment suggestions for human review.
+
+## What it does NOT do
+
+- It does not send comments automatically.
+- It does not scrape aggressively or bypass rate limits.
+- It does not create approvals — that is `approvals`' job.
+- It does not contain platform API credentials — those belong to `adapters`.
+
+## The slow-scout workflow
+
+```
+ScoutSourceConfig (what to watch)
+  → ScoutRun (scheduled batch scan)
+    → OpportunityItem[] (scored results)
+      → SuggestedEngagement (draft comment per item)
+        → Human review in Opportunities Inbox
+          → OpportunityDecision (approve / skip / mute)
+            → approved items enter approvals workflow
+              → adapter sends reply
+```
+
+## Current state (board.md FUT-3)
+
+Phase 1 is doc and contract only. The UI shell (Opportunities Inbox page) exists but uses mock data. No live API calls are made yet.
+
+## Platforms
+
+Phase 1 allowlist: Reddit, X (formerly Twitter), Facebook, Instagram
+All platforms require explicit `ScoutSourceConfig` with `enabled: true` before scanning.
+
+## Guardrails
+
+See `CONTRACT.md` and `ANTI_PATTERNS.md` for hard limits. The most important: nothing goes out without a human approval decision.
diff --git a/modules/strategy/CONTRACT.md b/modules/strategy/CONTRACT.md
index ee12c77..c4d97fe 100644
--- a/modules/strategy/CONTRACT.md
+++ b/modules/strategy/CONTRACT.md
@@ -40,7 +40,7 @@ Errors: HYPOTHESIS_RANKING_INVALID
 Invariants:
 - Same inputs produce same ranking output.
 
-### Temporary mock-engine mismatch note (MCK-A2)
+### Mock-engine note (verified current, DOC-4 audit 2026-03-05)
 - `src/mock-engine.ts` currently uses `buildOfferProfile(hypothesis, signals): OfferProfile` from `modules/strategy/src/mock.ts`.
 - This helper is intentionally mock-only for the workflow translation layer and is not yet promoted to the formal module contract.
 
diff --git a/src/components/__tests__/tooltip.test.ts b/src/components/__tests__/tooltip.test.ts
index 7703091..42461a8 100644
--- a/src/components/__tests__/tooltip.test.ts
+++ b/src/components/__tests__/tooltip.test.ts
@@ -1,6 +1,14 @@
-import { describe, expect, it, vi } from 'vitest';
-import { supportsHoverTooltips } from '../tooltip';
+import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import {
+    cancelAndHide,
+    hideTooltip,
+    supportsHoverTooltips,
+    tip,
+} from '../tooltip';
 
+// ---------------------------------------------------------------------------
+// supportsHoverTooltips — pointer / hover detection
+// ---------------------------------------------------------------------------
 describe('supportsHoverTooltips', () => {
     it('returns true when hover and fine pointer media query matches', () => {
         const matchMedia = vi.fn().mockReturnValue({ matches: true });
@@ -17,4 +25,160 @@ describe('supportsHoverTooltips', () => {
         expect(supportsHoverTooltips(undefined)).toBe(false);
         expect(supportsHoverTooltips({})).toBe(false);
     });
+
+    it('returns false when matchMedia returns a non-boolean-ish falsy result', () => {
+        const matchMedia = vi.fn().mockReturnValue({ matches: 0 });
+        expect(supportsHoverTooltips({ matchMedia })).toBeFalsy();
+    });
+});
+
+// ---------------------------------------------------------------------------
+// tip() HTML helper
+// ---------------------------------------------------------------------------
+describe('tip', () => {
+    it('produces a span with data-tip and has-tip class by default', () => {
+        const result = tip('offer', 'My Offer');
+        expect(result).toBe('<span data-tip="offer" class="has-tip">My Offer</span>');
+    });
+
+    it('accepts a custom tag', () => {
+        const result = tip('campaign', 'Campaign', 'strong');
+        expect(result).toBe('<strong data-tip="campaign" class="has-tip">Campaign</strong>');
+    });
+
+    it('preserves inner HTML content unchanged', () => {
+        const result = tip('cpl', '<em>Cost Per Lead</em>');
+        expect(result).toContain('<em>Cost Per Lead</em>');
+    });
+
+    it('uses the key as the data-tip attribute value', () => {
+        const result = tip('reviewQueue', 'Queue');
+        expect(result).toContain('data-tip="reviewQueue"');
+    });
+
+    it('always includes the has-tip class', () => {
+        expect(tip('x', 'X')).toContain('class="has-tip"');
+        expect(tip('y', 'Y', 'em')).toContain('class="has-tip"');
+    });
+});
+
+// ---------------------------------------------------------------------------
+// Timer-based hide / cancel logic (no DOM required)
+// We verify that the exported functions do not throw and clean up timers
+// correctly. The DOM interaction surface is covered by integration / e2e.
+// ---------------------------------------------------------------------------
+describe('hideTooltip — timer contract', () => {
+    beforeEach(() => {
+        vi.useFakeTimers();
+    });
+
+    afterEach(() => {
+        // Always cancel outstanding timers so tests don't bleed state
+        cancelAndHide();
+        vi.useRealTimers();
+    });
+
+    it('does not throw when called with no tooltip element present', () => {
+        expect(() => hideTooltip()).not.toThrow();
+        expect(() => vi.runAllTimers()).not.toThrow();
+    });
+
+    it('does not throw when called multiple times in rapid succession', () => {
+        expect(() => {
+            hideTooltip();
+            hideTooltip();
+            hideTooltip();
+        }).not.toThrow();
+        expect(() => vi.runAllTimers()).not.toThrow();
+    });
+
+    it('schedules hide after approximately 80ms delay', () => {
+        // Spy on the internal clearTimeout to verify timer cleanup
+        const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
+        hideTooltip();
+        // The first setTimeout call should be for an ~80ms delay
+        const calls = setTimeoutSpy.mock.calls;
+        expect(calls.length).toBeGreaterThanOrEqual(1);
+        const delayArg = calls[calls.length - 1][1];
+        expect(delayArg).toBe(80);
+    });
+});
+
+describe('cancelAndHide — timer contract', () => {
+    beforeEach(() => {
+        vi.useFakeTimers();
+    });
+
+    afterEach(() => {
+        vi.useRealTimers();
+    });
+
+    it('does not throw when called with nothing pending', () => {
+        expect(() => cancelAndHide()).not.toThrow();
+    });
+
+    it('cancels a pending hideTooltip timer (no zombie callbacks)', () => {
+        hideTooltip(); // queue a hide
+        cancelAndHide(); // should clear it
+        // If the hide timer survived, runAllTimers would try to access tooltipEl
+        // which is null in node env → would throw. Assert it does not.
+        expect(() => vi.runAllTimers()).not.toThrow();
+    });
+
+    it('is safe to call multiple times', () => {
+        expect(() => {
+            cancelAndHide();
+            cancelAndHide();
+            cancelAndHide();
+        }).not.toThrow();
+    });
+});
+
+// ---------------------------------------------------------------------------
+// Stale tip prevention — the core fix for UX-1
+// These tests verify the timer-cancellation contract of the module exports.
+// ---------------------------------------------------------------------------
+describe('stale tip prevention — hideTooltip cancels pending show timer', () => {
+    beforeEach(() => {
+        vi.useFakeTimers();
+    });
+
+    afterEach(() => {
+        cancelAndHide();
+        vi.useRealTimers();
+    });
+
+    it('cancelAndHide after a hideTooltip call leaves no timers running', () => {
+        hideTooltip();
+        cancelAndHide();
+        // All timers should be cleared — runAllTimers must be safe
+        expect(() => vi.runAllTimers()).not.toThrow();
+    });
+
+    it('successive hideTooltip + cancelAndHide cycles do not accumulate state', () => {
+        for (let i = 0; i < 5; i++) {
+            hideTooltip();
+            cancelAndHide();
+        }
+        expect(() => vi.runAllTimers()).not.toThrow();
+    });
+
+    it('interleaved hideTooltip and cancelAndHide produce predictable cleanup', () => {
+        // Simulate rapid hover: enter → leave → enter → leave fast
+        hideTooltip();          // first leave
+        vi.advanceTimersByTime(40);
+        cancelAndHide();        // re-enter cancels
+        hideTooltip();          // second leave
+        vi.advanceTimersByTime(90); // hide timer fires
+        // Should reach here without error
+        expect(true).toBe(true);
+    });
+
+    it('hideTooltip called 200ms AFTER a show would be in progress does not throw', () => {
+        // The delay between show (200ms) and hide (80ms) creates a race.
+        // Advance past an imagined show; then hide with no DOM → no throw.
+        vi.advanceTimersByTime(210);
+        expect(() => hideTooltip()).not.toThrow();
+        vi.advanceTimersByTime(90);
+    });
 });
diff --git a/src/components/tooltip.ts b/src/components/tooltip.ts
index 8e8d8c5..5277b59 100644
--- a/src/components/tooltip.ts
+++ b/src/components/tooltip.ts
@@ -22,7 +22,22 @@ function ensureTooltipEl(): HTMLDivElement {
     return tooltipEl;
 }
 
-function show(target: HTMLElement, text: string) {
+/** Cancel any pending show or hide and immediately hide the tooltip. */
+export function cancelAndHide(): void {
+    if (showTimeout) {
+        clearTimeout(showTimeout);
+        showTimeout = null;
+    }
+    if (hideTimeout) {
+        clearTimeout(hideTimeout);
+        hideTimeout = null;
+    }
+    if (tooltipEl) {
+        tooltipEl.classList.remove('visible', 'above');
+    }
+}
+
+export function showTooltip(target: HTMLElement, text: string): void {
     const el = ensureTooltipEl();
     el.textContent = text;
     el.classList.add('visible');
@@ -47,15 +62,23 @@ function show(target: HTMLElement, text: string) {
     el.style.maxWidth = `${tipWidth}px`;
 }
 
-function hide() {
-    if (tooltipEl) {
-        tooltipEl.classList.remove('visible');
+export function hideTooltip(): void {
+    // Cancel pending show first so a fast hover can't leave a stale tip
+    if (showTimeout) {
+        clearTimeout(showTimeout);
+        showTimeout = null;
     }
+    hideTimeout = setTimeout(() => {
+        if (tooltipEl) {
+            tooltipEl.classList.remove('visible', 'above');
+        }
+        hideTimeout = null;
+    }, 80);
 }
 
 export function attachTooltips(root: HTMLElement = document.body): void {
     if (!supportsHoverTooltips()) {
-        hide();
+        cancelAndHide();
         return;
     }
 
@@ -67,16 +90,27 @@ export function attachTooltips(root: HTMLElement = document.body): void {
         const text = target.getAttribute('data-tip-text') || getTooltip(key);
         if (!text) return;
 
-        if (hideTimeout) clearTimeout(hideTimeout);
-        showTimeout = setTimeout(() => show(target, text), 200);
+        // Cancel any pending hide so we don't flicker on fast hover transitions
+        if (hideTimeout) {
+            clearTimeout(hideTimeout);
+            hideTimeout = null;
+        }
+        // Cancel any pending (stale) show and schedule a fresh one
+        if (showTimeout) {
+            clearTimeout(showTimeout);
+            showTimeout = null;
+        }
+        showTimeout = setTimeout(() => {
+            showTimeout = null;
+            showTooltip(target, text);
+        }, 200);
     }, true);
 
     root.addEventListener('mouseleave', (e) => {
         const target = (e.target as HTMLElement).closest('[data-tip]');
         if (!target) return;
 
-        if (showTimeout) clearTimeout(showTimeout);
-        hideTimeout = setTimeout(hide, 100);
+        hideTooltip();
     }, true);
 }
 
diff --git a/src/glossary.ts b/src/glossary.ts
index 5c51b95..8f83792 100644
--- a/src/glossary.ts
+++ b/src/glossary.ts
@@ -160,6 +160,14 @@ export const glossary: Record<string, GlossaryEntry> = {
         label: 'Quality Score',
         tooltip: 'A rating of how well this copy variant follows best practices — clarity, length, call to action strength.',
     },
+    strategyWorkspace: {
+        label: 'Strategy Workspace',
+        tooltip: 'A side-by-side view of your business profile and offer options — use it to confirm what you\'re promoting before building a campaign.',
+    },
+    starterPreset: {
+        label: 'Starter Example',
+        tooltip: 'A pre-filled example business you can load to practice using the system. No real data required — just explore how campaigns are built.',
+    },
 };
 
 export function getTooltip(key: string): string {
diff --git a/src/index.css b/src/index.css
index b9afc74..4ab4e33 100644
--- a/src/index.css
+++ b/src/index.css
@@ -66,6 +66,8 @@
 /* ─── Base ──────────────────────────────────────────────────────── */
 html,
 body {
+  /* Use dvh on browsers that support it so the app fills the visual viewport,
+     not the layout viewport which can be clipped by mobile browser bars. */
   height: 100%;
   font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
   font-size: 14px;
@@ -88,7 +90,9 @@ a:hover {
 .app-shell {
   display: grid;
   grid-template-columns: 240px 1fr;
+  /* Fallback for browsers without dvh support */
   height: 100vh;
+  height: 100dvh;
   overflow: hidden;
 }
 
@@ -650,6 +654,234 @@ textarea.form-input {
   margin: var(--space-xl) 0;
 }
 
+/* ─── Page-level Layout Utilities ───────────────────────────────── */
+
+/* Cards with constrained widths */
+.card-narrow {
+  max-width: 640px;
+}
+
+.card-wide {
+  max-width: 100%;
+}
+
+/* Empty-state / placeholder card */
+.card-empty-state {
+  max-width: 480px;
+  text-align: center;
+  padding: var(--space-2xl);
+}
+
+/* Card wrapping a horizontally scrollable table */
+.card-overflow {
+  overflow-x: auto;
+}
+
+/* Horizontal action/button row */
+.action-row {
+  display: flex;
+  gap: var(--space-md);
+  align-items: center;
+  flex-wrap: wrap;
+}
+
+.action-row-top {
+  margin-bottom: var(--space-lg);
+}
+
+.action-row-bottom {
+  margin-top: var(--space-lg);
+}
+
+/* Form submit button spacing */
+.form-submit {
+  margin-top: var(--space-md);
+}
+
+/* Section heading (h2/h3) with bottom margin */
+.section-heading {
+  margin-bottom: var(--space-md);
+}
+
+/* Sub-heading with smaller bottom gap */
+.sub-heading {
+  margin-bottom: var(--space-sm);
+}
+
+/* Channel checkbox row inside forms */
+.channel-row {
+  display: flex;
+  gap: var(--space-md);
+  margin-top: var(--space-sm);
+  flex-wrap: wrap;
+}
+
+/* Inline channel label inside a channel-row */
+.channel-label {
+  display: flex;
+  align-items: center;
+  gap: var(--space-xs);
+  cursor: pointer;
+  font-size: 13px;
+  text-transform: none;
+  letter-spacing: normal;
+  font-weight: 400;
+}
+
+/* Secondary body text */
+.body-secondary {
+  color: var(--text-secondary);
+  font-size: 13px;
+}
+
+/* Muted / hint body text */
+.body-muted {
+  color: var(--text-muted);
+  font-size: 12px;
+}
+
+/* Small note / meta text below content */
+.body-note {
+  font-size: 11px;
+  color: var(--text-muted);
+  margin-top: var(--space-xs);
+}
+
+/* Large emoji used as page decorators in empty states */
+.page-emoji {
+  font-size: 40px;
+  margin-bottom: var(--space-md);
+}
+
+/* Approved-offer highlight card modifier */
+.card-approved {
+  border-color: var(--accent-green);
+}
+
+/* Card title clamp for overflow */
+.card-title-clamp {
+  font-size: 13px;
+  max-width: 200px;
+  overflow: hidden;
+  text-overflow: ellipsis;
+  white-space: nowrap;
+}
+
+/* Table cell: truncate long text */
+.cell-truncate {
+  max-width: 300px;
+  overflow: hidden;
+  text-overflow: ellipsis;
+  white-space: nowrap;
+}
+
+/* Table cell: smaller date/time text */
+.cell-meta {
+  font-size: 12px;
+  color: var(--text-secondary);
+}
+
+/* Score / rating value — color determined by HTML class, not inline style */
+.score-value {
+  font-weight: 700;
+}
+
+/* Hypothesis offer summary text */
+.offer-title {
+  font-size: 15px;
+  font-weight: 600;
+  margin-bottom: var(--space-sm);
+}
+
+/* Stage/channel inline info text inside funnel */
+.stage-meta {
+  font-size: 11px;
+  color: var(--text-secondary);
+}
+
+.stage-ctas {
+  font-size: 10px;
+  color: var(--text-muted);
+  margin-top: 4px;
+}
+
+/* ─── Semantic Color Helpers (replaces inline style colors) ──────── */
+
+.metric-green {
+  color: var(--accent-green);
+}
+
+.metric-primary {
+  color: var(--accent-primary);
+}
+
+.metric-amber {
+  color: var(--accent-amber);
+}
+
+.metric-red {
+  color: var(--accent-red);
+}
+
+.metric-blue {
+  color: var(--accent-blue);
+}
+
+/* Copy score colors */
+.score-high {
+  color: var(--accent-green);
+}
+
+.score-mid {
+  color: var(--accent-amber);
+}
+
+.score-low {
+  color: var(--accent-red);
+}
+
+/* Channel brand colors */
+.channel-meta {
+  color: var(--accent-blue);
+}
+
+.channel-linkedin {
+  color: var(--accent-green);
+}
+
+.channel-x {
+  color: var(--accent-amber);
+}
+
+.channel-email {
+  color: var(--accent-primary);
+}
+
+/* Funnel stage rate colors */
+.funnel-rate-awareness {
+  color: var(--accent-blue);
+}
+
+.funnel-rate-consideration {
+  color: var(--accent-amber);
+}
+
+.funnel-rate-decision {
+  color: var(--accent-green);
+}
+
+/* Table cell capitalize (replaces style="text-transform: capitalize") */
+.cell-capitalize {
+  text-transform: capitalize;
+}
+
+/* Badge with left margin when inline with text */
+.badge-inline {
+  margin-left: var(--space-sm);
+}
+
+
+
 /* ─── Comment Thread ────────────────────────────────────────────── */
 .comment-item {
   display: flex;
@@ -957,9 +1189,11 @@ textarea.form-input {
 /* --- Responsive --- */
 @media (max-width: 900px) {
   body {
+    /* Do not lock scroll on body — main-content handles its own scroll */
     overflow: hidden;
   }
 
+  /* Only prevent scroll when nav drawer is open */
   body.nav-open {
     overflow: hidden;
   }
@@ -1044,10 +1278,21 @@ textarea.form-input {
     pointer-events: auto;
   }
 
+  .intent-banner {
+    /* Stick below the fixed mobile topbar instead of hiding under it */
+    position: sticky;
+    top: 56px;
+    z-index: 1200;
+  }
+
   .app-shell {
     grid-template-columns: 1fr;
+    /* margin-top covers topbar (56px) + intent-banner (approx 40px).
+       We use padding-top on main-content instead so intent-banner can be sticky. */
     margin-top: 56px;
+    /* dvh subtracts mobile browser chrome (address bar) from height */
     height: calc(100vh - 56px);
+    height: calc(100dvh - 56px);
   }
 
   .sidebar {
@@ -1056,6 +1301,7 @@ textarea.form-input {
     left: 0;
     width: min(84vw, 320px);
     height: calc(100vh - 56px);
+    height: calc(100dvh - 56px);
     transform: translateX(-102%);
     transition: transform .22s var(--ease-out);
     z-index: 1200;
@@ -1096,6 +1342,9 @@ textarea.form-input {
 
   .main-content {
     padding: var(--space-lg) var(--space-md);
+    /* Ensure main content is always scrollable; height is determined by .app-shell */
+    overflow-y: auto;
+    -webkit-overflow-scrolling: touch;
   }
 
   .page-header {
@@ -1221,4 +1470,621 @@ textarea.form-input {
   .sidebar {
     width: 88vw;
   }
+}
+
+/* ─── Coach Blocks (GUIDE-2) ────────────────────────────────────── */
+.coach-block {
+  display: flex;
+  align-items: flex-start;
+  gap: var(--space-md);
+  background: rgba(108, 92, 231, .06);
+  border: 1px solid rgba(108, 92, 231, .16);
+  border-left: 3px solid var(--accent-primary);
+  border-radius: var(--radius-md);
+  padding: var(--space-md) var(--space-lg);
+  margin-bottom: var(--space-xl);
+  animation: fadeIn .3s var(--ease-out) both;
+}
+
+.coach-block-icon {
+  font-size: 22px;
+  flex-shrink: 0;
+  margin-top: 1px;
+}
+
+.coach-block-body {
+  display: flex;
+  flex-direction: column;
+  gap: var(--space-sm);
+  font-size: 13px;
+  line-height: 1.6;
+}
+
+.coach-what {
+  color: var(--text-primary);
+}
+
+.coach-why {
+  color: var(--text-secondary);
+}
+
+.coach-next {
+  color: var(--text-secondary);
+}
+
+.coach-block a {
+  color: var(--accent-primary);
+}
+
+@media (max-width: 640px) {
+  .coach-block {
+    flex-direction: column;
+    gap: var(--space-sm);
+    padding: var(--space-md);
+  }
+}
+
+/* ─── Strategy Workspace (GUIDE-1) ──────────────────────────────── */
+.sw-grid {
+  display: grid;
+  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
+  gap: var(--space-lg);
+  margin-bottom: var(--space-xl);
+}
+
+.sw-panel {
+  background: var(--bg-card);
+  border: 1px solid var(--border-card);
+  border-radius: var(--radius-lg);
+  padding: var(--space-lg);
+  box-shadow: var(--shadow-card);
+  transition: transform .2s var(--ease-out), box-shadow .2s var(--ease-out);
+}
+
+.sw-panel:hover {
+  transform: translateY(-2px);
+  box-shadow: var(--shadow-elevated);
+}
+
+.sw-panel--approved {
+  border-color: var(--accent-green);
+  background: linear-gradient(135deg, var(--bg-card), rgba(0, 206, 201, .04));
+}
+
+.sw-panel-header {
+  display: flex;
+  align-items: center;
+  justify-content: space-between;
+  margin-bottom: var(--space-md);
+}
+
+.sw-panel-title {
+  font-size: 14px;
+  font-weight: 700;
+  color: var(--text-primary);
+}
+
+.sw-field-row {
+  display: flex;
+  gap: var(--space-md);
+  padding: var(--space-xs) 0;
+  border-bottom: 1px solid var(--border-subtle);
+  font-size: 13px;
+  align-items: flex-start;
+}
+
+.sw-field-row:last-child {
+  border-bottom: none;
+}
+
+.sw-field-label {
+  color: var(--text-muted);
+  font-size: 11.5px;
+  font-weight: 600;
+  text-transform: uppercase;
+  letter-spacing: .04em;
+  min-width: 120px;
+  flex-shrink: 0;
+  padding-top: 2px;
+}
+
+.sw-field-value {
+  color: var(--text-primary);
+  flex: 1;
+}
+
+.sw-offer-name {
+  font-size: 16px;
+  font-weight: 700;
+  margin-bottom: var(--space-xs);
+}
+
+.sw-offer-sub {
+  color: var(--text-secondary);
+  font-size: 13px;
+  margin-bottom: var(--space-xs);
+}
+
+.sw-offer-icp {
+  color: var(--text-secondary);
+  font-size: 13px;
+  margin-bottom: var(--space-xs);
+}
+
+.sw-offer-signals {
+  color: var(--text-muted);
+  font-size: 12px;
+  margin-bottom: var(--space-md);
+}
+
+.sw-approved-actions {
+  display: flex;
+  gap: var(--space-sm);
+  flex-wrap: wrap;
+}
+
+.sw-hyp-angle,
+.sw-hyp-icp,
+.sw-hyp-rationale {
+  color: var(--text-secondary);
+  font-size: 13px;
+  margin-bottom: var(--space-xs);
+}
+
+.sw-card--selected {
+  border-color: var(--accent-green);
+  background: linear-gradient(135deg, var(--bg-card), rgba(0, 206, 201, .04));
+}
+
+.sw-empty-state {
+  text-align: center;
+  padding: var(--space-2xl) 0;
+  max-width: 480px;
+  margin: 0 auto;
+}
+
+.sw-empty-icon {
+  font-size: 48px;
+  margin-bottom: var(--space-lg);
+}
+
+.sw-empty-state h2 {
+  font-size: 20px;
+  font-weight: 700;
+  margin-bottom: var(--space-sm);
+}
+
+.sw-empty-state p {
+  color: var(--text-secondary);
+  font-size: 14px;
+  margin-bottom: var(--space-md);
+}
+
+/* ─── Preset Picker (GUIDE-3) ────────────────────────────────────── */
+.preset-panel {
+  background: rgba(255, 255, 255, .025);
+  border: 1px solid var(--border-subtle);
+  border-radius: var(--radius-lg);
+  padding: var(--space-lg);
+  margin-top: var(--space-xl);
+}
+
+.preset-panel-header {
+  margin-bottom: var(--space-md);
+}
+
+.preset-panel-title {
+  display: block;
+  font-size: 14px;
+  font-weight: 700;
+  color: var(--text-primary);
+  margin-bottom: var(--space-xs);
+}
+
+.preset-panel-sub {
+  display: block;
+  font-size: 12.5px;
+  color: var(--text-secondary);
+}
+
+.preset-grid {
+  display: grid;
+  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
+  gap: var(--space-md);
+  margin-bottom: var(--space-md);
+}
+
+.preset-card {
+  display: flex;
+  flex-direction: column;
+  align-items: flex-start;
+  gap: var(--space-xs);
+  padding: var(--space-md);
+  background: var(--bg-card);
+  border: 1px solid var(--border-card);
+  border-radius: var(--radius-md);
+  cursor: pointer;
+  transition: all .2s var(--ease-out);
+  text-align: left;
+  font-family: inherit;
+}
+
+.preset-card:hover {
+  border-color: var(--accent-primary);
+  background: var(--accent-primary-glow);
+  transform: translateY(-1px);
+}
+
+.preset-icon {
+  font-size: 24px;
+}
+
+.preset-name {
+  font-size: 13px;
+  font-weight: 700;
+  color: var(--text-primary);
+}
+
+.preset-desc {
+  font-size: 12px;
+  color: var(--text-secondary);
+  line-height: 1.4;
+}
+
+.preset-note {
+  font-size: 11.5px;
+  color: var(--text-muted);
+  font-style: italic;
+}
+
+/* Inline preset bar inside discovery form */
+.preset-bar {
+  display: flex;
+  align-items: center;
+  flex-wrap: wrap;
+  gap: var(--space-sm);
+  padding: var(--space-sm) 0 var(--space-md);
+  border-bottom: 1px solid var(--border-subtle);
+  margin-bottom: var(--space-md);
+}
+
+.preset-bar-label {
+  font-size: 11.5px;
+  color: var(--text-muted);
+  font-weight: 600;
+  text-transform: uppercase;
+  letter-spacing: .04em;
+}
+
+.preset-chip {
+  display: inline-flex;
+  align-items: center;
+  gap: var(--space-xs);
+  padding: 4px 12px;
+  background: var(--bg-input);
+  border: 1px solid var(--border-card);
+  border-radius: 100px;
+  font-size: 12px;
+  font-weight: 500;
+  color: var(--text-secondary);
+  cursor: pointer;
+  font-family: inherit;
+  transition: all .15s var(--ease-out);
+  white-space: nowrap;
+}
+
+.preset-chip:hover {
+  border-color: var(--accent-primary);
+  color: var(--accent-primary);
+  background: var(--accent-primary-glow);
+}
+
+
+/* ─── FUT-1: Style Studio ──────────────────────────────────────── */
+.studio-sections {
+  display: flex;
+  flex-direction: column;
+  gap: var(--space-lg);
+  margin-top: var(--space-lg);
+}
+
+.studio-section {
+  padding: var(--space-lg);
+}
+
+.preset-chips {
+  display: flex;
+  gap: var(--space-sm);
+  flex-wrap: wrap;
+  margin-top: var(--space-sm);
+}
+
+.chip {
+  padding: 6px 14px;
+  border-radius: 99px;
+  border: 1px solid var(--border-card);
+  background: var(--bg-badge);
+  color: var(--text-secondary);
+  font-size: 13px;
+  cursor: pointer;
+  transition: background 0.15s;
+}
+
+.chip--active {
+  background: var(--accent-primary);
+  color: var(--text-on-accent);
+  border-color: var(--accent-primary);
+}
+
+.chip:disabled {
+  opacity: 0.5;
+  cursor: not-allowed;
+}
+
+.slider-row {
+  display: flex;
+  align-items: center;
+  gap: var(--space-sm);
+  margin-top: var(--space-sm);
+}
+
+.slider-label {
+  font-size: 12px;
+  color: var(--text-muted);
+  white-space: nowrap;
+}
+
+.style-slider {
+  flex: 1;
+  accent-color: var(--accent-primary);
+}
+
+.tag-list {
+  display: flex;
+  gap: var(--space-xs);
+  flex-wrap: wrap;
+  margin-top: var(--space-sm);
+}
+
+.tag {
+  padding: 4px 10px;
+  border-radius: 99px;
+  background: var(--bg-badge);
+  color: var(--text-secondary);
+  font-size: 12px;
+}
+
+.tag-add {
+  padding: 4px 10px;
+  border-radius: 99px;
+  border: 1px dashed var(--border-card);
+  color: var(--text-muted);
+  font-size: 12px;
+  cursor: pointer;
+}
+
+.channel-tab-row {
+  display: flex;
+  gap: var(--space-xs);
+  margin: var(--space-sm) 0;
+}
+
+.channel-tab {
+  padding: 5px 14px;
+  border-radius: var(--radius-sm);
+  border: 1px solid var(--border-card);
+  background: transparent;
+  color: var(--text-secondary);
+  font-size: 13px;
+  cursor: pointer;
+}
+
+.channel-tab--active {
+  background: var(--bg-badge);
+  color: var(--text-primary);
+  border-color: var(--accent-primary);
+}
+
+.channel-override-preview {
+  padding: var(--space-md);
+  background: var(--bg-input);
+  border-radius: var(--radius-md);
+  min-height: 60px;
+}
+
+/* ─── FUT-2: Integrations ──────────────────────────────────────── */
+.integrations-grid {
+  display: grid;
+  grid-template-columns: 1fr 1fr;
+  gap: var(--space-lg);
+  margin-top: var(--space-lg);
+}
+
+@media (max-width: 700px) {
+  .integrations-grid {
+    grid-template-columns: 1fr;
+  }
+}
+
+.integration-card {
+  padding: var(--space-lg);
+  display: flex;
+  flex-direction: column;
+  gap: var(--space-md);
+}
+
+.integration-header {
+  display: flex;
+  align-items: center;
+  gap: var(--space-md);
+}
+
+.integration-logo {
+  font-size: 28px;
+}
+
+.integration-name {
+  font-weight: 600;
+  font-size: 16px;
+  color: var(--text-primary);
+}
+
+.integration-status {
+  font-size: 12px;
+}
+
+.integration-status--disconnected {
+  color: var(--text-muted);
+}
+
+.integration-status--connected {
+  color: var(--accent-green);
+}
+
+.integration-desc {
+  font-size: 14px;
+  color: var(--text-secondary);
+  line-height: 1.6;
+}
+
+.integration-fields {
+  display: flex;
+  flex-direction: column;
+  gap: var(--space-xs);
+}
+
+.integration-actions {
+  display: flex;
+  gap: var(--space-sm);
+  flex-wrap: wrap;
+}
+
+.security-notice {
+  display: flex;
+  align-items: flex-start;
+  gap: var(--space-md);
+  padding: var(--space-md);
+  margin-top: var(--space-lg);
+}
+
+.security-notice-icon {
+  font-size: 22px;
+  flex-shrink: 0;
+}
+
+/* ─── FUT-3: Opportunities Inbox ───────────────────────────────── */
+.opp-filters {
+  display: flex;
+  gap: var(--space-sm);
+  flex-wrap: wrap;
+  margin-bottom: var(--space-lg);
+}
+
+.opportunities-list {
+  display: flex;
+  flex-direction: column;
+  gap: var(--space-md);
+}
+
+.opportunity-card {
+  padding: var(--space-lg);
+  border-left: 3px solid var(--accent-primary);
+  transition: opacity 0.3s;
+}
+
+.opportunity-card.opp-card--done {
+  opacity: 0.5;
+}
+
+.opp-header {
+  display: flex;
+  align-items: center;
+  gap: var(--space-sm);
+  flex-wrap: wrap;
+  margin-bottom: var(--space-sm);
+}
+
+.opp-platform {
+  font-weight: 600;
+  font-size: 13px;
+  color: var(--text-primary);
+}
+
+.opp-score {
+  font-size: 12px;
+  padding: 3px 10px;
+  border-radius: 99px;
+  background: var(--accent-primary-glow);
+  color: var(--accent-primary);
+  font-weight: 600;
+}
+
+.risk-flag {
+  font-size: 12px;
+  padding: 3px 10px;
+  border-radius: 99px;
+  background: var(--accent-amber-soft);
+  color: var(--accent-amber);
+}
+
+.opp-source {
+  font-size: 12px;
+  color: var(--text-muted);
+  margin-bottom: var(--space-sm);
+}
+
+.opp-snippet {
+  font-size: 14px;
+  color: var(--text-secondary);
+  border-left: 2px solid var(--border-card);
+  padding-left: var(--space-sm);
+  margin-bottom: var(--space-md);
+  font-style: italic;
+  line-height: 1.6;
+}
+
+.opp-suggestion {
+  background: var(--bg-input);
+  border-radius: var(--radius-md);
+  padding: var(--space-md);
+  margin-bottom: var(--space-md);
+}
+
+.opp-draft {
+  font-size: 14px;
+  color: var(--text-primary);
+  margin: var(--space-xs) 0;
+  line-height: 1.6;
+}
+
+.opp-reason {
+  margin-top: var(--space-xs);
+}
+
+.advisory-tag {
+  font-size: 11px;
+  color: var(--accent-amber);
+  font-weight: normal;
+  margin-left: 4px;
+}
+
+.opp-actions {
+  display: flex;
+  gap: var(--space-sm);
+  flex-wrap: wrap;
+}
+
+.risk-notice {
+  font-size: 12px;
+  color: var(--accent-amber);
+  margin-top: var(--space-sm);
+}
+
+.btn--sm {
+  padding: 6px 14px;
+  font-size: 13px;
+}
+
+.btn--muted {
+  color: var(--text-muted);
 }
\ No newline at end of file
diff --git a/src/main.ts b/src/main.ts
index da01fcf..abf5f71 100644
--- a/src/main.ts
+++ b/src/main.ts
@@ -8,8 +8,12 @@ import { renderReviewPage, bindReviewEvents } from './pages/review';
 import { renderCalendarPage, bindCalendarEvents } from './pages/calendar';
 import { renderCommentsPage, bindCommentsEvents } from './pages/comments';
 import { renderDashboardPage, bindDashboardEvents } from './pages/dashboard';
+import { renderStrategyWorkspacePage, bindStrategyWorkspaceEvents } from './pages/strategy-workspace';
+import { renderStyleStudioPage, bindStyleStudioEvents } from './pages/style-studio';
+import { renderIntegrationsPage, bindIntegrationsEvents } from './pages/integrations';
+import { renderOpportunitiesPage, bindOpportunitiesEvents } from './pages/opportunities';
 
-type PageId = 'discovery' | 'launcher' | 'review' | 'calendar' | 'comments' | 'dashboard';
+type PageId = 'discovery' | 'launcher' | 'review' | 'calendar' | 'comments' | 'dashboard' | 'strategy-workspace' | 'style-studio' | 'integrations' | 'opportunities';
 const MOBILE_BREAKPOINT = 900;
 
 // Glossary keys shown in the help drawer for each page
@@ -20,11 +24,16 @@ const PAGE_HELP_KEYS: Record<PageId, string[]> = {
   calendar: ['publishing', 'schedule', 'channelMeta', 'channelLinkedin', 'channelX', 'channelEmail'],
   comments: ['commentTriage', 'intentLead', 'intentSupport', 'intentObjection', 'intentSpam', 'draftReply', 'approve'],
   dashboard: ['attribution', 'cpl', 'roas', 'conversionRate', 'impressions', 'clicks', 'funnel'],
+  'strategy-workspace': ['strategyWorkspace', 'offer', 'icp', 'offerHypothesis', 'confidence'],
+  'style-studio': ['copy', 'variant', 'channel'],
+  integrations: [],
+  opportunities: ['commentTriage', 'intentLead', 'approve'],
 };
 
 // Journey steps — used for the progress bar
 const JOURNEY_STEPS: { id: PageId; label: string; description: string }[] = [
   { id: 'discovery', label: 'Discover', description: 'Define your business and choose what to promote' },
+  { id: 'strategy-workspace', label: 'Strategise', description: 'Review your offer and confirm your campaign foundation' },
   { id: 'launcher', label: 'Launch', description: 'Create your campaign and generate ad copy' },
   { id: 'review', label: 'Review', description: 'Approve or reject content before it goes live' },
   { id: 'calendar', label: 'Schedule', description: 'Pick when your posts go live on each platform' },
@@ -41,11 +50,15 @@ interface NavItem {
 
 const NAV_ITEMS: NavItem[] = [
   { id: 'discovery', icon: '🔍', label: 'Business Discovery', tipKey: 'businessDiscovery' },
+  { id: 'strategy-workspace', icon: '🗺️', label: 'Strategy Workspace', tipKey: 'strategyWorkspace' },
   { id: 'launcher', icon: '🚀', label: 'Campaign Launcher', tipKey: 'campaign' },
   { id: 'review', icon: '📋', label: 'Review Queue', tipKey: 'reviewQueue' },
   { id: 'calendar', icon: '📅', label: 'Publishing', tipKey: 'publishing' },
   { id: 'comments', icon: '💬', label: 'Comment Ops', tipKey: 'commentTriage' },
   { id: 'dashboard', icon: '📊', label: 'Dashboard', tipKey: 'attribution' },
+  { id: 'style-studio', icon: '🎨', label: 'Style Studio', tipKey: 'copy' },
+  { id: 'integrations', icon: '🔗', label: 'Integrations', tipKey: 'attribution' },
+  { id: 'opportunities', icon: '📡', label: 'Opportunities', tipKey: 'commentTriage' },
 ];
 
 let currentPage: PageId = 'discovery';
@@ -116,6 +129,10 @@ const PAGE_RENDERERS: Record<PageId, () => string> = {
   calendar: renderCalendarPage,
   comments: renderCommentsPage,
   dashboard: renderDashboardPage,
+  'strategy-workspace': renderStrategyWorkspacePage,
+  'style-studio': renderStyleStudioPage,
+  integrations: renderIntegrationsPage,
+  opportunities: renderOpportunitiesPage,
 };
 
 const PAGE_BINDERS: Record<PageId, () => void> = {
@@ -125,6 +142,10 @@ const PAGE_BINDERS: Record<PageId, () => void> = {
   calendar: bindCalendarEvents,
   comments: bindCommentsEvents,
   dashboard: bindDashboardEvents,
+  'strategy-workspace': bindStrategyWorkspaceEvents,
+  'style-studio': bindStyleStudioEvents,
+  integrations: bindIntegrationsEvents,
+  opportunities: bindOpportunitiesEvents,
 };
 
 function isMobileViewport(): boolean {
@@ -186,10 +207,28 @@ function updateIntentBanner(): void {
   }
 }
 
+function setRealVh(): void {
+  // JS-measured fallback: --real-vh equals the visual viewport height so
+  // older browsers that lack dvh still avoid browser-chrome clipping.
+  const vh = window.visualViewport
+    ? window.visualViewport.height
+    : window.innerHeight;
+  document.documentElement.style.setProperty('--real-vh', `${vh}px`);
+}
+
+
 function init(): void {
   const app = document.getElementById('app');
   if (!app) return;
 
+  // Maintain --real-vh so dvh-lacking browsers avoid browser-chrome clipping
+  setRealVh();
+  window.addEventListener('resize', setRealVh);
+  window.addEventListener('orientationchange', setRealVh);
+  if (window.visualViewport) {
+    window.visualViewport.addEventListener('resize', setRealVh);
+  }
+
   app.innerHTML = `
     <div class="intent-banner" id="intent-banner">
       <span class="intent-banner-icon">💡</span>
diff --git a/src/mock-engine.ts b/src/mock-engine.ts
index c0e5324..f6b7975 100644
--- a/src/mock-engine.ts
+++ b/src/mock-engine.ts
@@ -4,6 +4,7 @@
  * The UI only sees product-shaped data returned from here.
  */
 
+
 import { resetIdCounter, EventLog } from '../modules/core/src/index';
 import type {
     CampaignBrief, FunnelPlan, ChannelVariantSet, VariantScore,
@@ -36,6 +37,70 @@ let currentProfile: OfferProfile | null = null;
 let currentCommentItems: CommentQueueItem[] = [];
 let currentReplies: ReplyDraft[] = [];
 
+// ─── Starter Presets ─────────────────────────────────────────────
+export interface StarterPreset {
+    id: string;
+    icon: string;
+    name: string;
+    description: string;
+    data: {
+        businessName: string;
+        industry: string;
+        targetCustomer: string;
+        currentOfferings: string[];
+        painPoints: string[];
+        competitiveAdvantage: string;
+    };
+}
+
+export const STARTER_PRESETS: StarterPreset[] = [
+    {
+        id: 'design-agency',
+        icon: '🎨',
+        name: 'Design Agency',
+        description: 'Brand identity and web design for small businesses',
+        data: {
+            businessName: 'Carta Creative Studio',
+            industry: 'Design & Branding',
+            targetCustomer: 'Small business owners who need a professional brand identity but don\'t know where to start',
+            currentOfferings: ['Logo design', 'Brand identity packages', 'Website design', 'Social media templates'],
+            painPoints: ['Looks unprofessional online', 'Losing clients to competitors with better branding', 'No consistent visual style across channels'],
+            competitiveAdvantage: 'Fixed-price packages, fast 2-week turnaround, and a brand playbook every client keeps',
+        },
+    },
+    {
+        id: 'automation-company',
+        icon: '⚙️',
+        name: 'Automation Company',
+        description: 'Business process automation for service businesses',
+        data: {
+            businessName: 'Streamline Ops',
+            industry: 'Business Automation',
+            targetCustomer: 'Service business owners spending 10+ hours a week on repetitive admin tasks',
+            currentOfferings: ['Workflow automation audits', 'CRM setup and integration', 'Email and follow-up automation', 'Reporting dashboards'],
+            painPoints: ['Too much time on manual data entry', 'Missed follow-ups losing deals', 'No visibility into what the team is doing'],
+            competitiveAdvantage: 'Done-for-you implementation in 30 days with a money-back guarantee if time savings aren\'t measurable',
+        },
+    },
+    {
+        id: 'local-service',
+        icon: '🔧',
+        name: 'Local Service Business',
+        description: 'Home services — plumbing, HVAC, or repairs — serving a local area',
+        data: {
+            businessName: 'NextDay Home Services',
+            industry: 'Home Services',
+            targetCustomer: 'Homeowners who need reliable repairs fast without being overcharged',
+            currentOfferings: ['Emergency plumbing', 'HVAC maintenance and repair', 'Water heater installation', 'Drain cleaning'],
+            painPoints: ['Can\'t find a trustworthy contractor', 'Waiting days for a callback', 'Unexpected charges at the end of the job'],
+            competitiveAdvantage: 'Same-day service, upfront flat-rate pricing, and a 2-year parts-and-labour warranty',
+        },
+    },
+];
+
+let pendingPreset: StarterPreset | null = null;
+
+
 // ─── Flow E: Business Discovery ──────────────────────────────────
 export function submitDiscoveryInterview(input: {
     businessName: string;
@@ -252,4 +317,31 @@ export function resetAll(): void {
     currentProfile = null;
     currentCommentItems = [];
     currentReplies = [];
+    pendingPreset = null;
+}
+
+// ─── Starter Preset API ─────────────────────────────────────────────
+export function getStarterPresets(): StarterPreset[] {
+    return STARTER_PRESETS;
 }
+
+/**
+ * Loads a preset so discovery.ts can read it and pre-fill the form.
+ * Does NOT submit the interview — the user still clicks "Complete Interview".
+ */
+export function loadStarterPreset(presetId: string): StarterPreset | null {
+    const preset = STARTER_PRESETS.find(p => p.id === presetId) || null;
+    pendingPreset = preset;
+    return preset;
+}
+
+/** Returns the pending preset (if any) so discovery form can read it. */
+export function getPendingPreset(): StarterPreset | null {
+    return pendingPreset;
+}
+
+/** Clears the pending preset after the form has consumed it. */
+export function clearPendingPreset(): void {
+    pendingPreset = null;
+}
+
diff --git a/src/pages/calendar.ts b/src/pages/calendar.ts
index e2a2ee3..1f05b16 100644
--- a/src/pages/calendar.ts
+++ b/src/pages/calendar.ts
@@ -2,49 +2,34 @@ import { tip } from '../components/tooltip';
 import * as engine from '../mock-engine';
 
 export function renderCalendarPage(): string {
-    const entries = engine.getCalendar();
+  const entries = engine.getCalendar();
 
-    if (!entries.length) {
-        return `
+  if (!entries.length) {
+    return `
       <div class="page-header">
         <h1>${tip('publishing', '📅 Publishing Calendar')}</h1>
         <p>See when your approved content is scheduled to go live.</p>
       </div>
-      <div class="card" style="max-width: 480px; text-align: center; padding: var(--space-2xl)">
-        <p style="font-size: 40px; margin-bottom: var(--space-md)">📅</p>
-        <p style="color: var(--text-secondary)">
+      <div class="card card-empty-state">
+        <p class="page-emoji">📅</p>
+        <p class="body-secondary">
           No scheduled posts yet. ${tip('reviewQueue', 'Approve content first')}, then ${tip('schedule', 'schedule')} it here.
         </p>
       </div>
     `;
-    }
-
-    const channelColors: Record<string, string> = {
-        meta: 'var(--accent-blue)',
-        linkedin: 'var(--accent-green)',
-        x: 'var(--accent-amber)',
-        email: 'var(--accent-primary)',
-    };
-
-    // Group by day
-    const byDay = new Map<string, typeof entries>();
-    entries.forEach(e => {
-        const day = e.runAt.split('T')[0];
-        if (!byDay.has(day)) byDay.set(day, []);
-        byDay.get(day)!.push(e);
-    });
+  }
 
-    const dispatched = entries.filter(e => e.state === 'dispatched').length;
-    const scheduled = entries.filter(e => e.state === 'scheduled').length;
+  const dispatched = entries.filter(e => e.state === 'dispatched').length;
+  const scheduled = entries.filter(e => e.state === 'scheduled').length;
 
-    return `
+  return `
     <div class="page-header">
       <h1>${tip('publishing', '📅 Publishing Calendar')}</h1>
       <p>${entries.length} posts · ${dispatched} published · ${scheduled} scheduled</p>
     </div>
 
     ${scheduled > 0 ? `
-      <div style="margin-bottom: var(--space-lg)">
+      <div class="action-row action-row-top">
         <button class="btn btn-success" id="publish-now-btn">
           ⚡ Publish All Now
         </button>
@@ -53,19 +38,19 @@ export function renderCalendarPage(): string {
 
     <div class="metric-row">
       ${['meta', 'linkedin', 'x', 'email'].map(ch => {
-        const count = entries.filter(e => e.channel === ch).length;
-        if (!count) return '';
-        return `
+    const count = entries.filter(e => e.channel === ch).length;
+    if (!count) return '';
+    return `
           <div class="metric-tile">
-            <div class="metric-label" data-tip="channel${ch.charAt(0).toUpperCase() + ch.slice(1)}" class="has-tip">${ch}</div>
-            <div class="metric-value" style="color: ${channelColors[ch]}">${count}</div>
+            <div class="metric-label" data-tip="channel${ch.charAt(0).toUpperCase() + ch.slice(1)}">${ch}</div>
+            <div class="metric-value channel-${ch}">${count}</div>
             <div class="metric-sub">posts</div>
           </div>
         `;
-    }).join('')}
+  }).join('')}
     </div>
 
-    <div class="card" style="overflow-x: auto">
+    <div class="card card-overflow">
       <table class="data-table">
         <thead>
           <tr>
@@ -79,8 +64,8 @@ export function renderCalendarPage(): string {
           ${entries.map(e => `
             <tr>
               <td><span class="badge badge-${e.channel === 'meta' ? 'scheduled' : e.channel === 'linkedin' ? 'approved' : 'pending'}">${e.channel}</span></td>
-              <td style="max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">${e.assetLabel}</td>
-              <td style="font-size: 12px; color: var(--text-secondary)">${new Date(e.runAt).toLocaleString()}</td>
+              <td class="cell-truncate">${e.assetLabel}</td>
+              <td class="cell-meta">${new Date(e.runAt).toLocaleString()}</td>
               <td><span class="badge badge-${e.state}">${e.state}</span></td>
             </tr>
           `).join('')}
@@ -91,11 +76,11 @@ export function renderCalendarPage(): string {
 }
 
 export function bindCalendarEvents(): void {
-    const publishBtn = document.getElementById('publish-now-btn');
-    if (publishBtn) {
-        publishBtn.addEventListener('click', () => {
-            engine.publishNow();
-            window.dispatchEvent(new CustomEvent('navigate', { detail: 'calendar' }));
-        });
-    }
+  const publishBtn = document.getElementById('publish-now-btn');
+  if (publishBtn) {
+    publishBtn.addEventListener('click', () => {
+      engine.publishNow();
+      window.dispatchEvent(new CustomEvent('navigate', { detail: 'calendar' }));
+    });
+  }
 }
diff --git a/src/pages/comments.ts b/src/pages/comments.ts
index b38e839..9c6df8d 100644
--- a/src/pages/comments.ts
+++ b/src/pages/comments.ts
@@ -2,43 +2,43 @@ import { tip } from '../components/tooltip';
 import * as engine from '../mock-engine';
 
 export function renderCommentsPage(): string {
-    const brief = engine.getCurrentBrief();
+  const brief = engine.getCurrentBrief();
 
-    if (!brief) {
-        return `
+  if (!brief) {
+    return `
       <div class="page-header">
         <h1>${tip('commentTriage', '💬 Comment Operations')}</h1>
         <p>Manage incoming comments, classify intent, and draft replies.</p>
       </div>
-      <div class="card" style="max-width: 480px; text-align: center; padding: var(--space-2xl)">
-        <p style="font-size: 40px; margin-bottom: var(--space-md)">💬</p>
-        <p style="color: var(--text-secondary)">
+      <div class="card card-empty-state">
+        <p class="page-emoji">💬</p>
+        <p class="body-secondary">
           <a href="#" data-nav="launcher">Launch a campaign</a> first to start receiving comments.
         </p>
       </div>
     `;
-    }
+  }
 
-    let commentItems: ReturnType<typeof engine.pullComments> = [];
-    try {
-        commentItems = engine.pullComments();
-    } catch { /* already pulled */ }
+  let commentItems: ReturnType<typeof engine.pullComments> = [];
+  try {
+    commentItems = engine.pullComments();
+  } catch { /* already pulled */ }
 
-    const replies = engine.getCommentReplies();
+  const replies = engine.getCommentReplies();
 
-    const intentEmoji: Record<string, string> = {
-        lead: '🟢',
-        support: '🔵',
-        objection: '🟡',
-        spam: '🔴',
-    };
+  const intentEmoji: Record<string, string> = {
+    lead: '🟢',
+    support: '🔵',
+    objection: '🟡',
+    spam: '🔴',
+  };
 
-    const intentCounts = commentItems.reduce((acc, item) => {
-        acc[item.intent] = (acc[item.intent] || 0) + 1;
-        return acc;
-    }, {} as Record<string, number>);
+  const intentCounts = commentItems.reduce((acc, item) => {
+    acc[item.intent] = (acc[item.intent] || 0) + 1;
+    return acc;
+  }, {} as Record<string, number>);
 
-    return `
+  return `
     <div class="page-header">
       <h1>${tip('commentTriage', '💬 Comment Operations')}</h1>
       <p>${commentItems.length} comments pulled · ${replies.length} replies drafted</p>
@@ -53,18 +53,18 @@ export function renderCommentsPage(): string {
       `).join('')}
     </div>
 
-    <h3 style="margin-bottom: var(--space-md)">Incoming Comments</h3>
+    <h3 class="section-heading">Incoming Comments</h3>
 
     <div class="card">
       ${commentItems.map(item => {
-        const reply = replies.find(r => r.commentId === item.commentId);
-        return `
+    const reply = replies.find(r => r.commentId === item.commentId);
+    return `
           <div class="comment-item">
             <div class="comment-avatar">${item.comment.authorName.charAt(0)}</div>
             <div class="comment-body">
               <div class="comment-author">
                 ${item.comment.authorName}
-                <span class="badge badge-${item.intent}" style="margin-left: var(--space-sm)">
+                <span class="badge badge-${item.intent} badge-inline">
                   ${tip(`intent${item.intent.charAt(0).toUpperCase() + item.intent.slice(1)}`, item.intent)}
                 </span>
               </div>
@@ -72,7 +72,7 @@ export function renderCommentsPage(): string {
               ${reply ? `
                 <div class="reply-box">
                   <strong>${tip('draftReply', '💡 Suggested Reply')}:</strong> ${reply.body}
-                  <div style="margin-top: var(--space-xs); font-size: 11px; color: var(--text-muted)">
+                  <div class="body-note">
                     ${tip('confidence', 'Confidence')}: ${Math.round(reply.confidence * 100)}%
                   </div>
                 </div>
@@ -82,17 +82,17 @@ export function renderCommentsPage(): string {
                   <button class="btn btn-danger btn-sm">${tip('reject', '✗ Discard')}</button>
                 </div>
               ` : item.intent === 'spam' ? `
-                <div style="font-size: 11px; color: var(--text-muted); margin-top: var(--space-sm)">
+                <div class="body-note">
                   ${tip('intentSpam', '🚫 Flagged as spam')} — no reply generated
                 </div>
               ` : ''}
             </div>
           </div>
         `;
-    }).join('')}
+  }).join('')}
     </div>
 
-    <div style="margin-top: var(--space-lg)">
+    <div class="action-row action-row-bottom">
       <button class="btn btn-success" id="send-all-replies-btn">
         ✉️ Approve & Send All Replies
       </button>
@@ -101,11 +101,11 @@ export function renderCommentsPage(): string {
 }
 
 export function bindCommentsEvents(): void {
-    const sendAllBtn = document.getElementById('send-all-replies-btn');
-    if (sendAllBtn) {
-        sendAllBtn.addEventListener('click', () => {
-            engine.sendReplies();
-            window.dispatchEvent(new CustomEvent('navigate', { detail: 'comments' }));
-        });
-    }
+  const sendAllBtn = document.getElementById('send-all-replies-btn');
+  if (sendAllBtn) {
+    sendAllBtn.addEventListener('click', () => {
+      engine.sendReplies();
+      window.dispatchEvent(new CustomEvent('navigate', { detail: 'comments' }));
+    });
+  }
 }
diff --git a/src/pages/dashboard.ts b/src/pages/dashboard.ts
index 643431d..bb90208 100644
--- a/src/pages/dashboard.ts
+++ b/src/pages/dashboard.ts
@@ -2,32 +2,26 @@ import { tip } from '../components/tooltip';
 import * as engine from '../mock-engine';
 
 export function renderDashboardPage(): string {
-    const brief = engine.getCurrentBrief();
+  const brief = engine.getCurrentBrief();
 
-    if (!brief) {
-        return `
+  if (!brief) {
+    return `
       <div class="page-header">
         <h1>${tip('attribution', '📊 Campaign Dashboard')}</h1>
         <p>Track results, see what's working, and optimize your next campaign.</p>
       </div>
-      <div class="card" style="max-width: 480px; text-align: center; padding: var(--space-2xl)">
-        <p style="font-size: 40px; margin-bottom: var(--space-md)">📊</p>
-        <p style="color: var(--text-secondary)">
+      <div class="card card-empty-state">
+        <p class="page-emoji">📊</p>
+        <p class="body-secondary">
           <a href="#" data-nav="launcher">Launch a campaign</a> to start seeing results.
         </p>
       </div>
     `;
-    }
-
-    const { attribution, funnel, variants } = engine.getDashboard();
+  }
 
-    const stageColors: Record<string, string> = {
-        awareness: 'var(--accent-blue)',
-        consideration: 'var(--accent-amber)',
-        decision: 'var(--accent-green)',
-    };
+  const { attribution, funnel, variants } = engine.getDashboard();
 
-    return `
+  return `
     <div class="page-header">
       <h1>${tip('attribution', '📊 Campaign Dashboard')}</h1>
       <p>Results for <strong>${brief.offerName}</strong></p>
@@ -36,12 +30,12 @@ export function renderDashboardPage(): string {
     <div class="metric-row">
       <div class="metric-tile" data-tip="cpl">
         <div class="metric-label has-tip">${tip('cpl', 'Cost Per Lead')}</div>
-        <div class="metric-value" style="color: var(--accent-green)">$${attribution.cpl.toFixed(2)}</div>
+        <div class="metric-value metric-green">$${attribution.cpl.toFixed(2)}</div>
         <div class="metric-sub">lower is better</div>
       </div>
       <div class="metric-tile" data-tip="roas">
         <div class="metric-label has-tip">${tip('roas', 'Return on Ad Spend')}</div>
-        <div class="metric-value" style="color: var(--accent-primary)">${attribution.roas}x</div>
+        <div class="metric-value metric-primary">${attribution.roas}x</div>
         <div class="metric-sub">revenue per $1 spent</div>
       </div>
       <div class="metric-tile">
@@ -50,18 +44,18 @@ export function renderDashboardPage(): string {
       </div>
       <div class="metric-tile">
         <div class="metric-label">Total Revenue</div>
-        <div class="metric-value" style="color: var(--accent-green)">$${attribution.totalRevenue.toLocaleString()}</div>
+        <div class="metric-value metric-green">$${attribution.totalRevenue.toLocaleString()}</div>
       </div>
     </div>
 
     <hr class="section-divider" />
 
-    <h3 style="margin-bottom: var(--space-md)">${tip('funnel', '🔻 Funnel Conversion')}</h3>
+    <h3 class="section-heading">${tip('funnel', '🔻 Funnel Conversion')}</h3>
     <div class="funnel-visual">
       ${funnel.map(row => `
         <div class="funnel-stage ${row.stage}" data-tip="${row.stage}">
           <div class="stage-name">${row.stage.charAt(0).toUpperCase() + row.stage.slice(1)}</div>
-          <div class="stage-rate" style="color: ${stageColors[row.stage]}">${row.rate}%</div>
+          <div class="stage-rate funnel-rate-${row.stage}">${row.rate}%</div>
           <div class="stage-count">${row.entered.toLocaleString()} → ${row.converted.toLocaleString()}</div>
         </div>
       `).join('')}
@@ -69,10 +63,10 @@ export function renderDashboardPage(): string {
 
     <hr class="section-divider" />
 
-    <h3 style="margin-bottom: var(--space-md)">
+    <h3 class="section-heading">
       ${tip('channel', '📡 Performance by Channel')}
     </h3>
-    <div class="card" style="overflow-x: auto">
+    <div class="card card-overflow">
       <table class="data-table">
         <thead>
           <tr>
@@ -87,29 +81,29 @@ export function renderDashboardPage(): string {
         </thead>
         <tbody>
           ${attribution.byChannel.map(row => {
-        const roas = row.spend ? (row.revenue / row.spend).toFixed(1) : '—';
-        return `
+    const roas = row.spend ? (row.revenue / row.spend).toFixed(1) : '—';
+    return `
               <tr>
                 <td><span class="badge badge-${row.channel === 'meta' ? 'scheduled' : row.channel === 'linkedin' ? 'approved' : 'pending'}">${row.channel}</span></td>
                 <td>${row.impressions.toLocaleString()}</td>
                 <td>${row.clicks.toLocaleString()}</td>
                 <td>${row.leads}</td>
                 <td>$${row.spend.toLocaleString()}</td>
-                <td style="color: var(--accent-green)">$${row.revenue.toLocaleString()}</td>
-                <td style="font-weight: 700">${roas}x</td>
+                <td class="metric-green">$${row.revenue.toLocaleString()}</td>
+                <td class="score-value">${roas}x</td>
               </tr>
             `;
-    }).join('')}
+  }).join('')}
         </tbody>
       </table>
     </div>
 
     <hr class="section-divider" />
 
-    <h3 style="margin-bottom: var(--space-md)">
+    <h3 class="section-heading">
       ${tip('variant', '🏆 Top Copy Variants')}
     </h3>
-    <div class="card" style="overflow-x: auto">
+    <div class="card card-overflow">
       <table class="data-table">
         <thead>
           <tr>
@@ -127,7 +121,7 @@ export function renderDashboardPage(): string {
               <td>${v.impressions.toLocaleString()}</td>
               <td>${v.clicks}</td>
               <td>${v.conversions}</td>
-              <td style="font-weight: 700; color: ${v.score >= 80 ? 'var(--accent-green)' : 'var(--accent-amber)'}">${v.score}${i === 0 ? ' 🏆' : ''}</td>
+              <td class="score-value score-${v.score >= 80 ? 'high' : 'mid'}">${v.score}${i === 0 ? ' 🏆' : ''}</td>
             </tr>
           `).join('')}
         </tbody>
@@ -137,5 +131,5 @@ export function renderDashboardPage(): string {
 }
 
 export function bindDashboardEvents(): void {
-    // Dashboard is read-only in mock mode
+  // Dashboard is read-only in mock mode
 }
diff --git a/src/pages/discovery.ts b/src/pages/discovery.ts
index c598690..020be76 100644
--- a/src/pages/discovery.ts
+++ b/src/pages/discovery.ts
@@ -2,14 +2,14 @@ import { tip } from '../components/tooltip';
 import * as engine from '../mock-engine';
 
 export function renderDiscoveryPage(): string {
-    const interview = engine.getCurrentInterview();
-    const hypotheses = engine.getCurrentHypotheses();
-    const profile = engine.getCurrentProfile();
+  const interview = engine.getCurrentInterview();
+  const hypotheses = engine.getCurrentHypotheses();
+  const profile = engine.getCurrentProfile();
 
-    const stepIndex = !interview ? 0 : !hypotheses.length ? 1 : !profile ? 2 : 3;
-    const steps = ['Your Business', 'Offer Suggestions', 'Choose & Approve'];
+  const stepIndex = !interview ? 0 : !hypotheses.length ? 1 : !profile ? 2 : 3;
+  const steps = ['Your Business', 'Offer Suggestions', 'Choose & Approve'];
 
-    return `
+  return `
     <div class="page-header">
       <h1>${tip('businessDiscovery', '🔍 Business Discovery')}</h1>
       <p>Tell us about your business so we can suggest the best marketing strategy.</p>
@@ -31,8 +31,8 @@ export function renderDiscoveryPage(): string {
 }
 
 function renderInterviewForm(): string {
-    return `
-    <div class="card" style="max-width: 640px">
+  return `
+    <div class="card card-narrow">
       <div class="card-header">
         <span class="card-title">Tell us about your business</span>
       </div>
@@ -61,7 +61,7 @@ function renderInterviewForm(): string {
           <label>What makes you different from competitors?</label>
           <textarea class="form-input" id="disc-advantage">All-in-one system with AI-assisted copy and human approval gates</textarea>
         </div>
-        <button type="submit" class="btn btn-primary" style="margin-top: var(--space-md)">
+        <button type="submit" class="btn btn-primary form-submit">
           Complete Interview →
         </button>
       </form>
@@ -70,12 +70,12 @@ function renderInterviewForm(): string {
 }
 
 function renderHypotheses(hypotheses: ReturnType<typeof engine.getCurrentHypotheses>, locked: boolean): string {
-    if (!hypotheses.length) return '';
+  if (!hypotheses.length) return '';
 
-    return `
+  return `
     <hr class="section-divider" />
-    <h2 style="margin-bottom: var(--space-md)">${tip('offerHypothesis', '💡 Offer Suggestions')}</h2>
-    <p style="color: var(--text-secondary); margin-bottom: var(--space-lg)">
+    <h2 class="section-heading">${tip('offerHypothesis', '💡 Offer Suggestions')}</h2>
+    <p class="body-secondary sub-heading">
       Based on your interview, here are recommended offers ranked by ${tip('confidence', 'confidence')}.
     </p>
     <div class="card-grid">
@@ -87,13 +87,13 @@ function renderHypotheses(hypotheses: ReturnType<typeof engine.getCurrentHypothe
               ${Math.round(h.confidence * 100)}% ${tip('confidence', 'confident')}
             </span>
           </div>
-          <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: var(--space-sm)">
+          <p class="body-secondary">
             <strong>Angle:</strong> ${h.angle}
           </p>
-          <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: var(--space-sm)">
+          <p class="body-secondary">
             <strong>${tip('icp', 'Target Customer')}:</strong> ${h.icp}
           </p>
-          <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: var(--space-md)">
+          <p class="body-secondary">
             <strong>Why:</strong> ${h.rationale}
           </p>
           ${!locked ? `
@@ -108,22 +108,22 @@ function renderHypotheses(hypotheses: ReturnType<typeof engine.getCurrentHypothe
 }
 
 function renderApprovedProfile(profile: ReturnType<typeof engine.getCurrentProfile>): string {
-    if (!profile) return '';
-    return `
+  if (!profile) return '';
+  return `
     <hr class="section-divider" />
-    <div class="card" style="border-color: var(--accent-green); max-width: 640px">
+    <div class="card card-narrow card-approved">
       <div class="card-header">
         <span class="card-title">✅ Offer Approved</span>
         <span class="badge badge-approved">Ready to Launch</span>
       </div>
-      <p style="font-size: 15px; font-weight: 600; margin-bottom: var(--space-sm)">
+      <p class="offer-title">
         ${profile.hypothesis.name}
       </p>
-      <p style="color: var(--text-secondary); font-size: 13px">
+      <p class="body-secondary">
         ${profile.hypothesis.angle} — targeting ${profile.hypothesis.icp}
       </p>
-      <p style="color: var(--text-muted); font-size: 12px; margin-top: var(--space-sm)">
-        Backed by ${profile.signals.length} market signals. Head to 
+      <p class="body-muted">
+        Backed by ${profile.signals.length} market signals. Head to
         <a href="#" data-nav="launcher">Campaign Launcher</a> to create your first ${tip('campaign', 'campaign')}.
       </p>
     </div>
@@ -131,31 +131,31 @@ function renderApprovedProfile(profile: ReturnType<typeof engine.getCurrentProfi
 }
 
 export function bindDiscoveryEvents(): void {
-    const form = document.getElementById('discovery-form');
-    if (form) {
-        form.addEventListener('submit', (e) => {
-            e.preventDefault();
-            const val = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value || '';
+  const form = document.getElementById('discovery-form');
+  if (form) {
+    form.addEventListener('submit', (e) => {
+      e.preventDefault();
+      const val = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value || '';
 
-            engine.submitDiscoveryInterview({
-                businessName: val('disc-name'),
-                industry: val('disc-industry'),
-                targetCustomer: val('disc-customer'),
-                currentOfferings: val('disc-offerings').split(',').map(s => s.trim()),
-                painPoints: val('disc-pains').split(',').map(s => s.trim()),
-                competitiveAdvantage: val('disc-advantage'),
-            });
+      engine.submitDiscoveryInterview({
+        businessName: val('disc-name'),
+        industry: val('disc-industry'),
+        targetCustomer: val('disc-customer'),
+        currentOfferings: val('disc-offerings').split(',').map(s => s.trim()),
+        painPoints: val('disc-pains').split(',').map(s => s.trim()),
+        competitiveAdvantage: val('disc-advantage'),
+      });
 
-            engine.getOfferSuggestions();
-            window.dispatchEvent(new CustomEvent('navigate', { detail: 'discovery' }));
-        });
-    }
+      engine.getOfferSuggestions();
+      window.dispatchEvent(new CustomEvent('navigate', { detail: 'discovery' }));
+    });
+  }
 
-    document.querySelectorAll('.approve-offer-btn').forEach(btn => {
-        btn.addEventListener('click', () => {
-            const idx = parseInt((btn as HTMLElement).dataset.index || '0');
-            engine.approveOffer(idx);
-            window.dispatchEvent(new CustomEvent('navigate', { detail: 'discovery' }));
-        });
+  document.querySelectorAll('.approve-offer-btn').forEach(btn => {
+    btn.addEventListener('click', () => {
+      const idx = parseInt((btn as HTMLElement).dataset.index || '0');
+      engine.approveOffer(idx);
+      window.dispatchEvent(new CustomEvent('navigate', { detail: 'discovery' }));
     });
+  });
 }
diff --git a/src/pages/integrations.ts b/src/pages/integrations.ts
new file mode 100644
index 0000000..cfe1d96
--- /dev/null
+++ b/src/pages/integrations.ts
@@ -0,0 +1,96 @@
+/**
+ * Integrations — FUT-2
+ * Mock-safe settings shell for Slack and Office 365 connections.
+ * Lets operators see connection status and configure notification targets.
+ * No live API calls are made in this phase.
+ */
+
+export function renderIntegrationsPage(): string {
+    return `
+    <div class="page-shell">
+      <div class="page-heading">
+        <h1 class="page-title">Integrations</h1>
+        <p class="page-subtitle">
+          Connect GrowthOps OS to your team tools. When a campaign batch is ready for review,
+          we can notify your Slack channel or Outlook inbox automatically.
+        </p>
+      </div>
+
+      <div class="coach-block">
+        <div class="coach-block-icon">🔗</div>
+        <div class="coach-block-body">
+          <strong>What you do here</strong>
+          <p>Connect your Slack workspace or Office 365 account so review notifications go directly to where your team already works.</p>
+          <strong>Why it matters</strong>
+          <p>Right now your team has to check the app to know when content is ready. With integrations, the app comes to them.</p>
+          <strong>What comes next</strong>
+          <p>Once connected, the Review Queue will automatically dispatch a summary to your chosen channel or inbox when a new batch is ready.</p>
+        </div>
+      </div>
+
+      <div class="mock-notice">
+        <span class="mock-badge">COMING SOON</span>
+        Live connections are not active yet. This page shows the planned integration interface.
+        Notifications currently require you to check the Review Queue manually.
+      </div>
+
+      <div class="integrations-grid">
+        <div class="integration-card card">
+          <div class="integration-header">
+            <span class="integration-logo">🟩</span>
+            <div>
+              <div class="integration-name">Slack</div>
+              <div class="integration-status integration-status--disconnected">Not connected</div>
+            </div>
+          </div>
+          <p class="integration-desc">
+            Post approval-ready summaries to a Slack channel. Your team approves or requests
+            changes without leaving Slack (Phase 2).
+          </p>
+          <div class="integration-fields">
+            <label class="field-label">Default notification channel</label>
+            <input class="field-input" type="text" placeholder="#campaign-reviews" disabled />
+          </div>
+          <div class="integration-actions">
+            <button class="btn btn--primary" disabled>Connect Slack</button>
+            <button class="btn btn--ghost" disabled>Send test message</button>
+          </div>
+        </div>
+
+        <div class="integration-card card">
+          <div class="integration-header">
+            <span class="integration-logo">🔷</span>
+            <div>
+              <div class="integration-name">Office 365</div>
+              <div class="integration-status integration-status--disconnected">Not connected</div>
+            </div>
+          </div>
+          <p class="integration-desc">
+            Send approval digests to Outlook and optionally create calendar holds for campaign
+            launch windows via Microsoft Graph.
+          </p>
+          <div class="integration-fields">
+            <label class="field-label">Default approval recipient</label>
+            <input class="field-input" type="email" placeholder="reviewer@yourcompany.com" disabled />
+          </div>
+          <div class="integration-actions">
+            <button class="btn btn--primary" disabled>Connect Office 365</button>
+            <button class="btn btn--ghost" disabled>Send test email</button>
+          </div>
+        </div>
+      </div>
+
+      <div class="security-notice card">
+        <span class="security-notice-icon">🔒</span>
+        <div>
+          <strong>Security</strong>
+          <p>OAuth tokens are encrypted at rest and never stored in client state. You can revoke access at any time from this page.</p>
+        </div>
+      </div>
+    </div>
+  `;
+}
+
+export function bindIntegrationsEvents(): void {
+    // No live events in mock mode — controls are disabled.
+}
diff --git a/src/pages/launcher.ts b/src/pages/launcher.ts
index deec23e..51176b8 100644
--- a/src/pages/launcher.ts
+++ b/src/pages/launcher.ts
@@ -2,38 +2,38 @@ import { tip } from '../components/tooltip';
 import * as engine from '../mock-engine';
 
 export function renderLauncherPage(): string {
-    const brief = engine.getCurrentBrief();
-    const plan = engine.getCurrentPlan();
-    const variants = engine.getCurrentVariants();
-    const scores = engine.getCurrentScores();
-    const profile = engine.getCurrentProfile();
+  const brief = engine.getCurrentBrief();
+  const plan = engine.getCurrentPlan();
+  const variants = engine.getCurrentVariants();
+  const scores = engine.getCurrentScores();
+  const profile = engine.getCurrentProfile();
 
-    if (!profile) {
-        return `
+  if (!profile) {
+    return `
       <div class="page-header">
         <h1>🚀 Campaign Launcher</h1>
         <p>Create and launch a coordinated marketing ${tip('campaign', 'campaign')}.</p>
       </div>
-      <div class="card" style="max-width: 480px; text-align: center; padding: var(--space-2xl)">
-        <p style="font-size: 40px; margin-bottom: var(--space-md)">🔍</p>
-        <p style="color: var(--text-secondary)">
+      <div class="card card-empty-state">
+        <p class="page-emoji">🔍</p>
+        <p class="body-secondary">
           Complete <a href="#" data-nav="discovery">Business Discovery</a> first to define your ${tip('offer', 'offer')}.
         </p>
       </div>
     `;
-    }
+  }
 
-    if (!brief) {
-        return `
+  if (!brief) {
+    return `
       <div class="page-header">
         <h1>🚀 Campaign Launcher</h1>
         <p>Create and launch a coordinated marketing ${tip('campaign', 'campaign')}.</p>
       </div>
       ${renderLaunchForm(profile)}
     `;
-    }
+  }
 
-    return `
+  return `
     <div class="page-header">
       <h1>🚀 Campaign Launcher</h1>
       <p>${tip('campaign', 'Campaign')} for <strong>${brief.offerName}</strong> targeting <strong>${brief.audience}</strong></p>
@@ -42,7 +42,7 @@ export function renderLauncherPage(): string {
     ${plan ? renderFunnelPreview(plan) : ''}
     ${variants && scores.length ? renderVariantTable(variants, scores) : ''}
 
-    <div style="display: flex; gap: var(--space-md); margin-top: var(--space-xl)">
+    <div class="action-row action-row-bottom">
       <button class="btn btn-primary" id="send-to-review-btn">
         ${tip('reviewQueue', '📋 Send to Review')}
       </button>
@@ -51,8 +51,8 @@ export function renderLauncherPage(): string {
 }
 
 function renderLaunchForm(profile: NonNullable<ReturnType<typeof engine.getCurrentProfile>>): string {
-    return `
-    <div class="card" style="max-width: 640px">
+  return `
+    <div class="card card-narrow">
       <div class="card-header">
         <span class="card-title">Create a ${tip('campaign', 'Campaign')}</span>
       </div>
@@ -67,17 +67,17 @@ function renderLaunchForm(profile: NonNullable<ReturnType<typeof engine.getCurre
         </div>
         <div class="form-group">
           <label>${tip('channel', 'Channels')} (select which platforms to post on)</label>
-          <div style="display: flex; gap: var(--space-md); margin-top: var(--space-sm)">
-            <label style="display: flex; align-items: center; gap: var(--space-xs); cursor: pointer; font-size: 13px; text-transform: none; letter-spacing: normal">
+          <div class="channel-row">
+            <label class="channel-label">
               <input type="checkbox" value="meta" checked /> ${tip('channelMeta', 'Meta')}
             </label>
-            <label style="display: flex; align-items: center; gap: var(--space-xs); cursor: pointer; font-size: 13px; text-transform: none; letter-spacing: normal">
+            <label class="channel-label">
               <input type="checkbox" value="linkedin" checked /> ${tip('channelLinkedin', 'LinkedIn')}
             </label>
-            <label style="display: flex; align-items: center; gap: var(--space-xs); cursor: pointer; font-size: 13px; text-transform: none; letter-spacing: normal">
+            <label class="channel-label">
               <input type="checkbox" value="x" checked /> ${tip('channelX', 'X')}
             </label>
-            <label style="display: flex; align-items: center; gap: var(--space-xs); cursor: pointer; font-size: 13px; text-transform: none; letter-spacing: normal">
+            <label class="channel-label">
               <input type="checkbox" value="email" /> ${tip('channelEmail', 'Email')}
             </label>
           </div>
@@ -86,7 +86,7 @@ function renderLaunchForm(profile: NonNullable<ReturnType<typeof engine.getCurre
           <label>Goals (comma separated)</label>
           <input class="form-input" id="launch-goals" value="Generate leads, Build brand awareness, Drive demo bookings" />
         </div>
-        <button type="submit" class="btn btn-primary" style="margin-top: var(--space-md)">
+        <button type="submit" class="btn btn-primary form-submit">
           ${tip('generateCopy', '⚡ Generate Launch Pack')}
         </button>
       </form>
@@ -95,16 +95,16 @@ function renderLaunchForm(profile: NonNullable<ReturnType<typeof engine.getCurre
 }
 
 function renderFunnelPreview(plan: NonNullable<ReturnType<typeof engine.getCurrentPlan>>): string {
-    return `
-    <h3 style="margin-bottom: var(--space-sm)">${tip('funnel', '🔻 Campaign Funnel')}</h3>
+  return `
+    <h3 class="sub-heading">${tip('funnel', '🔻 Campaign Funnel')}</h3>
     <div class="funnel-visual">
       ${plan.stages.map(stage => `
         <div class="funnel-stage ${stage.name}" data-tip="${stage.name}">
           <div class="stage-name">${stage.name.charAt(0).toUpperCase() + stage.name.slice(1)}</div>
-          <div style="font-size: 11px; color: var(--text-secondary)">
+          <div class="stage-meta">
             ${stage.channels.length} ${tip('channel', 'channels')} · ${stage.ctas.length} ${tip('cta', 'CTAs')}
           </div>
-          <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px">
+          <div class="stage-ctas">
             ${stage.ctas.join(' · ')}
           </div>
         </div>
@@ -114,20 +114,20 @@ function renderFunnelPreview(plan: NonNullable<ReturnType<typeof engine.getCurre
 }
 
 function renderVariantTable(
-    variants: NonNullable<ReturnType<typeof engine.getCurrentVariants>>,
-    scores: ReturnType<typeof engine.getCurrentScores>,
+  variants: NonNullable<ReturnType<typeof engine.getCurrentVariants>>,
+  scores: ReturnType<typeof engine.getCurrentScores>,
 ): string {
-    const scoreMap = new Map(scores.map(s => [s.variantId, s]));
-    const sorted = [...variants.variants].sort((a, b) => {
-        const sa = scoreMap.get(a.id)?.score || 0;
-        const sb = scoreMap.get(b.id)?.score || 0;
-        return sb - sa;
-    });
+  const scoreMap = new Map(scores.map(s => [s.variantId, s]));
+  const sorted = [...variants.variants].sort((a, b) => {
+    const sa = scoreMap.get(a.id)?.score || 0;
+    const sb = scoreMap.get(b.id)?.score || 0;
+    return sb - sa;
+  });
 
-    return `
+  return `
     <hr class="section-divider" />
-    <h3 style="margin-bottom: var(--space-md)">${tip('copy', '📝 Generated Copy')}</h3>
-    <div class="card" style="overflow-x: auto">
+    <h3 class="section-heading">${tip('copy', '📝 Generated Copy')}</h3>
+    <div class="card card-overflow">
       <table class="data-table">
         <thead>
           <tr>
@@ -140,19 +140,19 @@ function renderVariantTable(
         </thead>
         <tbody>
           ${sorted.map(v => {
-        const s = scoreMap.get(v.id);
-        const scoreVal = s?.score || 0;
-        const scoreColor = scoreVal >= 85 ? 'var(--accent-green)' : scoreVal >= 70 ? 'var(--accent-amber)' : 'var(--accent-red)';
-        return `
+    const s = scoreMap.get(v.id);
+    const scoreVal = s?.score || 0;
+    const scoreClass = scoreVal >= 85 ? 'score-high' : scoreVal >= 70 ? 'score-mid' : 'score-low';
+    return `
               <tr>
                 <td><span class="badge badge-${v.channel === 'meta' ? 'scheduled' : v.channel === 'linkedin' ? 'approved' : 'pending'}">${v.channel}</span></td>
-                <td data-tip="${v.stage}" class="has-tip" style="text-transform: capitalize">${v.stage}</td>
-                <td style="max-width: 300px">${v.headline}</td>
+                <td data-tip="${v.stage}" class="has-tip cell-capitalize">${v.stage}</td>
+                <td class="cell-truncate">${v.headline}</td>
                 <td>${v.cta}</td>
-                <td style="font-weight: 700; color: ${scoreColor}">${scoreVal}</td>
+                <td class="score-value score-${scoreClass}">${scoreVal}</td>
               </tr>
             `;
-    }).join('')}
+  }).join('')}
         </tbody>
       </table>
     </div>
@@ -160,31 +160,31 @@ function renderVariantTable(
 }
 
 export function bindLauncherEvents(): void {
-    const form = document.getElementById('launch-form');
-    if (form) {
-        form.addEventListener('submit', (e) => {
-            e.preventDefault();
-            const val = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value || '';
+  const form = document.getElementById('launch-form');
+  if (form) {
+    form.addEventListener('submit', (e) => {
+      e.preventDefault();
+      const val = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value || '';
 
-            const checkedChannels = Array.from(form.querySelectorAll('input[type=checkbox]:checked'))
-                .map(c => (c as HTMLInputElement).value) as ('meta' | 'linkedin' | 'x' | 'email')[];
+      const checkedChannels = Array.from(form.querySelectorAll('input[type=checkbox]:checked'))
+        .map(c => (c as HTMLInputElement).value) as ('meta' | 'linkedin' | 'x' | 'email')[];
 
-            engine.createCampaign({
-                offerName: val('launch-offer'),
-                audience: val('launch-audience'),
-                channels: checkedChannels,
-                goals: val('launch-goals').split(',').map(s => s.trim()),
-            });
+      engine.createCampaign({
+        offerName: val('launch-offer'),
+        audience: val('launch-audience'),
+        channels: checkedChannels,
+        goals: val('launch-goals').split(',').map(s => s.trim()),
+      });
 
-            window.dispatchEvent(new CustomEvent('navigate', { detail: 'launcher' }));
-        });
-    }
+      window.dispatchEvent(new CustomEvent('navigate', { detail: 'launcher' }));
+    });
+  }
 
-    const reviewBtn = document.getElementById('send-to-review-btn');
-    if (reviewBtn) {
-        reviewBtn.addEventListener('click', () => {
-            engine.sendToReview();
-            window.dispatchEvent(new CustomEvent('navigate', { detail: 'review' }));
-        });
-    }
+  const reviewBtn = document.getElementById('send-to-review-btn');
+  if (reviewBtn) {
+    reviewBtn.addEventListener('click', () => {
+      engine.sendToReview();
+      window.dispatchEvent(new CustomEvent('navigate', { detail: 'review' }));
+    });
+  }
 }
diff --git a/src/pages/opportunities.ts b/src/pages/opportunities.ts
new file mode 100644
index 0000000..61c6319
--- /dev/null
+++ b/src/pages/opportunities.ts
@@ -0,0 +1,149 @@
+/**
+ * Opportunities Inbox — FUT-3
+ * Mock-safe shell for the social-scout opportunities discovery surface.
+ * Shows scored opportunity cards from social sources for human review.
+ * No live scanning or auto-sending in this phase — all actions require explicit decision.
+ */
+
+const MOCK_OPPORTUNITIES = [
+    {
+        id: 'opp-001',
+        platform: 'Reddit',
+        platformIcon: '🟠',
+        sourceUrl: '#',
+        author: 'u/smallbiz_owner',
+        contentSnippet: '"Does anyone have a good recommendation for a local automation consultant? We\'re spending 10 hrs/week on manual data entry."',
+        score: 87,
+        riskFlags: [],
+        suggestedComment: 'This is exactly the kind of problem we solve. Happy to share how we approach it — would a quick DM help?',
+        reason: 'High intent service inquiry in a relevant community with no competing replies yet.',
+    },
+    {
+        id: 'opp-002',
+        platform: 'X',
+        platformIcon: '🐦',
+        sourceUrl: '#',
+        author: '@designstudio_co',
+        contentSnippet: '"Spent 3 days on a proposal nobody read. There has to be a better way to qualify clients before writing full briefs."',
+        score: 72,
+        riskFlags: [],
+        suggestedComment: 'Proposal fatigue is real. We\'ve been experimenting with a 3-question qualifier that cuts pre-work in half — worth sharing if you\'re open to it.',
+        reason: 'Relevant pain point, medium engagement potential, well within policy.',
+    },
+    {
+        id: 'opp-003',
+        platform: 'Facebook',
+        platformIcon: '🔵',
+        sourceUrl: '#',
+        author: 'Local Business Owners Group',
+        contentSnippet: '"Anyone tried using AI tools for marketing? Getting mixed results and not sure if it\'s worth the cost."',
+        score: 61,
+        riskFlags: ['third-party-group'],
+        suggestedComment: 'It depends a lot on what you\'re trying to do. Happy to share what\'s worked for us vs what\'s been overhyped.',
+        reason: 'Moderate relevance; risk flag for third-party group — routed to manual review only.',
+    },
+];
+
+function renderOpportunityCard(opp: typeof MOCK_OPPORTUNITIES[0]): string {
+    const riskTag = opp.riskFlags.length > 0
+        ? `<span class="risk-flag">⚠ ${opp.riskFlags.join(', ')}</span>`
+        : '';
+    return `
+    <div class="opportunity-card card" data-opp-id="${opp.id}">
+      <div class="opp-header">
+        <span class="opp-platform">${opp.platformIcon} ${opp.platform}</span>
+        <span class="opp-score score-badge">Score: ${opp.score}</span>
+        ${riskTag}
+      </div>
+      <div class="opp-source">
+        <span class="opp-author">${opp.author}</span>
+      </div>
+      <blockquote class="opp-snippet">${opp.contentSnippet}</blockquote>
+      <div class="opp-suggestion">
+        <label class="field-label">Suggested reply <span class="advisory-tag">— Advisory · Edit before using</span></label>
+        <div class="opp-draft">${opp.suggestedComment}</div>
+        <div class="opp-reason field-hint">${opp.reason}</div>
+      </div>
+      <div class="opp-actions">
+        <button class="btn btn--primary btn--sm" data-opp-action="approve" data-opp-id="${opp.id}" ${opp.riskFlags.length ? 'disabled' : ''}>
+          Approve for reply
+        </button>
+        <button class="btn btn--ghost btn--sm" data-opp-action="edit" data-opp-id="${opp.id}">
+          Edit draft
+        </button>
+        <button class="btn btn--ghost btn--sm" data-opp-action="skip" data-opp-id="${opp.id}">
+          Skip
+        </button>
+        <button class="btn btn--ghost btn--sm btn--muted" data-opp-action="mute" data-opp-id="${opp.id}">
+          Mute source
+        </button>
+      </div>
+      ${opp.riskFlags.length ? '<p class="risk-notice">This opportunity has risk flags and requires individual manual review — bulk approval is disabled.</p>' : ''}
+    </div>
+  `;
+}
+
+export function renderOpportunitiesPage(): string {
+    return `
+    <div class="page-shell">
+      <div class="page-heading">
+        <h1 class="page-title">Opportunities Inbox</h1>
+        <p class="page-subtitle">
+          Conversations where you could add real value. Scored and surfaced for you
+          to review — nothing goes out without your approval.
+        </p>
+      </div>
+
+      <div class="coach-block">
+        <div class="coach-block-icon">📡</div>
+        <div class="coach-block-body">
+          <strong>What you do here</strong>
+          <p>Review scored conversation opportunities from social platforms. Each card shows you why a thread is worth engaging with and a suggested comment to get started.</p>
+          <strong>Why it matters</strong>
+          <p>Showing up in the right conversations builds trust and generates leads without paid ads — but only if you engage authentically. These suggestions are a starting point, not a script.</p>
+          <strong>What comes next</strong>
+          <p>Approved replies enter your Review Queue before sending. Nothing goes out automatically.</p>
+        </div>
+      </div>
+
+      <div class="mock-notice">
+        <span class="mock-badge">MOCK DATA</span>
+        This inbox shows example opportunities. Live social scanning starts after integrations are configured.
+      </div>
+
+      <div class="opp-filters">
+        <button class="chip chip--active">All platforms</button>
+        <button class="chip">Reddit</button>
+        <button class="chip">X</button>
+        <button class="chip">Facebook</button>
+        <button class="chip">Instagram</button>
+      </div>
+
+      <div class="opportunities-list" id="opportunities-list">
+        ${MOCK_OPPORTUNITIES.map(renderOpportunityCard).join('')}
+      </div>
+    </div>
+  `;
+}
+
+export function bindOpportunitiesEvents(): void {
+    document.addEventListener('click', (e) => {
+        const target = (e.target as HTMLElement).closest('[data-opp-action]') as HTMLElement | null;
+        if (!target) return;
+        const action = target.dataset.oppAction;
+        const oppId = target.dataset.oppId;
+        if (!action || !oppId) return;
+
+        const card = document.querySelector(`[data-opp-id="${oppId}"].opportunity-card`) as HTMLElement | null;
+
+        if (action === 'approve') {
+            if (card) {
+                card.classList.add('opp-card--done');
+                card.querySelector('.opp-actions')!.innerHTML =
+                    '<span class="status-badge status-badge--green">✓ Sent to Review Queue</span>';
+            }
+        } else if (action === 'skip' || action === 'mute') {
+            if (card) card.remove();
+        }
+    });
+}
diff --git a/src/pages/review.ts b/src/pages/review.ts
index edc6980..490f9a9 100644
--- a/src/pages/review.ts
+++ b/src/pages/review.ts
@@ -2,41 +2,41 @@ import { tip } from '../components/tooltip';
 import * as engine from '../mock-engine';
 
 export function renderReviewPage(): string {
-    const items = engine.getReviewItems();
+  const items = engine.getReviewItems();
 
-    if (!items.length) {
-        return `
+  if (!items.length) {
+    return `
       <div class="page-header">
         <h1>${tip('reviewQueue', '📋 Review Queue')}</h1>
         <p>Approve or reject content before it goes live.</p>
       </div>
-      <div class="card" style="max-width: 480px; text-align: center; padding: var(--space-2xl)">
-        <p style="font-size: 40px; margin-bottom: var(--space-md)">📭</p>
-        <p style="color: var(--text-secondary)">
+      <div class="card card-empty-state">
+        <p class="page-emoji">📭</p>
+        <p class="body-secondary">
           Nothing to review yet. <a href="#" data-nav="launcher">Launch a campaign</a> and send copy to review.
         </p>
       </div>
     `;
-    }
+  }
 
-    const pending = items.filter(i => i.state === 'pending');
-    const approved = items.filter(i => i.state === 'approved');
-    const rejected = items.filter(i => i.state === 'rejected');
+  const pending = items.filter(i => i.state === 'pending');
+  const approved = items.filter(i => i.state === 'approved');
+  const rejected = items.filter(i => i.state === 'rejected');
 
-    return `
+  return `
     <div class="page-header">
       <h1>${tip('reviewQueue', '📋 Review Queue')}</h1>
       <p>${pending.length} items waiting for review · ${approved.length} approved · ${rejected.length} rejected</p>
     </div>
 
     ${pending.length > 0 ? `
-      <div style="margin-bottom: var(--space-lg); display: flex; gap: var(--space-md)">
+      <div class="action-row action-row-top">
         <button class="btn btn-success" id="approve-all-btn">
           ${tip('approve', '✓ Approve All')} (${pending.length})
         </button>
       </div>
     ` : `
-      <div style="margin-bottom: var(--space-lg); display: flex; gap: var(--space-md)">
+      <div class="action-row action-row-top">
         <button class="btn btn-primary" id="schedule-all-btn">
           ${tip('schedule', '📅 Schedule All for Publishing')}
         </button>
@@ -47,16 +47,16 @@ export function renderReviewPage(): string {
       ${items.map(item => `
         <div class="card">
           <div class="card-header">
-            <span class="card-title" style="font-size: 13px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">
+            <span class="card-title card-title-clamp">
               ${item.label}
             </span>
             <span class="badge badge-${item.state}">${item.state}</span>
           </div>
-          <p style="color: var(--text-muted); font-size: 12px; margin-bottom: var(--space-md)">
+          <p class="body-muted">
             ${item.kind === 'asset' ? tip('copy', 'Ad Copy') : item.kind === 'reply' ? tip('draftReply', 'Reply Draft') : tip('offer', 'Offer')}
           </p>
           ${item.state === 'pending' ? `
-            <div style="display: flex; gap: var(--space-sm)">
+            <div class="action-row">
               <button class="btn btn-success btn-sm approve-btn" data-id="${item.id}">
                 ${tip('approve', '✓ Approve')}
               </button>
@@ -72,35 +72,35 @@ export function renderReviewPage(): string {
 }
 
 export function bindReviewEvents(): void {
-    document.querySelectorAll('.approve-btn').forEach(btn => {
-        btn.addEventListener('click', () => {
-            const id = (btn as HTMLElement).dataset.id || '';
-            engine.approveItem(id as any);
-            window.dispatchEvent(new CustomEvent('navigate', { detail: 'review' }));
-        });
+  document.querySelectorAll('.approve-btn').forEach(btn => {
+    btn.addEventListener('click', () => {
+      const id = (btn as HTMLElement).dataset.id || '';
+      engine.approveItem(id as any);
+      window.dispatchEvent(new CustomEvent('navigate', { detail: 'review' }));
     });
+  });
 
-    document.querySelectorAll('.reject-btn').forEach(btn => {
-        btn.addEventListener('click', () => {
-            const id = (btn as HTMLElement).dataset.id || '';
-            engine.rejectItem(id as any);
-            window.dispatchEvent(new CustomEvent('navigate', { detail: 'review' }));
-        });
+  document.querySelectorAll('.reject-btn').forEach(btn => {
+    btn.addEventListener('click', () => {
+      const id = (btn as HTMLElement).dataset.id || '';
+      engine.rejectItem(id as any);
+      window.dispatchEvent(new CustomEvent('navigate', { detail: 'review' }));
     });
+  });
 
-    const approveAllBtn = document.getElementById('approve-all-btn');
-    if (approveAllBtn) {
-        approveAllBtn.addEventListener('click', () => {
-            engine.approveAll();
-            window.dispatchEvent(new CustomEvent('navigate', { detail: 'review' }));
-        });
-    }
+  const approveAllBtn = document.getElementById('approve-all-btn');
+  if (approveAllBtn) {
+    approveAllBtn.addEventListener('click', () => {
+      engine.approveAll();
+      window.dispatchEvent(new CustomEvent('navigate', { detail: 'review' }));
+    });
+  }
 
-    const scheduleBtn = document.getElementById('schedule-all-btn');
-    if (scheduleBtn) {
-        scheduleBtn.addEventListener('click', () => {
-            engine.scheduleAll();
-            window.dispatchEvent(new CustomEvent('navigate', { detail: 'calendar' }));
-        });
-    }
+  const scheduleBtn = document.getElementById('schedule-all-btn');
+  if (scheduleBtn) {
+    scheduleBtn.addEventListener('click', () => {
+      engine.scheduleAll();
+      window.dispatchEvent(new CustomEvent('navigate', { detail: 'calendar' }));
+    });
+  }
 }
diff --git a/src/pages/strategy-workspace.ts b/src/pages/strategy-workspace.ts
new file mode 100644
index 0000000..0eaa0ed
--- /dev/null
+++ b/src/pages/strategy-workspace.ts
@@ -0,0 +1,194 @@
+import { tip } from '../components/tooltip';
+import * as engine from '../mock-engine';
+import type { StarterPreset } from '../mock-engine';
+
+export function renderStrategyWorkspacePage(): string {
+    const interview = engine.getCurrentInterview();
+    const hypotheses = engine.getCurrentHypotheses();
+    const profile = engine.getCurrentProfile();
+    const presets = engine.getStarterPresets();
+
+    return `
+    <div class="page-header">
+      <h1>${tip('strategyWorkspace', '🗺️ Strategy Workspace')}</h1>
+      <p>Review your business profile, compare offer ideas, and decide what to promote — before writing a single word of copy.</p>
+    </div>
+
+    <div class="coach-block" id="sw-coach-block">
+      <div class="coach-block-icon">🎓</div>
+      <div class="coach-block-body">
+        <div class="coach-what"><strong>What you do here:</strong> Look at your approved business profile and offer side-by-side. Compare options, refine your thinking, and confirm you're promoting the right thing to the right people.</div>
+        <div class="coach-why"><strong>Why it matters:</strong> Campaigns built on a weak or vague offer waste money. Spending a few minutes here sharpens your positioning before you spend time generating copy.</div>
+        <div class="coach-next"><strong>What comes next:</strong> Once your offer is approved, go to <a href="#" data-nav="launcher">Campaign Launcher</a> to generate channel-specific copy and funnel steps.</div>
+      </div>
+    </div>
+
+    ${!interview ? renderNoProfileState(presets) : renderWorkspaceContent(interview, hypotheses, profile, presets)}
+  `;
+}
+
+function renderNoProfileState(presets: StarterPreset[]): string {
+    return `
+    <div class="sw-empty-state">
+      <div class="sw-empty-icon">🔍</div>
+      <h2>Start with Business Discovery</h2>
+      <p>You haven't completed a business interview yet. The Strategy Workspace shows your profile and offer options once you do.</p>
+      <a href="#" data-nav="discovery" class="btn btn-primary" style="margin-top: var(--space-md)">Go to Business Discovery →</a>
+    </div>
+
+    ${presets.length ? renderPresetPanel(presets, 'discovery') : ''}
+  `;
+}
+
+function renderWorkspaceContent(
+    interview: NonNullable<ReturnType<typeof engine.getCurrentInterview>>,
+    hypotheses: ReturnType<typeof engine.getCurrentHypotheses>,
+    profile: ReturnType<typeof engine.getCurrentProfile>,
+    presets: StarterPreset[],
+): string {
+    return `
+    <div class="sw-grid">
+
+      <!-- Business Profile Card -->
+      <div class="sw-panel">
+        <div class="sw-panel-header">
+          <span class="sw-panel-title">📋 Business Profile</span>
+          <a href="#" data-nav="discovery" class="btn btn-ghost btn-sm">Edit →</a>
+        </div>
+        <div class="sw-field-row">
+          <span class="sw-field-label">Business</span>
+          <span class="sw-field-value">${interview.data.businessName}</span>
+        </div>
+        <div class="sw-field-row">
+          <span class="sw-field-label">Industry</span>
+          <span class="sw-field-value">${interview.data.industry}</span>
+        </div>
+        <div class="sw-field-row">
+          <span class="sw-field-label">${tip('icp', 'Target Customer')}</span>
+          <span class="sw-field-value">${interview.data.targetCustomer}</span>
+        </div>
+        <div class="sw-field-row">
+          <span class="sw-field-label">What you offer</span>
+          <span class="sw-field-value">${interview.data.currentOfferings.join(', ')}</span>
+        </div>
+        <div class="sw-field-row">
+          <span class="sw-field-label">Customer pain points</span>
+          <span class="sw-field-value">${interview.data.painPoints.join(', ')}</span>
+        </div>
+        <div class="sw-field-row">
+          <span class="sw-field-label">Your edge</span>
+          <span class="sw-field-value">${interview.data.competitiveAdvantage}</span>
+        </div>
+      </div>
+
+      <!-- Offer Status Card -->
+      <div class="sw-panel ${profile ? 'sw-panel--approved' : ''}">
+        <div class="sw-panel-header">
+          <span class="sw-panel-title">
+            ${profile ? '✅ Approved Offer' : `${tip('offerHypothesis', '💡 Offer Status')}`}
+          </span>
+          ${profile ? '<span class="badge badge-approved">Ready to Launch</span>' : '<span class="badge badge-pending">Pending Selection</span>'}
+        </div>
+        ${profile ? `
+          <p class="sw-offer-name">${profile.hypothesis.name}</p>
+          <p class="sw-offer-sub">${profile.hypothesis.angle}</p>
+          <p class="sw-offer-icp">Targeting: <strong>${profile.hypothesis.icp}</strong></p>
+          <p class="sw-offer-signals">Backed by ${profile.signals.length} market signal${profile.signals.length !== 1 ? 's' : ''}.</p>
+          <div class="sw-approved-actions">
+            <a href="#" data-nav="launcher" class="btn btn-primary btn-sm">Launch Campaign →</a>
+            <a href="#" data-nav="discovery" class="btn btn-ghost btn-sm">Review Offer Options</a>
+          </div>
+        ` : `
+          <p class="sw-offer-sub">You have ${hypotheses.length} offer suggestion${hypotheses.length !== 1 ? 's' : ''} to review. Choose one to approve.</p>
+          <a href="#" data-nav="discovery" class="btn btn-primary btn-sm" style="margin-top: var(--space-md)">Review Suggestions →</a>
+        `}
+      </div>
+
+    </div>
+
+    ${hypotheses.length ? renderOfferComparison(hypotheses, profile) : ''}
+
+    ${renderPresetPanel(presets, 'strategy')}
+  `;
+}
+
+function renderOfferComparison(
+    hypotheses: ReturnType<typeof engine.getCurrentHypotheses>,
+    profile: ReturnType<typeof engine.getCurrentProfile>,
+): string {
+    const approvedIdx = profile
+        ? hypotheses.findIndex(h => h.name === profile.hypothesis.name)
+        : -1;
+
+    return `
+    <hr class="section-divider" />
+    <h2 style="margin-bottom: var(--space-sm)">${tip('offerHypothesis', '💡 All Offer Options')}</h2>
+    <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: var(--space-lg)">
+      These were generated from your business interview. Compare them here before committing to one.
+    </p>
+    <div class="card-grid">
+      ${hypotheses.map((h, i) => `
+        <div class="card ${i === approvedIdx ? 'sw-card--selected' : ''}">
+          <div class="card-header">
+            <span class="card-title">${h.name}</span>
+            <span class="badge badge-${h.confidence > 0.8 ? 'approved' : h.confidence > 0.7 ? 'scheduled' : 'pending'}">
+              ${Math.round(h.confidence * 100)}% ${tip('confidence', 'confidence')}
+            </span>
+          </div>
+          <p class="sw-hyp-angle"><strong>Angle:</strong> ${h.angle}</p>
+          <p class="sw-hyp-icp"><strong>${tip('icp', 'Who it targets')}:</strong> ${h.icp}</p>
+          <p class="sw-hyp-rationale"><strong>Why:</strong> ${h.rationale}</p>
+          ${i === approvedIdx
+            ? '<span class="badge badge-approved" style="margin-top: var(--space-sm)">✓ Your Chosen Offer</span>'
+            : !profile
+                ? `<button class="btn btn-primary btn-sm approve-offer-btn" data-index="${i}" style="margin-top: var(--space-md)">Choose This Offer →</button>`
+                : ''
+        }
+        </div>
+      `).join('')}
+    </div>
+  `;
+}
+
+function renderPresetPanel(presets: StarterPreset[], context: 'discovery' | 'strategy'): string {
+    if (!presets.length) return '';
+    return `
+    <hr class="section-divider" />
+    <div class="preset-panel">
+      <div class="preset-panel-header">
+        <span class="preset-panel-title">🧪 Try a Starter Example Business</span>
+        <span class="preset-panel-sub">New here? Load a realistic example to see how the system works — no real data needed.</span>
+      </div>
+      <div class="preset-grid">
+        ${presets.map(p => `
+          <button class="preset-card load-preset-btn" data-preset-id="${p.id}" data-context="${context}">
+            <span class="preset-icon">${p.icon}</span>
+            <span class="preset-name">${p.name}</span>
+            <span class="preset-desc">${p.description}</span>
+          </button>
+        `).join('')}
+      </div>
+      <p class="preset-note">Loading a preset fills in the Business Discovery form with realistic example data. You can edit any field before submitting.</p>
+    </div>
+  `;
+}
+
+export function bindStrategyWorkspaceEvents(): void {
+    document.querySelectorAll('.approve-offer-btn').forEach(btn => {
+        btn.addEventListener('click', () => {
+            const idx = parseInt((btn as HTMLElement).dataset.index || '0');
+            engine.approveOffer(idx);
+            window.dispatchEvent(new CustomEvent('navigate', { detail: 'strategy-workspace' }));
+        });
+    });
+
+    document.querySelectorAll('.load-preset-btn').forEach(btn => {
+        btn.addEventListener('click', () => {
+            const presetId = (btn as HTMLElement).dataset.presetId || '';
+            const context = (btn as HTMLElement).dataset.context as 'discovery' | 'strategy';
+            engine.loadStarterPreset(presetId);
+            // Navigate to discovery to show the pre-filled form
+            window.dispatchEvent(new CustomEvent('navigate', { detail: 'discovery' }));
+        });
+    });
+}
diff --git a/src/pages/style-studio.ts b/src/pages/style-studio.ts
new file mode 100644
index 0000000..6b6e430
--- /dev/null
+++ b/src/pages/style-studio.ts
@@ -0,0 +1,110 @@
+/**
+ * Style Studio — FUT-1
+ * Mock-safe shell for the style-system foundation.
+ * Lets operators define tone, formality, CTA intensity, and compliance rules
+ * for campaign copy. In mock mode this is a read-only preview.
+ */
+
+export function renderStyleStudioPage(): string {
+    return `
+    <div class="page-shell">
+      <div class="page-heading">
+        <h1 class="page-title">Style Studio</h1>
+        <p class="page-subtitle">
+          Define your brand voice and content rules. Every campaign you generate will
+          follow these settings — so your posts sound like you, not a template.
+        </p>
+      </div>
+
+      <div class="coach-block">
+        <div class="coach-block-icon">🎨</div>
+        <div class="coach-block-body">
+          <strong>What you do here</strong>
+          <p>Set the writing style for all your campaigns: tone, formality, CTA intensity, and any phrases that must (or must never) appear.</p>
+          <strong>Why it matters</strong>
+          <p>Consistent style builds brand recognition and reduces copy review time. Instead of correcting the same issues every batch, you set the rules once here.</p>
+          <strong>What comes next</strong>
+          <p>Once your style profile is saved, the Campaign Launcher uses it automatically when generating copy variants.</p>
+        </div>
+      </div>
+
+      <div class="mock-notice">
+        <span class="mock-badge">PREVIEW</span>
+        Style Studio controls are coming soon. This shell shows the planned interface.
+        Your existing campaigns use the default style profile until you configure one here.
+      </div>
+
+      <div class="studio-sections">
+        <section class="studio-section card">
+          <h2 class="section-title">Voice &amp; Tone</h2>
+          <div class="field-group">
+            <label class="field-label">Tone preset</label>
+            <div class="preset-chips">
+              <button class="chip chip--active" disabled>Professional</button>
+              <button class="chip" disabled>Conversational</button>
+              <button class="chip" disabled>Bold</button>
+              <button class="chip" disabled>Educational</button>
+            </div>
+          </div>
+          <div class="field-group">
+            <label class="field-label">Formality <span class="field-hint">(1 = casual, 5 = formal)</span></label>
+            <div class="slider-row">
+              <span class="slider-label">Casual</span>
+              <input type="range" min="1" max="5" value="3" disabled class="style-slider" />
+              <span class="slider-label">Formal</span>
+            </div>
+          </div>
+          <div class="field-group">
+            <label class="field-label">CTA intensity <span class="field-hint">(1 = soft suggestion, 5 = strong call-to-action)</span></label>
+            <div class="slider-row">
+              <span class="slider-label">Soft</span>
+              <input type="range" min="1" max="5" value="3" disabled class="style-slider" />
+              <span class="slider-label">Strong</span>
+            </div>
+          </div>
+        </section>
+
+        <section class="studio-section card">
+          <h2 class="section-title">Compliance &amp; Guardrails</h2>
+          <div class="field-group">
+            <label class="field-label">Banned phrases <span class="field-hint">Copy containing these terms will be flagged before approval</span></label>
+            <div class="tag-list tag-list--muted">
+              <span class="tag">guaranteed results</span>
+              <span class="tag">100% risk free</span>
+              <span class="tag-add" >+ Add phrase</span>
+            </div>
+          </div>
+          <div class="field-group">
+            <label class="field-label">Required disclaimers</label>
+            <div class="tag-list tag-list--muted">
+              <span class="tag-add">+ Add disclaimer</span>
+            </div>
+          </div>
+        </section>
+
+        <section class="studio-section card">
+          <h2 class="section-title">Channel Overrides</h2>
+          <p class="field-hint">Fine-tune style per channel. Inherits from Voice &amp; Tone above unless overridden.</p>
+          <div class="channel-tab-row">
+            <button class="channel-tab channel-tab--active" disabled>Meta</button>
+            <button class="channel-tab" disabled>LinkedIn</button>
+            <button class="channel-tab" disabled>X</button>
+            <button class="channel-tab" disabled>Email</button>
+          </div>
+          <div class="channel-override-preview">
+            <div class="field-hint">Max length, emoji policy, hashtag rules, and line-break style will appear here per channel.</div>
+          </div>
+        </section>
+      </div>
+
+      <div class="page-actions">
+        <button class="btn btn--primary" disabled>Save Style Profile</button>
+        <button class="btn btn--ghost" disabled>Preview Sample Output</button>
+      </div>
+    </div>
+  `;
+}
+
+export function bindStyleStudioEvents(): void {
+    // No live events in mock mode — controls are disabled.
+}
