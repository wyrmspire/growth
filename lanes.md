# lanes.md - Sprint Mirror (Revision 5 — Sprint 2 Progress)

Updated: 2026-03-05
Source of truth: `board.md`

This file mirrors the current board state. It does not reopen finished work.

## Sprint 1 Status: CLOSED

All 5 lanes complete (17 tasks). See board.md coordination log for details.

## Sprint 2 — Automation Foundations

Started: 2026-03-05
Goal: Build the automation backbone — style compiler, preview feed, background job API, and social scout pipeline.

### Lane 1 — Style System (FC-1) ✅ COMPLETE
Owner: agent-5

| ID | Status | Task |
|---|---|---|
| STYLE-1 | ✅ DONE | Core types added (`StyleProfile`, `ChannelStyleOverride`, `CampaignInstructionPack`, `GeneratedCopyAudit`) |
| STYLE-2 | ✅ DONE | Instruction pack compiler (7 tests, `modules/copylab/src/instructions.ts`) |
| STYLE-3 | ✅ DONE | Style validator (7 tests, `modules/copylab/src/validate-style.ts`) |
| STYLE-4 | ✅ DONE | Interactive Style Studio UI (live controls, tag editors, channel tabs, preview) |

### Lane 2 — Preview Feed (Sandbox Publishing)
Status: IN PROGRESS (2/4 done)
Owner: agent-5

| ID | Status | Task |
|---|---|---|
| PREV-1 | ✅ DONE | Preview feed page with platform-realistic cards |
| PREV-2 | OPEN | Preview adapter in adapter registry |
| PREV-3 | OPEN | Wire publish pipeline → preview feed |
| PREV-4 | ✅ DONE | Added to navigation, help keys, renderers, CSS |

### Lane 3 — Background Job API
Status: IN PROGRESS (3/4 done)
Owner: agent-5

| ID | Status | Task |
|---|---|---|
| JOB-1 | ✅ DONE | `/api/jobs/*` router in `server.ts` |
| JOB-2 | ✅ DONE | Scheduler in `src/scheduler.ts` + `npm run scheduler` |
| JOB-3 | ✅ DONE | Scout-scan job wired with mock data |
| JOB-4 | OPEN | Job dashboard card (deferred to next batch) |

### Lane 4 — Backlog Cleanup
Status: IN PROGRESS (1/4 done)
Owner: unassigned

| ID | Status | Task |
|---|---|---|
| BACK-3 | OPEN | Page analytics and event instrumentation |
| BACK-4 | OPEN | Wire comment row actions |
| CLEAN-1 | OPEN | Update `board.md` with Sprint 2 |
| CLEAN-2 | ✅ DONE | Updated `lanes.md` to mirror Sprint 2 |

### Lane 5 — Social Scout Foundation (FC-6)
Status: IN PROGRESS (3/4 done)
Owner: agent-5

| ID | Status | Task |
|---|---|---|
| SCOUT-1 | ✅ DONE | Types and validation (`modules/social-scout/src/types.ts`) |
| SCOUT-2 | ✅ DONE | Scoring engine (6 tests, `modules/social-scout/src/scorer.ts`) |
| SCOUT-3 | OPEN | Opportunities Inbox UI with scored cards |
| SCOUT-4 | ✅ DONE | Mock scanner pipeline (`modules/social-scout/src/scanner.ts`) |

## Validation Baseline

- `npm run test` → 458/458 PASS (40 test files)
- `npm run build` → PASS (103.47 kB gzipped JS)
