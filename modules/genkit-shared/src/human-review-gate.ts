/**
 * human-review-gate.ts  (BACK-8)
 * Enforces the "no AI output goes live without human approval" rule.
 *
 * This module is the last gate every AI coaching output must pass through
 * before it can be used by the operator. It does NOT approve anything —
 * only a human can do that.
 *
 * Usage pattern in each flow:
 *   1. Flow generates AI output.
 *   2. evaluateOutput() checks quality/safety/tone/factuality.
 *   3. createReviewItem() wraps the output + eval report.
 *   4. The review item is returned to the caller (UI / workflow).
 *   5. The operator reviews and calls approveReviewItem() or rejectReviewItem().
 *   6. Only APPROVED items may proceed downstream (copy, replies, strategy).
 */

import { evaluateOutput, type EvalReport } from './evaluator.js';

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'needs_revision';

export interface ReviewItem<T = unknown> {
    reviewId: string;
    flowName: string;
    status: ReviewStatus;
    evalReport: EvalReport;
    payload: T;           // the raw AI-generated data
    createdAt: string;
    decidedAt?: string;
    decisionNote?: string;
}

let _sequence = 0;
function newReviewId(flowName: string): string {
    return `rev_${flowName}_${Date.now()}_${++_sequence}`;
}

/**
 * Wraps an AI output in a pending review item.
 * If the evaluator check fails, the item is still created as pending —
 * but the evalReport.passed flag makes the failure visible to the reviewer.
 */
export function createReviewItem<T>(
    flowName: string,
    rawOutputText: string,
    payload: T,
): ReviewItem<T> {
    const evalReport = evaluateOutput(rawOutputText, flowName);
    return {
        reviewId: newReviewId(flowName),
        flowName,
        status: 'pending',
        evalReport,
        payload,
        createdAt: new Date().toISOString(),
    };
}

/**
 * Human approves the review item.
 * The caller is responsible for persisting the updated item.
 */
export function approveReviewItem<T>(
    item: ReviewItem<T>,
    note?: string,
): ReviewItem<T> {
    return {
        ...item,
        status: 'approved',
        decidedAt: new Date().toISOString(),
        decisionNote: note ?? 'Approved by operator.',
    };
}

/**
 * Human rejects the review item.
 */
export function rejectReviewItem<T>(
    item: ReviewItem<T>,
    note: string,
): ReviewItem<T> {
    return {
        ...item,
        status: 'rejected',
        decidedAt: new Date().toISOString(),
        decisionNote: note,
    };
}

/**
 * Hard gate — throws if the item is not in approved state.
 * Call this before any downstream action (publish, send reply, etc.).
 */
export function assertHumanApproved<T>(item: ReviewItem<T>): void {
    if (item.status !== 'approved') {
        throw new Error(
            `[HumanReviewGate] Output from "${item.flowName}" (${item.reviewId}) ` +
            `must be approved by a human before use. Current status: ${item.status}.`,
        );
    }
}

/**
 * Type guard — narrows to approved items without throwing.
 */
export function isApproved<T>(item: ReviewItem<T>): boolean {
    return item.status === 'approved';
}
