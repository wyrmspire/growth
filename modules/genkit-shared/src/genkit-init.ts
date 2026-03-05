/**
 * genkit-init.ts
 * Shared Genkit instance for GrowthOps OS AI flows.
 *
 * Mock-safe mode:  When GEMINI_API_KEY is absent the module falls back to a
 * deterministic mock model so flows can run in CI / local learning mode with
 * no live API key.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const hasApiKey = Boolean(process.env.GEMINI_API_KEY);

export const ai = hasApiKey
    ? genkit({ plugins: [googleAI()] })
    : genkit({ plugins: [] }); // mock model injected per-flow when no key

export const LIVE_MODEL = process.env.GEMINI_MODEL
    ? `googleai/${process.env.GEMINI_MODEL}`
    : 'googleai/gemini-2.5-flash';

/**
 * Returns the model identifier to use.
 * Falls back to the built-in echo model when running without a key.
 */
export function resolveModel(): string {
    if (hasApiKey) return LIVE_MODEL;
    // Genkit ships a built-in echo/test model – use it as the mock model.
    return 'echo';
}
