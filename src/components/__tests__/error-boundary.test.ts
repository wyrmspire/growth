/**
 * TEST-8 — Error Boundary Tests
 * Tests safePage() wrapping, error catching, fallback HTML content,
 * and clean render pass-through.
 */
import { describe, expect, it } from 'vitest';
import { safePage } from '../../components/error-boundary';

// ─── Clean renders pass through ───────────────────────────────────────────────

describe('safePage — clean renders', () => {
    it('returns the output of the render function unchanged', () => {
        const html = safePage(() => '<div>Hello</div>');
        expect(html).toBe('<div>Hello</div>');
    });

    it('passes through empty string renders', () => {
        const html = safePage(() => '');
        expect(html).toBe('');
    });

    it('passes through complex HTML without modification', () => {
        const complex = '<section class="foo"><h1>Title</h1><p>Body &amp; more</p></section>';
        expect(safePage(() => complex)).toBe(complex);
    });

    it('does not wrap the result in an extra element for clean renders', () => {
        const html = safePage(() => '<p>Clean</p>');
        expect(html).not.toContain('error-boundary');
    });
});

// ─── Error catching ───────────────────────────────────────────────────────────

describe('safePage — error catching', () => {
    it('catches a thrown Error and returns a string (does not throw)', () => {
        const result = safePage(() => { throw new Error('Boom'); });
        expect(typeof result).toBe('string');
    });

    it('catches a thrown string and returns a string', () => {
        const result = safePage(() => { throw 'string error'; });
        expect(typeof result).toBe('string');
    });

    it('catches a thrown object and returns a string', () => {
        const result = safePage(() => { throw { code: 42 }; });
        expect(typeof result).toBe('string');
    });

    it('catches undefined thrown and returns a string', () => {
        const result = safePage(() => { throw undefined; }); // eslint-disable-line @typescript-eslint/no-throw-literal
        expect(typeof result).toBe('string');
    });
});

// ─── Fallback HTML content ───────────────────────────────────────────────────

describe('safePage — fallback HTML', () => {
    it('fallback contains the .error-boundary class', () => {
        const result = safePage(() => { throw new Error('Render failed'); });
        expect(result).toContain('error-boundary');
    });

    it('fallback contains the error message (XSS-safe)', () => {
        const result = safePage(() => { throw new Error('Render failed'); });
        expect(result).toContain('Render failed');
    });

    it('escapes HTML in error messages to prevent XSS', () => {
        const result = safePage(() => { throw new Error('<script>alert(1)</script>'); });
        expect(result).not.toContain('<script>');
        expect(result).toContain('&lt;script&gt;');
    });

    it('escapes ampersands in error messages', () => {
        const result = safePage(() => { throw new Error('A & B'); });
        expect(result).toContain('&amp;');
    });

    it('fallback contains a "Try Again" button', () => {
        const result = safePage(() => { throw new Error('fail'); });
        expect(result).toContain('Try Again');
    });

    it('fallback contains a human-readable heading', () => {
        const result = safePage(() => { throw new Error('fail'); });
        const hasHeading = result.includes('Something went wrong') || result.includes('Error') || result.includes('went wrong');
        expect(hasHeading).toBe(true);
    });
});

// ─── Nested safePage ─────────────────────────────────────────────────────────

describe('safePage — nested usage', () => {
    it('outer safePage catches errors from inner safePage failing', () => {
        const result = safePage(() =>
            safePage(() => { throw new Error('inner fail'); })
        );
        // Outer should return the inner's error card without itself throwing
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });
});
