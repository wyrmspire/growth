/**
 * TEST-1 — Mock-Engine P&P Tests
 * Covers getProjects, getTasks, getTasksByProject, getTasksByStatus,
 * createProject, createTask, updateTaskStatus, seedProjects, resetAll.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
    resetAll,
    getProjects,
    getTasks,
    getTasksByProject,
    getTasksByStatus,
    createProject,
    createTask,
    updateTaskStatus,
} from '../mock-engine';

beforeEach(() => {
    resetAll();
});

// ─── Seed state ───────────────────────────────────────────────────────────────

describe('getProjects — seed data', () => {
    it('returns an array (may be empty after resetAll)', () => {
        expect(Array.isArray(getProjects())).toBe(true);
    });
});

// ─── createProject ────────────────────────────────────────────────────────────

describe('createProject', () => {
    it('creates a project and returns it', () => {
        const p = createProject('Launch Campaign', 'First customer campaign');
        expect(p).toBeDefined();
        expect(p.name).toBe('Launch Campaign');
        expect(p.description).toBe('First customer campaign');
    });

    it('assigns an id with the plan_ prefix', () => {
        const p = createProject('My Project', '');
        expect(p.id).toMatch(/^plan_/);
    });

    it('new project has status "active"', () => {
        const p = createProject('Active One', '');
        expect(p.status).toBe('active');
    });

    it('adds the project to getProjects()', () => {
        createProject('Alpha', '');
        createProject('Beta', '');
        expect(getProjects().length).toBe(2);
    });

    it('each create gets a unique id', () => {
        const p1 = createProject('A', '');
        const p2 = createProject('B', '');
        expect(p1.id).not.toBe(p2.id);
    });
});

// ─── createTask ───────────────────────────────────────────────────────────────

describe('createTask', () => {
    it('creates a task linked to a project', () => {
        const p = createProject('Proj', '');
        const t = createTask(p.id, 'Write copy');
        expect(t.title).toBe('Write copy');
        expect(t.projectId).toBe(p.id);
    });

    it('assigns an id with the task_ prefix', () => {
        const p = createProject('Proj', '');
        const t = createTask(p.id, 'Task');
        expect(t.id).toMatch(/^task_/);
    });

    it('new tasks start with status "todo"', () => {
        const p = createProject('Proj', '');
        const t = createTask(p.id, 'Task');
        expect(t.status).toBe('todo');
    });

    it('task appears in getTasks()', () => {
        const p = createProject('Proj', '');
        createTask(p.id, 'T1');
        createTask(p.id, 'T2');
        expect(getTasks().length).toBe(2);
    });
});

// ─── getTasksByProject ────────────────────────────────────────────────────────

describe('getTasksByProject', () => {
    it('returns only tasks for the given project', () => {
        const p1 = createProject('P1', '');
        const p2 = createProject('P2', '');
        createTask(p1.id, 'Task A');
        createTask(p1.id, 'Task B');
        createTask(p2.id, 'Task C');
        const p1Tasks = getTasksByProject(p1.id);
        expect(p1Tasks.length).toBe(2);
        expect(p1Tasks.every(t => t.projectId === p1.id)).toBe(true);
    });

    it('returns empty array for an unknown project id', () => {
        expect(getTasksByProject('plan_nonexistent')).toEqual([]);
    });
});

// ─── getTasksByStatus ────────────────────────────────────────────────────────

describe('getTasksByStatus', () => {
    it('returns tasks matching the given status', () => {
        const p = createProject('P', '');
        createTask(p.id, 'Todo task');   // starts as 'todo'
        const todoTasks = getTasksByStatus('todo');
        expect(todoTasks.length).toBeGreaterThanOrEqual(1);
        expect(todoTasks.every(t => t.status === 'todo')).toBe(true);
    });

    it('returns empty array when no tasks match the status', () => {
        const p = createProject('P', '');
        createTask(p.id, 'Todo task');
        expect(getTasksByStatus('completed').length).toBe(0);
    });
});

// ─── updateTaskStatus ────────────────────────────────────────────────────────

describe('updateTaskStatus', () => {
    it('transitions a task to the new status', () => {
        const p = createProject('P', '');
        const t = createTask(p.id, 'Task');
        updateTaskStatus(t.id, 'in_progress');
        const updated = getTasks().find(x => x.id === t.id);
        expect(updated?.status).toBe('in_progress');
    });

    it('can advance through all statuses', () => {
        const p = createProject('P', '');
        const t = createTask(p.id, 'Task');
        updateTaskStatus(t.id, 'in_progress');
        updateTaskStatus(t.id, 'review');
        updateTaskStatus(t.id, 'completed');
        const done = getTasks().find(x => x.id === t.id);
        expect(done?.status).toBe('completed');
    });

    it('updated task moves into getTasksByStatus for new status', () => {
        const p = createProject('P', '');
        const t = createTask(p.id, 'Task');
        updateTaskStatus(t.id, 'review');
        expect(getTasksByStatus('review').some(x => x.id === t.id)).toBe(true);
        expect(getTasksByStatus('todo').some(x => x.id === t.id)).toBe(false);
    });
});

// ─── resetAll clears P&P state ────────────────────────────────────────────────

describe('resetAll clears P&P state', () => {
    it('getProjects count drops back to seed count after createProject + resetAll', () => {
        // getProjects() auto-seeds, so count starts at seed baseline
        const seedCount = getProjects().length;
        createProject('Extra', ''); // add one more on top
        expect(getProjects().length).toBe(seedCount + 1);
        resetAll();
        // After reset, getProjects() re-seeds — count should equal seed count again
        expect(getProjects().length).toBe(seedCount);
    });

    it('getTasks returns only seed tasks after createTask + resetAll', () => {
        // getTasks() auto-seeds on first call, just like getProjects()
        const seedTaskCount = getTasks().length;
        // add a user task on top of the auto-seeded projects
        const projects = getProjects();
        createTask(projects[0].id, 'Extra Task');
        expect(getTasks().length).toBe(seedTaskCount + 1);
        resetAll();
        // After reset, getTasks re-seeds — count returns to seed baseline
        expect(getTasks().length).toBe(seedTaskCount);
    });
});
