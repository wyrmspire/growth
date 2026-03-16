# Test Coverage Documentation

> Generated: 2026-03-14

## Running Tests

```bash
# Run all unit tests
npm run test

# Run a specific test file
npm run test -- src/__tests__/mock-engine-pp.test.ts

# Run with verbose output
npm run test -- --reporter=verbose

# Run a pattern-matched subset
npm run test -- --reporter=verbose --testNamePattern="createProject"

# Full end-to-end smoke script
npm run check
# or just the smoke portion:
npx tsx scripts/smoke-mock.ts
```

---

## Test File Inventory

| File | Purpose | Tests | Key Coverage |
|---|---|---|---|
| `src/__tests__/mock-engine-pp.test.ts` | P&P CRUD | 19 | `createProject`, `createTask`, `getTasksByProject`, `getTasksByStatus`, `updateTaskStatus`, `resetAll` lifecycle |
| `src/__tests__/mock-engine-flow.test.ts` | Campaign lifecycle | 26 | Full flow: interview→offer→campaign→review→schedule→publish, `getDashboard`, `getDashboardTrends`, edge cases (double approve, rejectAll, resetAll) |
| `src/__tests__/mock-engine-comments.test.ts` | Comments pipeline | 13 | `pullComments`, `getCommentReplies`, `sendReplies`, `isReplySent`, approval gate (replies must be pending) |
| `src/__tests__/page-render.test.ts` | Page render smoke | 15 | All 10 pages render without throwing; dashboard with and without campaign data |
| `src/components/__tests__/tooltip.test.ts` | Tooltip | 19 | `supportsHoverTooltips`, `tip()`, `hideTooltip`/`cancelAndHide` timer contract, stale-tip prevention |
| `src/components/__tests__/toast.test.ts` | Toast | 6 | `toastSuccess/Error/Warning/Info` don't throw; DOM stub; multiple stacking |
| `src/components/__tests__/icons.test.ts` | SVG icons | 74 | All 12 `NavIconId` values; all 29 named icon functions return valid SVG; `viewBox` and `stroke` attributes |
| `src/components/__tests__/error-boundary.test.ts` | safePage wrapper | 15 | Clean renders pass through; catches Error/string/object/undefined; XSS escaping; "Try Again" button; nested safePage |
| `src/components/__tests__/sparkline.test.ts` | Sparkline + counter | 25 | `renderSparkline`: empty/single/flat/negative/50+ points/all options; `animateCounter`: RAF contract, disconnected DOM, prefix/suffix/final value |
| `modules/core/src/__tests__/approval-gate.test.ts` | Approval gate | 11 | Core approval type-guard logic |
| `modules/core/src/__tests__/events.test.ts` | Domain events | 40 | Event factory, type safety, all DomainEventName values |
| `modules/core/src/__tests__/validation.test.ts` | Core validation | 13 | EntityId branding, schema guards |
| `modules/copylab/src/__tests__/` (4 files) | Copy generation | 17 | generateCopy, scoreVariant, formatCopy, policy checks |
| `modules/strategy/src/__tests__/` (4 files) | Strategy module | 81 | Source collectors, interview validation, hypothesis generation, opportunity scoring |
| `modules/funnel/src/__tests__/serialize.test.ts` | Funnel | 16 | Funnel plan serialization round-trips |
| `modules/adapters/src/__tests__/` (3 files) | Adapters | 31 | Channel registry, ingest pipeline, reply lifecycle |
| `modules/publishing/src/__tests__/` (2 files) | Publishing | 5 | Dispatch logic, approval-check guard |
| `modules/comments/src/__tests__/send.test.ts` | Comments module | 6 | Send-reply contract |
| `modules/approvals/src/__tests__/` (2 files) | Approvals | 21 | Gate logic, decision recording |
| `modules/analytics/src/__tests__/` (2 files) | Analytics | 30 | Dashboard data computation, attribution |
| `modules/social-scout/src/__tests__/` (2 files) | Social Scout | 10 | Research store, scorer |
| `scripts/integration/launch-flow.test.ts` | Integration | 6 | End-to-end launch flow |

**Total: 652 tests across 49 test files** — all passing as of Sprint 3.

---

## Coverage Gaps

### High Priority

| Area | Gap | Suggested File |
|---|---|---|
| **`bindXxxEvents()` functions** | All bind functions are DOM-dependent and untested | Playwright E2E |
| **`src/main.ts`** | Navigate, routing, sidebar collapse, service worker registration | `src/__tests__/main.test.ts` |
| **`src/glossary.ts`** | `getGlossaryEntry`, `getAllGlossaryEntries`, term coverage | `src/__tests__/glossary.test.ts` |
| **localStorage/sessionStorage** | BrandContext persistence, style profile state | `src/__tests__/persistence.test.ts` |
| **`src/supabase-client.ts`** | `isSupabaseConfigured()` with/without env vars | `src/__tests__/supabase-client.test.ts` |

### Medium Priority

| Area | Gap |
|---|---|
| Calendar `bindCalendarEvents` | View toggle persistence, conflict clicks, publish dispatches |
| Review `bindReviewEvents` | Bulk select, batch approve/reject, note persistence, animations |
| Projects `bindProjectsEvents` | Form submit, task cards, style profile dropdown |
| Style Studio / Opportunities / Integrations shells | Shell-only pages, no functional content yet |

---

## Playwright E2E Test Plan (Sprint 4)

### Scenario 1 — Discovery to Campaign
1. Open app → Discovery page visible
2. Fill interview form → submit → hypotheses appear
3. Approve an offer → navigate to Launcher
4. Fill campaign form → submit → variants table appears

### Scenario 2 — Review Queue
1. Complete Scenario 1
2. Navigate to Review → review items with platform previews
3. Approve all items → badges turn green
4. Test "Bulk Select All" + "Batch Approve"

### Scenario 3 — Calendar & Publish
1. Complete Scenario 2
2. Navigate to Calendar → scheduled entries in week view
3. Switch to List view → same entries listed
4. Click "Publish Now" → toast "All published"

### Scenario 4 — Projects & Planning
1. Navigate to Projects
2. Create project → project card appears
3. Create task → task in Backlog column
4. Move task → advances to In Progress
5. Generate Plan → additional projects/tasks appear

### Scenario 5 — Dashboard Metrics
1. Complete Scenarios 1–3
2. Navigate to Dashboard → metric tiles animate from 0
3. Sparklines visible next to CPL/ROAS/Spend tiles
4. SVG funnel renders with trapezoids
5. Click "Copy Summary" → toast "Copied to clipboard"

---

## Test Infrastructure

- **Runner**: Vitest v4.x, `environment: node`
- **DOM testing**: `vi.stubGlobal` stubs for DOM-dependent components
- **Module aliases**: `@core`, `@funnel`, `@strategy`, etc. via `vitest.config.ts`
- **Smoke script**: `scripts/smoke-mock.ts` — exercises P&P, Calendar, Comments, Dashboard end-to-end
- **Reset pattern**: All mock-engine tests call `resetAll()` in `beforeEach`
