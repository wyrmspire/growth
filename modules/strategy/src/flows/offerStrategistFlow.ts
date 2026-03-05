/**
 * BACK-6 — offerStrategistFlow
 * Genkit flow that coaches the operator through business discovery.
 *
 * This is an ASSISTIVE coach — it asks questions to elicit business details
 * and suggests offer angles. It does NOT make autonomous decisions.
 * All output requires human review before any campaign action is taken.
 *
 * Mock-safe: runs without a real API key using Genkit's mock model support.
 *
 * BACK-8: Evaluation checklist and human-review gate are included.
 */

import { genkit, z } from 'genkit';
import { LIVE_MODEL } from '../../../genkit-shared/src/genkit-init';

const ai = genkit({});

// ── Input / Output schemas ───────────────────────────────────────────────────

const OfferStrategistInput = z.object({
    businessName: z.string().min(1).describe('Name of the business'),
    industry: z.string().min(1).describe('Industry or niche'),
    targetCustomer: z.string().min(1).describe('Who the primary customer is'),
    painPoints: z.array(z.string()).min(1).describe('Key customer pain points'),
    competitiveAdvantage: z.string().describe('What makes this business different'),
    currentChannels: z.array(z.string()).optional().describe('Channels currently in use'),
});

const OfferHypothesisSuggestion = z.object({
    name: z.string().describe('Short, memorable offer name'),
    angle: z.string().describe('Strategic angle or hook'),
    icp: z.string().describe('Ideal customer profile for this offer'),
    rationale: z.string().describe('Why this offer makes sense for this business'),
    coachingNote: z.string().describe('Beginner-friendly explanation of the strategy'),
    confidence: z.number().min(0).max(1).describe('Confidence score 0–1'),
});

const OfferStrategistOutput = z.object({
    coachMessage: z
        .string()
        .describe('Conversational coaching message to the operator'),
    hypotheses: z
        .array(OfferHypothesisSuggestion)
        .describe('Candidate offer hypotheses — for human review only'),
    nextQuestion: z
        .string()
        .optional()
        .describe('Follow-up question to deepen the discovery'),
    humanReviewRequired: z
        .boolean()
        .describe('Always true — AI output cannot be acted upon without human approval'),
    evaluationChecklist: z.object({
        quality: z.boolean().describe('Hypotheses are specific and actionable'),
        safety: z.boolean().describe('No harmful, misleading, or manipulative claims'),
        tone: z.boolean().describe('Coaching tone is beginner-friendly and non-salesy'),
        factuality: z.boolean().describe('Claims are based on provided business data, not fabricated'),
    }),
});

// ── Flow definition ──────────────────────────────────────────────────────────

export const offerStrategistFlow = ai.defineFlow(
    {
        name: 'offerStrategistFlow',
        inputSchema: OfferStrategistInput,
        outputSchema: OfferStrategistOutput,
    },
    async (input) => {
        // MOCK-SAFE: When GEMINI_API_KEY is set, this will call the real model.
        // Without it, the flow scaffolding is exercisable in tests via direct call.
        const isMockMode = !process.env.GEMINI_API_KEY;

        if (isMockMode) {
            // Deterministic mock response for local/test use
            return buildMockOfferStrategistResponse(input);
        }

        const prompt = buildOfferStrategistPrompt(input);

        const response = await ai.generate({
            model: LIVE_MODEL,
            prompt,
            output: { schema: OfferStrategistOutput },
        });

        const output = response.output;
        if (!output) {
            throw new Error('offerStrategistFlow: model returned no structured output');
        }

        // BACK-8: Enforce human-review flag — this is non-negotiable
        return { ...output, humanReviewRequired: true };
    },
);

// ── Prompt builder ───────────────────────────────────────────────────────────

function buildOfferStrategistPrompt(
    input: z.infer<typeof OfferStrategistInput>,
): string {
    return `
You are a beginner-friendly marketing coach helping a business owner understand their offer strategy.
Your tone is warm, clear, and educational — never salesy or jargon-heavy.

The person you are coaching is NOT a marketing expert. Explain concepts in plain English.

Business context:
- Business name: ${input.businessName}
- Industry: ${input.industry}
- Target customer: ${input.targetCustomer}
- Key pain points: ${input.painPoints.join(', ')}
- Competitive advantage: ${input.competitiveAdvantage}
- Current channels: ${(input.currentChannels ?? []).join(', ') || 'not specified'}

Your task:
1. Write a warm coaching message acknowledging what you've learned about this business.
2. Suggest 2–3 offer hypotheses with clear rationale and a beginner-friendly coaching note for each.
3. Ask one follow-up question to deepen your understanding.

IMPORTANT CONSTRAINTS:
- These are SUGGESTIONS for human review only. Do not frame them as final decisions.
- Do not make claims that are not grounded in the provided business context.
- Keep coachingNote under 2 sentences — plain English, no jargon.
- Set humanReviewRequired to true always.
- Fill in the evaluationChecklist based on your own output.

Return structured output matching the schema exactly.
  `.trim();
}

// ── Mock response (mock-safe mode) ──────────────────────────────────────────

function buildMockOfferStrategistResponse(
    input: z.infer<typeof OfferStrategistInput>,
): z.infer<typeof OfferStrategistOutput> {
    return {
        coachMessage: `Great — I can see ${input.businessName} is solving real problems for ${input.targetCustomer} in the ${input.industry} space. Let's map out some offer angles together.`,
        hypotheses: [
            {
                name: `${input.businessName} Starter Pack`,
                angle: 'Low-risk entry point targeting the biggest pain point',
                icp: input.targetCustomer,
                rationale: `Addresses "${input.painPoints[0]}" with a clear, bounded deliverable.`,
                coachingNote: 'A starter offer helps new customers trust you before committing to bigger investments.',
                confidence: 0.82,
            },
            {
                name: `${input.businessName} Quick Win`,
                angle: 'Fast result to demonstrate value rapidly',
                icp: input.targetCustomer,
                rationale: `Uses "${input.competitiveAdvantage}" to deliver a fast, visible win.`,
                coachingNote: 'Fast results build trust — this kind of offer is great for getting your first few clients.',
                confidence: 0.71,
            },
        ],
        nextQuestion: `What does a successful outcome look like for a typical ${input.targetCustomer} after working with you?`,
        humanReviewRequired: true,
        evaluationChecklist: {
            quality: true,
            safety: true,
            tone: true,
            factuality: true,
        },
    };
}
