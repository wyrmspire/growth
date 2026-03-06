/**
 * Mock scanner — SCOUT-4
 * Generates realistic mock opportunity data for testing the
 * scan → score → filter → inbox pipeline without Playwright.
 */
import type { ScoutPlatform } from '@core/types';
import { scoreOpportunity, filterByRelevance, topOpportunities } from './scorer';
import type { ScoreInput } from './scorer';

// ─── Mock data sources ───────────────────────────────────────────

const MOCK_RAW_POSTS: Array<{
    platform: ScoutPlatform;
    author: string;
    contentSnippet: string;
    sourceUrl: string;
}> = [
        {
            platform: 'reddit',
            author: 'u/smallbiz_owner',
            contentSnippet: 'Does anyone have a good recommendation for a local automation consultant? We\'re spending 10 hrs/week on manual data entry.',
            sourceUrl: 'https://reddit.com/r/smallbusiness/mock-1',
        },
        {
            platform: 'reddit',
            author: 'u/startup_newbie',
            contentSnippet: 'Just launched my first SaaS product. Any tips for getting early users without a budget?',
            sourceUrl: 'https://reddit.com/r/startups/mock-2',
        },
        {
            platform: 'x',
            author: '@designstudio_co',
            contentSnippet: 'Spent 3 days on a proposal nobody read. There has to be a better way to qualify clients before writing full briefs.',
            sourceUrl: 'https://x.com/mock/status/1',
        },
        {
            platform: 'x',
            author: '@random_user',
            contentSnippet: 'Just had the best pizza in Brooklyn. Highly recommend the margherita.',
            sourceUrl: 'https://x.com/mock/status/2',
        },
        {
            platform: 'linkedin',
            author: 'Jane Smith, CEO',
            contentSnippet: 'Looking for recommendations on lead qualification tools for B2B services. Our close rate has been dropping and I think unqualified leads are the problem.',
            sourceUrl: 'https://linkedin.com/posts/mock-3',
        },
        {
            platform: 'facebook',
            author: 'Local Business Owners Group',
            contentSnippet: 'Anyone tried using AI tools for marketing? Getting mixed results and not sure if it\'s worth the cost.',
            sourceUrl: 'https://facebook.com/groups/mock-4',
        },
        {
            platform: 'instagram',
            author: '@competitor_brand',
            contentSnippet: 'Check out our new competitor-brand marketing suite! Free trial for 30 days.',
            sourceUrl: 'https://instagram.com/p/mock-5',
        },
        {
            platform: 'reddit',
            author: 'u/growth_hacker',
            contentSnippet: 'What marketing automation tools do you use for a small team? Looking for something that handles email campaigns and social posting.',
            sourceUrl: 'https://reddit.com/r/marketing/mock-6',
        },
    ];

// ─── Scanner ─────────────────────────────────────────────────────

export interface ScanConfig {
    keywords: string[];
    riskPhrases?: string[];
    minScore?: number;
    maxResults?: number;
}

const DEFAULT_CONFIG: ScanConfig = {
    keywords: ['marketing', 'automation', 'growth', 'lead', 'client', 'proposal', 'qualify'],
    riskPhrases: ['competitor-brand', 'free trial', 'spam'],
    minScore: 30,
    maxResults: 5,
};

/**
 * Run a mock scan: score all mock posts, filter by relevance,
 * and return the top opportunities.
 */
export function runMockScan(config: ScanConfig = DEFAULT_CONFIG) {
    const now = new Date().toISOString();

    const scoreInputs: ScoreInput[] = MOCK_RAW_POSTS.map((post) => ({
        contentSnippet: post.contentSnippet,
        author: post.author,
        platform: post.platform,
        sourceUrl: post.sourceUrl,
        discoveredAt: now,
        keywords: config.keywords,
        riskPhrases: config.riskPhrases,
    }));

    const scored = scoreInputs.map(scoreOpportunity);
    const filtered = filterByRelevance(scored, config.minScore ?? 30);
    const top = topOpportunities(filtered, config.maxResults ?? 5);

    return {
        totalScanned: MOCK_RAW_POSTS.length,
        totalScored: scored.length,
        totalFiltered: filtered.length,
        opportunities: top,
    };
}
