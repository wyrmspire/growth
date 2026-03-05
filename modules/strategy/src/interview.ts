/**
 * STR-A1 — captureInterview()
 * Normalizes discovery interview input with versioned save format.
 * CONTRACT: modules/strategy/CONTRACT.md
 */

import type {
    DiscoveryInterviewInput,
    DiscoveryInterview,
    AppError,
} from '../../core/src/types';
import { newEntityId } from '../../core/src/id';

export interface InterviewCaptureResult {
    ok: boolean;
    interview?: DiscoveryInterview;
    error?: AppError;
}

/**
 * Normalize, validate, and version a discovery interview.
 * Interview records are immutable after save — updates create new versions.
 */
export function captureInterview(
    input: DiscoveryInterviewInput,
    previousVersion?: number,
): InterviewCaptureResult {
    const errors: string[] = [];

    if (!input.businessName || input.businessName.trim().length === 0) {
        errors.push('businessName is required');
    }
    if (!input.industry || input.industry.trim().length === 0) {
        errors.push('industry is required');
    }
    if (!input.targetCustomer || input.targetCustomer.trim().length === 0) {
        errors.push('targetCustomer is required');
    }
    if (!input.currentOfferings || input.currentOfferings.length === 0) {
        errors.push('at least one currentOffering is required');
    }
    if (!input.painPoints || input.painPoints.length === 0) {
        errors.push('at least one painPoint is required');
    }
    if (!input.competitiveAdvantage || input.competitiveAdvantage.trim().length === 0) {
        errors.push('competitiveAdvantage is required');
    }

    if (errors.length > 0) {
        return {
            ok: false,
            error: {
                code: 'DISCOVERY_INPUT_INVALID',
                message: errors.join('; '),
                module: 'strategy',
            },
        };
    }

    // Normalize: trim strings, dedupe arrays, preserve input immutability
    const normalized: DiscoveryInterviewInput = {
        businessName: input.businessName.trim(),
        industry: input.industry.trim(),
        targetCustomer: input.targetCustomer.trim(),
        currentOfferings: [...new Set(input.currentOfferings.map(s => s.trim()).filter(Boolean))],
        painPoints: [...new Set(input.painPoints.map(s => s.trim()).filter(Boolean))],
        competitiveAdvantage: input.competitiveAdvantage.trim(),
    };

    const interview: DiscoveryInterview = {
        id: newEntityId('int'),
        version: (previousVersion ?? 0) + 1,
        data: normalized,
        capturedAt: new Date().toISOString(),
    };

    return { ok: true, interview };
}
