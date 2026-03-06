import { describe, it, expect } from 'vitest';
import { scoreOpportunity, filterByRelevance, topOpportunities } from '../scorer';
import type { OpportunityItem } from '@core/types';

const NOW = new Date().toISOString();

describe('scoreOpportunity', () => {
    it('scores high for keyword-rich questions', () => {
        const item = scoreOpportunity({
            contentSnippet: 'Looking for help with marketing automation for my small business?',
            author: 'testuser',
            platform: 'reddit',
            sourceUrl: 'https://reddit.com/r/smallbusiness/1',
            discoveredAt: NOW,
            keywords: ['marketing', 'automation', 'small business'],
        });
        expect(item.score).toBeGreaterThanOrEqual(50);
        expect(item.scoreBreakdown.keywordRelevance).toBe(30); // 3 keywords * 10
        expect(item.scoreBreakdown.engagementPotential).toBeGreaterThanOrEqual(20); // question + help
    });

    it('scores low for irrelevant content', () => {
        const item = scoreOpportunity({
            contentSnippet: 'Just had a great pizza for lunch',
            author: 'testuser',
            platform: 'x',
            sourceUrl: 'https://x.com/1',
            discoveredAt: NOW,
            keywords: ['marketing', 'automation'],
        });
        // No keywords matched → keywordRelevance = 0, but base engagement (10) + recency (20) = 30
        expect(item.score).toBeLessThanOrEqual(30);
        expect(item.scoreBreakdown.keywordRelevance).toBe(0);
    });

    it('penalizes risky content', () => {
        const clean = scoreOpportunity({
            contentSnippet: 'Looking for marketing help with my startup',
            author: 'user1',
            platform: 'reddit',
            sourceUrl: 'https://reddit.com/1',
            discoveredAt: NOW,
            keywords: ['marketing'],
        });
        const risky = scoreOpportunity({
            contentSnippet: 'Looking for marketing help, competitor-brand is terrible',
            author: 'user2',
            platform: 'reddit',
            sourceUrl: 'https://reddit.com/2',
            discoveredAt: NOW,
            keywords: ['marketing'],
            riskPhrases: ['competitor-brand'],
        });
        expect(risky.score).toBeLessThan(clean.score);
        expect(risky.riskFlags.length).toBeGreaterThan(0);
    });

    it('caps keyword relevance at 40', () => {
        const item = scoreOpportunity({
            contentSnippet: 'marketing automation growth hacking leads funnel business strategy',
            author: 'user',
            platform: 'linkedin',
            sourceUrl: 'https://linkedin.com/1',
            discoveredAt: NOW,
            keywords: ['marketing', 'automation', 'growth', 'hacking', 'leads', 'funnel', 'business'],
        });
        expect(item.scoreBreakdown.keywordRelevance).toBe(40);
    });
});

describe('filterByRelevance', () => {
    it('removes items below threshold', () => {
        const items: OpportunityItem[] = [
            scoreOpportunity({ contentSnippet: 'marketing help?', author: 'a', platform: 'reddit', sourceUrl: '', discoveredAt: NOW, keywords: ['marketing'] }),
            scoreOpportunity({ contentSnippet: 'pizza', author: 'b', platform: 'reddit', sourceUrl: '', discoveredAt: NOW, keywords: ['marketing'] }),
        ];
        const filtered = filterByRelevance(items, 35);
        expect(filtered.length).toBeLessThanOrEqual(items.length);
        filtered.forEach((item) => {
            expect(item.score).toBeGreaterThanOrEqual(35);
        });
    });
});

describe('topOpportunities', () => {
    it('returns top N sorted by score descending', () => {
        const items: OpportunityItem[] = [
            scoreOpportunity({ contentSnippet: 'marketing automation help?', author: 'a', platform: 'reddit', sourceUrl: '', discoveredAt: NOW, keywords: ['marketing', 'automation'] }),
            scoreOpportunity({ contentSnippet: 'pizza dinner', author: 'b', platform: 'reddit', sourceUrl: '', discoveredAt: NOW, keywords: ['marketing'] }),
            scoreOpportunity({ contentSnippet: 'need marketing strategy for growth please help recommend', author: 'c', platform: 'reddit', sourceUrl: '', discoveredAt: NOW, keywords: ['marketing', 'strategy', 'growth'] }),
        ];
        const top = topOpportunities(items, 2);
        expect(top).toHaveLength(2);
        expect(top[0].score).toBeGreaterThanOrEqual(top[1].score);
    });
});
