import type { CommentRecord, EntityId } from '../../../core/src/types';
import { triageComment } from '../triage';

function makeComment(body: string): CommentRecord {
    return {
        id: 'comment_000001' as EntityId,
        campaignId: 'camp_000001' as EntityId,
        channel: 'meta',
        authorName: 'Alex',
        body,
        timestamp: new Date().toISOString(),
    };
}

describe('triageComment()', () => {
    test('classifies lead intent', () => {
        const result = triageComment(makeComment('How do I get started with pricing details?'));
        expect(result.ok).toBe(true);
        expect(result.item?.intent).toBe('lead');
        expect(result.item?.priority).toBe(1);
    });

    test('classifies objection intent', () => {
        const result = triageComment(makeComment('This looks expensive. Why does this work better?'));
        expect(result.ok).toBe(true);
        expect(result.item?.intent).toBe('objection');
        expect(result.item?.priority).toBe(2);
    });

    test('classifies support intent by default', () => {
        const result = triageComment(makeComment('Great work, this was very helpful.'));
        expect(result.ok).toBe(true);
        expect(result.item?.intent).toBe('support');
        expect(result.item?.priority).toBe(3);
    });

    test('classifies spam intent and prioritizes it over lead keywords', () => {
        const result = triageComment(makeComment('Click here for free followers and how do I buy?'));
        expect(result.ok).toBe(true);
        expect(result.item?.intent).toBe('spam');
        expect(result.item?.priority).toBe(4);
    });

    test('returns COMMENT_INVALID for empty comment body', () => {
        const result = triageComment(makeComment('   '));
        expect(result.ok).toBe(false);
        expect(result.error?.code).toBe('COMMENT_INVALID');
        expect(result.error?.module).toBe('comments');
    });
});
