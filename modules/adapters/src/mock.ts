import type {
    AdapterPublishRequest, AdapterPublishResponse, AdapterCommentEvent,
    ReplyPayload, ChannelName, EntityId, CommentRecord,
} from '../../core/src/types';
import { newEntityId } from '../../core/src/id';

export function enqueuePublish(req: AdapterPublishRequest): AdapterPublishResponse {
    return {
        jobId: req.jobId,
        channel: req.channel,
        success: true,
        externalId: `ext_${req.channel}_${Date.now().toString(36)}`,
    };
}

export function ingestComments(channel: ChannelName, campaignId: EntityId): AdapterCommentEvent[] {
    const mockComments: CommentRecord[] = [
        {
            id: newEntityId('comment'),
            channel,
            campaignId,
            authorName: 'Sarah M.',
            body: 'This looks exactly like what we need for our team. How do we get started?',
            timestamp: new Date().toISOString(),
        },
        {
            id: newEntityId('comment'),
            channel,
            campaignId,
            authorName: 'Jake R.',
            body: 'Great content! We switched from our old tool last month and love it.',
            timestamp: new Date().toISOString(),
        },
        {
            id: newEntityId('comment'),
            channel,
            campaignId,
            authorName: 'Pat D.',
            body: 'Seems expensive compared to just using spreadsheets. What\'s the ROI?',
            timestamp: new Date().toISOString(),
        },
        {
            id: newEntityId('comment'),
            channel,
            campaignId,
            authorName: 'Bot_xyz_2847',
            body: 'Click here for FREE followers!!! 🔥🔥🔥 bit.ly/scam123',
            timestamp: new Date().toISOString(),
        },
    ];

    return mockComments.map(comment => ({
        comment,
        raw: { source: 'mock', channel },
    }));
}

export function sendReply(channel: ChannelName, payload: ReplyPayload): AdapterPublishResponse {
    return {
        jobId: payload.replyId,
        channel,
        success: true,
        externalId: `reply_${channel}_${Date.now().toString(36)}`,
    };
}
