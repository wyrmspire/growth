/**
 * STR-B1 — collectMarketSignals() / Source Allowlist Tests
 */

import { describe, test, expect } from 'vitest';
import {
    collectMarketSignals,
    isDomainAllowed,
    normalizeDomain,
    SOURCE_ALLOWLIST,
    DEFAULT_RATE_LIMIT_POLICY,
} from '../sources';
import type { ResearchSourcePlan } from '../../../core/src/types';

// ─── Helpers ──────────────────────────────────────────────────────

function makePlan(overrides: Partial<ResearchSourcePlan> = {}): ResearchSourcePlan {
    return {
        allowedDomains: ['reddit.com', 'g2.com'],
        maxRequests: 5,
        strategy: 'api-first',
        ...overrides,
    };
}

// ─── normalizeDomain() ────────────────────────────────────────────

describe('normalizeDomain()', () => {
    test('strips www. prefix', () => {
        expect(normalizeDomain('www.reddit.com')).toBe('reddit.com');
    });

    test('handles bare domains without protocol', () => {
        expect(normalizeDomain('g2.com')).toBe('g2.com');
    });

    test('handles full URLs', () => {
        expect(normalizeDomain('https://trends.google.com/trends')).toBe('trends.google.com');
    });

    test('lowercases the result', () => {
        expect(normalizeDomain('Reddit.COM')).toBe('reddit.com');
    });
});

// ─── isDomainAllowed() ────────────────────────────────────────────

describe('isDomainAllowed()', () => {
    test('returns true for a domain in the allowlist', () => {
        expect(isDomainAllowed('reddit.com')).toBe(true);
    });

    test('returns true for a subdomain of an allowed domain', () => {
        expect(isDomainAllowed('en.reddit.com')).toBe(true);
    });

    test('returns false for a domain not in the allowlist', () => {
        expect(isDomainAllowed('evil-scraper.net')).toBe(false);
    });

    test('returns false for an empty string', () => {
        expect(isDomainAllowed('')).toBe(false);
    });

    test('all entries in SOURCE_ALLOWLIST pass the check', () => {
        for (const domain of SOURCE_ALLOWLIST) {
            expect(isDomainAllowed(domain)).toBe(true);
        }
    });
});

// ─── collectMarketSignals() ───────────────────────────────────────

describe('collectMarketSignals()', () => {
    describe('valid plan', () => {
        test('returns an array of MarketSignal objects', () => {
            const signals = collectMarketSignals(makePlan());
            expect(Array.isArray(signals)).toBe(true);
            expect(signals.length).toBeGreaterThan(0);
        });

        test('each signal has id, source, content, relevance, collectedAt', () => {
            const signals = collectMarketSignals(makePlan());
            for (const sig of signals) {
                expect(sig).toHaveProperty('id');
                expect(sig).toHaveProperty('source');
                expect(sig).toHaveProperty('content');
                expect(sig).toHaveProperty('relevance');
                expect(sig).toHaveProperty('collectedAt');
            }
        });

        test('signal id has sig_ prefix', () => {
            const signals = collectMarketSignals(makePlan());
            expect(signals[0].id).toMatch(/^sig_/);
        });

        test('collectedAt is a valid ISO timestamp', () => {
            const signals = collectMarketSignals(makePlan());
            for (const sig of signals) {
                expect(() => new Date(sig.collectedAt)).not.toThrow();
                expect(new Date(sig.collectedAt).toISOString()).toBe(sig.collectedAt);
            }
        });

        test('number of signals is capped at maxRequests', () => {
            const signals = collectMarketSignals(makePlan({ maxRequests: 1 }));
            expect(signals.length).toBeLessThanOrEqual(1);
        });

        test('respects rate-limit cap (maxRequestsPerDomain × domainCount)', () => {
            const plan = makePlan({
                allowedDomains: ['reddit.com'],
                maxRequests: DEFAULT_RATE_LIMIT_POLICY.maxRequestsPerDomain * 2,
            });
            const signals = collectMarketSignals(plan);
            // Only 1 domain → capped at maxRequestsPerDomain (10), not 20
            expect(signals.length).toBeLessThanOrEqual(DEFAULT_RATE_LIMIT_POLICY.maxRequestsPerDomain);
        });
    });

    describe('SIGNAL_SOURCE_DENIED', () => {
        test('throws when a domain is not in the allowlist', () => {
            expect(() =>
                collectMarketSignals(makePlan({ allowedDomains: ['not-allowed.io'] })),
            ).toThrow();
        });

        test('thrown error has code SIGNAL_SOURCE_DENIED', () => {
            try {
                collectMarketSignals(makePlan({ allowedDomains: ['not-allowed.io'] }));
                expect.fail('should have thrown');
            } catch (err) {
                expect((err as { code: string }).code).toBe('SIGNAL_SOURCE_DENIED');
            }
        });

        test('thrown error has module strategy', () => {
            try {
                collectMarketSignals(makePlan({ allowedDomains: ['bad-domain.com'] }));
                expect.fail('should have thrown');
            } catch (err) {
                expect((err as { module: string }).module).toBe('strategy');
            }
        });
    });

    describe('SIGNAL_COLLECTION_FAILED', () => {
        test('throws when allowedDomains is empty', () => {
            expect(() =>
                collectMarketSignals(makePlan({ allowedDomains: [] })),
            ).toThrow();
        });

        test('thrown error has code SIGNAL_COLLECTION_FAILED for empty domains', () => {
            try {
                collectMarketSignals(makePlan({ allowedDomains: [] }));
                expect.fail('should have thrown');
            } catch (err) {
                expect((err as { code: string }).code).toBe('SIGNAL_COLLECTION_FAILED');
            }
        });

        test('throws for null plan', () => {
            expect(() =>
                collectMarketSignals(null as unknown as ResearchSourcePlan),
            ).toThrow();
        });
    });
});
