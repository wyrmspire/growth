# lanes.md - Sprint Mirror (Revision 6 — Sprint 3)

Updated: 2026-03-14
Source of truth: `board.md`

This file mirrors the current board state. It does not reopen finished work.

## Sprint 1 Status: CLOSED

All 5 lanes complete (17 tasks). See board.md coordination log for details.

## Sprint 2 Status: CLOSED

All 5 lanes complete (18 tasks). Style system, preview feed, background jobs, social scout foundation, backlog cleanup.

## Sprint 3 — Visual Identity & UX Overhaul

Started: 2026-03-14
Goal: Phase 1 (Visual Identity & Design System) + Phase 2 (UX Flow & Navigation) from the 10-phase roadmap. Plus side-work prepping future phases.

### Lane 1 — Visual Identity & Design System (Phase 1)
Owner: unassigned
Note: `src/icons.ts` already exists (19 SVG icons). CSS rewrite WIP in `src/index.css` (+324/-83 uncommitted).

| ID | Status | Task |
|---|---|---|
| VIS-1 | READY | HSL color token system — replace hex/rgb with HSL tokens, add `--accent-secondary` |
| VIS-2 | READY | Typography upgrade — Outfit headings, Inter body, variable weights |
| VIS-3 | READY | Glassmorphism surfaces — glass panels on cards, sidebar, modals (depends: VIS-1) |
| VIS-4 | READY | SVG icon wiring — connect `icons.ts` → `main.ts`, remove all emoji nav |
| VIS-5 | READY | Micro-animations — page transitions, button ripple, skeleton states, shimmer (depends: VIS-1) |
| VIS-6 | READY | Dark-mode polish — noise texture, tinted glass, glow nav dot (depends: VIS-1, VIS-3) |
| VIS-7 | READY | Scrollbar & scroll polish — custom colors, smooth scroll (depends: VIS-1) |

### Lane 2 — UX Flow & Navigation (Phase 2)
Owner: unassigned
Note: `src/components/toast.ts` already exists (complete toast system). Nav structure changes in `src/main.ts` WIP.

| ID | Status | Task |
|---|---|---|
| NAV-1 | READY | Collapsible sidebar sections — Journey / Tools / Research groups (depends: VIS-4) |
| NAV-2 | READY | Wire toast system into page actions — replace alert() calls (depends: VIS-1) |
| NAV-3 | READY | Mobile nav drawer animation — slide + backdrop blur (depends: VIS-3) |
| NAV-4 | READY | Global polish pass — spacing, hovers, focus rings, border-radius (depends: VIS-1, VIS-3) |
| NAV-5 | READY | Progress breadcrumb bar — campaign journey steps with click-to-jump (depends: NAV-1) |

### Lane 3 — Future Lay-Down (Side Work)
Owner: unassigned
Protocol: Add types, CSS, stubs only. Do NOT wire into existing pages.

| ID | Status | Task | Target Phase |
|---|---|---|---|
| FW-1 | READY | Add `Project`, `Task`, `TaskStatus` types to core | P3 |
| FW-2 | READY | Add project/task domain events | P3 (depends: FW-1) |
| FW-3 | READY | Add project/task mock-engine state & CRUD API | P3 (depends: FW-1, FW-2) |
| FW-4 | READY | Add P&P CSS classes (project-grid, kanban) | P3 (depends: VIS-1) |
| FW-5 | READY | Add `ReviewAssignment`, `ReviewComment`, `ReviewDecisionAudit` types | P5 |
| FW-6 | READY | Add calendar view toggle CSS (day/week/list) | P6 (depends: VIS-1) |
| FW-7 | READY | Create sparkline component shell | P7 |
| FW-8 | READY | Create animated counter utility | P7 |
| FW-9 | READY | Create error boundary wrapper | P10 |
| FW-10 | READY | Create Supabase client scaffold | P10 |

## Validation Baseline

- `npm run test` → 458/458 PASS (40 test files)
- `npm run build` → PASS (103.47 kB gzipped JS)
- Uncommitted WIP: `src/icons.ts`, `src/components/toast.ts`, `src/index.css`, `src/main.ts`
