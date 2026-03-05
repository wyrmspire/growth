import type {
    DomainEvent,
    EntityId,
    ConversionFunnelRow,
    FunnelStageName,
} from '@core/types';

// ─── Stage order (deterministic) ──────────────────────────────────
const STAGE_ORDER: FunnelStageName[] = ['awareness', 'consideration', 'decision'];

// ─── Error helper ─────────────────────────────────────────────────
function funnelError(message: string): never {
    throw { code: 'FUNNEL_PLAN_UNKNOWN', message, module: 'analytics' };
}

// ─── Public API ───────────────────────────────────────────────────

/**
 * Produce per-stage conversion rates for a given funnel plan from
 * the domain event stream.
 *
 * Relevant events: any event whose payload contains a `planId` that
 * matches the requested `planId`, along with `stage`, `entered`, and
 * `converted` fields.
 *
 * Invariants (from contract):
 * - Pure function — no mutations, no side effects.
 * - Returns rows in awareness → consideration → decision order.
 *
 * Errors: FUNNEL_PLAN_UNKNOWN when no events for the given planId exist.
 */
export function projectFunnelConversion(
    events: DomainEvent[],
    planId: EntityId,
): ConversionFunnelRow[] {
    // Collect events that carry funnel stage conversion data for this plan
    const planEvents = events.filter(
        e =>
            e.payload.planId === planId &&
            typeof e.payload.stage === 'string' &&
            typeof e.payload.entered === 'number' &&
            typeof e.payload.converted === 'number',
    );

    if (planEvents.length === 0) {
        funnelError(`No funnel conversion events found for planId "${planId}".`);
    }

    // Accumulate entered/converted per stage
    const stageMap = new Map<FunnelStageName, { entered: number; converted: number }>();

    for (const event of planEvents) {
        const stage = event.payload.stage as FunnelStageName;
        const entered = event.payload.entered as number;
        const converted = event.payload.converted as number;

        if (!stageMap.has(stage)) {
            stageMap.set(stage, { entered: 0, converted: 0 });
        }
        const acc = stageMap.get(stage)!;
        acc.entered += entered;
        acc.converted += converted;
    }

    // Emit rows in deterministic stage order, skipping stages with no data
    return STAGE_ORDER.filter(stage => stageMap.has(stage)).map(stage => {
        const { entered, converted } = stageMap.get(stage)!;
        const rate = entered > 0 ? Math.round((converted / entered) * 1000) / 10 : 0;
        return { stage, entered, converted, rate };
    });
}
