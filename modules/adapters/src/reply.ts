import type { AdapterName, AdapterPublishResponse, AppError, ReplyPayload } from '@core/types';
import { resolveAdapter } from './registry';

export interface SendReplyResult {
    ok: true;
    response: AdapterPublishResponse;
}

export interface SendReplyError {
    ok: false;
    error: AppError;
}

export type SendReplyOutcome = SendReplyResult | SendReplyError;

function sendReplyError(message: string): SendReplyError {
    return {
        ok: false,
        error: {
            code: 'REPLY_SEND_FAILED',
            message,
            module: 'adapters',
        },
    };
}

export function sendReply(channel: AdapterName, payload: ReplyPayload): SendReplyOutcome {
    if (!payload.replyId || payload.replyId.trim() === '') {
        return sendReplyError('Reply payload must have a non-empty replyId.');
    }
    if (!payload.commentId || payload.commentId.trim() === '') {
        return sendReplyError('Reply payload must have a non-empty commentId.');
    }
    if (!payload.body || payload.body.trim() === '') {
        return sendReplyError('Reply payload must have non-empty body.');
    }

    const resolved = resolveAdapter(channel);
    if (!resolved.ok) {
        return sendReplyError(resolved.error.message);
    }

    try {
        const raw = resolved.adapter.sendReply({
            ...payload,
            channel,
        });

        if (!raw.success) {
            return sendReplyError(`Adapter for channel "${channel}" reported failure.`);
        }

        return {
            ok: true,
            response: {
                jobId: raw.jobId ?? payload.replyId,
                channel: raw.channel ?? channel,
                success: true,
                externalId: raw.externalId,
            },
        };
    } catch (error) {
        return sendReplyError(error instanceof Error ? error.message : 'Unknown reply send error.');
    }
}
