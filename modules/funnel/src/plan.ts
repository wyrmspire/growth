import type {
    CampaignBrief,
    FunnelPlan,
    FunnelStage,
    FunnelStageName,
    AppError,
} from '../../core/src/types';
import { newEntityId } from '../../core/src/id';
import { getCtasForStage } from './cta-map';

// ─── Stage Order ───────────────────────────────────────────────────────────

/**
 * Deterministic stage ordering. The funnel contract requires stage order
 * to be deterministic (no random reordering).
 */
const STAGE_ORDER: FunnelStageName[] = ['awareness', 'consideration', 'decision'];

// ─── Result Type ───────────────────────────────────────────────────────────

export interface FunnelPlanResult {
    ok: boolean;
    plan?: FunnelPlan;
    error?: AppError;
}

// ─── Error Helper ──────────────────────────────────────────────────────────

function makeError(code: string, message: string): AppError {
    return { code, message, module: 'funnel' };
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Build a funnel plan from a campaign brief.
 *
 * Output structure:
 * - Stages are ordered: awareness → consideration → decision (deterministic).
 * - Each stage inherits the brief's channels.
 * - Each stage's CTAs come from the CTA_MAP for each channel (merged, de-duped).
 *
 * Invariants (from contract):
 * - Stage order is deterministic.
 * - Every stage has at least one CTA.
 *
 * Returns a result object: { ok, plan } on success or { ok, error } on failure.
 */
export function createFunnelPlan(brief: CampaignBrief): FunnelPlanResult {
    // Guard: null-ish or malformed brief
    if (!brief || typeof brief !== 'object') {
        return {
            ok: false,
            error: makeError('FUNNEL_STAGE_INVALID', 'Brief is missing or malformed.'),
        };
    }

    // Guard: empty channels list
    if (!brief.channels || brief.channels.length === 0) {
        return {
            ok: false,
            error: makeError('CTA_MISSING', 'Brief must specify at least one channel.'),
        };
    }

    try {
        const stages: FunnelStage[] = STAGE_ORDER.map((stageName) => {
            const ctas = getCtasForStage(stageName, brief.channels);

            // Contract invariant: every stage must have at least one CTA.
            if (ctas.length === 0) {
                throw Object.assign(
                    new Error(`CTA_MISSING: No CTAs resolved for stage "${stageName}".`),
                    makeError('CTA_MISSING', `No CTAs resolved for stage "${stageName}".`),
                );
            }

            const stage: FunnelStage = {
                name: stageName,
                channels: [...brief.channels],
                ctas,
            };

            return stage;
        });

        const plan: FunnelPlan = {
            id: newEntityId('plan'),
            briefId: brief.id,
            stages,
        };

        return { ok: true, plan };
    } catch (err: unknown) {
        if (err && typeof err === 'object' && 'code' in err && 'module' in err) {
            return { ok: false, error: err as AppError };
        }
        return {
            ok: false,
            error: makeError('FUNNEL_STAGE_INVALID', String(err)),
        };
    }
}
