# SYSTEM_ARCHITECTURE.md — GrowthOps OS

## Layer Diagram

```
         ┌─────────────────────────────────────────────────────────┐
         │                        ui                               │
         │  (src/pages/*.ts, src/main.ts, src/index.css)           │
         └────────────────────────┬────────────────────────────────┘
                                  │ in mock mode
                                  ▼
         ┌─────────────────────────────────────────────────────────┐
         │               mock-engine (src/mock-engine.ts)          │
         │  Translates UI actions into module mock.ts calls        │
         └────────────────────────┬────────────────────────────────┘
                                  │ calls
                                  ▼
         ┌─────────────────────────────────────────────────────────┐
         │             domain modules (modules/*/src/)             │
         │  strategy · copylab · funnel · approvals · publishing   │
         │  comments · analytics · adapters                        │
         └────────────────────────┬────────────────────────────────┘
                                  │ appends
                                  ▼
              event-log ──────► read-models ──────► ui (refresh)
```

Allowed dependencies are unidirectional only (no circular imports).

### Mock Mode vs Production Mode

- **Mock mode (current default):** `ui → mock-engine → modules/*/src/mock.ts`
  The mock-engine is a local translation layer. It calls the `mock.ts`
  implementation inside each module, which returns deterministic in-memory
  results. No external API calls are made. This is the safe offline and
  learning mode.
- **Local advisory mode (current optional upgrade):**
  `ui → mock-engine → /api/flows/* → Genkit flows`
  When `npm run server` is running, the mock-engine can call the local flow
  server for offer, copy, and reply coaching. If the server is unavailable,
  the mock-engine falls back to deterministic local guidance and surfaces a
  page notice in the UI.
- **Production mode (future):** `ui → workflows → domain modules → adapters`
  Workflows orchestrate cross-module business flows using the production
  module exports. Adapters wrap external platforms. Provider-backed sending
  still requires valid credentials and a later workflow layer.

---

## Layer Responsibilities

### ui
Responsibility: Render operator views, learning guidance, and collect intents.
Must never: Call external platforms directly; bypass approvals.
Depends on: mock-engine (mock mode), workflows (production mode), read-models, core types.

### mock-engine (`src/mock-engine.ts`)
Responsibility: Translate product UI actions into module mock functions in local mode.
Must never: Become the source of truth for domain contracts.
Must never: Be imported by domain modules.
Depends on: `modules/*/src/mock.ts` implementations.
Guard scripts: `npm run smoke:mock` runs a round-trip smoke test through mock-engine.

### workflows
Responsibility: Orchestrate cross-module business flows in production mode.
Must never: Own long-term state schema; embed provider-specific code.
Depends on: domain modules, core.

### domain modules
Responsibility: Implement bounded capabilities with explicit contracts.
Must never: Cross-import sibling module internals.
Must never: Return AI advisory output as finalized state without approval.
Depends on: core, event-log.
Contract files: `modules/<name>/CONTRACT.md`

### adapters
Responsibility: Wrap external platform APIs.
Must never: Contain domain business decisions.
Depends on: core, provider SDKs.

### strategy and research
Responsibility: Convert business interviews and market signals into offer hypotheses.
Must never: Auto-commit strategic decisions without operator approval.
Genkit integration: Genkit strategy agents produce advisory outputs only.
Every hypothesis must pass through `approvals.createReviewBatch` +
`approvals.decideReview` before it can influence any downstream action.
Depends on: core, analytics, adapters.

### read-models and analytics
Responsibility: Derive reporting views from events.
Must never: Mutate domain state directly.
Depends on: event-log, core.

---

## Domain Modules

| Module | Key Exports | Contract |
|---|---|---|
| core | shared types, IDs, validation, errors | `modules/core/CONTRACT.md` |
| strategy | captureInterview, generateOfferHypotheses, rankHypotheses | `modules/strategy/CONTRACT.md` |
| copylab | generateVariants, scoreVariants | `modules/copylab/CONTRACT.md` |
| funnel | createFunnelPlan, getBrief | `modules/funnel/CONTRACT.md` |
| approvals | createReviewBatch, decideReview, isApproved, reopenItem | `modules/approvals/CONTRACT.md` |
| publishing | scheduleAsset, dispatchDue | `modules/publishing/CONTRACT.md` |
| comments | triageComment, draftReply, sendApprovedReply | `modules/comments/CONTRACT.md` |
| analytics | projectAttribution, projectFunnelConversion, projectVariantPerformance, campaignDashboardReadModel | `modules/analytics/CONTRACT.md` |
| adapters | enqueuePublish, ingestComments, sendReply | `modules/adapters/CONTRACT.md` |
| mock-engine | local translation layer for offline learning/testing mode | `src/mock-engine.ts` |
| integrations | connection lifecycle, scope policy for Slack/Office 365 (staged FUT-2) | `modules/integrations/CONTRACT.md` |
| social-scout | slow-batch opportunity discovery, scoring, suggestion workflow (staged FUT-3) | `modules/social-scout/CONTRACT.md` |

---

## Request Lifecycle — Mock Mode (ASCII)

```
User action (UI)
  -> mock-engine translates action
  -> modules/*/src/mock.ts (in-memory, deterministic)
  -> event appended (in-memory log)
  -> read-model refreshed
  -> UI re-renders
```

## Request Lifecycle — Production Mode (ASCII)

```
User action (UI)
  -> Workflow command
  -> Domain module validation
  -> Event emitted
  -> Optional adapter action (only if isApproved() === true)
  -> Read model update
  -> UI refresh
```

---

## Guard Scripts

The following scripts enforce operational and contract correctness. They must
be runnable from a clean local checkout via `npm run`:

| Script | Command | Purpose |
|---|---|---|
| Drift check | `npm run check:drift` | Detect contracts diverged from code |
| Boundary lint | `npm run check:boundaries` | Detect disallowed cross-module imports |
| Mock smoke test | `npm run smoke:mock` | Round-trip exercise of mock-engine layer |

Status: Wired into `package.json` through `tsx` and runnable from a clean local
checkout. `npm run check` executes all three guard scripts in sequence.

## Local Flow Server

- `npm run server` starts `server.ts` and exposes `/api/health` plus advisory
  flow endpoints under `/api/flows/*`.
- `npm run dev:full` starts both the Vite UI and the local flow server.
- Vite proxies `/api/*` requests to `http://localhost:3400` during development.
- When `GEMINI_API_KEY` is unset, the flow server remains in `mock-safe` mode
  and returns deterministic local coaching output.

---

## Anti-Spaghetti Rules

1. No circular dependencies.
2. No catch-all utils/shared module for domain logic.
3. No module mutates another module's state.
4. Cross-module data passes through core contracts only.
5. Providers are isolated behind adapters.
6. No domain module imports `mock-engine` or another module's `src/mock.ts`.
7. No UI code calls adapter or provider SDKs directly.

---

## Complexity Risks

- Adapter behavior differences by channel can leak into domain logic.
- Approval bypass paths may appear under time pressure.
- Copy generation quality drift if prompts and policies are not versioned.
- Dashboard trust drops if event semantics are inconsistent.
- Market scraping can violate site policy unless constrained to permitted sources.

## Secrets Boundary (integrations)

- OAuth tokens for Slack and Office 365 are encrypted at rest at the infrastructure level.
- The `integrations` module stores connection status and scope metadata only — never tokens.
- Token values never cross into UI page state or browser storage.
- `adapters` is the only layer that makes API calls using credentials. It supports 8+ platforms via a unified credential store seeded from `server.ts` or `src/setup-store.ts`.
- Mock-engine drift: if `mock.ts` implementations diverge from `src/index.ts`, the
  UI will behave differently in mock mode vs production. Guard scripts detect this.

---

## Technology Decisions

- Event-first state transitions for replayability and audit.
- Contract-first module docs before code implementation.
- Mock adapter baseline to unblock UI and workflow implementation.
- APIs are primary market-signal source; Playwright automation is fallback for
  allowed public pages only.
- Genkit (AI framework) is used for advisory strategy and copy agents only.
  All Genkit outputs are routed through `approvals` before any action is taken.
