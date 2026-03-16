/**
 * x-adapter.ts — ADAPT-5
 * Platform adapter for X (formerly Twitter).
 *
 * Mock-safe mode (default): when X_API_KEY is absent, all methods return
 * deterministic mock responses. No real API calls, no errors thrown.
 *
 * Live mode (future): wire X API v2 using cred.value as bearer token and
 * cred.secret as the API secret for OAuth 1.0a signed requests. See TODO blocks.
 *
 * Anti-pattern guard:
 * - AP-1: No domain decisions here — execute a fully-decided request only.
 * - AP-2: Map all responses to core types before returning.
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

function mockXComments(campaignId: EntityId): AdapterCommentEvent[] {
    const records: CommentRecord[] = [
        {
            id: newEntityId('comment'),
            channel: 'x',
            campaignId,
            authorName: '@indie_hacker_99',
            body: 'This is exactly what I needed for my SaaS launch. Bookmarked.',
            timestamp: new Date().toISOString(),
        },
        {
            id: newEntityId('comment'),
            channel: 'x',
            campaignId,
            authorName: '@skeptic_sam',
            body: 'Seen a hundred tools like this. What actually makes it different?',
            timestamp: new Date().toISOString(),
        },
        {
            id: newEntityId('comment'),
            channel: 'x',
            campaignId,
            authorName: '@crypto_gains_daily',
            body: '🚀🚀 Follow me for 10x your investment guaranteed',
            timestamp: new Date().toISOString(),
        },
    ];
    return records.map(comment => ({
        comment,
        raw: { source: 'x-mock', tweetId: `mock_tweet_${campaignId}` },
    }));
}

// ── Character limit helper ────────────────────────────────────────
// X has a 280-character limit (280 for basic, 25000 for Blue).
// Adapters truncate gracefully and log a warning — they do NOT error.
const X_CHAR_LIMIT = 280;

function truncateForX(content: string): string {
    if (content.length <= X_CHAR_LIMIT) return content;
    const truncated = content.slice(0, X_CHAR_LIMIT - 1) + '…';
    console.warn(`[x-adapter] Content truncated from ${content.length} to ${X_CHAR_LIMIT} chars for X.`);
    return truncated;
}

// ── Adapter factory ───────────────────────────────────────────────

export function makeXAdapter(): ProviderAdapter {
    return {
        name: 'x',

        publish(req: AdapterPublishRequest): AdapterPublishResponse {
            const cred = getCredentialStore().get('x');

            if (!isCredentialValid(cred)) {
                console.info(`[x-adapter] mock-safe publish (job ${req.jobId}) — no live credential.`);
                return {
                    jobId: req.jobId,
                    channel: 'x',
                    success: true,
                    externalId: `x_mock_${req.jobId}_${Date.now().toString(36)}`,
                };
            }

            // ── Live mode skeleton ────────────────────────────────
            const tweetText = truncateForX(req.content);
            void tweetText; // used in live call below

            // TODO: POST /2/tweets with { "text": tweetText }
            //   Authorization: Bearer {cred.value}
            //   Or OAuth 1.0a: sign with cred.value (api_key) + cred.secret (api_secret)
            // TODO: if req.scheduledAt is in the future, use /2/tweets with scheduled_at
            //   (requires X API v2 Scheduled Tweets endpoint)
            // TODO: map response.data.id → externalId
            // TODO: handle 429 (rate limited), 403 (duplicate content), 401 (invalid token)
            console.info(`[x-adapter] live publish (job ${req.jobId}) — credential present.`);
            return {
                jobId: req.jobId,
                channel: 'x',
                success: true,
                externalId: `x_live_${req.jobId}_stub`,
            };
        },

        ingestComments(campaignId: EntityId): AdapterCommentEvent[] {
            const cred = getCredentialStore().get('x');

            if (!isCredentialValid(cred)) {
                return mockXComments(campaignId);
            }

            // TODO: GET /2/tweets/{tweetId}/reply_conversation_fields
            //   Filter to direct replies using referenced_tweets[type=replied_to]
            // TODO: expand author_id → username via /2/users endpoint
            // TODO: paginate with next_token
            console.info(`[x-adapter] live ingestComments (campaign ${campaignId}) — credential present.`);
            return mockXComments(campaignId); // stub until live wired
        },

        sendReply(payload: ReplyPayload): AdapterPublishResponse {
            const cred = getCredentialStore().get('x');

            if (!isCredentialValid(cred)) {
                return {
                    jobId: payload.replyId,
                    channel: 'x',
                    success: true,
                    externalId: `x_reply_mock_${Date.now().toString(36)}`,
                };
            }

            const replyText = truncateForX(payload.body);
            void replyText;

            // TODO: POST /2/tweets with { "text": replyText, "reply": { "in_reply_to_tweet_id": payload.commentId } }
            // TODO: map response.data.id → externalId
            console.info(`[x-adapter] live sendReply (reply ${payload.replyId}) — credential present.`);
            return {
                jobId: payload.replyId,
                channel: 'x',
                success: true,
                externalId: `x_reply_live_${payload.replyId}_stub`,
            };
        },
    };
}
