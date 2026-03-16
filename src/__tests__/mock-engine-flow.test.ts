/**
 * TEST-2 — Mock-Engine Campaign Flow Tests
 * Exercises the full lifecycle:
 * submitDiscoveryInterview → getOfferSuggestions → approveOffer →
 * createCampaign → sendToReview → approveAll → scheduleAll → publishNow
 * Also tests resetAll edge cases.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
    resetAll,
    submitDiscoveryInterview,
    getOfferSuggestions,
    approveOffer,
    createCampaign,
    sendToReview,
    approveAll,
    rejectAll,
    getReviewItems,
    scheduleAll,
    publishNow,
    getCalendar,
    getCurrentBrief,
    getCurrentPlan,
    getDashboard,
    getDashboardTrends,
} from '../mock-engine';

const INTERVIEW_DATA = {
    businessName: 'Flow Test Co',
    industry: 'saas' as const,
    targetCustomer: 'Startup founders',
    currentOfferings: ['Starter', 'Pro'],
    painPoints: ['Slow growth'],
    competitiveAdvantage: 'Simple onboarding',
};

function runDiscovery() {
    const interview = submitDiscoveryInterview(INTERVIEW_DATA);
    const hypotheses = getOfferSuggestions();
    const profile = approveOffer(0);
    return { interview, hypotheses, profile };
}

function runLaunch(profile: ReturnType<typeof approveOffer>) {
    return createCampaign({
        offerName: profile.hypothesis.name,
        audience: 'startup-founders',
        channels: ['meta', 'linkedin'],
        goals: ['awareness', 'leads'],
    });
}

beforeEach(() => {
    resetAll();
});

// ─── Discovery ────────────────────────────────────────────────────────────────

describe('submitDiscoveryInterview', () => {
    it('returns an interview with id prefix int_', () => {
        const iv = submitDiscoveryInterview(INTERVIEW_DATA);
        expect(iv.id).toMatch(/^int_/);
    });

    it('stores the business name', () => {
        const iv = submitDiscoveryInterview(INTERVIEW_DATA);
        expect(iv.data.businessName).toBe('Flow Test Co');
    });

    it('version starts at 1', () => {
        const iv = submitDiscoveryInterview(INTERVIEW_DATA);
        expect(iv.version).toBe(1);
    });
});

describe('getOfferSuggestions', () => {
    it('returns hypotheses after interview submitted', () => {
        submitDiscoveryInterview(INTERVIEW_DATA);
        const hyps = getOfferSuggestions();
        expect(Array.isArray(hyps)).toBe(true);
        expect(hyps.length).toBeGreaterThan(0);
    });

    it('each hypothesis has a hyp_ id prefix', () => {
        submitDiscoveryInterview(INTERVIEW_DATA);
        const hyps = getOfferSuggestions();
        hyps.forEach(h => expect(h.id).toMatch(/^hyp_/));
    });
});

describe('approveOffer', () => {
    it('returns a profile with state approved', () => {
        runDiscovery();
        const { profile } = runDiscovery();
        expect(profile.state).toBe('approved');
    });

    it('profile id has prof_ prefix', () => {
        const iv = submitDiscoveryInterview(INTERVIEW_DATA);
        getOfferSuggestions();
        const p = approveOffer(0);
        expect(p.id).toMatch(/^prof_/);
        expect(iv).toBeDefined();
    });
});

// ─── Launch ───────────────────────────────────────────────────────────────────

describe('createCampaign', () => {
    it('creates brief, plan, variants and scores', () => {
        const { profile } = runDiscovery();
        const campaign = runLaunch(profile);
        expect(campaign.brief.id).toMatch(/^brief_/);
        expect(campaign.plan.id).toMatch(/^plan_/);
        expect(campaign.variants.variants.length).toBeGreaterThan(0);
        expect(campaign.scores.length).toBeGreaterThan(0);
    });

    it('brief is stored in getCurrentBrief', () => {
        const { profile } = runDiscovery();
        runLaunch(profile);
        expect(getCurrentBrief()?.id).toMatch(/^brief_/);
    });

    it('plan is stored in getCurrentPlan', () => {
        const { profile } = runDiscovery();
        runLaunch(profile);
        expect(getCurrentPlan()?.id).toMatch(/^plan_/);
    });
});

// ─── Review ───────────────────────────────────────────────────────────────────

describe('sendToReview → approveAll', () => {
    it('batch has items', () => {
        const { profile } = runDiscovery();
        runLaunch(profile);
        const batch = sendToReview();
        expect(batch.id).toMatch(/^batch_/);
        expect(batch.items.length).toBeGreaterThan(0);
    });

    it('approveAll marks all items as approved', () => {
        const { profile } = runDiscovery();
        runLaunch(profile);
        sendToReview();
        approveAll();
        const items = getReviewItems().filter(i => i.kind !== 'reply');
        expect(items.every(i => i.state === 'approved')).toBe(true);
    });
});

describe('double approve is idempotent', () => {
    it('calling approveAll twice does not throw', () => {
        const { profile } = runDiscovery();
        runLaunch(profile);
        sendToReview();
        expect(() => { approveAll(); approveAll(); }).not.toThrow();
    });
});

describe('rejectAll', () => {
    it('marks all items as rejected after sendToReview', () => {
        const { profile } = runDiscovery();
        runLaunch(profile);
        sendToReview();
        rejectAll();
        const items = getReviewItems().filter(i => i.kind !== 'reply');
        expect(items.every(i => i.state === 'rejected')).toBe(true);
    });
});

// ─── Calendar ─────────────────────────────────────────────────────────────────

describe('scheduleAll → publishNow', () => {
    it('schedules entries for approved variants', () => {
        const { profile } = runDiscovery();
        runLaunch(profile);
        sendToReview();
        approveAll();
        const scheduled = scheduleAll();
        expect(scheduled.length).toBeGreaterThan(0);
        expect(scheduled[0].jobId).toMatch(/^job_/);
    });

    it('calendar has entries after scheduling', () => {
        const { profile } = runDiscovery();
        runLaunch(profile);
        sendToReview();
        approveAll();
        scheduleAll();
        expect(getCalendar().length).toBeGreaterThan(0);
    });

    it('publishNow dispatches all scheduled jobs', () => {
        const { profile } = runDiscovery();
        runLaunch(profile);
        sendToReview();
        approveAll();
        scheduleAll();
        const dispatched = publishNow();
        expect(dispatched.length).toBeGreaterThan(0);
        expect(dispatched.every(d => d.success)).toBe(true);
    });
});

// ─── Dashboard ────────────────────────────────────────────────────────────────

describe('getDashboard', () => {
    it('returns attribution, funnel, variants and learning', () => {
        const { profile } = runDiscovery();
        runLaunch(profile);
        sendToReview();
        approveAll();
        scheduleAll();
        publishNow();
        const dash = getDashboard();
        expect(dash.attribution).toBeDefined();
        expect(Array.isArray(dash.funnel)).toBe(true);
        expect(Array.isArray(dash.variants)).toBe(true);
        expect(dash.learning).toBeDefined();
    });

    it('attribution has spend and revenue', () => {
        const { profile } = runDiscovery();
        runLaunch(profile);
        sendToReview();
        approveAll();
        scheduleAll();
        publishNow();
        const { attribution } = getDashboard();
        expect(typeof attribution.totalSpend).toBe('number');
        expect(typeof attribution.totalRevenue).toBe('number');
    });
});

describe('getDashboardTrends', () => {
    it('returns 7 data points for each metric', () => {
        const trends = getDashboardTrends();
        expect(trends.cpl.length).toBe(7);
        expect(trends.roas.length).toBe(7);
        expect(trends.spend.length).toBe(7);
        expect(trends.revenue.length).toBe(7);
    });

    it('all values are positive numbers', () => {
        const trends = getDashboardTrends();
        [...trends.cpl, ...trends.roas, ...trends.spend, ...trends.revenue]
            .forEach(v => expect(v).toBeGreaterThan(0));
    });
});

// ─── resetAll edge cases ──────────────────────────────────────────────────────

describe('resetAll', () => {
    it('clears the current brief', () => {
        const { profile } = runDiscovery();
        runLaunch(profile);
        resetAll();
        expect(getCurrentBrief()).toBeNull();
    });

    it('clears the current plan', () => {
        const { profile } = runDiscovery();
        runLaunch(profile);
        resetAll();
        expect(getCurrentPlan()).toBeNull();
    });

    it('clears review items', () => {
        const { profile } = runDiscovery();
        runLaunch(profile);
        sendToReview();
        resetAll();
        expect(getReviewItems().length).toBe(0);
    });

    it('can be called when no campaign exists (no throw)', () => {
        expect(() => resetAll()).not.toThrow();
    });

    it('calendar is empty after reset', () => {
        const { profile } = runDiscovery();
        runLaunch(profile);
        sendToReview();
        approveAll();
        scheduleAll();
        resetAll();
        expect(getCalendar().length).toBe(0);
    });
});
