/**
 * ADP-A1 — Registry Tests
 */

import { describe, test, expect } from 'vitest';
import {
    getAdapter,
    listAdapters,
    isAdapterRegistered,
    registerAdapter,
    type ProviderAdapter,
} from '../registry';
import type { AdapterName, EntityId, AdapterPublishRequest, ReplyPayload } from '../../../core/src/types';

const ALL_CHANNELS: AdapterName[] = [
    'meta', 'linkedin', 'x', 'email', 
    'instagram', 'reddit', 'tiktok', 'facebook', 
    'youtube', 'substack', 'pinterest', 'threads'
];

describe('Provider Registry', () => {
    describe('listAdapters()', () => {
        test('returns all 4 default channels', () => {
            const adapters = listAdapters();
            for (const ch of ALL_CHANNELS) {
                expect(adapters).toContain(ch);
            }
        });
    });

    describe('isAdapterRegistered()', () => {
        test('returns true for all 4 default channels', () => {
            for (const ch of ALL_CHANNELS) {
                expect(isAdapterRegistered(ch)).toBe(true);
            }
        });

        test('returns false for unknown channel', () => {
            expect(isAdapterRegistered('unknown_channel' as AdapterName)).toBe(false);
        });
    });

    describe('getAdapter()', () => {
        test.each(ALL_CHANNELS)('returns ok=true for "%s"', (name) => {
            const result = getAdapter(name);
            expect(result.ok).toBe(true);
            if (result.ok) {
                expect(result.result).toBeDefined();
                expect(result.result.name).toBe(name);
            }
        });

        test('returns ADAPTER_NOT_CONFIGURED for unknown provider', () => {
            const result = getAdapter('unknown_channel' as AdapterName);
            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(result.error.code).toBe('ADAPTER_NOT_CONFIGURED');
                expect(result.error.module).toBe('adapters');
            }
        });
    });

    describe('mock adapter — publish()', () => {
        test.each(ALL_CHANNELS)('%s adapter publish returns success response', (ch) => {
            const result = getAdapter(ch);
            if (!result.ok) throw new Error(result.error.message);
            const adapter = result.result;
            const req: AdapterPublishRequest = {
                jobId: `job_000001` as EntityId,
                channel: ch,
                content: 'Test content',
                scheduledAt: new Date().toISOString(),
            };
            const res = adapter.publish(req);
            expect(res.success).toBe(true);
            expect(res.jobId).toBe(req.jobId);
            expect(res.channel).toBe(ch);
            expect(res.externalId).toBeTruthy();
        });
    });

    describe('mock adapter — ingestComments()', () => {
        test.each(ALL_CHANNELS)('%s adapter returns comment events', (ch) => {
            const result = getAdapter(ch);
            if (!result.ok) throw new Error(result.error.message);
            const adapter = result.result;
            const events = adapter.ingestComments('camp_000001' as EntityId);
            expect(events.length).toBeGreaterThan(0);
            for (const ev of events) {
                expect(ev.comment.channel).toBe(ch);
                expect(ev.comment.id).toMatch(/^comment_/);
                expect(ev.raw).toBeDefined();
            }
        });
    });

    describe('mock adapter — sendReply()', () => {
        test.each(ALL_CHANNELS)('%s adapter sendReply returns success', (ch) => {
            const result = getAdapter(ch);
            if (!result.ok) throw new Error(result.error.message);
            const adapter = result.result;
            const payload: ReplyPayload = {
                replyId: 'reply_000001' as EntityId,
                channel: ch,
                commentId: 'comment_000001' as EntityId,
                body: 'Thanks for reaching out!',
            };
            const res = adapter.sendReply(payload);
            expect(res.success).toBe(true);
            expect(res.jobId).toBe(payload.replyId);
        });
    });

    describe('registerAdapter()', () => {
        test('registers a custom adapter and it is retrievable', () => {
            const custom: ProviderAdapter = {
                name: 'email' as AdapterName,
                publish: (req) => ({ jobId: req.jobId, channel: 'email', success: false }),
                ingestComments: () => [],
                sendReply: (p) => ({ jobId: p.replyId, channel: 'email', success: false }),
            };
            registerAdapter(custom);
            const result = getAdapter('email');
            expect(result.ok).toBe(true);
            // Clean up — restore real mock
            // (no hard reset needed, other tests use their own adapter calls)
        });
    });
});
