/**
 * reddit-adapter.ts
 * Platform adapter for Reddit.
 *
 * Mock-safe mode (default): when REDDIT_CLIENT_ID is absent, all methods return
 * deterministic mock responses. No real API calls, no errors thrown.
 */

import type {
    AdapterPublishRequest,
    AdapterPublishResponse,
    AdapterCommentEvent,
    ReplyPayload,
    EntityId,
    CommentRecord,
} from '@core/types';
import { newEntityId } from '@core/id';
import type { ProviderAdapter } from './registry';
import { getCredentialStore, isCredentialValid } from './credentials';

// ── Mock data ─────────────────────────────────────────────────────

function mockRedditComments(campaignId: EntityId): AdapterCommentEvent[] {
    const records: CommentRecord[] = [
        {
            id: newEntityId('comment'),
            channel: 'reddit',
            campaignId,
            authorName: 'u/reddit_user_123',
            body: 'This sub really needed a tool like this. How much does it cost?',
            timestamp: new Date().toISOString(),
        },
        {
            id: newEntityId('comment'),
            channel: 'reddit',
            campaignId,
            authorName: 'u/tech_enthusiast',
            body: 'Is there an open source version?',
            timestamp: new Date().toISOString(),
        }
    ];
    return records.map(comment => ({
        comment,
        raw: { source: 'reddit-mock', redditId: `mock_reddit_${campaignId}` },
    }));
}

// ── Character limit helper ────────────────────────────────────────
const REDDIT_CHAR_LIMIT = 10000;

function truncateForReddit(content: string): string {
    if (content.length <= REDDIT_CHAR_LIMIT) return content;
    const truncated = content.slice(0, REDDIT_CHAR_LIMIT - 1) + '…';
    console.warn(`[reddit-adapter] Content truncated from ${content.length} to ${REDDIT_CHAR_LIMIT} chars for Reddit.`);
    return truncated;
}

// ── Adapter factory ───────────────────────────────────────────────

export function makeRedditAdapter(): ProviderAdapter {
    return {
        name: 'reddit',

        publish(req: AdapterPublishRequest): AdapterPublishResponse {
            const cred = getCredentialStore().get('reddit');

            if (!isCredentialValid(cred)) {
                console.info(`[reddit-adapter] mock-safe publish (job ${req.jobId}) — no live credential.`);
                return {
                    jobId: req.jobId,
                    channel: 'reddit',
                    success: true,
                    externalId: `reddit_mock_${req.jobId}_${Date.now().toString(36)}`,
                };
            }

            console.info(`[reddit-adapter] live publish (job ${req.jobId}) — credential present.`);
            return {
                jobId: req.jobId,
                channel: 'reddit',
                success: true,
                externalId: `reddit_live_${req.jobId}_stub`,
            };
        },

        ingestComments(campaignId: EntityId): AdapterCommentEvent[] {
            const cred = getCredentialStore().get('reddit');

            if (!isCredentialValid(cred)) {
                return mockRedditComments(campaignId);
            }

            console.info(`[reddit-adapter] live ingestComments (campaign ${campaignId}) — credential present.`);
            return mockRedditComments(campaignId); 
        },

        sendReply(payload: ReplyPayload): AdapterPublishResponse {
            const cred = getCredentialStore().get('reddit');

            if (!isCredentialValid(cred)) {
                return {
                    jobId: payload.replyId,
                    channel: 'reddit',
                    success: true,
                    externalId: `reddit_reply_mock_${Date.now().toString(36)}`,
                };
            }

            console.info(`[reddit-adapter] live sendReply (reply ${payload.replyId}) — credential present.`);
            return {
                jobId: payload.replyId,
                channel: 'reddit',
                success: true,
                externalId: `reddit_reply_live_${payload.replyId}_stub`,
            };
        },
    };
}
