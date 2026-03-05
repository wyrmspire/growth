import type {
    DomainEvent,
    EntityId,
    VariantPerformanceRow,
    ChannelName,
} from '@core/types';

const NUMERIC_VARIANT_FIELDS = ['impressions', 'clicks', 'conversions', 'score'] as const;

// ─── Error helper ─────────────────────────────────────────────────
function variantError(message: string): never {
    throw { code: 'VARIANT_METRIC_INVALID', message, module: 'analytics' };
}

// ─── Public API ───────────────────────────────────────────────────

/**
 * Compare copy variant outcomes from the domain event stream.
 *
 * Relevant events: any event whose payload contains a `variantId`,
 * `channel`, and numeric performance fields (`impressions`, `clicks`,
 * `conversions`, `score`).
 *
 * Invariants (from contract):
 * - Pure function — no mutations, no side effects.
 * - Same input events → same output.
 *
 * Errors: VARIANT_METRIC_INVALID when a present metric field is non-numeric
 *         or required fields are missing.
 */
export function projectVariantPerformance(events: DomainEvent[]): VariantPerformanceRow[] {
    // Collect events that carry variant performance data
    const variantEvents = events.filter(
        e =>
            typeof e.payload.variantId === 'string' &&
            typeof e.payload.channel === 'string',
    );

    // Validate numeric fields
    for (const event of variantEvents) {
        for (const field of NUMERIC_VARIANT_FIELDS) {
            const val = event.payload[field];
            if (val !== undefined && typeof val !== 'number') {
                variantError(`Event "${event.id}" has non-numeric "${field}" field.`);
            }
        }
    }

    return variantEvents.map(event => {
        const variantId = event.payload.variantId as EntityId;
        const channel = event.payload.channel as ChannelName;
        const impressions = (event.payload.impressions as number | undefined) ?? 0;
        const clicks = (event.payload.clicks as number | undefined) ?? 0;
        const conversions = (event.payload.conversions as number | undefined) ?? 0;
        const score = (event.payload.score as number | undefined) ?? 0;

        return { variantId, channel, impressions, clicks, conversions, score };
    });
}
