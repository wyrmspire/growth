import type { EntityId, ChannelName, PublishCalendarEntry, AppError } from '@core/types';
import { newEntityId } from '@core/id';
import { isApproved } from '@approvals/gate';

// ─── Types ────────────────────────────────────────────────────────
export interface ScheduleAssetResult {
    ok: true;
    entry: PublishCalendarEntry;
    error?: undefined;
}

export interface ScheduleAssetError {
    ok: false;
    entry?: undefined;
    error: AppError;
}

export type ScheduleAssetOutcome = ScheduleAssetResult | ScheduleAssetError;

// ─── Calendar store ───────────────────────────────────────────────
const _calendar: PublishCalendarEntry[] = [];

export function resetCalendar(): void {
    _calendar.length = 0;
}

/** Returns a shallow copy so external mutations don't affect internal state. */
export function getCalendar(): PublishCalendarEntry[] {
    return _calendar.map(e => ({ ...e }));
}

export function setCalendarEntryState(jobId: EntityId, state: PublishCalendarEntry['state']): void {
    const entry = _calendar.find(item => item.jobId === jobId);
    if (entry) {
        entry.state = state;
    }
}

// ─── ISO 8601 + timezone validation ──────────────────────────────
// Must include explicit timezone (Z or ±HH:MM). Bare local times rejected.
const ISO_TZ_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export function isValidISOWithTimezone(runAt: string): boolean {
    if (!ISO_TZ_REGEX.test(runAt)) return false;
    return Number.isFinite(Date.parse(runAt));
}

// ─── Valid channels ───────────────────────────────────────────────
const VALID_CHANNELS: ReadonlySet<string> = new Set(['meta', 'linkedin', 'x', 'email']);

// ─── Implementation ───────────────────────────────────────────────

/**
 * Create a scheduled publish record for an asset.
 *
 * Signature: scheduleAsset(assetId, runAt, channel, assetLabel?)
 *   - assetLabel defaults to "Untitled Asset" when omitted.
 *   - runAt must be a timezone-aware ISO 8601 datetime (Z or ±HH:MM offset).
 *
 * Errors: APPROVAL_REQUIRED, SCHEDULE_TIME_INVALID
 */
export function scheduleAsset(
    assetId: EntityId,
    runAt: string,
    channel: ChannelName | string,
    assetLabel = 'Untitled Asset',
): ScheduleAssetOutcome {
    if (!assetId || assetId.trim() === '') {
        return {
            ok: false,
            error: {
                code: 'SCHEDULE_TIME_INVALID',
                message: 'Asset id must not be empty.',
                module: 'publishing',
            },
        };
    }

    if (!VALID_CHANNELS.has(channel)) {
        return {
            ok: false,
            error: {
                code: 'SCHEDULE_TIME_INVALID',
                message: `Channel "${channel}" is not a recognised publish channel (meta, linkedin, x, email).`,
                module: 'publishing',
            },
        };
    }

    if (!isValidISOWithTimezone(runAt)) {
        return {
            ok: false,
            error: {
                code: 'SCHEDULE_TIME_INVALID',
                message: `runAt "${runAt}" is not a valid timezone-aware ISO 8601 datetime. Use Z (UTC) or an explicit ±HH:MM offset.`,
                module: 'publishing',
            },
        };
    }

    if (!isApproved(assetId)) {
        return {
            ok: false,
            error: {
                code: 'APPROVAL_REQUIRED',
                message: `Asset "${assetId}" must be approved before scheduling.`,
                module: 'publishing',
            },
        };
    }

    const entry: PublishCalendarEntry = {
        jobId: newEntityId('job'),
        assetLabel: assetLabel.trim() || 'Untitled Asset',
        channel: channel as ChannelName,
        runAt,
        state: 'scheduled',
    };

    _calendar.push(entry);

    return { ok: true, entry };
}
