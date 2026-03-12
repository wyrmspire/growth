import type {
    DomainEvent,
    EntityId,
    AttributionSnapshot,
    ConversionFunnelRow,
    VariantPerformanceRow,
} from '@core/types';
import { projectAttribution } from './attribution';
import { projectFunnelConversion } from './funnel';
import { projectVariantPerformance } from './variants';

// ─── Read Model Type ──────────────────────────────────────────────

export interface LearningEngagementSummary {
    totalPageViews: number;
    uniquePages: string[];
    pageViews: Array<{ pageId: string; views: number }>;
    actions: Array<{ action: string; count: number }>;
}

export interface CampaignDashboardReadModel {
    attribution: AttributionSnapshot;
    funnel: ConversionFunnelRow[];
    variants: VariantPerformanceRow[];
    learning: LearningEngagementSummary;
}

// ─── Public API ───────────────────────────────────────────────────


function projectLearningEngagement(events: DomainEvent[]): LearningEngagementSummary {
    const pageCounts = new Map<string, number>();
    const actionCounts = new Map<string, number>();

    for (const event of events) {
        if (event.name === 'LearningPageViewed') {
            const pageId = typeof event.payload.pageId === 'string' ? event.payload.pageId : 'unknown';
            pageCounts.set(pageId, (pageCounts.get(pageId) || 0) + 1);
        }
        if (event.name === 'LearningActionTracked') {
            const action = typeof event.payload.action === 'string' ? event.payload.action : 'unknown';
            actionCounts.set(action, (actionCounts.get(action) || 0) + 1);
        }
    }

    return {
        totalPageViews: [...pageCounts.values()].reduce((sum, count) => sum + count, 0),
        uniquePages: [...pageCounts.keys()],
        pageViews: [...pageCounts.entries()].map(([pageId, views]) => ({ pageId, views })).sort((a, b) => b.views - a.views || a.pageId.localeCompare(b.pageId)),
        actions: [...actionCounts.entries()].map(([action, count]) => ({ action, count })).sort((a, b) => b.count - a.count || a.action.localeCompare(b.action)),
    };
}


/**
 * Aggregate all analytics projections into a single campaign dashboard
 * read model.
 *
 * - `attribution` is always computed from the full event stream.
 * - `funnel` is populated when `planId` is provided and matching events exist;
 *   otherwise an empty array is returned.
 * - `variants` are populated when variant-metric events are present in the
 *   stream; otherwise an empty array is returned.
 *
 * Invariants (from contract):
 * - Pure function — no mutations, no side effects.
 * - Same input events → same output.
 */
export function campaignDashboardReadModel(
    events: DomainEvent[],
    planId?: EntityId,
): CampaignDashboardReadModel {
    const attribution = projectAttribution(events);

    let funnel: ConversionFunnelRow[] = [];
    if (planId !== undefined) {
        try {
            funnel = projectFunnelConversion(events, planId);
        } catch {
            // No matching funnel events — leave funnel empty
            funnel = [];
        }
    }

    const variants = projectVariantPerformance(events);
    const learning = projectLearningEngagement(events);

    return { attribution, funnel, variants, learning };
}
