import type { CampaignBriefInput, ValidationResult, AppError, CampaignBrief } from './types';
import { newEntityId } from './id';

export function validateCampaignBrief(input: CampaignBriefInput): ValidationResult {
    const errors: AppError[] = [];

    if (!input.offerName || input.offerName.trim().length === 0) {
        errors.push({ code: 'BRIEF_INVALID_FIELDS', message: 'Offer name is required.', module: 'core' });
    }
    if (!input.audience || input.audience.trim().length === 0) {
        errors.push({ code: 'BRIEF_INVALID_FIELDS', message: 'Audience is required.', module: 'core' });
    }
    if (!input.channels || input.channels.length === 0) {
        errors.push({ code: 'BRIEF_MISSING_CHANNEL', message: 'At least one channel is required.', module: 'core' });
    }
    if (!input.goals || input.goals.length === 0) {
        errors.push({ code: 'BRIEF_INVALID_FIELDS', message: 'At least one goal is required.', module: 'core' });
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    const brief: CampaignBrief = {
        id: newEntityId('brief'),
        offerName: input.offerName.trim(),
        audience: input.audience.trim(),
        channels: [...input.channels],
        goals: [...input.goals],
        createdAt: new Date().toISOString(),
    };

    return { valid: true, errors: [], normalized: brief };
}
