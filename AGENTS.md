# AGENTS.md — GrowthOps OS

## Repo Map

- **Server**: `server.ts` (Express routes, Genkit flow endpoints, job API, credential seeding)
- **Database**: Not yet — Supabase scaffold in `src/supabase-client.ts` (returns null when env vars missing)
- **UI Pages**: `src/pages/*.ts` — 13 pages (discovery, launcher, review, calendar, comments, dashboard, strategy-workspace, style-studio, integrations, opportunities, preview-feed, projects, setup)
- **UI App Shell**: `src/main.ts` (routing, sidebar, breadcrumb, nav, error boundaries)
- **Components**: `src/components/*.ts` (tooltip, toast, help-drawer, error-boundary, sparkline, counter)
- **Icons**: `src/icons.ts` (30+ SVG icon functions + navIcon router)
- **Mock Engine**: `src/mock-engine.ts` (translates UI actions into module mock.ts calls)
- **Setup Store**: `src/setup-store.ts` (localStorage credential management, 8 platforms)
- **CSS**: `src/index.css` (HSL tokens, glassmorphism, animations, all page/component styles)
- **Domain Modules**: `modules/{core,funnel,strategy,copylab,approvals,publishing,comments,analytics,adapters,integrations,social-scout}/`
- **Adapter Layer**: `modules/adapters/src/` — registry, credentials, platform adapters (meta, linkedin, x, email)
- **Glossary**: `src/glossary.ts`
- **Config**: `.env.local` (GEMINI_API_KEY, PORT, platform credential env vars)
- **Tests**: `src/__tests/*.ts`, `modules/*/src/__tests__/*.ts`, `src/components/__tests__/*.ts`
- **Scripts**: `scripts/` (smoke-mock.ts, check scripts)

## Ownership Zones

| Zone | Files | Lane |
|------|-------|------|
| Publishing pipeline | `modules/publishing/src/*`, `modules/publishing/CONTRACT.md` | Lane 3 |
| Launcher page | `src/pages/launcher.ts` | Lane 3 |
| Review page | `src/pages/review.ts` | Lane 3 |
| Calendar page | `src/pages/calendar.ts` | Lane 3 |
| Dashboard page | `src/pages/dashboard.ts` | Lane 3 |
| Server core | `server.ts` | Lane 4 |
| Adapter credentials | `modules/adapters/src/credentials.ts` | Lane 4 |
| Adapter registry | `modules/adapters/src/registry.ts` | Lane 4 |
| Security scripts | `scripts/audit-secrets.ts` (NEW) | Lane 4 |
| .env.local.example | `.env.local.example` | Lane 4 |
| Root docs | `SYSTEM_ARCHITECTURE.md`, `DATA_FLOW.md`, `MVP_SCOPE.md` | Lane 4 |
| Module contracts | `modules/*/CONTRACT.md` | Whoever modifies the module |

**Shared file rule**: If both lanes need to touch the same file, Lane 3 goes first for UI-layer files, Lane 4 goes first for server-layer files. Add a note to the Coordination Log before editing.

## Patterns

- All server endpoints go under Express routes in `server.ts`
- All pages export `renderXxxPage(): string` + `bindXxxEvents(): void`
- Pages are registered in `src/main.ts`: PageId type, NAV_ITEMS, PAGE_RENDERERS, PAGE_BINDERS, PAGE_HELP_KEYS
- Toast notifications via `import { toastSuccess, toastError, toastInfo } from '../components/toast'`
- Error boundaries: all page renderers wrapped by `safePage()` in main.ts
- Adapters follow the factory pattern: `makeXxxAdapter(): ProviderAdapter` (see `x-adapter.ts` as reference)
- Credentials are stored in-memory on the server via `modules/adapters/src/credentials.ts` — seeded from env vars at startup
- Client-side setup credentials are in localStorage via `src/setup-store.ts` — these are separate from server credentials
- Module contracts live in `modules/<name>/CONTRACT.md` — update them when adding/changing exports
- Mock-safe mode: everything works without real credentials. Adapters fall back to deterministic mock responses
- Style Studio channel overrides already define per-platform character limits (meta: 2200, linkedin: 3000, x: 280, email: 5000)

## Commands

- **Dev server (Vite UI)**: `npm run dev`
- **Flow server**: `npm run server`
- **Both together**: `npm run dev:full`
- **Type check**: `npx tsc --noEmit`
- **Tests**: `npm run test`
- **Guard scripts**: `npm run check` (runs `check:drift`, `check:boundaries`, `smoke:mock`)
- **Build**: `npm run build`

## Pitfalls

- `board.md` is over 250 lines from Sprint 3 — it has been compacted for Sprint 4
- The launcher page already has 4-channel checkboxes (meta, linkedin, x, email) — extend, don't replace
- Adapter registry only has 4 platforms (meta, linkedin, x, email) — the setup-store has 8 (reddit, instagram, tiktok, facebook, linkedin, substack, youtube, twitter)
- `PlatformName` type in core/types.ts is `'meta' | 'linkedin' | 'x' | 'email'` — needs expansion if new adapters register
- Credentials module uses `PlatformName` from core — any new platform must be added there first
- `src/setup-store.ts` uses `PlatformId` which is different from core's `PlatformName` — do NOT conflate them
- Server reads credentials from env vars only at startup (`seedCredentialsFromEnv`) — runtime credential updates require a restart or new endpoint
- Publishing module's `scheduleAsset` has an extra `assetLabel` parameter in mock-engine that doesn't match the contract signature

## SOPs

### SOP-1: Module boundary — adapters own credentials
**Learned from**: SYSTEM_ARCHITECTURE.md §Secrets Boundary (universal rule)

- ❌ Importing `credentials.ts` from UI or domain modules
- ✅ Only files inside `modules/adapters/src/` import `credentials.ts`
- Only `PlatformAvailability` (boolean status, no token data) may cross into UI/server

### SOP-2: Mock-safe fallback is mandatory
**Learned from**: Sprint 1 — design constraint, not a bug

- ❌ Throwing errors when credentials are absent
- ✅ Return deterministic mock responses and `console.info()` the mode
- Every adapter must work without credentials. Never error on missing keys.

### SOP-3: Update CONTRACT.md when changing module exports
**Learned from**: Sprint 2 backlog cleanup — drift between code and docs

- ❌ Adding a new exported function and not touching CONTRACT.md
- ✅ Export change + CONTRACT.md update in the same work item
- `npm run check:drift` will catch missed updates

### SOP-4: No autonomous outbound actions
**Learned from**: Universal rule from PROJECT_RULES.md

- ❌ Auto-publishing, auto-commenting, auto-sending without `approvals.isApproved() === true`
- ✅ Every publish/send action checks approval state first
- The approval gate is visible in UI language: "You approve, then it sends"

### SOP-5: Test text changes
**Learned from**: Sprint 3 — page render tests check for specific HTML markers

- ❌ Changing a page heading/section title and not updating page-render.test.ts
- ✅ `grep -rn "old text" src/__tests__/` before changing visible text
- Update any test assertions that match on the old text

## Lessons Learned (Changelog)

- **2026-03-14**: Sprint 3 found 9 tasks already done from a prior session — audit code before building the board
- **2026-03-14**: `src/index.css` appeared in 2 lanes and caused a merge conflict — assign clear CSS zone ownership
- **2026-03-15**: Lanes 1+2 of Sprint 4 completed — Setup page and adapter layer are in place
- **2026-03-15**: Adapter registry has 4 platforms but setup-store has 8 — the mapping is intentionally different (setup-store is client-side, registry is server-side)
