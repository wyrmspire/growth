import type { EntityId } from '@core/types';
import { getItemState } from './decision';

export function isApproved(itemId: EntityId): boolean {
    return getItemState(itemId) === 'approved';
}
