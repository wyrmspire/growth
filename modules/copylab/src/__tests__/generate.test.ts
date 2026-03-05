import { describe, expect, test } from 'vitest';
import type { CampaignBrief, EntityId, FunnelPlan } from '@core/types';
import { generateVariants } from '../generate';

const BRIEF: CampaignBrief = {
    id: 'brief_000001' as EntityId,
    offerName: 'Growth Sprint',
    audience: 'Owner-operators',
    channels: ['meta', 'linkedin'],
    goals: ['book calls'],
    createdAt: new Date().toISOString(),
};

const PLAN: FunnelPlan = {
    id: 'plan_000001' as EntityId,
    briefId: BRIEF.id,
    stages: [
        { name: 'awareness', channels: ['meta', 'linkedin'], ctas: ['Learn more'] },
        { name: 'consideration', channels: ['meta'], ctas: ['See proof'] },
        { name: 'decision', channels: ['linkedin'], ctas: ['Book now'] },
    ],
};

describe('generateVariants()', () => {
    test('returns at least one variant per stage channel', () => {
        const result = generateVariants(BRIEF, PLAN);
        expect(result.briefId).toBe(BRIEF.id);
        expect(result.variants).toHaveLength(4);
    });

    test('tags every variant with policy version', () => {
        const result = generateVariants(BRIEF, PLAN);
        for (const variant of result.variants) {
            expect(variant.policyVersion).toBe(result.policyVersion);
        }
    });

    test('throws COPY_POLICY_VIOLATION for unknown policy version', () => {
        expect(() => generateVariants(BRIEF, PLAN, { policyVersion: '0.0.0' })).toThrow('COPY_POLICY_VIOLATION');
    });

    test('variant ids use var_ prefix', () => {
        const result = generateVariants(BRIEF, PLAN);
        expect(result.variants.every((v) => v.id.startsWith('var_'))).toBe(true);
    });

    test('supports request-object signature from module contract', () => {
        const result = generateVariants({ brief: BRIEF, plan: PLAN });
        expect(result.variants).toHaveLength(4);
    });
});
