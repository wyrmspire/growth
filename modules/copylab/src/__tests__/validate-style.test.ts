import { describe, it, expect } from 'vitest';
import { validateAgainstStylePack } from '../validate-style';
import { buildInstructionPack } from '../instructions';
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
        allowedClaims: [],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        ...overrides,
    };
}

const CAMPAIGN_ID = 'camp_test' as EntityId;
const VARIANT_ID = 'var_test' as EntityId;

describe('validateAgainstStylePack', () => {
    it('passes clean text with no violations', () => {
        const pack = buildInstructionPack(CAMPAIGN_ID, makeProfile());
        const audit = validateAgainstStylePack(
            'This is a great product. Learn more about our solution.',
            pack,
            'meta',
            VARIANT_ID,
        );
        expect(audit.passed).toBe(true);
        expect(audit.score).toBe(100);
        expect(audit.violations).toHaveLength(0);
    });

    it('flags banned terms as hard violations', () => {
        const pack = buildInstructionPack(CAMPAIGN_ID, makeProfile());
        const audit = validateAgainstStylePack(
            'This is guaranteed to work! Learn more.',
            pack,
            'meta',
            VARIANT_ID,
        );
        expect(audit.passed).toBe(false);
        expect(audit.violations.find((v) => v.rule === 'BANNED_TERM')).toBeDefined();
    });

    it('flags missing required phrases as hard violations', () => {
        const pack = buildInstructionPack(CAMPAIGN_ID, makeProfile());
        const audit = validateAgainstStylePack(
            'This is a great product with no call to action.',
            pack,
            'meta',
            VARIANT_ID,
        );
        expect(audit.passed).toBe(false);
        expect(audit.violations.find((v) => v.rule === 'MISSING_REQUIRED_PHRASE')).toBeDefined();
    });

    it('flags text exceeding max length for channel', () => {
        const customOverride: ChannelStyleOverride = {
            channel: 'x',
            maxLength: 10,
            emojiPolicy: 'sparse',
            hashtagPolicy: 'open',
            lineBreakPolicy: 'single-block',
        };
        const pack = buildInstructionPack(CAMPAIGN_ID, makeProfile({ requiredPhrases: [] }), [customOverride]);
        const audit = validateAgainstStylePack(
            'This text is way too long for X',
            pack,
            'x',
            VARIANT_ID,
        );
        expect(audit.violations.find((v) => v.rule === 'MAX_LENGTH_EXCEEDED')).toBeDefined();
    });

    it('flags emojis when emoji policy is none', () => {
        const customOverride: ChannelStyleOverride = {
            channel: 'email',
            maxLength: 5000,
            emojiPolicy: 'none',
            hashtagPolicy: 'none',
            lineBreakPolicy: 'short-paragraphs',
        };
        const pack = buildInstructionPack(CAMPAIGN_ID, makeProfile({ requiredPhrases: [] }), [customOverride]);
        const audit = validateAgainstStylePack(
            'Great news! 🎉 Check this out',
            pack,
            'email',
            VARIANT_ID,
        );
        expect(audit.violations.find((v) => v.rule === 'EMOJI_POLICY_BREACH')).toBeDefined();
        expect(audit.violations.find((v) => v.rule === 'EMOJI_POLICY_BREACH')?.severity).toBe('soft');
    });

    it('flags hashtags when hashtag policy is none', () => {
        const pack = buildInstructionPack(CAMPAIGN_ID, makeProfile({ requiredPhrases: [] }), [
            { channel: 'email', maxLength: 5000, emojiPolicy: 'none', hashtagPolicy: 'none', lineBreakPolicy: 'short-paragraphs' },
        ]);
        const audit = validateAgainstStylePack(
            'Check out our #marketing tips',
            pack,
            'email',
            VARIANT_ID,
        );
        expect(audit.violations.find((v) => v.rule === 'HASHTAG_POLICY_BREACH')).toBeDefined();
    });

    it('deducts 20 per hard violation and 5 per soft', () => {
        const pack = buildInstructionPack(CAMPAIGN_ID, makeProfile(), [
            { channel: 'email', maxLength: 5, emojiPolicy: 'none', hashtagPolicy: 'none', lineBreakPolicy: 'short-paragraphs' },
        ]);
        // This text: banned term (hard -20), missing required phrase (hard -20), too long (hard -20), has emoji (soft -5), has hashtag (soft -5)
        const audit = validateAgainstStylePack(
            'This guaranteed result 🎉 #sale',
            pack,
            'email',
            VARIANT_ID,
        );
        // 3 hard (60) + 2 soft (10) = 70 deducted → score 30
        expect(audit.score).toBe(30);
        expect(audit.passed).toBe(false);
    });
});
