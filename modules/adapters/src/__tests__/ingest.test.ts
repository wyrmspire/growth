import { ingestComments } from '../comments-ingest';
import { _resetRegistry, registerAdapter, type ProviderAdapter } from '../registry';
import type { AdapterName, EntityId, ReplyPayload } from '../../../core/src/types';

beforeEach(() => {
    _resetRegistry();
});

describe('ingestComments()', () => {
    test.each(['meta', 'linkedin', 'x', 'email'] as AdapterName[])(
        'ingests comments for channel %s',
        (channel) => {
            const result = ingestComments(channel, 'camp_000001' as EntityId);
            expect(result.ok).toBe(true);
            expect(result.events.length).toBeGreaterThan(0);
            for (const event of result.events) {
                expect(event.comment.channel).toBe(channel);
                expect(event.comment.campaignId).toBe('camp_000001');
            }
        },
    );

    test('returns COMMENT_INGEST_FAILED for missing campaign id', () => {
        const result = ingestComments('meta', '' as EntityId);
        expect(result.ok).toBe(false);
        expect(result.error?.code).toBe('COMMENT_INGEST_FAILED');
    });

    test('translates adapter errors to COMMENT_INGEST_FAILED', () => {
        const broken: ProviderAdapter = {
            name: 'meta',
            publish: (req) => ({ jobId: req.jobId, channel: 'meta', success: true }),
            ingestComments: () => {
                throw new Error('provider timeout');
            },
            sendReply: (payload: ReplyPayload) => ({ jobId: payload.replyId, channel: 'meta', success: true }),
        };
        registerAdapter(broken);

        const result = ingestComments('meta', 'camp_000001' as EntityId);
        expect(result.ok).toBe(false);
        expect(result.error?.code).toBe('COMMENT_INGEST_FAILED');
        expect(result.error?.module).toBe('adapters');
        expect(result.error?.message).toContain('provider timeout');
    });
});
