/**
 * Social Scout module types — re-exports from core plus validation helpers.
 *
 * All canonical types live in @core/types. This file re-exports them
 * and adds module-specific validation so consumers import from one place.
 */
export type {
    ScoutPlatform,
    ScoutSourceConfig,
    ScoutRun,
    OpportunityItem,
    OpportunityScoreBreakdown,
    SuggestedEngagement,
    OpportunityDecision,
    OpportunityDecisionType,
} from '@core/types';

import type { ScoutSourceConfig, OpportunityItem, AppError } from '@core/types';

// ─── Validation ──────────────────────────────────────────────────

const VALID_PLATFORMS = ['reddit', 'x', 'facebook', 'instagram', 'linkedin'] as const;

export interface ScoutValidationResult {
    valid: boolean;
    errors: AppError[];
}

/** Validate a ScoutSourceConfig before persisting. */
export function validateSourceConfig(config: ScoutSourceConfig): ScoutValidationResult {
    const errors: AppError[] = [];

    if (!config.id) {
        errors.push({ code: 'MISSING_ID', message: 'Source config must have an id.', module: 'social-scout' });
    }
    if (!VALID_PLATFORMS.includes(config.platform as typeof VALID_PLATFORMS[number])) {
        errors.push({ code: 'INVALID_PLATFORM', message: `Platform "${config.platform}" is not supported.`, module: 'social-scout' });
    }
    if (!config.query || config.query.trim() === '') {
        errors.push({ code: 'EMPTY_QUERY', message: 'Source config must have a non-empty query.', module: 'social-scout' });
    }
    if (config.scanIntervalMinutes < 5) {
        errors.push({ code: 'INTERVAL_TOO_SHORT', message: 'Scan interval must be at least 5 minutes.', module: 'social-scout' });
    }

    return { valid: errors.length === 0, errors };
}

/** Validate an OpportunityItem before scoring or display. */
export function validateOpportunityItem(item: OpportunityItem): ScoutValidationResult {
    const errors: AppError[] = [];

    if (!item.id) {
        errors.push({ code: 'MISSING_ID', message: 'Opportunity must have an id.', module: 'social-scout' });
    }
    if (!VALID_PLATFORMS.includes(item.platform as typeof VALID_PLATFORMS[number])) {
        errors.push({ code: 'INVALID_PLATFORM', message: `Platform "${item.platform}" is not supported.`, module: 'social-scout' });
    }
    if (item.score < 0 || item.score > 100) {
        errors.push({ code: 'SCORE_OUT_OF_RANGE', message: 'Score must be between 0 and 100.', module: 'social-scout' });
    }
    if (!item.contentSnippet || item.contentSnippet.trim() === '') {
        errors.push({ code: 'EMPTY_CONTENT', message: 'Opportunity must have a content snippet.', module: 'social-scout' });
    }

    return { valid: errors.length === 0, errors };
}
