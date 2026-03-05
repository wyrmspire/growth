import type { DomainEvent, PublishDispatchResult } from '@core/types';
import { newEntityId } from '@core/id';

export function emitDispatchOutcomeEvents(results: PublishDispatchResult[]): DomainEvent[] {
    return results.map((result) => ({
        id: newEntityId('item'),
        name: 'PublishDispatched',
        entityId: result.jobId,
        timestamp: new Date().toISOString(),
        payload: {
            channel: result.channel,
            success: result.success,
            receipt: result.receipt,
        },
    }));
}
