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
        instagram: z.number().int().positive(),
        reddit: z.number().int().positive(),
        tiktok: z.number().int().positive(),
        youtube: z.number().int().positive(),
        substack: z.number().int().positive(),
        threads: z.number().int().positive(),
        facebook: z.number().int().positive(),
        pinterest: z.number().int().positive(),
    }),
    bannedTerms: z.array(z.string().min(1)),
});

const DEFAULT_POLICY_SET: Record<string, CopyPolicy> = {
    [COPY_POLICY_VERSION]: {
        id: 'copy-policy-default',
        version: COPY_POLICY_VERSION,
        maxLength: {
            meta: 2200,
            linkedin: 3000,
            x: 280,
            email: 5000,
            instagram: 2200,
            reddit: 10000,
            tiktok: 2200,
            youtube: 5000,
            substack: 50000,
            threads: 500,
            facebook: 2200,
            pinterest: 500,
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

