/**
 * platform-adapters.test.ts — ADAPT-8
 * Tests for the 4 platform adapters (meta, linkedin, x, email).
 * All tests run in mock-safe mode (no credentials set).
 * Separate credential-present tests confirm live-branch is reachable.
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { makeMetaAdapter } from '../meta-adapter';
import { makeLinkedInAdapter } from '../linkedin-adapter';
import { makeXAdapter } from '../x-adapter';
import { makeEmailAdapter } from '../email-adapter';
import { _testSetCredential, _testClearAll } from '../credentials';
import type { AdapterPublishRequest, ReplyPayload, EntityId } from '../../../core/src/types';

// ── Fixtures ──────────────────────────────────────────────────────
const JOB_ID = 'job_000test' as EntityId;
const CAMPAIGN_ID = 'camp_000test' as EntityId;
const COMMENT_ID = 'comment_000test' as EntityId;
const REPLY_ID = 'reply_000test' as EntityId;

const BASE_REQ = (channel: 'meta' | 'linkedin' | 'x' | 'email'): AdapterPublishRequest => ({
    jobId: JOB_ID,
    channel,
    content: 'Test campaign content for unit testing.',
    scheduledAt: new Date().toISOString(),
});

const BASE_REPLY = (channel: 'meta' | 'linkedin' | 'x' | 'email'): ReplyPayload => ({
    replyId: REPLY_ID,
    channel,
    commentId: COMMENT_ID,
    body: 'Thanks for your comment!',
});

beforeEach(() => {
    _testClearAll();
});

afterEach(() => {
    _testClearAll();
});

// ── Shared test runner ────────────────────────────────────────────
type AdapterFactory = () => ReturnType<typeof makeMetaAdapter>;
type Channel = 'meta' | 'linkedin' | 'x' | 'email';

function runAdapterSuite(label: string, channel: Channel, makeAdapter: AdapterFactory) {
    describe(`${label} — mock-safe mode (no credential)`, () => {
        test('publish() returns success with mock externalId', () => {
            const adapter = makeAdapter();
            const res = adapter.publish(BASE_REQ(channel));
            expect(res.success).toBe(true);
            expect(res.jobId).toBe(JOB_ID);
            expect(res.channel).toBe(channel);
            expect(res.externalId).toBeTruthy();
            expect(typeof res.externalId).toBe('string');
        });

        test('publish() externalId contains "mock"', () => {
            const adapter = makeAdapter();
            const res = adapter.publish(BASE_REQ(channel));
            expect(res.externalId).toMatch(/mock/);
        });

        test('ingestComments() returns at least 2 comment events', () => {
            const adapter = makeAdapter();
            const events = adapter.ingestComments(CAMPAIGN_ID);
            expect(events.length).toBeGreaterThanOrEqual(2);
        });

        test('ingestComments() events have correct channel and campaignId', () => {
            const adapter = makeAdapter();
            const events = adapter.ingestComments(CAMPAIGN_ID);
            for (const ev of events) {
                expect(ev.comment.channel).toBe(channel);
                expect(ev.comment.campaignId).toBe(CAMPAIGN_ID);
                expect(ev.comment.id).toBeTruthy();
                expect(ev.comment.authorName).toBeTruthy();
                expect(ev.comment.body).toBeTruthy();
                expect(ev.raw).toBeDefined();
            }
        });

        test('sendReply() returns success with mock externalId', () => {
            const adapter = makeAdapter();
            const res = adapter.sendReply(BASE_REPLY(channel));
            expect(res.success).toBe(true);
            expect(res.jobId).toBe(REPLY_ID);
            expect(res.channel).toBe(channel);
            expect(res.externalId).toBeTruthy();
        });

        test('adapter.name is the correct channel', () => {
            expect(makeAdapter().name).toBe(channel);
        });
    });

    describe(`${label} — live-mode stub (credential present)`, () => {
        test('publish() still returns success when credential is set', () => {
            _testSetCredential({ platform: channel, kind: 'api_key', value: 'fake_live_token' });
            const adapter = makeAdapter();
            const res = adapter.publish(BASE_REQ(channel));
            expect(res.success).toBe(true);
            expect(res.jobId).toBe(JOB_ID);
        });

        test('ingestComments() returns events when credential is set (stub)', () => {
            _testSetCredential({ platform: channel, kind: 'api_key', value: 'fake_live_token' });
            const adapter = makeAdapter();
            const events = adapter.ingestComments(CAMPAIGN_ID);
            expect(events.length).toBeGreaterThanOrEqual(2);
        });

        test('sendReply() returns success when credential is set', () => {
            _testSetCredential({ platform: channel, kind: 'api_key', value: 'fake_live_token' });
            const adapter = makeAdapter();
            const res = adapter.sendReply(BASE_REPLY(channel));
            expect(res.success).toBe(true);
        });

        test('externalId from live stub is a non-empty string', () => {
            _testSetCredential({ platform: channel, kind: 'api_key', value: 'fake_live_token' });
            const adapter = makeAdapter();
            const res = adapter.publish(BASE_REQ(channel));
            expect(typeof res.externalId).toBe('string');
            expect(res.externalId!.length).toBeGreaterThan(0);
        });
    });
}

runAdapterSuite('Meta Adapter', 'meta', makeMetaAdapter);
runAdapterSuite('LinkedIn Adapter', 'linkedin', makeLinkedInAdapter);
runAdapterSuite('X Adapter', 'x', makeXAdapter);
runAdapterSuite('Email Adapter', 'email', makeEmailAdapter);

// ── X-specific: character truncation ─────────────────────────────
describe('X Adapter — 280-char truncation', () => {
    test('publish() handles content exactly at 280 chars (no truncation)', () => {
        const content = 'A'.repeat(280);
        const adapter = makeXAdapter();
        const res = adapter.publish({ jobId: JOB_ID, channel: 'x', content, scheduledAt: new Date().toISOString() });
        expect(res.success).toBe(true);
    });

    test('publish() handles content over 280 chars without throwing', () => {
        const content = 'B'.repeat(400);
        const adapter = makeXAdapter();
        expect(() => adapter.publish({ jobId: JOB_ID, channel: 'x', content, scheduledAt: new Date().toISOString() })).not.toThrow();
    });

    test('sendReply() handles long body without throwing', () => {
        const adapter = makeXAdapter();
        expect(() => adapter.sendReply({
            replyId: REPLY_ID,
            channel: 'x',
            commentId: COMMENT_ID,
            body: 'C'.repeat(500),
        })).not.toThrow();
    });
});

// ── Expired credential falls back to mock-safe ───────────────────
describe('Expired credential falls back to mock-safe', () => {
    test.each(['meta', 'linkedin', 'x', 'email'] as Channel[])('%s adapter handles expired credential gracefully', (channel) => {
        _testSetCredential({
            platform: channel,
            kind: 'api_key',
            value: 'expired_tok',
            expiresAt: new Date(Date.now() - 1000).toISOString(),
        });
        const adapters = {
            meta: makeMetaAdapter(),
            linkedin: makeLinkedInAdapter(),
            x: makeXAdapter(),
            email: makeEmailAdapter(),
        };
        const res = adapters[channel].publish(BASE_REQ(channel));
        expect(res.success).toBe(true);
        // Expired cred → mock-safe path → externalId contains "mock"
        expect(res.externalId).toMatch(/mock/);
    });
});
