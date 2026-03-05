import { describe, expect, it, vi } from 'vitest';
import { supportsHoverTooltips } from '../tooltip';

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
});
