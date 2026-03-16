import type { CampaignBrief, FunnelPlan, CopyVariant, ChannelVariantSet } from '@core/types';
import { newEntityId } from '@core/id';
import { formatVariantForChannel } from './format';
import { getDefaultPolicy, getPolicyByVersion } from './policy';

const STAGE_HEADLINES: Record<'awareness' | 'consideration' | 'decision', string> = {
    awareness: 'A simpler way to grow',
    consideration: 'See how it works in practice',
    decision: 'Ready to get started?',
};

interface GenerateVariantsOptions {
    policyVersion?: string;
    channelOverrides?: import('@core/types').ChannelStyleOverride[];
}

export interface CopyRequest {
    brief: CampaignBrief;
    plan: FunnelPlan;
    policyVersion?: string;
    channelOverrides?: import('@core/types').ChannelStyleOverride[];
}

export function generateVariants(request: CopyRequest): ChannelVariantSet;
export function generateVariants(brief: CampaignBrief, plan: FunnelPlan, options?: GenerateVariantsOptions): ChannelVariantSet;
export function generateVariants(
    arg1: CopyRequest | CampaignBrief,
    arg2?: FunnelPlan,
    arg3: GenerateVariantsOptions = {},
): ChannelVariantSet {
    const brief = 'brief' in arg1 ? arg1.brief : arg1;
    const plan = 'plan' in arg1 ? arg1.plan : arg2;
    const options = 'policyVersion' in arg1 
        ? { policyVersion: arg1.policyVersion, channelOverrides: arg1.channelOverrides } 
        : arg3;

    if (!plan) {
        throw new Error('COPY_INPUT_INVALID');
    }

    const policy = options.policyVersion
        ? getPolicyByVersion(options.policyVersion)
        : getDefaultPolicy();

    if (!policy) {
        throw new Error('COPY_POLICY_VIOLATION');
    }

    const variants: CopyVariant[] = [];

    for (const stage of plan.stages) {
        const ctaFallback = stage.name === 'decision' ? 'Start now' : 'Learn more';
        const cta = stage.ctas[0] ?? ctaFallback;

        for (const channel of stage.channels) {
            const draft: CopyVariant = {
                id: newEntityId('var'),
                channel,
                stage: stage.name,
                headline: `${brief.offerName} — ${STAGE_HEADLINES[stage.name]}`,
                body: `Built for ${brief.audience}, this ${stage.name} message supports ${brief.goals[0] ?? 'your campaign goals'} with clear next steps.`,
                cta,
                policyVersion: policy.version,
            };

            variants.push(formatVariantForChannel(draft, policy, options.channelOverrides));
        }
    }

    return {
        briefId: brief.id,
        policyVersion: policy.version,
        variants,
    };
}
