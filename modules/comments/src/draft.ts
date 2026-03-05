import type { AppError, CommentQueueItem, ReplyDraft, ReplyPolicy } from '@core/types';
import { newEntityId } from '@core/id';

const TEMPLATES: Record<Exclude<CommentQueueItem['intent'], 'spam'>, string> = {
    lead: 'Thanks for reaching out. Happy to help you get started with the next best step.',
    objection: 'Great question. You are right to check this carefully, and I can share clear details to help you decide.',
    support: 'Thank you for the kind words. Glad this was helpful for you and your team.',
};

const CONFIDENCE: Record<Exclude<CommentQueueItem['intent'], 'spam'>, number> = {
    lead: 0.9,
    objection: 0.78,
    support: 0.88,
};
const ELLIPSIS_LENGTH = 3;

export interface DraftReplyResult {
    ok: boolean;
    draft?: ReplyDraft | null;
    error?: AppError;
}

function makeError(code: string, message: string): AppError {
    return { code, message, module: 'comments' };
}

export function draftReply(item: CommentQueueItem, policy: ReplyPolicy): DraftReplyResult {
    if (!item || !item.commentId || !item.intent) {
        return {
            ok: false,
            error: makeError('COMMENT_INVALID', 'Comment queue item is required.'),
        };
    }

    if (!isValidPolicy(policy)) {
        return {
            ok: false,
            error: makeError(
                'REPLY_POLICY_INVALID',
                'Reply policy requires maxLength > 0, non-empty tone, and bannedPhrases array.',
            ),
        };
    }

    if (item.intent === 'spam') {
        return { ok: true, draft: null };
    }

    const template = TEMPLATES[item.intent];
    const sanitized = stripBannedPhrases(template, policy.bannedPhrases);
    const body = applyMaxLength(sanitized, policy.maxLength);

    return {
        ok: true,
        draft: {
            id: newEntityId('reply'),
            commentId: item.commentId,
            body,
            confidence: CONFIDENCE[item.intent],
            policyApplied: policy.tone.trim(),
        },
    };
}

function isValidPolicy(policy: ReplyPolicy): boolean {
    return !!policy
        && Number.isInteger(policy.maxLength)
        && policy.maxLength > 0
        && typeof policy.tone === 'string'
        && policy.tone.trim().length > 0
        && Array.isArray(policy.bannedPhrases);
}

function stripBannedPhrases(input: string, bannedPhrases: string[]): string {
    return bannedPhrases.reduce((result, phrase) => {
        if (!phrase || phrase.trim().length === 0) {
            return result;
        }
        const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return result.replace(new RegExp(escaped, 'gi'), '').replace(/\s{2,}/g, ' ').trim();
    }, input);
}

function applyMaxLength(input: string, maxLength: number): string {
    if (input.length <= maxLength) {
        return input;
    }

    if (maxLength <= ELLIPSIS_LENGTH) {
        return '.'.repeat(maxLength);
    }

    return `${input.slice(0, maxLength - ELLIPSIS_LENGTH).trimEnd()}...`;
}
