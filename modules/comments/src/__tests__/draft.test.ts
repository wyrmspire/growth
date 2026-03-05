import type { CommentQueueItem, EntityId, ReplyPolicy } from '../../../core/src/types';
import { draftReply } from '../draft';

function makeItem(intent: CommentQueueItem['intent']): CommentQueueItem {
    return {
        commentId: 'comment_000001' as EntityId,
        intent,
        priority: 1,
        comment: {
            id: 'comment_000001' as EntityId,
            campaignId: 'camp_000001' as EntityId,
            channel: 'meta',
            authorName: 'Sam',
            body: 'How do I get started?',
            timestamp: new Date().toISOString(),
        },
    };
}

const BASE_POLICY: ReplyPolicy = {
    maxLength: 160,
    tone: 'professional-friendly',
    bannedPhrases: ['best step'],
};

describe('draftReply()', () => {
    test('returns reply draft for lead comments', () => {
        const result = draftReply(makeItem('lead'), BASE_POLICY);
        expect(result.ok).toBe(true);
        expect(result.draft).toBeTruthy();
        expect(result.draft?.id).toMatch(/^reply_/);
        expect(result.draft?.commentId).toBe('comment_000001');
        expect(result.draft?.policyApplied).toBe('professional-friendly');
    });

    test('returns null draft for spam comments', () => {
        const result = draftReply(makeItem('spam'), BASE_POLICY);
        expect(result.ok).toBe(true);
        expect(result.draft).toBeNull();
    });

    test('enforces max length', () => {
        const result = draftReply(makeItem('objection'), { ...BASE_POLICY, maxLength: 40 });
        expect(result.ok).toBe(true);
        expect(result.draft?.body.length).toBeLessThanOrEqual(40);
    });

    test('removes banned phrases case-insensitively', () => {
        const result = draftReply(makeItem('lead'), {
            ...BASE_POLICY,
            bannedPhrases: ['BEST STEP'],
        });
        expect(result.ok).toBe(true);
        expect(result.draft?.body.toLowerCase()).not.toContain('best step');
    });

    test('returns REPLY_POLICY_INVALID for invalid policy', () => {
        const result = draftReply(makeItem('support'), {
            ...BASE_POLICY,
            maxLength: 0,
        });
        expect(result.ok).toBe(false);
        expect(result.error?.code).toBe('REPLY_POLICY_INVALID');
        expect(result.error?.module).toBe('comments');
    });
});
