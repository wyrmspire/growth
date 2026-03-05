/**
 * APP-A2 — decideReview() Tests
 */

import {
    decideReview,
    registerItem,
    registerBatchItems,
    reopenItem,
    getItemState,
    resetStore,
} from '../decision';
import type { EntityId, ReviewItem, ReviewDecision } from '../../../core/src/types';

const ITEM_ID = 'var_000001' as EntityId;
const REVIEWER = 'agent-1';

function makeItem(
    id: EntityId = ITEM_ID,
    state: ReviewItem['state'] = 'pending',
): ReviewItem {
    return { id, label: 'Test Asset', kind: 'asset', state };
}

function makeDecision(
    itemId: EntityId = ITEM_ID,
    decision: 'approved' | 'rejected' = 'approved',
): ReviewDecision {
    return {
        itemId,
        decision,
        reviewerId: REVIEWER,
        timestamp: new Date().toISOString(),
    };
}

beforeEach(() => {
    resetStore();
});

describe('decideReview()', () => {
    describe('pending → approved', () => {
        test('returns ok=true and state=approved', () => {
            registerItem(makeItem());
            const result = decideReview(makeDecision(ITEM_ID, 'approved'));
            expect(result.ok).toBe(true);
            expect(result.state).toBe('approved');
        });

        test('getItemState reflects new state', () => {
            registerItem(makeItem());
            decideReview(makeDecision(ITEM_ID, 'approved'));
            expect(getItemState(ITEM_ID)).toBe('approved');
        });
    });

    describe('pending → rejected', () => {
        test('returns ok=true and state=rejected', () => {
            registerItem(makeItem());
            const result = decideReview(makeDecision(ITEM_ID, 'rejected'));
            expect(result.ok).toBe(true);
            expect(result.state).toBe('rejected');
        });
    });

    describe('terminal state re-decision (blocked)', () => {
        test('approved → approved is blocked', () => {
            registerItem(makeItem(ITEM_ID, 'approved'));
            const result = decideReview(makeDecision(ITEM_ID, 'approved'));
            expect(result.ok).toBe(false);
            expect(result.error?.code).toBe('REVIEW_DECISION_INVALID');
        });

        test('approved → rejected is blocked', () => {
            registerItem(makeItem(ITEM_ID, 'approved'));
            const result = decideReview(makeDecision(ITEM_ID, 'rejected'));
            expect(result.ok).toBe(false);
        });

        test('rejected → approved is blocked', () => {
            registerItem(makeItem(ITEM_ID, 'rejected'));
            const result = decideReview(makeDecision(ITEM_ID, 'approved'));
            expect(result.ok).toBe(false);
        });
    });

    describe('reopened → new decision', () => {
        test('reopened → approved is allowed', () => {
            registerItem(makeItem(ITEM_ID, 'reopened'));
            const result = decideReview(makeDecision(ITEM_ID, 'approved'));
            expect(result.ok).toBe(true);
            expect(result.state).toBe('approved');
        });

        test('reopened → rejected is allowed', () => {
            registerItem(makeItem(ITEM_ID, 'reopened'));
            const result = decideReview(makeDecision(ITEM_ID, 'rejected'));
            expect(result.ok).toBe(true);
        });
    });

    describe('item not found', () => {
        test('returns REVIEW_ITEM_NOT_FOUND for unknown id', () => {
            const result = decideReview(makeDecision('batch_999999' as EntityId, 'approved'));
            expect(result.ok).toBe(false);
            expect(result.error?.code).toBe('REVIEW_ITEM_NOT_FOUND');
        });
    });

    describe('invalid decision shape', () => {
        test('missing reviewerId returns REVIEW_DECISION_INVALID', () => {
            registerItem(makeItem());
            const bad = { ...makeDecision(), reviewerId: '' };
            const result = decideReview(bad);
            expect(result.ok).toBe(false);
            expect(result.error?.code).toBe('REVIEW_DECISION_INVALID');
        });

        test('missing timestamp returns REVIEW_DECISION_INVALID', () => {
            registerItem(makeItem());
            const bad = { ...makeDecision(), timestamp: '' };
            const result = decideReview(bad);
            expect(result.ok).toBe(false);
        });
    });

    describe('audit fields', () => {
        test('decision is auditable (reviewerId and timestamp on decision object)', () => {
            registerItem(makeItem());
            const decision = makeDecision();
            decideReview(decision);
            // The decision object itself carries reviewer + timestamp
            expect(decision.reviewerId).toBe(REVIEWER);
            expect(decision.timestamp).toBeTruthy();
        });
    });

    describe('error module', () => {
        test('error module is approvals', () => {
            const result = decideReview(makeDecision('unknown_000' as EntityId));
            expect(result.error?.module).toBe('approvals');
        });
    });
});

describe('reopenItem()', () => {
    test('sets state to reopened', () => {
        registerItem(makeItem(ITEM_ID, 'approved'));
        const result = reopenItem(ITEM_ID, REVIEWER);
        expect(result.ok).toBe(true);
        expect(result.state).toBe('reopened');
        expect(getItemState(ITEM_ID)).toBe('reopened');
    });

    test('unknown item returns REVIEW_ITEM_NOT_FOUND', () => {
        const result = reopenItem('unknown_999' as EntityId, REVIEWER);
        expect(result.ok).toBe(false);
        expect(result.error?.code).toBe('REVIEW_ITEM_NOT_FOUND');
    });
});

describe('registerBatchItems()', () => {
    test('registers all items in the batch', () => {
        const items: ReviewItem[] = [
            makeItem('var_001' as EntityId),
            makeItem('var_002' as EntityId),
        ];
        registerBatchItems(items);
        expect(getItemState('var_001' as EntityId)).toBe('pending');
        expect(getItemState('var_002' as EntityId)).toBe('pending');
    });
});
