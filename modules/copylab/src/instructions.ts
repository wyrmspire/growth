import type {
    StyleProfile,
    ChannelStyleOverride,
    CampaignInstructionPack,
    ChannelName,
    EntityId,
} from '@core/types';

// ─── Defaults ────────────────────────────────────────────────────

const DEFAULT_CHANNEL_OVERRIDES: Record<ChannelName, ChannelStyleOverride> = {
    meta: {
        channel: 'meta',
        maxLength: 2200,
        emojiPolicy: 'sparse',
        hashtagPolicy: 'open',
        lineBreakPolicy: 'short-paragraphs',
    },
    linkedin: {
        channel: 'linkedin',
        maxLength: 3000,
        emojiPolicy: 'sparse',
        hashtagPolicy: 'branded-only',
        lineBreakPolicy: 'short-paragraphs',
    },
    x: {
        channel: 'x',
        maxLength: 280,
        emojiPolicy: 'sparse',
        hashtagPolicy: 'open',
        lineBreakPolicy: 'single-block',
    },
    email: {
        channel: 'email',
        maxLength: 5000,
        emojiPolicy: 'none',
        hashtagPolicy: 'none',
        lineBreakPolicy: 'short-paragraphs',
    },
};

// ─── Compiler ────────────────────────────────────────────────────

/**
 * Compile a StyleProfile and optional per-channel overrides into a
 * CampaignInstructionPack.  The pack is the canonical input for
 * copyCoachFlow and for the offline validator.
 *
 * Missing channel overrides are filled from sensible defaults.
 * Compliance rules are derived from the profile's bannedTerms,
 * requiredPhrases, and allowedClaims.
 */
export function buildInstructionPack(
    campaignId: EntityId,
    profile: StyleProfile,
    channelOverrides?: ChannelStyleOverride[],
): CampaignInstructionPack {
    // Merge user overrides on top of defaults
    const merged = { ...DEFAULT_CHANNEL_OVERRIDES };
    if (channelOverrides) {
        for (const override of channelOverrides) {
            merged[override.channel] = { ...merged[override.channel], ...override };
        }
    }

    // Build compliance rules from profile constraints
    const complianceRules: string[] = [];

    if (profile.bannedTerms.length > 0) {
        complianceRules.push(
            `BANNED_TERMS: Do not use any of these words or phrases: ${profile.bannedTerms.join(', ')}`,
        );
    }

    if (profile.requiredPhrases.length > 0) {
        complianceRules.push(
            `REQUIRED_PHRASES: Every output must include at least one of: ${profile.requiredPhrases.join(', ')}`,
        );
    }

    if (profile.allowedClaims.length > 0) {
        complianceRules.push(
            `ALLOWED_CLAIMS: Only these claims may appear: ${profile.allowedClaims.join(', ')}. Do not invent claims.`,
        );
    }

    complianceRules.push(`TONE: Write in a ${profile.tone} tone.`);
    complianceRules.push(`FORMALITY: ${profile.formality}/10 — ${profile.formality >= 7 ? 'formal register' : profile.formality >= 4 ? 'conversational register' : 'very casual register'}.`);
    complianceRules.push(`CTA_INTENSITY: ${profile.ctaIntensity} — ${profile.ctaIntensity === 'soft' ? 'suggest, do not push' : profile.ctaIntensity === 'medium' ? 'clear call to action' : 'urgent, direct CTA'}.`);
    complianceRules.push(`READING_LEVEL: Target ${profile.readingLevel}.`);

    return {
        campaignId,
        styleProfileId: profile.id,
        channelOverrides: Object.values(merged),
        complianceRules,
        compiledAt: new Date().toISOString(),
    };
}

/**
 * Return the channel-specific override from a compiled pack.
 * Falls back to the default if the channel is not in the pack.
 */
export function getChannelOverride(
    pack: CampaignInstructionPack,
    channel: ChannelName,
): ChannelStyleOverride {
    return (
        pack.channelOverrides.find((o) => o.channel === channel) ??
        DEFAULT_CHANNEL_OVERRIDES[channel]
    );
}

/**
 * Render the pack as a flat system-prompt string that a Genkit flow
 * (or any LLM call) can ingest as instruction context.
 */
export function renderPackAsPrompt(
    pack: CampaignInstructionPack,
    channel: ChannelName,
): string {
    const override = getChannelOverride(pack, channel);
    const lines: string[] = [
        '## Writing Instructions',
        '',
        ...pack.complianceRules.map((r) => `- ${r}`),
        '',
        `## Channel Constraints (${channel})`,
        `- Max length: ${override.maxLength} characters`,
        `- Emoji policy: ${override.emojiPolicy}`,
        `- Hashtag policy: ${override.hashtagPolicy}`,
        `- Line break style: ${override.lineBreakPolicy}`,
    ];
    return lines.join('\n');
}
