/**
 * threads-adapter.ts
 * Platform adapter for Threads.
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

function mockThreadsComments(campaignId: EntityId): AdapterCommentEvent[] {
    const records: CommentRecord[] = [
        {
            id: newEntityId('comment'),
            channel: 'threads',
            campaignId,
            authorName: 'thread_user_1',
            body: 'Is this the new Twitter alternative?',
            timestamp: new Date().toISOString(),
        }
    ];
    return records.map(comment => ({
        comment,
        raw: { source: 'threads-mock', threadId: `mock_thread_${campaignId}` },
    }));
}

const THREADS_CHAR_LIMIT = 500;

export function makeThreadsAdapter(): ProviderAdapter {
    return {
        name: 'threads',

        publish(req: AdapterPublishRequest): AdapterPublishResponse {
            const cred = getCredentialStore().get('threads') || getCredentialStore().get('meta');

            if (!isCredentialValid(cred)) {
                return {
                    jobId: req.jobId,
                    channel: 'threads',
                    success: true,
                    externalId: `thread_mock_${req.jobId}`,
                };
            }

            return {
                jobId: req.jobId,
                channel: 'threads',
                success: true,
                externalId: `thread_live_${req.jobId}`,
            };
        },

        ingestComments(campaignId: EntityId): AdapterCommentEvent[] {
            return mockThreadsComments(campaignId); 
        },

        sendReply(payload: ReplyPayload): AdapterPublishResponse {
            return {
                jobId: payload.replyId,
                channel: 'threads',
                success: true,
                externalId: `thread_reply_mock_${Date.now()}`,
            };
        },
    };
}
