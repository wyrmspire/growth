import type { AdapterCommentEvent, AdapterName, AppError, EntityId } from '@core/types';
import { resolveAdapter } from './registry';

export interface IngestCommentsResult {
    ok: true;
    events: AdapterCommentEvent[];
}

export interface IngestCommentsError {
    ok: false;
    error: AppError;
}

export type IngestCommentsOutcome = IngestCommentsResult | IngestCommentsError;

function ingestError(message: string): IngestCommentsError {
    return {
        ok: false,
        error: {
            code: 'COMMENT_INGEST_FAILED',
            message,
            module: 'adapters',
        },
    };
}

export function ingestComments(channel: AdapterName, campaignId: EntityId): IngestCommentsOutcome {
    if (!campaignId || campaignId.trim() === '') {
        return ingestError('Campaign id must not be empty.');
    }

    const resolved = resolveAdapter(channel);
    if (!resolved.ok) {
        return ingestError(resolved.error.message);
    }

    try {
        const events = resolved.adapter.ingestComments(campaignId);
        return {
            ok: true,
            events: events.map((event) => ({
                ...event,
                comment: {
                    ...event.comment,
                    channel,
                    campaignId,
                },
            })),
        };
    } catch (error) {
        return ingestError(error instanceof Error ? error.message : 'Unknown comment ingest error.');
    }
}
