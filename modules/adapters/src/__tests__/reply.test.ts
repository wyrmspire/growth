import { sendReply } from '../reply';
import { _resetRegistry, registerAdapter, type ProviderAdapter } from '../registry';
import type { AdapterName, EntityId } from '../../../core/src/types';

const payload = {
    replyId: 'reply_000001' as EntityId,
    channel: 'meta' as AdapterName,
    commentId: 'comment_000001' as EntityId,
    body: 'Thanks for your question!',
};

beforeEach(() => {
    _resetRegistry();
});

describe('sendReply()', () => {
    test('sends reply and returns normalized success response', () => {
        const result = sendReply('meta', payload);
        expect(result.ok).toBe(true);
        expect(result.response.jobId).toBe(payload.replyId);
        expect(result.response.channel).toBe('meta');
        expect(result.response.success).toBe(true);
    });

    test('returns REPLY_SEND_FAILED for invalid payload', () => {
        const result = sendReply('meta', { ...payload, body: '' });
        expect(result.ok).toBe(false);
        expect(result.error?.code).toBe('REPLY_SEND_FAILED');
    });

    test('translates adapter failure to REPLY_SEND_FAILED', () => {
        const failing: ProviderAdapter = {
            name: 'meta',
            publish: (req) => ({ jobId: req.jobId, channel: 'meta', success: true }),
            ingestComments: () => [],
            sendReply: () => ({ jobId: payload.replyId, channel: 'meta', success: false }),
        };
        registerAdapter(failing);

        const result = sendReply('meta', payload);
        expect(result.ok).toBe(false);
        expect(result.error?.code).toBe('REPLY_SEND_FAILED');
    });

    test('translates adapter exception to REPLY_SEND_FAILED', () => {
        const broken: ProviderAdapter = {
            name: 'meta',
            publish: (req) => ({ jobId: req.jobId, channel: 'meta', success: true }),
            ingestComments: () => [],
            sendReply: () => {
                throw new Error('network issue');
            },
        };
        registerAdapter(broken);

        const result = sendReply('meta', payload);
        expect(result.ok).toBe(false);
        expect(result.error?.code).toBe('REPLY_SEND_FAILED');
        expect(result.error?.message).toContain('network issue');
    });
});
