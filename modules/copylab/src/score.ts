import type { ChannelVariantSet, CopyPolicy, VariantScore } from '@core/types';
import { countVariantCharacters } from './format';
import { getDefaultPolicy } from './policy';

function clamp(value: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, value));
}

function containsBannedTerm(text: string, policy: CopyPolicy): boolean {
    const lowered = text.toLowerCase();
    return policy.bannedTerms.some((term) => lowered.includes(term.toLowerCase()));
}

export function scoreVariants(set: ChannelVariantSet, policy: CopyPolicy = getDefaultPolicy()): VariantScore[] {
    if (!set || !Array.isArray(set.variants)) {
        throw new Error('SCORE_INPUT_INVALID');
    }

    return set.variants.map((variant) => {
        let score = 50;
        const reasons: string[] = [];

        if (variant.headline.length <= 60) {
            score += 15;
            reasons.push('Headline length is concise');
        } else {
            reasons.push('Headline may be too long');
        }

        if (countVariantCharacters(variant) <= policy.maxLength[variant.channel]) {
            score += 20;
            reasons.push('Fits channel length constraints');
        } else {
            score -= 20;
            reasons.push('Exceeds channel length constraints');
        }

        if (variant.cta.trim().length >= 4) {
            score += 10;
            reasons.push('Clear call to action');
        }

        if (variant.stage === 'decision' && /start|book|buy|try|get/i.test(variant.cta)) {
            score += 5;
            reasons.push('CTA matches decision intent');
        }

        if (containsBannedTerm(`${variant.headline} ${variant.body} ${variant.cta}`, policy)) {
            score -= 40;
            reasons.push('Contains banned policy terms');
        }

        return {
            variantId: variant.id,
            score: clamp(score),
            reasons,
        };
    });
}

