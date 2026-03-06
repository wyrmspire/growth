# PP.md — Projects & Planning Porting Guide

> **Goal:** Port the Projects & Planning module from `c:\workcoms` into
> `c:\growth` (GrowthOps OS). The result is a dedicated page inside growth
> that lets operators plan the setup work needed before a marketing campaign
> can run — creating social accounts, configuring brand assets, completing
> checklists, etc. The page is driven by mock-engine in mock mode and will
> later be powered by Genkit flows that auto-generate project plans from
> interview data.

---

## 1. Architecture Gap (Why You Can't Copy-Paste)

| Concern | workcoms | growth |
|---------|----------|--------|
| **Framework** | Next.js 15 (React, App Router) | Vite + vanilla TypeScript |
| **UI** | JSX / TSX components | Template-literal HTML strings |
| **State** | Zustand (`useAppStore`) | `mock-engine.ts` module-level `let` variables |
| **Styling** | Tailwind CSS 4 | Vanilla CSS (`src/index.css`) |
| **Routing** | File-system routes (`app/planning/page.tsx`) | SPA hash nav (`data-nav` clicks → `navigate()`) |
| **Icons** | `lucide-react` components | Emoji / raw SVG strings |
| **Drawers** | Radix Dialog + drawer components | `help-drawer.ts` (simple sliding div) |
| **DB** | Supabase (Postgres + RLS + `@supabase/ssr`) | None yet — mock-engine holds state |
| **Genkit** | Scaffolded flows (`genkit` 1.29) | Scaffolded flows (`genkit` 1.29) ✅ shared |

**Bottom line:** The React JSX, Zustand hooks, Tailwind classes, and Next.js
routing cannot be copied verbatim. You **must rewrite** the UI layer in growth's
vanilla-TS render/bind pattern. However, the **data shapes, business logic,
event names, and Supabase schema** can be copied almost 1-for-1.

---

## 2. What CAN Be Copied Directly

### 2a. Data Types — Project & Task

Copy these interfaces from `c:\workcoms\lib\store\use-app-store.ts` lines 41-56
into `c:\growth\modules\core\src\types.ts`:

```typescript
// ─── Projects & Planning ─────────────────────────────────────────
export interface Project {
    id: string;            // UUID in prod, prefixed in mock
    name: string;
    status: 'active' | 'completed' | 'on_hold';
    description?: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed' | 'done';

export interface Task {
    id: string;
    title: string;
    status: TaskStatus;
    projectId: string;     // FK → Project.id
    description?: string;
    dueDate?: string;      // ISO 8601
    assignee?: string;
}
```

> **Why copy these exactly?** Keeping the same field names means a shared
> Supabase instance can serve both workcoms and growth without translation.
> The DB column `project_id` ↔ TS field `projectId` is a trivial camelCase
> mapping already handled by workcoms queries.

### 2b. Event Names

Add these to `modules/core/src/types.ts` → `DomainEventName`:

```typescript
| 'ProjectCreated'
| 'TaskCreated'
| 'TaskStatusUpdated'
```

These align with the workcoms event types `project.created`,
`task.created`, and `task.status_updated`. Growth uses PascalCase event
names.

### 2c. Supabase Schema (tables + RLS)

The `projects` and `tasks` tables already exist in the workcoms Supabase
project (`bbdhhlungcjqzghwovsx`). If growth gets its **own** Supabase
project, run these SQL migrations (copied from `c:\workcoms\supa.md`):

```sql
-- Migration: create_pp_tables
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'completed', 'on_hold')),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'todo'
        CHECK (status IN ('todo', 'in_progress', 'review', 'completed', 'done')),
    description TEXT,
    due_date TIMESTAMPTZ,
    assignee TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS (requires workspaces and is_workspace_member function)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read projects"
    ON public.projects FOR SELECT
    USING (public.is_workspace_member(workspace_id));
CREATE POLICY "Members can insert projects"
    ON public.projects FOR INSERT
    WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "Members can update projects"
    ON public.projects FOR UPDATE
    USING (public.is_workspace_member(workspace_id));
CREATE POLICY "Members can delete projects"
    ON public.projects FOR DELETE
    USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Members can read tasks"
    ON public.tasks FOR SELECT
    USING (public.is_workspace_member(workspace_id));
CREATE POLICY "Members can insert tasks"
    ON public.tasks FOR INSERT
    WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "Members can update tasks"
    ON public.tasks FOR UPDATE
    USING (public.is_workspace_member(workspace_id));
CREATE POLICY "Members can delete tasks"
    ON public.tasks FOR DELETE
    USING (public.is_workspace_member(workspace_id));
```

> **Shared DB option:** If both projects use the **same** Supabase project
> (`bbdhhlungcjqzghwovsx`), these tables already exist. Growth just needs
> its own client pointing at the same URL + anon key, plus the
> `workspaces` / `workspace_memberships` / `is_workspace_member()` function
> that workcoms already created. Growth would share the same workspace rows.

### 2d. Mutation Logic

From `c:\workcoms\lib\supabase\mutations.ts` — copy these functions (strip
the `createClient()` import and replace with your own Supabase client when
growth gets one):

| Function | Lines (workcoms) | Purpose |
|----------|------------------|---------|
| `insertProject()` | 41-50 | Insert a new project |
| `insertTask()` | 54-70 | Insert a new task |
| `updateTaskStatus()` | 72-74 | Change task status |

### 2e. Query Logic

From `c:\workcoms\lib\supabase\queries.ts` → `fetchWorkspaceData()` lines
4-88 already loads `projects` and `tasks` as part of the workspace hydration.
Copy the relevant sections.

---

## 3. What Must Be REWRITTEN (Not Copied)

### 3a. Page Rendering

Workcoms pages are React components with JSX. Growth pages are functions
that return HTML template-literal strings. You must **rewrite** the UI
from scratch following growth's established pattern.

**Pattern to follow** — see any existing page, e.g.
`c:\growth\src\pages\discovery.ts`:

```typescript
// src/pages/projects.ts

import * as engine from '../mock-engine';

export function renderProjectsPage(): string {
    const projects = engine.getProjects();
    const tasks = engine.getTasks();
    // ... return HTML string using template literals
}

export function bindProjectsEvents(): void {
    // Attach click/submit listeners to DOM elements
}
```

### 3b. State Management (Mock-Engine Extensions)

Workcoms uses Zustand. Growth uses `mock-engine.ts`. Add project & task
state to the mock-engine.

**Add to `c:\growth\src\mock-engine.ts`:**

```typescript
import type { Project, Task, TaskStatus } from '../modules/core/src/types';

// ── Projects & Planning state ─────────────────────────
let projects: Project[] = [];
let tasks: Task[] = [];

// ── seed data (mock mode) ─────────────────────────────
function seedProjects(): void {
    if (projects.length) return;
    projects = [
        { id: 'P-1', name: 'Facebook Page Setup',   status: 'active', description: 'Create and configure business Facebook page' },
        { id: 'P-2', name: 'Brand Asset Prep',      status: 'active', description: 'Logo, cover photo, profile image, bio copy' },
        { id: 'P-3', name: 'Ad Account Config',     status: 'active', description: 'Set up Meta Business Suite, payment, pixel' },
    ];
    tasks = [
        { id: 'T-1', title: 'Create Facebook Business Page',      status: 'todo',        projectId: 'P-1', description: 'Go to facebook.com/pages/create and follow the wizard' },
        { id: 'T-2', title: 'Set profile picture & cover photo',  status: 'todo',        projectId: 'P-1', assignee: 'operator' },
        { id: 'T-3', title: 'Write page About section',           status: 'todo',        projectId: 'P-1', description: 'Use brand voice from discovery interview' },
        { id: 'T-4', title: 'Prepare logo (1024×1024 PNG)',       status: 'in_progress', projectId: 'P-2', assignee: 'operator' },
        { id: 'T-5', title: 'Create cover image (1640×856)',      status: 'todo',        projectId: 'P-2' },
        { id: 'T-6', title: 'Write one-line bio',                 status: 'completed',   projectId: 'P-2' },
        { id: 'T-7', title: 'Create Meta Business Suite account', status: 'todo',        projectId: 'P-3' },
        { id: 'T-8', title: 'Connect payment method',             status: 'todo',        projectId: 'P-3' },
        { id: 'T-9', title: 'Install Meta Pixel on website',      status: 'todo',        projectId: 'P-3', description: 'Copy pixel code into site header, verify with Pixel Helper extension' },
    ];
}

// ── public API ────────────────────────────────────────
export function getProjects(): Project[] {
    seedProjects();
    return projects;
}

export function getTasks(): Task[] {
    seedProjects();
    return tasks;
}

export function getTasksByProject(projectId: string): Task[] {
    return getTasks().filter(t => t.projectId === projectId);
}

export function getTasksByStatus(status: TaskStatus): Task[] {
    return getTasks().filter(t => t.status === status);
}

export function createProject(name: string, description?: string): Project {
    const project: Project = {
        id: newEntityId('plan' as any), // or use crypto.randomUUID()
        name,
        status: 'active',
        description,
    };
    projects.push(project);
    eventLog.append('ProjectCreated', project.id as any);
    return project;
}

export function createTask(
    projectId: string,
    title: string,
    description?: string,
    assignee?: string,
    dueDate?: string,
): Task {
    const task: Task = {
        id: newEntityId('item' as any),
        title,
        status: 'todo',
        projectId,
        description,
        assignee,
        dueDate,
    };
    tasks.push(task);
    eventLog.append('TaskCreated', task.id as any);
    return task;
}

export function updateTaskStatus(taskId: string, newStatus: TaskStatus): void {
    const task = tasks.find(t => t.id === taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);
    task.status = newStatus;
    eventLog.append('TaskStatusUpdated', task.id as any, { status: newStatus });
}
```

> **IdPrefix note:** Growth's `IdPrefix` type in `modules/core/src/types.ts`
> doesn't include `'plan'` yet. Either add `'plan'` and `'task'` as valid
> prefixes, or use simple `crypto.randomUUID()` calls instead.

### 3c. Styling

Workcoms uses Tailwind utility classes. Growth uses vanilla CSS in
`src/index.css`. You must add CSS classes that match the visual design.

**Add to `c:\growth\src\index.css`:**

```css
/* ── Projects & Planning ──────────────────────────────── */
.project-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2.5rem;
}

.project-card {
    background: var(--surface-card);
    border: 1px solid var(--border-dim);
    border-radius: var(--radius-lg);
    padding: 1.25rem;
    cursor: pointer;
    transition: border-color 0.2s;
}
.project-card:hover { border-color: var(--border-hover); }

.project-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
}

.project-card-title { font-weight: 700; font-size: 1.05rem; }

.project-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border-dim);
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
}

/* Kanban board */
.kanban-board {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
}

.kanban-column {
    display: flex;
    flex-direction: column;
    min-height: 400px;
}

.kanban-column-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding: 0 0.25rem;
}

.kanban-column-title {
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.kanban-column-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--surface-card);
    border: 1px solid var(--border-dim);
    border-radius: var(--radius-lg);
    min-height: 400px;
}

.kanban-task {
    background: var(--surface-page);
    border: 1px solid var(--border-dim);
    border-radius: var(--radius-md);
    padding: 1rem;
    cursor: pointer;
    transition: border-color 0.2s;
}
.kanban-task:hover { border-color: var(--border-hover); }

.kanban-task-title {
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
}

.kanban-task-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 0.75rem;
}

.kanban-task-badge {
    font-size: 0.6rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    background: var(--surface-card);
    border: 1px solid var(--border-dim);
}

.kanban-task-badge--overdue {
    color: var(--color-error);
    background: hsl(0 60% 50% / 0.1);
    border-color: hsl(0 60% 50% / 0.2);
}

.kanban-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 80px;
    border: 2px dashed var(--border-dim);
    border-radius: var(--radius-md);
    font-size: 0.75rem;
    color: var(--text-muted);
}
```

> Use the CSS custom properties already defined in `src/index.css` (e.g.
> `--surface-card`, `--border-dim`, `--text-muted`). Match whatever
> variable names growth already uses.

### 3d. Navigation Registration

In `c:\growth\src\main.ts`, you need to:

1. **Import** the new page:
   ```typescript
   import { renderProjectsPage, bindProjectsEvents } from './pages/projects';
   ```

2. **Add to PageId type:**
   ```typescript
   type PageId = '...' | 'projects';
   ```

3. **Add to NAV_ITEMS:**
   ```typescript
   { id: 'projects', icon: '📋', label: 'Projects & Planning', tipKey: 'campaign' },
   ```

4. **Add to PAGE_RENDERERS and PAGE_BINDERS:**
   ```typescript
   projects: renderProjectsPage,
   // ...
   projects: bindProjectsEvents,
   ```

5. **Add to PAGE_HELP_KEYS:**
   ```typescript
   projects: ['campaign', 'approve'],
   ```

---

## 4. Page Design — What to Build

The new `src/pages/projects.ts` should combine elements from **both**
workcoms pages:

### From `app/planning/page.tsx` (PRIMARY — copy the structure):
- **Project cards grid** — clickable cards showing each project's name,
  status, description, task count
- **4-column Kanban board** — Backlog / In Progress / Under Review / Done
- **"New Project" button** — opens an inline form (not a React drawer —
  use a simple hidden `<form>` that toggles visibility)
- **"My Work" filter toggle**
- **Task advance button** ("Move Up") per task card
- **Overdue badge** — flag tasks past their `dueDate` in red
- **Coaching block** — use growth's existing `coach-block` pattern

### From `app/projects/page.tsx` (SECONDARY — cherry-pick):
- **Kanban + List view toggle** — optional, nice to have
- **"New Task" button**

### Growth-specific additions:
- **Campaign prerequisite framing** — each project represents setup work
  needed before a campaign can launch (e.g. "Create Facebook Page")
- **Genkit flow integration point** — the `offerStrategistFlow` output
  should eventually generate project plans automatically based on the
  business discovery interview. For now, stub this as a "Generate Plan"
  button that calls mock-engine and creates preset projects.

---

## 5. Step-by-Step Implementation Checklist

### Phase 1 — Types & Engine (no UI yet)

- [ ] **1.1** Add `Project` and `Task` interfaces to `modules/core/src/types.ts`
- [ ] **1.2** Add `'ProjectCreated' | 'TaskCreated' | 'TaskStatusUpdated'` to `DomainEventName`
- [ ] **1.3** Optionally add `'plan' | 'task'` to `IdPrefix`
- [ ] **1.4** Add project/task state, seed data, and public API functions to `src/mock-engine.ts` (see Section 3b)
- [ ] **1.5** Write unit tests: `modules/core/src/__tests__/projects.test.ts`

### Phase 2 — Page & CSS

- [ ] **2.1** Create `src/pages/projects.ts` with `renderProjectsPage()` and `bindProjectsEvents()`
- [ ] **2.2** Add CSS classes to `src/index.css` (see Section 3c)
- [ ] **2.3** Register the page in `src/main.ts` (PageId, NAV_ITEMS, renderers, binders — see Section 3d)
- [ ] **2.4** Add `PAGE_HELP_KEYS` entry and any new glossary terms to `src/glossary.ts`
- [ ] **2.5** Add a coaching block explaining what Projects & Planning is for

### Phase 3 — Genkit Flow Stub

- [ ] **3.1** Add a "Generate Plan" button on the projects page
- [ ] **3.2** In mock-engine, add `generateProjectPlan(interviewId: string): Project` that creates
      preset projects and tasks based on the current discovery interview
- [ ] **3.3** Wire the button to call `engine.generateProjectPlan()` and re-render

### Phase 4 — Database (when ready)

- [ ] **4.1** Decide: shared Supabase project or new one?
  - **Shared:** growth connects to `bbdhhlungcjqzghwovsx`. Tables already exist.
    Just need a Supabase client in growth.
  - **New project:** Run the SQL from Section 2c. Also need workspaces,
    profiles, memberships tables and the `is_workspace_member()` function
    (copy from `c:\workcoms\supa.md` Phase 1 migrations).
- [ ] **4.2** Install `@supabase/supabase-js` (no SSR needed — growth is client-side)
- [ ] **4.3** Create `src/supabase-client.ts`
- [ ] **4.4** Create `src/supabase-mutations.ts` (copy `insertProject`, `insertTask`,
      `updateTaskStatus` from workcoms)
- [ ] **4.5** Create `src/supabase-queries.ts` (fetch projects/tasks for a workspace)
- [ ] **4.6** Wire mock-engine to persist writes when a Supabase client is available

---

## 6. Detailed File-by-File Mapping

| Workcoms File | What To Do | Growth Target |
|---|---|---|
| `app/planning/page.tsx` (313 lines) | **REWRITE** as vanilla TS render function | `src/pages/projects.ts` (NEW) |
| `app/projects/page.tsx` (235 lines) | **MERGE** its Kanban/List toggle into above | `src/pages/projects.ts` |
| `lib/store/use-app-store.ts` → `Project`, `Task` types | **COPY** interfaces (6 lines each) | `modules/core/src/types.ts` |
| `lib/store/use-app-store.ts` → seed data (lines 206-224) | **ADAPT** seed data for marketing context | `src/mock-engine.ts` → `seedProjects()` |
| `lib/store/use-app-store.ts` → event projections | **REWRITE** as mock-engine functions | `src/mock-engine.ts` |
| `lib/services/event-log-service.ts` | **ALREADY EXISTS** in growth as `EventLog` class in `modules/core/src/index.ts` | No action needed |
| `lib/supabase/mutations.ts` → `insertProject`, `insertTask`, `updateTaskStatus` | **COPY** the SQL logic, adjust import | `src/supabase-mutations.ts` (NEW, Phase 4) |
| `lib/supabase/queries.ts` → project/task fetch sections | **COPY** the query logic | `src/supabase-queries.ts` (NEW, Phase 4) |
| `components/drawers/form-drawer.tsx` | **DO NOT COPY** — use inline form toggle | N/A |
| `components/drawers/task-detail-drawer.tsx` | **STUB** as expandable card or detail section | `src/pages/projects.ts` |
| `components/drawers/entity-detail-drawer.tsx` | **STUB** as expandable card or detail section | `src/pages/projects.ts` |
| `components/coach/coach-column.tsx` | **DO NOT COPY** — use growth's `coach-block` pattern | `src/pages/projects.ts` inline |
| `components/coming-soon/coming-soon-badge.tsx` | **DO NOT COPY** — workcoms-specific | N/A |
| `components/layout/sidebar.tsx` | **DO NOT COPY** — growth has its own sidebar in `main.ts` | N/A |
| `components/bug-report/bug-report-button.tsx` | **DO NOT COPY** — workcoms-specific | N/A |
| `app/globals.css` | **DO NOT COPY** — add classes to `src/index.css` | `src/index.css` |

---

## 7. Dependency Checklist

### Already satisfied in growth (no install needed):

| Dependency | How growth has it |
|---|---|
| TypeScript | `typescript` 5.4 in devDependencies |
| Genkit | `genkit` 1.29 + `@genkit-ai/google-genai` 1.29 |
| Vite | `vite` 5.4 |
| Vitest | `vitest` 4.0 |
| `EventLog` | `modules/core/src/index.ts` |
| `newEntityId()` | `modules/core/src/index.ts` |

### Need to install (Phase 4 — database):

| Package | Command |
|---|---|
| `@supabase/supabase-js` | `npm install @supabase/supabase-js` |

### NOT needed (workcoms-only dependencies):

| Package | Why skip |
|---|---|
| `react`, `react-dom`, `next` | Growth is vanilla TS |
| `zustand` | Growth uses mock-engine |
| `tailwindcss`, `@tailwindcss/*` | Growth uses vanilla CSS |
| `lucide-react` | Growth uses emoji + inline SVG |
| `@supabase/ssr` | No server-side rendering |
| `motion` (Framer Motion) | Growth uses CSS transitions |
| `date-fns` | Can install if needed for due-date formatting, or use `Intl.DateTimeFormat` |
| `cmdk`, `@radix-ui/*` | Growth doesn't use component libraries |

---

## 8. Shared Database Strategy

### Option A — Fully Shared (Recommended for MVP)

Both projects point at the **same** Supabase project
(`bbdhhlungcjqzghwovsx`). Workcoms already has the tables. Growth reads
and writes to the same `projects` and `tasks` tables through the same
`workspace_id`. Users see the same data in both apps.

**Pros:** Zero migration work. Instant data portability.
**Cons:** Schema changes must be coordinated across both repos.

**To implement:**
1. Copy the anon key + URL from `c:\workcoms\.env.local`
2. Create `c:\growth\.env.local`:
   ```
   VITE_SUPABASE_URL=https://bbdhhlungcjqzghwovsx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
   ```
3. Install `@supabase/supabase-js` and create a browser client

### Option B — Separate Supabase Project

Growth gets its own Supabase project. You run all migrations from scratch
(core tables from Section 2c, plus workspaces/profiles from
`c:\workcoms\supa.md` Phase 1).

**Pros:** Independent schema evolution.
**Cons:** Duplicate data. User has to register separately.

### Option C — Shared Schema, Separate Projects Later

Start with Option A. When growth needs divergent schema (e.g. campaign-linked
project plans), create a separate Supabase project and migrate.

---

## 9. Genkit Integration — Campaign Setup Projects

The long-term vision is that after the business discovery interview, a
Genkit flow generates a project plan listing all the setup steps the
operator needs to complete before launching a campaign. This is where
Projects & Planning becomes **campaign-aware**.

### How to wire it:

1. **Flow name:** `campaignSetupFlow` (new, to be scaffolded)
2. **Input:** The current `OfferProfile` (available after discovery approval)
3. **Output:** An array of `{ projectName, tasks: { title, description }[] }`
4. **Mock fallback:** The `seedProjects()` function in mock-engine serves as
   the deterministic fallback when the Genkit server is unavailable
5. **Human review gate:** Generated project plans go through
   `approvals.createReviewBatch()` before they become active — same pattern
   as offer hypotheses

### Example flow scaffold (reference only):

```typescript
// server.ts (add new route)
app.post('/api/flows/campaign-setup', async (req, res) => {
    // call campaignSetupFlow with the offer profile
    // return { ok: true, mode: 'live' | 'mock-safe', output: ProjectPlan[] }
});
```

---

## 10. Anti-Patterns to Avoid

1. **Do NOT import React** — growth is vanilla TS. No JSX, no hooks.
2. **Do NOT add Tailwind** — use the CSS classes in `src/index.css`.
3. **Do NOT create a Zustand store** — add state to `mock-engine.ts`.
4. **Do NOT create a `modules/projects/` domain module** yet — P&P is a
   UI + mock-engine feature at this stage. When it needs contract-first
   domain logic, create the module then.
5. **Do NOT bypass approvals** — any Genkit-generated project plan must
   pass through the approval queue before becoming active.
6. **Do NOT hardcode project IDs** — use `newEntityId()` or
   `crypto.randomUUID()` for dynamic creation.
7. **Do NOT call the Supabase client from page render functions** — all
   persistence goes through mock-engine, which optionally writes to
   Supabase. Keep the UI → mock-engine → (optional DB) layering.

---

## 11. Quick-Start Summary

```
1. Copy types → modules/core/src/types.ts      (5 min)
2. Extend mock-engine.ts with P&P state/API     (30 min)
3. Create src/pages/projects.ts (render+bind)    (2-3 hrs)
4. Add CSS to src/index.css                      (30 min)
5. Register in src/main.ts                       (10 min)
6. Add glossary terms                            (10 min)
7. Write tests                                   (30 min)
8. [Later] Wire Supabase for persistence         (1-2 hrs)
9. [Later] Scaffold campaignSetupFlow            (1-2 hrs)
```

Total MVP estimate: **~4-5 hours** for a working mock-mode Projects &
Planning page that matches the growth UI conventions, with the Supabase
and Genkit integration stubs ready for future work.
