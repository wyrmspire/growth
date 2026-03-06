/**
 * Preview Adapter — PREV-2
 * In-memory adapter that captures published content for display
 * in the Preview Feed page. Does not send anything externally.
 *
 * This adapter intercepts publish calls and stores them in a
 * feed buffer that the frontend reads via /api/preview-feed.
 */
import type {
    EntityId,
    AdapterPublishRequest,
    AdapterPublishResponse,
    AdapterCommentEvent,
    ReplyPayload,
} from '@core/types';
import { newEntityId } from '@core/id';
import type { ProviderAdapter } from './registry';

// ─── Feed buffer ─────────────────────────────────────────────────

export interface PreviewFeedItem {
    id: EntityId;
    channel: string;
    content: string;
    publishedAt: string;
    originalJobId: EntityId;
}

const _feed: PreviewFeedItem[] = [];

export function getPreviewFeed(): PreviewFeedItem[] {
    return [..._feed];
}

export function clearPreviewFeed(): void {
    _feed.length = 0;
}

// ─── Adapter ─────────────────────────────────────────────────────

/**
 * Create a preview adapter for a given channel.
 * When publish() is called, content goes to the in-memory feed
 * instead of an external platform.
 */
export function makePreviewAdapter(channel: string): ProviderAdapter {
    return {
        name: channel as any,
        publish(req: AdapterPublishRequest): AdapterPublishResponse {
            const item: PreviewFeedItem = {
                id: newEntityId('prev'),
                channel: req.channel,
                content: req.content,
                publishedAt: req.scheduledAt || new Date().toISOString(),
                originalJobId: req.jobId,
            };
            _feed.push(item);
            console.log(`[preview-adapter] Captured publish for ${req.channel} (job ${req.jobId})`);
            return {
                jobId: req.jobId,
                channel: req.channel,
                success: true,
                externalId: `preview_${item.id}`,
            };
        },
        ingestComments(_campaignId: EntityId): AdapterCommentEvent[] {
            return []; // Preview adapter doesn't produce comments
        },
        sendReply(payload: ReplyPayload): AdapterPublishResponse {
            return {
                jobId: payload.replyId,
                channel: channel as any,
                success: true,
                externalId: `preview_reply_${Date.now().toString(36)}`,
            };
        },
    };
}
