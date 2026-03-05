/**
 * CORE-A2 — validateCampaignBrief() Test Suite
 */

import { validateCampaignBrief } from '../validation';
import type { CampaignBriefInput } from '../types';

const VALID_INPUT: CampaignBriefInput = {
    offerName: 'Starter Pack',
    audience: 'Small business owners',
    channels: ['meta', 'email'],
    goals: ['generate leads', 'build brand awareness'],
};

describe('validateCampaignBrief()', () => {
    describe('valid input', () => {
        test('returns valid=true and normalized brief', () => {
            const result = validateCampaignBrief(VALID_INPUT);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.normalized).toBeDefined();
        });

        test('normalized brief has an ID and createdAt', () => {
            const result = validateCampaignBrief(VALID_INPUT);
            expect(result.normalized?.id).toMatch(/^brief_/);
            expect(result.normalized?.createdAt).toBeTruthy();
        });

        test('normalized brief trims whitespace from offerName and audience', () => {
            const result = validateCampaignBrief({
                ...VALID_INPUT,
                offerName: '  Trimmed Pack  ',
                audience: '  Whitespace Audience  ',
            });
            expect(result.normalized?.offerName).toBe('Trimmed Pack');
            expect(result.normalized?.audience).toBe('Whitespace Audience');
        });

        test('does not mutate caller input', () => {
            const input: CampaignBriefInput = { ...VALID_INPUT, channels: ['meta'] };
            validateCampaignBrief(input);
            expect(input.channels).toEqual(['meta']);
        });

        test('normalized channels is a copy, not the same reference', () => {
            const input: CampaignBriefInput = { ...VALID_INPUT, channels: ['meta'] };
            const result = validateCampaignBrief(input);
            expect(result.normalized?.channels).not.toBe(input.channels);
        });
    });

    describe('missing offerName', () => {
        test('returns BRIEF_INVALID_FIELDS error', () => {
            const result = validateCampaignBrief({ ...VALID_INPUT, offerName: '' });
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.code === 'BRIEF_INVALID_FIELDS')).toBe(true);
        });

        test('whitespace-only offerName is invalid', () => {
            const result = validateCampaignBrief({ ...VALID_INPUT, offerName: '   ' });
            expect(result.valid).toBe(false);
        });
    });

    describe('missing audience', () => {
        test('returns BRIEF_INVALID_FIELDS error', () => {
            const result = validateCampaignBrief({ ...VALID_INPUT, audience: '' });
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.code === 'BRIEF_INVALID_FIELDS')).toBe(true);
        });
    });

    describe('missing channels', () => {
        test('returns BRIEF_MISSING_CHANNEL error for empty array', () => {
            const result = validateCampaignBrief({ ...VALID_INPUT, channels: [] });
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.code === 'BRIEF_MISSING_CHANNEL')).toBe(true);
        });
    });

    describe('missing goals', () => {
        test('returns BRIEF_INVALID_FIELDS error for empty array', () => {
            const result = validateCampaignBrief({ ...VALID_INPUT, goals: [] });
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.code === 'BRIEF_INVALID_FIELDS')).toBe(true);
        });
    });

    describe('multiple errors', () => {
        test('returns all errors when multiple fields are invalid', () => {
            const result = validateCampaignBrief({
                offerName: '',
                audience: '',
                channels: [],
                goals: [],
            });
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThanOrEqual(3);
        });

        test('normalized is undefined on failure', () => {
            const result = validateCampaignBrief({ ...VALID_INPUT, offerName: '' });
            expect(result.normalized).toBeUndefined();
        });
    });

    describe('error shape', () => {
        test('errors include module=core', () => {
            const result = validateCampaignBrief({ ...VALID_INPUT, channels: [] });
            expect(result.errors[0].module).toBe('core');
        });
    });
});
