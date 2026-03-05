# lanes (A).results.md — Mock Engine Contract Reconciliation

Sprint: 2026-03-05
Lane: A
Board task: MCK-A2

## Completed Work

### src/mock-engine.ts Signature Reconciliation

Reconciled function signatures in `src/mock-engine.ts` against module CONTRACT.md documents. The mock-engine acts as a translation layer between the UI and module code, intentionally using mock-specific signatures for workflow demonstration purposes.

### Temporary Mismatch Notes Added

The following module contracts now include explicit MCK-A2 mismatch notes documenting the signature differences between mock-layer calls and formal contract shapes:

| Module | Mismatch Summary |
|--------|------------------|
| `modules/strategy/CONTRACT.md` | `buildOfferProfile(hypothesis, signals)` — mock-only helper not in formal contract |
| `modules/copylab/CONTRACT.md` | `generateVariants(brief, plan)` two-argument form vs contract's `CopyRequest` object |
| `modules/publishing/CONTRACT.md` | `scheduleAsset()` includes `assetLabel` for UI calendar readability |
| `modules/analytics/CONTRACT.md` | `projectAttribution(events, campaignId)` forces deterministic single-campaign snapshots |
| `modules/comments/CONTRACT.md` | `draftReply()` may return `null` for spam; mock layer filters nulls |
| `modules/approvals/CONTRACT.md` | `decideReview(decision)` object shape vs legacy `(itemId, decision)` |

## Validation

```
npm run test
# 416 tests passing

npx tsx scripts/drift-check.ts
# All CONTRACT.md functions have matching module src exports
```

## Contract Compliance

- Mock-engine imports only from `modules/*/src/mock.ts` — no direct domain imports
- All signature differences documented in relevant CONTRACT.md sections
- Behavior unchanged for UI flows; documentation only

## Files Changed

| File | Change |
|------|--------|
| modules/strategy/CONTRACT.md | Added MCK-A2 mismatch note |
| modules/copylab/CONTRACT.md | Added MCK-A2 mismatch note |
| modules/publishing/CONTRACT.md | Added MCK-A2 mismatch note |
| modules/analytics/CONTRACT.md | Added MCK-A2 mismatch note |
| modules/comments/CONTRACT.md | Added MCK-A2 mismatch note |
| modules/approvals/CONTRACT.md | Added MCK-A2 mismatch note |
| board.md | MCK-A2 marked DONE, coordination log updated |

## Next Steps

Lane A scope is complete. MCK-A2 is marked DONE in board.md.
