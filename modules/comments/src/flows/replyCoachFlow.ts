/**
 * BACK-6 — replyCoachFlow
 * Genkit flow that drafts a reply to a triaged comment with coaching rationale.
 *
 * Takes a triaged comment (with intent) and drafts a reply explaining the
 * reasoning behind the response strategy — teaches the operator as it helps.
 *
 * Mock-safe: runs without a real API key.
 * BACK-8: Evaluation checklist and human-review gate enforced.
 * CRITICAL: No reply is sent without human approval (PROJECT_RULES.md #4).
 */

import { genkit, z } from 'genkit';
import { LIVE_MODEL } from '../../../genkit-shared/src/genkit-init';

const ai = genkit({});

// ── Schemas ─────────────────────────────────────────────────────────────────

const ReplyCoachInput = z.object({
    commentId: z.string().describe('Unique ID of the comment being replied to'),
    commentText: z.string().min(1).describe('The full text of the comment'),
    commentAuthor: z.string().describe('Display name of the commenter'),
    intent: z
        .enum(['lead', 'objection', 'support', 'spam'])
        .describe('Classified intent of the comment'),
    channel: z
        .enum(['meta', 'linkedin', 'x', 'email'])
        .describe('Platform the comment appeared on'),
    offerContext: z.string().optional().describe('Brief description of the offer/campaign context'),
    tone: z.string().optional().describe('Preferred reply tone (default: warm and professional)'),
});

const ReplyCoachOutput = z.object({
    draftReply: z.string().describe('The proposed reply text — for human review before sending'),
    strategyExplained: z
        .string()
        .describe('Plain-English explanation of the reply strategy used'),
    coachingNote: z
        .string()
        .describe('Beginner tip about handling this type of comment'),
    doNotSendAutomatically: z
        .literal(true)
        .describe('Hard constraint: this reply must NOT be sent without human review'),
    characterCount: z.number().describe('Length of the draft reply'),
    humanReviewRequired: z.literal(true),
    evaluationChecklist: z.object({
        quality: z.boolean().describe('Reply is relevant and adds value'),
        safety: z.boolean().describe('No harmful, aggressive, or misleading content'),
        tone: z.boolean().describe('Tone is appropriate for the platform and intent'),
        factuality: z.boolean().describe('Claims are grounded in provided context'),
    }),
});

// ── Flow ─────────────────────────────────────────────────────────────────────

export const replyCoachFlow = ai.defineFlow(
    {
        name: 'replyCoachFlow',
        inputSchema: ReplyCoachInput,
        outputSchema: ReplyCoachOutput,
    },
    async (input) => {
        const isMockMode = !process.env.GEMINI_API_KEY;

        if (isMockMode) {
            return buildMockReplyCoachResponse(input);
        }

        const response = await ai.generate({
            model: LIVE_MODEL,
            prompt: buildReplyCoachPrompt(input),
            output: { schema: ReplyCoachOutput },
        });

        const output = response.output;
        if (!output) {
            throw new Error('replyCoachFlow: model returned no structured output');
        }

        // BACK-8: Enforce both flags — these cannot be overridden by model output
        return {
            ...output,
            humanReviewRequired: true as const,
            doNotSendAutomatically: true as const,
        };
    },
);

// ── Prompt ───────────────────────────────────────────────────────────────────

function buildReplyCoachPrompt(input: z.infer<typeof ReplyCoachInput>): string {
    const intentGuide: Record<string, string> = {
        lead: 'This is a buying signal. Acknowledge the interest warmly and give them a clear, low-pressure next step.',
        objection: 'This is a concern or question. Address it honestly without being defensive. Show empathy first.',
        support: 'This is positive feedback. Thank them genuinely and optionally invite further engagement.',
        spam: 'This is spam. Do not engage with the content. Draft a brief, professional non-reply or suggest ignoring.',
    };

    return `
You are a community management coach helping a beginner learn how to respond to social comments.
You must draft a reply AND explain your strategy in plain English.

Comment context:
- Platform: ${input.channel}
- Author: ${input.commentAuthor}
- Comment: "${input.commentText}"
- Intent classification: ${input.intent}
- Offer context: ${input.offerContext ?? 'general campaign'}
- Preferred tone: ${input.tone ?? 'warm and professional'}

Strategy guide for this intent: ${intentGuide[input.intent]}

Your output:
1. draftReply: A ready-to-review reply (not to be sent automatically)
2. strategyExplained: 2–3 sentences explaining your approach
3. coachingNote: 1 sentence beginner tip for handling ${input.intent} comments
4. Character limits: meta/x: under 280 chars. linkedin/email: under 500 chars.
5. Set humanReviewRequired = true and doNotSendAutomatically = true always.
6. Fill evaluationChecklist based on your own output quality.
`.trim();
}

// ── Mock response ─────────────────────────────────────────────────────────────

const MOCK_TEMPLATES: Record<
    'lead' | 'objection' | 'support' | 'spam',
    { reply: string; strategy: string; tip: string }
> = {
    lead: {
        reply: `Thanks for your interest! We'd love to learn more about your situation. What's your biggest challenge right now? Happy to point you in the right direction.`,
        strategy: `The commenter has shown buying intent, so we respond warmly and redirect to a discovery question rather than jumping straight to a pitch. This builds trust and opens a real conversation.`,
        tip: `When someone shows interest, ask a question instead of pitching — it shows you care about their fit more than a quick sale.`,
    },
    objection: {
        reply: `That's a fair question! Many people wonder the same thing. The key difference is [your specific advantage here] — happy to walk you through how it works. Would a quick call help?`,
        strategy: `We validate the concern ("that's a fair question") before offering perspective. This disarms defensiveness and shows we take feedback seriously.`,
        tip: `Never argue with an objection — agree with the concern first, then reframe with evidence.`,
    },
    support: {
        reply: `This made our day — thank you! We love hearing when it clicks. If you ever want to dig deeper into any part of the process, we're here.`,
        strategy: `Positive comments deserve genuine gratitude, not a generic "Thanks!" We acknowledge specificity and invite further connection without over-selling.`,
        tip: `A good response to positive feedback keeps the relationship warm without immediately trying to convert it into a sale.`,
    },
    spam: {
        reply: `[Recommend: Do not reply. Mark as spam and hide from the post. Engaging with spam signals legitimize it and wastes your time.]`,
        strategy: `Spam comments are not worth replying to. The recommended action is to hide the comment from the post to keep the conversation clean for real prospects.`,
        tip: `Your best response to spam is no response — using your platform's hide/report tools keeps your community professional.`,
    },
};

function buildMockReplyCoachResponse(
    input: z.infer<typeof ReplyCoachInput>,
): z.infer<typeof ReplyCoachOutput> {
    const template = MOCK_TEMPLATES[input.intent];
    return {
        draftReply: template.reply,
        strategyExplained: template.strategy,
        coachingNote: template.tip,
        doNotSendAutomatically: true,
        characterCount: template.reply.length,
        humanReviewRequired: true,
        evaluationChecklist: {
            quality: input.intent !== 'spam',
            safety: true,
            tone: true,
            factuality: true,
        },
    };
}
