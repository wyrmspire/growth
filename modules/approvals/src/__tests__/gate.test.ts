import { isApproved } from '../gate';
import { registerItem, decideReview, resetStore } from '../decision';
import { _resetStore as resetQueueStore, createReviewBatch } from '../queue';
import type { EntityId, ReviewItem } from '../../../core/src/types';

const ITEM_ID = 'var_000001' as EntityId;

function makeItem(state: ReviewItem['state'] = 'pending'): ReviewItem {
    return { id: ITEM_ID, label: 'Asset', kind: 'asset', state };
}

beforeEach(() => {
    resetStore();
    resetQueueStore();
});

describe('isApproved()', () => {
    test('returns true for approved item', () => {
        registerItem(makeItem('approved'));
        expect(isApproved(ITEM_ID)).toBe(true);
    });

    test('returns false for non-approved states', () => {
        registerItem(makeItem('pending'));
        expect(isApproved(ITEM_ID)).toBe(false);
    });

    test('returns false for unknown item', () => {
        expect(isApproved('var_999999' as EntityId)).toBe(false);
    });

    test('reads decision state after approve transition', () => {
        registerItem(makeItem('pending'));
        decideReview({
            itemId: ITEM_ID,
            decision: 'approved',
            reviewerId: 'reviewer-1',
            timestamp: new Date().toISOString(),
        });

        expect(isApproved(ITEM_ID)).toBe(true);
    });

    test('reads items created through review batches', () => {
        const batch = createReviewBatch([{ id: ITEM_ID, label: 'Asset', kind: 'asset' }]);
        expect(batch.ok).toBe(true);
        expect(isApproved(ITEM_ID)).toBe(false);

        decideReview({
            itemId: ITEM_ID,
            decision: 'approved',
            reviewerId: 'reviewer-1',
            timestamp: new Date().toISOString(),
        });

        expect(isApproved(ITEM_ID)).toBe(true);
    });
});
