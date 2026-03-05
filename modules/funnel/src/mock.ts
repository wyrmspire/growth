import type {
    CampaignBrief, FunnelPlan, FunnelStage, ChannelName, FunnelStageName,
} from '../../core/src/types';
import { newEntityId } from '../../core/src/id';

const STAGE_ORDER: FunnelStageName[] = ['awareness', 'consideration', 'decision'];

const DEFAULT_CTAS: Record<FunnelStageName, string[]> = {
    awareness: ['Learn More', 'Watch Demo'],
    consideration: ['Download Guide', 'Book a Call'],
    decision: ['Start Free Trial', 'Buy Now'],
};

export function createFunnelPlan(brief: CampaignBrief): FunnelPlan {
    const stages: FunnelStage[] = STAGE_ORDER.map(name => ({
        name,
        channels: [...brief.channels],
        ctas: DEFAULT_CTAS[name],
    }));

    return {
        id: newEntityId('plan'),
        briefId: brief.id,
        stages,
    };
}

export function validateFunnelPlan(plan: FunnelPlan): { valid: boolean; gaps: string[] } {
    const gaps: string[] = [];

    for (const stage of plan.stages) {
        if (stage.ctas.length === 0) {
            gaps.push(`Stage "${stage.name}" has no CTAs.`);
        }
        if (stage.channels.length === 0) {
            gaps.push(`Stage "${stage.name}" has no channels.`);
        }
    }

    const stageNames = plan.stages.map(s => s.name);
    for (const required of STAGE_ORDER) {
        if (!stageNames.includes(required)) {
            gaps.push(`Missing required stage: "${required}".`);
        }
    }

    return { valid: gaps.length === 0, gaps };
}
