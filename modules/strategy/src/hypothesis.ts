/**
 * STR-A2 — generateOfferHypotheses()
 * Produces offer hypotheses with rationale and confidence fields.
 * CONTRACT: modules/strategy/CONTRACT.md
 *
 * NOTE: This is an assistive function — hypotheses are RECOMMENDATIONS,
 * not auto-decisions. Human approval is required before any offer goes live.
 */

import type {
    DiscoveryInterview,
    OfferConstraints,
    OfferHypothesis,
    AppError,
} from '../../core/src/types';
import { newEntityId } from '../../core/src/id';

export interface HypothesisGenerationResult {
    ok: boolean;
    hypotheses?: OfferHypothesis[];
    error?: AppError;
}

interface HypothesisTemplate {
    nameSuffix: string;
    angle: string;
    icpModifier: string;
    rationaleTemplate: (b: DiscoveryInterview['data']) => string;
    baseConfidence: number;
}

const HYPOTHESIS_TEMPLATES: HypothesisTemplate[] = [
    {
        nameSuffix: 'Starter Pack',
        angle: 'Low-risk entry point for new customers',
        icpModifier: '',
        rationaleTemplate: (b) =>
            `Reduces adoption friction by addressing "${b.painPoints[0] ?? 'primary concern'}" with a beginner-friendly package. Ideal for first-time buyers of ${b.businessName} offerings.`,
        baseConfidence: 0.82,
    },
    {
        nameSuffix: 'Premium Solution',
        angle: 'High-value transformation offer for committed buyers',
        icpModifier: ' (high-budget segment)',
        rationaleTemplate: (b) =>
            `Leverages "${b.competitiveAdvantage}" as primary differentiator. Targets ${b.targetCustomer} who have already tried alternatives and want comprehensive results.`,
        baseConfidence: 0.74,
    },
    {
        nameSuffix: 'Quick Win',
        angle: 'Fast-result offer to build trust and momentum',
        icpModifier: ' (urgency-driven)',
        rationaleTemplate: (b) =>
            `Solves "${b.painPoints[1] ?? b.painPoints[0] ?? 'key blocker'}" in a short, defined time window. Demonstrates wins quickly — critical for ${b.industry} buyers who need proof before full commitment.`,
        baseConfidence: 0.68,
    },
    {
        nameSuffix: 'Retainer Program',
        angle: 'Ongoing relationship offer for recurring revenue',
        icpModifier: ' (growth-focused)',
        rationaleTemplate: (b) =>
            `Converts one-time buyers into long-term clients through continuous delivery of ${b.currentOfferings[0] ?? 'core service'}. Builds predictable revenue for ${b.businessName}.`,
        baseConfidence: 0.61,
    },
    {
        nameSuffix: 'DIY Toolkit',
        angle: 'Self-serve option for price-sensitive or independent buyers',
        icpModifier: ' (self-serve)',
        rationaleTemplate: (b) =>
            `Empowers ${b.targetCustomer} who prefer doing it themselves. Removes the objection of cost while keeping ${b.businessName} in the consideration set for future upgrades.`,
        baseConfidence: 0.55,
    },
];

/**
 * Generate offer hypotheses from a captured interview.
 * Each hypothesis includes:
 * - name: human-readable offer label
 * - angle: the strategic hook
 * - icp: ideal customer profile description
 * - rationale: explanation of why this works
 * - confidence: 0–1 score based on template fit and constraint match
 *
 * IMPORTANT: These are recommendations, not automatic decisions.
 * Human review is required before any offer is acted upon.
 */
export function generateOfferHypotheses(
    interview: DiscoveryInterview,
    constraints: OfferConstraints,
): HypothesisGenerationResult {
    if (!interview?.data?.businessName) {
        return {
            ok: false,
            error: {
                code: 'HYPOTHESIS_GENERATION_FAILED',
                message: 'Interview data is missing or malformed.',
                module: 'strategy',
            },
        };
    }

    if (constraints.maxHypotheses < 1) {
        return {
            ok: false,
            error: {
                code: 'HYPOTHESIS_GENERATION_FAILED',
                message: 'maxHypotheses must be at least 1.',
                module: 'strategy',
            },
        };
    }

    const data = interview.data;
    const limit = Math.min(constraints.maxHypotheses, HYPOTHESIS_TEMPLATES.length);

    const hypotheses: OfferHypothesis[] = HYPOTHESIS_TEMPLATES.slice(0, limit).map(
        (template, index) => {
            // Confidence modulated by number of channels in constraints (more channels = slightly
            // lower per-channel confidence to be conservative)
            const channelDiscount = constraints.channels.length > 2 ? 0.03 : 0;
            const confidence = Math.max(0.1, Math.min(1, template.baseConfidence - channelDiscount));

            return {
                id: newEntityId('hyp'),
                name: `${data.businessName} ${template.nameSuffix}`,
                angle: template.angle,
                icp: `${data.targetCustomer}${template.icpModifier}`,
                rationale: template.rationaleTemplate(data),
                confidence,
                rank: index + 1,
            };
        },
    );

    return { ok: true, hypotheses };
}
