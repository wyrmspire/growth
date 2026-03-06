/**
 * Opportunity scoring and relevance filtering.
 *
 * The scorer uses a composite algorithm:
 *   keywordRelevance (0-40) + engagementPotential (0-30) + recency (0-20) - riskPenalty (0-20)
 *
 * Items below a relevance threshold are filtered out so only
 * high-value opportunities reach the LLM for draft generation.
 */
import type {
    OpportunityItem,
    OpportunityScoreBreakdown,
    EntityId,
    ScoutPlatform,
} from '@core/types';
import { newEntityId } from '@core/id';

// ─── Scoring ─────────────────────────────────────────────────────

export interface ScoreInput {
    contentSnippet: string;
    author: string;
    platform: ScoutPlatform;
    sourceUrl: string;
    discoveredAt: string;
    /** Business-relevant keywords to match against */
    keywords: string[];
    /** Known risk phrases (spam indicators, competitor names, etc.) */
    riskPhrases?: string[];
}

/**
 * Score an opportunity item based on keyword relevance, engagement
 * potential, recency, and risk.  Returns a fully populated
 * OpportunityItem with a composite score 0-100.
 */
export function scoreOpportunity(input: ScoreInput): OpportunityItem {
    const lowerContent = input.contentSnippet.toLowerCase();

    // Keyword relevance: 0-40 based on how many keywords appear
    const matchedKeywords = input.keywords.filter((k) =>
        lowerContent.includes(k.toLowerCase()),
    );
    const keywordRelevance = Math.min(40, matchedKeywords.length * 10);

    // Engagement potential: 0-30 based on content signals
    let engagementPotential = 10; // base
    if (lowerContent.includes('?')) engagementPotential += 10; // question = high
    if (lowerContent.length > 50 && lowerContent.length < 500) engagementPotential += 5; // right size
    if (lowerContent.includes('help') || lowerContent.includes('recommend') || lowerContent.includes('looking for')) {
        engagementPotential += 5;
    }
    engagementPotential = Math.min(30, engagementPotential);

    // Recency: 0-20 based on how recent the post is
    const ageMs = Date.now() - new Date(input.discoveredAt).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    const recency = ageHours < 1 ? 20 : ageHours < 6 ? 15 : ageHours < 24 ? 10 : ageHours < 72 ? 5 : 0;

    // Risk penalty: 0-20 based on risk phrases
    const riskPhrases = input.riskPhrases || [];
    const matchedRisks = riskPhrases.filter((r) =>
        lowerContent.includes(r.toLowerCase()),
    );
    const riskPenalty = Math.min(20, matchedRisks.length * 10);

    const riskFlags = matchedRisks.map((r) => `Contains risk phrase: "${r}"`);

    const breakdown: OpportunityScoreBreakdown = {
        keywordRelevance,
        engagementPotential,
        recency,
        riskPenalty,
    };

    const score = Math.max(0, Math.min(100, keywordRelevance + engagementPotential + recency - riskPenalty));

    return {
        id: newEntityId('opp'),
        platform: input.platform,
        sourceUrl: input.sourceUrl,
        author: input.author,
        contentSnippet: input.contentSnippet,
        score,
        scoreBreakdown: breakdown,
        riskFlags,
        discoveredAt: input.discoveredAt,
    };
}

// ─── Filtering ───────────────────────────────────────────────────

/**
 * Remove opportunities below a minimum score threshold.
 * Default threshold is 30.
 */
export function filterByRelevance(
    items: OpportunityItem[],
    minScore = 30,
): OpportunityItem[] {
    return items.filter((item) => item.score >= minScore);
}

/**
 * Sort opportunities by score descending and take the top N.
 */
export function topOpportunities(
    items: OpportunityItem[],
    limit = 5,
): OpportunityItem[] {
    return [...items].sort((a, b) => b.score - a.score).slice(0, limit);
}
