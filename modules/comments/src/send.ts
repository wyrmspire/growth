import type { AppError, EntityId, SendResult, AdapterName, ReplyPayload } from '@core/types';
import { isApproved } from '@approvals/gate';
import { sendReply } from '@adapters/reply';

export interface SendApprovedReplyResult {
    ok: boolean;
    result?: SendResult;
    error?: AppError;
}

function makeError(code: string, message: string): AppError {
    return { code, message, module: 'comments' };
}

/**
 * Retrieve the reply draft from the reply store.
 * In production, this would fetch from a persistent store.
 * For now, accepts a pre-fetched draft payload.
 */
export interface ReplyDraftContext {
    replyId: EntityId;
    commentId: EntityId;
    body: string;
    channel: AdapterName;
}

/**
 * Send an approved reply through the adapters layer.
 * Fails closed if approval is missing (APPROVAL_REQUIRED).
 * Fails with SEND_FAILED if adapter dispatch fails.
 */
export function sendApprovedReply(
    replyId: EntityId,
    context: ReplyDraftContext,
): SendApprovedReplyResult {
    if (!replyId || replyId.trim() === '') {
        return {
            ok: false,
            error: makeError('SEND_FAILED', 'Reply ID is required.'),
        };
    }

    if (!isApproved(replyId)) {
        return {
            ok: false,
            error: makeError('APPROVAL_REQUIRED', `Reply ${replyId} has not been approved.`),
        };
    }

    const payload: ReplyPayload = {
        replyId: context.replyId,
        channel: context.channel,
        commentId: context.commentId,
        body: context.body,
    };

    const adapterResult = sendReply(context.channel, payload);

    if (!adapterResult.ok) {
        return {
            ok: false,
            error: makeError('SEND_FAILED', adapterResult.error?.message ?? 'Adapter dispatch failed.'),
        };
    }

    return {
        ok: true,
        result: {
            replyId,
            success: true,
            externalId: adapterResult.response.externalId,
        },
    };
}
