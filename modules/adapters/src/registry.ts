import type {
    ChannelName, AdapterName, AdapterPublishRequest, AdapterPublishResponse,
    AdapterCommentEvent, ReplyPayload, EntityId, AppError, CommentRecord,
} from '@core/types';
import { newEntityId } from '@core/id';

// ─── ProviderAdapter interface ─────────────────────────────────────
export interface ProviderAdapter {
    name: AdapterName;
    publish(req: AdapterPublishRequest): AdapterPublishResponse;
    ingestComments(campaignId: EntityId): AdapterCommentEvent[];
    sendReply(payload: ReplyPayload): AdapterPublishResponse;
}

// ─── Registry result types ────────────────────────────────────────
export interface GetAdapterResult {
    ok: true;
    result: ProviderAdapter;
}

export interface GetAdapterError {
    ok: false;
    error: AppError;
}

export type GetAdapterOutcome = GetAdapterResult | GetAdapterError;

// ─── Shared mock comment generator ────────────────────────────────
function mockComments(channel: ChannelName, campaignId: EntityId): AdapterCommentEvent[] {
    const records: CommentRecord[] = [
        {
            id: newEntityId('comment'),
            channel,
            campaignId,
            authorName: 'Sarah M.',
            body: 'This looks exactly like what we need. How do we get started?',
            timestamp: new Date().toISOString(),
        },
        {
            id: newEntityId('comment'),
            channel,
            campaignId,
            authorName: 'Jake R.',
            body: 'Great content! We switched from our old tool and love it.',
            timestamp: new Date().toISOString(),
        },
        {
            id: newEntityId('comment'),
            channel,
            campaignId,
            authorName: 'Pat D.',
            body: "Seems expensive. What's the ROI?",
            timestamp: new Date().toISOString(),
        },
    ];
    return records.map(comment => ({ comment, raw: { source: 'mock', channel } }));
}

// ─── Built-in mock adapters ────────────────────────────────────────
function makeMockAdapter(channel: ChannelName): ProviderAdapter {
    return {
        name: channel,
        publish(req) {
            return {
                jobId: req.jobId,
                channel: req.channel,
                success: true,
                externalId: `${channel}_${req.jobId}_${Date.now().toString(36)}`,
            };
        },
        ingestComments(campaignId) {
            return mockComments(channel, campaignId);
        },
        sendReply(payload) {
            return {
                jobId: payload.replyId,
                channel,
                success: true,
                externalId: `reply_${channel}_${Date.now().toString(36)}`,
            };
        },
    };
}

// ─── Registry ─────────────────────────────────────────────────────
const _registry = new Map<AdapterName, ProviderAdapter>([
    ['meta', makeMockAdapter('meta')],
    ['linkedin', makeMockAdapter('linkedin')],
    ['x', makeMockAdapter('x')],
    ['email', makeMockAdapter('email')],
]);

/**
 * Register or replace a provider adapter.
 */
export function registerAdapter(adapter: ProviderAdapter): void {
    _registry.set(adapter.name, adapter);
}

/**
 * Get an adapter by channel name.
 * Returns { ok: true, result } or { ok: false, error: ADAPTER_NOT_CONFIGURED }.
 */
export function getAdapter(name: AdapterName): GetAdapterOutcome {
    const adapter = _registry.get(name);
    if (!adapter) {
        return {
            ok: false,
            error: {
                code: 'ADAPTER_NOT_CONFIGURED',
                message: `No adapter registered for channel "${name}".`,
                module: 'adapters',
            },
        };
    }
    return { ok: true, result: adapter };
}

/**
 * Check whether an adapter is registered for the given channel.
 */
export function isAdapterRegistered(name: AdapterName | string): boolean {
    return _registry.has(name as AdapterName);
}

/**
 * List all registered channel names.
 */
export function listAdapters(): AdapterName[] {
    return [..._registry.keys()];
}

/**
 * Remove an adapter (useful for testing failure paths).
 */
export function removeAdapter(name: AdapterName): void {
    _registry.delete(name);
}

/**
 * Reset the registry to the 4 default mock adapters.
 * Called between tests.
 */
export function _resetRegistry(): void {
    _registry.clear();
    for (const ch of ['meta', 'linkedin', 'x', 'email'] as ChannelName[]) {
        _registry.set(ch, makeMockAdapter(ch));
    }
}

/**
 * Resolve adapter and return handler or structured error.
 * Used by enqueuePublish internally.
 */
export function resolveAdapter(name: AdapterName): { ok: true; adapter: ProviderAdapter } | { ok: false; error: AppError } {
    const result = getAdapter(name);
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true, adapter: result.result };
}
