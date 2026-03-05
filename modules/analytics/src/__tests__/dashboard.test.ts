/**
 * AN-B1 — campaignDashboardReadModel() Tests
 */

import { describe, test, expect } from 'vitest';
import { campaignDashboardReadModel } from '../dashboard';
import type { DomainEvent, EntityId } from '../../../core/src/types';

// ─── Helpers ──────────────────────────────────────────────────────

const CAMP_ID = 'camp_000001' as EntityId;
const PLAN_ID = 'plan_000001' as EntityId;
const VAR_ID = 'var_000001' as EntityId;
const ITEM_ID = 'item_000001' as EntityId;

function makeMetricEvent(channel: string, entityId: EntityId = CAMP_ID): DomainEvent {
    return {
        id: ITEM_ID,
        name: 'PublishDispatched',
        entityId,
        timestamp: new Date().toISOString(),
        payload: {
            channel,
            impressions: 1000,
            clicks: 100,
            leads: 10,
            spend: 200,
            revenue: 800,
        },
    };
}

function makeStageEvent(stage: string, planId: EntityId = PLAN_ID): DomainEvent {
    return {
        id: ITEM_ID,
        name: 'FunnelPlanCreated',
        entityId: CAMP_ID,
        timestamp: new Date().toISOString(),
        payload: { planId, stage, entered: 5000, converted: 1500 },
    };
}

function makeVariantEvent(variantId: EntityId, channel: string): DomainEvent {
    return {
        id: ITEM_ID,
        name: 'VariantsScored',
        entityId: CAMP_ID,
        timestamp: new Date().toISOString(),
        payload: {
            variantId,
            channel,
            impressions: 3000,
            clicks: 240,
            conversions: 18,
            score: 79,
        },
    };
}

// ─── Tests ────────────────────────────────────────────────────────

describe('campaignDashboardReadModel()', () => {
    describe('shape', () => {
        test('returns an object with attribution, funnel, and variants fields', () => {
            const result = campaignDashboardReadModel([]);
            expect(result).toHaveProperty('attribution');
            expect(result).toHaveProperty('funnel');
            expect(result).toHaveProperty('variants');
        });

        test('attribution is an AttributionSnapshot', () => {
            const result = campaignDashboardReadModel([makeMetricEvent('meta')]);
            expect(result.attribution).toHaveProperty('campaignId');
            expect(result.attribution).toHaveProperty('totalSpend');
            expect(result.attribution).toHaveProperty('byChannel');
        });

        test('funnel is an array', () => {
            const result = campaignDashboardReadModel([]);
            expect(Array.isArray(result.funnel)).toBe(true);
        });

        test('variants is an array', () => {
            const result = campaignDashboardReadModel([]);
            expect(Array.isArray(result.variants)).toBe(true);
        });
    });

    describe('attribution aggregation', () => {
        test('attribution reflects metric events', () => {
            const events = [makeMetricEvent('meta'), makeMetricEvent('linkedin')];
            const result = campaignDashboardReadModel(events);
            expect(result.attribution.byChannel).toHaveLength(2);
            expect(result.attribution.totalSpend).toBe(400);
        });
    });

    describe('funnel aggregation', () => {
        test('funnel is empty when no planId is provided', () => {
            const events = [makeStageEvent('awareness')];
            const result = campaignDashboardReadModel(events);
            expect(result.funnel).toHaveLength(0);
        });

        test('funnel is populated when planId matches events', () => {
            const events = [
                makeStageEvent('awareness', PLAN_ID),
                makeStageEvent('consideration', PLAN_ID),
            ];
            const result = campaignDashboardReadModel(events, PLAN_ID);
            expect(result.funnel).toHaveLength(2);
        });

        test('funnel is empty when planId has no matching events (graceful fallback)', () => {
            const unknownPlan = 'plan_999999' as EntityId;
            const events = [makeStageEvent('awareness', PLAN_ID)];
            const result = campaignDashboardReadModel(events, unknownPlan);
            expect(result.funnel).toHaveLength(0);
        });
    });

    describe('variant aggregation', () => {
        test('variants reflect variant-metric events', () => {
            const events = [
                makeVariantEvent(VAR_ID, 'meta'),
                makeVariantEvent('var_000002' as EntityId, 'linkedin'),
            ];
            const result = campaignDashboardReadModel(events);
            expect(result.variants).toHaveLength(2);
        });

        test('variants is empty when no variant events are present', () => {
            const events = [makeMetricEvent('meta')];
            const result = campaignDashboardReadModel(events);
            expect(result.variants).toHaveLength(0);
        });
    });

    describe('combined event stream', () => {
        test('merges attribution, funnel, and variant data from same event array', () => {
            const events = [
                makeMetricEvent('meta'),
                makeStageEvent('awareness', PLAN_ID),
                makeVariantEvent(VAR_ID, 'meta'),
            ];
            const result = campaignDashboardReadModel(events, PLAN_ID);
            expect(result.attribution.byChannel).toHaveLength(1);
            expect(result.funnel).toHaveLength(1);
            expect(result.variants).toHaveLength(1);
        });
    });

    describe('determinism', () => {
        test('same events produce same result', () => {
            const events = [
                makeMetricEvent('meta'),
                makeStageEvent('awareness', PLAN_ID),
                makeVariantEvent(VAR_ID, 'meta'),
            ];
            const r1 = campaignDashboardReadModel(events, PLAN_ID);
            const r2 = campaignDashboardReadModel(events, PLAN_ID);
            expect(r1.attribution.totalSpend).toBe(r2.attribution.totalSpend);
            expect(r1.funnel.length).toBe(r2.funnel.length);
            expect(r1.variants.length).toBe(r2.variants.length);
        });
    });
});
