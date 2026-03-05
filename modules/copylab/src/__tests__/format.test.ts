import { describe, expect, test } from 'vitest';
import type { CopyVariant, EntityId } from '@core/types';
import { formatVariantForChannel, countVariantCharacters } from '../format';
import { getDefaultPolicy } from '../policy';

const policy = getDefaultPolicy();

describe('formatVariantForChannel()', () => {
    test('normalizes repeated whitespace', () => {
        const input: CopyVariant = {
            id: 'var_000001' as EntityId,
            channel: 'meta',
            stage: 'awareness',
            headline: 'Hello   world',
            body: 'A   lot   of   spaces',
            cta: 'Learn   more',
            policyVersion: '1.0.0',
        };

        const formatted = formatVariantForChannel(input, policy);
        expect(formatted.headline).toBe('Hello world');
        expect(formatted.body).toBe('A lot of spaces');
        expect(formatted.cta).toBe('Learn more');
    });

    test('truncates body when over channel max length', () => {
        const input: CopyVariant = {
            id: 'var_000002' as EntityId,
            channel: 'x',
            stage: 'decision',
            headline: 'Headline',
            body: 'a'.repeat(1000),
            cta: 'Start now',
            policyVersion: '1.0.0',
        };

        const formatted = formatVariantForChannel(input, policy);
        expect(countVariantCharacters(formatted)).toBeLessThanOrEqual(policy.maxLength.x);
    });

    test('throws CHANNEL_UNSUPPORTED if channel is not in policy map', () => {
        const input: CopyVariant = {
            id: 'var_000003' as EntityId,
            channel: 'meta',
            stage: 'awareness',
            headline: 'Headline',
            body: 'Body',
            cta: 'CTA',
            policyVersion: '1.0.0',
        };

        const invalidPolicy = {
            ...policy,
            maxLength: { ...policy.maxLength, meta: undefined as unknown as number },
        };

        expect(() => formatVariantForChannel(input, invalidPolicy)).toThrow('CHANNEL_UNSUPPORTED');
    });
});

