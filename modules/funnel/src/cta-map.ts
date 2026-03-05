import type { ChannelName, FunnelStageName, AppError } from '../../core/src/types';

// ─── CTA Map ──────────────────────────────────────────────────────────────

/**
 * Channel-aware CTA map for each funnel stage.
 *
 * Rationale per stage:
 * - awareness: low-commitment actions to build familiarity
 * - consideration: medium-commitment actions to educate and qualify
 * - decision: high-commitment actions to convert
 *
 * Channel-specific CTAs reflect platform norms and audience expectations.
 */
export const CTA_MAP: Record<FunnelStageName, Record<ChannelName, string[]>> = {
    awareness: {
        meta: ['Learn More', 'Watch Video', 'See How It Works'],
        linkedin: ['Learn More', 'Follow Us', 'Watch the Demo'],
        x: ['Learn More', 'See the Thread', 'Explore'],
        email: ['Read the Story', 'Meet the Team', 'See How It Works'],
    },
    consideration: {
        meta: ['Download Free Guide', 'Get the Checklist', 'Book a Free Call'],
        linkedin: ['Download the Report', 'Register for Webinar', 'Book a Discovery Call'],
        x: ['Get the Free Resource', 'Join the Thread', 'Grab the Template'],
        email: ['Download the Guide', 'Schedule a Call', 'Get the Case Study'],
    },
    decision: {
        meta: ['Start Free Trial', 'Get Started Today', 'Claim Your Spot'],
        linkedin: ['Get a Proposal', 'Start Your Free Trial', 'Talk to Sales'],
        x: ['Join Now', 'Start Free', 'Get Access'],
        email: ['Start Free Trial', 'Activate Today', 'Claim Your Offer'],
    },
};

// ─── Error Helper ──────────────────────────────────────────────────────────

function makeError(code: string, message: string): AppError {
    return { code, message, module: 'funnel' };
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Return CTAs for a specific stage and channel combination.
 * Returns a copy of the array — mutations do not affect CTA_MAP.
 * Throws with an AppError if stage or channel is unknown.
 */
export function getCtasForStageChannel(stage: FunnelStageName, channel: ChannelName): string[] {
    const stageMap = CTA_MAP[stage];
    if (!stageMap) {
        throw Object.assign(
            new Error(`FUNNEL_STAGE_INVALID: Unknown funnel stage "${stage}".`),
            makeError('FUNNEL_STAGE_INVALID', `Unknown funnel stage "${stage}".`),
        );
    }

    const ctas = stageMap[channel];
    if (!ctas || ctas.length === 0) {
        throw Object.assign(
            new Error(`CTA_MISSING: No CTAs defined for stage "${stage}" on channel "${channel}".`),
            makeError('CTA_MISSING', `No CTAs defined for stage "${stage}" on channel "${channel}".`),
        );
    }

    return [...ctas];
}

/**
 * Return de-duplicated CTAs for a given stage across specified channels.
 * Useful for plan creation and validation.
 */
export function getCtasForStage(stage: FunnelStageName, channels: ChannelName[]): string[] {
    const ctaSet = new Set<string>();
    for (const channel of channels) {
        getCtasForStageChannel(stage, channel).forEach(c => ctaSet.add(c));
    }
    return [...ctaSet];
}

/**
 * @deprecated Use getCtasForStageChannel() instead.
 * Alias kept for backward-compatibility.
 */
export function getCtasForChannel(stage: FunnelStageName, channel: ChannelName): string[] {
    return getCtasForStageChannel(stage, channel);
}

/**
 * Return all CTAs for a given stage across all channels.
 * De-duplicated. Useful for plan creation default fallback.
 */
export function getDefaultCtas(stage: FunnelStageName): string[] {
    return getCtasForStage(stage, ['meta', 'linkedin', 'x', 'email']);
}
