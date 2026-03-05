/**
 * FUN-A1 — createFunnelPlan() Tests
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { createFunnelPlan } from '../plan';
import type { CampaignBrief, EntityId, FunnelStageName } from '../../../core/src/types';

const VALID_BRIEF: CampaignBrief = {
    id: 'brief_000001' as EntityId,
    offerName: 'Growth Blueprint',
    audience: 'E-commerce store owners',
    channels: ['meta', 'email'],
    goals: ['generate leads'],
    createdAt: new Date().toISOString(),
};

const STAGE_ORDER: FunnelStageName[] = ['awareness', 'consideration', 'decision'];

describe('createFunnelPlan()', () => {
    describe('valid brief', () => {
        test('returns ok=true with a plan', () => {
            const result = createFunnelPlan(VALID_BRIEF);
            expect(result.ok).toBe(true);
            expect(result.plan).toBeDefined();
        });

        test('plan has a plan_ id', () => {
            const result = createFunnelPlan(VALID_BRIEF);
            expect(result.plan?.id).toMatch(/^plan_/);
        });

        test('plan.briefId matches brief.id', () => {
            const result = createFunnelPlan(VALID_BRIEF);
            expect(result.plan?.briefId).toBe(VALID_BRIEF.id);
        });

        test('produces exactly 3 stages in awareness→consideration→decision order', () => {
            const result = createFunnelPlan(VALID_BRIEF);
            const names = result.plan?.stages.map(s => s.name);
            expect(names).toEqual(STAGE_ORDER);
        });

        test('every stage has at least one CTA', () => {
            const result = createFunnelPlan(VALID_BRIEF);
            for (const stage of result.plan?.stages ?? []) {
                expect(stage.ctas.length).toBeGreaterThan(0);
            }
        });

        test('every stage inherits channels from the brief', () => {
            const result = createFunnelPlan(VALID_BRIEF);
            for (const stage of result.plan?.stages ?? []) {
                expect(stage.channels).toEqual(VALID_BRIEF.channels);
            }
        });

        test('stage channels is a copy — not same reference as brief.channels', () => {
            const result = createFunnelPlan(VALID_BRIEF);
            expect(result.plan?.stages[0].channels).not.toBe(VALID_BRIEF.channels);
        });

        test('works with all 4 channels', () => {
            const brief: CampaignBrief = { ...VALID_BRIEF, channels: ['meta', 'linkedin', 'x', 'email'] };
            const result = createFunnelPlan(brief);
            expect(result.ok).toBe(true);
            expect(result.plan?.stages).toHaveLength(3);
        });

        test('same inputs produce same stage structure (deterministic)', () => {
            const r1 = createFunnelPlan(VALID_BRIEF);
            const r2 = createFunnelPlan(VALID_BRIEF);
            // Names and CTAs should be the same; IDs will differ
            expect(r1.plan?.stages.map(s => s.name)).toEqual(r2.plan?.stages.map(s => s.name));
            expect(r1.plan?.stages.map(s => s.ctas)).toEqual(r2.plan?.stages.map(s => s.ctas));
        });
    });

    describe('invalid brief', () => {
        test('null-ish brief (null/undefined) returns FUNNEL_STAGE_INVALID', () => {
            // The implementation guards against null/non-object brief
            const result = createFunnelPlan(null as unknown as CampaignBrief);
            expect(result.ok).toBe(false);
            expect(result.error?.code).toBe('FUNNEL_STAGE_INVALID');
        });

        test('brief with empty channels returns CTA_MISSING', () => {
            const result = createFunnelPlan({ ...VALID_BRIEF, channels: [] });
            expect(result.ok).toBe(false);
            expect(result.error?.code).toBe('CTA_MISSING');
        });

        test('error module is funnel', () => {
            const result = createFunnelPlan({ ...VALID_BRIEF, channels: [] });
            expect(result.error?.module).toBe('funnel');
        });
    });
});
