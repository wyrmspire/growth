# lanes.md — Next Sprint Plan (Revision 2)

Sprint start: 2026-03-05
Source of truth used: `board.md`, `future.md`, `AGENTS.md`

---

## Sprint Readiness Check (work from previous lanes)

This update confirms prior lane outcomes before proposing new work:

- ✅ Lane A (copylab) was completed (`COPY-A1/A2`, `COPY-B1/B2`).
- ✅ Lane E (funnel/strategy infra) was completed (`FUN-B1/B2`, `STR-B1`, `BACK-1/2/3`).
- ✅ Mobile tooltip hotfix applied in learning UI (`src/components/tooltip.ts`, test added).
- 🔁 Remaining open work is now focused on still-open board items and future-plan prep.

---

## Mandatory Rules for Every Lane (from AGENTS + this sprint)

1. Read `board.md` and `AGENTS.md` before coding.
2. Only claim tasks that are `[READY]`.
3. Add claim + done notes in `board.md` coordination log.
4. **Do not edit files owned by another active lane.**
5. **Do not overwrite `lanes.md` with lane results.**
   - Each lane must write a separate result file named:
   - `lanes (doc).results.md`, `lanes (A).results.md`, `lanes (B).results.md`, etc.
6. If a lane discovers cross-module changes, request integrator approval and log it in `board.md`.

---

## Lane Execution Order

A documentation-only lane is intentionally first to reduce merge risk and align remaining work.

### Lane doc — Documentation and board alignment (execute first)
**Type:** Documentation only

**Scope files (exclusive):**
- `board.md`
- `future.md`
- `MVP_SCOPE.md`
- `SYSTEM_ARCHITECTURE.md`
- `DATA_FLOW.md`
- `PROJECT_RULES.md`

**Must not edit:**
- `src/**`
- `modules/**/src/**`

**Tasks:**
- Reconcile board statuses for already-complete tasks backed by passing tests.
- Add explicit next-phase cards from `future.md` for:
  - style instruction pack
  - integration hooks (Slack/Office)
  - social scout
- Ensure each new card has exact files + acceptance checks.

**Result file:** `lanes (doc).results.md`

---

### Lane A — Mock engine contract reconciliation
**Board focus:** `MCK-A2`

**Scope files (exclusive):**
- `src/mock-engine.ts`
- `modules/*/CONTRACT.md` (only mismatch notes required by task)

**Must not edit:**
- `scripts/**`
- `modules/strategy/src/**`
- `modules/comments/src/**`

**Tasks:**
- Reconcile `src/mock-engine.ts` function signatures against module contracts.
- Record temporary mismatches directly in impacted `CONTRACT.md` sections.

**Result file:** `lanes (A).results.md`

---

### Lane B — Mock flow smoke script
**Board focus:** `MCK-A3`

**Scope files (exclusive):**
- `scripts/smoke-mock.ts`

**Must not edit:**
- `src/**`
- `modules/**`

**Tasks:**
- Add smoke script for full mock flow:
  discovery -> launch -> review -> calendar -> comments -> dashboard.

**Result file:** `lanes (B).results.md`

---

### Lane C — Strategy Playwright fallback
**Board focus:** `STR-B2`

**Scope files (exclusive):**
- `modules/strategy/src/collector-playwright.ts`
- `modules/strategy/src/__tests__/collector.test.ts`
- `modules/strategy/CONTRACT.md` (only if contract behavior changes)

**Must not edit:**
- `src/**`
- `modules/comments/**`
- `scripts/**`

**Tasks:**
- Implement API-first then Playwright fallback for allowlisted public pages.
- Enforce source allowlist + rate policy.

**Result file:** `lanes (C).results.md`

---

### Lane D — Comments send flow
**Board focus:** `COM-B1`

**Scope files (exclusive):**
- `modules/comments/src/send.ts`
- `modules/comments/src/__tests__/send.test.ts`
- `modules/comments/CONTRACT.md` (only if behavior changes)

**Must not edit:**
- `modules/strategy/**`
- `src/**`
- `scripts/**`

**Tasks:**
- Implement `sendApprovedReply()` with approval gate + adapter dispatch.

**Result file:** `lanes (D).results.md`

---

### Lane E — Strategy workspace shell (UI)
**Board focus:** `BACK-5`

**Scope files (exclusive):**
- `src/pages/strategy-workspace.ts`
- `src/main.ts`
- `src/index.css`

**Must not edit:**
- `src/mock-engine.ts`
- `modules/**`
- `scripts/**`

**Tasks:**
- Add strategy workspace page shell for business capture + offer review.
- Keep it mock-safe and aligned with learning UX language.

**Result file:** `lanes (E).results.md`

---

## Validation Commands

```bash
npm install
npm run test
npm run build
```

For lane-specific checks, run only affected tests first, then full suite before marking DONE.
