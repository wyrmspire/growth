import type { AppError, CommentIntent, CommentQueueItem, CommentRecord } from '@core/types';

const INTENT_KEYWORDS: Record<CommentIntent, string[]> = {
    lead: ['interested', 'pricing', 'price', 'book a demo', 'how do i', 'get started'],
    objection: ['expensive', 'too much', 'not sure', 'why', 'concern', 'does this work'],
    support: ['love', 'great', 'awesome', 'thanks', 'helpful', 'works well'],
    spam: ['free', 'click here', 'bit.ly', 'http://', 'https://', 'followers'],
};

const PRIORITY_BY_INTENT: Record<CommentIntent, number> = {
    lead: 1,
    objection: 2,
    support: 3,
    spam: 4,
};

export interface TriageCommentResult {
    ok: boolean;
    item?: CommentQueueItem;
    error?: AppError;
}

function makeError(code: string, message: string): AppError {
    return { code, message, module: 'comments' };
}

export function triageComment(comment: CommentRecord): TriageCommentResult {
    if (!comment || !comment.id || !comment.body || comment.body.trim().length === 0) {
        return {
            ok: false,
            error: makeError('COMMENT_INVALID', 'Comment must include id and non-empty body.'),
        };
    }

    const normalizedBody = comment.body.toLowerCase();
    const detectedIntent = detectIntent(normalizedBody);

    return {
        ok: true,
        item: {
            commentId: comment.id,
            intent: detectedIntent,
            priority: PRIORITY_BY_INTENT[detectedIntent],
            comment,
        },
    };
}

function detectIntent(body: string): CommentIntent {
    if (hasKeyword(body, INTENT_KEYWORDS.spam)) {
        return 'spam';
    }

    if (hasKeyword(body, INTENT_KEYWORDS.lead)) {
        return 'lead';
    }

    if (hasKeyword(body, INTENT_KEYWORDS.objection)) {
        return 'objection';
    }

    return 'support';
}

function hasKeyword(body: string, keywords: string[]): boolean {
    return keywords.some(keyword => body.includes(keyword));
}
