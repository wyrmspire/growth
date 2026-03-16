/**
 * substack-adapter.ts
 * Platform adapter for Substack.
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

function mockSubstackComments(campaignId: EntityId): AdapterCommentEvent[] {
    const records: CommentRecord[] = [
        {
            id: newEntityId('comment'),
            channel: 'substack',
            campaignId,
            authorName: 'Subscriber 1',
            body: 'Loved the newsletter today!',
            timestamp: new Date().toISOString(),
        }
    ];
    return records.map(comment => ({
        comment,
        raw: { source: 'substack-mock', subId: `mock_sub_${campaignId}` },
    }));
}

export function makeSubstackAdapter(): ProviderAdapter {
    return {
        name: 'substack',

        publish(req: AdapterPublishRequest): AdapterPublishResponse {
            const cred = getCredentialStore().get('substack');

            if (!isCredentialValid(cred)) {
                return {
                    jobId: req.jobId,
                    channel: 'substack',
                    success: true,
                    externalId: `sub_mock_${req.jobId}`,
                };
            }

            return {
                jobId: req.jobId,
                channel: 'substack',
                success: true,
                externalId: `sub_live_${req.jobId}`,
            };
        },

        ingestComments(campaignId: EntityId): AdapterCommentEvent[] {
            return mockSubstackComments(campaignId); 
        },

        sendReply(payload: ReplyPayload): AdapterPublishResponse {
            return {
                jobId: payload.replyId,
                channel: 'substack',
                success: true,
                externalId: `sub_reply_mock_${Date.now()}`,
            };
        },
    };
}
