import type { PublishDispatchResult } from '@core/types';
import { enqueuePublish } from '@adapters/publish';
import { getCalendar, setCalendarEntryState } from './schedule';

export function dispatchDue(now: string): PublishDispatchResult[] {
    const nowMs = Date.parse(now);
    if (!Number.isFinite(nowMs)) {
        return [];
    }

    const results: PublishDispatchResult[] = [];

    for (const entry of getCalendar()) {
        if (entry.state !== 'scheduled') continue;

        const runAtMs = Date.parse(entry.runAt);
        if (!Number.isFinite(runAtMs) || runAtMs > nowMs) continue;

        const dispatch = enqueuePublish({
            jobId: entry.jobId,
            channel: entry.channel,
            content: entry.assetLabel,
            scheduledAt: entry.runAt,
        });

        if (!dispatch.ok) {
            setCalendarEntryState(entry.jobId, 'failed');
            results.push({
                jobId: entry.jobId,
                channel: entry.channel,
                success: false,
            });
            continue;
        }

        setCalendarEntryState(entry.jobId, 'dispatched');
        results.push({
            jobId: entry.jobId,
            channel: entry.channel,
            success: true,
            receipt: dispatch.response.externalId,
        });
    }

    return results;
}
