/**
 * BACK-6 — copyCoachFlow
 * Genkit flow that generates copy variants with coaching explanations.
 *
 * Takes a campaign brief + funnel plan and produces copy variants for each
 * stage × channel combination, with plain-English explanations of WHY each
 * variant works — designed to teach the operator as it helps.
 *
 * Mock-safe: runs without a real API key.
 * BACK-8: Evaluation checklist and human-review gate enforced.
 */

import { genkit, z } from 'genkit';
import { LIVE_MODEL } from '../../../genkit-shared/src/genkit-init';

const ai = genkit({});

// ── Schemas ─────────────────────────────────────────────────────────────────

const CopyCoachInput = z.object({
    briefId: z.string().describe('Campaign brief ID for traceability'),
    offerName: z.string().min(1).describe('Name of the offer being promoted'),
    audience: z.string().min(1).describe('Target audience description'),
    channels: z
        .array(z.enum(['meta', 'linkedin', 'x', 'email']))
        .min(1)
        .describe('Channels to generate copy for'),
    funnelStage: z
        .enum(['awareness', 'consideration', 'decision'])
        .describe('Funnel stage to optimize for'),
    cta: z.string().describe('Primary call-to-action for this stage'),
    tone: z.string().optional().describe('Tone preference (e.g., conversational, professional)'),
});

const CopyVariantOutput = z.object({
    channel: z.enum(['meta', 'linkedin', 'x', 'email']),
    stage: z.enum(['awareness', 'consideration', 'decision']),
    headline: z.string().describe('Attention-grabbing headline'),
    body: z.string().describe('Main copy body'),
    cta: z.string().describe('Call-to-action text'),
    whyItWorks: z.string().describe('Plain-English explanation of the copywriting strategy used'),
    characterCount: z.number().describe('Total character count of headline + body + CTA'),
});

const CopyCoachOutput = z.object({
    coachMessage: z.string().describe('Introductory coaching context for the operator'),
    variants: z.array(CopyVariantOutput).describe('Copy variants — for human review before use'),
    copyLesson: z.string().describe('One beginner copywriting lesson illustrated by these variants'),
    humanReviewRequired: z.literal(true),
    evaluationChecklist: z.object({
        quality: z.boolean(),
        safety: z.boolean(),
        tone: z.boolean(),
        factuality: z.boolean(),
    }),
});

// ── Flow ─────────────────────────────────────────────────────────────────────

export const copyCoachFlow = ai.defineFlow(
    {
        name: 'copyCoachFlow',
        inputSchema: CopyCoachInput,
        outputSchema: CopyCoachOutput,
    },
    async (input) => {
        const isMockMode = !process.env.GEMINI_API_KEY;

        if (isMockMode) {
            return buildMockCopyCoachResponse(input);
        }

        const response = await ai.generate({
            model: LIVE_MODEL,
            prompt: buildCopyCoachPrompt(input),
            output: { schema: CopyCoachOutput },
        });

        const output = response.output;
        if (!output) {
            throw new Error('copyCoachFlow: model returned no structured output');
        }

        return { ...output, humanReviewRequired: true as const };
    },
);

// ── Prompt ───────────────────────────────────────────────────────────────────

function buildCopyCoachPrompt(input: z.infer<typeof CopyCoachInput>): string {
    return `
You are a copywriting coach helping a beginner marketer create effective campaign copy.
Your job is to write great copy AND explain why it works in plain English.

Context:
- Offer: ${input.offerName}
- Audience: ${input.audience}
- Funnel stage: ${input.funnelStage}
- Channels: ${input.channels.join(', ')}
- Primary CTA: ${input.cta}
- Tone: ${input.tone ?? 'friendly and clear'}

For each channel, create one copy variant with:
- A compelling headline (under 10 words)
- Body copy appropriate for that channel's format and character limits
- CTA text
- "whyItWorks" — a 1–2 sentence plain-English explanation of the copywriting principle used

Then:
- Write one short beginner copywriting "lesson" illustrated by the variants above.
- Set humanReviewRequired = true always.
- Evaluate your output in evaluationChecklist.

Meta limit: 125 chars body. LinkedIn: 700 chars. X: 280 chars. Email: 500 chars.
`.trim();
}

// ── Mock response ─────────────────────────────────────────────────────────────

const VARIANT_TEMPLATES: Record<
    'meta' | 'linkedin' | 'x' | 'email',
    { headline: string; body: string; whyItWorks: string }
> = {
    meta: {
        headline: 'Stop guessing. Start growing.',
        body: 'Most businesses lose leads because they talk about features, not outcomes. We help you fix that.',
        whyItWorks:
            'Opening with a pain-point pattern interrupt grabs attention in a crowded feed — then we transition to the outcome.',
    },
    linkedin: {
        headline: 'What if your marketing actually taught you something?',
        body: 'We built a system that guides you through every campaign decision — so you get results AND learn why they work.',
        whyItWorks:
            'LinkedIn readers expect thoughtful, value-first content. The question format invites reflection before the offer.',
    },
    x: {
        headline: 'Marketing without guesswork:',
        body: 'Step-by-step. Beginner-friendly. Built around your actual business. Here\'s how it works:',
        whyItWorks:
            'Short punchy statements work on X — the colon at the end creates curiosity that drives link clicks.',
    },
    email: {
        headline: 'You deserve to understand your marketing (not just do it)',
        body: 'Hey, we put together something for business owners who are tired of running campaigns that feel like a black box.',
        whyItWorks:
            'Email subjects with "you" perform better because they feel personal. The body sets context before the CTA.',
    },
};

function buildMockCopyCoachResponse(
    input: z.infer<typeof CopyCoachInput>,
): z.infer<typeof CopyCoachOutput> {
    const variants = input.channels.map((channel) => {
        const tmpl = VARIANT_TEMPLATES[channel];
        const body = `[${input.offerName}] ${tmpl.body}`;
        return {
            channel,
            stage: input.funnelStage,
            headline: tmpl.headline,
            body,
            cta: input.cta,
            whyItWorks: tmpl.whyItWorks,
            characterCount: tmpl.headline.length + body.length + input.cta.length,
        };
    });

    return {
        coachMessage: `Here are ${variants.length} copy variant(s) for "${input.offerName}" at the ${input.funnelStage} stage. Each one is designed for the specific format and audience expectations of that channel.`,
        variants,
        copyLesson: `The #1 beginner mistake is writing copy about features instead of outcomes. Notice how each variant above leads with what the audience *gets*, not what your product *does*.`,
        humanReviewRequired: true,
        evaluationChecklist: {
            quality: true,
            safety: true,
            tone: true,
            factuality: true,
        },
    };
}
