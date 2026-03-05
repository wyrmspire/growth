import type {
    DomainEvent,
    EntityId,
    AttributionSnapshot,
    CampaignMetricRow,
    ChannelName,
} from '@core/types';
import { newEntityId } from '@core/id';

// ─── Valid channels ────────────────────────────────────────────────
const VALID_CHANNELS = new Set<string>(['meta', 'linkedin', 'x', 'email']);

const NUMERIC_METRIC_FIELDS = ['impressions', 'clicks', 'leads', 'spend', 'revenue'] as const;

// ─── Error helper ─────────────────────────────────────────────────
function metricError(message: string): never {
    throw { code: 'METRIC_EVENT_INVALID', message, module: 'analytics' };
}

// ─── Public API ───────────────────────────────────────────────────

/**
 * Derive channel and campaign attribution metrics from a domain event stream.
 *
 * Relevant events: any event whose payload contains a `channel` field
 * alongside numeric metric fields (`impressions`, `clicks`, `leads`,
 * `spend`, `revenue`). The campaign ID is taken from the entityId of
 * the first metric-bearing event found.
 *
 * Invariants (from contract):
 * - Pure function — no mutations, no side effects.
 * - Same input events → same output.
 *
 * Errors: METRIC_EVENT_INVALID when a present metric field is non-numeric.
 */
export function projectAttribution(events: DomainEvent[]): AttributionSnapshot {
    // Collect events that carry channel-level metric data
    const metricEvents = events.filter(
        e => e.payload.channel !== undefined && VALID_CHANNELS.has(e.payload.channel as string),
    );

    // Validate that any present numeric fields are actually numbers
    for (const event of metricEvents) {
        for (const field of NUMERIC_METRIC_FIELDS) {
            const val = event.payload[field];
            if (val !== undefined && typeof val !== 'number') {
                metricError(`Event "${event.id}" has non-numeric "${field}" field.`);
            }
        }
    }

    // Determine campaignId — entityId of first metric event, or a generated fallback
    const campaignId: EntityId =
        metricEvents.length > 0
            ? metricEvents[0].entityId
            : events.length > 0
                ? events[0].entityId
                : newEntityId('camp');

    // Accumulate metrics per channel
    const channelMap = new Map<ChannelName, CampaignMetricRow>();

    for (const event of metricEvents) {
        const channel = event.payload.channel as ChannelName;
        if (!channelMap.has(channel)) {
            channelMap.set(channel, {
                campaignId,
                channel,
                impressions: 0,
                clicks: 0,
                leads: 0,
                spend: 0,
                revenue: 0,
            });
        }
        const row = channelMap.get(channel)!;
        row.impressions += (event.payload.impressions as number | undefined) ?? 0;
        row.clicks += (event.payload.clicks as number | undefined) ?? 0;
        row.leads += (event.payload.leads as number | undefined) ?? 0;
        row.spend += (event.payload.spend as number | undefined) ?? 0;
        row.revenue += (event.payload.revenue as number | undefined) ?? 0;
    }

    const byChannel = [...channelMap.values()];

    const totalSpend = round2(byChannel.reduce((s, r) => s + r.spend, 0));
    const totalRevenue = round2(byChannel.reduce((s, r) => s + r.revenue, 0));
    const totalLeads = byChannel.reduce((s, r) => s + r.leads, 0);

    const cpl = totalLeads > 0 ? round2(totalSpend / totalLeads) : 0;
    const roas = totalSpend > 0 ? round1(totalRevenue / totalSpend) : 0;

    return { campaignId, totalSpend, totalRevenue, cpl, roas, byChannel };
}

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

function round1(n: number): number {
    return Math.round(n * 10) / 10;
}
