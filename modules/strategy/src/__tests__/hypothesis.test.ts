/**
 * STR-A2 — generateOfferHypotheses() Tests
 * Tests against the result-object API: { ok, hypotheses, error }
 */

import { describe, test, expect } from 'vitest';
import { generateOfferHypotheses } from '../hypothesis';
import type { DiscoveryInterview, OfferConstraints } from '../../../core/src/types';

const MOCK_INTERVIEW: DiscoveryInterview = {
    id: 'int_000001' as import('../../../core/src/types').EntityId,
    version: 1,
    data: {
        businessName: 'BrightEdge Media',
        industry: 'Marketing Agency',
        targetCustomer: 'E-commerce store owners',
        currentOfferings: ['Social media management', 'Email campaigns'],
        painPoints: ['Low conversion rates', 'Inconsistent brand voice'],
        competitiveAdvantage: 'Data-driven creative with guaranteed ROI',
    },
    capturedAt: new Date().toISOString(),
};

const CONSTRAINTS: OfferConstraints = {
    maxHypotheses: 3,
    channels: ['meta', 'email'],
};

describe('generateOfferHypotheses()', () => {
    describe('valid input', () => {
        test('returns ok=true with hypothesis array', () => {
            const result = generateOfferHypotheses(MOCK_INTERVIEW, CONSTRAINTS);
            expect(result.ok).toBe(true);
            expect(result.hypotheses).toBeDefined();
        });

        test('respects maxHypotheses constraint', () => {
            const result = generateOfferHypotheses(MOCK_INTERVIEW, { ...CONSTRAINTS, maxHypotheses: 2 });
            expect(result.hypotheses?.length).toBe(2);
        });

        test('each hypothesis has id, name, angle, icp, rationale, confidence', () => {
            const result = generateOfferHypotheses(MOCK_INTERVIEW, CONSTRAINTS);
            for (const h of result.hypotheses ?? []) {
                expect(h.id).toMatch(/^hyp_/);
                expect(h.name).toBeTruthy();
                expect(h.angle).toBeTruthy();
                expect(h.icp).toBeTruthy();
                expect(h.rationale).toBeTruthy();
                expect(typeof h.confidence).toBe('number');
            }
        });

        test('confidence is between 0 and 1 for all hypotheses', () => {
            const result = generateOfferHypotheses(MOCK_INTERVIEW, CONSTRAINTS);
            for (const h of result.hypotheses ?? []) {
                expect(h.confidence).toBeGreaterThanOrEqual(0);
                expect(h.confidence).toBeLessThanOrEqual(1);
            }
        });

        test('each hypothesis name starts with businessName', () => {
            const result = generateOfferHypotheses(MOCK_INTERVIEW, CONSTRAINTS);
            for (const h of result.hypotheses ?? []) {
                expect(h.name.startsWith('BrightEdge Media')).toBe(true);
            }
        });

        test('each hypothesis has a rank field', () => {
            const result = generateOfferHypotheses(MOCK_INTERVIEW, CONSTRAINTS);
            for (const h of result.hypotheses ?? []) {
                expect(h.rank).toBeDefined();
            }
        });

        test('hypotheses are recommendations — rationale field is non-empty prose', () => {
            const result = generateOfferHypotheses(MOCK_INTERVIEW, CONSTRAINTS);
            for (const h of result.hypotheses ?? []) {
                expect(h.rationale.length).toBeGreaterThan(20);
            }
        });

        test('generating maxHypotheses=1 returns exactly 1 hypothesis', () => {
            const result = generateOfferHypotheses(MOCK_INTERVIEW, { ...CONSTRAINTS, maxHypotheses: 1 });
            expect(result.hypotheses?.length).toBe(1);
        });

        test('generating same input twice produces different IDs (idempotent data, unique IDs)', () => {
            const r1 = generateOfferHypotheses(MOCK_INTERVIEW, { ...CONSTRAINTS, maxHypotheses: 1 });
            const r2 = generateOfferHypotheses(MOCK_INTERVIEW, { ...CONSTRAINTS, maxHypotheses: 1 });
            expect(r1.hypotheses![0].id).not.toBe(r2.hypotheses![0].id);
        });
    });

    describe('invalid input', () => {
        test('malformed interview returns HYPOTHESIS_GENERATION_FAILED', () => {
            const bad = { data: null } as unknown as DiscoveryInterview;
            const result = generateOfferHypotheses(bad, CONSTRAINTS);
            expect(result.ok).toBe(false);
            expect(result.error?.code).toBe('HYPOTHESIS_GENERATION_FAILED');
        });

        test('maxHypotheses=0 returns error', () => {
            const result = generateOfferHypotheses(MOCK_INTERVIEW, { ...CONSTRAINTS, maxHypotheses: 0 });
            expect(result.ok).toBe(false);
            expect(result.error?.code).toBe('HYPOTHESIS_GENERATION_FAILED');
        });

        test('error module is strategy', () => {
            const result = generateOfferHypotheses(MOCK_INTERVIEW, { ...CONSTRAINTS, maxHypotheses: 0 });
            expect(result.error?.module).toBe('strategy');
        });
    });
});
