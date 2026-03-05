/**
 * AN-A2 — projectFunnelConversion() Tests
 */

import { describe, test, expect } from 'vitest';
import { projectFunnelConversion } from '../funnel';
import type { DomainEvent, EntityId } from '../../../core/src/types';

// ─── Helpers ──────────────────────────────────────────────────────

const PLAN_ID = 'plan_000001' as EntityId;
const CAMP_ID = 'camp_000001' as EntityId;
const ITEM_ID = 'item_000001' as EntityId;

function makeStageEvent(
    stage: string,
    entered: number,
    converted: number,
    planId: EntityId = PLAN_ID,
): DomainEvent {
    return {
        id: ITEM_ID,
        name: 'FunnelPlanCreated',
        entityId: CAMP_ID,
        timestamp: new Date().toISOString(),
        payload: { planId, stage, entered, converted },
    };
}

// ─── Tests ────────────────────────────────────────────────────────

describe('projectFunnelConversion()', () => {
    describe('valid events', () => {
        test('returns rows for each stage present in events', () => {
            const events = [
                makeStageEvent('awareness', 10000, 3000),
                makeStageEvent('consideration', 3000, 900),
                makeStageEvent('decision', 900, 90),
            ];
            const rows = projectFunnelConversion(events, PLAN_ID);
            expect(rows).toHaveLength(3);
        });

        test('rows have correct stage names', () => {
            const events = [
                makeStageEvent('awareness', 10000, 3000),
                makeStageEvent('consideration', 3000, 900),
                makeStageEvent('decision', 900, 90),
            ];
            const rows = projectFunnelConversion(events, PLAN_ID);
            expect(rows.map(r => r.stage)).toEqual(['awareness', 'consideration', 'decision']);
        });

        test('returns stages in deterministic order (awareness→consideration→decision)', () => {
            // Provide events out of order
            const events = [
                makeStageEvent('decision', 900, 90),
                makeStageEvent('awareness', 10000, 3000),
                makeStageEvent('consideration', 3000, 900),
            ];
            const rows = projectFunnelConversion(events, PLAN_ID);
            expect(rows[0].stage).toBe('awareness');
            expect(rows[1].stage).toBe('consideration');
            expect(rows[2].stage).toBe('decision');
        });

        test('computes conversion rate correctly', () => {
            const events = [makeStageEvent('awareness', 10000, 3000)];
            const rows = projectFunnelConversion(events, PLAN_ID);
            // rate = 3000 / 10000 * 100 = 30.0
            expect(rows[0].rate).toBe(30);
        });

        test('rate is 0 when entered is 0', () => {
            const events = [makeStageEvent('awareness', 0, 0)];
            const rows = projectFunnelConversion(events, PLAN_ID);
            expect(rows[0].rate).toBe(0);
        });

        test('entered and converted values match event payload', () => {
            const events = [makeStageEvent('consideration', 5000, 1500)];
            const rows = projectFunnelConversion(events, PLAN_ID);
            expect(rows[0].entered).toBe(5000);
            expect(rows[0].converted).toBe(1500);
        });

        test('accumulates multiple events for the same stage', () => {
            const events = [
                makeStageEvent('awareness', 5000, 1500),
                makeStageEvent('awareness', 5000, 1500),
            ];
            const rows = projectFunnelConversion(events, PLAN_ID);
            expect(rows[0].entered).toBe(10000);
            expect(rows[0].converted).toBe(3000);
        });

        test('only returns stages that have matching events', () => {
            const events = [makeStageEvent('awareness', 10000, 3000)];
            const rows = projectFunnelConversion(events, PLAN_ID);
            expect(rows).toHaveLength(1);
            expect(rows[0].stage).toBe('awareness');
        });
    });

    describe('planId filtering', () => {
        test('only includes events matching the requested planId', () => {
            const otherPlan = 'plan_000002' as EntityId;
            const events = [
                makeStageEvent('awareness', 10000, 3000, PLAN_ID),
                makeStageEvent('consideration', 3000, 900, otherPlan),
            ];
            const rows = projectFunnelConversion(events, PLAN_ID);
            expect(rows).toHaveLength(1);
            expect(rows[0].stage).toBe('awareness');
        });
    });

    describe('determinism', () => {
        test('same events produce same rows', () => {
            const events = [
                makeStageEvent('awareness', 10000, 3000),
                makeStageEvent('consideration', 3000, 900),
            ];
            const r1 = projectFunnelConversion(events, PLAN_ID);
            const r2 = projectFunnelConversion(events, PLAN_ID);
            expect(r1).toEqual(r2);
        });

        test('does not mutate input events', () => {
            const events = [makeStageEvent('awareness', 10000, 3000)];
            const frozen = JSON.stringify(events);
            projectFunnelConversion(events, PLAN_ID);
            expect(JSON.stringify(events)).toBe(frozen);
        });
    });

    describe('error handling', () => {
        test('throws FUNNEL_PLAN_UNKNOWN when no events match planId', () => {
            const events = [makeStageEvent('awareness', 10000, 3000)];
            const unknownId = 'plan_999999' as EntityId;
            try {
                projectFunnelConversion(events, unknownId);
                expect.fail('should have thrown');
            } catch (err) {
                expect((err as { code: string }).code).toBe('FUNNEL_PLAN_UNKNOWN');
                expect((err as { module: string }).module).toBe('analytics');
            }
        });

        test('throws FUNNEL_PLAN_UNKNOWN for empty event array', () => {
            try {
                projectFunnelConversion([], PLAN_ID);
                expect.fail('should have thrown');
            } catch (err) {
                expect((err as { code: string }).code).toBe('FUNNEL_PLAN_UNKNOWN');
            }
        });
    });
});
