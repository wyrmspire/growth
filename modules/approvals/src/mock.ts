import type {
    ReviewItem, ReviewDecision, ReviewBatch, ApprovalState, EntityId,
} from '../../core/src/types';
import { newEntityId } from '../../core/src/id';

const reviewStore = new Map<string, ReviewItem>();

export function createReviewBatch(items: Array<{ id: EntityId; label: string; kind: ReviewItem['kind'] }>): ReviewBatch {
    const reviewItems: ReviewItem[] = items.map(item => {
        const ri: ReviewItem = {
            id: item.id,
            label: item.label,
            kind: item.kind,
            state: 'pending',
        };
        reviewStore.set(ri.id, ri);
        return ri;
    });

    return {
        id: newEntityId('batch'),
        items: reviewItems,
        createdAt: new Date().toISOString(),
    };
}

export function decideReview(decision: ReviewDecision): ApprovalState {
    const item = reviewStore.get(decision.itemId);
    if (item) {
        item.state = decision.decision;
        reviewStore.set(item.id, item);
    }
    return decision.decision;
}

export function isApproved(itemId: EntityId): boolean {
    const item = reviewStore.get(itemId);
    return item?.state === 'approved';
}

export function getPendingItems(): ReviewItem[] {
    return Array.from(reviewStore.values()).filter(i => i.state === 'pending');
}

export function getAllItems(): ReviewItem[] {
    return Array.from(reviewStore.values());
}

export function resetStore(): void {
    reviewStore.clear();
}
