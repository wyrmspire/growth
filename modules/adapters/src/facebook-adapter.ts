/**
 * facebook-adapter.ts
 * Platform adapter for Facebook.
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

function mockFacebookComments(campaignId: EntityId): AdapterCommentEvent[] {
    const records: CommentRecord[] = [
        {
            id: newEntityId('comment'),
            channel: 'facebook',
            campaignId,
            authorName: 'FB User',
            body: 'Shared this with my group. Thanks!',
            timestamp: new Date().toISOString(),
        }
    ];
    return records.map(comment => ({
        comment,
        raw: { source: 'facebook-mock', fbId: `mock_fb_${campaignId}` },
    }));
}

const FACEBOOK_CHAR_LIMIT = 2200;

export function makeFacebookAdapter(): ProviderAdapter {
    return {
        name: 'facebook',

        publish(req: AdapterPublishRequest): AdapterPublishResponse {
            const cred = getCredentialStore().get('facebook') || getCredentialStore().get('meta');

            if (!isCredentialValid(cred)) {
                return {
                    jobId: req.jobId,
                    channel: 'facebook',
                    success: true,
                    externalId: `fb_mock_${req.jobId}`,
                };
            }

            return {
                jobId: req.jobId,
                channel: 'facebook',
                success: true,
                externalId: `fb_live_${req.jobId}`,
            };
        },

        ingestComments(campaignId: EntityId): AdapterCommentEvent[] {
            return mockFacebookComments(campaignId); 
        },

        sendReply(payload: ReplyPayload): AdapterPublishResponse {
            return {
                jobId: payload.replyId,
                channel: 'facebook',
                success: true,
                externalId: `fb_reply_mock_${Date.now()}`,
            };
        },
    };
}
