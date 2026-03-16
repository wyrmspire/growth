import type { PublishDispatchResult, EntityId, ChannelName, AppError, AdapterPublishResponse } from '@core/types';
import { getCalendar, setCalendarEntryState } from './schedule';
import { isApproved } from '@approvals/gate';
import { getAdapter } from '@adapters/registry';

export interface DispatchResponse {
    ok: boolean;
    error?: AppError;
    receipt?: string;
}

/**
 * Route a publish job to the correct platform adapter.
 * Enforces the approval gate before allowing the message out.
 */
export function dispatchToChannel(
    jobId: EntityId,
    assetId: EntityId,
    channel: ChannelName,
    content: string,
    scheduledAt: string
): DispatchResponse {
    // 1. Enforce approval gate
    if (!isApproved(assetId)) {
        return {
            ok: false,
            error: {
                code: 'APPROVAL_MISSING',
                message: `Asset ${assetId} must be approved to be dispatched.`,
                module: 'publishing',
            }
        };
    }

    // 2. Resolve adapter
    const adapterResult = getAdapter(channel as any);
    if (!adapterResult.ok) {
        return {
            ok: false,
            error: adapterResult.error,
        };
    }

    // 3. Dispatch
    let response: AdapterPublishResponse;
    try {
        response = adapterResult.result.publish({
            jobId,
            channel,
            content,
            scheduledAt,
        });
    } catch (err: any) {
        console.error(`[Publishing] Dispatch threw error for ${jobId} on ${channel}`, err);
        return {
            ok: false,
            error: {
                code: 'PUBLISH_ERROR',
                message: err.message || 'Unknown publish error',
                module: 'adapters',
            }
        };
    }

    // 4. Handle result
    if (response.success) {
        console.log(`[Publishing] Dispatch succeeded for ${jobId} on ${channel}`);
        return { ok: true, receipt: response.externalId };
    } else {
        console.warn(`[Publishing] Dispatch soft-failed for ${jobId} on ${channel}`);
        return {
            ok: false,
            error: {
                code: 'PUBLISH_FAILED',
                message: 'Adapter returned success=false without a specific error message.',
                module: 'adapters',
            }
        };
    }
}

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

        const dispatch = dispatchToChannel(
            entry.jobId,
            entry.assetId,
            entry.channel,
            entry.assetLabel,
            entry.runAt
        );

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
            receipt: dispatch.receipt,
        });
    }

    return results;
}
