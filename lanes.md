# lanes.md - Sprint Mirror (Revision 3)

Updated: 2026-03-05
Source of truth: `board.md`

This file mirrors the current board state. It does not reopen finished work.

## Sprint Status

- The recovery sprint's 5 lanes are complete.
- New execution should start from READY backlog items only.
- `board.md` remains the only assignment source of truth.

## Lane Summary

### Lane 1 - Docs and Contract Reconciliation
Status: CLOSED
Completed cards: `DOC-1`, `DOC-2`, `DOC-3`, `DOC-4`, `DOC-5`
Outcome:
- Runtime docs, contracts, and issue-logging rules now match the shipped system.
- `lanes.md` has been regenerated from the board.

### Lane 2 - UX Hardening and Mobile Reliability
Status: CLOSED
Completed cards: `UX-1`, `UX-2`, `UX-3`, `UX-4`
Outcome:
- Tooltip linger is fixed.
- Mobile clipping and `100vh` assumptions were hardened.
- Shared responsive classes and a UI QA checklist are in place.

### Lane 3 - Beginner Guidance and Strategy Workspace
Status: CLOSED
Completed cards: `GUIDE-1`, `GUIDE-2`, `GUIDE-3`, `GUIDE-4`
Outcome:
- Strategy workspace shell is live.
- Every page includes beginner coaching.
- Starter presets let new users practice without going to the web.
- UI language stays focused on running campaigns for your business or a client.

### Lane 4 - Flow Wiring and Operational Guardrails
Status: CLOSED
Completed cards: `OPS-1`, `OPS-2`, `OPS-3`, `OPS-4`
Outcome:
- Local guard scripts are runnable from `npm run`.
- `server.ts` and Vite proxy support local advisory flow development.
- Discovery, launcher, and comments now use Genkit flow endpoints with offline fallback.
- Advisory state is visible in the UI and reply drafts enter the approval gate before send.

### Lane 5 - Future Foundations
Status: CLOSED
Completed cards: `FUT-1`, `FUT-2`, `FUT-3`, `FUT-4`
Outcome:
- Style Studio, Integrations, and Opportunities shells are staged.
- Slack/Office 365, social scout, and copy-memory foundations are documented for future implementation.

## Ready Intake

These are the next READY items on the board. Do not re-open completed lane work.

1. `BACK-3` - Add page analytics and event instrumentation for the learning UI.
2. `BACK-4` - Wire row-level comment actions so no reply controls are inert.

## Blocked Intake

1. `BACK-1` - real outbound-channel adapter pilot (blocked by outbound-channel decision)
2. `BACK-2` - approval notifications via Slack or Office test mode (blocked by `FUT-2` follow-through)

## Validation Baseline

The current repo baseline is:
- `npm run check` -> PASS
- `npm run test` -> PASS (`438/438`)
- `npm run build` -> PASS

Any new sprint should start from that baseline and add only net-new tasks.
