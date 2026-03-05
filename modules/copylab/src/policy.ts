import { z } from 'zod';
import type { ChannelName, CopyPolicy } from '@core/types';

export const COPY_POLICY_VERSION = '1.0.0';

export const COPY_POLICY_SCHEMA = z.object({
    id: z.string().min(1),
    version: z.string().min(1),
    maxLength: z.object({
        meta: z.number().int().positive(),
        linkedin: z.number().int().positive(),
        x: z.number().int().positive(),
        email: z.number().int().positive(),
    }),
    bannedTerms: z.array(z.string().min(1)),
});

const DEFAULT_POLICY_SET: Record<string, CopyPolicy> = {
    [COPY_POLICY_VERSION]: {
        id: 'copy-policy-default',
        version: COPY_POLICY_VERSION,
        maxLength: {
            meta: 280,
            linkedin: 700,
            x: 280,
            email: 2000,
        },
        bannedTerms: ['guaranteed', 'risk-free', 'act now'],
    },
};

export function getDefaultPolicy(): CopyPolicy {
    const policy = DEFAULT_POLICY_SET[COPY_POLICY_VERSION];
    return {
        ...policy,
        maxLength: { ...policy.maxLength },
        bannedTerms: [...policy.bannedTerms],
    };
}

export function getPolicyByVersion(version: string): CopyPolicy | null {
    const policy = DEFAULT_POLICY_SET[version];
    if (!policy) return null;
    return {
        ...policy,
        maxLength: { ...policy.maxLength },
        bannedTerms: [...policy.bannedTerms],
    };
}

export function getChannelMaxLength(channel: ChannelName, policy: CopyPolicy = getDefaultPolicy()): number {
    return policy.maxLength[channel];
}

