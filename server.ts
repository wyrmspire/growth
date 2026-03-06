import dotenv from 'dotenv';
import express from 'express';

import { offerStrategistFlow } from './modules/strategy/src/flows/offerStrategistFlow';
import { copyCoachFlow } from './modules/copylab/src/flows/copyCoachFlow';
import { replyCoachFlow } from './modules/comments/src/flows/replyCoachFlow';
import { getPreviewFeed, makePreviewAdapter, type PreviewFeedItem } from './modules/adapters/src/preview-adapter';
import { registerAdapter } from './modules/adapters/src/registry';

dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3400);

app.use(express.json({ limit: '1mb' }));

function getMode(): 'live' | 'mock-safe' {
    return process.env.GEMINI_API_KEY ? 'live' : 'mock-safe';
}

app.get('/api/health', (_req, res) => {
    res.json({
        ok: true,
        mode: getMode(),
    });
});

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

app.post('/api/jobs/publish-batch', async (_req, res) => {
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
