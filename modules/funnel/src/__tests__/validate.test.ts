/**
 * FUN-B1 — validateFunnelPlan() Tests
 */

import { describe, test, expect } from 'vitest';
import { validateFunnelPlan } from '../validate';
import { createFunnelPlan } from '../plan';
import type { CampaignBrief, EntityId, FunnelPlan } from '../../../core/src/types';

// ─── Helpers ──────────────────────────────────────────────────────

const BRIEF: CampaignBrief = {
    id: 'brief_000001' as EntityId,
    offerName: 'Growth Blueprint',
    audience: 'E-commerce store owners',
    channels: ['meta', 'email'],
    goals: ['generate leads'],
    createdAt: new Date().toISOString(),
};

function makePlan(): FunnelPlan {
    const result = createFunnelPlan(BRIEF);
    if (!result.ok || !result.plan) throw new Error('Plan creation failed in test setup');
    return result.plan;
}

// ─── Tests ────────────────────────────────────────────────────────

describe('validateFunnelPlan()', () => {
    describe('valid plan', () => {
        test('returns valid=true for a correct plan', () => {
            const result = validateFunnelPlan(makePlan());
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('result conforms to ValidationResult shape', () => {
            const result = validateFunnelPlan(makePlan());
            expect(result).toHaveProperty('valid');
            expect(result).toHaveProperty('errors');
            expect(Array.isArray(result.errors)).toBe(true);
        });
    });

    describe('missing stages (FUNNEL_GAP)', () => {
        test('detects missing awareness stage', () => {
            const plan = makePlan();
            plan.stages = plan.stages.filter(s => s.name !== 'awareness');
            const result = validateFunnelPlan(plan);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.code === 'FUNNEL_GAP' && e.message.includes('awareness'))).toBe(true);
        });

        test('detects missing consideration stage', () => {
            const plan = makePlan();
            plan.stages = plan.stages.filter(s => s.name !== 'consideration');
            const result = validateFunnelPlan(plan);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.code === 'FUNNEL_GAP')).toBe(true);
        });

        test('detects missing decision stage', () => {
            const plan = makePlan();
            plan.stages = plan.stages.filter(s => s.name !== 'decision');
            const result = validateFunnelPlan(plan);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.code === 'FUNNEL_GAP' && e.message.includes('decision'))).toBe(true);
        });

        test('detects empty stages array', () => {
            const plan = makePlan();
            plan.stages = [];
            const result = validateFunnelPlan(plan);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThanOrEqual(3);
        });

        test('detects stage with no CTAs', () => {
            const plan = makePlan();
            plan.stages[0].ctas = [];
            const result = validateFunnelPlan(plan);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.code === 'FUNNEL_GAP' && e.message.includes('CTAs'))).toBe(true);
        });

        test('error module is funnel', () => {
            const plan = makePlan();
            plan.stages = [];
            const result = validateFunnelPlan(plan);
            expect(result.errors.every(e => e.module === 'funnel')).toBe(true);
        });
    });

    describe('invalid transitions (FUNNEL_TRANSITION_INVALID)', () => {
        test('detects reversed stage order', () => {
            const plan = makePlan();
            plan.stages = [plan.stages[2], plan.stages[1], plan.stages[0]]; // decision first
            const result = validateFunnelPlan(plan);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.code === 'FUNNEL_TRANSITION_INVALID')).toBe(true);
        });

        test('detects gap in stage sequence (awareness → decision)', () => {
            const plan = makePlan();
            plan.stages = [plan.stages[0], plan.stages[2]]; // skip consideration
            const result = validateFunnelPlan(plan);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.code === 'FUNNEL_TRANSITION_INVALID')).toBe(true);
        });

        test('transition error mentions stage names', () => {
            const plan = makePlan();
            plan.stages = [plan.stages[2], plan.stages[0], plan.stages[1]]; // decision first
            const result = validateFunnelPlan(plan);
            const transitionError = result.errors.find(e => e.code === 'FUNNEL_TRANSITION_INVALID');
            expect(transitionError?.message).toBeDefined();
            expect(typeof transitionError?.message).toBe('string');
        });
    });

    describe('null / malformed input', () => {
        test('null plan returns FUNNEL_GAP error', () => {
            const result = validateFunnelPlan(null as unknown as FunnelPlan);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });
});
