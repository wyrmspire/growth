/**
 * youtube-adapter.ts
 * Platform adapter for YouTube.
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

function mockYouTubeComments(campaignId: EntityId): AdapterCommentEvent[] {
    const records: CommentRecord[] = [
        {
            id: newEntityId('comment'),
            channel: 'youtube', // This should match a ChannelName if used in Comments
            campaignId,
            authorName: 'YT Viewer',
            body: 'First!',
            timestamp: new Date().toISOString(),
        }
    ];
    return records.map(comment => ({
        comment,
        raw: { source: 'youtube-mock', ytId: `mock_yt_${campaignId}` },
    }));
}

const YOUTUBE_CHAR_LIMIT = 5000;

export function makeYouTubeAdapter(): ProviderAdapter {
    return {
        name: 'youtube',

        publish(req: AdapterPublishRequest): AdapterPublishResponse {
            const cred = getCredentialStore().get('youtube');

            if (!isCredentialValid(cred)) {
                return {
                    jobId: req.jobId,
                    channel: 'youtube',
                    success: true,
                    externalId: `yt_mock_${req.jobId}`,
                };
            }

            return {
                jobId: req.jobId,
                channel: 'youtube',
                success: true,
                externalId: `yt_live_${req.jobId}`,
            };
        },

        ingestComments(campaignId: EntityId): AdapterCommentEvent[] {
            return mockYouTubeComments(campaignId); 
        },

        sendReply(payload: ReplyPayload): AdapterPublishResponse {
            return {
                jobId: payload.replyId,
                channel: 'youtube',
                success: true,
                externalId: `yt_reply_mock_${Date.now()}`,
            };
        },
    };
}
