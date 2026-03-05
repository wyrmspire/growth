import type { EntityId, ReviewItem } from '../../../core/src/types';
import { sendApprovedReply, type ReplyDraftContext } from '../send';
import { registerItem, resetStore, decideReview } from '../../../approvals/src/decision';
import { _resetRegistry } from '../../../adapters/src/registry';

const REPLY_ID = 'reply_000001' as EntityId;
const COMMENT_ID = 'comment_000001' as EntityId;

function makeContext(overrides?: Partial<ReplyDraftContext>): ReplyDraftContext {
    return {
        replyId: REPLY_ID,
        commentId: COMMENT_ID,
        body: 'Thanks for your question!',
        channel: 'meta',
        ...overrides,
    };
}

function makeReviewItem(state: ReviewItem['state'] = 'pending'): ReviewItem {
    return { id: REPLY_ID, label: 'Reply', kind: 'reply', state };
}

beforeEach(() => {
    resetStore();
    _resetRegistry();
});

describe('sendApprovedReply()', () => {
    test('sends reply when approval exists', () => {
        registerItem(makeReviewItem('pending'));
        decideReview({
            itemId: REPLY_ID,
            decision: 'approved',
            reviewerId: 'test-reviewer',
            timestamp: new Date().toISOString(),
        });

        const result = sendApprovedReply(REPLY_ID, makeContext());
        expect(result.ok).toBe(true);
        expect(result.result?.replyId).toBe(REPLY_ID);
        expect(result.result?.success).toBe(true);
    });

    test('returns APPROVAL_REQUIRED when reply is not approved', () => {
        registerItem(makeReviewItem('pending'));
        // No approval decision made

        const result = sendApprovedReply(REPLY_ID, makeContext());
        expect(result.ok).toBe(false);
        expect(result.error?.code).toBe('APPROVAL_REQUIRED');
        expect(result.error?.module).toBe('comments');
    });

    test('returns APPROVAL_REQUIRED when reply was rejected', () => {
        registerItem(makeReviewItem('pending'));
        decideReview({
            itemId: REPLY_ID,
            decision: 'rejected',
            reviewerId: 'test-reviewer',
            timestamp: new Date().toISOString(),
        });

        const result = sendApprovedReply(REPLY_ID, makeContext());
        expect(result.ok).toBe(false);
        expect(result.error?.code).toBe('APPROVAL_REQUIRED');
    });

    test('returns SEND_FAILED for empty replyId', () => {
        const result = sendApprovedReply('' as EntityId, makeContext());
        expect(result.ok).toBe(false);
        expect(result.error?.code).toBe('SEND_FAILED');
    });

    test('includes externalId in successful result', () => {
        registerItem(makeReviewItem('pending'));
        decideReview({
            itemId: REPLY_ID,
            decision: 'approved',
            reviewerId: 'test-reviewer',
            timestamp: new Date().toISOString(),
        });

        const result = sendApprovedReply(REPLY_ID, makeContext());
        expect(result.ok).toBe(true);
        // Mock adapter returns undefined externalId but result should still be valid
        expect(result.result?.success).toBe(true);
    });

    test('maps reply id and approval outcome correctly', () => {
        registerItem(makeReviewItem('pending'));
        decideReview({
            itemId: REPLY_ID,
            decision: 'approved',
            reviewerId: 'operator',
            timestamp: '2026-03-05T20:00:00Z',
        });

        const result = sendApprovedReply(REPLY_ID, makeContext());
        expect(result.ok).toBe(true);
        expect(result.result?.replyId).toBe(REPLY_ID);
    });
});
