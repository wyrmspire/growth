/**
 * instagram-adapter.ts
 * Platform adapter for Instagram.
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

function mockInstagramComments(campaignId: EntityId): AdapterCommentEvent[] {
    const records: CommentRecord[] = [
        {
            id: newEntityId('comment'),
            channel: 'instagram',
            campaignId,
            authorName: 'insta_user_1',
            body: 'Amazing picture! What filters do you use?',
            timestamp: new Date().toISOString(),
        }
    ];
    return records.map(comment => ({
        comment,
        raw: { source: 'instagram-mock', igId: `mock_ig_${campaignId}` },
    }));
}

const INSTAGRAM_CHAR_LIMIT = 2200;

export function makeInstagramAdapter(): ProviderAdapter {
    return {
        name: 'instagram',

        publish(req: AdapterPublishRequest): AdapterPublishResponse {
            const cred = getCredentialStore().get('instagram') || getCredentialStore().get('meta');

            if (!isCredentialValid(cred)) {
                return {
                    jobId: req.jobId,
                    channel: 'instagram',
                    success: true,
                    externalId: `ig_mock_${req.jobId}`,
                };
            }

            return {
                jobId: req.jobId,
                channel: 'instagram',
                success: true,
                externalId: `ig_live_${req.jobId}`,
            };
        },

        ingestComments(campaignId: EntityId): AdapterCommentEvent[] {
            return mockInstagramComments(campaignId); 
        },

        sendReply(payload: ReplyPayload): AdapterPublishResponse {
            return {
                jobId: payload.replyId,
                channel: 'instagram',
                success: true,
                externalId: `ig_reply_mock_${Date.now()}`,
            };
        },
    };
}
