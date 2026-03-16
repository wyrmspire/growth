import dotenv from 'dotenv';
import express from 'express';

import { offerStrategistFlow } from './modules/strategy/src/flows/offerStrategistFlow';
import { copyCoachFlow } from './modules/copylab/src/flows/copyCoachFlow';
import { replyCoachFlow } from './modules/comments/src/flows/replyCoachFlow';
import { getPreviewFeed, makePreviewAdapter, type PreviewFeedItem } from './modules/adapters/src/preview-adapter';
import { registerAdapter } from './modules/adapters/src/registry';
import { seedCredentialsFromEnv, getAllPlatformAvailability, getPlatformAvailability, getCredentialStore } from './modules/adapters/src/credentials';

dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3400);

app.use(express.json({ limit: '1mb' }));

function getMode(): 'live' | 'mock-safe' {
    return process.env.GEMINI_API_KEY ? 'live' : 'mock-safe';
}

// ─── Rate Limit State (W3) ──────────────────────────────────────
// In-memory per-platform daily request counters. Resets on server restart.
// Limits are configurable via env vars: RATE_LIMIT_META=50, etc.
const PLATFORM_NAMES = ['meta', 'linkedin', 'x', 'email'] as const;
type KnownPlatform = typeof PLATFORM_NAMES[number];

interface RateLimitState {
    count: number;
    limit: number;
    resetAt: string; // ISO 8601 — midnight UTC of next day
}

const rateLimits = new Map<string, RateLimitState>();

function getDefaultLimit(platform: string): number {
    const envKey = `RATE_LIMIT_${platform.toUpperCase()}`;
    const envVal = process.env[envKey];
    return envVal ? parseInt(envVal, 10) || 50 : 50;
}

function getMidnightUTC(): string {
    const d = new Date();
    d.setUTCHours(24, 0, 0, 0);
    return d.toISOString();
}

function getRateLimitState(platform: string): RateLimitState {
    let state = rateLimits.get(platform);
    if (!state || new Date(state.resetAt) <= new Date()) {
        state = { count: 0, limit: getDefaultLimit(platform), resetAt: getMidnightUTC() };
        rateLimits.set(platform, state);
    }
    return state;
}

function incrementRateLimit(platform: string): RateLimitState {
    const state = getRateLimitState(platform);
    state.count++;
    return state;
}

function checkRateLimit(platform: string): { allowed: boolean; state: RateLimitState } {
    const state = getRateLimitState(platform);
    return { allowed: state.count < state.limit, state };
}

function getAllRateLimitStatus(): Record<string, { count: number; limit: number; remaining: number; resetAt: string }> {
    const result: Record<string, { count: number; limit: number; remaining: number; resetAt: string }> = {};
    for (const p of PLATFORM_NAMES) {
        const state = getRateLimitState(p);
        result[p] = { count: state.count, limit: state.limit, remaining: Math.max(0, state.limit - state.count), resetAt: state.resetAt };
    }
    return result;
}

// ─── Health (expanded with rate limits) ─────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({
        ok: true,
        mode: getMode(),
        platforms: getAllPlatformAvailability(),
        rateLimits: getAllRateLimitStatus(),
    });
});

// ─── W1: Connection Test Endpoints ──────────────────────────────
// POST /api/test-connection/:platform
// In mock-safe mode: returns { ok: true, profile: { name: 'Mock User', platform } }
// When credentials are missing: returns { ok: false, reason: 'missing' }
app.post('/api/test-connection/:platform', (_req, res) => {
    const platform = _req.params.platform as string;
    const validPlatforms = new Set(PLATFORM_NAMES);

    if (!validPlatforms.has(platform as KnownPlatform)) {
        res.status(400).json({ ok: false, reason: 'unknown_platform', message: `Unknown platform: ${platform}` });
        return;
    }

    const availability = getPlatformAvailability(platform as KnownPlatform);
    if (!availability.available) {
        res.json({ ok: false, reason: availability.reason || 'missing', platform });
        return;
    }

    // In live mode: TODO — make a lightweight API call to validate the credential
    // For now, return mock profile in all modes when credential exists
    res.json({
        ok: true,
        platform,
        mode: getMode(),
        profile: {
            name: 'Mock User',
            platform,
            verified: true,
            connectedAt: new Date().toISOString(),
        },
    });
});

// ─── W2: Credential Management Endpoints ────────────────────────
// POST /api/credentials/:platform — set credential
// Body: { kind: 'api_key' | 'oauth_token' | 'smtp', value: string, secret?: string }
app.post('/api/credentials/:platform', (_req, res) => {
    const platform = _req.params.platform as string;
    const validPlatforms = new Set(PLATFORM_NAMES);

    if (!validPlatforms.has(platform as KnownPlatform)) {
        res.status(400).json({ ok: false, error: `Unknown platform: ${platform}` });
        return;
    }

    const { kind, value, secret } = _req.body as { kind?: string; value?: string; secret?: string };
    if (!kind || !value) {
        res.status(400).json({ ok: false, error: 'Missing required fields: kind, value' });
        return;
    }

    const validKinds = new Set(['api_key', 'oauth_token', 'smtp']);
    if (!validKinds.has(kind)) {
        res.status(400).json({ ok: false, error: `Invalid kind: ${kind}. Must be one of: api_key, oauth_token, smtp` });
        return;
    }

    const store = getCredentialStore();
    store.set(platform as KnownPlatform, {
        platform: platform as KnownPlatform,
        kind: kind as 'api_key' | 'oauth_token' | 'smtp',
        value,
        secret,
    });

    console.info(`[credentials] ${platform} credential set via API (kind: ${kind}).`);
    res.json({ ok: true, platform, message: `Credential set for ${platform}` });
});

// GET /api/credentials/status — returns availability for all platforms (NO token values)
app.get('/api/credentials/status', (_req, res) => {
    res.json({
        ok: true,
        platforms: getAllPlatformAvailability(),
    });
});

// DELETE /api/credentials/:platform — clear credential
app.delete('/api/credentials/:platform', (_req, res) => {
    const platform = _req.params.platform as string;
    const validPlatforms = new Set(PLATFORM_NAMES);

    if (!validPlatforms.has(platform as KnownPlatform)) {
        res.status(400).json({ ok: false, error: `Unknown platform: ${platform}` });
        return;
    }

    const store = getCredentialStore();
    store.clear(platform as KnownPlatform);

    console.info(`[credentials] ${platform} credential cleared via API.`);
    res.json({ ok: true, platform, message: `Credential cleared for ${platform}` });
});

// ─── W3: Rate Limit Middleware ──────────────────────────────────
// Applied to publish-related endpoints. Returns 429 when limit exceeded.
function rateLimitMiddleware(req: express.Request, res: express.Response, next: express.NextFunction): void {
    // Extract platform from request body or params
    const platform = (req.body?.channel || req.params?.platform || '') as string;
    if (!platform) {
        next();
        return;
    }

    const { allowed, state } = checkRateLimit(platform);
    if (!allowed) {
        res.status(429).json({
            error: 'Rate limit exceeded',
            platform,
            limit: state.limit,
            remaining: 0,
            resetAt: state.resetAt,
        });
        return;
    }

    incrementRateLimit(platform);
    next();
}

// ─── Credentials (ADAPT-7) ──────────────────────────────────────
// Seed platform credentials from env vars (reads META_ACCESS_TOKEN,
// LINKEDIN_ACCESS_TOKEN, X_API_KEY, X_API_SECRET, SMTP_HOST, SMTP_PASS).
// In mock-safe mode (vars absent) the store stays empty and adapters
// fall back to deterministic local responses — no errors thrown.
seedCredentialsFromEnv();

// ─── Preview Feed (PREV-3) ──────────────────────────────────────
// Register preview adapters so that the publish pipeline can
// capture content to the in-memory preview feed.
for (const ch of ['meta', 'linkedin', 'x', 'email'] as const) {
    registerAdapter(makePreviewAdapter(ch));
}

app.get('/api/preview-feed', (_req, res) => {
    res.json({ ok: true, items: getPreviewFeed() });
});

async function runFlow<TInput, TOutput>(
    label: string,
    runner: (input: TInput) => Promise<TOutput>,
    input: TInput,
) {
    const output = await runner(input);
    return {
        ok: true,
        flow: label,
        mode: getMode(),
        output,
    };
}

app.post('/api/flows/offer-strategist', async (req, res) => {
    try {
        const payload = await runFlow('offerStrategistFlow', offerStrategistFlow, req.body);
        res.json(payload);
    } catch (error) {
        res.status(500).json({
            ok: false,
            flow: 'offerStrategistFlow',
            error: error instanceof Error ? error.message : 'Unknown offer strategist error',
        });
    }
});

app.post('/api/flows/copy-coach', async (req, res) => {
    try {
        const payload = await runFlow('copyCoachFlow', copyCoachFlow, req.body);
        res.json(payload);
    } catch (error) {
        res.status(500).json({
            ok: false,
            flow: 'copyCoachFlow',
            error: error instanceof Error ? error.message : 'Unknown copy coach error',
        });
    }
});

app.post('/api/flows/reply-coach', async (req, res) => {
    try {
        const payload = await runFlow('replyCoachFlow', replyCoachFlow, req.body);
        res.json(payload);
    } catch (error) {
        res.status(500).json({
            ok: false,
            flow: 'replyCoachFlow',
            error: error instanceof Error ? error.message : 'Unknown reply coach error',
        });
    }
});

// ─── Job API ─────────────────────────────────────────────────────

interface JobResult {
    ok: boolean;
    job: string;
    startedAt: string;
    completedAt: string;
    result: unknown;
    error?: string;
}

interface JobRecord {
    job: string;
    lastRun: string | null;
    lastStatus: 'success' | 'failed' | 'never';
    lastResult: unknown;
}

const jobHistory: Record<string, JobRecord> = {
    'scout-scan': { job: 'scout-scan', lastRun: null, lastStatus: 'never', lastResult: null },
    'publish-batch': { job: 'publish-batch', lastRun: null, lastStatus: 'never', lastResult: null },
};

async function runJob(jobName: string, fn: () => Promise<unknown>): Promise<JobResult> {
    const startedAt = new Date().toISOString();
    try {
        const result = await fn();
        const completedAt = new Date().toISOString();
        jobHistory[jobName] = { job: jobName, lastRun: completedAt, lastStatus: 'success', lastResult: result };
        return { ok: true, job: jobName, startedAt, completedAt, result };
    } catch (err) {
        const completedAt = new Date().toISOString();
        const error = err instanceof Error ? err.message : 'Unknown job error';
        jobHistory[jobName] = { job: jobName, lastRun: completedAt, lastStatus: 'failed', lastResult: error };
        return { ok: false, job: jobName, startedAt, completedAt, result: null, error };
    }
}

// Scout scan job — uses Playwright collector in live mode, mock data otherwise
async function scoutScanJob(): Promise<unknown> {
    // In mock-safe mode, return mock opportunities
    const mockOpportunities = [
        {
            platform: 'reddit',
            author: 'u/smallbiz_owner',
            contentSnippet: 'Does anyone have a recommendation for marketing automation?',
            sourceUrl: 'https://reddit.com/r/smallbusiness/mock',
            discoveredAt: new Date().toISOString(),
        },
        {
            platform: 'x',
            author: '@startup_founder',
            contentSnippet: 'Spending way too much time on proposals. There has to be a better way.',
            sourceUrl: 'https://x.com/mock/status/1',
            discoveredAt: new Date().toISOString(),
        },
        {
            platform: 'linkedin',
            author: 'Jane Doe',
            contentSnippet: 'Looking for recommendations on lead qualification tools for B2B services.',
            sourceUrl: 'https://linkedin.com/posts/mock',
            discoveredAt: new Date().toISOString(),
        },
    ];
    console.log(`[job:scout-scan] Found ${mockOpportunities.length} opportunities (mock-safe mode)`);
    return { itemsFound: mockOpportunities.length, opportunities: mockOpportunities, mode: 'mock-safe' };
}

// Publish batch job — dispatches due publish jobs
async function publishBatchJob(): Promise<unknown> {
    console.log(`[job:publish-batch] Checking for due publish jobs (mock-safe mode)`);
    return { dispatched: 0, mode: 'mock-safe', message: 'No due publish jobs in mock mode' };
}

app.post('/api/jobs/scout-scan', async (_req, res) => {
    const result = await runJob('scout-scan', scoutScanJob);
    res.status(result.ok ? 200 : 500).json(result);
});

app.post('/api/jobs/publish-batch', rateLimitMiddleware, async (_req, res) => {
    const result = await runJob('publish-batch', publishBatchJob);
    res.status(result.ok ? 200 : 500).json(result);
});

app.get('/api/jobs/status', (_req, res) => {
    res.json({
        ok: true,
        jobs: Object.values(jobHistory),
    });
});

app.listen(port, () => {
    console.log(`[api] GrowthOps flow server listening on http://localhost:${port} (${getMode()})`);
});
