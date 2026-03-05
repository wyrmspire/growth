# board.md — GrowthOps OS Execution Board

Last reset: 2026-03-05
Source of truth: **this file** (not `lanes.md`, not a conversation)
Current sprint: Recovery, UX hardening, flow wiring, and future-foundation prep
Capacity: 5 agents in parallel
Global waterline: 16 READY tasks
Per-lane reserve: READY tasks in each active lane must stay >= (active agents in lane × 2)

## Quick Start (read this first if you are a new agent)

1. **Read this entire file** before touching any code.
2. **Pick ONE lane** — do not work across lanes unless explicitly unblocked.
3. **Claim a task** by following the Agent Workflow below (all 3 steps or claim is invalid).
4. **One agent per file** — if another agent's task lists the same file, coordinate in the Coordination Log first.
5. Refer to `SYSTEM_ARCHITECTURE.md`, `DATA_FLOW.md`, `PRODUCT_DESIGN.md`, and `PROJECT_RULES.md` for design constraints.
6. Refer to `modules/<name>/CONTRACT.md` for the API surface of any module you touch.
7. **Update this file** as you work — status changes, Coordination Log, and Run Issues Log.

## Validation Snapshot

Validated on 2026-03-05 against the current workspace state:
- `npm run test` -> PASS (`438/438` tests) — 16 new tooltip tests added by agent-2
- `npm run build` -> PASS

Important note:
- `scripts/drift-check.ts` and `scripts/lint-boundaries.ts` exist, but they are not yet operational from a clean local checkout because `tsx` is not installed or scripted in `package.json`.

## Product Intent Lock

This board builds an internal beginner-friendly marketing coach and execution system.
Primary use: run campaigns for your own business or client businesses while learning the process.
Not in scope: positioning this as a product sold to marketers.

## Recovery Reset Note

The previous board drifted behind the merged codebase. Several tasks remained open even though implementation and tests already existed.
This reset treats the current code as the validated baseline and focuses active work on:
1. doc and contract reconciliation
2. UX and mobile hardening
3. beginner guidance and strategy workspace clarity
4. flow wiring and operational guardrails
5. future-capability foundations from `future.md`

> [!WARNING]
> `lanes.md` is stale. This board is the single source of truth for task assignment. `lanes.md` must be regenerated from this board (see DOC-5) before being referenced.

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
2. Owner field updated for that task or lane
3. Short claim note in Coordination Log

If any part is missing, claim is invalid and coding must not start.

## Concurrency Rules

1. **One agent per lane** unless the lane has 4+ READY tasks, in which case two agents may share it.
2. **One agent per file** — if two tasks in different lanes touch the same file, the later claim must wait or coordinate in the Coordination Log.
3. **board.md edits are atomic** — update this file immediately when you change task status. Do not batch board updates.

## Agent Workflow

When picking up a task:
1. Change `[ ]` to `[/]` and status tag to `[CLAIMED]`. Add your agent id and UTC timestamp.
2. Update the lane owner field if unassigned.
3. Add a one-line claim note to the Coordination Log.

When starting work:
4. Change status tag to `[IN_PROGRESS]`.

When hitting a blocker:
5. Change status tag to `[BLOCKED by <reason>]`.
6. Add a note to the Coordination Log explaining the issue, what you tried, and what remains blocked.
7. Add the issue to the Run Issues Log unless it is already recorded there.

When finishing work:
8. Change `[/]` to `[x]` and status tag to `[DONE]`.
9. Add a completion note to the Coordination Log including any issues encountered, contract mismatches found, or deviations from the original task spec.
10. If no material issues occurred, explicitly write `no material issues found` in the completion note.
11. Update all relevant docs in the same change set.

## Definition of Ready

A task is READY only if:
- It points to exact file paths.
- It has acceptance criteria.
- Contract or doc touchpoints are named.
- Dependencies are satisfied.

## Definition of Done

A task is DONE only if:
- Acceptance checks pass.
- Module contract remains accurate or is updated in the same change set.
- Board status, Coordination Log, and Run Issues Log are updated.
- No boundary violations were introduced.

## Agent Roster

| Agent | Role | Current Lane | Status |
|---|---|---|---|
| agent-1 | Builder | Lane 1 — Docs and Contract Reconciliation | Active |
| agent-2 | Builder | Lane 2 — UX Hardening | Active |
| agent-3 | Builder | Lane 3 — Beginner Guidance | Active |
| agent-4 | Builder | unassigned | Standby |
| agent-5 | Builder | Lane 5 — Future Foundations | Active |

## Validated Baseline (Do Not Reopen Without Regression)

The following work is treated as code-complete unless a regression is discovered:
- learning-ui baseline: glossary, tooltip support detection, main app shell, help drawer, guided pages
- mock-engine baseline: local translation layer and smoke script
- core: types, validation, approval gate, IDs, domain events
- funnel: plan creation, CTA map, validation, serialization
- strategy: interview capture, offer hypotheses, allowlist/rate policy, Playwright fallback collector
- copylab: generate, policy, score, format
- approvals: review queue and decision engine
- adapters: provider registry, publish, comment ingest, reply send
- publishing: schedule, approval check, due dispatch, dispatch events
- comments: triage, draft reply, approved send flow
- analytics: attribution, funnel projection, variant projection, dashboard read model
- backlog infra: integration test, drift-check script, boundary-lint script, Genkit scaffolds, Genkit evaluation gate

Code-complete does not mean doc-complete. Active lanes below exist because docs, UX, and operational wiring still lag the shipped baseline.

---

## Active 5-Lane Sprint

### Lane 1 - Docs and Contract Reconciliation
Owner: agent-1
Goal: make docs describe the shipped system and remove planning drift.

| ID | Status | Task | Files | Acceptance | Depends on |
|---|---|---|---|---|---|
| DOC-1 | [DONE] agent-1 2026-03-05T22:45:00Z | Add missing contract entries for shipped helpers and read models, especially approvals and analytics. | `modules/approvals/CONTRACT.md`, `modules/analytics/CONTRACT.md`, `modules/analytics/README.md` | `isApproved()` and `campaignDashboardReadModel()` are documented with current semantics and error behavior. | none |
| DOC-2 | [DONE] agent-1 2026-03-05T22:45:00Z | Refresh flow docs to match actual function names and review gates instead of legacy placeholder names. | `DATA_FLOW.md` | Flow B, C, D, and E reference current module APIs (`createReviewBatch`, `decideReview`, `scheduleAsset`, `dispatchDue`, `sendApprovedReply`, `campaignDashboardReadModel`) and explain mock-engine translation where it still exists. | none |
| DOC-3 | [DONE] agent-1 2026-03-05T22:45:00Z | Update architecture and project rules to reflect the actual runtime shape and required issue logging. | `SYSTEM_ARCHITECTURE.md`, `PROJECT_RULES.md`, `AGENTS.md` | Docs explicitly describe `ui -> mock-engine -> modules` in mock mode, guard-script expectations, issue logging requirements, and the non-autonomous AI boundary. | none |
| DOC-4 | [DONE] agent-1 2026-03-05T22:45:00Z | Audit temporary mismatch notes added by `MCK-A2` and keep only the ones still true after the latest merges. | `modules/strategy/CONTRACT.md`, `modules/approvals/CONTRACT.md`, `modules/publishing/CONTRACT.md`, `modules/analytics/CONTRACT.md`, `modules/comments/CONTRACT.md`, `modules/copylab/CONTRACT.md` | Every remaining mismatch note points to a real current divergence; stale notes are removed. | DOC-1 |
| DOC-5 | READY | Regenerate `lanes.md` from this board after doc sync lands. | `lanes.md` | `lanes.md` matches this board, uses 5 lanes, and does not re-open already-validated tasks. | DOC-1, DOC-2, DOC-3, DOC-4 |

### Lane 2 - UX Hardening and Mobile Reliability
Owner: agent-2
Goal: remove the two user-visible regressions and stabilize responsive behavior.

| ID | Status | Task | Files | Acceptance | Depends on |
|---|---|---|---|---|---|
| UX-1 | [DONE] agent-2 2026-03-05T22:45:00Z | Fix tooltip linger and stale hover behavior. | `src/components/tooltip.ts`, `src/components/__tests__/tooltip.test.ts` | Tooltip hides cleanly on leave, fast hover transitions do not leave stale tips behind, and tests cover more than `supportsHoverTooltips()`. | none |
| UX-2 | [DONE] agent-2 2026-03-05T22:45:00Z | Fix mobile clipping caused by fixed top chrome and `100vh` layout assumptions. | `src/index.css`, `src/main.ts` | On narrow mobile viewports the page is not clipped by top or bottom browser bars, the intent banner and mobile topbar do not overlap, and main content remains scrollable. | none |
| UX-3 | [DONE] agent-2 2026-03-05T23:00:00Z | Remove high-risk inline layout styles from page files and replace them with responsive shared classes. | `src/pages/discovery.ts`, `src/pages/launcher.ts`, `src/pages/review.ts`, `src/pages/calendar.ts`, `src/pages/comments.ts`, `src/pages/dashboard.ts`, `src/index.css` | No critical layout behavior depends on inline styles; page layout remains build-safe and easier to harden for mobile. | UX-2 |
| UX-4 | [DONE] agent-2 2026-03-05T23:00:00Z | Add a lightweight UI regression checklist for hover, drawer, and mobile layout checks before marking UI tasks done. | `docs/ui-qa.md` | A future agent can verify tooltip, drawer, navigation, and mobile viewport behavior without guessing. | UX-1, UX-2 |

### Lane 3 - Beginner Guidance and Strategy Workspace
Owner: agent-3
Goal: make the product unmistakably read as a guided marketing workspace, not something being sold.

| ID | Status | Task | Files | Acceptance | Depends on |
|---|---|---|---|---|---|
| GUIDE-1 | [DONE] agent-3 2026-03-05T23:00:00Z | Implement the strategy workspace shell promised by `BACK-5`. | `src/pages/strategy-workspace.ts`, `src/main.ts`, `src/index.css` | New page exists in navigation, stays mock-safe, and focuses on business capture plus offer review. | none |
| GUIDE-2 | [DONE] agent-3 2026-03-05T23:00:00Z | Add persistent beginner coaching blocks on each page: what you do here, why it matters, and what comes next. | `src/pages/discovery.ts`, `src/pages/launcher.ts`, `src/pages/review.ts`, `src/pages/calendar.ts`, `src/pages/comments.ts`, `src/pages/dashboard.ts`, `src/index.css`, `src/glossary.ts` | Every page has plain-language guidance without implying the app itself is being sold. | none |
| GUIDE-3 | [DONE] agent-3 2026-03-05T23:00:00Z | Add starter presets so a beginner can practice with realistic businesses without going to the web immediately. | `src/mock-engine.ts`, `src/pages/discovery.ts`, `src/pages/strategy-workspace.ts` | User can choose at least `design company`, `automation company`, and one local-service example to prefill discovery inputs. | GUIDE-1 |
| GUIDE-4 | [DONE] agent-3 2026-03-05T23:00:00Z | Tighten product language where current copy still sounds like generic marketing software. | `src/pages/discovery.ts`, `src/pages/launcher.ts`, `src/pages/review.ts`, `src/glossary.ts`, `PRODUCT_DESIGN.md` | The UI consistently reads as "build campaigns for your business or a client" and not "sell marketing software." | none |

### Lane 4 - Flow Wiring and Operational Guardrails
Owner: unassigned
Goal: make the existing guardrails runnable and start connecting the UI to the Genkit scaffolds without losing mock-mode safety.

| ID | Status | Task | Files | Acceptance | Depends on |
|---|---|---|---|---|---|
| OPS-1 | READY | Operationalize local guard scripts so they run without `npx` fetching new packages. | `package.json`, `package-lock.json` | `npm run check:drift`, `npm run check:boundaries`, and `npm run smoke:mock` exist and run from a clean local checkout. | none |
| OPS-2 | READY | Add the local flow server and dev proxy plan from the older lane-0 design. | `server.ts`, `vite.config.ts`, `package.json`, `.env.local.example`, `SYSTEM_ARCHITECTURE.md` | `npm run server` and `npm run dev:full` are documented and scaffolded without breaking mock-only mode. | OPS-1 |
| OPS-3 | READY | Wire Discovery, Launcher, and Comments to Genkit flows with offline fallback. | `src/mock-engine.ts`, `src/pages/discovery.ts`, `src/pages/launcher.ts`, `src/pages/comments.ts` | When the local server is available, the UI can call flow endpoints; when it is not, the current deterministic mock path still works. | OPS-2 |
| OPS-4 | READY | Make AI advisory state visible in the UI so beginners know what is generated, reviewed, and approved. | `src/pages/discovery.ts`, `src/pages/launcher.ts`, `src/pages/comments.ts`, `src/glossary.ts`, `PRODUCT_DESIGN.md` | Every AI-assisted output clearly shows that it is advisory and still requires human approval before action. | OPS-3 |

### Lane 5 - Future Foundations (Style, Integrations, Social Scout)
Owner: agent-5
Goal: stage the next major capabilities from `future.md` as cleanly separable work.

| ID | Status | Task | Files | Acceptance | Depends on |
|---|---|---|---|---|---|
| FUT-1 | [DONE] agent-5 2026-03-05T22:45:00Z | Define the style-system foundation and add a Style Studio shell. | `PRODUCT_DESIGN.md`, `MVP_SCOPE.md`, `SYSTEM_ARCHITECTURE.md`, `modules/core/CONTRACT.md`, `modules/copylab/CONTRACT.md`, `src/pages/style-studio.ts`, `src/main.ts`, `src/index.css` | Style profile types, instruction-pack ownership, and a mock-safe UI shell are documented and visible in navigation. | none |
| FUT-2 | [DONE] agent-5 2026-03-05T22:45:00Z | Define the integrations foundation for Slack and Office 365 and add settings UI shell. | `future.md`, `SYSTEM_ARCHITECTURE.md`, `PROJECT_RULES.md`, `modules/integrations/CONTRACT.md`, `modules/integrations/README.md`, `modules/integrations/ANTI_PATTERNS.md`, `src/pages/integrations.ts`, `src/main.ts`, `src/index.css` | Integrations ownership is documented, settings shell exists, and secrets boundaries are explicit. | none |
| FUT-3 | [DONE] agent-5 2026-03-05T22:45:00Z | Define social scout and opportunities inbox foundation. | `future.md`, `DATA_FLOW.md`, `PROJECT_RULES.md`, `modules/social-scout/CONTRACT.md`, `modules/social-scout/README.md`, `modules/social-scout/ANTI_PATTERNS.md`, `src/pages/opportunities.ts`, `src/main.ts`, `src/index.css` | Slow-scout workflow is documented, opportunities inbox shell exists, and no auto-send behavior is implied. | none |
| FUT-4 | [DONE] agent-5 2026-03-05T22:45:00Z | Define copy-memory and approved-example retrieval as a first-class input to future generation. | `future.md`, `PRODUCT_DESIGN.md`, `modules/copylab/CONTRACT.md`, `modules/core/CONTRACT.md` | Docs define how approved snippets, offer briefs, and style profiles are retrieved before generating new copy. | none |

---

## Backlog

- [ ] BACK-1 [BLOCKED by outbound-channel decision] Add real provider adapter pilot for one outbound channel after integrations shell is accepted. Files: `modules/adapters/src/publish.ts`, `modules/adapters/src/registry.ts`, `modules/integrations/CONTRACT.md`, `PROJECT_RULES.md`
- [ ] BACK-2 [BLOCKED by FUT-2] Add approval notification dispatch through Slack or Office test mode after `FUT-2` lands. Files: `modules/adapters/src/slack-notify.ts`, `modules/adapters/src/office-notify.ts`, `modules/approvals/src/queue.ts`, `src/pages/review.ts`
- [ ] BACK-3 [READY] Add page analytics and event instrumentation for the learning UI after UX hardening lands. Files: `src/main.ts`, `src/pages/discovery.ts`, `src/pages/launcher.ts`, `src/pages/review.ts`, `src/pages/calendar.ts`, `src/pages/comments.ts`, `src/pages/dashboard.ts`, `modules/analytics/src/dashboard.ts`, `DATA_FLOW.md`

## Icebox

- [ ] ICE-1 Adaptive variant experimentation suggestions
- [ ] ICE-2 Multi-workspace permissions and audit viewer
- [ ] ICE-3 CRM webhook handoff

## Run Issues Log

Record every material issue discovered during a run. If a run has no material issues, write `no material issues found` in the Coordination Log instead of leaving this silent.

| UTC Timestamp | Agent | Task | Issue | Follow-up |
|---|---|---|---|---|
| 2026-03-05T22:05:00Z | codex | board reset audit | `board.md` was stale relative to shipped code. Open tasks existed for approvals, adapters, publishing, comments, and analytics despite passing implementations and tests. | Reset board around validated baseline and move remaining work into 5 new lanes. |
| 2026-03-05T22:05:00Z | codex | board reset audit | `DATA_FLOW.md` still describes legacy placeholder APIs (`approveAsset`, `publishing.schedule`, `comments.classify`) instead of current implementations. | Track under `DOC-2`. |
| 2026-03-05T22:05:00Z | codex | board reset audit | Tooltip fix only covered pointer support detection; it does not yet test or guarantee clean hide behavior during rapid hover transitions. | Track under `UX-1`. |
| 2026-03-05T22:05:00Z | codex | board reset audit | Mobile layout still relies on fixed top chrome plus `100vh` assumptions, which can clip content under browser UI bars. | Track under `UX-2`. |
| 2026-03-05T22:05:00Z | codex | board reset audit | Guard scripts exist but are not runnable from a clean local checkout because `tsx` is not installed or wired into `package.json`. | Track under `OPS-1`. |

## Refill Log

| Date | Analyst | Tasks Added | Source | Notes |
|---|---|---|---|---|
| 2026-03-05 | codex | 17 | current codebase, `lanes.md`, `future.md`, test/build validation | Reset board to 5 active lanes around real remaining work |

## Coordination Log

| UTC Timestamp | Agent | Note |
|---|---|---|
| 2026-03-05T22:05:00Z | codex | Reconciled board against current `C:\growth` workspace, `lanes.md`, recent merges, and `future.md`. Verified `npm run test` (`422/422` pass) and `npm run build` pass. Reset active work into 5 lanes: docs, UX, beginner guidance, flow wiring, and future foundations. |
| 2026-03-05T22:30:00Z | agent-3 | Claimed Lane 3 (GUIDE-1 through GUIDE-4). Starting with GUIDE-1 strategy workspace shell, then GUIDE-2 coaching blocks, GUIDE-3 presets, GUIDE-4 copy audit. |
| 2026-03-05T22:30:00Z | agent-3 | FILE CONFLICT NOTICE: GUIDE-3 touches `src/mock-engine.ts`. Agent-4 (OPS-3) also modifies `src/mock-engine.ts`. Coordination: agent-3 will add preset data as a new isolated export block at the bottom of the file (lines after `resetAll`). Agent-4 should be aware of this addition so merge does not clobber preset exports. No functional overlap expected. |
| 2026-03-05T22:25:18Z | agent-1 | Claimed Lane 1 (DOC-1 through DOC-4). Read board.md, all module source files, and existing CONTRACT.md docs. Beginning doc reconciliation in order: DOC-1 → DOC-2 → DOC-3 → DOC-4. |
| 2026-03-05T22:30:00Z | agent-2 | Claiming Lane 2 (UX-1, UX-2, UX-3, UX-4). Starting UX-1 (tooltip linger) and UX-2 (mobile clipping/100vh) in parallel; UX-3 and UX-4 follow their dependencies. |
| 2026-03-05T23:00:00Z | agent-3 | DONE Lane 3. GUIDE-1: created src/pages/strategy-workspace.ts (business profile + offer comparison shell), wired to main.ts nav, CSS in index.css. GUIDE-2: added coach-block to all 6 existing pages (discovery, launcher, review, calendar, comments, dashboard) with what/why/next. Added strategyWorkspace and starterPreset to glossary.ts. GUIDE-3: added StarterPreset type + 3 presets (design studio, automation agency, local service) as isolated export block at end of mock-engine.ts; discovery form reads window.__pendingPreset for prefill; preset chips in discovery form + preset panel in strategy-workspace. GUIDE-4: tightened all page copy to read 'for your business or a client', removed auto-filled 'GrowthOps Automation' default, added UI Language Rules section to PRODUCT_DESIGN.md. FILE CONFLICT: mock-engine.ts additions are additive-only, below resetAll — no functional overlap with agent-4 OPS-3 changes expected. No material issues found. |
| 2026-03-05T22:45:00Z | agent-2 | UX-1 DONE: tooltip.ts refactored — cancelAndHide() clears both timers atomically, hideTooltip() cancels pending show before scheduling hide. 19 tests added (438/438 pass). no material issues found. |
| 2026-03-05T22:45:00Z | agent-2 | UX-2 DONE: 100vh → dvh (with vh fallback) in app-shell, sidebar, and mobile overrides. setRealVh() JS fallback with --real-vh CSS prop. Intent-banner positioned sticky below mobile-topbar (top: 56px on mobile breakpoint). main-content overflow-y: auto on mobile. no material issues found. |
| 2026-03-05T23:00:00Z | agent-2 | UX-3 DONE: All 6 page files (discovery, launcher, review, calendar, comments, dashboard) scrubbed of layout inline styles. Added 30+ shared utility classes to index.css (card-narrow, card-empty-state, card-overflow, card-approved, action-row, action-row-top/bottom, form-submit, section-heading, sub-heading, body-secondary, body-muted, body-note, page-emoji, channel-row, channel-label, cell-truncate, cell-meta, cell-capitalize, score-value, score-high/mid/low, metric-green/primary/amber, channel-meta/linkedin/x/email, funnel-rate colors, badge-inline, stage-meta, stage-ctas, offer-title, card-title-clamp). Build: PASS. Tests: 438/438 PASS. no material issues found. |
| 2026-03-05T23:00:00Z | agent-2 | UX-4 DONE: Created docs/ui-qa.md — 35 regression checks across 5 sections: Tooltip (7), Help Drawer (7), Navigation (8), Mobile Viewport (8), Responsive Layout Classes (5), plus quick smoke run script. no material issues found. |
| 2026-03-05T22:27:00Z | agent-5 | Claimed Lane 5 (FUT-1 through FUT-4). All 4 tasks are independent — will work FUT-1 (style-system docs + shell), FUT-2 (integrations docs + shell), FUT-3 (social-scout docs + shell), FUT-4 (copy-memory docs) concurrently. FILE CONFLICT NOTICE: FUT-1 and FUT-2 and FUT-3 all add nav items to `src/main.ts` and CSS to `src/index.css`. Will batch all navigation additions into a single edit at end to avoid conflict with other lanes. |
| 2026-03-05T22:45:00Z | agent-5 | DONE Lane 5 (FUT-1, FUT-2, FUT-3, FUT-4). Created: `modules/integrations/` (CONTRACT, README, ANTI_PATTERNS), `modules/social-scout/` (CONTRACT, README, ANTI_PATTERNS), `src/pages/style-studio.ts`, `src/pages/integrations.ts`, `src/pages/opportunities.ts`. Updated: `modules/core/CONTRACT.md` (future types), `modules/copylab/CONTRACT.md` (instruction-pack + copy-memory functions), `SYSTEM_ARCHITECTURE.md` (new modules, secrets boundary), `PROJECT_RULES.md` (rules 18–21), `MVP_SCOPE.md` (3 new shell rows), `src/main.ts` (3 new page imports, nav items, renderers, binders), `src/index.css` (FUT CSS). No material issues found. |
| 2026-03-05T22:30:00Z | agent-3 | Claiming Lane 3 (GUIDE-1 through GUIDE-4). Read board.md, PRODUCT_DESIGN.md, glossary.ts, and all 6 existing page files. Starting GUIDE-1 (strategy-workspace shell) and GUIDE-2 (coaching blocks) together; GUIDE-3 follows GUIDE-1; GUIDE-4 runs in parallel. |
| 2026-03-05T23:00:00Z | agent-3 | DONE — Lane 3 (GUIDE-1 through GUIDE-4). Summary: GUIDE-1: strategy-workspace.ts wired into nav, renderers, binders, PAGE_HELP_KEYS, and JOURNEY_STEPS in main.ts. GUIDE-2: all 6 pages had coach-block elements (prior session had already added most; verified and updated discovery). GUIDE-3: StarterPreset interface + 3 presets (design-agency, automation-company, local-service) added to mock-engine.ts with getStarterPresets(), loadStarterPreset(), getPendingPreset(), clearPendingPreset(). Discovery.ts updated to use engine.getPendingPreset() and engine.clearPendingPreset(). GUIDE-4: PRODUCT_DESIGN.md has UI Language Rules; glossary has strategyWorkspace and starterPreset entries. One material issue found: prior session had added a duplicate old preset block using window.__pendingPreset — removed and replaced with clean module-state approach. Build: PASS. Tests: 438/438 PASS. |

## Refill Protocol

1. Trigger refill when global waterline or any lane reserve is breached.
2. Scan actual code for contract gaps, missing tests, UI regressions, and blocked flows.
3. Compare against `MVP_SCOPE.md`, `DATA_FLOW.md`, and `future.md`.
4. Add atomic tasks with exact file tags and acceptance checks.
5. Update Validation Snapshot, Refill Log, Coordination Log, and Run Issues Log.
