/**
 * STR-B1 — Source Allowlist and Rate-Limit Policy
 * Controls which domains may be used for market signal collection and how
 * many requests are permitted per collection run.
 * CONTRACT: modules/strategy/CONTRACT.md — collectMarketSignals()
 */

import type { MarketSignal, ResearchSourcePlan, AppError } from '../../core/src/types';
import { newEntityId } from '../../core/src/id';

// ─── Source Allowlist ─────────────────────────────────────────────────────

/**
 * Approved public domains for market signal collection.
 * Only these domains (or subdomains) may appear in a ResearchSourcePlan.
 * Domains are lowercase, without protocol or trailing slashes.
 *
 * SAFETY: New entries require a human review + board approval before addition.
 */
export const SOURCE_ALLOWLIST: readonly string[] = [
    'trends.google.com',
    'reddit.com',
    'twitter.com',
    'producthunt.com',
    'g2.com',
    'capterra.com',
    'trustpilot.com',
    'yelp.com',
    'glassdoor.com',
    'similarweb.com',
    'semrush.com',
    'ahrefs.com',
];

// ─── Rate-Limit Policy ────────────────────────────────────────────────────

export interface RateLimitPolicy {
    /** Maximum requests per domain per rate-limit window. */
    maxRequestsPerDomain: number;
    /** Window duration in milliseconds. */
    windowMs: number;
}

export const DEFAULT_RATE_LIMIT_POLICY: RateLimitPolicy = {
    maxRequestsPerDomain: 10,
    windowMs: 60_000, // 1 minute
};

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Extract the registrable domain from a URL or bare hostname.
 * Strips leading `www.` to normalize for allowlist comparisons.
 */
export function normalizeDomain(input: string): string {
    try {
        // Accept bare domains like "trends.google.com" by prefixing a protocol
        const raw = input.includes('://') ? input : `https://${input}`;
        return new URL(raw).hostname.replace(/^www\./, '').toLowerCase();
    } catch {
        return input.toLowerCase().replace(/^www\./, '');
    }
}

/**
 * Return true when `domain` matches an entry in the allowlist or is a
 * subdomain of one (e.g. "en.reddit.com" is covered by "reddit.com").
 */
export function isDomainAllowed(domain: string): boolean {
    const normalized = normalizeDomain(domain);
    return SOURCE_ALLOWLIST.some(
        allowed =>
            normalized === allowed ||
            normalized.endsWith(`.${allowed}`),
    );
}

function makeError(code: string, message: string): AppError {
    return { code, message, module: 'strategy' };
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Collect market signals from an approved research source plan.
 *
 * Validation rules:
 * - Every domain in `plan.allowedDomains` must be in `SOURCE_ALLOWLIST`.
 * - The total number of signals returned is capped by `plan.maxRequests` and
 *   `DEFAULT_RATE_LIMIT_POLICY.maxRequestsPerDomain × domain count`.
 *
 * Strategy (from contract invariants):
 * - API-first: in a production implementation, live API calls would be made
 *   before any browser-automation fallback. In MVP mode, mock signals are
 *   returned so no real network calls occur.
 *
 * Throws with AppError on:
 * - SIGNAL_SOURCE_DENIED — a domain is not in the allowlist.
 * - SIGNAL_COLLECTION_FAILED — plan is missing or has no domains.
 */
export function collectMarketSignals(plan: ResearchSourcePlan): MarketSignal[] {
    if (!plan || !Array.isArray(plan.allowedDomains) || plan.allowedDomains.length === 0) {
        throw makeError(
            'SIGNAL_COLLECTION_FAILED',
            'Research source plan must include at least one allowed domain.',
        );
    }

    // Validate every domain against the allowlist before making any requests
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
    const rateLimit =
        DEFAULT_RATE_LIMIT_POLICY.maxRequestsPerDomain * plan.allowedDomains.length;
    const cappedRequests = Math.min(plan.maxRequests, rateLimit);

    // MVP: return mock signals (no real network requests)
    const signals: MarketSignal[] = plan.allowedDomains
        .slice(0, cappedRequests)
        .map(domain => ({
            id: newEntityId('sig'),
            source: normalizeDomain(domain),
            content: `[Mock] Market signal from ${normalizeDomain(domain)} — real API call not made in MVP mode.`,
            relevance: 0.6,
            collectedAt: new Date().toISOString(),
        }));

    return signals;
}
