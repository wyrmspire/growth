/**
 * STR-B2 — Playwright Fallback Collector
 *
 * Implements API-first then Playwright fallback for market signal collection
 * from allowlisted public pages.
 *
 * CONTRACT: modules/strategy/CONTRACT.md — collectMarketSignals()
 *
 * Strategy:
 * 1. Attempt API-first collection for each domain
 * 2. If API fails, fallback to Playwright browser automation for allowed public pages
 * 3. Enforce source allowlist + rate policy throughout
 *
 * Safety invariants:
 * - No authenticated scraping
 * - No private pages
 * - Only allowlisted domains permitted
 * - Rate limiting enforced per domain
 */

import type { MarketSignal, ResearchSourcePlan, AppError } from '../../core/src/types';
import { newEntityId } from '../../core/src/id';
import {
    SOURCE_ALLOWLIST,
    DEFAULT_RATE_LIMIT_POLICY,
    isDomainAllowed,
    normalizeDomain,
    type RateLimitPolicy,
} from './sources';

// ─── Types ────────────────────────────────────────────────────────────────

export interface CollectionResult {
    signals: MarketSignal[];
    errors: CollectionError[];
}

export interface CollectionError {
    domain: string;
    method: 'api' | 'browser';
    code: string;
    message: string;
}

export interface ApiCollectorFn {
    (domain: string): Promise<MarketSignal | null>;
}

export interface BrowserCollectorFn {
    (domain: string, url: string): Promise<MarketSignal | null>;
}

export interface CollectorDependencies {
    apiCollector?: ApiCollectorFn;
    browserCollector?: BrowserCollectorFn;
    ratePolicy?: RateLimitPolicy;
}

// ─── Rate Limiter ─────────────────────────────────────────────────────────

interface RateLimitState {
    requests: Map<string, number[]>;
}

const rateLimitState: RateLimitState = {
    requests: new Map(),
};

/**
 * Check if a request to the domain is allowed under the rate limit policy.
 * Returns true if allowed, false if rate-limited.
 */
function checkRateLimit(domain: string, policy: RateLimitPolicy): boolean {
    const now = Date.now();
    const windowStart = now - policy.windowMs;

    const timestamps = rateLimitState.requests.get(domain) || [];
    // Filter to only timestamps within the current window
    const recentRequests = timestamps.filter(t => t > windowStart);

    if (recentRequests.length >= policy.maxRequestsPerDomain) {
        return false;
    }

    // Record this request
    recentRequests.push(now);
    rateLimitState.requests.set(domain, recentRequests);
    return true;
}

/**
 * Reset rate limit state (for testing).
 */
export function resetRateLimitState(): void {
    rateLimitState.requests.clear();
}

// ─── Error Helpers ────────────────────────────────────────────────────────

function makeError(code: string, message: string): AppError {
    return { code, message, module: 'strategy' };
}

function makeCollectionError(
    domain: string,
    method: 'api' | 'browser',
    code: string,
    message: string,
): CollectionError {
    return { domain, method, code, message };
}

// ─── Default Collectors (Mock) ────────────────────────────────────────────

/**
 * Default API collector (mock implementation).
 * In production, this would make actual API calls to data providers.
 */
const defaultApiCollector: ApiCollectorFn = async (domain: string): Promise<MarketSignal | null> => {
    // Simulate API availability: only some domains have APIs
    const apiAvailableDomains = [
        'trends.google.com',
        'similarweb.com',
        'semrush.com',
        'ahrefs.com',
    ];

    const normalized = normalizeDomain(domain);
    const hasApi = apiAvailableDomains.some(
        d => normalized === d || normalized.endsWith(`.${d}`),
    );

    if (!hasApi) {
        // No API available for this domain
        return null;
    }

    // Mock successful API response
    return {
        id: newEntityId('sig'),
        source: normalized,
        content: `[API] Market signal from ${normalized} — collected via API integration.`,
        relevance: 0.85,
        collectedAt: new Date().toISOString(),
    };
};

/**
 * Default browser collector (mock implementation).
 * In production, this would use Playwright for browser automation.
 */
const defaultBrowserCollector: BrowserCollectorFn = async (
    domain: string,
    _url: string,
): Promise<MarketSignal | null> => {
    // Mock: simulate browser collection succeeding
    const normalized = normalizeDomain(domain);
    return {
        id: newEntityId('sig'),
        source: normalized,
        content: `[Browser] Market signal from ${normalized} — collected via browser fallback.`,
        relevance: 0.65, // Lower relevance for browser-scraped data
        collectedAt: new Date().toISOString(),
    };
};

// ─── Public URL Builders ──────────────────────────────────────────────────

/**
 * Build a public (non-authenticated) URL for a given domain.
 * Only returns URLs that are safe for unauthenticated access.
 */
export function buildPublicUrl(domain: string): string | null {
    const normalized = normalizeDomain(domain);

    // Map domains to their public landing pages
    const publicUrls: Record<string, string> = {
        'trends.google.com': 'https://trends.google.com/trends/',
        'reddit.com': 'https://www.reddit.com/',
        'twitter.com': 'https://twitter.com/explore',
        'producthunt.com': 'https://www.producthunt.com/',
        'g2.com': 'https://www.g2.com/',
        'capterra.com': 'https://www.capterra.com/',
        'trustpilot.com': 'https://www.trustpilot.com/',
        'yelp.com': 'https://www.yelp.com/',
        'glassdoor.com': 'https://www.glassdoor.com/',
        'similarweb.com': 'https://www.similarweb.com/',
        'semrush.com': 'https://www.semrush.com/',
        'ahrefs.com': 'https://ahrefs.com/',
    };

    // Check for exact match or subdomain
    for (const [allowedDomain, url] of Object.entries(publicUrls)) {
        if (normalized === allowedDomain || normalized.endsWith(`.${allowedDomain}`)) {
            return url;
        }
    }

    return null;
}

// ─── Main Collection Functions ────────────────────────────────────────────

/**
 * Collect a single market signal from a domain using API-first strategy
 * with browser fallback.
 */
export async function collectSignalFromDomain(
    domain: string,
    deps: CollectorDependencies = {},
): Promise<{ signal: MarketSignal | null; error: CollectionError | null }> {
    const apiCollector = deps.apiCollector ?? defaultApiCollector;
    const browserCollector = deps.browserCollector ?? defaultBrowserCollector;
    const ratePolicy = deps.ratePolicy ?? DEFAULT_RATE_LIMIT_POLICY;

    const normalized = normalizeDomain(domain);

    // Validate domain is in allowlist
    if (!isDomainAllowed(normalized)) {
        return {
            signal: null,
            error: makeCollectionError(
                normalized,
                'api',
                'SIGNAL_SOURCE_DENIED',
                `Domain "${normalized}" is not in the approved source allowlist.`,
            ),
        };
    }

    // Check rate limit
    if (!checkRateLimit(normalized, ratePolicy)) {
        return {
            signal: null,
            error: makeCollectionError(
                normalized,
                'api',
                'RATE_LIMIT_EXCEEDED',
                `Rate limit exceeded for domain "${normalized}".`,
            ),
        };
    }

    // Step 1: Try API first
    try {
        const apiSignal = await apiCollector(normalized);
        if (apiSignal) {
            return { signal: apiSignal, error: null };
        }
    } catch (err) {
        // API failed, continue to fallback
    }

    // Step 2: Fallback to browser automation for public pages
    const publicUrl = buildPublicUrl(normalized);
    if (!publicUrl) {
        return {
            signal: null,
            error: makeCollectionError(
                normalized,
                'browser',
                'NO_PUBLIC_URL',
                `No public URL available for domain "${normalized}".`,
            ),
        };
    }

    try {
        const browserSignal = await browserCollector(normalized, publicUrl);
        if (browserSignal) {
            return { signal: browserSignal, error: null };
        }
    } catch (err) {
        return {
            signal: null,
            error: makeCollectionError(
                normalized,
                'browser',
                'BROWSER_COLLECTION_FAILED',
                `Browser collection failed for "${normalized}": ${err instanceof Error ? err.message : 'Unknown error'}`,
            ),
        };
    }

    return {
        signal: null,
        error: makeCollectionError(
            normalized,
            'browser',
            'SIGNAL_COLLECTION_FAILED',
            `No signal collected from "${normalized}".`,
        ),
    };
}

/**
 * Collect market signals from a research source plan using API-first strategy
 * with Playwright browser fallback for allowed public pages.
 *
 * This is an enhanced version of collectMarketSignals() from sources.ts that
 * supports async API and browser collection strategies.
 *
 * Throws with AppError on:
 * - SIGNAL_SOURCE_DENIED — a domain is not in the allowlist.
 * - SIGNAL_COLLECTION_FAILED — plan is missing or has no domains.
 */
export async function collectMarketSignalsWithFallback(
    plan: ResearchSourcePlan,
    deps: CollectorDependencies = {},
): Promise<CollectionResult> {
    // Validate plan
    if (!plan || !Array.isArray(plan.allowedDomains) || plan.allowedDomains.length === 0) {
        throw makeError(
            'SIGNAL_COLLECTION_FAILED',
            'Research source plan must include at least one allowed domain.',
        );
    }

    // Pre-validate all domains against allowlist before making any requests
    for (const domain of plan.allowedDomains) {
        if (!isDomainAllowed(domain)) {
            throw makeError(
                'SIGNAL_SOURCE_DENIED',
                `Domain "${domain}" is not in the approved source allowlist. ` +
                `Add it to SOURCE_ALLOWLIST after human review.`,
            );
        }
    }

    // Rate-limit: cap total signals to (maxRequestsPerDomain × domainCount)
    const ratePolicy = deps.ratePolicy ?? DEFAULT_RATE_LIMIT_POLICY;
    const rateLimit = ratePolicy.maxRequestsPerDomain * plan.allowedDomains.length;
    const cappedRequests = Math.min(plan.maxRequests, rateLimit);

    const signals: MarketSignal[] = [];
    const errors: CollectionError[] = [];

    // Collect from each domain (up to cap)
    const domainsToProcess = plan.allowedDomains.slice(0, cappedRequests);
    for (const domain of domainsToProcess) {
        const result = await collectSignalFromDomain(domain, deps);
        if (result.signal) {
            signals.push(result.signal);
        }
        if (result.error) {
            errors.push(result.error);
        }
    }

    return { signals, errors };
}

/**
 * Synchronous wrapper for backward compatibility with existing mock-engine.
 * Returns mock signals without actual async collection.
 *
 * NOTE: For production use, prefer collectMarketSignalsWithFallback() which
 * properly handles async API and browser collection.
 */
export function collectMarketSignalsSync(plan: ResearchSourcePlan): MarketSignal[] {
    // Validate plan
    if (!plan || !Array.isArray(plan.allowedDomains) || plan.allowedDomains.length === 0) {
        throw makeError(
            'SIGNAL_COLLECTION_FAILED',
            'Research source plan must include at least one allowed domain.',
        );
    }

    // Validate all domains against allowlist
    for (const domain of plan.allowedDomains) {
        if (!isDomainAllowed(domain)) {
            throw makeError(
                'SIGNAL_SOURCE_DENIED',
                `Domain "${domain}" is not in the approved source allowlist. ` +
                `Add it to SOURCE_ALLOWLIST after human review.`,
            );
        }
    }

    // Rate-limit: cap total signals to (maxRequestsPerDomain × domainCount)
    const rateLimit = DEFAULT_RATE_LIMIT_POLICY.maxRequestsPerDomain * plan.allowedDomains.length;
    const cappedRequests = Math.min(plan.maxRequests, rateLimit);

    // Return mock signals (sync, no actual network calls)
    return plan.allowedDomains.slice(0, cappedRequests).map(domain => ({
        id: newEntityId('sig'),
        source: normalizeDomain(domain),
        content: `[Mock] Market signal from ${normalizeDomain(domain)} — sync collection for mock flow.`,
        relevance: 0.7,
        collectedAt: new Date().toISOString(),
    }));
}
