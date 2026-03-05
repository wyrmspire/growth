import type {
    EntityId, ChannelName, PublishCalendarEntry, PublishDispatchResult, PublishJob,
} from '../../core/src/types';
import { newEntityId } from '../../core/src/id';
import { assertApprovalState } from '../../core/src/approval-gate';
import { isApproved } from '../../approvals/src/mock';

const calendar: PublishCalendarEntry[] = [];

export function scheduleAsset(
    assetId: EntityId,
    assetLabel: string,
    runAt: string,
    channel: ChannelName,
): PublishCalendarEntry {
    const gate = assertApprovalState(
        isApproved(assetId) ? 'approved' : 'pending',
        'approved',
    );

    const entry: PublishCalendarEntry = {
        jobId: newEntityId('job'),
        assetLabel,
        channel,
        runAt,
        state: gate.ok ? 'scheduled' : 'failed',
    };

    calendar.push(entry);
    return entry;
}

export function dispatchDue(now: string): PublishDispatchResult[] {
    return calendar
        .filter(e => e.state === 'scheduled' && e.runAt <= now)
        .map(entry => {
            entry.state = 'dispatched';
            return {
                jobId: entry.jobId,
                channel: entry.channel,
                success: true,
                receipt: `receipt_${entry.channel}_${Date.now().toString(36)}`,
            };
        });
}

export function getCalendar(): PublishCalendarEntry[] {
    return [...calendar];
}

export function resetCalendar(): void {
    calendar.length = 0;
}
