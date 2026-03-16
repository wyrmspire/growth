/**
 * ADP-A2 — enqueuePublish() Tests
 */

import { describe, test, expect } from 'vitest';
import { enqueuePublish } from '../publish';
import { registerAdapter, type ProviderAdapter } from '../registry';
import type { AdapterPublishRequest, EntityId, AdapterName } from '../../../core/src/types';

const makeReq = (channel: AdapterName = 'meta'): AdapterPublishRequest => ({
    jobId: 'job_000001' as EntityId,
    channel,
    content: 'Check out our new offer!',
    scheduledAt: new Date().toISOString(),
});

describe('enqueuePublish()', () => {
    describe('valid requests', () => {
        test('meta publish returns ok=true', () => {
            const result = enqueuePublish(makeReq('meta'));
            expect(result.ok).toBe(true);
            if (result.ok) {
                expect(result.response).toBeDefined();
            }
        });

        test('response has all normalized fields', () => {
            const result = enqueuePublish(makeReq('email'));
            if (result.ok) {
                expect(result.response?.jobId).toBeDefined();
                expect(result.response?.channel).toBe('email');
                expect(typeof result.response?.success).toBe('boolean');
            }
        });

        test('response.success is true for mock adapters', () => {
            for (const ch of ['meta', 'linkedin', 'x', 'email'] as AdapterName[]) {
                const result = enqueuePublish(makeReq(ch));
                if (result.ok) {
                    expect(result.response?.success).toBe(true);
                }
            }
        });

        test('externalId is present in response', () => {
            const result = enqueuePublish(makeReq('linkedin'));
            if (result.ok) {
                expect(result.response?.externalId).toBeTruthy();
            }
        });
    });

    describe('invalid request', () => {
        test('missing jobId returns error', () => {
            const result = enqueuePublish({ ...makeReq(), jobId: '' as EntityId });
            expect(result.ok).toBe(false);
        });

        test('missing content returns error', () => {
            const result = enqueuePublish({ ...makeReq(), content: '' });
            expect(result.ok).toBe(false);
        });

        test('missing scheduledAt returns error', () => {
            const result = enqueuePublish({ ...makeReq(), scheduledAt: '' });
            expect(result.ok).toBe(false);
        });

        test('unknown channel returns ADAPTER_NOT_CONFIGURED', () => {
            const result = enqueuePublish({ ...makeReq(), channel: 'unknown_channel' as AdapterName });
            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(result.error.code).toBe('ADAPTER_NOT_CONFIGURED');
            }
        });

        test('error module is adapters', () => {
            const result = enqueuePublish({ ...makeReq(), content: '' });
            if (!result.ok) {
                expect(result.error.module).toBe('adapters');
            }
        });
    });

    describe('provider failure handling', () => {
        test('translates provider exception to PROVIDER_REQUEST_FAILED', () => {
            // Register a bad adapter that throws
            const broken: ProviderAdapter = {
                name: 'x' as AdapterName,
                publish: () => { throw new Error('API down'); },
                ingestComments: () => [],
                sendReply: () => ({ jobId: '' as EntityId, channel: 'x', success: false }),
            };
            registerAdapter(broken);

            const result = enqueuePublish(makeReq('x'));
            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(result.error.code).toBe('PROVIDER_REQUEST_FAILED');
                expect(result.error.message).toContain('API down');
            }

            // Restore clean adapter after test
            registerAdapter({
                name: 'x' as AdapterName,
                publish: (req) => ({ jobId: req.jobId, channel: 'x', success: true, externalId: 'restored' }),
                ingestComments: () => [],
                sendReply: (p) => ({ jobId: p.replyId, channel: 'x', success: true }),
            });
        });
    });
});
