/**
 * mock-model.ts
 * Deterministic mock responses for all three coaching flows.
 *
 * These are used automatically when GEMINI_API_KEY is not set so flows
 * work in learning mode / CI with no external calls.
 *
 * Each function returns a string that the flow's prompt handler parses.
 */

export const MockResponses = {
    offerStrategist: (businessName: string) => JSON.stringify({
        clarifyingQuestions: [
            `What specific outcome does ${businessName}'s best customer walk away with after buying from you?`,
            'What is the single biggest objection your typical prospect raises before buying?',
            'Which channels have driven any sales or engagement so far, even informally?',
        ],
        draftHypotheses: [
            {
                name: `${businessName} Fast-Start Package`,
                angle: 'Quick-win entry offer to remove purchase risk',
                icp: 'Budget-conscious first-time buyers',
                rationale: 'Reduces friction; lets prospects experience value before committing to a premium tier.',
                confidence: 0.80,
            },
            {
                name: `${businessName} Full-Service Engagement`,
                angle: 'Done-for-you premium offer',
                icp: 'Established businesses seeking time savings',
                rationale: 'Targets buyers who value outcome over price.',
                confidence: 0.72,
            },
        ],
        coachNote: 'These are hypotheses only — you decide which (if any) to pursue. Review them with your team before choosing.',
    }),

    copyCoach: (channel: string, funnelStage: string) => JSON.stringify({
        variants: [
            {
                id: 'v1',
                channel,
                funnelStage,
                headline: 'Stop wasting hours on tasks automation can handle',
                body: 'Discover how businesses like yours are reclaiming 10+ hours a week — without hiring more staff.',
                cta: 'See How It Works',
                explanation: 'Opens with a pain point (wasted hours), offers a specific outcome (10 hours back), and uses social proof ("businesses like yours") to lower resistance.',
            },
            {
                id: 'v2',
                channel,
                funnelStage,
                headline: 'What would you do with 10 extra hours this week?',
                body: 'Our clients automate the repetitive stuff so they can focus on growth. First session is free.',
                cta: 'Book Your Free Session',
                explanation: 'Leads with an aspirational question to trigger self-projection. The low-commitment CTA ("free session") reduces purchase anxiety.',
            },
        ],
        coachNote: 'Each variant targets a different emotional trigger. Test both and compare click-through rates before choosing.',
    }),

    replyCoach: (intent: string) => JSON.stringify({
        drafts: [
            {
                id: 'rd1',
                text: 'Thanks so much for reaching out! We\'d love to learn more about what you\'re working on — feel free to DM us or grab a free call at [link].',
                tone: 'Warm and inviting',
                reasoning: `For a "${intent}" comment, warmth + a low-friction next step converts best without feeling pushy.`,
            },
            {
                id: 'rd2',
                text: 'Great question — the short answer is yes, we can help with that. Want me to send you a quick overview?',
                tone: 'Direct and helpful',
                reasoning: 'Shorter reply works better on feeds where attention is brief. Ends with a soft close that keeps the conversation going.',
            },
        ],
        coachNote: 'Pick whichever draft feels most "on-brand" for you, or blend them. YOU approve before anything is sent.',
    }),
};
