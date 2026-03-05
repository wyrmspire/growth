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

export function formatVariantForChannel(variant: CopyVariant, policy: CopyPolicy): CopyVariant {
    const maxLength = policy.maxLength[variant.channel];

    if (typeof maxLength !== 'number') {
        throw new Error('CHANNEL_UNSUPPORTED');
    }

    const normalized: CopyVariant = {
        ...variant,
        headline: normalizeSpaces(variant.headline),
        body: normalizeSpaces(variant.body),
        cta: normalizeSpaces(variant.cta),
    };

    if (countVariantCharacters(normalized) <= maxLength) {
        return normalized;
    }

    return {
        ...normalized,
        body: trimBodyToLimit(normalized, maxLength),
    };
}

export function formatChannelVariantSet(set: ChannelVariantSet, policy: CopyPolicy): ChannelVariantSet {
    return {
        ...set,
        variants: set.variants.map((variant) => formatVariantForChannel(variant, policy)),
    };
}

