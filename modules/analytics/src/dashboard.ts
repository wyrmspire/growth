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

export interface CampaignDashboardReadModel {
    attribution: AttributionSnapshot;
    funnel: ConversionFunnelRow[];
    variants: VariantPerformanceRow[];
}

// ─── Public API ───────────────────────────────────────────────────

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

    return { attribution, funnel, variants };
}
