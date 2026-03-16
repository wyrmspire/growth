import type {
    ChannelName, AdapterName, AdapterPublishRequest, AdapterPublishResponse,
    AdapterCommentEvent, ReplyPayload, EntityId, AppError, CommentRecord,
} from '@core/types';
import { newEntityId } from '@core/id';
import { makeMetaAdapter } from './meta-adapter';
import { makeLinkedInAdapter } from './linkedin-adapter';
import { makeXAdapter } from './x-adapter';
import { makeEmailAdapter } from './email-adapter';
import { makeRedditAdapter } from './reddit-adapter';
import { makeTikTokAdapter } from './tiktok-adapter';
import { makeInstagramAdapter } from './instagram-adapter';
import { makeFacebookAdapter } from './facebook-adapter';
import { makeYouTubeAdapter } from './youtube-adapter';
import { makeSubstackAdapter } from './substack-adapter';
import { makePinterestAdapter } from './pinterest-adapter';
import { makeThreadsAdapter } from './threads-adapter';
export { getPlatformAvailability, getAllPlatformAvailability } from './credentials';

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
// Initialise with the real platform adapters (all mock-safe by default;
// they degrade gracefully when credentials are absent).
const _registry = new Map<AdapterName, ProviderAdapter>([
    ['meta', makeMetaAdapter()],
    ['linkedin', makeLinkedInAdapter()],
    ['x', makeXAdapter()],
    ['email', makeEmailAdapter()],
    ['reddit', makeRedditAdapter()],
    ['tiktok', makeTikTokAdapter()],
    ['instagram', makeInstagramAdapter()],
    ['facebook', makeFacebookAdapter()],
    ['youtube', makeYouTubeAdapter()],
    ['substack', makeSubstackAdapter()],
    ['pinterest', makePinterestAdapter()],
    ['threads', makeThreadsAdapter()],
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
 * Reset the registry to the 4 real platform adapters (mock-safe).
 * Called between tests to avoid cross-test state from registerAdapter() calls.
 */
export function _resetRegistry(): void {
    _registry.clear();
    _registry.set('meta', makeMetaAdapter());
    _registry.set('linkedin', makeLinkedInAdapter());
    _registry.set('x', makeXAdapter());
    _registry.set('email', makeEmailAdapter());
    _registry.set('reddit', makeRedditAdapter());
    _registry.set('tiktok', makeTikTokAdapter());
    _registry.set('instagram', makeInstagramAdapter());
    _registry.set('facebook', makeFacebookAdapter());
    _registry.set('youtube', makeYouTubeAdapter());
    _registry.set('substack', makeSubstackAdapter());
    _registry.set('pinterest', makePinterestAdapter());
    _registry.set('threads', makeThreadsAdapter());
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
