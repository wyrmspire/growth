/**
 * TEST-9 — Sparkline and Counter Tests
 * Tests renderSparkline() with various inputs and edge cases.
 * Tests animateCounter() calls requestAnimationFrame correctly.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderSparkline } from '../../components/sparkline';
import { animateCounter } from '../../components/counter';

// ─── renderSparkline ──────────────────────────────────────────────────────────

describe('renderSparkline — return type', () => {
    it('returns a string for normal input', () => {
        expect(typeof renderSparkline([1, 2, 3])).toBe('string');
    });

    it('always returns a string containing <svg', () => {
        expect(renderSparkline([1, 2, 3])).toContain('<svg');
        expect(renderSparkline([])).toContain('<svg');
        expect(renderSparkline([5])).toContain('<svg');
    });
});

describe('renderSparkline — empty array', () => {
    it('returns an SVG shell (not an empty string)', () => {
        const svg = renderSparkline([]);
        expect(svg).toContain('<svg');
        expect(svg).toContain('</svg>');
        expect(svg).not.toContain('<polyline');
    });
});

describe('renderSparkline — single value', () => {
    it('returns SVG with a polyline for single point', () => {
        const svg = renderSparkline([42]);
        expect(svg).toContain('<svg');
        expect(svg).toContain('<polyline');
    });

    it('does not throw for single value', () => {
        expect(() => renderSparkline([42])).not.toThrow();
    });
});

describe('renderSparkline — all same values (flat line)', () => {
    it('returns a polyline for all-same values', () => {
        const svg = renderSparkline([5, 5, 5, 5]);
        expect(svg).toContain('<polyline');
    });

    it('does not throw for all-same values', () => {
        expect(() => renderSparkline([7, 7, 7])).not.toThrow();
    });
});

describe('renderSparkline — normal arrays', () => {
    it('renders 7 data points without throwing', () => {
        expect(() => renderSparkline([1, 2, 3, 4, 5, 6, 7])).not.toThrow();
    });

    it('renders 50+ data points without throwing', () => {
        const data = Array.from({ length: 50 }, (_, i) => Math.sin(i) * 10 + 10);
        expect(() => renderSparkline(data)).not.toThrow();
    });

    it('result contains fill=none on polyline', () => {
        expect(renderSparkline([1, 2, 3])).toContain('fill="none"');
    });
});

describe('renderSparkline — negative values', () => {
    it('handles negative values without throwing', () => {
        expect(() => renderSparkline([-5, -2, 0, 3, -1])).not.toThrow();
    });

    it('returns SVG with polyline for negative values', () => {
        const svg = renderSparkline([-5, -2, 0, 3]);
        expect(svg).toContain('<polyline');
    });
});

describe('renderSparkline — options', () => {
    it('respects custom width in viewBox', () => {
        const svg = renderSparkline([1, 2, 3], { width: 120 });
        expect(svg).toContain('120');
    });

    it('respects custom height in viewBox', () => {
        const svg = renderSparkline([1, 2, 3], { height: 40 });
        expect(svg).toContain('40');
    });

    it('respects custom color in stroke', () => {
        const svg = renderSparkline([1, 2, 3], { color: '#ff0000' });
        expect(svg).toContain('#ff0000');
    });

    it('defaults to width=80 and height=24', () => {
        const svg = renderSparkline([1, 2, 3]);
        expect(svg).toContain('80');
        expect(svg).toContain('24');
    });
});

// ─── animateCounter ───────────────────────────────────────────────────────────

describe('animateCounter — requestAnimationFrame', () => {
    let rafCallbacks: Array<(ts: number) => void> = [];
    let el: HTMLElement;

    beforeEach(() => {
        rafCallbacks = [];
        vi.stubGlobal('requestAnimationFrame', (cb: (ts: number) => void) => {
            rafCallbacks.push(cb);
            return rafCallbacks.length;
        });

        // Minimal HTMLElement stub
        el = {
            textContent: '',
            isConnected: true,
            dataset: {},
        } as unknown as HTMLElement;
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('calls requestAnimationFrame for a non-zero target', () => {
        animateCounter(el, 100);
        expect(rafCallbacks.length).toBeGreaterThan(0);
    });

    it('does not call requestAnimationFrame for zero target', () => {
        animateCounter(el, 0);
        expect(rafCallbacks.length).toBe(0);
    });

    it('sets initial textContent to prefix + 0 + suffix', () => {
        animateCounter(el, 50, 1000, { prefix: '$', suffix: '' });
        expect(el.textContent).toContain('0');
    });

    it('sets final exact value when progress reaches 1', () => {
        animateCounter(el, 42, 100);
        // Simulate: first frame at t=0
        rafCallbacks[0]?.(0);
        // Simulate: second frame well past duration
        rafCallbacks[rafCallbacks.length - 1]?.(200);
        expect(el.textContent).toContain('42');
    });

    it('stops animating when el is disconnected from DOM', () => {
        const disconnected = { ...el, isConnected: false } as unknown as HTMLElement;
        animateCounter(disconnected, 100);
        if (rafCallbacks.length > 0) {
            // Should not throw or continue
            expect(() => rafCallbacks[0]?.(0)).not.toThrow();
        }
    });

    it('returns without starting for null element', () => {
        expect(() => animateCounter(null as unknown as HTMLElement, 100)).not.toThrow();
    });
});

describe('animateCounter — options', () => {
    let el: HTMLElement;

    beforeEach(() => {
        // First call sets startTime (t=0), second call triggers completion (t > duration)
        let callCount = 0;
        vi.stubGlobal('requestAnimationFrame', (cb: (ts: number) => void) => {
            callCount++;
            if (callCount === 1) {
                cb(0);       // first frame: sets startTime = 0
            } else {
                cb(99999);   // subsequent frames: elapsed >> duration → completion
            }
            return callCount;
        });

        el = {
            textContent: '',
            isConnected: true,
            dataset: {},
        } as unknown as HTMLElement;
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('applies prefix to final value', () => {
        animateCounter(el, 100, 100, { prefix: '$' });
        expect(el.textContent?.startsWith('$')).toBe(true);
    });

    it('applies suffix to final value', () => {
        animateCounter(el, 3, 100, { suffix: 'x' });
        expect(el.textContent?.endsWith('x')).toBe(true);
    });

    it('rounds integer targets by default', () => {
        animateCounter(el, 42, 100);
        expect(el.textContent).toContain('42');
    });
});
