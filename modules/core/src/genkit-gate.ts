/**
 * BACK-8 — Genkit Evaluation Checklist + Human-Review Gate
 *
 * All AI flow outputs must pass through this gate before any downstream
 * action is permitted. This is a core project invariant — see PROJECT_RULES.md #17
 * and MVP_SCOPE.md "Must Not" section.
 *
 * Usage:
 *   const gate = evaluateFlowOutput(output, { flowName: 'copyCoachFlow' });
 *   if (!gate.passed) throw new Error(gate.blockedReason);
 */

export interface EvaluationChecklist {
    quality: boolean;    // Output is specific, complete, and actionable
    safety: boolean;     // No harmful, manipulative, or misleading content
    tone: boolean;       // Tone is beginner-friendly and non-salesy
    factuality: boolean; // Claims are grounded in input data, not fabricated
}

export interface FlowOutputWithGate {
    humanReviewRequired: boolean;
    evaluationChecklist: EvaluationChecklist;
    // Allow any other fields
    [key: string]: unknown;
}

export interface GateResult {
    passed: boolean;
    checklist: EvaluationChecklist;
    failedChecks: (keyof EvaluationChecklist)[];
    blockedReason?: string;
    reviewInstruction: string;
}

/**
 * Evaluate an AI flow output against the checklist and enforce human-review gate.
 *
 * Rules:
 * 1. humanReviewRequired must be true.
 * 2. All checklist items must be true for the gate to PASS.
 * 3. Even if gate passes, the review instruction is always included —
 *    NO AI output goes live without explicit human sign-off.
 */
export function evaluateFlowOutput(
    output: FlowOutputWithGate,
    context: { flowName: string; operatorNote?: string },
): GateResult {
    // Rule 1: humanReviewRequired must be set
    if (output.humanReviewRequired !== true) {
        return {
            passed: false,
            checklist: output.evaluationChecklist,
            failedChecks: [],
            blockedReason: `Flow "${context.flowName}" output is missing humanReviewRequired=true. Cannot proceed.`,
            reviewInstruction: 'AI output cannot be used — human review flag is missing.',
        };
    }

    const checklist = output.evaluationChecklist;
    const failedChecks = (Object.keys(checklist) as (keyof EvaluationChecklist)[]).filter(
        (k) => !checklist[k],
    );

    const passed = failedChecks.length === 0;

    return {
        passed,
        checklist,
        failedChecks,
        blockedReason: passed
            ? undefined
            : `Flow "${context.flowName}" failed checklist items: ${failedChecks.join(', ')}. Human review required before any action.`,
        reviewInstruction: passed
            ? `Flow "${context.flowName}" passed evaluation. A human reviewer must still approve this output before it is used in any campaign action.${context.operatorNote ? ` Operator note: ${context.operatorNote}` : ''}`
            : `Flow "${context.flowName}" output is BLOCKED pending checklist correction and human review.`,
    };
}

/**
 * Assert that a flow output has passed the gate — throws if not.
 * Use this in publishing and comments send paths.
 */
export function assertFlowOutputApproved(
    output: FlowOutputWithGate,
    flowName: string,
): void {
    const gate = evaluateFlowOutput(output, { flowName });
    if (!gate.passed) {
        throw new Error(
            gate.blockedReason ??
            `AI output from "${flowName}" has not been approved for use.`,
        );
    }
}

/**
 * Type guard: checks if an object has the minimum gate fields.
 */
export function hasGateFields(obj: unknown): obj is FlowOutputWithGate {
    if (typeof obj !== 'object' || obj === null) return false;
    const o = obj as Record<string, unknown>;
    return (
        typeof o.humanReviewRequired === 'boolean' &&
        typeof o.evaluationChecklist === 'object' &&
        o.evaluationChecklist !== null
    );
}

/**
 * Create an empty/passing checklist (for use in mock handlers).
 */
export function passingChecklist(): EvaluationChecklist {
    return { quality: true, safety: true, tone: true, factuality: true };
}

/**
 * Summarize a gate result for display in the UI.
 */
export function summarizeGate(gate: GateResult): string {
    if (!gate.passed) {
        return `🔴 BLOCKED — ${gate.failedChecks.join(', ')} check(s) failed. ${gate.blockedReason}`;
    }
    return `🟡 PENDING HUMAN REVIEW — All checks passed. ${gate.reviewInstruction}`;
}
