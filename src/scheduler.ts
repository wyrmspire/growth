/**
 * Scheduler — JOB-2
 * Lightweight cron scheduler that reads job intervals from config
 * and triggers registered job functions via HTTP POST to the server.
 *
 * Usage: npm run scheduler
 *
 * This is opt-in: it does NOT start with `npm run dev`.
 * Jobs fire on configurable intervals and call the server's /api/jobs/* endpoints.
 */

interface ScheduledJob {
    name: string;
    endpoint: string;
    intervalMinutes: number;
    enabled: boolean;
}

const JOBS: ScheduledJob[] = [
    {
        name: 'scout-scan',
        endpoint: '/api/jobs/scout-scan',
        intervalMinutes: 30,
        enabled: true,
    },
    {
        name: 'publish-batch',
        endpoint: '/api/jobs/publish-batch',
        intervalMinutes: 15,
        enabled: true,
    },
];

const SERVER_BASE = process.env.SERVER_URL || 'http://localhost:3400';

async function runScheduledJob(job: ScheduledJob): Promise<void> {
    const url = `${SERVER_BASE}${job.endpoint}`;
    console.log(`[scheduler] Running ${job.name} → POST ${url}`);
    try {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        const data = await res.json();
        console.log(`[scheduler] ${job.name} ${data.ok ? '✓' : '✗'} (${data.completedAt})`);
    } catch (err) {
        console.error(`[scheduler] ${job.name} FAILED:`, err instanceof Error ? err.message : err);
    }
}

function startScheduler(): void {
    console.log('[scheduler] Starting GrowthOps scheduler');
    console.log(`[scheduler] Server: ${SERVER_BASE}`);
    console.log(`[scheduler] Jobs:`);
    for (const job of JOBS) {
        if (!job.enabled) {
            console.log(`  - ${job.name}: DISABLED`);
            continue;
        }
        console.log(`  - ${job.name}: every ${job.intervalMinutes}m`);
        // Run immediately on start
        runScheduledJob(job);
        // Then repeat on interval
        setInterval(() => runScheduledJob(job), job.intervalMinutes * 60 * 1000);
    }
}

startScheduler();
