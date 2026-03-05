import { describe, expect, test } from 'vitest';
import { COPY_POLICY_SCHEMA, COPY_POLICY_VERSION, getDefaultPolicy, getPolicyByVersion } from '../policy';

describe('copy policy', () => {
    test('default policy has version and channel length map', () => {
        const policy = getDefaultPolicy();
        expect(policy.version).toBe(COPY_POLICY_VERSION);
        expect(policy.maxLength.meta).toBeGreaterThan(0);
        expect(policy.maxLength.linkedin).toBeGreaterThan(0);
        expect(policy.maxLength.x).toBeGreaterThan(0);
        expect(policy.maxLength.email).toBeGreaterThan(0);
    });

    test('default policy validates against schema', () => {
        const parsed = COPY_POLICY_SCHEMA.safeParse(getDefaultPolicy());
        expect(parsed.success).toBe(true);
    });

    test('getPolicyByVersion returns null for unknown version', () => {
        expect(getPolicyByVersion('9.9.9')).toBeNull();
    });

    test('returned policy objects are copies', () => {
        const policy = getDefaultPolicy();
        policy.bannedTerms.push('forbidden');
        const fresh = getDefaultPolicy();
        expect(fresh.bannedTerms).not.toContain('forbidden');
    });
});

