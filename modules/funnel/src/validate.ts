/**
 * FUN-B1 — validateFunnelPlan()
 * Guards stage coverage and transition validity.
 * CONTRACT: modules/funnel/CONTRACT.md
 */

import type { FunnelPlan, FunnelStageName, ValidationResult, AppError } from '../../core/src/types';

// ─── Stage Order ──────────────────────────────────────────────────────────

const REQUIRED_STAGES: FunnelStageName[] = ['awareness', 'consideration', 'decision'];

/**
 * Valid forward transition: each stage may only be followed by the next one.
 * `null` means this is the terminal stage.
 */
const NEXT_STAGE: Record<FunnelStageName, FunnelStageName | null> = {
    awareness: 'consideration',
    consideration: 'decision',
    decision: null,
};

// ─── Error Helper ─────────────────────────────────────────────────────────

function makeError(code: string, message: string): AppError {
    return { code, message, module: 'funnel' };
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Validate a funnel plan for:
 * 1. Stage coverage — all three required stages must be present.
 * 2. Transition validity — stages must appear in awareness → consideration →
 *    decision order with no gaps or inversions.
 * 3. CTA presence — every stage must have at least one CTA.
 *
 * Errors: FUNNEL_GAP, FUNNEL_TRANSITION_INVALID
 */
export function validateFunnelPlan(plan: FunnelPlan): ValidationResult {
    if (!plan || !Array.isArray(plan.stages)) {
        return {
            valid: false,
            errors: [makeError('FUNNEL_GAP', 'Funnel plan is missing or has no stages array.')],
        };
    }

    const errors: AppError[] = [];
    const stageNames = plan.stages.map(s => s.name);

    // ── Coverage check ──────────────────────────────────────────────
    for (const required of REQUIRED_STAGES) {
        if (!stageNames.includes(required)) {
            errors.push(
                makeError(
                    'FUNNEL_GAP',
                    `Required stage "${required}" is missing from the funnel plan.`,
                ),
            );
        }
    }

    // ── Transition check ────────────────────────────────────────────
    for (let i = 0; i < plan.stages.length - 1; i++) {
        const current = plan.stages[i].name;
        const next = plan.stages[i + 1].name;
        const expectedNext = NEXT_STAGE[current];

        if (expectedNext !== next) {
            errors.push(
                makeError(
                    'FUNNEL_TRANSITION_INVALID',
                    `Invalid transition from "${current}" to "${next}". Expected "${expectedNext ?? 'nothing (terminal stage)'}".`,
                ),
            );
        }
    }

    // ── CTA presence check ─────────────────────────────────────────
    for (const stage of plan.stages) {
        if (!stage.ctas || stage.ctas.length === 0) {
            errors.push(
                makeError('FUNNEL_GAP', `Stage "${stage.name}" has no CTAs defined.`),
            );
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
