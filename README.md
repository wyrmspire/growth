# GrowthOps OS

**A local-first campaign operations system** for small-business owners and marketing operators. Plan, create, review, schedule, and measure social media campaigns — entirely in the browser with zero external dependencies in mock mode.

---

## What It Is

GrowthOps OS walks an operator through the full campaign lifecycle in a single-page app:

| Step | Page | What Happens |
|------|------|--------------|
| 1 | Business Discovery | Interview captures business name, offer, target audience, and pain points |
| 2 | Strategy Workspace | Reviews offer hypotheses and confirms campaign foundation |
| 3 | Campaign Launcher | Generates ad copy variants for multiple channels (Meta, LinkedIn, X, Email) |
| 4 | Review Queue | Approve or reject copy variants with inline notes and audit trail |
| 5 | Publishing Calendar | Schedule approved content with day/week/list views and conflict detection |
| 6 | Comment Operations | Triage incoming comments, draft AI-assisted replies, send approvals |
| 7 | Campaign Dashboard | Animated metrics, sparkline trends, funnel visualization, journey ring |
| — | Projects & Planning | Kanban task board for pre-launch setup work |
| — | Research Signals | Opportunity scoring from Social Scout research records |

All data flows through `src/mock-engine.ts` in development. Supabase can be wired when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set (see `src/supabase-client.ts`).

---

## Quick Start

```bash
# Install dependencies (one time)
npm install

# Start dev server with hot-reload
npm run dev
# → http://localhost:5173

# Type-check only (no emit)
npx tsc --noEmit

# Production build
npm run build

# Preview production build locally
npm run preview
```

---

## Project Layout

```
growth/
├── src/
│   ├── main.ts               # App shell, router, sidebar, breadcrumb
│   ├── mock-engine.ts        # All state, CRUD, analytics, event log
│   ├── index.css             # Design system: HSL tokens, typography, components
│   ├── icons.ts              # Inline SVG icon library (Lucide-style)
│   ├── scheduler.ts          # Local scheduling utilities
│   ├── supabase-client.ts    # Supabase scaffold (install @supabase/supabase-js in P10)
│   ├── components/
│   │   ├── counter.ts        # Animated count-up (easeOutQuart, rAF)
│   │   ├── error-boundary.ts # safePage() — catch render errors, show fallback card
│   │   ├── help-drawer.ts    # Slide-in glossary/help panel
│   │   ├── sparkline.ts      # Inline SVG trend-line renderer
│   │   ├── toast.ts          # Global toast notifications (success/error/info)
│   │   └── tooltip.ts        # Inline inline glossary tooltips
│   └── pages/
│       ├── dashboard.ts      # Campaign metrics, sparklines, funnel, journey ring
│       ├── discovery.ts      # Business discovery interview
│       ├── strategy-workspace.ts
│       ├── launcher.ts       # Campaign & copy generation
│       ├── review.ts         # Copy approval queue
│       ├── calendar.ts       # Publishing calendar (day/week/list)
│       ├── comments.ts       # Comment triage & reply workflow
│       ├── projects.ts       # Kanban project/task board
│       ├── style-studio.ts   # Brand style profile selector
│       ├── preview-feed.ts   # Channel preview mock
│       ├── integrations.ts   # Integration shell (future)
│       └── opportunities.ts  # Research opportunity shell (future)
├── modules/
│   ├── core/src/             # Domain types, events, IDs, validation, approval gate
│   ├── analytics/src/        # Attribution, funnel, variant scoring, learning engagement
│   ├── social-scout/src/     # Research records, opportunity scoring pipeline
│   └── publishing/src/       # Scheduling calendar, dispatch engine
├── public/
│   └── sw.js                 # Service worker (offline app-shell caching)
├── scripts/
│   └── smoke-mock.ts         # CLI smoke-test for core mock-engine flows
├── board.md                  # Sprint board (Kanban lanes for agent work)
├── AGENTS.md                 # Agent roster and concurrency rules
├── future.md                 # Long-range roadmap (10-phase plan)
├── MVP_SCOPE.md              # Current scope boundary
├── PRODUCT_DESIGN.md         # Product and design notes
└── SYSTEM_ARCHITECTURE.md    # Technical architecture notes
```

---

## Architecture Decisions

### Mock-First Development

All product data flows through `src/mock-engine.ts`. The engine:
- Maintains in-memory state for the entire campaign lifecycle
- Fires domain events via `EventLog` for every state change
- Exposes typed CRUD functions that UI pages call directly
- Can be replaced with real API calls without touching page code

### Domain Modules

Each domain lives in `modules/<name>/src/` with a clean public API:
- **core**: Shared types (`EntityId`, `DomainEventName`, `Project`, `Task`, `ReviewDecisionAudit`, etc.), ID generation, event log, validation, approval state machine
- **analytics**: Attribution model, funnel aggregation, variant scoring, learning engagement tracker
- **social-scout**: Research record scoring pipeline, opportunity inbox
- **publishing**: Calendar scheduling, dispatch engine

Modules import only from `../core`. Pages import only from `../mock-engine`. There are no circular dependencies.

### Component Pattern

UI components are functions that return HTML strings. Pages inject them via template literals. Event binding is done after `innerHTML` is set. This keeps the entire app server-renderable if needed and avoids framework overhead.

### Error Boundaries

`src/components/error-boundary.ts` exports `safePage(renderFn)`. Every page render in `main.ts` is wrapped in `safePage()`, so a thrown render error shows a styled fallback card instead of a blank screen.

### Service Worker

`public/sw.js` registers on app load. It uses:
- **Stale-while-revalidate** for hashed JS/CSS/font assets
- **Network-first with offline fallback** for navigation requests

This gives instant loads on repeat visits and basic offline functionality (the UI loads; mock data is in-memory so no data requests fail).

---

## Environment Variables

```bash
# .env.local (never commit this file)
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

If these are not set, `src/supabase-client.ts` returns `null` and the app runs in mock-engine mode. See `src/supabase-client.ts` for the wiring pattern when `@supabase/supabase-js` is installed in Phase 10.

---

## Running Tests

```bash
# Run all unit tests
npm test

# Run smoke test (CLI, validates mock-engine flows end-to-end)
npx tsx scripts/smoke-mock.ts
```

Test files live in:
- `src/__tests__/` — page render smoke tests, mock-engine unit tests
- `src/components/__tests__/` — component unit tests (sparkline, counter, tooltip)
- `modules/*/src/__tests__/` — module unit tests

---

## Development Conventions

- **No framework.** Vanilla TypeScript + CSS. Vite for bundling.
- **No `any`.** All types are in `modules/core/src/types.ts`.
- **Module isolation.** Pages never import from modules directly — only from `mock-engine.ts`.
- **Design tokens first.** All colours, spacing, radius, and shadows are CSS custom properties in `src/index.css`.
- **Error boundaries.** New pages must be wrapped in `safePage()` in `main.ts`.
- **Toast over alert.** Use `toastSuccess/toastError/toastInfo` from `components/toast.ts` instead of `window.alert()` or `window.confirm()`.
- **SVG icons.** Import from `src/icons.ts`. Do not use emoji in headings or action buttons.

---

## Phase Roadmap (10-Phase)

| Phase | Focus | Status |
|-------|-------|--------|
| P1 | Visual Identity & Design System | ✅ Done (Sprint 2–3) |
| P2 | UX Flow & Navigation | ✅ Done (Sprint 3) |
| P3 | Advanced Copywriting Tools | 🔄 Sprint 3 |
| P4 | Social Listening & Research | ✅ Done (Sprint 2) |
| P5 | Campaign Analytics & Attribution | ✅ Done (Sprint 2) |
| P6 | Publishing & Calendar | ✅ Done (Sprint 3) |
| P7 | Dashboard Premium | ✅ Done (Sprint 3) |
| P8 | Collaboration & Team | 🔮 Future |
| P9 | AI Copilot Integration | 🔮 Future |
| P10 | Production Hardening & Launch | 🛠 Foundation started (Sprint 3) |

See `future.md` for detailed phase descriptions and `board.md` for the active sprint board.

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `board.md` | Active sprint — task status, lane assignments, done/in-progress/blocked |
| `AGENTS.md` | Agent roster, concurrency rules, coordination protocol |
| `future.md` | Long-range feature wishlist, 10-phase roadmap detail |
| `MVP_SCOPE.md` | Hard scope boundary — what the MVP does and doesn't do |
| `PROJECT_RULES.md` | Local project conventions and constraints |
| `PRODUCT_DESIGN.md` | UX decisions, design rationale, component philosophy |
| `SYSTEM_ARCHITECTURE.md` | Module boundaries, data flow diagrams, anti-patterns |
| `modules/core/ANTI_PATTERNS.md` | What NOT to do — common mistakes and why they're wrong |
| `modules/core/CONTRACT.md` | Module public API contract |

---

*GrowthOps OS is a local-first tool built for growth operators. It is not a SaaS product, not a white-label platform, and not a generic CMS.*
