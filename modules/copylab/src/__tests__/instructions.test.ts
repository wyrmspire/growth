import { describe, it, expect } from 'vitest';
import { buildInstructionPack, getChannelOverride, renderPackAsPrompt } from '../instructions';
import type { StyleProfile, ChannelStyleOverride, EntityId } from '@core/types';

function makeProfile(overrides: Partial<StyleProfile> = {}): StyleProfile {
    return {
        id: 'style_test' as EntityId,
        name: 'Test Profile',
        tone: 'professional',
        formality: 7,
        readingLevel: '8th grade',
        ctaIntensity: 'medium',
        bannedTerms: ['guaranteed', 'free money'],
        requiredPhrases: ['Learn more'],
        allowedClaims: ['Industry-leading'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        ...overrides,
    };
}

const CAMPAIGN_ID = 'camp_test' as EntityId;

describe('buildInstructionPack', () => {
    it('compiles a pack with all compliance rules', () => {
        const pack = buildInstructionPack(CAMPAIGN_ID, makeProfile());
        expect(pack.campaignId).toBe(CAMPAIGN_ID);
        expect(pack.styleProfileId).toBe('style_test');
        expect(pack.complianceRules).toContain('BANNED_TERMS: Do not use any of these words or phrases: guaranteed, free money');
        expect(pack.complianceRules).toContain('REQUIRED_PHRASES: Every output must include at least one of: Learn more');
        expect(pack.complianceRules).toContain('ALLOWED_CLAIMS: Only these claims may appear: Industry-leading. Do not invent claims.');
        expect(pack.complianceRules.find((r) => r.startsWith('TONE:'))).toContain('professional');
        expect(pack.complianceRules.find((r) => r.startsWith('FORMALITY:'))).toContain('7/10');
        expect(pack.complianceRules.find((r) => r.startsWith('CTA_INTENSITY:'))).toContain('medium');
        expect(pack.complianceRules.find((r) => r.startsWith('READING_LEVEL:'))).toContain('8th grade');
    });

    it('fills default channel overrides for all 4 channels', () => {
        const pack = buildInstructionPack(CAMPAIGN_ID, makeProfile());
        const channels = pack.channelOverrides.map((o) => o.channel);
        expect(channels).toContain('meta');
        expect(channels).toContain('linkedin');
        expect(channels).toContain('x');
        expect(channels).toContain('email');
    });

    it('merges user channel overrides on top of defaults', () => {
        const custom: ChannelStyleOverride = {
            channel: 'x',
            maxLength: 140,
            emojiPolicy: 'none',
            hashtagPolicy: 'branded-only',
            lineBreakPolicy: 'single-block',
        };
        const pack = buildInstructionPack(CAMPAIGN_ID, makeProfile(), [custom]);
        const xOverride = pack.channelOverrides.find((o) => o.channel === 'x');
        expect(xOverride?.maxLength).toBe(140);
        expect(xOverride?.emojiPolicy).toBe('none');
    });

    it('skips banned terms rule when list is empty', () => {
        const pack = buildInstructionPack(CAMPAIGN_ID, makeProfile({ bannedTerms: [] }));
        expect(pack.complianceRules.find((r) => r.startsWith('BANNED_TERMS:'))).toBeUndefined();
    });

    it('skips required phrases rule when list is empty', () => {
        const pack = buildInstructionPack(CAMPAIGN_ID, makeProfile({ requiredPhrases: [] }));
        expect(pack.complianceRules.find((r) => r.startsWith('REQUIRED_PHRASES:'))).toBeUndefined();
    });
});

describe('getChannelOverride', () => {
    it('returns the matching override from the pack', () => {
        const pack = buildInstructionPack(CAMPAIGN_ID, makeProfile());
        const meta = getChannelOverride(pack, 'meta');
        expect(meta.channel).toBe('meta');
        expect(meta.maxLength).toBe(2200);
    });
});

describe('renderPackAsPrompt', () => {
    it('returns a formatted prompt string with rules and channel constraints', () => {
        const pack = buildInstructionPack(CAMPAIGN_ID, makeProfile());
        const prompt = renderPackAsPrompt(pack, 'x');
        expect(prompt).toContain('## Writing Instructions');
        expect(prompt).toContain('BANNED_TERMS');
        expect(prompt).toContain('## Channel Constraints (x)');
        expect(prompt).toContain('Max length: 280');
    });
});
