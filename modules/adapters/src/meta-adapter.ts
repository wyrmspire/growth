/**
 * meta-adapter.ts — ADAPT-3
 * Platform adapter for Meta (Facebook/Instagram Ads + Pages).
 *
 * Mock-safe mode (default): when META_ACCESS_TOKEN is absent from the
 * credential store, all methods return deterministic mock responses.
 * No real API calls are made, no errors thrown.
 *
 * Live mode (future): when a valid credential is present, the
 * TODO sections below wire into the Meta Graph API SDK.
 *
 * Anti-pattern guard (ANTI_PATTERNS.md):
 * - AP-1: This adapter accepts fully-decided publish requests. No variant
 *   selection or domain policy decisions are made here.
 * - AP-2: All responses are mapped to AdapterPublishResponse / AdapterCommentEvent
 *   core types before returning — no raw Meta API payloads leak out.
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

function mockMetaComments(campaignId: EntityId): AdapterCommentEvent[] {
    const records: CommentRecord[] = [
        {
            id: newEntityId('comment'),
            channel: 'meta',
            campaignId,
            authorName: 'Alex T.',
            body: 'Saw this in my feed — very relevant to what we\'re working on!',
            timestamp: new Date().toISOString(),
        },
        {
            id: newEntityId('comment'),
            channel: 'meta',
            campaignId,
            authorName: 'Jordan K.',
            body: 'Is there a free trial? Would love to test before committing.',
            timestamp: new Date().toISOString(),
        },
        {
            id: newEntityId('comment'),
            channel: 'meta',
            campaignId,
            authorName: 'Promo_Bot_442',
            body: '💰 MAKE $1000/DAY CLICK HERE 💰',
            timestamp: new Date().toISOString(),
        },
    ];
    return records.map(comment => ({
        comment,
        raw: { source: 'meta-mock', postId: `meta_post_${campaignId}` },
    }));
}

// ── Adapter factory ───────────────────────────────────────────────

export function makeMetaAdapter(): ProviderAdapter {
    return {
        name: 'meta',

        publish(req: AdapterPublishRequest): AdapterPublishResponse {
            const cred = getCredentialStore().get('meta');

            if (!isCredentialValid(cred)) {
                // ── Mock-safe mode ────────────────────────────────
                console.info(`[meta-adapter] mock-safe publish (job ${req.jobId}) — no live credential.`);
                return {
                    jobId: req.jobId,
                    channel: 'meta',
                    success: true,
                    externalId: `meta_mock_${req.jobId}_${Date.now().toString(36)}`,
                };
            }

            // ── Live mode skeleton ────────────────────────────────
            // TODO: initialise Meta Graph API client with cred.value
            // TODO: POST /me/feed or /act_{adAccountId}/adcreatives
            // TODO: map response.id → externalId
            // TODO: handle rate-limit (code 17) and token-expired (code 190) errors
            console.info(`[meta-adapter] live publish (job ${req.jobId}) — credential present.`);
            return {
                jobId: req.jobId,
                channel: 'meta',
                success: true,
                externalId: `meta_live_${req.jobId}_stub`,
            };
        },

        ingestComments(campaignId: EntityId): AdapterCommentEvent[] {
            const cred = getCredentialStore().get('meta');

            if (!isCredentialValid(cred)) {
                return mockMetaComments(campaignId);
            }

            // TODO: GET /me/feed?fields=comments{id,from,message,created_time}
            // TODO: filter to posts belonging to this campaignId
            // TODO: map each comment to AdapterCommentEvent
            console.info(`[meta-adapter] live ingestComments (campaign ${campaignId}) — credential present.`);
            return mockMetaComments(campaignId); // stub until live wired
        },

        sendReply(payload: ReplyPayload): AdapterPublishResponse {
            const cred = getCredentialStore().get('meta');

            if (!isCredentialValid(cred)) {
                return {
                    jobId: payload.replyId,
                    channel: 'meta',
                    success: true,
                    externalId: `meta_reply_mock_${Date.now().toString(36)}`,
                };
            }

            // TODO: POST /{comment-id}/comments with message=payload.body
            // TODO: map response.id → externalId
            console.info(`[meta-adapter] live sendReply (reply ${payload.replyId}) — credential present.`);
            return {
                jobId: payload.replyId,
                channel: 'meta',
                success: true,
                externalId: `meta_reply_live_${payload.replyId}_stub`,
            };
        },
    };
}
