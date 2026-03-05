/**
 * BACK-1 — Integration: Brief → Copy → Approval → Schedule
 * Exercises the full campaign launch flow across module boundaries.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { validateCampaignBrief } from '@core/validation';
import { createFunnelPlan } from '@funnel/plan';
import { generateVariants } from '@copylab/generate';
import { createReviewBatch, _resetStore as resetQueueStore } from '@approvals/queue';
import { decideReview, resetStore as resetDecisionStore } from '@approvals/decision';
import { scheduleAsset, resetCalendar } from '@publishing/schedule';
import type { CampaignBriefInput, EntityId } from '@core/types';

// ─── Test data ────────────────────────────────────────────────────

const BRIEF_INPUT: CampaignBriefInput = {
    offerName: 'Growth Blueprint',
    audience: 'E-commerce store owners',
    channels: ['meta', 'email'],
    goals: ['generate leads'],
};

const FUTURE_DATE = '2030-01-15T12:00:00.000Z';

// ─── Setup ────────────────────────────────────────────────────────

beforeEach(() => {
    resetDecisionStore();
    resetQueueStore();
    resetCalendar();
});

// ─── Tests ────────────────────────────────────────────────────────

describe('Launch flow integration: brief → funnel → copy → approval → schedule', () => {
    test('full happy-path flow succeeds end-to-end', () => {
        // Step 1: Validate and normalize the campaign brief
        const briefResult = validateCampaignBrief(BRIEF_INPUT);
        expect(briefResult.valid).toBe(true);
        const brief = briefResult.normalized!;
        expect(brief.id).toMatch(/^brief_/);

        // Step 2: Build a funnel plan from the brief
        const planResult = createFunnelPlan(brief);
        expect(planResult.ok).toBe(true);
        const plan = planResult.plan!;
        expect(plan.stages).toHaveLength(3);

        // Step 3: Generate copy variants
        const variantSet = generateVariants(brief, plan);
        expect(variantSet.variants.length).toBeGreaterThan(0);

        // Step 4: Create a review batch for the first variant
        const variant = variantSet.variants[0];
        const batchResult = createReviewBatch([
            { id: variant.id, label: variant.headline, kind: 'asset' },
        ]);
        expect(batchResult.ok).toBe(true);

        // Step 5: Approve the variant (human review gate)
        const decisionResult = decideReview({
            itemId: variant.id,
            decision: 'approved',
            reviewerId: 'reviewer-1',
            timestamp: new Date().toISOString(),
        });
        expect(decisionResult.ok).toBe(true);
        expect(decisionResult.state).toBe('approved');

        // Step 6: Schedule the approved variant
        const scheduleResult = scheduleAsset(
            variant.id,
            FUTURE_DATE,
            variant.channel,
            variant.headline,
        );
        expect(scheduleResult.ok).toBe(true);
        expect(scheduleResult.entry?.state).toBe('scheduled');
        expect(scheduleResult.entry?.channel).toBe(variant.channel);
    });

    test('brief validation rejects empty channels before funnel creation', () => {
        const result = validateCampaignBrief({ ...BRIEF_INPUT, channels: [] });
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === 'BRIEF_MISSING_CHANNEL')).toBe(true);
    });

    test('scheduling fails for an unapproved asset', () => {
        const assetId = 'var_unapproved' as EntityId;
        const result = scheduleAsset(assetId, FUTURE_DATE, 'meta');
        expect(result.ok).toBe(false);
        expect(result.error?.code).toBe('APPROVAL_REQUIRED');
    });

    test('scheduling fails for an asset with invalid runAt timestamp', () => {
        // First create and approve a real variant so we can test the date guard
        const briefResult = validateCampaignBrief(BRIEF_INPUT);
        const plan = createFunnelPlan(briefResult.normalized!);
        const variantSet = generateVariants(briefResult.normalized!, plan.plan!);
        const variant = variantSet.variants[0];

        createReviewBatch([{ id: variant.id, label: variant.headline, kind: 'asset' }]);
        decideReview({
            itemId: variant.id,
            decision: 'approved',
            reviewerId: 'reviewer-1',
            timestamp: new Date().toISOString(),
        });

        const result = scheduleAsset(variant.id, 'not-a-date', 'meta');
        expect(result.ok).toBe(false);
        expect(result.error?.code).toBe('SCHEDULE_TIME_INVALID');
    });

    test('rejected variant cannot be scheduled', () => {
        const briefResult = validateCampaignBrief(BRIEF_INPUT);
        const plan = createFunnelPlan(briefResult.normalized!);
        const variantSet = generateVariants(briefResult.normalized!, plan.plan!);
        const variant = variantSet.variants[0];

        createReviewBatch([{ id: variant.id, label: variant.headline, kind: 'asset' }]);
        decideReview({
            itemId: variant.id,
            decision: 'rejected',
            reviewerId: 'reviewer-1',
            timestamp: new Date().toISOString(),
        });

        const result = scheduleAsset(variant.id, FUTURE_DATE, 'meta');
        expect(result.ok).toBe(false);
        expect(result.error?.code).toBe('APPROVAL_REQUIRED');
    });

    test('all 3 funnel stages produce variants with correct stage names', () => {
        const briefResult = validateCampaignBrief(BRIEF_INPUT);
        const plan = createFunnelPlan(briefResult.normalized!);
        const variantSet = generateVariants(briefResult.normalized!, plan.plan!);

        const stageNames = [...new Set(variantSet.variants.map(v => v.stage))].sort();
        expect(stageNames).toEqual(['awareness', 'consideration', 'decision']);
    });
});
