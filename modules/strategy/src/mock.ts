import type {
    DiscoveryInterviewInput, DiscoveryInterview, OfferConstraints,
    OfferHypothesis, MarketSignal, ResearchSourcePlan, OfferProfile,
} from '../../core/src/types';
import { newEntityId } from '../../core/src/id';

export function captureInterview(input: DiscoveryInterviewInput): DiscoveryInterview {
    return {
        id: newEntityId('int'),
        version: 1,
        data: { ...input },
        capturedAt: new Date().toISOString(),
    };
}

export function generateOfferHypotheses(
    interview: DiscoveryInterview,
    constraints: OfferConstraints,
): OfferHypothesis[] {
    const base = interview.data;
    const hypotheses: OfferHypothesis[] = [
        {
            id: newEntityId('hyp'),
            name: `${base.businessName} Starter Pack`,
            angle: 'Low-risk entry point for new customers',
            icp: base.targetCustomer,
            rationale: `Addresses "${base.painPoints[0] || 'core pain point'}" with a beginner-friendly package.`,
            confidence: 0.85,
        },
        {
            id: newEntityId('hyp'),
            name: `${base.businessName} Premium Solution`,
            angle: 'High-value transformation offer',
            icp: `${base.targetCustomer} (high-budget segment)`,
            rationale: `Leverages "${base.competitiveAdvantage}" for maximum impact.`,
            confidence: 0.72,
        },
        {
            id: newEntityId('hyp'),
            name: `${base.businessName} Quick Win`,
            angle: 'Fast-result offer to build trust',
            icp: base.targetCustomer,
            rationale: `Solves "${base.painPoints[1] || 'secondary concern'}" in under 7 days.`,
            confidence: 0.68,
        },
    ];

    return hypotheses.slice(0, constraints.maxHypotheses);
}

export function collectMarketSignals(plan: ResearchSourcePlan): MarketSignal[] {
    return [
        {
            id: newEntityId('sig'),
            source: plan.allowedDomains[0] || 'industry-report.com',
            content: 'Market growing 23% YoY with increasing demand for automation solutions.',
            relevance: 0.91,
            collectedAt: new Date().toISOString(),
        },
        {
            id: newEntityId('sig'),
            source: plan.allowedDomains[1] || 'competitor-watch.io',
            content: 'Top competitor raised prices 15% — opportunity for value positioning.',
            relevance: 0.84,
            collectedAt: new Date().toISOString(),
        },
    ];
}

export function rankHypotheses(
    hypotheses: OfferHypothesis[],
    signals: MarketSignal[],
): OfferHypothesis[] {
    const avgRelevance = signals.reduce((s, m) => s + m.relevance, 0) / (signals.length || 1);

    return hypotheses
        .map((h, i) => ({
            ...h,
            confidence: Math.min(1, h.confidence + avgRelevance * 0.1),
            rank: i + 1,
        }))
        .sort((a, b) => b.confidence - a.confidence)
        .map((h, i) => ({ ...h, rank: i + 1 }));
}

export function buildOfferProfile(
    hypothesis: OfferHypothesis,
    signals: MarketSignal[],
): OfferProfile {
    return {
        id: newEntityId('prof'),
        hypothesis,
        signals,
        state: 'pending',
    };
}
