/**
 * Lane 0 — Genkit Flow API Server
 *
 * Exposes the three Genkit flows as HTTP endpoints so the Vite UI
 * can call them through the dev proxy.
 *
 * Runs in mock-safe mode when GEMINI_API_KEY is not set.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import express from 'express';
import { offerStrategistFlow } from './modules/strategy/src/flows/offerStrategistFlow.js';
import { copyCoachFlow } from './modules/copylab/src/flows/copyCoachFlow.js';
import { replyCoachFlow } from './modules/comments/src/flows/replyCoachFlow.js';

const PORT = parseInt(process.env.PORT || '3400', 10);
const app = express();
app.use(express.json());

app.post('/api/flows/offerStrategist', async (req, res) => {
    try {
        const result = await offerStrategistFlow(req.body);
        res.json(result);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: message });
    }
});

app.post('/api/flows/copyCoach', async (req, res) => {
    try {
        const result = await copyCoachFlow(req.body);
        res.json(result);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: message });
    }
});

app.post('/api/flows/replyCoach', async (req, res) => {
    try {
        const result = await replyCoachFlow(req.body);
        res.json(result);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: message });
    }
});

app.listen(PORT, () => {
    const mode = process.env.GEMINI_API_KEY ? 'LIVE (Gemini)' : 'MOCK (no API key)';
    console.log(`🚀 Genkit flow server on http://localhost:${PORT} [${mode}]`);
});
