/**
 * Mock Engine — Translation layer between product UI and module code.
 * This is the ONLY file that imports module mock functions.
 * The UI only sees product-shaped data returned from here.
 */


import { resetIdCounter, EventLog } from '../modules/core/src/index';
import type {
    CampaignBrief, FunnelPlan, ChannelVariantSet, VariantScore,
    ReviewBatch, PublishCalendarEntry, PublishDispatchResult,
    CommentQueueItem, ReplyDraft, AttributionSnapshot, ConversionFunnelRow,
    VariantPerformanceRow, DiscoveryInterview, OfferHypothesis, MarketSignal,
    OfferProfile, ReviewDecision, EntityId,
} from '../modules/core/src/types';
import { validateCampaignBrief } from '../modules/core/src/validation';

import * as strategy from '../modules/strategy/src/mock';
import * as funnel from '../modules/funnel/src/mock';
import * as copylab from '../modules/copylab/src/mock';
import * as approvals from '../modules/approvals/src/mock';
import * as adapters from '../modules/adapters/src/mock';
import * as publishing from '../modules/publishing/src/mock';
import * as comments from '../modules/comments/src/mock';
import * as analytics from '../modules/analytics/src/mock';

// ─── Shared state ────────────────────────────────────────────────
const eventLog = new EventLog();
let currentBrief: CampaignBrief | null = null;
let currentPlan: FunnelPlan | null = null;
let currentVariants: ChannelVariantSet | null = null;
let currentScores: VariantScore[] = [];
let currentInterview: DiscoveryInterview | null = null;
let currentHypotheses: OfferHypothesis[] = [];
let currentSignals: MarketSignal[] = [];
let currentProfile: OfferProfile | null = null;
let currentCommentItems: CommentQueueItem[] = [];
let currentReplies: ReplyDraft[] = [];

// ─── Starter Presets ─────────────────────────────────────────────
export interface StarterPreset {
    id: string;
    icon: string;
    name: string;
    description: string;
    data: {
        businessName: string;
        industry: string;
        targetCustomer: string;
        currentOfferings: string[];
        painPoints: string[];
        competitiveAdvantage: string;
    };
}

export const STARTER_PRESETS: StarterPreset[] = [
    {
        id: 'design-agency',
        icon: '🎨',
        name: 'Design Agency',
        description: 'Brand identity and web design for small businesses',
        data: {
            businessName: 'Carta Creative Studio',
            industry: 'Design & Branding',
            targetCustomer: 'Small business owners who need a professional brand identity but don\'t know where to start',
            currentOfferings: ['Logo design', 'Brand identity packages', 'Website design', 'Social media templates'],
            painPoints: ['Looks unprofessional online', 'Losing clients to competitors with better branding', 'No consistent visual style across channels'],
            competitiveAdvantage: 'Fixed-price packages, fast 2-week turnaround, and a brand playbook every client keeps',
        },
    },
    {
        id: 'automation-company',
        icon: '⚙️',
        name: 'Automation Company',
        description: 'Business process automation for service businesses',
        data: {
            businessName: 'Streamline Ops',
            industry: 'Business Automation',
            targetCustomer: 'Service business owners spending 10+ hours a week on repetitive admin tasks',
            currentOfferings: ['Workflow automation audits', 'CRM setup and integration', 'Email and follow-up automation', 'Reporting dashboards'],
            painPoints: ['Too much time on manual data entry', 'Missed follow-ups losing deals', 'No visibility into what the team is doing'],
            competitiveAdvantage: 'Done-for-you implementation in 30 days with a money-back guarantee if time savings aren\'t measurable',
        },
    },
    {
        id: 'local-service',
        icon: '🔧',
        name: 'Local Service Business',
        description: 'Home services — plumbing, HVAC, or repairs — serving a local area',
        data: {
            businessName: 'NextDay Home Services',
            industry: 'Home Services',
            targetCustomer: 'Homeowners who need reliable repairs fast without being overcharged',
            currentOfferings: ['Emergency plumbing', 'HVAC maintenance and repair', 'Water heater installation', 'Drain cleaning'],
            painPoints: ['Can\'t find a trustworthy contractor', 'Waiting days for a callback', 'Unexpected charges at the end of the job'],
            competitiveAdvantage: 'Same-day service, upfront flat-rate pricing, and a 2-year parts-and-labour warranty',
        },
    },
];

let pendingPreset: StarterPreset | null = null;


// ─── Flow E: Business Discovery ──────────────────────────────────
export function submitDiscoveryInterview(input: {
    businessName: string;
    industry: string;
    targetCustomer: string;
    currentOfferings: string[];
    painPoints: string[];
    competitiveAdvantage: string;
}): DiscoveryInterview {
    currentInterview = strategy.captureInterview(input);
    eventLog.append('InterviewCaptured', currentInterview.id);
    return currentInterview;
}

export function getOfferSuggestions(): OfferHypothesis[] {
    if (!currentInterview) throw new Error('Complete the business discovery first.');
    currentHypotheses = strategy.generateOfferHypotheses(currentInterview, {
        maxHypotheses: 3,
        channels: ['meta', 'linkedin', 'x'],
    });
    currentSignals = strategy.collectMarketSignals({
        allowedDomains: ['industry-trends.com', 'market-insights.io'],
        maxRequests: 5,
        strategy: 'api-first',
    });
    currentHypotheses = strategy.rankHypotheses(currentHypotheses, currentSignals);
    eventLog.append('OfferHypothesesGenerated', currentInterview.id, { count: currentHypotheses.length });
    return currentHypotheses;
}

export function approveOffer(hypothesisIndex: number): OfferProfile {
    const hypothesis = currentHypotheses[hypothesisIndex];
    if (!hypothesis) throw new Error('Invalid offer selection.');
    currentProfile = strategy.buildOfferProfile(hypothesis, currentSignals);
    currentProfile.state = 'approved';
    eventLog.append('OfferProfileApproved', currentProfile.id);
    return currentProfile;
}

// ─── Flow A: Campaign Launch ─────────────────────────────────────
export function createCampaign(input: {
    offerName: string;
    audience: string;
    channels: ('meta' | 'linkedin' | 'x' | 'email')[];
    goals: string[];
}): { brief: CampaignBrief; plan: FunnelPlan; variants: ChannelVariantSet; scores: VariantScore[] } {
    const result = validateCampaignBrief(input);
    if (!result.valid || !result.normalized) {
        throw new Error(result.errors.map(e => e.message).join(', '));
    }

    currentBrief = result.normalized;
    eventLog.append('CampaignDrafted', currentBrief.id);

    currentPlan = funnel.createFunnelPlan(currentBrief);
    eventLog.append('FunnelPlanCreated', currentPlan.id);

    currentVariants = copylab.generateVariants(currentBrief, currentPlan);
    eventLog.append('VariantsGenerated', currentBrief.id, { count: currentVariants.variants.length });

    currentScores = copylab.scoreVariants(currentVariants);
    eventLog.append('VariantsScored', currentBrief.id);

    return {
        brief: currentBrief,
        plan: currentPlan,
        variants: currentVariants,
        scores: currentScores,
    };
}

export function sendToReview(): ReviewBatch {
    if (!currentVariants) throw new Error('Generate copy first.');
    const items = currentVariants.variants.map(v => ({
        id: v.id,
        label: `${v.channel} — ${v.stage} — ${v.headline.slice(0, 40)}...`,
        kind: 'asset' as const,
    }));
    const batch = approvals.createReviewBatch(items);
    eventLog.append('ReviewBatchCreated', batch.id, { items: batch.items.length });
    return batch;
}

// ─── Flow B: Review & Publish ────────────────────────────────────
export function approveItem(itemId: EntityId): void {
    const decision: ReviewDecision = {
        itemId,
        decision: 'approved',
        reviewerId: 'operator',
        timestamp: new Date().toISOString(),
    };
    approvals.decideReview(decision);
    eventLog.append('AssetApproved', itemId);
}

export function rejectItem(itemId: EntityId): void {
    const decision: ReviewDecision = {
        itemId,
        decision: 'rejected',
        reviewerId: 'operator',
        timestamp: new Date().toISOString(),
    };
    approvals.decideReview(decision);
    eventLog.append('AssetRejected', itemId);
}

export function approveAll(): void {
    const pending = approvals.getPendingItems();
    pending.forEach(item => approveItem(item.id));
}

export function getReviewItems() {
    return approvals.getAllItems();
}

export function scheduleAll(): PublishCalendarEntry[] {
    if (!currentVariants) return [];

    const now = new Date();
    return currentVariants.variants.map((v, i) => {
        const runAt = new Date(now.getTime() + (i + 1) * 3600_000).toISOString();
        const entry = publishing.scheduleAsset(v.id, `${v.channel} — ${v.stage}`, runAt, v.channel);
        eventLog.append('PublishScheduled', entry.jobId);
        return entry;
    });
}

export function publishNow(): PublishDispatchResult[] {
    const future = new Date(Date.now() + 86400_000 * 30).toISOString();
    const results = publishing.dispatchDue(future);
    results.forEach(r => eventLog.append('PublishDispatched', r.jobId));
    return results;
}

export function getCalendar() {
    return publishing.getCalendar();
}

// ─── Flow C: Comment Operations ──────────────────────────────────
export function pullComments(): CommentQueueItem[] {
    if (!currentBrief) throw new Error('Create a campaign first.');
    const raw = adapters.ingestComments('meta', currentBrief.id);
    eventLog.append('CommentsIngested', currentBrief.id, { count: raw.length });

    currentCommentItems = raw.map(e => {
        const item = comments.triageComment(e.comment);
        eventLog.append('CommentClassified', item.commentId, { intent: item.intent });
        return item;
    });

    const policy = comments.getDefaultReplyPolicy();
    currentReplies = currentCommentItems
        .map(item => comments.draftReply(item, policy))
        .filter((r): r is ReplyDraft => r !== null);

    currentReplies.forEach(r => eventLog.append('ReplyDrafted', r.id));

    return currentCommentItems;
}

export function getCommentReplies(): ReplyDraft[] {
    return currentReplies;
}

export function sendReplies(): void {
    currentReplies.forEach(reply => {
        approveItem(reply.id);
        eventLog.append('CommentReplied', reply.id);
    });
}

// ─── Flow D: Dashboard ──────────────────────────────────────────
export function getDashboard(): {
    attribution: AttributionSnapshot;
    funnel: ConversionFunnelRow[];
    variants: VariantPerformanceRow[];
} {
    const campId = currentBrief?.id || ('' as EntityId);
    const planId = currentPlan?.id || ('' as EntityId);
    const events = eventLog.all();

    return {
        attribution: analytics.projectAttribution(events, campId),
        funnel: analytics.projectFunnelConversion(events, planId),
        variants: analytics.projectVariantPerformance(events),
    };
}

// ─── State access ────────────────────────────────────────────────
export function getEventLog() {
    return eventLog.all();
}

export function getCurrentBrief() { return currentBrief; }
export function getCurrentPlan() { return currentPlan; }
export function getCurrentVariants() { return currentVariants; }
export function getCurrentScores() { return currentScores; }
export function getCurrentInterview() { return currentInterview; }
export function getCurrentHypotheses() { return currentHypotheses; }
export function getCurrentProfile() { return currentProfile; }

export function resetAll(): void {
    resetIdCounter();
    eventLog.clear();
    approvals.resetStore();
    publishing.resetCalendar();
    currentBrief = null;
    currentPlan = null;
    currentVariants = null;
    currentScores = [];
    currentInterview = null;
    currentHypotheses = [];
    currentSignals = [];
    currentProfile = null;
    currentCommentItems = [];
    currentReplies = [];
    pendingPreset = null;
}

// ─── Starter Preset API ─────────────────────────────────────────────
export function getStarterPresets(): StarterPreset[] {
    return STARTER_PRESETS;
}

/**
 * Loads a preset so discovery.ts can read it and pre-fill the form.
 * Does NOT submit the interview — the user still clicks "Complete Interview".
 */
export function loadStarterPreset(presetId: string): StarterPreset | null {
    const preset = STARTER_PRESETS.find(p => p.id === presetId) || null;
    pendingPreset = preset;
    return preset;
}

/** Returns the pending preset (if any) so discovery form can read it. */
export function getPendingPreset(): StarterPreset | null {
    return pendingPreset;
}

/** Clears the pending preset after the form has consumed it. */
export function clearPendingPreset(): void {
    pendingPreset = null;
}

