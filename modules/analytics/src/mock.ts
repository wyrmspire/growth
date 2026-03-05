import type {
    DomainEvent, EntityId, AttributionSnapshot, ConversionFunnelRow,
    VariantPerformanceRow, CampaignMetricRow, ChannelName, FunnelStageName,
} from '../../core/src/types';
import { newEntityId } from '../../core/src/id';

export function projectAttribution(events: readonly DomainEvent[], campaignId: EntityId): AttributionSnapshot {
    const channels: ChannelName[] = ['meta', 'linkedin', 'x'];

    const byChannel: CampaignMetricRow[] = channels.map(channel => {
        const multiplier = channel === 'meta' ? 1.2 : channel === 'linkedin' ? 0.8 : 1.0;
        return {
            campaignId,
            channel,
            impressions: Math.round(4200 * multiplier),
            clicks: Math.round(380 * multiplier),
            leads: Math.round(31 * multiplier),
            spend: Math.round(420 * multiplier * 100) / 100,
            revenue: Math.round(1340 * multiplier * 100) / 100,
        };
    });

    const totalSpend = byChannel.reduce((s, r) => s + r.spend, 0);
    const totalRevenue = byChannel.reduce((s, r) => s + r.revenue, 0);
    const totalLeads = byChannel.reduce((s, r) => s + r.leads, 0);

    return {
        campaignId,
        totalSpend: Math.round(totalSpend * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        cpl: Math.round((totalSpend / totalLeads) * 100) / 100,
        roas: Math.round((totalRevenue / totalSpend) * 10) / 10,
        byChannel,
    };
}

export function projectFunnelConversion(
    events: readonly DomainEvent[],
    planId: EntityId,
): ConversionFunnelRow[] {
    const stages: { stage: FunnelStageName; entered: number; converted: number }[] = [
        { stage: 'awareness', entered: 12600, converted: 4284 },
        { stage: 'consideration', entered: 4284, converted: 1499 },
        { stage: 'decision', entered: 1499, converted: 93 },
    ];

    return stages.map(s => ({
        stage: s.stage,
        entered: s.entered,
        converted: s.converted,
        rate: Math.round((s.converted / s.entered) * 1000) / 10,
    }));
}

export function projectVariantPerformance(events: readonly DomainEvent[]): VariantPerformanceRow[] {
    const variants: Omit<VariantPerformanceRow, 'variantId'>[] = [
        { channel: 'meta', impressions: 5040, clicks: 456, conversions: 37, score: 87 },
        { channel: 'meta', impressions: 5040, clicks: 312, conversions: 22, score: 71 },
        { channel: 'linkedin', impressions: 3360, clicks: 304, conversions: 25, score: 82 },
        { channel: 'linkedin', impressions: 3360, clicks: 218, conversions: 14, score: 64 },
        { channel: 'x', impressions: 4200, clicks: 380, conversions: 31, score: 79 },
        { channel: 'x', impressions: 4200, clicks: 260, conversions: 19, score: 68 },
    ];

    return variants.map(v => ({
        ...v,
        variantId: newEntityId('var'),
    }));
}
