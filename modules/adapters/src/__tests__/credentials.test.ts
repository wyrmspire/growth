/**
 * credentials.test.ts — ADAPT-8
 * Tests for the credential store, availability helpers, and env seeding.
 */

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import {
    getCredentialStore,
    getPlatformAvailability,
    getAllPlatformAvailability,
    seedCredentialsFromEnv,
    _testSetCredential,
    _testClearAll,
} from '../credentials';
import type { PlatformCredential } from '../../../core/src/types';

beforeEach(() => {
    _testClearAll();
});

afterEach(() => {
    _testClearAll();
    vi.unstubAllEnvs();
});

describe('getCredentialStore()', () => {
    test('set and get roundtrip', () => {
        const store = getCredentialStore();
        const cred: PlatformCredential = { platform: 'meta', kind: 'api_key', value: 'tok_abc' };
        store.set('meta', cred);
        expect(store.get('meta')).toEqual(cred);
    });

    test('has() returns false when missing', () => {
        expect(getCredentialStore().has('meta')).toBe(false);
    });

    test('has() returns true after set', () => {
        getCredentialStore().set('meta', { platform: 'meta', kind: 'api_key', value: 'tok' });
        expect(getCredentialStore().has('meta')).toBe(true);
    });

    test('clear() removes single platform', () => {
        const store = getCredentialStore();
        store.set('meta', { platform: 'meta', kind: 'api_key', value: 'tok' });
        store.set('linkedin', { platform: 'linkedin', kind: 'oauth_token', value: 'tok2' });
        store.clear('meta');
        expect(store.has('meta')).toBe(false);
        expect(store.has('linkedin')).toBe(true);
    });

    test('clearAll() removes all platforms', () => {
        const store = getCredentialStore();
        store.set('meta', { platform: 'meta', kind: 'api_key', value: 'a' });
        store.set('x', { platform: 'x', kind: 'api_key', value: 'b' });
        store.clearAll();
        expect(store.has('meta')).toBe(false);
        expect(store.has('x')).toBe(false);
    });
});

describe('getPlatformAvailability()', () => {
    test('returns available=false with reason="missing" when no credential', () => {
        const avail = getPlatformAvailability('meta');
        expect(avail.platform).toBe('meta');
        expect(avail.available).toBe(false);
        expect(avail.reason).toBe('missing');
    });

    test('returns available=true when valid credential present', () => {
        _testSetCredential({ platform: 'linkedin', kind: 'oauth_token', value: 'Bearer xyz' });
        const avail = getPlatformAvailability('linkedin');
        expect(avail.available).toBe(true);
        expect(avail.reason).toBeUndefined();
    });

    test('returns available=false with reason="expired" when token is expired', () => {
        _testSetCredential({
            platform: 'x',
            kind: 'api_key',
            value: 'key',
            expiresAt: new Date(Date.now() - 1000).toISOString(), // 1 second in the past
        });
        const avail = getPlatformAvailability('x');
        expect(avail.available).toBe(false);
        expect(avail.reason).toBe('expired');
    });

    test('returns available=true when expiresAt is in the future', () => {
        _testSetCredential({
            platform: 'email',
            kind: 'smtp',
            value: 'smtp.example.com',
            expiresAt: new Date(Date.now() + 3_600_000).toISOString(), // 1 hour from now
        });
        const avail = getPlatformAvailability('email');
        expect(avail.available).toBe(true);
    });

    test('returns available=true when no expiresAt (non-expiring credential)', () => {
        _testSetCredential({ platform: 'meta', kind: 'api_key', value: 'permanent_token' });
        const avail = getPlatformAvailability('meta');
        expect(avail.available).toBe(true);
    });

    test('PlatformAvailability never contains credential value', () => {
        _testSetCredential({ platform: 'meta', kind: 'api_key', value: 'SECRET_TOKEN_VALUE' });
        const avail = getPlatformAvailability('meta');
        const serialised = JSON.stringify(avail);
        expect(serialised).not.toContain('SECRET_TOKEN_VALUE');
    });
});

describe('getAllPlatformAvailability()', () => {
    test('returns an entry for all platforms', () => {
        const all = getAllPlatformAvailability();
        expect(all).toHaveLength(12);
        const platforms = all.map(a => a.platform);
        expect(platforms).toContain('meta');
        expect(platforms).toContain('linkedin');
        expect(platforms).toContain('x');
        expect(platforms).toContain('email');
    });

    test('all platforms unavailable when store is empty', () => {
        const all = getAllPlatformAvailability();
        for (const a of all) {
            expect(a.available).toBe(false);
        }
    });

    test('only configured platforms show as available', () => {
        _testSetCredential({ platform: 'meta', kind: 'api_key', value: 'tok' });
        const all = getAllPlatformAvailability();
        const metaEntry = all.find(a => a.platform === 'meta')!;
        const liEntry = all.find(a => a.platform === 'linkedin')!;
        expect(metaEntry.available).toBe(true);
        expect(liEntry.available).toBe(false);
    });

    test('no entry in the result contains a credential value', () => {
        _testSetCredential({ platform: 'meta', kind: 'api_key', value: 'MY_SECRET' });
        const all = getAllPlatformAvailability();
        const serialised = JSON.stringify(all);
        expect(serialised).not.toContain('MY_SECRET');
    });
});

describe('seedCredentialsFromEnv()', () => {
    test('populates meta when META_ACCESS_TOKEN is set', () => {
        vi.stubEnv('META_ACCESS_TOKEN', 'meta_test_token');
        seedCredentialsFromEnv();
        expect(getPlatformAvailability('meta').available).toBe(true);
    });

    test('populates linkedin when LINKEDIN_ACCESS_TOKEN is set', () => {
        vi.stubEnv('LINKEDIN_ACCESS_TOKEN', 'li_test_token');
        seedCredentialsFromEnv();
        expect(getPlatformAvailability('linkedin').available).toBe(true);
    });

    test('populates x when X_API_KEY is set', () => {
        vi.stubEnv('X_API_KEY', 'x_test_key');
        seedCredentialsFromEnv();
        expect(getPlatformAvailability('x').available).toBe(true);
    });

    test('populates email when SMTP_HOST is set', () => {
        vi.stubEnv('SMTP_HOST', 'smtp.example.com');
        seedCredentialsFromEnv();
        expect(getPlatformAvailability('email').available).toBe(true);
    });

    test('populates reddit when REDDIT_CLIENT_ID is set', () => {
        vi.stubEnv('REDDIT_CLIENT_ID', 'test_id');
        seedCredentialsFromEnv();
        expect(getPlatformAvailability('reddit').available).toBe(true);
    });

    test('populates tiktok when TIKTOK_CLIENT_KEY is set', () => {
        vi.stubEnv('TIKTOK_CLIENT_KEY', 'test_key');
        seedCredentialsFromEnv();
        expect(getPlatformAvailability('tiktok').available).toBe(true);
    });

    test('populates instagram when INSTAGRAM_ACCESS_TOKEN is set', () => {
        vi.stubEnv('INSTAGRAM_ACCESS_TOKEN', 'test_token');
        seedCredentialsFromEnv();
        expect(getPlatformAvailability('instagram').available).toBe(true);
    });

    test('does not throw when no env vars are set', () => {
        expect(() => seedCredentialsFromEnv()).not.toThrow();
    });

    test('platforms without matching env vars remain unavailable', () => {
        vi.stubEnv('META_ACCESS_TOKEN', 'tok');
        seedCredentialsFromEnv();
        // linkedin not set
        expect(getPlatformAvailability('linkedin').available).toBe(false);
    });
});
