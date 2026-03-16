/**
 * TEST-3 — Toast Component Tests
 * Tests toastSuccess, toastError, toastWarning, toastInfo exports exist and
 * can be called without throwing, using a minimal DOM stub.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('toast module — exports exist', () => {
    it('source file exports toastSuccess, toastError, toastWarning, toastInfo', async () => {
        const fs = await import('fs');
        const path = await import('path');
        const src = fs.readFileSync(
            path.resolve(__dirname, '../toast.ts'),
            'utf-8',
        );
        expect(src).toContain('toastSuccess');
        expect(src).toContain('toastError');
        expect(src).toContain('toastWarning');
        expect(src).toContain('toastInfo');
    });
});

describe('toast with mocked DOM', () => {
    const created: Array<{ tag: string; el: Record<string, unknown> }> = [];

    const makeEl = (tag: string) => {
        const el: Record<string, unknown> = {
            tag,
            className: '',
            textContent: '',
            innerHTML: '',
            children: [] as unknown[],
            style: {},
            dataset: {},
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            remove: vi.fn(),
            setAttribute: vi.fn(),
            getAttribute: vi.fn(() => null),
            appendChild: vi.fn((child: unknown) => { (el.children as unknown[]).push(child); return child; }),
            querySelector: vi.fn(() => null),
            querySelectorAll: vi.fn(() => []),
            classList: {
                add: vi.fn((...cls: string[]) => { el.className = [el.className, ...cls].join(' ').trim(); }),
                remove: vi.fn(),
                contains: vi.fn(() => false),
            },
        };
        created.push({ tag, el });
        return el;
    };

    beforeEach(() => {
        vi.useFakeTimers();
        created.length = 0;

        vi.stubGlobal('document', {
            createElement: vi.fn((tag: string) => makeEl(tag)),
            body: {
                appendChild: vi.fn((el: unknown) => el),
                contains: vi.fn(() => true),
                removeChild: vi.fn(),
                querySelector: vi.fn(() => null),
                querySelectorAll: vi.fn(() => []),
            },
            getElementById: vi.fn(() => null),
            querySelector: vi.fn(() => null),
        });

        vi.stubGlobal('requestAnimationFrame', (cb: () => void) => { cb(); return 0; });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
        vi.resetModules();
    });

    it('toastSuccess creates elements', async () => {
        const { toastSuccess } = await import('../toast');
        expect(() => toastSuccess('Great job!')).not.toThrow();
        expect(created.length).toBeGreaterThan(0);
    });

    it('toastError creates elements', async () => {
        const { toastError } = await import('../toast');
        expect(() => toastError('Something failed')).not.toThrow();
        expect(created.length).toBeGreaterThan(0);
    });

    it('toastWarning creates elements', async () => {
        const { toastWarning } = await import('../toast');
        expect(() => toastWarning('Watch out')).not.toThrow();
        expect(created.length).toBeGreaterThan(0);
    });

    it('toastInfo creates elements', async () => {
        const { toastInfo } = await import('../toast');
        expect(() => toastInfo('FYI')).not.toThrow();
        expect(created.length).toBeGreaterThan(0);
    });

    it('multiple toasts stack without throwing', async () => {
        const { toastSuccess, toastError, toastInfo } = await import('../toast');
        expect(() => {
            toastSuccess('First');
            toastError('Second');
            toastInfo('Third');
        }).not.toThrow();
    });
});
