/**
 * pinterest-adapter.ts
 * Platform adapter for Pinterest.
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

function mockPinterestComments(campaignId: EntityId): AdapterCommentEvent[] {
    const records: CommentRecord[] = [
        {
            id: newEntityId('comment'),
            channel: 'pinterest', 
            campaignId,
            authorName: 'Pinner',
            body: 'Saved to my board!',
            timestamp: new Date().toISOString(),
        }
    ];
    return records.map(comment => ({
        comment,
        raw: { source: 'pinterest-mock', pinId: `mock_pin_${campaignId}` },
    }));
}

const PINTEREST_CHAR_LIMIT = 500;

export function makePinterestAdapter(): ProviderAdapter {
    return {
        name: 'pinterest',

        publish(req: AdapterPublishRequest): AdapterPublishResponse {
            const cred = getCredentialStore().get('pinterest');

            if (!isCredentialValid(cred)) {
                return {
                    jobId: req.jobId,
                    channel: 'pinterest',
                    success: true,
                    externalId: `pin_mock_${req.jobId}`,
                };
            }

            return {
                jobId: req.jobId,
                channel: 'pinterest',
                success: true,
                externalId: `pin_live_${req.jobId}`,
            };
        },

        ingestComments(campaignId: EntityId): AdapterCommentEvent[] {
            return mockPinterestComments(campaignId); 
        },

        sendReply(payload: ReplyPayload): AdapterPublishResponse {
            return {
                jobId: payload.replyId,
                channel: 'pinterest',
                success: true,
                externalId: `pin_reply_mock_${Date.now()}`,
            };
        },
    };
}
