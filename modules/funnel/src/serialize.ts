/**
 * FUN-B2 — Funnel Plan Serializer
 * Serializes and deserializes FunnelPlan for workflow handoff payloads.
 * CONTRACT: modules/funnel/CONTRACT.md
 */

import type { FunnelPlan, FunnelStage, EntityId } from '../../core/src/types';

// ─── Payload Types ────────────────────────────────────────────────────────

export interface FunnelStagePayload {
    name: string;
    channels: string[];
    ctas: string[];
}

export interface FunnelPlanPayload {
    planId: string;
    briefId: string;
    stages: FunnelStagePayload[];
    serializedAt: string;
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Convert a FunnelPlan to a JSON-serializable workflow handoff payload.
 * The payload is a plain object with no branded types or non-serializable values.
 */
export function serializeFunnelPlan(plan: FunnelPlan): FunnelPlanPayload {
    return {
        planId: plan.id as string,
        briefId: plan.briefId as string,
        stages: plan.stages.map(stage => ({
            name: stage.name as string,
            channels: [...stage.channels],
            ctas: [...stage.ctas],
        })),
        serializedAt: new Date().toISOString(),
    };
}

/**
 * Reconstruct a FunnelPlan from a workflow handoff payload.
 * Stage names are validated at runtime before the type cast.
 */
export function deserializeFunnelPlan(payload: FunnelPlanPayload): FunnelPlan {
    const validStageNames: string[] = ['awareness', 'consideration', 'decision'];

    return {
        id: payload.planId as EntityId,
        briefId: payload.briefId as EntityId,
        stages: payload.stages.map(s => {
            if (!validStageNames.includes(s.name)) {
                throw new Error(
                    `FUNNEL_STAGE_INVALID: Unknown stage name "${s.name}" in funnel plan payload.`,
                );
            }
            return {
                name: s.name as FunnelStage['name'],
                channels: [...s.channels] as FunnelStage['channels'],
                ctas: [...s.ctas],
            };
        }),
    };
}
