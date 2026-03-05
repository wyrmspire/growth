/**
 * AN-A1 — projectAttribution() Tests
 */

import { describe, test, expect } from 'vitest';
import { projectAttribution } from '../attribution';
import type { DomainEvent, EntityId } from '../../../core/src/types';

// ─── Helpers ──────────────────────────────────────────────────────

const CAMP_ID = 'camp_000001' as EntityId;
const ITEM_ID = 'item_000001' as EntityId;

function makeMetricEvent(
    overrides: Partial<DomainEvent['payload']> & { channel: string },
    entityId: EntityId = CAMP_ID,
): DomainEvent {
    return {
        id: ITEM_ID,
        name: 'PublishDispatched',
        entityId,
        timestamp: new Date().toISOString(),
        payload: {
            impressions: 1000,
            clicks: 100,
            leads: 10,
            spend: 200,
            revenue: 800,
            ...overrides,
        },
    };
}

// ─── Tests ────────────────────────────────────────────────────────

describe('projectAttribution()', () => {
    describe('empty event stream', () => {
        test('returns zero totals with empty byChannel', () => {
            const result = projectAttribution([]);
            expect(result.totalSpend).toBe(0);
            expect(result.totalRevenue).toBe(0);
            expect(result.cpl).toBe(0);
            expect(result.roas).toBe(0);
            expect(result.byChannel).toHaveLength(0);
        });

        test('returns an AttributionSnapshot shape', () => {
            const result = projectAttribution([]);
            expect(result).toHaveProperty('campaignId');
            expect(result).toHaveProperty('totalSpend');
            expect(result).toHaveProperty('totalRevenue');
            expect(result).toHaveProperty('cpl');
            expect(result).toHaveProperty('roas');
            expect(result).toHaveProperty('byChannel');
        });
    });

    describe('single channel events', () => {
        test('returns one byChannel row for single channel', () => {
            const events = [makeMetricEvent({ channel: 'meta' })];
            const result = projectAttribution(events);
            expect(result.byChannel).toHaveLength(1);
            expect(result.byChannel[0].channel).toBe('meta');
        });

        test('campaignId matches event entityId', () => {
            const events = [makeMetricEvent({ channel: 'meta' }, CAMP_ID)];
            const result = projectAttribution(events);
            expect(result.campaignId).toBe(CAMP_ID);
        });

        test('sums metrics correctly for single event', () => {
            const events = [
                makeMetricEvent({ channel: 'meta', impressions: 500, clicks: 50, leads: 5, spend: 100, revenue: 400 }),
            ];
            const result = projectAttribution(events);
            expect(result.totalSpend).toBe(100);
            expect(result.totalRevenue).toBe(400);
        });
    });

    describe('multi-channel grouping', () => {
        test('groups events by channel', () => {
            const events = [
                makeMetricEvent({ channel: 'meta' }),
                makeMetricEvent({ channel: 'linkedin' }),
                makeMetricEvent({ channel: 'x' }),
            ];
            const result = projectAttribution(events);
            expect(result.byChannel).toHaveLength(3);
            const channels = result.byChannel.map(r => r.channel).sort();
            expect(channels).toEqual(['linkedin', 'meta', 'x']);
        });

        test('accumulates metrics for same channel across multiple events', () => {
            const events = [
                makeMetricEvent({ channel: 'meta', impressions: 1000, clicks: 80, leads: 8, spend: 100, revenue: 400 }),
                makeMetricEvent({ channel: 'meta', impressions: 2000, clicks: 160, leads: 16, spend: 200, revenue: 800 }),
            ];
            const result = projectAttribution(events);
            expect(result.byChannel).toHaveLength(1);
            expect(result.byChannel[0].impressions).toBe(3000);
            expect(result.byChannel[0].clicks).toBe(240);
            expect(result.byChannel[0].leads).toBe(24);
        });

        test('computes totalSpend as sum across all channels', () => {
            const events = [
                makeMetricEvent({ channel: 'meta', spend: 100, revenue: 400 }),
                makeMetricEvent({ channel: 'linkedin', spend: 150, revenue: 600 }),
            ];
            const result = projectAttribution(events);
            expect(result.totalSpend).toBe(250);
            expect(result.totalRevenue).toBe(1000);
        });

        test('computes cpl correctly (totalSpend / totalLeads)', () => {
            const events = [
                makeMetricEvent({ channel: 'meta', leads: 10, spend: 100, revenue: 400 }),
                makeMetricEvent({ channel: 'linkedin', leads: 15, spend: 150, revenue: 600 }),
            ];
            const result = projectAttribution(events);
            // totalSpend=250, totalLeads=25 → cpl=10
            expect(result.cpl).toBe(10);
        });

        test('computes roas correctly (totalRevenue / totalSpend)', () => {
            const events = [
                makeMetricEvent({ channel: 'meta', spend: 200, revenue: 800 }),
            ];
            const result = projectAttribution(events);
            // roas = 800/200 = 4.0
            expect(result.roas).toBe(4);
        });

        test('cpl is 0 when totalLeads is 0', () => {
            const events = [makeMetricEvent({ channel: 'meta', leads: 0 })];
            const result = projectAttribution(events);
            expect(result.cpl).toBe(0);
        });

        test('roas is 0 when totalSpend is 0', () => {
            const events = [makeMetricEvent({ channel: 'meta', spend: 0 })];
            const result = projectAttribution(events);
            expect(result.roas).toBe(0);
        });
    });

    describe('determinism', () => {
        test('same events produce same output', () => {
            const events = [
                makeMetricEvent({ channel: 'meta' }),
                makeMetricEvent({ channel: 'linkedin' }),
            ];
            const r1 = projectAttribution(events);
            const r2 = projectAttribution(events);
            expect(r1.totalSpend).toBe(r2.totalSpend);
            expect(r1.totalRevenue).toBe(r2.totalRevenue);
            expect(r1.byChannel.map(r => r.channel).sort()).toEqual(
                r2.byChannel.map(r => r.channel).sort(),
            );
        });

        test('does not mutate input events', () => {
            const events = [makeMetricEvent({ channel: 'meta' })];
            const frozen = JSON.stringify(events);
            projectAttribution(events);
            expect(JSON.stringify(events)).toBe(frozen);
        });
    });

    describe('error handling', () => {
        test('throws METRIC_EVENT_INVALID when impressions is a string', () => {
            const events = [makeMetricEvent({ channel: 'meta', impressions: 'bad' as unknown as number })];
            expect(() => projectAttribution(events)).toThrow();
        });

        test('thrown error has code METRIC_EVENT_INVALID', () => {
            const events = [makeMetricEvent({ channel: 'meta', clicks: 'bad' as unknown as number })];
            try {
                projectAttribution(events);
                expect.fail('should have thrown');
            } catch (err) {
                expect((err as { code: string }).code).toBe('METRIC_EVENT_INVALID');
                expect((err as { module: string }).module).toBe('analytics');
            }
        });
    });

    describe('non-metric events are ignored', () => {
        test('events without channel payload are not counted', () => {
            const events: DomainEvent[] = [
                {
                    id: ITEM_ID,
                    name: 'InterviewCaptured',
                    entityId: CAMP_ID,
                    timestamp: new Date().toISOString(),
                    payload: { foo: 'bar' },
                },
            ];
            const result = projectAttribution(events);
            expect(result.byChannel).toHaveLength(0);
            expect(result.totalSpend).toBe(0);
        });
    });
});
