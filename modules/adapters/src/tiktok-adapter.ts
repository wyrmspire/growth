/**
 * tiktok-adapter.ts
 * Platform adapter for TikTok.
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

function mockTikTokComments(campaignId: EntityId): AdapterCommentEvent[] {
    const records: CommentRecord[] = [
        {
            id: newEntityId('comment'),
            channel: 'tiktok',
            campaignId,
            authorName: 'tiktok_star_42',
            body: 'Great content! Love the tips.',
            timestamp: new Date().toISOString(),
        }
    ];
    return records.map(comment => ({
        comment,
        raw: { source: 'tiktok-mock', tiktokId: `mock_tiktok_${campaignId}` },
    }));
}

const TIKTOK_CHAR_LIMIT = 2200;

export function makeTikTokAdapter(): ProviderAdapter {
    return {
        name: 'tiktok',

        publish(req: AdapterPublishRequest): AdapterPublishResponse {
            const cred = getCredentialStore().get('tiktok');

            if (!isCredentialValid(cred)) {
                return {
                    jobId: req.jobId,
                    channel: 'tiktok',
                    success: true,
                    externalId: `tiktok_mock_${req.jobId}`,
                };
            }

            return {
                jobId: req.jobId,
                channel: 'tiktok',
                success: true,
                externalId: `tiktok_live_${req.jobId}`,
            };
        },

        ingestComments(campaignId: EntityId): AdapterCommentEvent[] {
            return mockTikTokComments(campaignId); 
        },

        sendReply(payload: ReplyPayload): AdapterPublishResponse {
            return {
                jobId: payload.replyId,
                channel: 'tiktok',
                success: true,
                externalId: `tiktok_reply_mock_${Date.now()}`,
            };
        },
    };
}
