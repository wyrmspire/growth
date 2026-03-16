/**
 * Projects & Planning Page — PP-1 through PP-9
 * Operators plan the setup work needed before a campaign can run.
 * Driven by mock-engine CRUD in mock mode.
 */

import * as engine from '../mock-engine';
import { tip } from '../components/tooltip';
import { toastSuccess, toastError, toastInfo } from '../components/toast';
import type { Project, Task, TaskStatus } from '../../modules/core/src/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

const STYLE_PROFILES = [
  { id: 'professional', label: 'Professional' },
  { id: 'casual',       label: 'Casual & Friendly' },
  { id: 'urgent',       label: 'Urgent / Promotional' },
];

const STATUS_LABELS: Record<string, string> = {
  todo:        'Backlog',
  in_progress: 'In Progress',
  review:      'Under Review',
  completed:   'Done',
  done:        'Done',
};

const STATUS_COLORS: Record<string, string> = {
  active:    'badge-approved',
  completed: 'badge-scheduled',
  on_hold:   'badge-pending',
};

const PROJECT_STATUS_LABELS: Record<string, string> = {
  active:    'Active',
  completed: 'Complete',
  on_hold:   'On Hold',
};

// The 4 Kanban columns we display (task statuses mapped to columns)
const KANBAN_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'todo',        label: 'Backlog' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'review',      label: 'Under Review' },
  { status: 'completed',   label: 'Done' },
];

// Next status in the advance chain
const NEXT_STATUS: Partial<Record<TaskStatus, TaskStatus>> = {
  todo:        'in_progress',
  in_progress: 'review',
  review:      'completed',
};

function isOverdue(task: Task): boolean {
  if (!task.dueDate) return false;
  return new Date(task.dueDate) < new Date();
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Sub-renderers ─────────────────────────────────────────────────────────────

function renderProjectCard(project: Project): string {
  const tasks = engine.getTasksByProject(project.id);
  const done  = tasks.filter(t => t.status === 'completed' || t.status === 'done').length;
  const total = tasks.length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return `
    <div class="project-card card" data-project-id="${project.id}">
      <div class="project-card-header">
        <span class="project-card-title">${project.name}</span>
        <span class="badge ${STATUS_COLORS[project.status] || 'badge-pending'}">
          ${PROJECT_STATUS_LABELS[project.status] || project.status}
        </span>
      </div>
      ${project.description ? `<p class="body-secondary" style="margin-bottom: var(--space-md);">${project.description}</p>` : ''}
      <div class="pp-progress-row">
        <div class="pp-progress-bar">
          <div class="pp-progress-fill" style="width: ${progress}%"></div>
        </div>
        <span class="body-muted">${done}/${total} tasks</span>
      </div>
      <div class="project-card-footer">
        <span>
          ${tip('project', `${total} task${total !== 1 ? 's' : ''}`)}
        </span>
        <button class="btn btn--ghost btn--sm" data-pp-expand="${project.id}">
          View tasks
        </button>
      </div>
    </div>
  `;
}

function renderProjectsEmpty(): string {
  return `
    <div class="card card-empty-state" style="grid-column: 1 / -1; text-align: center;">
      <div class="page-emoji">📋</div>
      <h3 style="margin-bottom: var(--space-sm);">No projects yet</h3>
      <p class="body-secondary" style="margin-bottom: var(--space-md);">
        Create your first project to start planning the setup steps your campaign needs.
      </p>
      <button class="btn btn-primary" id="pp-create-project-cta">
        Create Your First Project
      </button>
    </div>
  `;
}

function renderKanbanTask(task: Task): string {
  const overdue   = isOverdue(task);
  const isDone    = task.status === 'completed' || task.status === 'done';
  const nextSt    = NEXT_STATUS[task.status as TaskStatus];
  const nextLabel = nextSt ? STATUS_LABELS[nextSt] : null;
  const dueBadge  = task.dueDate
    ? `<span class="kanban-task-badge ${overdue ? 'kanban-task-badge--overdue' : ''}">
        ${overdue ? '⚠ Overdue' : 'Due ' + formatDate(task.dueDate)}
       </span>`
    : '';
  const assigneeBadge = task.assignee
    ? `<span class="kanban-task-badge">${task.assignee}</span>`
    : '';
  const moveBtn = isDone
    ? `<span class="kanban-task-badge" style="color: var(--color-success)">✓ Done</span>`
    : nextLabel
      ? `<button class="btn btn--ghost btn--sm pp-task-advance"
                 data-task-id="${task.id}"
                 data-next-status="${nextSt}"
                 title="Move to ${nextLabel}">Move → ${nextLabel}</button>`
      : '';

  return `
    <div class="kanban-task" data-task-id="${task.id}">
      <div class="kanban-task-title">${task.title}</div>
      ${task.description ? `<div class="body-muted" style="margin-top:2px">${task.description.slice(0, 80)}${task.description.length > 80 ? '…' : ''}</div>` : ''}
      <div class="kanban-task-meta">
        ${assigneeBadge}
        ${dueBadge}
      </div>
      <div style="margin-top: var(--space-sm);">${moveBtn}</div>
    </div>
  `;
}

function renderKanbanColumn(status: TaskStatus, label: string, tasks: Task[]): string {
  const filtered = tasks.filter(t => t.status === status || (status === 'completed' && t.status === 'done'));
  const bodyContent = filtered.length
    ? filtered.map(renderKanbanTask).join('')
    : `<div class="kanban-empty">No tasks here</div>`;
  return `
    <div class="kanban-column">
      <div class="kanban-column-header">
        <span class="kanban-column-title">${label}</span>
        <span class="badge badge-pending" style="font-size:10px;">${filtered.length}</span>
      </div>
      <div class="kanban-column-body">
        ${bodyContent}
      </div>
    </div>
  `;
}

function renderKanbanBoard(filterProjectId?: string | null): string {
  let tasks = engine.getTasks();
  if (filterProjectId) tasks = tasks.filter(t => t.projectId === filterProjectId);
  const projects = engine.getProjects();
  const projectOptions = projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

  return `
    <section class="pp-section">
      <div class="pp-section-header">
        <h2 class="section-heading">${tip('kanban', 'Task Board')}</h2>
        <div class="action-row">
          <select id="pp-kanban-filter" class="form-input" style="width: auto; padding: var(--space-xs) var(--space-sm);">
            <option value="">All Projects</option>
            ${projectOptions}
          </select>
          <button class="btn btn--ghost btn--sm" id="pp-new-task-toggle">+ New Task</button>
        </div>
      </div>

      <div id="pp-new-task-form" class="pp-inline-form" style="display:none;">
        <form id="new-task-form" class="card" style="padding: var(--space-md); margin-bottom: var(--space-lg);">
          <h3 style="margin-bottom: var(--space-md);">New Task</h3>
          <div class="form-group">
            <label for="task-title">Title *</label>
            <input id="task-title" name="title" class="form-input" type="text" placeholder="e.g. Create Facebook Business Page" required />
          </div>
          <div class="form-group">
            <label for="task-project">Project *</label>
            <select id="task-project" name="projectId" class="form-input" required>
              <option value="">Select a project…</option>
              ${projectOptions}
            </select>
          </div>
          <div class="form-group">
            <label for="task-assignee">Assignee</label>
            <input id="task-assignee" name="assignee" class="form-input" type="text" placeholder="e.g. operator" />
          </div>
          <div class="form-group">
            <label for="task-due">Due Date</label>
            <input id="task-due" name="dueDate" class="form-input" type="date" />
          </div>
          <div class="action-row form-submit">
            <button type="submit" class="btn btn-primary">Add Task</button>
            <button type="button" class="btn btn--ghost" id="pp-new-task-cancel">Cancel</button>
          </div>
        </form>
      </div>

      <div class="kanban-board" id="pp-kanban-board">
        ${KANBAN_COLUMNS.map(col => renderKanbanColumn(col.status, col.label, tasks)).join('')}
      </div>
    </section>
  `;
}

// ── Main render ───────────────────────────────────────────────────────────────

export function renderProjectsPage(): string {
  const projects      = engine.getProjects();
  const interview     = engine.getCurrentInterview();
  const styleProfile  = engine.getCurrentStyleProfile?.() ?? null;
  const allTasks      = engine.getTasks();
  const overdueCount  = allTasks.filter(isOverdue).length;

  const projectsGrid  = projects.length
    ? projects.map(p => renderProjectCard(p)).join('')
    : renderProjectsEmpty();

  const overdueNotice = overdueCount > 0
    ? `<div class="status-banner status-banner--error" style="margin-bottom: var(--space-lg);">
        <strong>⚠</strong>
        ${overdueCount} task${overdueCount > 1 ? 's are' : ' is'} overdue. Check the board below.
       </div>`
    : '';

  return `
    <div class="page-shell">
      <div class="page-header">
        <h1>Projects &amp; Planning</h1>
        <p class="body-secondary">Plan the setup steps your campaign needs before launch.</p>
      </div>

      <!-- PP-7: Coaching block -->
      <div class="coach-block">
        <div class="coach-block-icon">📋</div>
        <div class="coach-block-body">
          <div class="coach-what">
            <strong>What you do here</strong><br>
            Plan the setup steps you need to complete before your campaign launches — creating social accounts, brand assets, tracking codes, and more.
          </div>
          <div class="coach-why" style="margin-top: var(--space-sm);">
            <strong>Why it matters</strong><br>
            Good campaigns need groundwork. Using a structured task board keeps you organised and prevents launch-day surprises.
          </div>
          <div class="coach-next" style="margin-top: var(--space-sm);">
            <strong>What comes next</strong><br>
            Once your setup tasks are done, your campaign is ready to launch from the Campaign Launcher.
          </div>
        </div>
      </div>

      ${overdueNotice}

      <!-- PP-9: Style Profile selector stub -->
      <div class="card" style="margin-bottom: var(--space-lg); display: flex; align-items: center; gap: var(--space-md); flex-wrap: wrap;">
        <div>
          <span class="body-muted" style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 2px;">Campaign Style Profile</span>
          <select id="pp-style-profile" class="form-input" style="width: auto; padding: var(--space-xs) var(--space-sm);">
            <option value="">None selected</option>
            ${STYLE_PROFILES.map(sp => `<option value="${sp.id}" ${styleProfile === sp.id ? 'selected' : ''}>${sp.label}</option>`).join('')}
          </select>
        </div>
        ${styleProfile ? `<span class="badge badge-approved">Style: ${STYLE_PROFILES.find(s => s.id === styleProfile)?.label || styleProfile}</span>` : ''}

        <!-- PP-5: Generate Plan button -->
        <button class="btn btn-primary" id="pp-generate-plan" style="margin-left: auto;"
                data-tip-text="${interview ? 'Generate a setup plan based on your business discovery.' : 'Complete Business Discovery first for a personalised plan.'}">
          🚀 Generate Setup Plan
        </button>
        ${!interview ? `<span class="body-muted" style="font-size: 11px;">Complete Discovery first for a personalised plan</span>` : ''}
      </div>

      <!-- PP-1 / PP-3: Project cards + New Project form -->
      <section class="pp-section">
        <div class="pp-section-header">
          <h2 class="section-heading">${tip('project', 'Projects')}</h2>
          <button class="btn btn--ghost btn--sm" id="pp-new-project-toggle">+ New Project</button>
        </div>

        <div id="pp-new-project-form" class="pp-inline-form" style="display:none;">
          <form id="new-project-form" class="card" style="margin-bottom: var(--space-lg); padding: var(--space-md);">
            <h3 style="margin-bottom: var(--space-md);">New Project</h3>
            <div class="form-group">
              <label for="project-name">Name *</label>
              <input id="project-name" name="name" class="form-input" type="text"
                     placeholder="e.g. Facebook Page Setup" required />
            </div>
            <div class="form-group">
              <label for="project-desc">Description</label>
              <input id="project-desc" name="description" class="form-input" type="text"
                     placeholder="Optional: what needs to happen in this project?" />
            </div>
            <div class="action-row form-submit">
              <button type="submit" class="btn btn-primary">Create Project</button>
              <button type="button" class="btn btn--ghost" id="pp-new-project-cancel">Cancel</button>
            </div>
          </form>
        </div>

        <div class="project-grid" id="pp-project-grid">
          ${projectsGrid}
        </div>
      </section>

      <!-- PP-2: Kanban board -->
      ${renderKanbanBoard()}
    </div>
  `;
}


// ── Event binding ─────────────────────────────────────────────────────────────

export function bindProjectsEvents(): void {
  // ── Helpers ────────────────────────────────────────────────────
  function reNavigate() {
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'projects' }));
  }

  // ── PP-3: New Project form toggle ──────────────────────────────
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    if (target.id === 'pp-new-project-toggle' || target.closest('#pp-new-project-toggle')) {
      const form = document.getElementById('pp-new-project-form');
      if (form) form.style.display = form.style.display === 'none' ? '' : 'none';
    }

    if (target.id === 'pp-new-project-cancel') {
      const form = document.getElementById('pp-new-project-form');
      if (form) form.style.display = 'none';
    }

    if (target.id === 'pp-create-project-cta') {
      const form = document.getElementById('pp-new-project-form');
      if (form) {
        form.style.display = '';
        form.querySelector('input')?.focus();
      }
    }

    // ── PP-3: New Task form toggle ----
    if (target.id === 'pp-new-task-toggle' || target.closest('#pp-new-task-toggle')) {
      const form = document.getElementById('pp-new-task-form');
      if (form) form.style.display = form.style.display === 'none' ? '' : 'none';
    }

    if (target.id === 'pp-new-task-cancel') {
      const form = document.getElementById('pp-new-task-form');
      if (form) form.style.display = 'none';
    }
  }, { capture: false });

  // ── PP-3: New Project form submit ──────────────────────────────
  document.addEventListener('submit', (e) => {
    const form = e.target as HTMLFormElement;

    if (form.id === 'new-project-form') {
      e.preventDefault();
      const data = new FormData(form);
      const name = (data.get('name') as string || '').trim();
      const desc = (data.get('description') as string || '').trim();

      if (!name) {
        toastError('Project name is required.');
        return;
      }
      try {
        engine.createProject(name, desc || undefined);
        engine.trackLearningAction('create_project', 'projects', { name });
        toastSuccess(`Project "${name}" created.`);
        reNavigate();
      } catch (err) {
        toastError('Failed to create project.');
      }
    }

    // ── PP-3: New Task form submit ----
    if (form.id === 'new-task-form') {
      e.preventDefault();
      const data = new FormData(form);
      const title     = (data.get('title') as string || '').trim();
      const projectId = (data.get('projectId') as string || '').trim();
      const assignee  = (data.get('assignee') as string || '').trim();
      const dueDate   = (data.get('dueDate') as string || '').trim();

      if (!title) {
        toastError('Task title is required.');
        return;
      }
      if (!projectId) {
        toastError('Please select a project for this task.');
        return;
      }
      try {
        engine.createTask(projectId, title, undefined, assignee || undefined, dueDate || undefined);
        engine.trackLearningAction('create_task', 'projects', { title, projectId });
        toastSuccess(`Task "${title}" added.`);
        reNavigate();
      } catch (err) {
        toastError('Failed to create task.');
      }
    }
  });

  // ── PP-4: Task status advance ──────────────────────────────────
  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.pp-task-advance') as HTMLElement | null;
    if (!btn) return;

    const taskId    = btn.dataset.taskId;
    const nextSt    = btn.dataset.nextStatus as TaskStatus;
    if (!taskId || !nextSt) return;

    try {
      engine.updateTaskStatus(taskId, nextSt);
      engine.trackLearningAction('advance_task', 'projects', { taskId, nextSt });
      toastSuccess(`Task moved to ${STATUS_LABELS[nextSt] || nextSt}.`);
      reNavigate();
    } catch (err) {
      toastError(`Could not update task: ${err instanceof Error ? err.message : 'unknown error'}`);
    }
  });

  // ── PP-5: Generate plan button ─────────────────────────────────
  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('#pp-generate-plan');
    if (!btn) return;

    try {
      const { projects, tasks } = engine.generateProjectPlan();
      engine.trackLearningAction('generate_plan', 'projects', { projects, tasks });
      toastSuccess(`Setup plan generated with ${projects} project${projects !== 1 ? 's' : ''} and ${tasks} task${tasks !== 1 ? 's' : ''}.`);
      reNavigate();
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to generate plan.');
    }
  });

  // ── PP-6: Kanban project filter ─────────────────────────────────
  document.addEventListener('change', (e) => {
    const sel = e.target as HTMLSelectElement;
    if (sel.id !== 'pp-kanban-filter') return;

    const filterProjectId = sel.value || null;
    let tasks = engine.getTasks();
    if (filterProjectId) tasks = tasks.filter(t => t.projectId === filterProjectId);

    const board = document.getElementById('pp-kanban-board');
    if (!board) return;
    board.innerHTML = KANBAN_COLUMNS.map(col => renderKanbanColumn(col.status, col.label, tasks)).join('');
  });

  // ── PP-9: Style profile change ──────────────────────────────────
  document.addEventListener('change', (e) => {
    const sel = e.target as HTMLSelectElement;
    if (sel.id !== 'pp-style-profile') return;

    engine.setCurrentStyleProfile(sel.value || null);
    engine.trackLearningAction('set_style_profile', 'projects', { profile: sel.value });
    const label = STYLE_PROFILES.find(s => s.id === sel.value)?.label;
    if (label) toastInfo(`Style profile set to "${label}". Will be applied when copy is generated.`);
    reNavigate();
  });

  // ── PP-8: Project card expand (show task list) ─────────────────
  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-pp-expand]') as HTMLElement | null;
    if (!btn) return;

    const projectId = btn.dataset.ppExpand;
    if (!projectId) return;

    // Filter kanban to this project
    const filterSel = document.getElementById('pp-kanban-filter') as HTMLSelectElement | null;
    if (filterSel) {
      filterSel.value = projectId;
      filterSel.dispatchEvent(new Event('change'));
    }

    // Scroll to board
    const board = document.getElementById('pp-kanban-board');
    if (board) board.scrollIntoView({ behavior: 'smooth', block: 'start' });

    engine.trackLearningAction('expand_project', 'projects', { projectId });
  });
}
