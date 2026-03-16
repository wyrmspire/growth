/**
 * credentials.ts — ADAPT-2
 * Secure in-memory platform credential store for the adapters layer.
 *
 * SECURITY BOUNDARY RULES (from SYSTEM_ARCHITECTURE.md §Secrets Boundary):
 * - This module may ONLY be imported by files inside modules/adapters/src/.
 * - Credential VALUES never cross into UI, domain modules, or mock-engine.
 * - The only credential-related type allowed across the boundary is
 *   PlatformAvailability (boolean status, no token data).
 * - In production these values would be read from env vars / secrets manager
 *   at server startup; NEVER from the browser.
 *
 * Mock-safe mode: when the relevant env vars are absent, adapters fall back
 * to deterministic local behaviour (no real API calls, no error thrown).
 */

import type { PlatformName, PlatformCredential, CredentialStore, PlatformAvailability } from '@core/types';

// ── Internal Map ──────────────────────────────────────────────────
const _store = new Map<PlatformName, PlatformCredential>();

/**
 * getCredentialStore() — returns the module-level CredentialStore.
 * Only expose to other files within modules/adapters/src/.
 * NEVER re-export from a public barrel that UI can reach.
 */
export function getCredentialStore(): CredentialStore {
    return {
        get: (p) => _store.get(p),
        set: (p, cred) => { _store.set(p, cred); },
        has: (p) => _store.has(p),
        clear: (p) => { _store.delete(p); },
        clearAll: () => { _store.clear(); },
    };
}

// ── Expiry check ──────────────────────────────────────────────────

/**
 * isCredentialValid() — true when the credential exists and has not expired.
 * Absence of expiresAt means the credential never expires.
 */
function isCredentialValid(cred: PlatformCredential | undefined): boolean {
    if (!cred) return false;
    if (!cred.expiresAt) return true;
    return new Date(cred.expiresAt) > new Date();
}

// ── Availability ──────────────────────────────────────────────────

/**
 * getPlatformAvailability(platform) — returns a safe cross-layer status object.
 * This is intentionally thin: no token values, just a boolean + reason string.
 * Call this from registry.ts or server.ts; SAFE to include in health responses.
 */
export function getPlatformAvailability(platform: PlatformName): PlatformAvailability {
    const cred = _store.get(platform);
    if (!cred) {
        return { platform, available: false, reason: 'missing' };
    }
    if (cred.expiresAt && new Date(cred.expiresAt) <= new Date()) {
        return { platform, available: false, reason: 'expired' };
    }
    return { platform, available: true };
}

/**
 * getAllPlatformAvailability() — returns status for all 4 known platforms.
 * Safe to serialise into health endpoint response (no token values).
 */
export function getAllPlatformAvailability(): PlatformAvailability[] {
    const platforms: PlatformName[] = [
        'meta', 'linkedin', 'x', 'email', 
        'instagram', 'reddit', 'tiktok', 'facebook', 
        'youtube', 'substack', 'pinterest', 'threads'
    ];
    return platforms.map(getPlatformAvailability);
}

// ── Seeding from environment ──────────────────────────────────────

/**
 * seedCredentialsFromEnv() — reads platform tokens from well-known env vars
 * and populates the store. Called once at server startup in server.ts.
 * In mock-safe mode (vars absent) the store remains empty — adapters degrade
 * gracefully to their mock-safe branch.
 *
 * Env var convention:
 *   META_ACCESS_TOKEN          → meta / api_key
 *   LINKEDIN_ACCESS_TOKEN      → linkedin / oauth_token
 *   X_API_KEY + X_API_SECRET   → x / api_key
 *   SMTP_HOST + SMTP_PASS      → email / smtp  (value=host, secret=pass)
 */
export function seedCredentialsFromEnv(): void {
    const store = getCredentialStore();

    const metaToken = process.env.META_ACCESS_TOKEN;
    if (metaToken) {
        store.set('meta', { platform: 'meta', kind: 'api_key', value: metaToken });
        console.info('[credentials] Meta access token loaded from META_ACCESS_TOKEN.');
    }

    const linkedinToken = process.env.LINKEDIN_ACCESS_TOKEN;
    if (linkedinToken) {
        store.set('linkedin', { platform: 'linkedin', kind: 'oauth_token', value: linkedinToken });
        console.info('[credentials] LinkedIn access token loaded from LINKEDIN_ACCESS_TOKEN.');
    }

    const xKey = process.env.X_API_KEY;
    const xSecret = process.env.X_API_SECRET;
    if (xKey) {
        store.set('x', { platform: 'x', kind: 'api_key', value: xKey, secret: xSecret });
        console.info('[credentials] X API key loaded from X_API_KEY.');
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPass = process.env.SMTP_PASS;
    if (smtpHost) {
        store.set('email', { platform: 'email', kind: 'smtp', value: smtpHost, secret: smtpPass });
        console.info('[credentials] SMTP credentials loaded from SMTP_HOST.');
    }

    const redditId = process.env.REDDIT_CLIENT_ID;
    const redditSecret = process.env.REDDIT_CLIENT_SECRET;
    if (redditId) {
        store.set('reddit', { platform: 'reddit', kind: 'api_key', value: redditId, secret: redditSecret });
        console.info('[credentials] Reddit credentials loaded from REDDIT_CLIENT_ID.');
    }

    const tiktokKey = process.env.TIKTOK_CLIENT_KEY;
    const tiktokSecret = process.env.TIKTOK_CLIENT_SECRET;
    if (tiktokKey) {
        store.set('tiktok', { platform: 'tiktok', kind: 'api_key', value: tiktokKey, secret: tiktokSecret });
        console.info('[credentials] TikTok credentials loaded from TIKTOK_CLIENT_KEY.');
    }

    const instagramToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (instagramToken) {
        store.set('instagram', { platform: 'instagram', kind: 'api_key', value: instagramToken });
        console.info('[credentials] Instagram credentials loaded from INSTAGRAM_ACCESS_TOKEN.');
    }

    const youtubeKey = process.env.YOUTUBE_API_KEY;
    if (youtubeKey) {
        store.set('youtube', { platform: 'youtube', kind: 'api_key', value: youtubeKey });
        console.info('[credentials] YouTube credentials loaded from YOUTUBE_API_KEY.');
    }

    const substackToken = process.env.SUBSTACK_API_TOKEN;
    if (substackToken) {
        store.set('substack', { platform: 'substack', kind: 'api_key', value: substackToken });
        console.info('[credentials] Substack credentials loaded from SUBSTACK_API_TOKEN.');
    }
}

// ── Test helpers ──────────────────────────────────────────────────
// Only exported for use in test files — never wire into production paths.

/** Set a credential directly (use in tests only). */
export function _testSetCredential(cred: PlatformCredential): void {
    _store.set(cred.platform, cred);
}

/** Clear all credentials (use in tests only). */
export function _testClearAll(): void {
    _store.clear();
}

// Internal helper used by platform adapters.
export { isCredentialValid };
