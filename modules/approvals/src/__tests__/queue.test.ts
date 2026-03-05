/**
 * APP-A1 — createReviewBatch() Tests
 */

import { createReviewBatch } from '../queue';
import type { EntityId, ReviewItem } from '../../../core/src/types';

const ITEMS: Array<{ id: EntityId; label: string; kind: ReviewItem['kind'] }> = [
    { id: 'var_000001' as EntityId, label: 'Meta Ad v1', kind: 'asset' },
    { id: 'reply_000001' as EntityId, label: 'Reply to comment #42', kind: 'reply' },
    { id: 'offer_000001' as EntityId, label: 'Starter Pack Offer', kind: 'offer' },
];

describe('createReviewBatch()', () => {
    describe('valid input', () => {
        test('returns ok=true with a batch', () => {
            const result = createReviewBatch(ITEMS);
            expect(result.ok).toBe(true);
            expect(result.batch).toBeDefined();
        });

        test('batch has a batch_ id', () => {
            const result = createReviewBatch(ITEMS);
            expect(result.batch?.id).toMatch(/^batch_/);
        });

        test('batch has a createdAt ISO timestamp', () => {
            const result = createReviewBatch(ITEMS);
            const ts = result.batch?.createdAt ?? '';
            expect(new Date(ts).toISOString()).toBe(ts);
        });

        test('all items start in pending state', () => {
            const result = createReviewBatch(ITEMS);
            for (const item of result.batch?.items ?? []) {
                expect(item.state).toBe('pending');
            }
        });

        test('item count matches input count', () => {
            const result = createReviewBatch(ITEMS);
            expect(result.batch?.items).toHaveLength(ITEMS.length);
        });

        test('item labels are trimmed', () => {
            const result = createReviewBatch([
                { id: 'var_000002' as EntityId, label: '  Ad Copy  ', kind: 'asset' },
            ]);
            expect(result.batch?.items[0].label).toBe('Ad Copy');
        });

        test('item IDs from input are preserved', () => {
            const result = createReviewBatch(ITEMS);
            const ids = result.batch?.items.map(i => i.id) ?? [];
            for (const item of ITEMS) {
                expect(ids).toContain(item.id);
            }
        });

        test('single item batch is valid', () => {
            const result = createReviewBatch([ITEMS[0]]);
            expect(result.ok).toBe(true);
            expect(result.batch?.items).toHaveLength(1);
        });
    });

    describe('invalid input', () => {
        test('empty array returns REVIEW_ITEM_INVALID', () => {
            const result = createReviewBatch([]);
            expect(result.ok).toBe(false);
            expect(result.error?.code).toBe('REVIEW_ITEM_INVALID');
        });

        test('item missing label returns REVIEW_ITEM_INVALID', () => {
            const result = createReviewBatch([
                { id: 'var_000003' as EntityId, label: '', kind: 'asset' },
            ]);
            expect(result.ok).toBe(false);
        });

        test('error module is approvals', () => {
            const result = createReviewBatch([]);
            expect(result.error?.module).toBe('approvals');
        });
    });
});
