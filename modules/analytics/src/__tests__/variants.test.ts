/**
 * AN-A3 — projectVariantPerformance() Tests
 */

import { describe, test, expect } from 'vitest';
import { projectVariantPerformance } from '../variants';
import type { DomainEvent, EntityId } from '../../../core/src/types';

// ─── Helpers ──────────────────────────────────────────────────────

const CAMP_ID = 'camp_000001' as EntityId;
const ITEM_ID = 'item_000001' as EntityId;
const VAR_ID_1 = 'var_000001' as EntityId;
const VAR_ID_2 = 'var_000002' as EntityId;

function makeVariantEvent(
    variantId: EntityId,
    channel: string,
    metrics: { impressions?: number; clicks?: number; conversions?: number; score?: number } = {},
): DomainEvent {
    return {
        id: ITEM_ID,
        name: 'VariantsScored',
        entityId: CAMP_ID,
        timestamp: new Date().toISOString(),
        payload: {
            variantId,
            channel,
            impressions: 5000,
            clicks: 400,
            conversions: 30,
            score: 85,
            ...metrics,
        },
    };
}

// ─── Tests ────────────────────────────────────────────────────────

describe('projectVariantPerformance()', () => {
    describe('empty event stream', () => {
        test('returns empty array', () => {
            expect(projectVariantPerformance([])).toEqual([]);
        });
    });

    describe('single variant event', () => {
        test('returns one VariantPerformanceRow', () => {
            const events = [makeVariantEvent(VAR_ID_1, 'meta')];
            const rows = projectVariantPerformance(events);
            expect(rows).toHaveLength(1);
        });

        test('row has correct variantId and channel', () => {
            const events = [makeVariantEvent(VAR_ID_1, 'linkedin')];
            const rows = projectVariantPerformance(events);
            expect(rows[0].variantId).toBe(VAR_ID_1);
            expect(rows[0].channel).toBe('linkedin');
        });

        test('row has correct metric values', () => {
            const events = [
                makeVariantEvent(VAR_ID_1, 'meta', {
                    impressions: 3000,
                    clicks: 240,
                    conversions: 18,
                    score: 79,
                }),
            ];
            const rows = projectVariantPerformance(events);
            expect(rows[0].impressions).toBe(3000);
            expect(rows[0].clicks).toBe(240);
            expect(rows[0].conversions).toBe(18);
            expect(rows[0].score).toBe(79);
        });
    });

    describe('multiple variant events', () => {
        test('returns one row per variant event', () => {
            const events = [
                makeVariantEvent(VAR_ID_1, 'meta'),
                makeVariantEvent(VAR_ID_2, 'linkedin'),
            ];
            const rows = projectVariantPerformance(events);
            expect(rows).toHaveLength(2);
        });

        test('rows preserve order of input events', () => {
            const events = [
                makeVariantEvent(VAR_ID_1, 'meta'),
                makeVariantEvent(VAR_ID_2, 'x'),
            ];
            const rows = projectVariantPerformance(events);
            expect(rows[0].variantId).toBe(VAR_ID_1);
            expect(rows[1].variantId).toBe(VAR_ID_2);
        });
    });

    describe('non-variant events are ignored', () => {
        test('events without variantId payload are excluded', () => {
            const events: DomainEvent[] = [
                {
                    id: ITEM_ID,
                    name: 'InterviewCaptured',
                    entityId: CAMP_ID,
                    timestamp: new Date().toISOString(),
                    payload: { channel: 'meta' },
                },
            ];
            expect(projectVariantPerformance(events)).toHaveLength(0);
        });

        test('events without channel payload are excluded', () => {
            const events: DomainEvent[] = [
                {
                    id: ITEM_ID,
                    name: 'VariantsScored',
                    entityId: CAMP_ID,
                    timestamp: new Date().toISOString(),
                    payload: { variantId: VAR_ID_1 },
                },
            ];
            expect(projectVariantPerformance(events)).toHaveLength(0);
        });
    });

    describe('default values for missing metric fields', () => {
        test('impressions defaults to 0 when absent', () => {
            const events: DomainEvent[] = [
                {
                    id: ITEM_ID,
                    name: 'VariantsScored',
                    entityId: CAMP_ID,
                    timestamp: new Date().toISOString(),
                    payload: { variantId: VAR_ID_1, channel: 'meta' },
                },
            ];
            const rows = projectVariantPerformance(events);
            expect(rows[0].impressions).toBe(0);
            expect(rows[0].clicks).toBe(0);
            expect(rows[0].conversions).toBe(0);
            expect(rows[0].score).toBe(0);
        });
    });

    describe('determinism', () => {
        test('same events produce same rows', () => {
            const events = [
                makeVariantEvent(VAR_ID_1, 'meta'),
                makeVariantEvent(VAR_ID_2, 'linkedin'),
            ];
            expect(projectVariantPerformance(events)).toEqual(
                projectVariantPerformance(events),
            );
        });

        test('does not mutate input events', () => {
            const events = [makeVariantEvent(VAR_ID_1, 'meta')];
            const frozen = JSON.stringify(events);
            projectVariantPerformance(events);
            expect(JSON.stringify(events)).toBe(frozen);
        });
    });

    describe('error handling', () => {
        test('throws VARIANT_METRIC_INVALID when score is a string', () => {
            const events = [makeVariantEvent(VAR_ID_1, 'meta', { score: 'bad' as unknown as number })];
            expect(() => projectVariantPerformance(events)).toThrow();
        });

        test('thrown error has code VARIANT_METRIC_INVALID', () => {
            const events = [makeVariantEvent(VAR_ID_1, 'meta', { clicks: 'bad' as unknown as number })];
            try {
                projectVariantPerformance(events);
                expect.fail('should have thrown');
            } catch (err) {
                expect((err as { code: string }).code).toBe('VARIANT_METRIC_INVALID');
                expect((err as { module: string }).module).toBe('analytics');
            }
        });
    });
});
