/**
 * SETUP-7 — Setup Store & Page Tests
 *
 * Tests for:
 *   - src/setup-store.ts: key storage, masking, clear, platform statuses
 *   - src/pages/setup.ts: renderSetupPage() returns valid HTML
 *
 * Uses a vi.stubGlobal localStorage mock since the test env is node.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── localStorage mock factory ────────────────────────────────────────────────
function makeLocalStorageMock() {
    const store = new Map<string, string>();
    return {
        getItem: vi.fn((key: string) => store.get(key) ?? null),
        setItem: vi.fn((key: string, val: string) => { store.set(key, val); }),
        removeItem: vi.fn((key: string) => { store.delete(key); }),
        clear: vi.fn(() => { store.clear(); }),
        get length() { return store.size; },
        key: vi.fn((i: number) => Array.from(store.keys())[i] ?? null),
        _store: store,
    };
}

// ─── Setup Store Tests ────────────────────────────────────────────────────────
describe('setup-store — PLATFORM_SLOTS', () => {
    it('exports a non-empty PLATFORM_SLOTS array', async () => {
        const { PLATFORM_SLOTS } = await import('../setup-store');
        expect(Array.isArray(PLATFORM_SLOTS)).toBe(true);
        expect(PLATFORM_SLOTS.length).toBeGreaterThan(0);
    });

    it('contains expected social platforms', async () => {
        const { PLATFORM_SLOTS } = await import('../setup-store');
        const ids = PLATFORM_SLOTS.map((s) => s.id);
        expect(ids).toContain('facebook');
        expect(ids).toContain('instagram');
        expect(ids).toContain('reddit');
        expect(ids).toContain('tiktok');
        expect(ids).toContain('linkedin');
        expect(ids).toContain('substack');
        expect(ids).toContain('youtube');
        expect(ids).toContain('twitter');
    });

    it('every slot has an id, label, and at least one field', async () => {
        const { PLATFORM_SLOTS } = await import('../setup-store');
        PLATFORM_SLOTS.forEach((slot) => {
            expect(typeof slot.id).toBe('string');
            expect(slot.id.length).toBeGreaterThan(0);
            expect(typeof slot.label).toBe('string');
            expect(Array.isArray(slot.fields)).toBe(true);
            expect(slot.fields.length).toBeGreaterThan(0);
        });
    });

    it('every field has key, label, and placeholder', async () => {
        const { PLATFORM_SLOTS } = await import('../setup-store');
        PLATFORM_SLOTS.forEach((slot) => {
            slot.fields.forEach((field) => {
                expect(typeof field.key).toBe('string');
                expect(field.key.length).toBeGreaterThan(0);
                expect(typeof field.label).toBe('string');
                expect(typeof field.placeholder).toBe('string');
            });
        });
    });
});

describe('setup-store — hasKey, getKeyMasked, setKey, clearKey', () => {
    let lsMock: ReturnType<typeof makeLocalStorageMock>;

    beforeEach(() => {
        lsMock = makeLocalStorageMock();
        vi.stubGlobal('localStorage', lsMock);
        vi.resetModules();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.resetModules();
    });

    it('hasKey returns false when no key is stored', async () => {
        const { hasKey } = await import('../setup-store');
        expect(hasKey('facebook', 'app_id')).toBe(false);
    });

    it('setKey stores a value; hasKey returns true', async () => {
        const { setKey, hasKey } = await import('../setup-store');
        setKey('facebook', 'app_id', 'test_app_id_12345');
        expect(hasKey('facebook', 'app_id')).toBe(true);
    });

    it('getKeyMasked returns non-empty string when key is set', async () => {
        const { setKey, getKeyMasked } = await import('../setup-store');
        setKey('facebook', 'app_id', 'test_app_id_12345');
        const masked = getKeyMasked('facebook', 'app_id');
        expect(typeof masked).toBe('string');
        expect(masked.length).toBeGreaterThan(0);
    });

    it('getKeyMasked never returns the raw value', async () => {
        const { setKey, getKeyMasked } = await import('../setup-store');
        const raw = 'super_secret_key_9876543';
        setKey('facebook', 'app_secret', raw);
        const masked = getKeyMasked('facebook', 'app_secret');
        expect(masked).not.toBe(raw);
        expect(masked).not.toContain(raw);
    });

    it('getKeyMasked returns empty string when key is not set', async () => {
        const { getKeyMasked } = await import('../setup-store');
        expect(getKeyMasked('reddit', 'client_id')).toBe('');
    });

    it('clearKey removes a stored key; hasKey then returns false', async () => {
        const { setKey, hasKey, clearKey } = await import('../setup-store');
        setKey('instagram', 'access_token', 'IGQVJx_some_token');
        expect(hasKey('instagram', 'access_token')).toBe(true);
        clearKey('instagram', 'access_token');
        expect(hasKey('instagram', 'access_token')).toBe(false);
    });

    it('setKey with empty string calls clearKey (removes existing)', async () => {
        const { setKey, hasKey } = await import('../setup-store');
        setKey('twitter', 'api_key', 'some_key');
        expect(hasKey('twitter', 'api_key')).toBe(true);
        setKey('twitter', 'api_key', '');
        expect(hasKey('twitter', 'api_key')).toBe(false);
    });

    it('setKey with whitespace-only string removes key', async () => {
        const { setKey, hasKey } = await import('../setup-store');
        setKey('linkedin', 'client_id', 'valid_id');
        setKey('linkedin', 'client_id', '   ');
        expect(hasKey('linkedin', 'client_id')).toBe(false);
    });
});

describe('setup-store — clearPlatform and clearAll', () => {
    let lsMock: ReturnType<typeof makeLocalStorageMock>;

    beforeEach(() => {
        lsMock = makeLocalStorageMock();
        vi.stubGlobal('localStorage', lsMock);
        vi.resetModules();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.resetModules();
    });

    it('clearPlatform removes all fields for a given platform', async () => {
        const { setKey, hasKey, clearPlatform } = await import('../setup-store');
        setKey('reddit', 'client_id', 'redditClientId');
        setKey('reddit', 'client_secret', 'redditSecret');
        setKey('reddit', 'username', 'u/tester');
        clearPlatform('reddit');
        expect(hasKey('reddit', 'client_id')).toBe(false);
        expect(hasKey('reddit', 'client_secret')).toBe(false);
        expect(hasKey('reddit', 'username')).toBe(false);
    });

    it('clearAll removes keys across all platforms', async () => {
        const { setKey, hasKey, clearAll, PLATFORM_SLOTS } = await import('../setup-store');
        // Set one key per platform
        PLATFORM_SLOTS.forEach((slot) => {
            setKey(slot.id, slot.fields[0].key, 'some_value');
        });
        clearAll();
        PLATFORM_SLOTS.forEach((slot) => {
            expect(hasKey(slot.id, slot.fields[0].key)).toBe(false);
        });
    });
});

describe('setup-store — getPlatformStatuses', () => {
    let lsMock: ReturnType<typeof makeLocalStorageMock>;

    beforeEach(() => {
        lsMock = makeLocalStorageMock();
        vi.stubGlobal('localStorage', lsMock);
        vi.resetModules();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.resetModules();
    });

    it('returns a status entry for every platform', async () => {
        const { getPlatformStatuses, PLATFORM_SLOTS } = await import('../setup-store');
        const statuses = getPlatformStatuses();
        expect(statuses.length).toBe(PLATFORM_SLOTS.length);
    });

    it('isConnected is false for unconfigured platforms', async () => {
        const { getPlatformStatuses } = await import('../setup-store');
        const statuses = getPlatformStatuses();
        statuses.forEach((s) => {
            expect(s.isConnected).toBe(false);
        });
    });

    it('isConnected is true when all required fields are set', async () => {
        const { getPlatformStatuses, setKey, PLATFORM_SLOTS } = await import('../setup-store');
        // Fill all required fields for the first platform
        const slot = PLATFORM_SLOTS[0];
        const required = slot.fields.filter((f) => !f.optional);
        required.forEach((f) => setKey(slot.id, f.key, 'test_value'));
        const statuses = getPlatformStatuses();
        const status = statuses.find((s) => s.id === slot.id)!;
        expect(status.isConnected).toBe(true);
    });

    it('filledCount reflects how many fields have values', async () => {
        const { getPlatformStatuses, setKey, PLATFORM_SLOTS } = await import('../setup-store');
        const slot = PLATFORM_SLOTS.find((s) => s.id === 'instagram')!;
        setKey('instagram', slot.fields[0].key, 'token_value');
        const statuses = getPlatformStatuses();
        const s = statuses.find((s) => s.id === 'instagram')!;
        expect(s.filledCount).toBe(1);
    });
});

// ─── Setup Page Render Tests ──────────────────────────────────────────────────
describe('renderSetupPage — smoke tests', () => {
    let lsMock: ReturnType<typeof makeLocalStorageMock>;

    beforeEach(() => {
        lsMock = makeLocalStorageMock();
        vi.stubGlobal('localStorage', lsMock);
        vi.resetModules();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.resetModules();
    });

    it('returns a non-empty string', async () => {
        const { renderSetupPage } = await import('../pages/setup');
        const html = renderSetupPage();
        expect(typeof html).toBe('string');
        expect(html.length).toBeGreaterThan(100);
    });

    it('does not throw on render', async () => {
        const { renderSetupPage } = await import('../pages/setup');
        expect(() => renderSetupPage()).not.toThrow();
    });

    it('contains an h1 heading', async () => {
        const { renderSetupPage } = await import('../pages/setup');
        const html = renderSetupPage();
        expect(html).toContain('<h1');
    });

    it('contains coach-block section', async () => {
        const { renderSetupPage } = await import('../pages/setup');
        const html = renderSetupPage();
        expect(html).toContain('coach-block');
    });

    it('renders a card for every platform', async () => {
        const { renderSetupPage } = await import('../pages/setup');
        const { PLATFORM_SLOTS } = await import('../setup-store');
        const html = renderSetupPage();
        PLATFORM_SLOTS.forEach((slot) => {
            expect(html).toContain(`setup-card-${slot.id}`);
        });
    });

    it('never exposes a stored raw key in rendered HTML', async () => {
        const { setKey } = await import('../setup-store');
        const raw = 'super_secret_raw_key_xyz';
        setKey('facebook', 'app_id', raw);
        vi.resetModules();
        // Re-import to get fresh render with localStorage state
        lsMock._store.set('growthops_setup_facebook__app_id', btoa(raw));
        const { renderSetupPage } = await import('../pages/setup');
        const html = renderSetupPage();
        expect(html).not.toContain(raw);
    });

    it('renders platform names in the HTML', async () => {
        const { renderSetupPage } = await import('../pages/setup');
        const html = renderSetupPage();
        expect(html).toContain('Facebook');
        expect(html).toContain('Instagram');
        expect(html).toContain('Reddit');
        expect(html).toContain('TikTok');
    });

    it('input fields have value="" — never pre-filled with credentials', async () => {
        const { setKey } = await import('../setup-store');
        setKey('facebook', 'app_id', 'my_real_id');
        vi.resetModules();
        const { renderSetupPage } = await import('../pages/setup');
        const html = renderSetupPage();
        // All password inputs must have value="" (empty, so the raw key is not in HTML)
        const inputMatches = [...html.matchAll(/type="password"[^>]*value="([^"]*)"/g)];
        inputMatches.forEach((match) => {
            expect(match[1]).toBe('');
        });
    });

    it('shows security notice', async () => {
        const { renderSetupPage } = await import('../pages/setup');
        const html = renderSetupPage();
        expect(html.toLowerCase()).toContain('local');
        expect(html).toContain('setup-security-notice');
    });

    it('bindSetupEvents exports a function', async () => {
        const { bindSetupEvents } = await import('../pages/setup');
        expect(typeof bindSetupEvents).toBe('function');
    });
});
