import { dispatchDue } from '../dispatch';
import { scheduleAsset, getCalendar, resetCalendar } from '../schedule';
import { registerItem, decideReview, resetStore } from '../../../approvals/src/decision';
import { _resetStore as resetReviewQueueStore } from '../../../approvals/src/queue';
import { registerAdapter, _resetRegistry, type ProviderAdapter } from '../../../adapters/src/registry';
import type { AdapterName, EntityId, ReplyPayload } from '../../../core/src/types';

function approveAsset(assetId: EntityId): void {
    registerItem({ id: assetId, label: `Asset ${assetId}`, kind: 'asset', state: 'pending' });
    decideReview({
        itemId: assetId,
        decision: 'approved',
        reviewerId: 'reviewer-1',
        timestamp: new Date().toISOString(),
    });
}

beforeEach(() => {
    resetCalendar();
    resetStore();
    resetReviewQueueStore();
    _resetRegistry();
});

describe('dispatchDue()', () => {
    test('dispatches due scheduled jobs', () => {
        const assetId = 'var_100001' as EntityId;
        approveAsset(assetId);
        const scheduled = scheduleAsset(assetId, '2026-04-01T10:00:00Z', 'meta');
        expect(scheduled.ok).toBe(true);

        const results = dispatchDue('2026-04-01T10:00:00Z');
        expect(results).toHaveLength(1);
        expect(results[0].jobId).toBe(scheduled.entry?.jobId);
        expect(results[0].success).toBe(true);
        expect(getCalendar()[0].state).toBe('dispatched');
    });

    test('is idempotent for the same now value', () => {
        const assetId = 'var_100002' as EntityId;
        approveAsset(assetId);
        scheduleAsset(assetId, '2026-04-01T10:00:00Z', 'linkedin');

        expect(dispatchDue('2026-04-02T00:00:00Z')).toHaveLength(1);
        expect(dispatchDue('2026-04-02T00:00:00Z')).toHaveLength(0);
    });

    test('does not dispatch future jobs', () => {
        const assetId = 'var_100003' as EntityId;
        approveAsset(assetId);
        scheduleAsset(assetId, '2026-05-01T10:00:00Z', 'x');

        const results = dispatchDue('2026-04-01T10:00:00Z');
        expect(results).toHaveLength(0);
        expect(getCalendar()[0].state).toBe('scheduled');
    });

    test('marks job failed when adapter dispatch fails', () => {
        const failingAdapter: ProviderAdapter = {
            name: 'meta' as AdapterName,
            publish: () => ({ jobId: 'job_999999' as EntityId, channel: 'meta', success: false }),
            ingestComments: () => [],
            sendReply: (payload: ReplyPayload) => ({ jobId: payload.replyId, channel: 'meta', success: true }),
        };
        registerAdapter(failingAdapter);

        const assetId = 'var_100004' as EntityId;
        approveAsset(assetId);
        scheduleAsset(assetId, '2026-04-01T10:00:00Z', 'meta');

        const results = dispatchDue('2026-04-01T10:00:00Z');
        expect(results).toHaveLength(1);
        expect(results[0].success).toBe(false);
        expect(getCalendar()[0].state).toBe('failed');
    });
});
