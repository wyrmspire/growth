import type {
    CommentRecord, CommentQueueItem, CommentIntent, ReplyDraft, ReplyPolicy, EntityId, SendResult,
} from '../../core/src/types';
import { newEntityId } from '../../core/src/id';
import { isApproved } from '../../approvals/src/mock';

const INTENT_KEYWORDS: Record<CommentIntent, string[]> = {
    lead: ['get started', 'need', 'looking for', 'how do we'],
    support: ['love', 'great', 'amazing', 'switched', 'awesome'],
    objection: ['expensive', 'roi', 'compared to', 'not sure', 'why should'],
    spam: ['free', 'click here', 'bit.ly', 'followers', '🔥🔥'],
};

export function triageComment(comment: CommentRecord): CommentQueueItem {
    const bodyLower = comment.body.toLowerCase();

    let detectedIntent: CommentIntent = 'support';
    let maxMatches = 0;

    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [CommentIntent, string[]][]) {
        const matches = keywords.filter(k => bodyLower.includes(k)).length;
        if (matches > maxMatches) {
            maxMatches = matches;
            detectedIntent = intent;
        }
    }

    const priorityMap: Record<CommentIntent, number> = { lead: 1, objection: 2, support: 3, spam: 4 };

    return {
        commentId: comment.id,
        intent: detectedIntent,
        priority: priorityMap[detectedIntent],
        comment,
    };
}

const REPLY_TEMPLATES: Record<CommentIntent, string> = {
    lead: 'Thanks for your interest! The best way to get started is to book a quick 15-minute demo — I\'ll send you the link.',
    support: 'Really appreciate the kind words! Glad to hear it\'s working well for your team. 🙌',
    objection: 'Great question! On average, our customers see a 3x return within the first 60 days. Happy to walk through the numbers if you\'d like.',
    spam: '',
};

export function draftReply(item: CommentQueueItem, policy: ReplyPolicy): ReplyDraft | null {
    if (item.intent === 'spam') return null;

    const template = REPLY_TEMPLATES[item.intent];
    const body = template.length > policy.maxLength
        ? template.slice(0, policy.maxLength - 3) + '...'
        : template;

    return {
        id: newEntityId('reply'),
        commentId: item.commentId,
        body,
        confidence: item.intent === 'lead' ? 0.92 : item.intent === 'objection' ? 0.78 : 0.88,
        policyApplied: policy.tone,
    };
}

export function sendApprovedReply(replyId: EntityId): SendResult {
    return {
        replyId,
        success: isApproved(replyId),
        externalId: isApproved(replyId) ? `sent_${Date.now().toString(36)}` : undefined,
    };
}

export function getDefaultReplyPolicy(): ReplyPolicy {
    return {
        maxLength: 300,
        tone: 'professional-friendly',
        bannedPhrases: ['guaranteed', 'act now', 'limited time'],
    };
}
