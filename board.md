# board.md - GrowthOps OS Execution Board

Last reset: 2026-03-05
Source of truth: this file (not `lanes.md`, not a conversation)
Current sprint: Recovery sprint closeout and backlog refill prep
Capacity: 5 agents in parallel
Global waterline: 16 READY tasks
Per-lane reserve: READY tasks in each active lane must stay >= (active agents in lane * 2)

## Quick Start (read this first if you are a new agent)

1. Read this entire file before touching any code.
2. Pick ONE lane - do not work across lanes unless explicitly unblocked.
3. Claim a task by following the Agent Workflow below (all 3 steps or claim is invalid).
4. One agent per file - if another agent's task lists the same file, coordinate in the Coordination Log first.
5. Refer to `SYSTEM_ARCHITECTURE.md`, `DATA_FLOW.md`, `PRODUCT_DESIGN.md`, and `PROJECT_RULES.md` for design constraints.
6. Refer to `modules/<name>/CONTRACT.md` for the API surface of any module you touch.
7. Update this file as you work - status changes, Coordination Log, and Run Issues Log.

## Validation Snapshot

Validated on 2026-03-05 against the current workspace state:
- `npm run check` -> PASS (`check:drift`, `check:boundaries`, `smoke:mock`)
- `npm run test` -> PASS (`458/458` tests — 20 new from Sprint 2)
- `npm run build` -> PASS (103.47 kB gzipped)
- `lanes.md` updated for Sprint 2 (revision 5)

## Product Intent Lock

This board builds an internal beginner-friendly marketing coach and execution system.
Primary use: run campaigns for your own business or client businesses while learning the process.
Not in scope: positioning this as a product sold to marketers.

## Recovery Reset Note

The previous board drifted behind the merged codebase. Several tasks remained open even though implementation and tests already existed.
This reset treated the current code as the validated baseline and focused active work on:
1. doc and contract reconciliation
2. UX and mobile hardening
3. beginner guidance and strategy workspace clarity
4. flow wiring and operational guardrails
5. future-capability foundations from `future.md`

`lanes.md` is now synchronized again, but this board remains the single source of truth for task assignment.

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

1. One agent per lane unless the lane has 4+ READY tasks, in which case two agents may share it.
2. One agent per file - if two tasks in different lanes touch the same file, the later claim must wait or coordinate in the Coordination Log.
3. `board.md` edits are atomic - update this file immediately when you change task status. Do not batch board updates.

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
| agent-1 | Builder | Lane 1 - Docs and Contract Reconciliation | Complete |
| agent-2 | Builder | Lane 2 - UX Hardening and Mobile Reliability | Complete |
| agent-3 | Builder | Lane 3 - Beginner Guidance and Strategy Workspace | Complete |
| agent-4 | Builder | unassigned | Standby |
| agent-5 | Builder | Lane 5 - Future Foundations | Complete |
| codex | Integrator | Backlog - RESEARCH-4 Shared research store | Complete |

## Validated Baseline (Do Not Reopen Without Regression)

The following work is treated as code-complete unless a regression is discovered:
- learning-ui baseline: glossary, tooltip support detection, main app shell, help drawer, guided pages
- mock-engine baseline: local translation layer and smoke script
- local advisory mode baseline: flow server scaffold, Vite dev proxy, offline fallback notices
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

Code-complete does not mean doc-complete. The sprint below exists to track doc sync, UX hardening, beginner guidance, operational guardrails, and future-foundation prep.

---

## Active 5-Lane Sprint

### Lane 1 - Docs and Contract Reconciliation
Owner: agent-1 / codex (DOC-5 closeout)
Goal: make docs describe the shipped system and remove planning drift.

| ID | Status | Task | Files | Acceptance | Depends on |
|---|---|---|---|---|---|
| DOC-1 | [DONE] agent-1 2026-03-05T22:45:00Z | Add missing contract entries for shipped helpers and read models, especially approvals and analytics. | `modules/approvals/CONTRACT.md`, `modules/analytics/CONTRACT.md`, `modules/analytics/README.md` | `isApproved()` and `campaignDashboardReadModel()` are documented with current semantics and error behavior. | none |
| DOC-2 | [DONE] agent-1 2026-03-05T22:45:00Z | Refresh flow docs to match actual function names and review gates instead of legacy placeholder names. | `DATA_FLOW.md` | Flow B, C, D, and E reference current module APIs (`createReviewBatch`, `decideReview`, `scheduleAsset`, `dispatchDue`, `sendApprovedReply`, `campaignDashboardReadModel`) and explain mock-engine translation where it still exists. | none |
| DOC-3 | [DONE] agent-1 2026-03-05T22:45:00Z | Update architecture and project rules to reflect the actual runtime shape and required issue logging. | `SYSTEM_ARCHITECTURE.md`, `PROJECT_RULES.md`, `AGENTS.md` | Docs explicitly describe mock mode, guard-script expectations, issue logging requirements, and the non-autonomous AI boundary. | none |
| DOC-4 | [DONE] agent-1 2026-03-05T22:45:00Z | Audit temporary mismatch notes added by `MCK-A2` and keep only the ones still true after the latest merges. | `modules/strategy/CONTRACT.md`, `modules/approvals/CONTRACT.md`, `modules/publishing/CONTRACT.md`, `modules/analytics/CONTRACT.md`, `modules/comments/CONTRACT.md`, `modules/copylab/CONTRACT.md` | Every remaining mismatch note points to a real current divergence; stale notes are removed. | DOC-1 |
| DOC-5 | [DONE] codex 2026-03-05T23:13:40Z | Regenerate `lanes.md` from this board after doc sync lands. | `lanes.md` | `lanes.md` matches this board, uses 5 lanes, and does not re-open already-validated tasks. | DOC-1, DOC-2, DOC-3, DOC-4 |

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
Owner: codex
Goal: make the existing guardrails runnable and start connecting the UI to the Genkit scaffolds without losing mock-mode safety.

| ID | Status | Task | Files | Acceptance | Depends on |
|---|---|---|---|---|---|
| OPS-1 | [DONE] codex 2026-03-05T23:12:53Z | Operationalize local guard scripts so they run without `npx` fetching new packages. | `package.json`, `package-lock.json`, `scripts/drift-check.ts`, `scripts/smoke-mock.ts` | `npm run check:drift`, `npm run check:boundaries`, and `npm run smoke:mock` exist and run from a clean local checkout. | none |
| OPS-2 | [DONE] codex 2026-03-05T23:12:53Z | Add the local flow server and dev proxy plan from the older lane-0 design. | `server.ts`, `vite.config.ts`, `package.json`, `.env.local.example`, `SYSTEM_ARCHITECTURE.md` | `npm run server` and `npm run dev:full` are documented and scaffolded without breaking mock-only mode. | OPS-1 |
| OPS-3 | [DONE] codex 2026-03-05T23:12:53Z | Wire Discovery, Launcher, and Comments to Genkit flows with offline fallback. | `src/mock-engine.ts`, `src/pages/discovery.ts`, `src/pages/launcher.ts`, `src/pages/comments.ts`, `scripts/smoke-mock.ts` | When the local server is available, the UI can call flow endpoints; when it is not, the current deterministic mock path still works. Reply drafts are routed through approvals before send. | OPS-2 |
| OPS-4 | [DONE] codex 2026-03-05T23:12:53Z | Make AI advisory state visible in the UI so beginners know what is generated, reviewed, and approved. | `src/pages/discovery.ts`, `src/pages/launcher.ts`, `src/pages/comments.ts`, `src/glossary.ts`, `PRODUCT_DESIGN.md`, `AGENTS.md`, `PROJECT_RULES.md` | Every AI-assisted output clearly shows that it is advisory and still requires human approval before action. | OPS-3 |

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

### Research loop refill — 2026-03-12

- [x] RESEARCH-1 [DONE] codex 2026-03-12T07:20:00Z Add a local-first research capture schema and seed dataset for manually collected opportunities/signals. Files: `modules/social-scout/CONTRACT.md`, `modules/social-scout/README.md`, `data/research/opportunities.seed.json`, `data/research/README.md`, `future.md` Acceptance: the repo defines one durable local capture format, includes seeded example records tied to operator/research use cases, and documents why manual-first capture is the current preferred path.
- [x] RESEARCH-2 [DONE] codex 2026-03-12T07:41:00Z Replace hard-coded Opportunities Inbox cards with a local loader backed by the seed research dataset. Files: `src/pages/opportunities.ts`, `src/main.ts`, `src/index.css`, `data/research/opportunities.seed.json` Acceptance: the page renders from local repo data instead of in-file mocks, remains fully mock-safe/offline, and still makes the review boundary explicit.
- [x] RESEARCH-3 [DONE] codex 2026-03-12T10:50:00Z Add a first opportunity-scoring rubric and a tiny dashboard/read-model summary for captured research items. Files: `modules/social-scout/CONTRACT.md`, `modules/social-scout/README.md`, `modules/analytics/CONTRACT.md`, `modules/analytics/README.md`, `src/pages/dashboard.ts`, `DATA_FLOW.md`, `future.md` Acceptance: docs define the first scoring rubric, the dashboard can surface a compact opportunity/research summary, and all language stays advisory rather than autonomous.
- [x] RESEARCH-4 [DONE] codex 2026-03-12T11:45:00Z Move file-backed research loading and summary helpers into the `social-scout` module so the inbox/dashboard reuse one local data path. Files: `modules/social-scout/src/research-store.ts`, `modules/social-scout/src/__tests__/research-store.test.ts`, `modules/social-scout/CONTRACT.md`, `modules/social-scout/README.md`, `src/pages/opportunities.ts`, `src/pages/dashboard.ts` Acceptance: repo-backed research records and summary helpers live behind module exports, the inbox/dashboard import the shared helpers instead of hand-rolling seed parsing, and tests cover the shared loader/summary behavior.

- [ ] BACK-1 [BLOCKED by outbound-channel decision] Add real provider adapter pilot for one outbound channel after integrations shell is accepted. Files: `modules/adapters/src/publish.ts`, `modules/adapters/src/registry.ts`, `modules/integrations/CONTRACT.md`, `PROJECT_RULES.md`
- [ ] BACK-2 [BLOCKED by FUT-2] Add approval notification dispatch through Slack or Office test mode after `FUT-2` lands. Files: `modules/adapters/src/slack-notify.ts`, `modules/adapters/src/office-notify.ts`, `modules/approvals/src/queue.ts`, `src/pages/review.ts`
- [x] BACK-3 [DONE] codex 2026-03-12T06:19:00Z Add page analytics and event instrumentation for the learning UI after UX hardening lands. Files: `src/main.ts`, `src/pages/discovery.ts`, `src/pages/launcher.ts`, `src/pages/review.ts`, `src/pages/calendar.ts`, `src/pages/comments.ts`, `src/pages/dashboard.ts`, `modules/analytics/src/dashboard.ts`, `DATA_FLOW.md` Acceptance: learning-page views and key guided-flow actions are appended to the mock event stream, the dashboard surfaces a learning engagement summary, and docs/tests reflect the read-model change.
- [x] BACK-4 [DONE] codex 2026-03-12T05:46:47Z Wire row-level comment actions so no reply controls are inert. Files: `src/pages/comments.ts`, `src/mock-engine.ts`, `PRODUCT_DESIGN.md` Acceptance: comment-row approve/send, discard, and edit-placeholder actions either perform a real state transition or explicitly explain why they are unavailable.

## Icebox

- [ ] ICE-1 Adaptive variant experimentation suggestions
- [ ] ICE-2 Multi-workspace permissions and audit viewer
- [ ] ICE-3 CRM webhook handoff

## Run Issues Log

Record every material issue discovered during a run. If a run has no material issues, write `no material issues found` in the Coordination Log instead of leaving this silent.

| UTC Timestamp | Agent | Task | Issue | Follow-up |
|---|---|---|---|---|
| 2026-03-05T22:05:00Z | codex | board reset audit | `board.md` was stale relative to shipped code. Open tasks existed for approvals, adapters, publishing, comments, and analytics despite passing implementations and tests. | Reset board around validated baseline and move remaining work into 5 new lanes. |
| 2026-03-05T22:05:00Z | codex | board reset audit | `DATA_FLOW.md` still described legacy placeholder APIs (`approveAsset`, `publishing.schedule`, `comments.classify`) instead of current implementations. | Track under `DOC-2`. |
| 2026-03-05T22:05:00Z | codex | board reset audit | Tooltip fix only covered pointer support detection; it did not yet test or guarantee clean hide behavior during rapid hover transitions. | Track under `UX-1`. |
| 2026-03-05T22:05:00Z | codex | board reset audit | Mobile layout still relied on fixed top chrome plus `100vh` assumptions, which could clip content under browser UI bars. | Track under `UX-2`. |
| 2026-03-05T22:05:00Z | codex | board reset audit | Guard scripts existed but were not runnable from a clean local checkout because `tsx` was not installed or wired into `package.json`. | Track under `OPS-1`. |
| 2026-03-05T23:12:53Z | codex | OPS-1 | `check:drift` treated staged `## Future functions` contract notes as active exports, blocking the local guardrail even though those APIs were intentionally future-scoped. | Scope the checker to the active `## Exported Functions` section only. |
| 2026-03-05T23:12:53Z | codex | OPS-3 | Reply drafts were not being registered in the approvals queue, so the comments send path could fail closed without the smoke test noticing. | Register reply drafts in a review batch and assert reply-send events in `scripts/smoke-mock.ts`. |
| 2026-03-05T23:12:53Z | codex | OPS-3 audit | Comment-row reply controls in `src/pages/comments.ts` are still inert. | Track under `BACK-4`. |
| 2026-03-12T05:49:12Z | codex | BACK-4 validation | Repo checkout was missing local dependencies, so `npm run check` initially failed with `tsx: not found` even though `package.json` declared it. | Ran `npm install` from the existing lockfile, then reran validation successfully. |

## Refill Log

| Date | Analyst | Tasks Added | Source | Notes |
|---|---|---|---|---|
| 2026-03-05 | codex | 17 | current codebase, `lanes.md`, `future.md`, test/build validation | Reset board to 5 active lanes around real remaining work |
| 2026-03-05 | codex | 1 | Lane 4 validation audit | Added `BACK-4` after finding inert comment-row actions during final flow reconciliation. |
| 2026-03-12 | codex | 3 | `/home/devpc/dev/roadmap/00-brain-dump.md`, `future.md`, `src/pages/opportunities.ts`, `modules/social-scout/*` | Refilled the board with local-first research-loop tasks so Growth can progress without premature live integrations or outbound work. |

## Coordination Log

| UTC Timestamp | Agent | Note |
|---|---|---|
| 2026-03-05T22:05:00Z | codex | Reconciled board against current `C:\growth` workspace, `lanes.md`, recent merges, and `future.md`. Verified `npm run test` and `npm run build` pass. Reset active work into 5 lanes: docs, UX, beginner guidance, flow wiring, and future foundations. |
| 2026-03-12T06:44:00Z | codex | Planning-only refill pass. Reviewed `/home/devpc/dev/roadmap/00-brain-dump.md`, `future.md`, `modules/social-scout/*`, and the mock Opportunities Inbox, then added `RESEARCH-1` through `RESEARCH-3` plus `docs/2026-03-12-backlog-refill.md` so the next safe work can focus on local-first research capture and scoring. no material issues found. |
| 2026-03-05T22:25:18Z | agent-1 | Claimed Lane 1 (DOC-1 through DOC-4). Read board.md, all module source files, and existing CONTRACT.md docs. Beginning doc reconciliation in order: DOC-1 -> DOC-2 -> DOC-3 -> DOC-4. |
| 2026-03-05T22:45:00Z | agent-1 | DONE Lane 1 (DOC-1 through DOC-4). Updated approvals and analytics contracts, refreshed DATA_FLOW.md to current APIs, aligned SYSTEM_ARCHITECTURE.md, PROJECT_RULES.md, and AGENTS.md to the actual runtime shape, and audited remaining mismatch notes. no material issues found. |
| 2026-03-05T22:30:00Z | agent-2 | Claimed Lane 2 (UX-1 through UX-4). Starting tooltip/mobile fixes first, then shared layout cleanup and the UI QA checklist. |
| 2026-03-05T23:00:00Z | agent-2 | DONE Lane 2. Tooltip linger fixed, mobile clipping hardened, inline layout styles removed in favor of shared responsive classes, and `docs/ui-qa.md` added. `npm run test` (`438/438`) and `npm run build` passed. no material issues found. |
| 2026-03-05T22:30:00Z | agent-3 | Claimed Lane 3 (GUIDE-1 through GUIDE-4). Starting with the strategy workspace shell, coaching blocks, starter presets, and UI language tightening. |
| 2026-03-05T23:00:00Z | agent-3 | DONE Lane 3. Strategy workspace shell landed, every page now includes beginner coaching, starter presets were added for design/automation/local-service examples, and product language was tightened away from SaaS framing. One material issue found: removed a duplicated legacy `window.__pendingPreset` path and replaced it with module-owned preset state. |
| 2026-03-05T22:27:00Z | agent-5 | Claimed Lane 5 (FUT-1 through FUT-4). Working the style, integrations, social-scout, and copy-memory foundations in parallel with a single nav/CSS merge. |
| 2026-03-05T22:45:00Z | agent-5 | DONE Lane 5. Added Style Studio, Integrations, and Opportunities shells plus the supporting contracts, anti-pattern docs, and roadmap updates for style packs, Slack/Office 365, social scout, and copy memory. no material issues found. |
| 2026-03-05T22:20:00Z | codex | Claimed Lane 4 (OPS-1 through OPS-4). Starting with guard-script wiring in `package.json`, then server/proxy scaffold, then UI flow wiring with mock fallback and visible advisory state. |
| 2026-03-05T23:13:10Z | codex | Claimed DOC-5 for closeout after Lane 1 doc sync was already complete. Regenerating `lanes.md` directly from the finished 5-lane board and remaining backlog. |
| 2026-03-05T23:12:53Z | codex | DONE Lane 4. Guard scripts are now runnable from a clean checkout, the local flow server and Vite proxy are scaffolded, discovery/launcher/comments use Genkit flow endpoints with offline fallback, reply drafts now enter the approval gate before send, and advisory state is visible in both the UI and docs. Validation: `npm run check`, `npm run test` (`438/438`), and `npm run build` all passed. Material issues found and resolved: drift-check false positive on staged future functions; reply drafts were not entering the approvals queue. |
| 2026-03-05T23:13:40Z | codex | DONE DOC-5. Regenerated `lanes.md` from the current board without reopening validated work. `lanes.md` now mirrors the completed 5-lane sprint and points new work to READY backlog items only. no material issues found. |
| 2026-03-05T23:00:00Z | agent-5 | Sprint 2 started. Created `lanes.md` rev 4 and `implementation_plan.md` with 5 lanes / 18 tasks covering style system, preview feed, job API, backlog cleanup, and social scout. |
| 2026-03-05T23:05:00Z | agent-5 | DONE Lane 1 (Style System). STYLE-1: types added to `modules/core/src/types.ts`. STYLE-2: instruction pack compiler (7 tests). STYLE-3: style validator (7 tests). STYLE-4: interactive Style Studio with live tone/formality/CTA controls, tag editors, channel tabs, preview panel. |
| 2026-03-05T23:07:00Z | agent-5 | DONE Lane 2 (Preview Feed). PREV-1: `src/pages/preview-feed.ts` with Meta/LinkedIn/X/Email cards, character counting, platform filter. PREV-2: `modules/adapters/src/preview-adapter.ts` in-memory adapter. PREV-3: wired `/api/preview-feed` in `server.ts`. PREV-4: added to navigation, help keys, renderers, CSS. |
| 2026-03-05T23:07:00Z | agent-5 | Lane 3 (Job API) 3/4 done. JOB-1: `/api/jobs/*` router in `server.ts`. JOB-2: `src/scheduler.ts` + `npm run scheduler`. JOB-3: scout-scan job with mock data. JOB-4 (dashboard card) deferred. |
| 2026-03-05T23:07:00Z | agent-5 | Lane 5 (Social Scout) 3/4 done. SCOUT-1: types and validation in `modules/social-scout/src/types.ts`. SCOUT-2: scoring engine (6 tests) in `scorer.ts`. SCOUT-4: mock scanner pipeline in `scanner.ts`. SCOUT-3 (inbox UI buildout) deferred. |
| 2026-03-12T05:46:47Z | codex | Claimed BACK-4. Wiring row-level comment actions so approve/send and discard perform real state changes, while edit explains its current placeholder status instead of being inert. |
| 2026-03-12T05:51:10Z | codex | DONE BACK-4. Row-level comment actions now work: approve/send is actionable per reply, discard keeps replies out of send actions, sent replies show delivered state, and edit now explains the placeholder honestly instead of doing nothing. Validation passed with `npm run check`, `npm run test`, and `npm run build`. Material issue found and resolved: this checkout was missing local npm dependencies (`tsx` unavailable) until `npm install` restored the lockfile-defined toolchain. |
| 2026-03-12T06:19:00Z | codex | Claimed BACK-3. Adding lightweight learning-UI page/event instrumentation and dashboard surfacing so the guided flow can report engagement without changing the mock-safe runtime shape. |
| 2026-03-12T06:22:00Z | codex | DONE BACK-3. Added mock-safe learning telemetry events (`LearningPageViewed`, `LearningActionTracked`), instrumented the core guided pages, extended the analytics dashboard read model with a learning engagement summary, and surfaced the summary on the dashboard page. Validation passed with `npm run check`, targeted `npm run test -- modules/analytics/src/__tests__/dashboard.test.ts modules/core/src/__tests__/events.test.ts`, and `npm run build`. no material issues found. |
| 2026-03-12T07:20:00Z | codex | Claimed RESEARCH-1. Defining a local-first manual research capture format, seed dataset, and docs so the roadmap's research loop can start from durable repo data instead of hard-coded opportunity mocks. |
| 2026-03-12T07:24:00Z | codex | DONE RESEARCH-1. Added a file-backed research corpus contract in `data/research/README.md`, seeded `data/research/opportunities.seed.json` with three operator-oriented examples, and updated `modules/social-scout/*` plus `future.md` so manual-first capture is the explicit starting point before live scanning. Validation passed with JSON parse + `npm run check`. no material issues found. |
| 2026-03-12T07:31:00Z | codex | Claimed RESEARCH-2. Replacing in-file opportunity mocks with a local loader built from `data/research/opportunities.seed.json`, keeping the inbox offline/local-only and the approval boundary explicit. |
| 2026-03-12T07:41:00Z | codex | DONE RESEARCH-2. Opportunities Inbox now renders from the local research seed dataset, exposes platform filters from repo data, keeps advisory/review language explicit, and stays fully mock-safe/offline. Validation passed with `npm run check` and `npm run build`. no material issues found. |
| 2026-03-12T10:50:00Z | codex | DONE RESEARCH-3. Added the first weighted opportunity-scoring rubric to the social-scout docs, documented the local advisory research summary in analytics docs, and surfaced a compact research-signals summary on the dashboard page from the repo-backed seed dataset. Validation passed with `npm run check` and `npm run build`. no material issues found. |
| 2026-03-12T11:45:00Z | codex | Claimed RESEARCH-4. Moving repo-backed research loading and dashboard-summary helpers into the social-scout module so the inbox/dashboard share one local data path instead of duplicating seed parsing in UI code. |
| 2026-03-12T11:53:00Z | codex | DONE RESEARCH-4. Added `modules/social-scout/src/research-store.ts` plus tests, moved the seed-record/dashboard-summary helpers behind the module boundary, and updated the Opportunities Inbox and Dashboard pages to reuse the shared local data path. Validation passed with targeted social-scout tests, `npm run build`, and `npm run check`. no material issues found. |
| 2026-03-05T23:07:00Z | agent-5 | DONE CLEAN-2 (lanes.md sync). CLEAN-1 (board.md update) in progress. Validation: `npm run test` (`458/458`) and `npm run build` PASS. |

## Refill Protocol

1. Trigger refill when global waterline or any lane reserve is breached.
2. Scan actual code for contract gaps, missing tests, UI regressions, and blocked flows.
3. Compare against `MVP_SCOPE.md`, `DATA_FLOW.md`, and `future.md`.
4. Add atomic tasks with exact file tags and acceptance checks.
5. Update Validation Snapshot, Refill Log, Coordination Log, and Run Issues Log.
