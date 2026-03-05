import type {
    CampaignBrief, FunnelPlan, CopyVariant, CopyPolicy,
    ChannelVariantSet, VariantScore, ChannelName, FunnelStageName,
} from '../../core/src/types';
import { newEntityId } from '../../core/src/id';

const DEFAULT_POLICY: CopyPolicy = {
    id: 'policy-v1',
    version: '1.0.0',
    maxLength: { meta: 280, linkedin: 700, x: 280, email: 2000 },
    bannedTerms: ['guaranteed', 'risk-free', 'act now'],
};

const MOCK_HEADLINES: Record<FunnelStageName, Record<ChannelName, string>> = {
    awareness: {
        meta: 'Tired of juggling 5 tools? There\'s a better way.',
        linkedin: 'How top teams are cutting campaign setup time by 60%',
        x: '🚀 Campaign chaos → Campaign clarity. Here\'s how.',
        email: 'You\'re working too hard on marketing. Let us show you why.',
    },
    consideration: {
        meta: 'See how [Business] went from scattered to streamlined',
        linkedin: 'The 3-step framework that replaces your entire marketing stack',
        x: 'Before: 5 tools, 3 hours. After: 1 dashboard, 20 minutes.',
        email: 'Here\'s the guide your marketing coordinator wishes they had',
    },
    decision: {
        meta: 'Start your free trial — no credit card required',
        linkedin: 'Book a 15-min demo and see your first campaign launch live',
        x: '✅ Free trial. No card. Full features. Link below.',
        email: 'Your personalized demo is ready — pick a time that works',
    },
};

export function generateVariants(brief: CampaignBrief, plan: FunnelPlan): ChannelVariantSet {
    const variants: CopyVariant[] = [];

    for (const stage of plan.stages) {
        for (const channel of stage.channels) {
            variants.push({
                id: newEntityId('var'),
                channel,
                stage: stage.name,
                headline: (MOCK_HEADLINES[stage.name]?.[channel] || 'Check this out').replace('[Business]', brief.offerName),
                body: `Discover how ${brief.offerName} helps ${brief.audience} achieve ${brief.goals[0] || 'their goals'}. ${stage.ctas[0] || 'Learn more'} today.`,
                cta: stage.ctas[0] || 'Learn More',
                policyVersion: DEFAULT_POLICY.version,
            });
        }
    }

    return {
        briefId: brief.id,
        policyVersion: DEFAULT_POLICY.version,
        variants,
    };
}

export function scoreVariants(set: ChannelVariantSet): VariantScore[] {
    return set.variants.map((v, i) => {
        let score = 70 + ((i * 7) % 25);
        if (v.headline.length < 60) score += 5;
        if (v.body.length < 200) score += 3;
        score = Math.min(99, score);

        const reasons: string[] = [];
        if (v.headline.length < 60) reasons.push('Concise headline');
        if (v.body.length < 200) reasons.push('Body within optimal length');
        if (v.cta.length > 0) reasons.push('Clear call to action');
        if (score >= 85) reasons.push('Strong overall quality');

        return { variantId: v.id, score, reasons };
    });
}

export function getDefaultPolicy(): CopyPolicy {
    return { ...DEFAULT_POLICY };
}
