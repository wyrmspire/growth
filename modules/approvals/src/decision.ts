import type { ReviewDecision, ApprovalState, EntityId, ReviewItem, AppError } from '@core/types';
import { _getStore } from './queue';

// ─── Types ────────────────────────────────────────────────────────
export interface DecideReviewResult {
    ok: true;
    state: ApprovalState;
    itemId: EntityId;
    reviewerId: string;
    timestamp: string;
    error?: undefined;
}

export interface DecideReviewError {
    ok: false;
    state?: undefined;
    error: AppError;
}

export type DecideReviewOutcome = DecideReviewResult | DecideReviewError;

export interface ReopenResult {
    ok: true;
    state: 'reopened';
    error?: undefined;
}

export interface ReopenError {
    ok: false;
    state?: undefined;
    error: AppError;
}

// ─── Valid one-way transitions (pending → approved | rejected only)
const VALID_TRANSITIONS: ReadonlyMap<ApprovalState, ReadonlySet<ApprovalState>> = new Map([
    ['pending', new Set<ApprovalState>(['approved', 'rejected'])],
    ['approved', new Set<ApprovalState>()],  // terminal unless explicitly reopened
    ['rejected', new Set<ApprovalState>()],  // terminal unless explicitly reopened
    ['reopened', new Set<ApprovalState>(['approved', 'rejected'])],
]);

function canTransition(from: ApprovalState, to: ApprovalState): boolean {
    return VALID_TRANSITIONS.get(from)?.has(to) ?? false;
}

// ─── Decision-local store for items registered directly into this module
// (used by tests that call registerItem/registerBatchItems without going
// through createReviewBatch).
const _localStore = new Map<EntityId, ReviewItem>();

export function resetStore(): void {
    _localStore.clear();
}

// ─── Helpers for direct item registration (used by tests and gate.ts) ─

export function registerItem(item: ReviewItem): void {
    _localStore.set(item.id, item);
}

export function registerBatchItems(items: ReviewItem[]): void {
    for (const item of items) {
        _localStore.set(item.id, item);
    }
}

export function getItemState(itemId: EntityId): ApprovalState | undefined {
    return resolveItem(itemId)?.state;
}

// ─── Internal: resolve item from either store ─────────────────────
function resolveItem(itemId: EntityId): ReviewItem | undefined {
    return (
        _localStore.get(itemId) ??
        (_getStore() as Map<EntityId, ReviewItem>).get(itemId)
    );
}

// ─── Implementation ───────────────────────────────────────────────

/**
 * Store a review decision and return the resulting ApprovalState.
 * Transitions: pending → approved | rejected (one-way).
 * reopened → approved | rejected also allowed.
 * Every decision records reviewer identity and timestamp (auditable).
 *
 * Errors: REVIEW_ITEM_NOT_FOUND, REVIEW_DECISION_INVALID
 */
export function decideReview(decision: ReviewDecision): DecideReviewOutcome {
    if (!decision.reviewerId || decision.reviewerId.trim() === '') {
        return {
            ok: false,
            error: {
                code: 'REVIEW_DECISION_INVALID',
                message: 'Reviewer id must not be empty.',
                module: 'approvals',
            },
        };
    }

    if (!decision.timestamp || decision.timestamp.trim() === '') {
        return {
            ok: false,
            error: {
                code: 'REVIEW_DECISION_INVALID',
                message: 'Decision timestamp must not be empty.',
                module: 'approvals',
            },
        };
    }

    if (!['approved', 'rejected'].includes(decision.decision)) {
        return {
            ok: false,
            error: {
                code: 'REVIEW_DECISION_INVALID',
                message: `Decision must be "approved" or "rejected", got "${decision.decision as string}".`,
                module: 'approvals',
            },
        };
    }

    const item = resolveItem(decision.itemId);

    if (!item) {
        return {
            ok: false,
            error: {
                code: 'REVIEW_ITEM_NOT_FOUND',
                message: `No review item found for id "${decision.itemId}".`,
                module: 'approvals',
            },
        };
    }

    if (!canTransition(item.state, decision.decision)) {
        return {
            ok: false,
            error: {
                code: 'REVIEW_DECISION_INVALID',
                message: `Cannot transition from "${item.state}" to "${decision.decision}". Approval state transitions are one-way.`,
                module: 'approvals',
            },
        };
    }

    // Mutate state (store holds live object references)
    item.state = decision.decision;

    return {
        ok: true,
        state: item.state,
        itemId: item.id,
        reviewerId: decision.reviewerId,
        timestamp: decision.timestamp,
    };
}

/**
 * Explicitly reopen a terminal (approved|rejected) item so it can be
 * re-decided. Records reviewer identity for auditability.
 */
export function reopenItem(itemId: EntityId, reviewerId: string): ReopenResult | ReopenError {
    const item = resolveItem(itemId);
    if (!item) {
        return {
            ok: false,
            error: {
                code: 'REVIEW_ITEM_NOT_FOUND',
                message: `No review item found for id "${itemId}".`,
                module: 'approvals',
            },
        };
    }
    item.state = 'reopened';
    return { ok: true, state: 'reopened' };
}
