import { emitDispatchOutcomeEvents } from '../dispatch-events';
import type { EntityId } from '../../../core/src/types';

describe('emitDispatchOutcomeEvents()', () => {
    test('emits DomainEvent envelope for each dispatch result', () => {
        const events = emitDispatchOutcomeEvents([
            {
                jobId: 'job_000001' as EntityId,
                channel: 'meta',
                success: true,
                receipt: 'ext_1',
            },
            {
                jobId: 'job_000002' as EntityId,
                channel: 'email',
                success: false,
            },
        ]);

        expect(events).toHaveLength(2);
        expect(events[0].name).toBe('PublishDispatched');
        expect(events[0].entityId).toBe('job_000001');
        expect(events[0].payload).toMatchObject({
            channel: 'meta',
            success: true,
            receipt: 'ext_1',
        });
        expect(events[1].payload).toMatchObject({
            channel: 'email',
            success: false,
        });
    });
});
