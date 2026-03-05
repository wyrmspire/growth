import { scheduleAsset, getCalendar, resetCalendar } from '../schedule';
import { registerItem, resetStore } from '../../../approvals/src/decision';
import { _resetStore as resetReviewQueueStore } from '../../../approvals/src/queue';
import type { EntityId } from '../../../core/src/types';

const ASSET_ID = 'var_000111' as EntityId;

beforeEach(() => {
    resetCalendar();
    resetStore();
    resetReviewQueueStore();
});

describe('scheduleAsset() approval gate', () => {
    test('rejects unapproved assets', () => {
        registerItem({ id: ASSET_ID, label: 'Asset', kind: 'asset', state: 'pending' });

        const result = scheduleAsset(ASSET_ID, '2026-04-01T10:00:00Z', 'meta');
        expect(result.ok).toBe(false);
        expect(result.error?.code).toBe('APPROVAL_REQUIRED');
        expect(result.error?.module).toBe('publishing');
        expect(getCalendar()).toHaveLength(0);
    });
});
