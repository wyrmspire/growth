import dotenv from 'dotenv';
import express from 'express';

import { offerStrategistFlow } from './modules/strategy/src/flows/offerStrategistFlow';
import { copyCoachFlow } from './modules/copylab/src/flows/copyCoachFlow';
import { replyCoachFlow } from './modules/comments/src/flows/replyCoachFlow';

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

app.listen(port, () => {
    console.log(`[api] GrowthOps flow server listening on http://localhost:${port} (${getMode()})`);
});
