/**
 * linkedin-adapter.ts — ADAPT-4
 * Platform adapter for LinkedIn (Company Pages + Lead Gen Forms).
 *
 * Mock-safe mode (default): when LINKEDIN_ACCESS_TOKEN is absent, all methods
 * return deterministic mock responses. No real API calls, no errors thrown.
 *
 * Live mode (future): wire LinkedIn Marketing API v2 using cred.value as
 * the OAuth 2.0 bearer token. See TODO blocks below.
 *
 * Anti-pattern guard:
 * - AP-1: No domain decisions here — only execute a fully-decided request.
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

function mockLinkedInComments(campaignId: EntityId): AdapterCommentEvent[] {
    const records: CommentRecord[] = [
        {
            id: newEntityId('comment'),
            channel: 'linkedin',
            campaignId,
            authorName: 'Rachel S.',
            body: 'Great post. We\'ve been looking for something exactly like this for our B2B team.',
            timestamp: new Date().toISOString(),
        },
        {
            id: newEntityId('comment'),
            channel: 'linkedin',
            campaignId,
            authorName: 'Marcus P.',
            body: 'Interesting approach. What industries does this work best for?',
            timestamp: new Date().toISOString(),
        },
        {
            id: newEntityId('comment'),
            channel: 'linkedin',
            campaignId,
            authorName: 'Connections4Free_Bot',
            body: 'Great content! Let\'s connect and grow our networks together!',
            timestamp: new Date().toISOString(),
        },
    ];
    return records.map(comment => ({
        comment,
        raw: { source: 'linkedin-mock', ugcPostUrn: `urn:li:ugcPost:mock_${campaignId}` },
    }));
}

// ── Adapter factory ───────────────────────────────────────────────

export function makeLinkedInAdapter(): ProviderAdapter {
    return {
        name: 'linkedin',

        publish(req: AdapterPublishRequest): AdapterPublishResponse {
            const cred = getCredentialStore().get('linkedin');

            if (!isCredentialValid(cred)) {
                console.info(`[linkedin-adapter] mock-safe publish (job ${req.jobId}) — no live credential.`);
                return {
                    jobId: req.jobId,
                    channel: 'linkedin',
                    success: true,
                    externalId: `li_mock_${req.jobId}_${Date.now().toString(36)}`,
                };
            }

            // ── Live mode skeleton ────────────────────────────────
            // TODO: POST /v2/ugcPosts with author=urn:li:organization:{orgId}
            // TODO: set specificContent.com.linkedin.ugc.ShareContent.shareCommentary.text = req.content
            // TODO: set visibility.com.linkedin.ugc.MemberNetworkVisibility = PUBLIC
            // TODO: map response.id (ugcPost URN) → externalId
            // TODO: handle 401 (token expired), 403 (insufficient scope), 429 (rate limit)
            console.info(`[linkedin-adapter] live publish (job ${req.jobId}) — credential present.`);
            return {
                jobId: req.jobId,
                channel: 'linkedin',
                success: true,
                externalId: `li_live_${req.jobId}_stub`,
            };
        },

        ingestComments(campaignId: EntityId): AdapterCommentEvent[] {
            const cred = getCredentialStore().get('linkedin');

            if (!isCredentialValid(cred)) {
                return mockLinkedInComments(campaignId);
            }

            // TODO: GET /v2/socialActions/{ugcPostUrn}/comments
            // TODO: paginate using start + count params
            // TODO: map each comment's actor (member/org URN) → authorName
            console.info(`[linkedin-adapter] live ingestComments (campaign ${campaignId}) — credential present.`);
            return mockLinkedInComments(campaignId); // stub until live wired
        },

        sendReply(payload: ReplyPayload): AdapterPublishResponse {
            const cred = getCredentialStore().get('linkedin');

            if (!isCredentialValid(cred)) {
                return {
                    jobId: payload.replyId,
                    channel: 'linkedin',
                    success: true,
                    externalId: `li_reply_mock_${Date.now().toString(36)}`,
                };
            }

            // TODO: POST /v2/socialActions/{parentCommentUrn}/comments
            // TODO: set actor, object, message.text = payload.body
            // TODO: map response URN → externalId
            console.info(`[linkedin-adapter] live sendReply (reply ${payload.replyId}) — credential present.`);
            return {
                jobId: payload.replyId,
                channel: 'linkedin',
                success: true,
                externalId: `li_reply_live_${payload.replyId}_stub`,
            };
        },
    };
}
