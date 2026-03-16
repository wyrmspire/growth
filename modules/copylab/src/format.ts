import type { CopyPolicy, CopyVariant, ChannelVariantSet } from '@core/types';

export function countVariantCharacters(variant: Pick<CopyVariant, 'headline' | 'body' | 'cta'>): number {
    return `${variant.headline} ${variant.body} ${variant.cta}`.trim().length;
}

function normalizeSpaces(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
}

function trimBodyToLimit(variant: CopyVariant, maxLength: number): string {
    const normalizedBody = normalizeSpaces(variant.body);
    const staticLength = `${normalizeSpaces(variant.headline)}  ${normalizeSpaces(variant.cta)}`.length;
    const remaining = Math.max(maxLength - staticLength, 0);
    if (normalizedBody.length <= remaining) {
        return normalizedBody;
    }
    if (remaining <= 3) {
        return ''.padEnd(remaining, '.');
    }
    return `${normalizedBody.slice(0, remaining - 3).trimEnd()}...`;
}

export function formatVariantForChannel(
    variant: CopyVariant,
    policy: CopyPolicy,
    overrides?: import('@core/types').ChannelStyleOverride[]
): CopyVariant {
    let maxLength = policy.maxLength[variant.channel];
    
    // W5: Use Style Studio channel overrides if they exist
    const override = overrides?.find(o => o.channel === variant.channel);
    if (override && typeof override.maxLength === 'number') {
        maxLength = override.maxLength;
    }

    if (typeof maxLength !== 'number') {
        throw new Error('CHANNEL_UNSUPPORTED');
    }

    const normalized: CopyVariant = {
        ...variant,
        headline: normalizeSpaces(variant.headline),
        body: normalizeSpaces(variant.body),
        cta: normalizeSpaces(variant.cta),
        warnings: variant.warnings ? [...variant.warnings] : [],
    };

    if (countVariantCharacters(normalized) <= maxLength) {
        return normalized;
    }

    normalized.warnings!.push(`Truncated: Exceeded channel max length of ${maxLength}.`);

    return {
        ...normalized,
        body: trimBodyToLimit(normalized, maxLength),
    };
}

export function formatChannelVariantSet(
    set: ChannelVariantSet,
    policy: CopyPolicy,
    overrides?: import('@core/types').ChannelStyleOverride[]
): ChannelVariantSet {
    return {
        ...set,
        variants: set.variants.map((variant) => formatVariantForChannel(variant, policy, overrides)),
    };
}

