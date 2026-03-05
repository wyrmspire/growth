/**
 * PUB-A1 — scheduleAsset() Tests
 */

import { scheduleAsset, getCalendar, resetCalendar } from '../schedule';
import { decideReview, registerItem, resetStore } from '../../../approvals/src/decision';
import { _resetStore as resetReviewQueueStore } from '../../../approvals/src/queue';
import type { EntityId, ChannelName } from '../../../core/src/types';

const ASSET_ID = 'var_000001' as EntityId;

beforeEach(() => {
    resetCalendar();
    resetStore();
    resetReviewQueueStore();
    registerItem({ id: ASSET_ID, label: 'Approved Asset', kind: 'asset', state: 'pending' });
    decideReview({
        itemId: ASSET_ID,
        decision: 'approved',
        reviewerId: 'reviewer-1',
        timestamp: new Date().toISOString(),
    });
});

describe('scheduleAsset()', () => {
    describe('valid inputs', () => {
        test('returns ok=true with a calendar entry', () => {
            const result = scheduleAsset(ASSET_ID, '2026-04-01T10:00:00Z', 'meta');
            expect(result.ok).toBe(true);
            expect(result.entry).toBeDefined();
        });

        test('entry has a job_ id', () => {
            const result = scheduleAsset(ASSET_ID, '2026-04-01T10:00:00Z', 'meta');
            expect(result.entry?.jobId).toMatch(/^job_/);
        });

        test('entry state is scheduled', () => {
            const result = scheduleAsset(ASSET_ID, '2026-04-01T10:00:00Z', 'email');
            expect(result.entry?.state).toBe('scheduled');
        });

        test('entry channel matches input', () => {
            const result = scheduleAsset(ASSET_ID, '2026-04-01T10:00:00Z', 'linkedin');
            expect(result.entry?.channel).toBe('linkedin');
        });

        test('entry runAt matches input', () => {
            const ts = '2026-04-15T09:30:00+05:30';
            const result = scheduleAsset(ASSET_ID, ts, 'x');
            expect(result.entry?.runAt).toBe(ts);
        });

        test('uses asset label when provided', () => {
            const result = scheduleAsset(ASSET_ID, '2026-04-01T10:00:00Z', 'meta', 'Spring Campaign Ad');
            expect(result.entry?.assetLabel).toBe('Spring Campaign Ad');
        });

        test('defaults assetLabel to "Untitled Asset" when not provided', () => {
            const result = scheduleAsset(ASSET_ID, '2026-04-01T10:00:00Z', 'meta');
            expect(result.entry?.assetLabel).toBe('Untitled Asset');
        });

        test.each(['meta', 'linkedin', 'x', 'email'] as ChannelName[])(
            'valid channel "%s" is accepted',
            (channel) => {
                const result = scheduleAsset(ASSET_ID, '2026-04-01T10:00:00Z', channel);
                expect(result.ok).toBe(true);
            },
        );

        test('adds entry to calendar', () => {
            scheduleAsset(ASSET_ID, '2026-04-01T10:00:00Z', 'meta', 'Ad v1');
            const calendar = getCalendar();
            expect(calendar).toHaveLength(1);
        });

        test('multiple schedules accumulate in calendar', () => {
            scheduleAsset(ASSET_ID, '2026-04-01T10:00:00Z', 'meta');
            scheduleAsset(ASSET_ID, '2026-04-02T10:00:00Z', 'email');
            expect(getCalendar()).toHaveLength(2);
        });
    });

    describe('timezone-safe ISO validation', () => {
        const VALID_FORMATS = [
            '2026-04-01T10:00:00Z',
            '2026-04-01T10:00:00+00:00',
            '2026-04-01T10:00:00-05:00',
            '2026-04-15T09:30:00+05:30',
        ];

        test.each(VALID_FORMATS)('accepts valid timezone-aware format: %s', (runAt) => {
            const result = scheduleAsset(ASSET_ID, runAt, 'meta');
            expect(result.ok).toBe(true);
        });

        const INVALID_FORMATS = [
            '',
            '2026-04-01',               // bare date — no time
            '2026-04-01T10:00:00',      // local time — no timezone
            'not-a-date',
            '04/01/2026 10:00 AM',
            '1743465600',               // epoch seconds
        ];

        test.each(INVALID_FORMATS)('rejects invalid or timezone-naive format: "%s"', (runAt) => {
            const result = scheduleAsset(ASSET_ID, runAt, 'meta');
            expect(result.ok).toBe(false);
            expect(result.error?.code).toBe('SCHEDULE_TIME_INVALID');
        });
    });

    describe('invalid inputs', () => {
        test('missing assetId returns error', () => {
            const result = scheduleAsset('' as EntityId, '2026-04-01T10:00:00Z', 'meta');
            expect(result.ok).toBe(false);
            expect(result.error?.code).toBe('SCHEDULE_TIME_INVALID');
        });

        test('unknown channel returns error', () => {
            const result = scheduleAsset(ASSET_ID, '2026-04-01T10:00:00Z', 'tiktok' as ChannelName);
            expect(result.ok).toBe(false);
            expect(result.error?.code).toBe('SCHEDULE_TIME_INVALID');
        });

        test('error module is publishing', () => {
            const result = scheduleAsset(ASSET_ID, 'bad-date', 'meta');
            expect(result.error?.module).toBe('publishing');
        });
    });

    describe('getCalendar()', () => {
        test('returns a copy — mutations do not affect internal state', () => {
            scheduleAsset(ASSET_ID, '2026-04-01T10:00:00Z', 'meta', 'Ad v1');
            const a = getCalendar();
            a[0].state = 'dispatched';
            const b = getCalendar();
            expect(b[0].state).toBe('scheduled');
        });
    });
});
