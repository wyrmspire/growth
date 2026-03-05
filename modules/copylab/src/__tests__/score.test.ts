import { describe, expect, test } from 'vitest';
import type { ChannelVariantSet, EntityId } from '@core/types';
import { scoreVariants } from '../score';

const SET: ChannelVariantSet = {
    briefId: 'brief_000001' as EntityId,
    policyVersion: '1.0.0',
    variants: [
        {
            id: 'var_000001' as EntityId,
            channel: 'meta',
            stage: 'awareness',
            headline: 'A better way to run campaigns',
            body: 'Get clearer execution and fewer dropped tasks.',
            cta: 'Learn more',
            policyVersion: '1.0.0',
        },
        {
            id: 'var_000002' as EntityId,
            channel: 'linkedin',
            stage: 'decision',
            headline: 'Guaranteed growth in 24h',
            body: 'risk-free results for every campaign',
            cta: 'Start now',
            policyVersion: '1.0.0',
        },
    ],
};

describe('scoreVariants()', () => {
    test('returns one score per variant', () => {
        const scores = scoreVariants(SET);
        expect(scores).toHaveLength(SET.variants.length);
    });

    test('is deterministic for same input', () => {
        const a = scoreVariants(SET);
        const b = scoreVariants(SET);
        expect(a).toEqual(b);
    });

    test('applies policy penalties for banned terms', () => {
        const scores = scoreVariants(SET);
        const low = scores.find((s) => s.variantId === ('var_000002' as EntityId));
        const high = scores.find((s) => s.variantId === ('var_000001' as EntityId));
        expect(low?.score).toBeLessThan(high?.score ?? 0);
    });

    test('throws SCORE_INPUT_INVALID for malformed set', () => {
        expect(() => scoreVariants(null as unknown as ChannelVariantSet)).toThrow('SCORE_INPUT_INVALID');
    });
});

