import type {
    CampaignInstructionPack,
    ChannelName,
    EntityId,
    GeneratedCopyAudit,
    StyleViolation,
} from '@core/types';
import { getChannelOverride } from './instructions';

// ─── Helpers ─────────────────────────────────────────────────────

function extractBannedTerms(rules: string[]): string[] {
    const line = rules.find((r) => r.startsWith('BANNED_TERMS:'));
    if (!line) return [];
    return line
        .replace('BANNED_TERMS: Do not use any of these words or phrases: ', '')
        .split(', ')
        .map((t) => t.trim())
        .filter(Boolean);
}

function extractRequiredPhrases(rules: string[]): string[] {
    const line = rules.find((r) => r.startsWith('REQUIRED_PHRASES:'));
    if (!line) return [];
    return line
        .replace('REQUIRED_PHRASES: Every output must include at least one of: ', '')
        .split(', ')
        .map((t) => t.trim())
        .filter(Boolean);
}

// ─── Validator ───────────────────────────────────────────────────

/**
 * Validate generated text against a compiled instruction pack.
 *
 * Checks:
 *  1. Banned terms  (hard violation)
 *  2. Required phrases missing  (hard violation)
 *  3. Max length exceeded  (hard violation)
 *  4. Emoji policy breach  (soft violation)
 *  5. Hashtag policy breach  (soft violation)
 *
 * Returns a GeneratedCopyAudit with a 0-100 score.
 * Hard violations each deduct 20 points; soft violations deduct 5.
 */
export function validateAgainstStylePack(
    text: string,
    pack: CampaignInstructionPack,
    channel: ChannelName,
    variantId: EntityId,
): GeneratedCopyAudit {
    const violations: StyleViolation[] = [];
    const override = getChannelOverride(pack, channel);
    const lowerText = text.toLowerCase();

    // 1. Banned terms
    const banned = extractBannedTerms(pack.complianceRules);
    for (const term of banned) {
        if (lowerText.includes(term.toLowerCase())) {
            violations.push({
                rule: 'BANNED_TERM',
                severity: 'hard',
                detail: `Text contains banned term: "${term}"`,
            });
        }
    }

    // 2. Required phrases
    const required = extractRequiredPhrases(pack.complianceRules);
    if (required.length > 0) {
        const hasAtLeastOne = required.some((phrase) =>
            lowerText.includes(phrase.toLowerCase()),
        );
        if (!hasAtLeastOne) {
            violations.push({
                rule: 'MISSING_REQUIRED_PHRASE',
                severity: 'hard',
                detail: `Text must include at least one of: ${required.join(', ')}`,
            });
        }
    }

    // 3. Max length
    if (text.length > override.maxLength) {
        violations.push({
            rule: 'MAX_LENGTH_EXCEEDED',
            severity: 'hard',
            detail: `Text is ${text.length} chars, max is ${override.maxLength} for ${channel}`,
        });
    }

    // 4. Emoji policy
    const emojiPattern = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const emojiCount = (text.match(emojiPattern) || []).length;
    if (override.emojiPolicy === 'none' && emojiCount > 0) {
        violations.push({
            rule: 'EMOJI_POLICY_BREACH',
            severity: 'soft',
            detail: `Emoji policy is "none" but text contains ${emojiCount} emoji(s)`,
        });
    }

    // 5. Hashtag policy
    const hashtagCount = (text.match(/#\w+/g) || []).length;
    if (override.hashtagPolicy === 'none' && hashtagCount > 0) {
        violations.push({
            rule: 'HASHTAG_POLICY_BREACH',
            severity: 'soft',
            detail: `Hashtag policy is "none" but text contains ${hashtagCount} hashtag(s)`,
        });
    }

    // Score: start at 100, deduct per violation
    const hardCount = violations.filter((v) => v.severity === 'hard').length;
    const softCount = violations.filter((v) => v.severity === 'soft').length;
    const score = Math.max(0, 100 - hardCount * 20 - softCount * 5);

    return {
        variantId,
        styleProfileId: pack.styleProfileId,
        policyVersion: pack.compiledAt,
        violations,
        score,
        passed: hardCount === 0,
    };
}
