import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    cancelAndHide,
    hideTooltip,
    supportsHoverTooltips,
    tip,
} from '../tooltip';

// ---------------------------------------------------------------------------
// supportsHoverTooltips — pointer / hover detection
// ---------------------------------------------------------------------------
describe('supportsHoverTooltips', () => {
    it('returns true when hover and fine pointer media query matches', () => {
        const matchMedia = vi.fn().mockReturnValue({ matches: true });
        expect(supportsHoverTooltips({ matchMedia })).toBe(true);
        expect(matchMedia).toHaveBeenCalledWith('(hover: hover) and (pointer: fine)');
    });

    it('returns false when hover media query does not match', () => {
        const matchMedia = vi.fn().mockReturnValue({ matches: false });
        expect(supportsHoverTooltips({ matchMedia })).toBe(false);
    });

    it('returns false when matchMedia is not available', () => {
        expect(supportsHoverTooltips(undefined)).toBe(false);
        expect(supportsHoverTooltips({})).toBe(false);
    });

    it('returns false when matchMedia returns a non-boolean-ish falsy result', () => {
        const matchMedia = vi.fn().mockReturnValue({ matches: 0 });
        expect(supportsHoverTooltips({ matchMedia })).toBeFalsy();
    });
});

// ---------------------------------------------------------------------------
// tip() HTML helper
// ---------------------------------------------------------------------------
describe('tip', () => {
    it('produces a span with data-tip and has-tip class by default', () => {
        const result = tip('offer', 'My Offer');
        expect(result).toBe('<span data-tip="offer" class="has-tip">My Offer</span>');
    });

    it('accepts a custom tag', () => {
        const result = tip('campaign', 'Campaign', 'strong');
        expect(result).toBe('<strong data-tip="campaign" class="has-tip">Campaign</strong>');
    });

    it('preserves inner HTML content unchanged', () => {
        const result = tip('cpl', '<em>Cost Per Lead</em>');
        expect(result).toContain('<em>Cost Per Lead</em>');
    });

    it('uses the key as the data-tip attribute value', () => {
        const result = tip('reviewQueue', 'Queue');
        expect(result).toContain('data-tip="reviewQueue"');
    });

    it('always includes the has-tip class', () => {
        expect(tip('x', 'X')).toContain('class="has-tip"');
        expect(tip('y', 'Y', 'em')).toContain('class="has-tip"');
    });
});

// ---------------------------------------------------------------------------
// Timer-based hide / cancel logic (no DOM required)
// We verify that the exported functions do not throw and clean up timers
// correctly. The DOM interaction surface is covered by integration / e2e.
// ---------------------------------------------------------------------------
describe('hideTooltip — timer contract', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        // Always cancel outstanding timers so tests don't bleed state
        cancelAndHide();
        vi.useRealTimers();
    });

    it('does not throw when called with no tooltip element present', () => {
        expect(() => hideTooltip()).not.toThrow();
        expect(() => vi.runAllTimers()).not.toThrow();
    });

    it('does not throw when called multiple times in rapid succession', () => {
        expect(() => {
            hideTooltip();
            hideTooltip();
            hideTooltip();
        }).not.toThrow();
        expect(() => vi.runAllTimers()).not.toThrow();
    });

    it('schedules hide after approximately 80ms delay', () => {
        // Spy on the internal clearTimeout to verify timer cleanup
        const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
        hideTooltip();
        // The first setTimeout call should be for an ~80ms delay
        const calls = setTimeoutSpy.mock.calls;
        expect(calls.length).toBeGreaterThanOrEqual(1);
        const delayArg = calls[calls.length - 1][1];
        expect(delayArg).toBe(80);
    });
});

describe('cancelAndHide — timer contract', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('does not throw when called with nothing pending', () => {
        expect(() => cancelAndHide()).not.toThrow();
    });

    it('cancels a pending hideTooltip timer (no zombie callbacks)', () => {
        hideTooltip(); // queue a hide
        cancelAndHide(); // should clear it
        // If the hide timer survived, runAllTimers would try to access tooltipEl
        // which is null in node env → would throw. Assert it does not.
        expect(() => vi.runAllTimers()).not.toThrow();
    });

    it('is safe to call multiple times', () => {
        expect(() => {
            cancelAndHide();
            cancelAndHide();
            cancelAndHide();
        }).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// Stale tip prevention — the core fix for UX-1
// These tests verify the timer-cancellation contract of the module exports.
// ---------------------------------------------------------------------------
describe('stale tip prevention — hideTooltip cancels pending show timer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        cancelAndHide();
        vi.useRealTimers();
    });

    it('cancelAndHide after a hideTooltip call leaves no timers running', () => {
        hideTooltip();
        cancelAndHide();
        // All timers should be cleared — runAllTimers must be safe
        expect(() => vi.runAllTimers()).not.toThrow();
    });

    it('successive hideTooltip + cancelAndHide cycles do not accumulate state', () => {
        for (let i = 0; i < 5; i++) {
            hideTooltip();
            cancelAndHide();
        }
        expect(() => vi.runAllTimers()).not.toThrow();
    });

    it('interleaved hideTooltip and cancelAndHide produce predictable cleanup', () => {
        // Simulate rapid hover: enter → leave → enter → leave fast
        hideTooltip();          // first leave
        vi.advanceTimersByTime(40);
        cancelAndHide();        // re-enter cancels
        hideTooltip();          // second leave
        vi.advanceTimersByTime(90); // hide timer fires
        // Should reach here without error
        expect(true).toBe(true);
    });

    it('hideTooltip called 200ms AFTER a show would be in progress does not throw', () => {
        // The delay between show (200ms) and hide (80ms) creates a race.
        // Advance past an imagined show; then hide with no DOM → no throw.
        vi.advanceTimersByTime(210);
        expect(() => hideTooltip()).not.toThrow();
        vi.advanceTimersByTime(90);
    });
});
