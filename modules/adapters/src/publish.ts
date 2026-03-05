import type { AdapterPublishRequest, AdapterPublishResponse, AppError } from '@core/types';
import { resolveAdapter } from './registry';

// ─── Result types ─────────────────────────────────────────────────
export interface EnqueuePublishResult {
    ok: true;
    response: AdapterPublishResponse;
}

export interface EnqueuePublishError {
    ok: false;
    error: AppError;
}

export type EnqueuePublishOutcome = EnqueuePublishResult | EnqueuePublishError;

// ─── Normalization ────────────────────────────────────────────────
function normalizeResponse(raw: AdapterPublishResponse, req: AdapterPublishRequest): AdapterPublishResponse {
    return {
        jobId: raw.jobId ?? req.jobId,
        channel: raw.channel ?? req.channel,
        success: typeof raw.success === 'boolean' ? raw.success : false,
        externalId: raw.externalId ?? undefined,
    };
}

// ─── Implementation ───────────────────────────────────────────────

/**
 * Queue a publish action to the provider-specific adapter implementation.
 * Normalizes the response to a canonical shape regardless of provider quirks.
 * Provider failures are translated to PROVIDER_REQUEST_FAILED core error format.
 *
 * Errors: ADAPTER_NOT_CONFIGURED, PROVIDER_REQUEST_FAILED
 */
export function enqueuePublish(req: AdapterPublishRequest): EnqueuePublishOutcome {
    if (!req.jobId || req.jobId.trim() === '') {
        return {
            ok: false,
            error: {
                code: 'PROVIDER_REQUEST_FAILED',
                message: 'Publish request must have a non-empty jobId.',
                module: 'adapters',
            },
        };
    }

    if (!req.content || req.content.trim() === '') {
        return {
            ok: false,
            error: {
                code: 'PROVIDER_REQUEST_FAILED',
                message: 'Publish request must have non-empty content.',
                module: 'adapters',
            },
        };
    }

    if (!req.scheduledAt || req.scheduledAt.trim() === '') {
        return {
            ok: false,
            error: {
                code: 'PROVIDER_REQUEST_FAILED',
                message: 'Publish request must have a non-empty scheduledAt.',
                module: 'adapters',
            },
        };
    }

    const resolved = resolveAdapter(req.channel);
    if (!resolved.ok) {
        return { ok: false, error: resolved.error };
    }

    let raw: AdapterPublishResponse;
    try {
        raw = resolved.adapter.publish(req);
    } catch (err) {
        return {
            ok: false,
            error: {
                code: 'PROVIDER_REQUEST_FAILED',
                message: err instanceof Error ? err.message : 'Unknown adapter error.',
                module: 'adapters',
            },
        };
    }

    if (!raw.success) {
        return {
            ok: false,
            error: {
                code: 'PROVIDER_REQUEST_FAILED',
                message: `Adapter for channel "${req.channel}" reported failure.`,
                module: 'adapters',
            },
        };
    }

    return { ok: true, response: normalizeResponse(raw, req) };
}
