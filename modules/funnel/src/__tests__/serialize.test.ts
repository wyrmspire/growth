/**
 * FUN-B2 — serializeFunnelPlan() / deserializeFunnelPlan() Tests
 */

import { describe, test, expect } from 'vitest';
import { serializeFunnelPlan, deserializeFunnelPlan } from '../serialize';
import { createFunnelPlan } from '../plan';
import type { CampaignBrief, EntityId, FunnelPlan } from '../../../core/src/types';

// ─── Helpers ──────────────────────────────────────────────────────

const BRIEF: CampaignBrief = {
    id: 'brief_000002' as EntityId,
    offerName: 'Growth Blueprint',
    audience: 'Freelancers',
    channels: ['linkedin', 'email'],
    goals: ['book demos'],
    createdAt: new Date().toISOString(),
};

function makePlan(): FunnelPlan {
    const result = createFunnelPlan(BRIEF);
    if (!result.ok || !result.plan) throw new Error('Plan creation failed in test setup');
    return result.plan;
}

// ─── Tests ────────────────────────────────────────────────────────

describe('serializeFunnelPlan()', () => {
    test('returns an object with planId, briefId, stages, serializedAt', () => {
        const payload = serializeFunnelPlan(makePlan());
        expect(payload).toHaveProperty('planId');
        expect(payload).toHaveProperty('briefId');
        expect(payload).toHaveProperty('stages');
        expect(payload).toHaveProperty('serializedAt');
    });

    test('planId matches the original plan id', () => {
        const plan = makePlan();
        const payload = serializeFunnelPlan(plan);
        expect(payload.planId).toBe(plan.id as string);
    });

    test('briefId matches the original plan briefId', () => {
        const plan = makePlan();
        const payload = serializeFunnelPlan(plan);
        expect(payload.briefId).toBe(plan.briefId as string);
    });

    test('preserves all 3 stages', () => {
        const payload = serializeFunnelPlan(makePlan());
        expect(payload.stages).toHaveLength(3);
    });

    test('stage names are preserved as strings', () => {
        const payload = serializeFunnelPlan(makePlan());
        expect(payload.stages.map(s => s.name)).toEqual(['awareness', 'consideration', 'decision']);
    });

    test('stage channels are plain string arrays (not branded types)', () => {
        const payload = serializeFunnelPlan(makePlan());
        for (const stage of payload.stages) {
            expect(Array.isArray(stage.channels)).toBe(true);
            stage.channels.forEach(c => expect(typeof c).toBe('string'));
        }
    });

    test('stage ctas are preserved', () => {
        const payload = serializeFunnelPlan(makePlan());
        for (const stage of payload.stages) {
            expect(Array.isArray(stage.ctas)).toBe(true);
            expect(stage.ctas.length).toBeGreaterThan(0);
        }
    });

    test('serializedAt is a valid ISO timestamp', () => {
        const payload = serializeFunnelPlan(makePlan());
        expect(() => new Date(payload.serializedAt)).not.toThrow();
        expect(new Date(payload.serializedAt).toISOString()).toBe(payload.serializedAt);
    });

    test('payload is JSON-serializable (no circular refs or non-serializable values)', () => {
        const payload = serializeFunnelPlan(makePlan());
        expect(() => JSON.stringify(payload)).not.toThrow();
    });

    test('does not mutate the original plan', () => {
        const plan = makePlan();
        const originalStages = JSON.stringify(plan.stages);
        serializeFunnelPlan(plan);
        expect(JSON.stringify(plan.stages)).toBe(originalStages);
    });
});

describe('deserializeFunnelPlan()', () => {
    test('round-trips: serialize then deserialize restores stage names', () => {
        const plan = makePlan();
        const payload = serializeFunnelPlan(plan);
        const restored = deserializeFunnelPlan(payload);
        expect(restored.stages.map(s => s.name)).toEqual(plan.stages.map(s => s.name));
    });

    test('round-trips: restored plan has same planId', () => {
        const plan = makePlan();
        const restored = deserializeFunnelPlan(serializeFunnelPlan(plan));
        expect(restored.id as string).toBe(plan.id as string);
    });

    test('round-trips: restored plan has same briefId', () => {
        const plan = makePlan();
        const restored = deserializeFunnelPlan(serializeFunnelPlan(plan));
        expect(restored.briefId as string).toBe(plan.briefId as string);
    });

    test('round-trips: ctas are preserved', () => {
        const plan = makePlan();
        const restored = deserializeFunnelPlan(serializeFunnelPlan(plan));
        for (let i = 0; i < plan.stages.length; i++) {
            expect(restored.stages[i].ctas).toEqual(plan.stages[i].ctas);
        }
    });

    test('deserialized channels are independent copies (no shared references)', () => {
        const plan = makePlan();
        const payload = serializeFunnelPlan(plan);
        const restored = deserializeFunnelPlan(payload);
        expect(restored.stages[0].channels).not.toBe(payload.stages[0].channels);
    });

    test('throws FUNNEL_STAGE_INVALID on unknown stage name in payload', () => {
        const plan = makePlan();
        const payload = serializeFunnelPlan(plan);
        payload.stages[0].name = 'invalid-stage';
        expect(() => deserializeFunnelPlan(payload)).toThrow(/FUNNEL_STAGE_INVALID/);
    });
});

