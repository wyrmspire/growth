/**
 * STR-A1 — captureInterview() Tests
 * Tests against the result-object API: { ok, interview, error }
 */

import { describe, test, expect } from 'vitest';
import { captureInterview } from '../interview';
import type { DiscoveryInterviewInput } from '../../../core/src/types';

const VALID_INPUT: DiscoveryInterviewInput = {
    businessName: 'Acme Marketing',
    industry: 'SaaS',
    targetCustomer: 'Small business owners',
    currentOfferings: ['CRM tool', 'Email automation'],
    painPoints: ['No time to create content', 'Inconsistent leads'],
    competitiveAdvantage: 'Done-for-you approach with measurable ROI',
};

describe('captureInterview()', () => {
    describe('valid input', () => {
        test('returns ok=true with an interview record', () => {
            const result = captureInterview(VALID_INPUT);
            expect(result.ok).toBe(true);
            expect(result.interview).toBeDefined();
        });

        test('interview has a unique id with int_ prefix', () => {
            const result = captureInterview(VALID_INPUT);
            expect(result.interview?.id).toMatch(/^int_/);
        });

        test('interview starts at version 1 when no previous version', () => {
            const result = captureInterview(VALID_INPUT);
            expect(result.interview?.version).toBe(1);
        });

        test('increments version when previousVersion provided', () => {
            const result = captureInterview(VALID_INPUT, 3);
            expect(result.interview?.version).toBe(4);
        });

        test('capturedAt is a valid ISO timestamp', () => {
            const result = captureInterview(VALID_INPUT);
            const ts = result.interview?.capturedAt ?? '';
            expect(() => new Date(ts)).not.toThrow();
            expect(new Date(ts).toISOString()).toBe(ts);
        });

        test('does not mutate input', () => {
            const input = { ...VALID_INPUT, painPoints: ['Pain A'] };
            captureInterview(input);
            expect(input.painPoints).toEqual(['Pain A']);
        });

        test('trims whitespace from string fields', () => {
            const result = captureInterview({
                ...VALID_INPUT,
                businessName: '  Trimmed Corp  ',
                industry: '  Finance  ',
            });
            expect(result.interview?.data.businessName).toBe('Trimmed Corp');
            expect(result.interview?.data.industry).toBe('Finance');
        });

        test('deduplicates painPoints array', () => {
            const result = captureInterview({
                ...VALID_INPUT,
                painPoints: ['Pain A', 'Pain A', 'Pain B'],
            });
            expect(result.interview?.data.painPoints).toEqual(['Pain A', 'Pain B']);
        });

        test('deduplicates currentOfferings array', () => {
            const result = captureInterview({
                ...VALID_INPUT,
                currentOfferings: ['Tool A', 'Tool A'],
            });
            expect(result.interview?.data.currentOfferings).toHaveLength(1);
        });
    });

    describe('invalid input', () => {
        test('missing businessName returns DISCOVERY_INPUT_INVALID', () => {
            const result = captureInterview({ ...VALID_INPUT, businessName: '' });
            expect(result.ok).toBe(false);
            expect(result.error?.code).toBe('DISCOVERY_INPUT_INVALID');
        });

        test('missing industry returns error', () => {
            const result = captureInterview({ ...VALID_INPUT, industry: '' });
            expect(result.ok).toBe(false);
        });

        test('missing targetCustomer returns error', () => {
            const result = captureInterview({ ...VALID_INPUT, targetCustomer: '' });
            expect(result.ok).toBe(false);
        });

        test('empty currentOfferings array returns error', () => {
            const result = captureInterview({ ...VALID_INPUT, currentOfferings: [] });
            expect(result.ok).toBe(false);
        });

        test('empty painPoints array returns error', () => {
            const result = captureInterview({ ...VALID_INPUT, painPoints: [] });
            expect(result.ok).toBe(false);
        });

        test('missing competitiveAdvantage returns error', () => {
            const result = captureInterview({ ...VALID_INPUT, competitiveAdvantage: '' });
            expect(result.ok).toBe(false);
        });

        test('error module is strategy', () => {
            const result = captureInterview({ ...VALID_INPUT, businessName: '' });
            expect(result.error?.module).toBe('strategy');
        });
    });
});
