import type { ReviewItem, ReviewBatch, EntityId, AppError } from '@core/types';
import { newEntityId } from '@core/id';

// ─── Input type ───────────────────────────────────────────────────
export type ReviewItemInput = Pick<ReviewItem, 'id' | 'label' | 'kind'>;

// ─── Result types (compatible with optional-chaining in tests) ────
export interface CreateReviewBatchResult {
    ok: true;
    batch: ReviewBatch;
    error?: undefined;
}

export interface CreateReviewBatchError {
    ok: false;
    batch?: undefined;
    error: AppError;
}

export type CreateReviewBatchOutcome = CreateReviewBatchResult | CreateReviewBatchError;

// ─── Module-level store (in-memory, reset for tests) ─────────────
const _store = new Map<EntityId, ReviewItem>();

export function _resetStore(): void {
    _store.clear();
}

export function _getStore(): ReadonlyMap<EntityId, ReviewItem> {
    return _store;
}

// ─── Implementation ───────────────────────────────────────────────

/**
 * Create a review queue for assets or replies.
 * All items start in 'pending' state.
 *
 * Errors: REVIEW_ITEM_INVALID
 */
export function createReviewBatch(items: ReviewItemInput[]): CreateReviewBatchOutcome {
    if (!Array.isArray(items) || items.length === 0) {
        return {
            ok: false,
            error: {
                code: 'REVIEW_ITEM_INVALID',
                message: 'Review batch must contain at least one item.',
                module: 'approvals',
            },
        };
    }

    for (const item of items) {
        if (!item.label || item.label.trim().length === 0) {
            return {
                ok: false,
                error: {
                    code: 'REVIEW_ITEM_INVALID',
                    message: `Review item "${item.id}" must have a non-empty label.`,
                    module: 'approvals',
                },
            };
        }
        if (!['asset', 'reply', 'offer'].includes(item.kind)) {
            return {
                ok: false,
                error: {
                    code: 'REVIEW_ITEM_INVALID',
                    message: `Review item "${item.id}" has invalid kind "${item.kind as string}". Must be asset, reply, or offer.`,
                    module: 'approvals',
                },
            };
        }
    }

    const reviewItems: ReviewItem[] = items.map(input => {
        const ri: ReviewItem = {
            id: input.id,
            label: input.label.trim(),
            kind: input.kind,
            state: 'pending',
        };
        _store.set(ri.id, ri);
        return ri;
    });

    const batch: ReviewBatch = {
        id: newEntityId('batch'),
        items: reviewItems,
        createdAt: new Date().toISOString(),
    };

    return { ok: true, batch };
}
